import { handleError } from '@/utils/error-handler'

const ACCESS_TOKEN_KEY = 'sitra-crm-access-token'
const PERV_ACCESS_TOKEN_KEY = 'perv-access-token'
export const hasAccessToken = () => {
  return !!localStorage.getItem(ACCESS_TOKEN_KEY)
}
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}
export const getPervAccessToken = () => {
  return localStorage.getItem(PERV_ACCESS_TOKEN_KEY)
}
export const removeAccessTokens = () => {
  return localStorage.removeItem(ACCESS_TOKEN_KEY)
}
export const setImpersonateAccessToken = (token) => {
  localStorage.setItem(PERV_ACCESS_TOKEN_KEY, getAccessToken())
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}
export const logoutImpersonateUser = () => {
  localStorage.setItem(ACCESS_TOKEN_KEY, getPervAccessToken())
  localStorage.removeItem(PERV_ACCESS_TOKEN_KEY)
}
export const logout = () => {
  const persistKeys = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (key && key.startsWith('crm-persist-')) {
      persistKeys.push({ key, value: localStorage.getItem(key) })
    }
  }
  sessionStorage.clear()
  localStorage.clear()
  persistKeys.forEach(({ key, value }) => {
    localStorage.setItem(key, value)
  })
}

export const handleSuccessLogin = (token) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

const FORBIDDEN_MESSAGE_KEY = 'auth:403-message'

export const handleAccessDenied = (e) => {
  if (!hasAccessToken()) return
  handleError(e)
  // Prevent redirect loop when the 403 page's own requests are denied
  if (window.location.pathname === '/403') return
  const backendMessage = e?.response?.data?.message
  if (backendMessage) sessionStorage.setItem(FORBIDDEN_MESSAGE_KEY, backendMessage)
  window.location.href = `${window.location.origin}/403`
}

export const handleUnauthorizedAccess = (e) => {
  // Don't handle 401 if already logged out or on login page
  if (!hasAccessToken() || window.location.pathname === '/login') return

  logout()
  handleError(e)
  window.location.href = `${window.location.origin}/login`
}
