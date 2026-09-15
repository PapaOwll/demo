<template>
  <div
    class="dialog-box"
    :style="{ '--user-details-header-height': headerHeight ? `${headerHeight}px` : '0px' }"
  >
    <div ref="headerRef" class="user-details__header">
      <QBtn flat round class="user-details__close" @click="closeDialog">
        <IconX />
      </QBtn>

      <TabItem
        v-model="localTabIndex"
        :group="tabs"
        label-key="title"
        class="user-details-tabs"
        style-type="underline"
      />
    </div>

    <QTabPanels v-model="localTabIndex" animated class="activity-panel">
      <QTabPanel v-for="tab in tabs" :key="tab.index" class="tab-panels" :name="tab.index">
        <component :is="tab.component" v-if="localTabIndex === tab.index" :prop-data="tab.data" />
      </QTabPanel>
    </QTabPanels>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, h, onBeforeUnmount, onMounted, ref, toRefs } from 'vue'
import { QInnerLoading, QSpinnerTail } from 'quasar'
import { IconX } from '@tabler/icons-vue'
import TabItem from '@/base/TabItem'

const props = defineProps({
  userData: {
    type: Object,
    default: () => ({}),
  },
  tabIndex: {
    type: Number || String,
    default: 0,
  },
})

const emits = defineEmits(['close', 'update:tabIndex'])

const { tabIndex } = toRefs(props)

const localTabIndex = ref(tabIndex.value)

const headerRef = ref(null)
const headerHeight = ref(0)
let headerResizeObserver = null

const measureHeader = () => {
  if (headerRef.value) headerHeight.value = headerRef.value.offsetHeight
}

onMounted(() => {
  measureHeader()
  if (typeof ResizeObserver !== 'undefined' && headerRef.value) {
    headerResizeObserver = new ResizeObserver(measureHeader)
    headerResizeObserver.observe(headerRef.value)
  }
})

onBeforeUnmount(() => {
  headerResizeObserver?.disconnect?.()
})

const AsyncLoadingComponent = {
  name: 'AsyncLoadingComponent',

  render() {
    return h(
      'div',
      {
        class: 'async-loading-wrapper',
      },
      [
        h(
          QInnerLoading,
          {
            showing: true,
            class: 'q-mx-auto q-my-auto',
          },
          {
            default: () => [
              h(QSpinnerTail, {
                color: 'primary',
                size: '60px',
              }),
            ],
          }
        ),
      ]
    )
  },
}

const createAsyncComponent = (loader) =>
  defineAsyncComponent({
    loader,
    loadingComponent: AsyncLoadingComponent,
    delay: 150,
    timeout: 10_000,
    suspensible: false,
    onError(error, retry, fail, attempts) {
      if (attempts <= 2) {
        retry()
        return
      }

      fail(error)
    },
  })

const UserFinancial = createAsyncComponent(
  () =>
    import('@/modules/User/components/UserDetails/UserDetailsComponents/Financial/UserFinancialTabs')
)

const UserInformation = createAsyncComponent(
  () =>
    import('@/modules/User/components/UserDetails/UserDetailsComponents/Information/UserInformation')
)

const UserMedicalDocument = createAsyncComponent(
  () =>
    import('@/modules/User/components/UserDetails/UserDetailsComponents/UserMedicalDocs/UserMedicalDocument')
)

const UserTp = createAsyncComponent(
  () => import('@/modules/User/components/UserDetails/UserDetailsComponents/UserTp/UserTp')
)

const UserWarranties = createAsyncComponent(
  () => import('@/modules/User/components/UserDetails/UserDetailsComponents/UserWarranties')
)

const UserActivity = createAsyncComponent(
  () =>
    import('@/modules/User/components/UserDetails/UserDetailsComponents/UserActivity/UserActivity')
)

const tabs = computed(() => [
  {
    index: 0,
    title: 'اطلاعات کلی',
    data: props.userData,
    component: UserInformation,
  },
  {
    index: 1,
    title: 'فعالیت ها',
    data: props.userData,
    component: UserActivity,
  },
  {
    index: 2,
    title: 'پرونده پزشکی',
    data: props.userData,
    component: UserMedicalDocument,
  },
  {
    index: 3,
    title: 'طرح درمان',
    data: props.userData?.id,
    component: UserTp,
  },
  {
    index: 4,
    title: 'ضمانتنامه',
    data: props.userData?.id,
    component: UserWarranties,
  },
  {
    index: 6,
    title: 'اطلاعات مالی',
    data: props.userData?.id,
    component: UserFinancial,
  },
])

const closeDialog = () => {
  emits('close', false)
}
</script>

<style scoped lang="scss">
.async-loading-wrapper {
  position: relative;
  min-height: 70vh;
}

.dialog-box {
  background-color: transparent;
  border-radius: 6px;
  position: relative;
  padding-right: 16px;
}

.user-details__header {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: $grey-2;
  margin-right: -16px;
  padding-right: 16px;
}

.user-details__close {
  position: absolute;
  top: -1px;
  left: 16px;
  z-index: 1;
}

.user-details-tabs {
  :deep(.q-tabs) {
    overflow: visible !important;
  }

  :deep(.q-tabs__content) {
    justify-content: flex-start;
    flex-wrap: wrap;
    overflow: visible !important;
  }

  :deep(.q-tab) {
    flex: 0 0 auto;
  }

  :deep(.q-tabs__arrow) {
    display: none !important;
  }
}

// The panel itself stays at natural height. Scrolling is handled by the modal
// body (fixed height) so nested tab pages can keep their own scroll behavior.
.activity-panel {
  border-radius: $radius-lg;
}
</style>
