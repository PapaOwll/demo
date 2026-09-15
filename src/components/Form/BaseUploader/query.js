import { request } from '@/data/services/index'
import { useMutation } from '@tanstack/vue-query'
import { handleError } from '@/utils/error-handler'

export const apiUploadFile = (formData, extraParams = {}) => {
  const { urlParams, ...bodyParams } = extraParams

  Object.entries(bodyParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value)
    }
  })

  let url = 'v1/file/upload'
  if (urlParams && Object.keys(urlParams).length > 0) {
    const queryString = new URLSearchParams(urlParams).toString()
    url = `${url}?${queryString}`
  }

  return request.post(url, formData, { timeout: 300_000 })
}
export const useFileUploadMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ formData, extraParams }) => apiUploadFile(formData, extraParams),
    onError: (err) => handleError(err),
    ...options,
  })
