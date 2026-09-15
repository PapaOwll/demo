/* eslint-disable func-names */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-extraneous-dependencies */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'

precacheAndRoute(self.__WB_MANIFEST || [])
cleanupOutdatedCaches()

const STATIC_CACHE = 'static-v1'
const SW_VERSION = '__APP_VERSION__'
const BUILD_ID = '__BUILD_ID__'
let leaderTabId = null
const connectedClients = new Set()

let updateNotified = false
const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000

// =============================================================================
// GlitchTip Error Reporting - Send errors to main thread for GlitchTip capture
// =============================================================================
const SW_ERROR_LEVELS = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
}

/**
 * Send error to main thread for GlitchTip capture
 * @param {string} message - Error message
 * @param {string} level - Error level (error, warning, info)
 * @param {Object} context - Additional context
 */
async function reportToGlitchtip(message, level = SW_ERROR_LEVELS.ERROR, context = {}) {
  try {
    const allClients = await self.clients.matchAll()
    const errorPayload = {
      type: 'SW_ERROR_REPORT',
      payload: {
        message,
        level,
        context: {
          ...context,
          swVersion: BUILD_ID,
          leaderTabId,
          connectedClientsCount: connectedClients.size,
          timestamp: Date.now(),
        },
      },
    }

    // Send to first available client
    if (allClients.length > 0) {
      allClients[0].postMessage(errorPayload)
    }
  } catch (reportError) {
    // Fallback to console if reporting fails
    console.error('[SW] Failed to report error to GlitchTip:', reportError)
  }
}

// =============================================================================

async function checkForUpdates() {
  if (updateNotified) {
    return
  }

  try {
    const response = await fetch('/sw.js', { cache: 'no-store' })
    const text = await response.text()
    const match = text.match(/BUILD_ID\s*=\s*["']([^"']+)["']/)
    const remoteBuildId = match?.[1]

    if (remoteBuildId && remoteBuildId !== BUILD_ID) {
      updateNotified = true

      const allClients = await self.clients.matchAll()
      allClients.forEach((client) => {
        client.postMessage({
          type: 'UPDATE_AVAILABLE',
          timestamp: Date.now(),
        })
      })
    }
  } catch {
    // network error - will retry on next interval
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting()

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(['/offline.html']).catch((error) => {
        console.error('Failed to pre-cache:', error)
        reportToGlitchtip('Failed to pre-cache files during SW install', SW_ERROR_LEVELS.ERROR, {
          errorMessage: error.message,
          errorName: error.name,
        })
      })
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && !cacheName.startsWith('workbox-precache')) {
              return caches.delete(cacheName)
            }
            return null
          })
        )
      }),
    ]).then(async () => {
      // Immediately notify clients that new version is active
      const allClients = await self.clients.matchAll()
      allClients.forEach((client) => {
        client.postMessage({
          type: 'SW_ACTIVATED',
          version: SW_VERSION,
          timestamp: Date.now(),
        })
      })

      // Initialize and start periodic update checks
      setTimeout(checkForUpdates, 3000)
    })
  )
})

registerRoute(
  ({ request }) =>
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.url.includes('/assets/'),
  new CacheFirst({
    cacheName: STATIC_CACHE,
  })
)

registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: STATIC_CACHE,
    networkTimeoutSeconds: 3,
    plugins: [
      {
        handlerDidError: async () => {
          return caches.match('/offline.html')
        },
      },
    ],
  })
)

async function cleanupClients() {
  const activeClients = await self.clients.matchAll()
  const activeClientIds = new Set(activeClients.map((client) => client.id))

  // eslint-disable-next-line no-restricted-syntax
  for (const clientId of connectedClients) {
    if (!activeClientIds.has(clientId)) {
      connectedClients.delete(clientId)
    }
  }
}

async function selectNewLeader(excludeId = null) {
  await cleanupClients()

  const availableClients = await self.clients.matchAll()
  const eligibleClients = availableClients.filter((client) => client.id !== excludeId)

  if (eligibleClients.length > 0) {
    leaderTabId = eligibleClients[0].id

    availableClients.forEach((client) => {
      client.postMessage({
        type: 'LEADER_SELECTED',
        isLeader: client.id === leaderTabId,
      })
    })
  } else {
    leaderTabId = null
  }
}

async function broadcastToAllClients(message, excludeClientId = null) {
  const allClients = await self.clients.matchAll()
  allClients.forEach((client) => {
    if (client.id !== excludeClientId) {
      client.postMessage(message)
    }
  })
}

self.addEventListener('message', async (event) => {
  const client = event.source
  try {
    switch (event.data.type) {
      case 'TAB_VISIBLE': {
        await cleanupClients()
        connectedClients.add(client.id)

        leaderTabId = client.id

        const allClientsVisible = await self.clients.matchAll()
        allClientsVisible.forEach((c) => {
          c.postMessage({
            type: 'LEADER_SELECTED',
            isLeader: c.id === leaderTabId,
          })
        })
        break
      }

      case 'TAB_HIDDEN': {
        const allClientsHidden = await self.clients.matchAll()
        const otherClients = allClientsHidden.filter((c) => c.id !== client.id)

        if (otherClients.length === 0 && client.id !== leaderTabId) {
          leaderTabId = client.id
          client.postMessage({
            type: 'LEADER_SELECTED',
            isLeader: true,
          })
        }
        break
      }

      case 'CLIENT_CLOSING': {
        connectedClients.delete(client.id)
        if (client.id === leaderTabId) {
          await selectNewLeader(client.id)
        }
        break
      }

      case 'CONTACT_POPUP_STATE': {
        await broadcastToAllClients(
          {
            type: 'CONTACT_POPUP_STATE',
            state: event.data.state,
            modalData: event.data.modalData,
          },
          event.source.id
        )
        break
      }

      case 'CHECK_FOR_UPDATES': {
        await checkForUpdates()
        break
      }

      case 'CLEAR_CACHE_AND_RELOAD': {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((name) => caches.delete(name)))

        updateNotified = false

        client.postMessage({
          type: 'CACHE_CLEARED',
          timestamp: Date.now(),
        })
        break
      }

      default: {
        break
      }
    }
  } catch {
    // console.warn('[SW] Message handler error:', error)
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus()
      } else {
        self.clients.openWindow('/')
      }
    })
  )
})

let updateCheckInterval = null
const startUpdateChecks = () => {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval)
  }
  updateCheckInterval = setInterval(() => {
    checkForUpdates()
  }, UPDATE_CHECK_INTERVAL)
}

startUpdateChecks()

// =============================================================================
// Global Error Handlers
// =============================================================================
self.addEventListener('error', (event) => {
  console.error('[SW] Uncaught error:', event.error)
  reportToGlitchtip('SW uncaught error', SW_ERROR_LEVELS.ERROR, {
    errorMessage: event.error?.message || event.message,
    errorName: event.error?.name || 'Error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  })
})

self.addEventListener('unhandledrejection', (event) => {
  // console.error('[SW] Unhandled rejection:', event.reason)

  const { reason } = event
  if (reason?.name === 'TypeError' && reason?.message?.includes('Failed to fetch')) {
    return
  }

  reportToGlitchtip('SW unhandled promise rejection', SW_ERROR_LEVELS.ERROR, {
    reason: String(reason),
    errorMessage: reason?.message,
    errorName: reason?.name,
  })
})
