<template>
  <QDrawer
    v-model="rightDrawerOpen"
    :mini="isMiniStyle"
    side="left"
    bordered
    show-if-above
    :width="250"
    :mini-width="75"
    :breakpoint="500"
    class="layout__sidebar"
    @click.capture="handleDrawerClick"
  >
    <QScrollArea class="fit" :horizontal-thumb-style="{ opacity: 0 }">
      <div v-if="isLoading" class="sidebar__skeleton">
        <QList :class="!miniState ? 'q-pa-sm' : 'q-py-md'">
          <div v-for="index in 10" :key="index" class="skeleton-menu-item">
            <div class="skeleton-menu-item__icon">
              <QSkeleton type="circle" size="20px" />
            </div>
            <div v-if="!miniState" class="skeleton-menu-item__text">
              <QSkeleton type="text" width="100%" height="40px" />
            </div>
          </div>
        </QList>
      </div>

      <div v-else-if="isError" class="sidebar__error q-pa-md">
        <QCard flat bordered class="bg-negative-1">
          <QCardSection class="text-center">
            <QIcon name="error_outline" size="48px" color="negative" class="q-mb-sm" />
            <div class="text-h6 text-grey-9">خطا در دریافت منو</div>
            <div class="text-body2 text-grey-7 q-mt-sm q-mb-md">
              {{ getMenuErrorMessage(error) }}
            </div>
            <QBtn
              color="primary"
              label="تلاش مجدد"
              icon="refresh"
              :loading="isLoading"
              @click="retryLoadMenu"
            />
          </QCardSection>
        </QCard>
      </div>

      <QList v-else :class="!miniState ? 'q-pa-sm' : 'q-py-md'">
        <template v-for="item in filteredSubModules" :key="item.id">
          <!-- Expansion Item for Normal State -->
          <QExpansionItem
            v-if="item?.subModules?.length && !miniState"
            :label="item.title"
            :data-has-submenu="true"
          >
            <template #header>
              <div class="menu" data-has-submenu="true">
                <component
                  :is="menuIconComponents[item.icon]"
                  v-if="menuIconComponents[item.icon]"
                  :size="20"
                  stroke-width="1.5"
                />
                <IconCircle v-else :size="20" stroke-width="1.5" />
                <span>
                  {{ item.title }}
                </span>
              </div>
            </template>
            <QList>
              <QItem
                v-for="sub in item.subModules"
                :key="sub.key"
                class="menu"
                clickable
                :active="isActiveRoute(item.key, sub.key)"
                active-class="menu__active"
                :to="`/${item.key}/${sub.key}`"
              >
                <IconPointFilled :size="12" class="text-grey-6" />

                <QItemSection>
                  <Typography variant="body" size="4">
                    {{ sub.title }}
                  </Typography>
                </QItemSection>
              </QItem>
            </QList>
          </QExpansionItem>

          <!-- Popup Menu for Mini State -->
          <div v-else-if="item?.subModules?.length && miniState" class="menu-item-wrapper">
            <QBtn :id="`menu-btn-${item.id}`" flat class="menu">
              <component
                :is="menuIconComponents[item.icon]"
                v-if="menuIconComponents[item.icon]"
                :size="20"
                stroke-width="1.5"
              />
              <IconCircle v-else :size="20" stroke-width="1.5" />
              <QTooltip
                anchor="center left"
                self="center right"
                class="bg-black text-white text-body2"
              >
                {{ item.title }}
              </QTooltip>
            </QBtn>
            <QMenu
              :target="`#menu-btn-${item.id}`"
              anchor="center left"
              self="center right"
              :offset="[-10, 0]"
              content-class="expansion-popup-menu"
            >
              <QList dense class="popup-menu-list">
                <QItem
                  v-for="sub in item.subModules"
                  :key="sub.key"
                  class="popup-menu-item"
                  clickable
                  :active="isActiveRoute(item.key, sub.key)"
                  active-class="popup-menu-item--active"
                  :to="`/${item.key}/${sub.key}`"
                  dense
                >
                  <IconPointFilled :size="12" class="text-grey-6" />
                  <QItemSection>
                    <Typography variant="body" size="4">
                      {{ sub.title }}
                    </Typography>
                  </QItemSection>
                </QItem>
              </QList>
            </QMenu>
          </div>

          <QItem
            v-else
            clickable
            class="menu"
            :active="isActiveRoute(item.key, null)"
            active-class="menu__active"
            :to="{ name: item.key }"
            data-has-submenu="false"
          >
            <QTooltip
              v-if="miniState"
              anchor="center left"
              self="center right"
              class="bg-black text-white text-body2"
            >
              {{ item.title }}
            </QTooltip>
            <component
              :is="menuIconComponents[item.icon]"
              v-if="menuIconComponents[item.icon]"
              stroke-width="1.5"
              :size="20"
            />
            <IconCircle v-else :size="20" stroke-width="1.5" />
            <QItemSection :class="{ 'd-none': miniState }">
              {{ item.title }}
            </QItemSection>
          </QItem>
        </template>
      </QList>
    </QScrollArea>
    <div class="miniToggle-btn">
      <div v-if="!isMobileScreen" class="mini-toggle-btn" @click="toggleMiniState">
        <div class="mini-toggle-avatar">
          <IconChevronRight v-if="!miniState" size="20" stroke-width="1.5" color="#1976D2" />
          <IconChevronLeft v-else size="20" stroke-width="1.5" color="#1976D2" />
        </div>
      </div>
    </div>
  </QDrawer>
</template>

<script setup>
import { IconPointFilled, IconCircle, IconChevronRight, IconChevronLeft } from '@tabler/icons-vue'
import { computed, ref } from 'vue'
import { createAsyncIconComponent } from '@/utils/icon-loader'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/user'
import { useRoute } from 'vue-router'
import { useIsMobile } from '@/composables/use-is-mobile'
import Typography from '@/base/Typography'

const props = defineProps({
  filteredSubModules: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const userStore = useUserStore()
const route = useRoute()
const { isLoading, isError, error } = storeToRefs(userStore)

// state
const rightDrawerOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const miniState = ref(JSON.parse(localStorage.getItem('sidebar-mini-state') || 'false'))

// computed
const isMobileScreen = useIsMobile()
const isMiniStyle = computed(
  () => (!rightDrawerOpen.value || miniState.value) && !isMobileScreen.value
)

// Create icon components for menu items
const menuIconComponents = computed(() => {
  const icons = {}
  const modules = props.filteredSubModules
  if (!Array.isArray(modules)) return icons
  modules.forEach((item) => {
    if (item?.icon && !icons[item.icon]) {
      icons[item.icon] = createAsyncIconComponent(item.icon)
    }
  })
  return icons
})

// methods
const isActiveRoute = (itemKey, subKey) => {
  return subKey ? route.path === `/${itemKey}/${subKey}` : route.name === itemKey
}

const getMenuErrorMessage = (err) => {
  if (!err) return 'خطای نامشخص رخ داده است'

  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return 'زمان درخواست به پایان رسید'
  }

  if (err.message === 'Network Error' || !navigator.onLine) {
    return 'لطفا اتصال اینترنت خود را بررسی کنید'
  }

  if (err.response?.status === 401) {
    return 'دسترسی شما منقضی شده است'
  }

  return 'لطفا دوباره تلاش کنید'
}

const retryLoadMenu = () => {
  userStore.refetchCurrentUser()
}

const toggleMiniState = () => {
  miniState.value = !miniState.value
  localStorage.setItem('sidebar-mini-state', JSON.stringify(miniState.value))
}

const handleDrawerClick = (e) => {
  const clickedItem = e.target.closest('.q-item, .q-expansion-item__header')
  const hasSubMenu =
    clickedItem?.getAttribute('data-has-submenu') === 'true' ||
    clickedItem?.closest('[data-has-submenu="true"]')

  if (miniState.value && hasSubMenu && clickedItem) {
    miniState.value = false
    localStorage.setItem('sidebar-mini-state', 'false')
    e.stopPropagation()
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/colors';
@import '@/assets/styles/mixins';

.layout__sidebar {
  background: $grey-4;
  border-inline-end: 1px solid $grey-4;
  flex-shrink: 0;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

// Mini toggle button
.miniToggle-btn {
  position: absolute;
  top: 8px;
  left: -16px;
}

.mini-toggle-btn {
  padding: 0;
  min-height: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
}

.mini-toggle-avatar {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 2px;
  gap: 8px;
  width: 28px;
  height: 28px;
  background: #e3f2fd;
  border: 1px solid $blue-2;
  border-radius: 99px;
}

// Menu items - New Figma Style
.menu {
  color: $grey-8;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.75;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    background: $grey-2;
  }

  // Active state - New Figma design
  &__active {
    color: $primary !important;
    background-color: $blue-1 !important;
    border-color: $blue-2 !important;
    border-radius: 8px;

    &:not(.q-drawer--mini *) {
      padding: 10px 12px;
    }

    .q-drawer--mini & {
      padding: 10px;
      margin: 10px;
      justify-content: center;
    }
  }

  .q-drawer--mini & {
    width: 38px;
    height: 38px;
    margin: 0 auto !important;
    justify-content: center;
  }

  &__sub-active {
    color: $primary;
    background-color: $blue-1;
    border: 1px solid $blue-2;
    border-radius: 8px;
  }
}

.sidebar__skeleton {
  flex-grow: 1;
}

.skeleton-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  min-height: 44px;
  max-height: 44px;
  margin: 0 8px;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .q-drawer--mini & {
    margin: 0 8px;
    justify-content: center;
  }
}

.sidebar__error {
  flex-grow: 1;
  display: flex;
  align-items: flex-start;
  padding-top: 2rem;
  margin: 12em auto;
}

:deep(.q-drawer) {
  padding: 8px 0 !important;
  background: $grey-1 !important;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

  .q-item {
    padding: 10px 12px;
    border-radius: 8px;
    min-height: 44px;
    max-height: 44px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: $grey-2;
    }

    .q-item__section {
      transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  .q-expansion-item {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    .q-item {
      padding: 10px 12px;
      min-height: 44px;
      max-height: 44px;
    }

    &__content {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;

      .q-item {
        padding-inline-start: 24px;
      }
    }
  }

  .q-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  // Smooth mini state transition
  &.q-drawer--mini {
    .q-item__section {
      opacity: 0;
      width: 0;
      min-width: 0;
      overflow: hidden;
    }
  }
}

:deep(.q-expansion-item) {
  .q-focusable.q-item__section--side {
    position: absolute;
    left: 12px;
    right: auto;
    padding-left: 0;
  }

  .q-expansion-item__header {
    position: relative;
  }

  .q-drawer--mini & {
    margin: 2px 14px;
    justify-content: center;
  }
}

// Menu item wrapper for mini state popup
.menu-item-wrapper {
  position: relative;
}

.expansion-popup-menu {
  background: $grey-1;
}

.popup-menu-list {
  min-width: 200px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
}

.popup-menu-item {
  color: $grey-8;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  padding: 8px 12px;
  min-height: 36px;
  transition: all 0.2s ease;

  &:hover {
    background: $grey-2;
  }

  &--active {
    color: $primary !important;
    background-color: $blue-1 !important;
    border: 1px solid $blue-2;
  }
}
</style>
