import { ref } from 'vue'
import { defineStore } from 'pinia'

/* eslint-disable unicorn/consistent-function-scoping */
export const useNavigationStore = defineStore('navigation', () => {
  const SESSION_STORAGE_KEY = 'sitra-crm-tp-navigation'

  const isSessionStorageAvailable = () => {
    try {
      const test = '__storage_test__'
      sessionStorage.setItem(test, test)
      sessionStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  const validateTpDescriptionData = (data) => {
    if (!data || typeof data !== 'object') return false
    return data
  }

  const saveToSession = (data) => {
    if (!isSessionStorageAvailable()) {
      console.error('sessionStorage is not available in this environment')
      return false
    }

    try {
      const serialized = JSON.stringify(data)

      const sizeInMB = serialized.length / (1024 * 1024)
      if (sizeInMB > 4) {
        console.warn(
          `Navigation data size (${sizeInMB.toFixed(2)}MB) approaching sessionStorage limit`
        )
        return false
      }

      sessionStorage.setItem(SESSION_STORAGE_KEY, serialized)
      return true
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Session storage quota exceeded. Cannot save navigation data.')
      } else {
        console.error('Failed to save navigation data to session storage:', error)
      }
      return false
    }
  }

  const loadFromSession = () => {
    if (!isSessionStorageAvailable()) {
      return null
    }

    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Failed to load navigation data from session storage:', error)
      return null
    }
  }

  const clearSession = () => {
    if (!isSessionStorageAvailable()) {
      return false
    }

    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
      return true
    } catch (error) {
      console.error('Failed to clear navigation data from session storage:', error)
      return false
    }
  }

  const tpDescriptionData = ref(loadFromSession())

  const setTpDescriptionData = (data) => {
    if (!validateTpDescriptionData(data)) {
      console.error('Invalid treatment plan description data:', data)
      return false
    }

    const success = saveToSession(data)

    if (success) {
      tpDescriptionData.value = data
    } else {
      console.error('Failed to set navigation data due to storage error')
    }

    return success
  }

  const getTpDescriptionData = () => {
    return tpDescriptionData.value
  }

  const clearTpDescriptionData = () => {
    tpDescriptionData.value = null
    clearSession()
  }

  return {
    tpDescriptionData,
    setTpDescriptionData,
    getTpDescriptionData,
    clearTpDescriptionData,
  }
})
