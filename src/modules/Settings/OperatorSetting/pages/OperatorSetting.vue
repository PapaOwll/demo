<template>
  <div class="parent-advisor">
    <QCard flat class="parent-advisor__tabs">
      <p>تنظیمات کارمندان</p>
      <QTabs v-model="activeTab" align="start" active-class="text-blue-6">
        <QTab v-for="tab of tabs" :key="tab.id" :name="tab.key" :label="tab.label" />
      </QTabs>
      <QTabPanels v-model="activeTab">
        <QTabPanel v-for="tab of tabs" :key="tab.id" :name="tab.key">
          <component :is="tab.component" />
        </QTabPanel>
      </QTabPanels>
    </QCard>
  </div>
</template>
<script setup>
import RestTimeTab from '@/modules/Settings/OperatorSetting/components/RestTimeTab'
import GroupsTab from '@/modules/Settings/OperatorSetting/components/GroupsTab'
import PhoneTabs from '@/modules/Settings/OperatorSetting/components/PhoneTabs'
import { computed, ref } from 'vue'

const activeTab = ref('internalPhone')

const tabs = computed(() => [
  {
    id: 1,
    label: 'شماره داخلی',
    key: 'internalPhone',
    component: PhoneTabs,
  },
  {
    id: 2,
    label: 'گروه‌بندی',
    key: 'groups',
    component: GroupsTab,
  },
  {
    id: 3,
    label: 'زمان استراحت',
    key: 'restTime',
    component: RestTimeTab,
  },
])
</script>

<style lang="scss">
.parent-advisor {
  max-width: 990px;
  width: 100%;
  margin: auto;
  margin-top: 10px;
  &__tabs {
    margin-top: 10px;
    padding: 1.25rem;
    > p {
      font-size: 25px;
      font-weight: 800;
    }
  }
}
</style>
