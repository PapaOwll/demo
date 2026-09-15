import { request } from '@/data/services'
import { snakize } from '@/utils/convert-to-camel-snake'

export const apiSendOtp = (data, config = {}) =>
  request.post('v1/client/send-otp', snakize(data), config)

export const apiLogin = (data, config = {}) =>
  request.post('v1/client/login', snakize(data), config)

export const apiCheckOtp = (data, config = {}) =>
  request.post('v1/client/check-otp', snakize(data), {
    ...config,
    skipGlobalErrorHandling: true,
  })

export const apiResetPassword = (data, config = {}) =>
  request.post('v1/client/reset-password', snakize(data), {
    ...config,
    skipGlobalErrorHandling: true,
  })

export const apiRetryOtp = (data, config = {}) =>
  request.post('v1/client/retry', snakize(data), config)
