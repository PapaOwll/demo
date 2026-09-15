<template>
  <div class="offline-wrapper">
    <div v-show="isOffline && pendingRoute" class="offline-wrapper__offline-content">
      <slot name="offline">
        <div class="offline-wrapper__default-message row justify-center items-center">
          <img
            src="@/assets/images/layout/offline-bg.png"
            width="1440"
            alt="bg-offline"
            class="offline-wrapper__background-image"
          />
        </div>
      </slot>
    </div>
    <div v-show="!isOffline || !pendingRoute" class="offline-wrapper__online-content">
      <slot>
        <!-- Default content when online -->
      </slot>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useOfflineStore } from '@/store/offline'

import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const offlineStore = useOfflineStore()

const { isOffline, pendingRoute } = storeToRefs(offlineStore)
const { setPendingRoute, setIsOffline } = offlineStore

const handleOnline = () => {
  setIsOffline(false)
  if (pendingRoute.value) {
    router.push(pendingRoute.value)
    setPendingRoute(null)
  }
}

const handleOffline = () => {
  setIsOffline(true)
}

onMounted(() => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Initial connection status
  isOffline.value = !navigator.onLine
})

// Remove event listeners when unmounted
onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<style lang="scss" scoped>
.offline-wrapper {
  position: relative;
  width: 100%;

  &__offline-content {
    position: relative;
    width: 100%;
  }

  &__online-content {
    position: relative;
    width: 100%;
  }

  &__default-message {
    padding: 20px;
    color: $grey-6;
    text-align: center;
    border-radius: 8px;
    min-height: 400px;
  }

  &__background-image {
    max-width: 100%;
    height: auto;
    object-fit: contain;
  }
}
</style>
