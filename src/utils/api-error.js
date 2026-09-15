/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable prefer-template */
import { withScope, captureException } from '@sentry/vue'
import { setGlitchtipUserContext } from './glitchtip-context'

// Lazy import router to avoid circular dependency
let routerInstance = null
function getRouter() {
  if (!routerInstance) {
    import('@/router').then((module) => {
      routerInstance = module.default
    })
  }
  return routerInstance
}

class ApiError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * normalize axios error
 * @param error_
 */
export function normalizeApiError(error_) {
  if (!error_?.response && !error_?.request) {
    return error_
  }

  const isTimeoutError =
    error_?.code === 'ECONNABORTED' ||
    error_?.message?.includes('timeout') ||
    error_?.isTimeoutError

  const error = error_.response
    ? new ApiError('Response error: ' + error_?.response?.statusText)
    : new ApiError('Network error: ' + error_?.message)

  /*
    408 Request Timeout: HTTP response status code 408 Request Timeout is a client error that is returned by the server to indicate that a request is coming in too slowly from a client and it is unwilling to wait for it to be completed, thus terminating the connection.
    599 Network Connect Timeout Error: HTTP response status code 599 Network Connect Timeout Error is an unofficial HTTP status code used by some proxies to indicate that there has been a HTTP Connection timeout behind the proxy to a HTTP client in front of the proxy.
    source: https://http.dev/status
  */

  error.statusCode =
    !error_.response && isTimeoutError
      ? 408
      : !error_.response && !error.isTimeoutError
        ? 599
        : error_?.response?.status || 500

  error.errorType = 'api'

  // Mark timeout and network errors as expected (not critical bugs)
  error.isExpectedError = error.statusCode === 408 || error.statusCode === 599 || isTimeoutError

  // Safely construct URL - avoid concatenating undefined values
  const baseURL = error_?.config?.baseURL || ''
  const url = error_?.config?.url || ''
  error.url = baseURL && url ? baseURL + url : baseURL || url || null

  error.headers = error_?.config?.headers

  error.data = error_?.config?.data

  error.timeout = error_?.config?.timeout

  if (error.url && typeof error.url === 'string') {
    try {
      const parsedUrl = new URL(error.url)

      error.hostname = parsedUrl.hostname

      error.pathname = parsedUrl.pathname

      error.search = parsedUrl.search
    } catch {
      // If URL parsing fails, set fallback values
      error.hostname = null
      error.pathname = url || null
      error.search = null
    }
  }

  return error
}

export function captureApiError(error_) {
  if (error_.isExpectedError || error_.statusCode === 408 || error_.statusCode === 599) {
    console.warn('Network timeout/error (not sent to GlitchTip):', {
      status: error_.statusCode,
      url: error_.url,
      message: error_.message,
    })
    return
  }

  withScope((scope) => {
    scope.setTag('error-type', error_.errorType)
    scope.setTag('error-status', error_.statusCode || 500)
    scope.setTag('error-url', error_.url)
    scope.setTag('api-endpoint', error_.pathname || 'unknown')
    scope.setTag('http-method', error_?.config?.method?.toUpperCase() || 'unknown')
    scope.setLevel('warning')

    scope.setContext('api_error', {
      url: error_.url,
      pathname: error_.pathname,
      hostname: error_.hostname,
      status_code: error_.statusCode,
      status_text: error_.message,
      method: error_?.config?.method,
      timeout: error_.timeout,
      search_params: error_.search,
    })

    if (error_.data) {
      try {
        const requestData = typeof error_.data === 'string' ? JSON.parse(error_.data) : error_.data
        scope.setContext('api_request', {
          data: requestData,
          data_type: typeof error_.data,
        })
      } catch {
        scope.setContext('api_request', {
          data: 'Failed to parse request data',
          raw: String(error_.data).slice(0, 500),
        })
      }
    }

    if (error_?.response?.data) {
      scope.setContext('api_response', {
        data: error_.response.data,
        headers: error_.response.headers,
      })
    }

    const router = getRouter()
    const currentRoute = router?.currentRoute?.value
    if (currentRoute) {
      scope.setContext('route_context', {
        path: currentRoute.path,
        name: currentRoute.name,
        params: currentRoute.params,
        query: currentRoute.query,
        fullPath: currentRoute.fullPath,
      })
      scope.setTag('route_name', currentRoute.name || 'unknown')
      scope.setTag('route_path', currentRoute.path)
    }

    if (error_.headers) {
      const safeHeaders = { ...error_.headers }
      delete safeHeaders.Authorization
      delete safeHeaders.authorization
      delete safeHeaders['X-API-Key']
      scope.setContext('request_headers', safeHeaders)
    }

    import('@/store/user')
      .then(({ useUserStore }) => {
        try {
          const userStore = useUserStore()
          const userData = userStore?.userData
          if (userData) {
            setGlitchtipUserContext(userData)
          }
        } catch (storeError) {
          scope.setContext('store_error', {
            message: 'Failed to get user context from store',
            error: String(storeError),
          })
        }
      })
      .catch((importError) => {
        scope.setContext('import_error', {
          message: 'Failed to import user store',
          error: String(importError),
        })
      })
      .finally(() => {
        captureException(error_)
      })
  })
}
