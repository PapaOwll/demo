<template>
  <div class="row">
    <Typography variant="heading" size="h6" weight="bold" class="tab-card_title">
      فعالیت ها
    </Typography>
    <div class="col-md-12 col-12">
      <QTabs
        v-model="tabId"
        dense
        class="activity-tabs"
        align="justify"
        narrow-indicator
        indicator-color="blue"
        active-class="active-tab"
      >
        <QTab v-for="tab in tabs" :key="tab.index" :name="tab.index" class="tab-card">
          <template #default>
            <span class="flex items-center text-body2 text-bold">
              {{ tab.title }}
            </span>
          </template>
        </QTab>
      </QTabs>
      <QTabPanels v-model="tabId" animated keep-alive class="tab-panels">
        <QTabPanel v-for="tab in tabs" :key="tab.index" class="q-pa-none" :name="tab.index">
          <component :is="tab.component" :prop-data="tab.data" />
        </QTabPanel>
      </QTabPanels>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, defineAsyncComponent } from 'vue'
import Typography from '@/base/Typography'

const UserBookings = defineAsyncComponent(() => import('./components/UserBookings'))
const UserTasks = defineAsyncComponent(() => import('./components/UserTasks'))
const UserContacts = defineAsyncComponent(() => import('./components/UserContacts'))
const UserAttendance = defineAsyncComponent(() => import('./components/UserAttendance'))
const UserHistory = defineAsyncComponent(() => import('./components/UserHistory'))
const UserMessages = defineAsyncComponent(() => import('./components/UserMessages'))

const props = defineProps({
  propData: {
    type: Object || Array,
    required: true,
  },
})
const tabId = ref(1)
const tabs = computed(() => [
  {
    index: 1,
    title: 'تماس ها',
    data: props.propData?.id,
    component: UserContacts,
  },
  {
    index: 2,
    title: 'نوبت ها',
    data: props.propData?.id,
    component: UserBookings,
  },
  {
    index: 3,
    title: 'وظایف',
    data: props.propData?.id,
    component: UserTasks,
  },
  {
    index: 4,
    title: 'تردد',
    data: props.propData?.id,
    component: UserAttendance,
  },

  {
    index: 5,
    title: 'تاریخچه',
    data: props.propData?.id,
    component: UserHistory,
  },
  {
    index: 6,
    title: 'پیام ها',
    data: props.propData?.id,
    component: UserMessages,
  },
])
</script>

<style scoped lang="scss">
.tab-card_title {
  margin: map-get($space-sm, x);
}
.tab-card {
  background-color: $gray-050;
  color: $black;
  padding: 4px 12px;

  &:first-child {
    border: none;
    border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
  }

  &:last-child {
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
  }
}

.active-tab {
  color: $white;
  background-color: $blue;
}

.activity-tabs {
  max-width: max-content;
  color: $dark;
}

.tab-panels {
  height: 70vh;

  ::-webkit-scrollbar {
    width: 0;
  }
}
</style>
