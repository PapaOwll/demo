interface ApiErrorLike {
  data?: {
    data?: { message?: string; error?: string }
    message?: string
  }
  response?: {
    data?:
      | string
      | {
          message?: string
          error?: string
          data?: { message?: string }
        }
  }
  message?: string
}

const GENERIC_400_MESSAGE = 'Request failed with status code 400'

export const getApiErrorMessage = (error: unknown, fallback = 'خطایی رخ داد'): string => {
  const apiError = error as ApiErrorLike | null | undefined
  if (!apiError) return fallback

  if (apiError.data?.data?.message) return apiError.data.data.message
  if (apiError.data?.data?.error) return apiError.data.data.error

  const responseData = apiError.response?.data
  if (responseData && typeof responseData !== 'string') {
    if (responseData.message) return responseData.message
    if (responseData.data?.message) return responseData.data.message
  }

  if (apiError.data?.message) return apiError.data.message

  if (responseData) {
    if (typeof responseData === 'string') return responseData
    if (responseData.error) return responseData.error
  }

  if (apiError.message && apiError.message !== GENERIC_400_MESSAGE) return apiError.message

  return fallback
}
