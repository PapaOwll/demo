<template>
  <div class="col-md-12 col-12 q-my-xs">
    <Typography variant="heading" size="h6" weight="bold">پرونده پزشکی</Typography>
    <QTabs
      v-model="tabIndex"
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
    <QTabPanels v-model="tabIndex" animated class="tab-panels">
      <QTabPanel v-for="tab in tabs" :key="tab.index" class="q-pa-none" :name="tab.index">
        <component :is="tab.component" v-if="tabIndex === tab.index" :prop-data="tab.data" />
      </QTabPanel>
    </QTabPanels>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, ref } from 'vue'
import Typography from '@/base/Typography'

const props = defineProps({
  propData: {
    type: [Object, Array],
    default: () => {},
  },
  tabId: {
    type: Number,
    default: 1,
  },
})
const tabIndex = ref(1)
const medicalInfo = defineAsyncComponent(() => import('./components/UserMedicalInfo'))
const UserRadiologyImages = defineAsyncComponent(() => import('./components/UserRadiologyImages'))
const UserOpgRequests = defineAsyncComponent(() => import('./components/UserOpgRequest'))

const tabs = computed(() => [
  {
    index: 1,
    title: 'اطلاعات کلی',
    data: props.propData?.id,
    component: medicalInfo,
  },
  {
    index: 2,
    title: 'مدارک پزشکی',
    data: props.propData,
    component: UserRadiologyImages,
  },
  {
    index: 3,
    title: 'نسخه‌های پزشک',
    data: props.propData,
    component: UserOpgRequests,
  },
])
</script>

<style scoped lang="scss">
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
  margin: 20px 0;
}

.tab-panels {
  height: 70vh;

  ::-webkit-scrollbar {
    width: 0;
  }
}
</style>
