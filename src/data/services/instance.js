import axios from 'axios'
import { convertToEnNumber } from '@/utils/convert-check-digits'
import { camelize, snakize } from '@/utils/convert-to-camel-snake'
import { getAccessToken, handleUnauthorizedAccess, handleAccessDenied } from '@/utils/auth'
import { calculateResponseSize } from '@/composables/use-api-monitor'
import { mockAdapter } from '@/mock/adapter'

const addUnauthorizeInterceptor = (instance) => {
  instance.interceptors.response.use(
    (res) => res,
    (e) => {
      if (e.response) {
        const { status } = e.response

        // Skip error handling if skipGlobalErrorHandling is set
        if (e.config?.skipGlobalErrorHandling) {
          return Promise.reject(e)
        }

        if (status === 403) {
          handleAccessDenied(e)
        } else if (status === 401) {
          handleUnauthorizedAccess(e)
        }
      }
      return Promise.reject(e)
    }
  )
}
const addResponseInterceptor = (instance) => {
  instance.interceptors.response.use(
    (res) => {
      if (res.request?.responseType === 'blob') {
        return res
      }
      if (typeof res?.data === 'number' || typeof res?.data === 'boolean') return { data: res.data }
      if (res && res.data) return res.data
      return res
    },
    (e) => {
      return Promise.reject(e)
    }
  )
}

const addConvertMobileDigitInterceptor = (instance) => {
  instance.interceptors.request.use(
    (req) => {
      if (['post', 'put'].includes(req.method) && !!req.data?.mobile) {
        req.data.mobile = Number(convertToEnNumber(req.data.mobile))
      }

      return req
    },
    (e) => {
      return Promise.reject(e)
    }
  )
}

const addCamelizeInterceptor = (instance) => {
  instance.interceptors.response.use(
    (res) => {
      if (res.request?.responseType === 'blob') {
        return res
      }
      return camelize(res)
    },
    (e) => {
      // TODO: camelize form error
      return Promise.reject(e)
    }
  )
}

const addSnakizeInterceptor = (instance) => {
  instance.interceptors.request.use(
    (config) => {
      return {
        ...config,
        params: config.hadSnakize ? snakize(config.params || {}) : config.params,
        data: config.data ? (config.hadSnakize ? snakize(config.data) : config.data) : undefined,
      }
    },
    (e) => {
      return Promise.reject(e)
    }
  )
}

const addAuthTokenInterceptor = (instance) => {
  instance.interceptors.request.use(
    (config) => {
      const accessToken = getAccessToken()
      return {
        ...config,
        headers: {
          ...config?.headers,
          Authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
      }
    },
    null,
    { synchronous: true }
  )
}

const getEndpointFromConfig = (config) => {
  if (!config) return 'unknown'
  const url = config.url || ''
  if (url.startsWith('http')) {
    try {
      return new URL(url).pathname
    } catch {
      return url
    }
  }
  return url.startsWith('/') ? url : `/${url}`
}

const API_MONITOR_KEY = 'api-monitor-calls'
const API_MONITOR_ENABLED_KEY = 'api-monitor-enabled'
const API_MONITOR_MAX_CALLS = 500 // Limit to prevent localStorage overflow

export const apiMonitor = {
  getCalls: () => {
    try {
      return JSON.parse(localStorage.getItem(API_MONITOR_KEY) || '[]')
    } catch {
      return []
    }
  },
  isMonitoring: () => {
    return localStorage.getItem(API_MONITOR_ENABLED_KEY) === 'true'
  },
  startMonitoring: () => {
    localStorage.setItem(API_MONITOR_ENABLED_KEY, 'true')
    localStorage.setItem(API_MONITOR_KEY, '[]')
  },
  stopMonitoring: () => {
    localStorage.setItem(API_MONITOR_ENABLED_KEY, 'false')
  },
  clearCalls: () => {
    localStorage.setItem(API_MONITOR_KEY, '[]')
  },
  addCall: (callData) => {
    try {
      const calls = apiMonitor.getCalls()

      // Prevent localStorage overflow
      if (calls.length >= API_MONITOR_MAX_CALLS) {
        return
      }

      const existingIndex = calls.findIndex(
        (call) => call.endpoint === callData.endpoint && call.method === callData.method
      )

      if (existingIndex === -1) {
        calls.push({
          ...callData,
          id: Date.now(),
          callCount: 1,
        })
      } else {
        calls[existingIndex] = {
          ...calls[existingIndex],
          size: callData.size,
          duration: callData.duration,
          status: callData.status,
          callCount: (calls[existingIndex].callCount || 1) + 1,
        }
      }

      localStorage.setItem(API_MONITOR_KEY, JSON.stringify(calls))
    } catch {
      // Silently ignore errors (e.g., localStorage full)
    }
  },
}

const addApiMonitorInterceptor = (instance) => {
  instance.interceptors.request.use(
    (config) => ({
      ...config,
      metadata: { startTime: Date.now() },
    }),
    (e) => Promise.reject(e)
  )

  instance.interceptors.response.use(
    (response) => {
      // Wrap in try-catch to prevent breaking API calls
      try {
        if (apiMonitor.isMonitoring() && response?.config) {
          const duration = Date.now() - (response.config.metadata?.startTime || Date.now())
          const size = calculateResponseSize(response)
          const endpoint = getEndpointFromConfig(response.config)

          apiMonitor.addCall({
            endpoint,
            method: response.config.method?.toUpperCase() || 'GET',
            status: response.status,
            size,
            duration,
            success: true,
          })
        }
      } catch {
        // Silently ignore monitoring errors - don't break the app
      }

      return response
    },
    (error) => {
      try {
        if (apiMonitor.isMonitoring() && error.config) {
          const duration = Date.now() - (error.config.metadata?.startTime || Date.now())
          const size = calculateResponseSize(error.response)
          const endpoint = getEndpointFromConfig(error.config)

          apiMonitor.addCall({
            endpoint,
            method: error.config.method?.toUpperCase() || 'GET',
            status: error.response?.status || 0,
            size,
            duration,
            success: false,
            error: error.message,
          })
        }
      } catch {
        // Silently ignore monitoring errors
      }

      return Promise.reject(error)
    }
  )
}

const createPureInstance = (baseUrl, { headers, ...configs } = {}) => {
  return axios.create({
    timeout: 15_000,
    baseURL: baseUrl,
    headers: {
      ...headers,
    },
    ...configs,
    adapter: mockAdapter,
  })
}

const createInstance = (baseUrl, configs = {}) => {
  const instance = createPureInstance(baseUrl, configs)
  addApiMonitorInterceptor(instance)
  addAuthTokenInterceptor(instance)
  addResponseInterceptor(instance)
  addCamelizeInterceptor(instance)
  addSnakizeInterceptor(instance)
  addConvertMobileDigitInterceptor(instance)
  addUnauthorizeInterceptor(instance)
  return instance
}

export { createInstance }
