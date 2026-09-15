/* global __APP_VERSION__ */
import '@/mock'
import '@/polyfills/promise-all-settled'
import 'quasar/dist/quasar.rtl.css'
import 'quasar/src/css/index.sass'
import '@quasar/extras/material-icons/material-icons.css'
import '@/assets/styles/main.scss'
import '@tabler/icons-vue'
import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
// GlitchTip is Sentry-protocol compatible, so the official @sentry/vue SDK is the supported client.
import {
  init,
  createSentryPiniaPlugin,
  vueIntegration,
  browserTracingIntegration,
} from '@sentry/vue'
import { getGlitchtipEnvironment } from '@/utils/glitchtip-environment'
import {
  setGlitchtipRouteContext,
  setGlitchtipDeviceContext,
  setGlitchtipAppContext,
} from '@/utils/glitchtip-context'
import '@/utils/yup-locale'
import router from './router'
import App from './App'
import { registerServiceWorker } from './utils/service-worker'
import { captureApp } from '@/composables/_app-context'

import { Quasar, Notify, Dialog, Loading } from 'quasar'
import langFa from 'quasar/lang/fa-IR'

const pinia = createPinia()

pinia.use(createSentryPiniaPlugin())

const app = createApp(App)
captureApp(app)

// GlitchTip does not support release health, so the SDK's default session
// integration is stripped out (equivalent of `auto_session_tracking: false`).
const GLITCHTIP_UNSUPPORTED_INTEGRATIONS = new Set(['BrowserSession'])

const DEFAULT_TRACES_SAMPLE_RATE = 0.01

function getTracesSampleRate() {
  const rate = Number.parseFloat(import.meta.env.VITE_GLITCHTIP_TRACES_SAMPLE_RATE)

  if (!Number.isFinite(rate)) return DEFAULT_TRACES_SAMPLE_RATE

  return Math.min(Math.max(rate, 0), 1)
}

function initializeGlitchtip() {
  const isProduction = import.meta.env.VITE_NODE_ENV === 'production'

  init({
    app,
    debug: false,
    enabled: isProduction,
    dsn: import.meta.env.VITE_GLITCHTIP_DSN,
    environment: isProduction ? getGlitchtipEnvironment() : import.meta.env.VITE_NODE_ENV,
    release: __APP_VERSION__,

    integrations: (defaultIntegrations) => [
      ...defaultIntegrations.filter(
        (integration) => !GLITCHTIP_UNSUPPORTED_INTEGRATIONS.has(integration.name)
      ),
      vueIntegration({
        app,
      }),
      browserTracingIntegration({
        router,
      }),
    ],

    // Performance monitoring - keep the sample low so GlitchTip storage stays manageable
    tracesSampleRate: getTracesSampleRate(),

    // GlitchTip has no client report ingest endpoint
    sendClientReports: false,

    attachStacktrace: true,

    beforeSend(event) {
      const message = event.exception?.values?.[0]?.value || ''

      const ignoredPatterns = [
        'Unable to preload CSS',
        'Error invoking',
        'Response error',
        'Network error',
        'Failed to fetch dynamically',
        'Method not found',
        'ApiError',
        'NotSupportedError',
        'Failed to load because no supported source',
        "Couldn't resolve component",
      ]

      const ignoredBySource = [
        'chrome-extension://',
        'The play() request was interrupted',
        'The fetching process for the media resource was aborted',
      ]

      if (ignoredPatterns.some((pattern) => message.includes(pattern))) {
        return null
      }

      const frames = event.exception?.values?.[0]?.stacktrace?.frames || []
      const hasIgnoredSource = frames.some((frame) =>
        ignoredBySource.some((src) => frame.filename?.includes(src) || message.includes(src))
      )
      if (hasIgnoredSource) {
        return null
      }

      return event
    },
  })

  // Set initial device and app context
  setGlitchtipDeviceContext()
  setGlitchtipAppContext()

  // Watch for route changes
  router.afterEach((to) => {
    setGlitchtipRouteContext(to)
  })
}

function initializeVueQueryPlugin() {
  const vueQueryPluginOptions = {
    queryClientConfig: {
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 5 * 60 * 1000,
          refetchInterval: false,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          gcTime: 5 * 60 * 1000,
        },
      },
    },
  }
  app.use(VueQueryPlugin, vueQueryPluginOptions)
}

function initializeApp() {
  app.use(pinia)
  app.use(router)
  app.use(Quasar, {
    lang: langFa,
    rtl: true,
    plugins: {
      Notify,
      Dialog,
      Loading,
    },
    config: {
      notify: {
        position: 'top',
        // progress: true,
        // timeout: 3000,
        // textColor: 'white',
        // actions: [{ icon: 'close', color: 'white' }],
      },
    },
  })
  app.mount('#app')
}

// Handle chunk load errors (when deploy happens and old files are removed)
// This is a fallback - Workbox precaching should prevent this
function setupChunkLoadErrorHandler() {
  window.addEventListener('vite:preloadError', (event) => {
    // eslint-disable-next-line no-console
    console.warn('Chunk load error detected, reloading...', event.payload)

    // Prevent the default error
    event.preventDefault()

    // Clear service worker cache and reload to get new version
    if ('caches' in window) {
      caches.keys().then((names) => {
        Promise.all(names.map((name) => caches.delete(name))).then(() => {
          window.location.reload()
        })
      })
    } else {
      window.location.reload()
    }
  })

  // Also handle dynamic import errors
  window.addEventListener('error', (event) => {
    const isChunkError =
      event.message?.includes('Failed to fetch dynamically imported module') ||
      event.message?.includes('Loading chunk') ||
      event.message?.includes('Loading CSS chunk')

    if (isChunkError) {
      // eslint-disable-next-line no-console
      console.warn('Dynamic import error detected, reloading...', event.message)
      event.preventDefault()

      if ('caches' in window) {
        caches.keys().then((names) => {
          Promise.all(names.map((name) => caches.delete(name))).then(() => {
            window.location.reload()
          })
        })
      } else {
        window.location.reload()
      }
    }
  })
}

function main() {
  setupChunkLoadErrorHandler()
  initializeGlitchtip()
  registerServiceWorker()
  initializeVueQueryPlugin()
  initializeApp()
}

main()
