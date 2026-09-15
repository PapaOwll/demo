import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useOfflineStore = defineStore('offline', () => {
  const isOffline = ref(false)
  const pendingRoute = ref(null)

  const setIsOffline = (value) => {
    isOffline.value = value
  }
  const setPendingRoute = (route) => {
    pendingRoute.value = route
  }

  return {
    isOffline,
    setIsOffline,
    pendingRoute,
    setPendingRoute,
  }
})
