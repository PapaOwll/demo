import { captureMessage, withScope } from '@sentry/vue'
import { useServiceWorkerStore } from '@/store/service-worker'

/**
 * Handle error reports from Service Worker and send to GlitchTip
 * @param {Object} payload - Error payload from SW
 */
function handleSwErrorReport(payload) {
  const { message, level, context } = payload

  withScope((scope) => {
    scope.setTag('source', 'service-worker')
    scope.setTag('sw-error-level', level)

    if (context) {
      scope.setContext('sw_context', context)
    }

    // Map SW error levels to GlitchTip severity
    const severityMap = {
      error: 'error',
      warning: 'warning',
      info: 'info',
    }

    captureMessage(`[SW] ${message}`, {
      level: severityMap[level] || 'error',
    })
  })
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // Only register SW in production (sw.js uses ES modules that need bundling)
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[SW] Service Worker disabled in development mode')
      return
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        if (registration.waiting) {
          const swStore = useServiceWorkerStore()
          swStore.showUpdateBar()
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              const swStore = useServiceWorkerStore()
              swStore.showUpdateBar()
            }
          })
        })

        navigator.serviceWorker.addEventListener('message', (event) => {
          const { type } = event.data

          switch (type) {
            case 'UPDATE_AVAILABLE': {
              const swStore = useServiceWorkerStore()
              swStore.showUpdateBar()
              break
            }

            case 'CACHE_CLEARED': {
              const swStore = useServiceWorkerStore()
              swStore.handleCacheCleared()
              break
            }

            case 'SW_ERROR_REPORT': {
              handleSwErrorReport(event.data.payload)
              break
            }

            case 'SW_ACTIVATED': {
              const swStore = useServiceWorkerStore()
              swStore.hideUpdateBar()
              break
            }

            default: {
              break
            }
          }
        })

        window.addEventListener('focus', () => {
          if (registration.active) {
            registration.update()
          }
        })
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error)
      })

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      const swStore = useServiceWorkerStore()
      if (!swStore.isUpdateAvailable) {
        swStore.showUpdateBar()
      }
    })
  }
}

export { registerServiceWorker }
export default registerServiceWorker
