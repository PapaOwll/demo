import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Notify } from 'quasar'

const UPDATE_AVAILABLE_KEY = 'sw-update-available'

export const useServiceWorkerStore = defineStore('serviceWorker', () => {
  // State
  const isUpdateAvailable = ref(localStorage.getItem(UPDATE_AVAILABLE_KEY) === 'true')

  let dismissLoadingNotify = null

  // Actions
  const showUpdateBar = () => {
    isUpdateAvailable.value = true
    localStorage.setItem(UPDATE_AVAILABLE_KEY, 'true')
  }

  const hideUpdateBar = () => {
    isUpdateAvailable.value = false
    localStorage.removeItem(UPDATE_AVAILABLE_KEY)
  }

  const applyUpdate = async () => {
    localStorage.removeItem(UPDATE_AVAILABLE_KEY)

    try {
      const registration = await navigator.serviceWorker.getRegistration()

      if (registration && registration.waiting) {
        const onControllerChange = () => {
          setTimeout(async () => {
            if (dismissLoadingNotify) {
              dismissLoadingNotify()
              dismissLoadingNotify = null
            }

            if ('caches' in window) {
              const cacheNames = await caches.keys()
              await Promise.all(cacheNames.map((name) => caches.delete(name)))
            }

            window.location.reload()
          }, 500)
        }

        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange, {
          once: true,
        })

        dismissLoadingNotify = Notify.create({
          type: 'info',
          message: 'در حال اعمال به‌روزرسانی...',
          spinner: true,
          timeout: 5000,
        })

        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      } else {
        window.location.reload()
      }
    } catch {
      window.location.reload()
    }
  }

  const handleCacheCleared = () => {
    if (dismissLoadingNotify) {
      dismissLoadingNotify()
      dismissLoadingNotify = null
    }
    Notify.create({
      type: 'positive',
      message: 'به‌روزرسانی با موفقیت انجام شد',
      timeout: 1500,
    })
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }

  return {
    isUpdateAvailable,
    showUpdateBar,
    hideUpdateBar,
    applyUpdate,
    handleCacheCleared,
  }
})
