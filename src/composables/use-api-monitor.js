import { ref, computed } from 'vue'

const apiCalls = ref([])
const isMonitoring = ref(false)

export const useApiMonitor = () => {
  const sortedApiCalls = computed(() => {
    return [...apiCalls.value].sort((a, b) => b.size - a.size)
  })

  const totalSize = computed(() => {
    return apiCalls.value.reduce((acc, call) => acc + call.size, 0)
  })

  const totalCalls = computed(() => apiCalls.value.length)

  const addApiCall = (callData) => {
    const existingIndex = apiCalls.value.findIndex(
      (call) => call.endpoint === callData.endpoint && call.method === callData.method
    )

    if (existingIndex === -1) {
      apiCalls.value.push({
        ...callData,
        id: Date.now(),
        callCount: 1,
        lastCalledAt: new Date().toISOString(),
      })
    } else {
      apiCalls.value[existingIndex] = {
        ...apiCalls.value[existingIndex],
        ...callData,
        callCount: (apiCalls.value[existingIndex].callCount || 1) + 1,
        lastCalledAt: new Date().toISOString(),
      }
    }
  }

  const clearApiCalls = () => {
    apiCalls.value = []
  }

  const startMonitoring = () => {
    isMonitoring.value = true
  }

  const stopMonitoring = () => {
    isMonitoring.value = false
  }

  return {
    apiCalls,
    sortedApiCalls,
    totalSize,
    totalCalls,
    isMonitoring,
    addApiCall,
    clearApiCalls,
    startMonitoring,
    stopMonitoring,
  }
}

export const calculateResponseSize = (response) => {
  if (!response) return 0

  try {
    const contentLength = response.headers?.['content-length']
    if (contentLength) {
      return Number.parseInt(contentLength, 10)
    }

    if (response.data) {
      if (response.data instanceof Blob) {
        return response.data.size
      }
      const jsonString = JSON.stringify(response.data)
      return new Blob([jsonString]).size
    }
  } catch {
    return 0
  }

  return 0
}

export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}
