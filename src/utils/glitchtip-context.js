/* global __APP_VERSION__ */
// GlitchTip is Sentry-protocol compatible, so the official @sentry/vue SDK is used as the client.
import { setUser, setContext, setTag, addBreadcrumb } from '@sentry/vue'

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
 * Set comprehensive user context in GlitchTip
 * @param {Object} userData - User data from store
 */
export function setGlitchtipUserContext(userData) {
  if (!userData?.user) {
    setUser(null)
    return
  }

  const { user } = userData
  const { role } = userData

  // Set user identity
  setUser({
    id: user.id,
    username: `${user.firstName || ''} ${user.name || ''}`.trim(),
    email: user.email || undefined,
    phone: user.mobile || undefined,
  })

  // Set user context with additional details
  setContext('user_details', {
    user_id: user.id,
    first_name: user.firstName,
    last_name: user.name,
    full_name: `${user.firstName || ''} ${user.name || ''}`.trim(),
    email: user.email,
    mobile: user.mobile,
    national_code: user.nationalCode,
    gender: user.gender,
    birth_date: user.birthDate,
    province: user.province,
    city: user.city,
    address: user.address,
    created_at: user.createdAt,
  })

  // Set role context
  if (role) {
    setContext('user_role', {
      role_id: role.id,
      role_name: role.name,
      role_display_name: role.displayName,
      modules: role.modules,
      permissions: role.permissions,
    })

    setTag('user_role', role.name)
    setTag('role_display_name', role.displayName)
  }

  // Set clinic context if available
  if (userData.clinic) {
    setContext('clinic', {
      clinic_id: userData.clinic.id,
      clinic_name: userData.clinic.name,
      clinic_type: userData.clinic.type,
    })

    setTag('clinic_id', userData.clinic.id)
    setTag('clinic_name', userData.clinic.name)
  }

  // Set branch context if available
  if (user.branch) {
    setContext('branch', {
      branch_id: user.branch.id,
      branch_name: user.branch.name,
    })

    setTag('branch_id', user.branch.id)
  }

  addBreadcrumb({
    category: 'user',
    message: `User context set for ${user.firstName} ${user.name}`,
    level: 'info',
  })
}

/**
 * Set route context in GlitchTip
 * @param {Object} route - Vue Router route object
 */
export function setGlitchtipRouteContext(route) {
  if (!route) return

  setContext('route', {
    path: route.path,
    name: route.name,
    params: route.params,
    query: route.query,
    meta: route.meta,
    fullPath: route.fullPath,
  })

  setTag('route_name', route.name || 'unknown')
  setTag('route_path', route.path)

  const router = getRouter()
  addBreadcrumb({
    category: 'navigation',
    message: `Navigated to ${route.name || route.path}`,
    level: 'info',
    data: {
      from: router?.currentRoute?.value?.path,
      to: route.path,
    },
  })
}

/**
 * Set device and browser context
 */
export function setGlitchtipDeviceContext() {
  const screenWidth = window.screen.width
  const screenHeight = window.screen.height
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  setContext('device', {
    screen_width: screenWidth,
    screen_height: screenHeight,
    viewport_width: viewportWidth,
    viewport_height: viewportHeight,
    pixel_ratio: window.devicePixelRatio,
    orientation: screenWidth > screenHeight ? 'landscape' : 'portrait',
    touch_support: 'ontouchstart' in window,
    user_agent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages,
    online: navigator.onLine,
    platform: navigator.platform,
  })

  setTag('device_type', screenWidth < 768 ? 'mobile' : screenWidth < 1024 ? 'tablet' : 'desktop')
  setTag('browser_language', navigator.language)
  setTag('online_status', navigator.onLine ? 'online' : 'offline')
}

/**
 * Set application state context
 * @param {Object} appState - Application state data
 */
export function setGlitchtipAppContext(appState = {}) {
  setContext('application', {
    app_version: __APP_VERSION__,
    environment: import.meta.env.VITE_NODE_ENV,
    base_url: import.meta.env.VITE_BASE_URL,
    build_time: import.meta.env.VITE_BUILD_TIME || 'unknown',
    ...appState,
  })

  setTag('app_version', __APP_VERSION__)
}

/**
 * Add a custom breadcrumb for user actions
 * @param {string} action - Action name
 * @param {Object} data - Additional data
 */
export function addUserActionBreadcrumb(action, data = {}) {
  addBreadcrumb({
    category: 'user_action',
    message: action,
    level: 'info',
    data: {
      timestamp: new Date().toISOString(),
      ...data,
    },
  })
}

/**
 * Add a custom breadcrumb for API calls
 * @param {string} method - HTTP method
 * @param {string} url - API endpoint
 * @param {Object} data - Request/Response data
 */
export function addApiCallBreadcrumb(method, url, data = {}) {
  addBreadcrumb({
    category: 'api',
    message: `${method} ${url}`,
    level: 'info',
    data: {
      method,
      url,
      timestamp: new Date().toISOString(),
      ...data,
    },
  })
}

/**
 * Clear all GlitchTip context (on logout)
 */
export function clearGlitchtipContext() {
  setUser(null)
  addBreadcrumb({
    category: 'auth',
    message: 'User logged out - context cleared',
    level: 'info',
  })
}
