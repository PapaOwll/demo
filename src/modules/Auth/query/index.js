import { useMutation } from '@tanstack/vue-query'
import { apiCheckOtp, apiLogin, apiRetryOtp, apiSendOtp } from '../api'
import { handleError } from '@/utils/error-handler'

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: apiLogin,
    onError: (e) =>
      handleError(e || 'خطا در ورود به سیستم', {
        showToast: true,
        glitchtipLog: false,
      }),
  })
}

export const useSendOtpMutation = () => {
  return useMutation({
    mutationFn: apiSendOtp,
    onError: (e) => handleError(e, { showToast: true, glitchtipLog: false }),
  })
}

export const useCheckOtpMutation = () => {
  return useMutation({
    mutationFn: apiCheckOtp,
  })
}

export const useRetrySendOtpMutation = () => {
  return useMutation({
    mutationFn: apiRetryOtp,
    onError: (e) => handleError(e, { showToast: true, glitchtipLog: false }),
  })
}
