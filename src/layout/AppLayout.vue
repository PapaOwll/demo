<template>
  <QLayout view="hHh Lpr lfr" class="layout">
    <AppHeader
      :current-page-name="currentPageName"
      :filtered-sub-modules="filteredSubModules"
      @toggle-drawer="toggleRightDrawer"
      @user-selected="handleUserSelected"
    />
    <AppSidebar v-model="rightDrawerOpen" :filtered-sub-modules="filteredSubModules" />
    <QPageContainer ref="pageContainerRef" class="layout__page-container">
      <QPage class="layout__content">
        <AnnouncementBanner
          v-for="announcement in headerAnnouncements"
          :key="announcement.id"
          :announcement="announcement"
          @dismiss="dismissAnnouncement(announcement.id)"
        />
        <OfflineWrapper>
          <VErrorBoundary>
            <RouterTransition>
              <RouterView />
            </RouterTransition>
          </VErrorBoundary>
        </OfflineWrapper>
      </QPage>
    </QPageContainer>
  </QLayout>
  <UserDetails :visible="userDetailsVisible" :user-id="selectedUserId" @close="closeUserDetails" />
  <AnnouncementModal
    v-if="modalAnnouncement && shouldShowModal"
    :announcement="modalAnnouncement"
    :model-value="shouldShowModal"
    @update:model-value="dismissAnnouncement(modalAnnouncement.id)"
    @dismiss="dismissAnnouncement(modalAnnouncement.id)"
  />
</template>

<script setup>
import { RouterView, useRoute } from 'vue-router'
import OfflineWrapper from '@/components/OfflineWrapper'
import VErrorBoundary from '@/components/common/ErrorBoundary/VErrorBoundary'
import UserDetails from '@/modules/User/components/UserDetails/UserDetails'
import { computed, ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/user'
import { useServiceWorkerStore } from '@/store/service-worker'
import AppHeader from './components/AppHeader'
import AppSidebar from './components/AppSidebar'
import AnnouncementModal from './components/AnnouncementModal'
import AnnouncementBanner from './components/AnnouncementBanner'
import RouterTransition from './components/RouterTransition'
import { useCrmAnnouncements } from '@/layout/composables/use-crm-announcements'

if (import.meta.env.DEV) {
  // eslint-disable-next-line no-underscore-dangle
  window.__testUpdateBar = () => {
    const swStore = useServiceWorkerStore()
    swStore.showUpdateBar()
  }
}

const userStore = useUserStore()
const route = useRoute()
const { userData } = storeToRefs(userStore)

const userDetailsVisible = ref(false)
const selectedUserId = ref(null)
const rightDrawerOpen = ref(true)
const pageContainerRef = ref(null)

const { headerAnnouncements, modalAnnouncement, shouldShowModal, dismissAnnouncement } =
  useCrmAnnouncements()

const filteredSubModules = computed(
  () =>
    userData?.value?.role?.modules
      ?.filter((module) => !module.hidden)
      .map((module) => ({
        ...module,
        subModules: module.subModules?.filter((sub) => sub.status !== 2 && !sub.hidden),
      })) || []
)

const currentPageName = computed(() => {
  const pathSegments = route.path.split('/').filter(Boolean)
  if (pathSegments.length === 0) return 'داشبورد'

  const currentModule = filteredSubModules.value.find(
    (module) => module.key === pathSegments[0] || `${module.key}s` === pathSegments[0]
  )

  if (pathSegments.length === 1) {
    return currentModule?.title || 'داشبورد'
  }

  const currentSubModule = currentModule?.subModules?.find((sub) => sub.key === pathSegments[1])

  return currentSubModule?.title || currentModule?.title || 'داشبورد'
})

const handleUserSelected = (userId) => {
  selectedUserId.value = userId
  if (!userId) return
  userDetailsVisible.value = true
}

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value
}

const closeUserDetails = () => {
  userDetailsVisible.value = false
}

watch(
  () => route.path,
  async () => {
    await nextTick()
    if (pageContainerRef.value && pageContainerRef.value.$el) {
      pageContainerRef.value.$el.scrollTop = 0
    }
  }
)
</script>

<style lang="scss" scoped>
@import '@/assets/styles/colors';
@import '@/assets/styles/mixins';

.layout {
  height: 100vh;
  background: $white;
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @include media-breakpoint-down(lg) {
    min-height: 100vh;
  }

  &__page-container {
    overflow-y: auto;
    flex: 1;
    min-height: 0;
    padding-top: 0 !important;
    direction: rtl;
  }

  &__content {
    width: 100% !important;
    margin: 0 auto;
    background: $white;
    padding: 16px;
    min-height: 100%;
    direction: rtl;
  }
}

:deep(.layout__page-container) {
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;

    &:hover {
      background: #555;
    }
  }
}
</style>
