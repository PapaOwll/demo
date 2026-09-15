<template>
  <div>
    <div
      v-show="isShowModal"
      ref="popupWrapperRef"
      class="contact__popup"
      :style="{ maxWidth: changes?.data?.id ? '550px' : '400px' }"
    >
      <div ref="popupHeaderRef" class="contact__popup-header" />
      <ContactPopup
        :call-data="changes"
        @close="handleCloseModal"
        @open-user-form="openUserFormModal"
        @open-user-details="openUserDetailsModal"
      />
    </div>

    <UserDetails
      v-if="isShowUserDetailsModal"
      :visible="isShowUserDetailsModal"
      :user-id="changes?.data?.id"
      @close="closeUserDetailsModal"
    />

    <UserForm
      v-if="isShowUserFormModal"
      :visible="isShowUserFormModal"
      :user-id="changes?.data?.id"
      @close="closeUserFormModal"
      @after-submit="afterSubmitUserForm"
    />
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, onMounted, computed, onUnmounted, unref } from 'vue'
import useDisclosure from '@/composables/use-disclosure'
import ContactPopup from './ContactPopup'
import { useQueryClient, useQuery } from '@tanstack/vue-query'
import UserDetails from '@/modules/User/components/UserDetails/UserDetails'
import UserForm from '@/modules/User/components/UserForm'
import { requestNotificationPermission } from '@/utils/notification'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/user'
import { getAccessToken } from '@/utils/auth'
import { isOrthopedic } from '@/utils/tenant-utils'
import { apiGetSitakCall } from '@/data/services/dr-serita/api'

const userStore = useUserStore()
const { userId } = storeToRefs(userStore)
const isLeaderTab = ref(false)
const popupWrapperRef = ref(null)
const popupHeaderRef = ref(null)
const abortController = ref(null)
const [isShowModal, { open: openModal, close: closeModal }] = useDisclosure()
// eslint-disable-next-line no-unused-vars
const [isShowUserFormModal, { open: openUserFormModal, close: closeUserFormModal }] =
  useDisclosure()
const [isShowUserDetailsModal, { open: openUserDetailsModal, close: closeUserDetailsModal }] =
  useDisclosure()

const isLoggedIn = computed(() => !!getAccessToken())
const sitakCallEnabled = computed(
  () =>
    isLeaderTab.value &&
    !!userId.value &&
    !isOrthopedic() &&
    isLoggedIn.value &&
    process.env.NODE_ENV !== 'development'
)

const safeSitakCallQuery = async ({ signal }) => {
  const token = getAccessToken()
  if (!token) {
    // Return empty array instead of making the call
    return []
  }
  abortController.value = new AbortController()
  const mergedSignal = signal || abortController.value.signal
  try {
    const response = await apiGetSitakCall({ signal: mergedSignal })
    return response?.data ?? response ?? []
  } catch (error) {
    if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
      return []
    }
    if (error?.response?.status === 401) {
      return []
    }
    return []
  }
}

const { data: sitakCallData } = useQuery({
  queryKey: ['sitak-call'],
  queryFn: safeSitakCallQuery,
  enabled: sitakCallEnabled,
  refetchInterval: () => (sitakCallEnabled.value ? 60_000 : false),
  refetchIntervalInBackground: () => sitakCallEnabled.value,
  retry: false,
  staleTime: 0,
})

const queryClient = useQueryClient()
const previousData = ref(null)
const changes = ref({})

const handleCloseModal = () => {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CONTACT_POPUP_STATE',
      state: false,
    })
  }
  closeModal()
}

const afterSubmitUserForm = () => {
  // Close the form modal
  closeUserFormModal()

  // Refresh user-related queries
  queryClient.invalidateQueries({ queryKey: ['user', 'all-users'] })

  // If the user was created/updated with the same ID as the call data,
  // we should also open the user details modal
  if (changes.value?.data?.id) {
    openUserDetailsModal()
  }
}

const shouldShowNotification = (url) => {
  const currentUrl = new URL(url)
  return currentUrl.origin !== window.location.origin
}

const handleChangeTabVisibility = () => {
  if (!navigator.serviceWorker.controller) return

  if (document.visibilityState === 'visible') {
    navigator.serviceWorker.controller.postMessage({
      type: 'TAB_VISIBLE',
    })
  } else {
    navigator.serviceWorker.controller.postMessage({
      type: 'TAB_HIDDEN',
    })
  }
}

function dragElement() {
  const element = unref(popupWrapperRef)
  const headerElement = unref(popupHeaderRef)

  let pos1 = 0
  let pos2 = 0
  let pos3 = 0
  let pos4 = 0

  function elementDrag(e) {
    const elEvent = e || window.event
    elEvent.preventDefault()
    if (elEvent.clientY <= 0) {
      element.style.top = '1px'
      return
    }
    if (elEvent.clientY >= window.innerHeight - 200) {
      element.style.top = '80vh'
      return
    }
    if (elEvent.clientX >= window.innerWidth - 20) {
      element.style.left = '70vw'
      return
    }
    if (elEvent.clientX <= 0) {
      element.style.left = '1px'
      return
    }
    pos1 = pos3 - elEvent.clientX
    pos2 = pos4 - elEvent.clientY
    pos3 = elEvent.clientX
    pos4 = elEvent.clientY

    element.style.top = `${element.offsetTop - pos2}px`
    element.style.left = `${element.offsetLeft - pos1}px`
  }

  function closeDragElement() {
    document.removeEventListener('mouseup', closeDragElement)
    document.removeEventListener('mousemove', elementDrag)
  }

  function dragMouseDown(e) {
    const elEvent = e || window.event
    elEvent.preventDefault()
    pos3 = elEvent.clientX
    pos4 = elEvent.clientY
    document.addEventListener('mouseup', closeDragElement)
    document.addEventListener('mousemove', elementDrag)
  }

  if (headerElement) {
    headerElement.addEventListener('mousedown', dragMouseDown)
  } else {
    element.addEventListener('mousedown', dragMouseDown)
  }
}

watch(
  isLoggedIn,
  async (newValue, oldValue) => {
    if (!newValue && oldValue) {
      // Abort any ongoing request immediately
      if (abortController.value) {
        abortController.value.abort()
        abortController.value = null
      }

      // User just logged out, cancel ALL sitak-call queries immediately
      await queryClient.cancelQueries({ queryKey: ['sitak-call'] })
      queryClient.removeQueries({ queryKey: ['sitak-call'] })
      await queryClient.invalidateQueries({ queryKey: ['sitak-call'] })

      // Reset leader tab status to prevent any future calls
      isLeaderTab.value = false

      // Close any open modals
      if (isShowModal.value) {
        handleCloseModal()
      }

      // Clear any previous data
      previousData.value = null
      changes.value = {}
    }
  },
  { immediate: true }
)

watch(
  () => sitakCallData.value,
  (newData) => {
    // Double-check we're still logged in before processing
    if (!isLoggedIn.value) return

    if (!newData || !Array.isArray(newData)) return
    const [newCall] = newData
    if (!newCall) return

    if (previousData.value?.key !== newCall.key) {
      if (isLeaderTab.value && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(
          // eslint-disable-next-line unicorn/prefer-structured-clone
          JSON.parse(
            JSON.stringify({
              type: 'CONTACT_POPUP_STATE',
              state: true,
              modalData: newCall,
            })
          )
        )
      }

      // in development mode notification is always shown
      if (
        'Notification' in window &&
        Notification.permission === 'granted' &&
        shouldShowNotification(window.location.origin)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(
            `تماس از ${newCall.data?.id ? newCall.data?.fullName : 'کاربر نامشخص'}`,
            {
              body: newCall.data?.number,
              icon: `${import.meta.env.BASE_URL}favicon.ico`,
              tag: 'polling-notification',
            }
          )
        })
      }
      changes.value = newCall
      openModal()
    }

    previousData.value = newCall
  },
  { deep: true }
)

onMounted(() => {
  dragElement()
  requestNotificationPermission()
  navigator?.serviceWorker?.addEventListener('message', (event) => {
    if (event.data.type === 'LEADER_SELECTED') {
      isLeaderTab.value = event.data.isLeader
    } else if (event.data.type === 'CONTACT_POPUP_STATE') {
      if (event.data.state) {
        changes.value = event.data.modalData
        openModal()
      } else {
        closeModal()
      }
    }
  })
  if (navigator?.serviceWorker?.controller) {
    navigator?.serviceWorker?.controller.postMessage({
      type: 'TAB_VISIBLE',
    })
  } else {
    navigator?.serviceWorker?.ready.then((registration) => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'TAB_VISIBLE',
        })
      }
    })
  }

  document.addEventListener('visibilitychange', handleChangeTabVisibility)
})

onBeforeUnmount(() => {
  // Abort any ongoing requests
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }

  // Cancel all queries for this component
  queryClient.cancelQueries({ queryKey: ['sitak-call'] })
  queryClient.removeQueries({ queryKey: ['sitak-call'] })

  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLIENT_CLOSING',
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('visibilitychange', handleChangeTabVisibility)
})
</script>

<style lang="scss">
.contact__popup {
  position: fixed;
  left: 20px;
  top: 11vh;
  background-color: #f7f9fb;
  padding: 0 16px 16px;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 2000;
  width: 100%;

  .contact__popup-header {
    cursor: move;
    height: 16px;
  }
}
</style>
