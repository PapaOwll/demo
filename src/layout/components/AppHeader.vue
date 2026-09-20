<template>
  <QHeader class="layout__header">
    <div v-if="isUpdateAvailable" id="project-update-bar" class="update-bar">
      <Typography variant="body" size="2" color="white">به روز رسانی جدید منتشر شد!</Typography>
      <QBtn outline color="white" class="q-px-sm" @click="updateProject">
        <IconRefresh class="q-ml-sm" />
        <Typography variant="body" size="2" color="white">به روز رسانی کن</Typography>
      </QBtn>
    </div>
    <div v-if="chequesCount > 0" class="warning-bar">
      <IconAlertTriangle color="yellow" />
      <Typography variant="body" size="2" color="white">
        شما
        <span class="text-yellow text-h5">
          {{ chequesCount }}
        </span>
        بیمار بدون ثبت چک دارید. لطفاً مدارک مالی آنها را تکمیل کنید.
      </Typography>
    </div>
    <QToolbar class="layout__header-toolbar">
      <QToolbarTitle>
        <div class="flex justify-between items-center full-width">
          <div class="flex items-center">
            <QBtn class="mobile-menu-btn" flat round icon="menu" @click="toggleRightDrawer" />

            <div class="header__branding">
              <div class="flex items-center q-gutter-sm">
                <img
                  id="header-logo"
                  :src="logo"
                  alt="logo"
                  width="40"
                  height="40"
                  class="cursor-pointer"
                  @click="navigateToDashboard"
                />
                <div class="header__branding-text">
                  <div class="cursor-pointer" @click="navigateToDashboard">
                    <Typography variant="body" size="3" weight="bold" color="dark">
                      پنل سیترا
                    </Typography>
                  </div>
                  <Typography variant="caption" color="grey">نسخه: {{ version }}</Typography>
                </div>
              </div>
            </div>

            <QSeparator vertical class="header__separator q-mx-md" />

            <div class="header__page-name" style="min-width: 150px">
              <Typography variant="body" size="3" weight="bold">{{ currentPageName }}</Typography>
            </div>

            <div class="search-container">
              <div class="search-input-wrapper">
                <div class="search-input-container">
                  <div class="search-select-wrapper">
                    <QSelect
                      :model-value="selectedUser"
                      class="search-user search-select"
                      outlined
                      dense
                      use-input
                      hide-selected
                      fill-input
                      hide-dropdown-icon
                      placeholder="جستجوی کاربر ..."
                      color="grey-4"
                      clearable
                      borderless
                      :options="users?.items"
                      :option-label="userOptionLabel"
                      :input-value="searchInputValue"
                      :loading="userLoading"
                      @filter="handleInput"
                      @update:model-value="handleUserSelect"
                      @input-value="onSearchInputChange"
                    >
                      <template #prepend>
                        <IconSearch size="18" color="#9CA3AF" />
                      </template>
                      <template #option="scope">
                        <QItem v-bind="scope.itemProps">
                          <QItemSection>
                            <div class="search-user__options">
                              <Typography variant="body" size="3">
                                {{
                                  `${scope.opt.name || 'بدون نام'} / ${scope.opt.mobile}/ ${scope.opt.docNumber || ''}`
                                }}
                              </Typography>
                              <Typography variant="caption" color="blue">
                                {{ scope.opt.advisor?.name || 'بدون مشاور' }}
                              </Typography>
                            </div>
                          </QItemSection>
                        </QItem>
                      </template>
                    </QSelect>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Center section: Currently empty -->
          <div />

          <!-- Right section: User info, notifications, and logout -->
          <div class="flex items-center q-gutter-sm">
            <!-- Notifications dropdown -->
            <QBtn flat round class="notification-btn">
              <QBadge
                v-if="totalNotifications"
                class="notification-badge"
                color="red"
                rounded
                text-color="white"
              >
                {{ totalNotifications }}
              </QBadge>
              <IconBell size="24" stroke-width="1.5" color="grey" />
              <QMenu
                anchor="bottom left"
                self="top left"
                class="notification-menu"
                :offset="[20, 5]"
              >
                <div style="width: 300px">
                  <QCardSection>
                    <Typography variant="body" weight="bold">اطلاعیه‌ها</Typography>
                  </QCardSection>
                  <QSeparator />
                  <QList>
                    <QItem v-for="(widget, key) in widgetData" :key="key" clickable>
                      <QItemSection avatar>
                        <component
                          :is="widgetIconComponents[widget.icon]"
                          v-if="widgetIconComponents[widget.icon]"
                          :color="widget.color"
                          :size="24"
                        />
                        <QIcon v-else name="help_outline" size="24px" class="text-grey-6" />
                      </QItemSection>
                      <QItemSection>
                        <Typography variant="body" size="4">{{ widget.label }}</Typography>
                        <Typography variant="caption">تعداد: {{ widget.value }}</Typography>
                      </QItemSection>
                      <QItemSection v-if="widget.uri" side>
                        <RouterLink :to="widget.uri" target="_blank">
                          <QBtn flat round size="sm" icon="launch" />
                        </RouterLink>
                      </QItemSection>
                    </QItem>
                  </QList>
                </div>
              </QMenu>
            </QBtn>

            <!-- User profile dropdown -->
            <QBtn flat class="user-profile-btn">
              <div class="user-profile" :class="{ 'user-profile--impersonate': isImpersonate }">
                <div class="avatar" :class="{ 'avatar--impersonate': isImpersonate }">
                  <IconSpyOff v-if="isImpersonate" stroke-width="1.5" size="24" color="red" />
                  <IconUser v-else size="24" stroke-width="1.5" color="#1976D2" />
                </div>
                <template v-if="isLoading">
                  <div class="user-text-info">
                    <QSkeleton type="text" width="120px" height="20px" class="q-mb-xs" />
                    <QSkeleton type="text" width="80px" height="14px" />
                  </div>
                </template>
                <div v-else class="user-text-info">
                  <Typography variant="body" weight="medium" color="dark">
                    {{ userData?.user?.firstName || '' }} {{ userData?.user?.name || '' }}
                  </Typography>
                  <Typography variant="caption" color="grey">
                    {{ userData?.role?.faTitle }}
                  </Typography>
                </div>
              </div>

              <!-- Profile dropdown menu -->
              <QMenu
                anchor="bottom middle"
                self="top left"
                content-class="profile-menu-content"
                :offset="[200, 5]"
              >
                <QList style="min-width: 220px">
                  <QItem clickable :to="{ name: 'personal-setting' }">
                    <QItemSection avatar>
                      <IconUser size="20" />
                    </QItemSection>
                    <QItemSection>
                      <Typography variant="body" size="2">تنظیمات کاربری</Typography>
                    </QItemSection>
                  </QItem>
                  <QSeparator />
                  <QItem v-if="isImpersonate" clickable @click="impersonateLogOut">
                    <QItemSection avatar>
                      <IconSpyOff size="20" color="red" />
                    </QItemSection>
                    <QItemSection>
                      <Typography variant="body" size="2">توقف شبیه‌سازی</Typography>
                      <Typography variant="caption">{{ loggedInUser }}</Typography>
                    </QItemSection>
                  </QItem>
                  <QItem v-else clickable @click="exit">
                    <QItemSection avatar>
                      <IconLogout2 size="20" color="red" />
                    </QItemSection>
                    <QItemSection>
                      <Typography variant="body" size="2">خروج</Typography>
                    </QItemSection>
                  </QItem>
                </QList>
              </QMenu>
            </QBtn>
          </div>
        </div>
      </QToolbarTitle>
    </QToolbar>
  </QHeader>
</template>

<script setup>
import {
  IconLogout2,
  IconSpyOff,
  IconRefresh,
  IconBell,
  IconUser,
  IconSearch,
  IconAlertTriangle,
} from '@tabler/icons-vue'
import Typography from '@/base/Typography'
import { computed, ref } from 'vue'
import { createAsyncIconComponent } from '@/utils/icon-loader'
import { storeToRefs } from 'pinia'
import { logout } from '@/utils/auth'
import { useUserStore } from '@/store/user'
import { useGetHeaderWidgetsQuery } from '@/layout/query'
import { useGetPatientsWithoutChequeCountQuery } from '@/modules/Booking/query'
import { mapWidgetData } from '@/utils/header-widgets'
import { useUserSearch } from '@/composables/use-user-search'
import { getThemeSetting } from '@/utils/theme-setting'
import { confirmDialog } from '@/data/services/notification-service'
import { useRouter } from 'vue-router'
import { useServiceWorkerStore } from '@/store/service-worker'
import { useQueryClient } from '@tanstack/vue-query'

/* global __APP_VERSION__ */
const version = __APP_VERSION__

defineProps({
  currentPageName: {
    type: String,
    default: '',
  },
  filteredSubModules: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['toggle-drawer', 'user-selected'])

const { exitImpersonatingUser } = useUserStore()
const userStore = useUserStore()
const router = useRouter()
const { isLoading, userData } = storeToRefs(userStore)
const queryClient = useQueryClient()

const swStore = useServiceWorkerStore()

const selectedUser = ref(null)
const searchInputValue = ref('')

const isUpdateAvailable = computed(() => swStore.isUpdateAvailable)
const filters = computed(() => {
  return {
    reports: 'users_without_visit_count,users_without_status_count,raw_users_count',
  }
})

const isImpersonate = computed(() => localStorage.getItem('perv-access-token'))
const loggedInUser = computed(() => `خروج از کاربر ${userData.value?.user?.name}`)
const logo = computed(
  () =>
    getThemeSetting()?.logo || 'https://api.cdn.sitracrm.ir/franchise/_logo/default/app-icon.png'
)

const { data: widgets } = useGetHeaderWidgetsQuery(filters, { enabled: true })

const { data: patientsWithoutCheque } = useGetPatientsWithoutChequeCountQuery()

const chequesCount = computed(() => patientsWithoutCheque.value?.count || 0)

const widgetData = computed(() => mapWidgetData(widgets.value))

const widgetIconComponents = computed(() => {
  const icons = {}
  const data = widgetData.value
  if (!data || typeof data !== 'object') return icons
  const widgetList = Array.isArray(data) ? data : Object.values(data)
  widgetList.forEach((widget) => {
    if (widget?.icon && !icons[widget.icon]) {
      icons[widget.icon] = createAsyncIconComponent(widget.icon)
    }
  })
  return icons
})

const totalNotifications = computed(() => {
  if (!widgetData.value) return 0
  return Object.values(widgetData.value).reduce((total, widget) => {
    return total + (widget.value || 0)
  }, 0)
})

const { users, userLoading, searchUsers } = useUserSearch()

const userOptionLabel = (user) => {
  if (!user) return ''
  return `${user.name || 'بدون نام'} / ${user.mobile}${user.docNumber ? `/${user.docNumber}` : ''}`
}

const navigateToDashboard = () => {
  router.push({ name: 'dashboard' })
}

const handleInput = (val, update) => {
  if (!val) {
    selectedUser.value = null
  }
  update(() => {
    searchUsers(val)
  })
}

const onSearchInputChange = (val) => {
  searchInputValue.value = val
}

const handleUserSelect = (user) => {
  if (user) {
    emit('user-selected', user.id)
    searchInputValue.value = ''
  } else {
    selectedUser.value = null
  }
}

const toggleRightDrawer = () => {
  emit('toggle-drawer')
}

const onLogout = () => {
  queryClient.clear()
  logout()
  router.push('/login')
}

const impersonateLogOut = () => {
  queryClient.clear()
  exitImpersonatingUser()
}

const exit = () => {
  confirmDialog('خروج از برنامه', 'آیا می خواهید از برنامه خارج شوید؟', () => onLogout(), {
    ok: {
      label: 'خروج',
      color: 'primary',
      flat: true,
    },
    cancel: {
      label: 'انصراف',
      color: 'negative',
      flat: true,
    },
  })
}

const updateProject = () => {
  swStore.applyUpdate()
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/colors';
@import '@/assets/styles/mixins';

.layout__header {
  background: $grey-1;
  border-bottom: 1px solid $grey-4;
  box-shadow: none;
  flex-shrink: 0;
  z-index: 2;
  position: relative;

  &-toolbar {
    padding: $spacing-md 0;
  }
}

.notification-btn {
  background-color: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  min-height: 40px;
  transition: all 0.2s ease;

  &:hover {
    background-color: $grey-2;
    border-color: $grey-5;
  }
}

.notification-badge {
  position: absolute;
  bottom: -1px;
  left: 28px;
  font-size: 11px;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
}

.mobile-menu-btn {
  display: none;
  color: $dark;

  @include media-breakpoint-down(md) {
    display: flex;
  }
}

.user-profile {
  display: flex;
  gap: 8px;
  cursor: pointer;
  margin-inline-end: 40px;

  @include media-breakpoint-down(sm) {
    margin-inline-end: 10px;
  }
}

.user-text-info {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: flex-start;
  text-align: start;

  @include media-breakpoint-down(sm) {
    display: none;
  }
}

.avatar {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8px;
  gap: 8px;
  width: 40px;
  height: 40px;
  background: #e3f2fd;
  border: 1px solid $blue-2;
  border-radius: 99px;

  &--impersonate {
    background: #ffebee;
    border: 1px solid $red-2;
  }
}

.avatar-btn {
  padding: 0;
  min-height: unset;
  width: 24px;
  height: 24px;
}

.user-profile-btn {
  padding: 0;
  min-height: 40px;
  height: 40px;
  border-radius: 8px;
}

.search-container {
  min-width: 300px;

  @include media-breakpoint-down(lg) {
    min-width: 250px;
  }

  @include media-breakpoint-down(md) {
    display: none;
  }
}

.search-input-wrapper {
  width: 350px;
  height: 48px;

  @include media-breakpoint-down(lg) {
    width: 300px;
  }

  @include media-breakpoint-down(md) {
    width: 250px;
  }
}

.search-input-container {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: 12px;
  height: 100%;
  padding: 4px 8px 4px 4px;
  border: 1px solid $grey-4;
  border-radius: 100px;
  background: white;
}

.search-select-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.header {
  display: flex;
  align-items: center;
  gap: 2rem;

  &__branding {
    display: flex;
    align-items: center;

    padding: 0 16px;

    @include media-breakpoint-down(md) {
      flex: 1;
    }
  }

  &__branding-text {
    display: flex;
    flex-direction: column;

    @include media-breakpoint-down(sm) {
      display: none;
    }
  }

  &__separator {
    height: 40px;
    background-color: $grey-4;
    margin-top: 8px;

    @include media-breakpoint-down(md) {
      display: none;
    }
  }

  &__page-name {
    font-size: 16px;
    font-weight: 500;
    color: $grey-8;
    min-width: 150px;

    @include media-breakpoint-down(md) {
      min-width: auto !important;
      font-size: 14px;
    }
  }
}

.search-user {
  width: 100%;

  :deep(.q-field__control) {
    background: transparent !important;
    padding: 0;
    &::before,
    &::after {
      border: none !important;
    }
  }

  :deep(.q-field__native) {
    padding: 0;
    text-align: end;
    font-size: 15px;
  }

  :deep(.q-field__append),
  :deep(.q-field__prepend) {
    padding: 0 8px;
  }

  :deep(.q-field__label) {
    padding: 0 12px;
    pointer-events: none;
  }

  :deep(.q-field__native::placeholder) {
    color: $grey-7;
    opacity: 1;
  }
}

.search-user__options {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px;

  .q-item__label {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}

.update-bar {
  height: 72px;
  max-height: 72px;
  color: white;
  font-size: 16px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  background: linear-gradient(
    90deg,
    rgba(56, 2, 17, 1) 3%,
    rgba(61, 6, 74, 1) 29%,
    rgba(59, 9, 121, 1) 47%,
    rgba(2, 3, 89, 1) 66%,
    rgba(2, 39, 89, 1) 79%,
    rgba(2, 70, 89, 1) 97%
  );
}

.warning-bar {
  min-height: 48px;
  color: white;
  font-size: 16px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: linear-gradient(90deg, rgb(244, 60, 2) 0%, rgb(221, 6, 6) 100%);
}
</style>
