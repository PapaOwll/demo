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

export const handleAccessDenied = (e) => {
  if (!hasAccessToken()) return
  handleError(e)
  window.location.href = `${window.location.origin}/tasks`
}

export const handleUnauthorizedAccess = (e) => {
  // Don't handle 401 if already logged out or on login page
  if (!hasAccessToken() || window.location.pathname === '/login') return

  logout()
  handleError(e)
  window.location.href = `${window.location.origin}/login`
}
