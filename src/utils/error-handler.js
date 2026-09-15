import { captureApiError, normalizeApiError } from './api-error'
import { captureException, withScope } from '@sentry/vue'
import { Notif } from '../data/services/notification-service'
import { setGlitchtipUserContext } from './glitchtip-context'

const IGNORED_STATUS_CODES = new Set([400, 401, 403, 404, 405, 406, 422])

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

/**
 * @param {Object} error
 */

export function humanizeError(error) {
  let currentError
  if (error?.response || error?.request) {
    currentError = normalizeApiError(error)
  } else if (error instanceof Error) {
    currentError = error
    currentError.errorType = 'logic'
  } else {
    currentError = new Error('something unexpected', { cause: error })
    currentError.errorType = 'unknown'
  }

  if (!currentError.statusCode) {
    currentError.statusCode = 500
  }
  return currentError
}

/**
 * @param {Object} e error
 */
export function captureError(error_) {
  console.warn('%c Capture Error::', 'color:#FF5C39;font-weight:900', error_)

  if (error_.isExpectedError) {
    console.warn('Expected error:', {
      status: error_.statusCode,
      url: error_.url,
      message: error_.message,
    })
    return
  }

  if (error_.errorType === 'api') {
    if (IGNORED_STATUS_CODES.has(error_.statusCode)) return
    captureApiError(error_)
    return
  }

  withScope((scope) => {
    scope.setTag('error-type', error_.errorType)
    scope.setTag('error-message', error_.message)

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

    if (error_.stack) {
      scope.setContext('error_stack', {
        stack: error_.stack,
        stack_lines: error_.stack.split('\n').slice(0, 10),
      })
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

/**
 * @param {Object} e error
 */
export function humanizeAndCaptureError(error_) {
  const error = humanizeError(error_)

  // Only capture to GlitchTip if it's not an expected error
  if (!error.isExpectedError) {
    captureError(error)
  }

  return error
}

export function handleApiError(error_) {
  const normalizedError = error_?.statusCode || error_?.response?.status
  if (normalizedError === 408 || normalizedError === 599 || error_?.message?.includes('timeout')) {
    Notif.warning(
      'اتصال به سرور برقرار نشد. لطفا اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.'
    )
    return
  }

  if (normalizedError === 413) {
    Notif.error('حجم فایل بیش از حد مجاز است. لطفاً فایل کوچک‌تری انتخاب کنید.')
    return
  }

  const dataErrors = error_?.response?.data?.data

  const hasDataErrors =
    dataErrors &&
    Object.keys(dataErrors).length > 0 &&
    Object.values(dataErrors).some((errorArray) => errorArray && errorArray.length > 0)

  if (hasDataErrors) {
    Object.values(dataErrors).map((error) => {
      Notif.error(error[0])
      return error
    })
  } else if (error_?.response?.data?.message) {
    Notif.error(error_.response.data.message)
  } else {
    Notif.error('خطای سرور')
  }
}

export function handleUnknownError(error, options) {
  const { glitchtipLog, showToast } = { glitchtipLog: true, showToast: true, ...options }
  if (showToast) {
    Notif.error('مشکلی در انجام عملیات رخ داد. لطفا دوباره امتحان کنید.')
  }
  if (glitchtipLog) {
    const humanizedError = humanizeError(error)
    // Only capture to GlitchTip if it's not an expected error
    if (!humanizedError.isExpectedError) {
      captureError(humanizedError)
    }
  }
}

export function handleError(error, options) {
  try {
    const { glitchtipLog, showToast } = { glitchtipLog: true, showToast: true, ...options }
    const currentError = humanizeError(error)
    if (currentError.errorType === 'logic') {
      Notif.error(currentError.message)
    }
    if (showToast && currentError.errorType === 'api') {
      handleApiError(error)
    }
    // Only capture to GlitchTip if it's not an expected error AND glitchtipLog is true
    if (glitchtipLog && !currentError.isExpectedError) {
      captureError(currentError)
    }
  } catch (currentError) {
    handleUnknownError(currentError, options)
  }
}
