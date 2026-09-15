/**
 * Converts API errors into user-friendly Persian error messages
 *
 * This utility function processes error objects from Axios or API calls and
 * returns localized Persian error messages suitable for display in the UI.
 * It handles timeout errors, network issues, and various HTTP status codes.
 *
 * @param {Object} err - The error object from Axios or API calls
 * @param {string} [err.code] - Error code (e.g., 'ECONNABORTED' for timeouts)
 * @param {string} [err.message] - Error message text
 * @param {Object} [err.response] - Axios response object
 * @param {number} [err.response.status] - HTTP status code
 * @param {Object} [err.response.data] - Response data payload
 * @param {string} [err.response.data.message] - Server error message
 * @returns {string} User-friendly Persian error message
 *
 * @example
 * // Usage in Vue component template
 * <Typography>{{ getErrorMessage(error) }}</Typography>
 *
 * @example
 * // Usage with Axios error
 * try {
 *   await apiCall()
 * } catch (error) {
 *   const message = getErrorMessage(error)
 *   // Returns: 'اتصال اینترنت خود را بررسی کنید.'
 * }
 */
export const getErrorMessage = (err) => {
  if (!err) return 'خطای نامشخص رخ داده است'

  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return 'زمان درخواست به پایان رسید. لطفا دوباره تلاش کنید.'
  }

  if (err.message === 'Network Error' || !navigator.onLine) {
    return 'اتصال اینترنت خود را بررسی کنید.'
  }

  if (err.response) {
    switch (err.response.status) {
      case 401: {
        return 'دسترسی شما منقضی شده است. لطفا دوباره وارد شوید.'
      }
      case 403: {
        return 'شما دسترسی لازم برای مشاهده این بخش را ندارید.'
      }
      case 404: {
        return 'اطلاعات مورد نظر یافت نشد.'
      }
      case 500:
      case 502:
      case 503: {
        return 'خطایی در سرور رخ داده است. لطفا بعدا تلاش کنید.'
      }
      default: {
        return err.response.data?.message || 'خطایی در دریافت اطلاعات رخ داده است.'
      }
    }
  }

  return err.message || 'خطایی در دریافت اطلاعات رخ کرده است.'
}
