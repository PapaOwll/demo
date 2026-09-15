<template>
  <QCard flat class="app-settings">
    <div class="app-settings__header row">
      <div class="col-md-7 col-12">
        <h5 class="app-settings__title">تنظیمات عمومی</h5>
      </div>
      <div class="col-md-3 col-12 flex justify-end items-baseline q-gutter-sm">
        <div>
          <QBtn round outline dense color="primary" icon="refresh" @click="refreshCurrentTab" />
        </div>
        <div>
          <QBtn
            v-if="
              getPerms('setting', 'update', true, 'generalSetting') &&
              !['tags', 'announcements', 'warranty', 'introductionMethod'].includes(activeTab)
            "
            color="primary"
            class="app-settings__save q-px-lg full-width"
            label="ذخیره تنظیمات"
            @click="saveSettings"
          />
        </div>
      </div>
    </div>

    <QTabs v-model="activeTab" class="app-settings__tab" align="left" active-color="primary">
      <QTab
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        :label="tab.label"
        class="app-settings__tab"
      />
    </QTabs>

    <QTabPanels v-model="activeTab" animated class="app-settings__panels">
      <QTabPanel v-for="tab in tabs" :key="tab.name" :name="tab.name">
        <Component
          :is="tab.component"
          :submit="tab.submitFlag"
          :refresh="refreshData[tab.refreshKey]"
          :branch-id="tab.name === 'announcements' ? userBranchId : undefined"
          @after-submit="() => (tab.submitFlag.value = false)"
          @after-refresh="resetRefreshData"
        />
      </QTabPanel>
    </QTabPanels>
  </QCard>
</template>

<script setup>
import { ref, computed, defineAsyncComponent } from 'vue'
import { getPerms } from '@/utils/get-perms'
import { useUserStore } from '@/store/user'
import { useRoleManager } from '@/composables/use-role-manager'

const userStore = useUserStore()
const userBranchId = computed(() => userStore.userData?.user?.branchId)

const activeTab = ref('survey')

const refreshData = ref({
  workTime: false,
  doctorCalendar: false,
  survey: false,
  messages: false,
  quickMessages: false,
  smsPanel: false,
  tags: false,
  announcements: false,
  introductionMethod: false,
})

const { hasAnyRole } = useRoleManager()

const allTabs = [
  // {
  //   name: 'doctorCalendar',
  //   label: 'تقویم کاری دکتر',
  //   component: defineAsyncComponent(() => import('../components/DoctorWorkCalendar')),
  //   submitFlag: ref(false),
  //   refreshKey: 'doctorCalendar',
  // },
  {
    name: 'survey',
    label: 'نظرسنجی',
    component: defineAsyncComponent(() => import('../components/SurveySettings')),
    submitFlag: ref(false),
    refreshKey: 'survey',
  },
  {
    name: 'systemMessages',
    label: 'پیامک',
    component: defineAsyncComponent(() => import('../components/SystemMessages')),
    submitFlag: ref(false),
    refreshKey: 'messages',
  },
  {
    name: 'quickMessages',
    label: 'پیام فوری',
    component: defineAsyncComponent(() => import('../components/QuickMessages')),
    submitFlag: ref(false),
    refreshKey: 'quickMessages',
  },
  {
    name: 'smsPanel',
    label: 'پنل پیامک',
    component: defineAsyncComponent(() => import('../components/SmsPanel')),
    submitFlag: ref(false),
    refreshKey: 'smsPanel',
  },
  {
    name: 'tags',
    label: 'برچسب ها',
    component: defineAsyncComponent(() => import('../components/TagSettings')),
    submitFlag: ref(false),
    refreshKey: 'tags',
  },
  {
    name: 'introductionMethod',
    label: 'شیوه آشنایی',
    component: defineAsyncComponent(() => import('../components/IntroductionMethodSettings')),
    submitFlag: ref(false),
    refreshKey: 'introductionMethod',
    roles: ['super_admin', 'marketer'],
  },
  {
    name: 'announcements',
    label: 'اعلان‌ها',
    component: defineAsyncComponent(() => import('../components/AnnouncementsTab')),
    submitFlag: ref(false),
    refreshKey: 'announcements',
  },
  {
    name: 'warranty',
    label: 'تنظیمات ضمانت‌نامه',
    component: defineAsyncComponent(() => import('../components/WarrantySettings')),
    submitFlag: ref(false),
    refreshKey: 'warranty',
  },
]

const tabs = computed(() =>
  allTabs.filter((tab) => {
    if (!tab.roles) return true
    return hasAnyRole(tab.roles)
  })
)

const currentTab = computed(() => tabs.value.find((tab) => tab.name === activeTab.value))

const saveSettings = () => {
  if (currentTab.value) {
    currentTab.value.submitFlag.value = true
  }
}

const refreshCurrentTab = () => {
  if (currentTab.value) {
    refreshData.value[currentTab.value.refreshKey] = true
  }
}

const resetRefreshData = () => {
  Object.keys(refreshData.value).forEach((key) => {
    refreshData.value[key] = false
  })
}
</script>

<style lang="scss" scoped>
.app-settings {
  margin: 1rem auto 0;
  padding: 2rem;
  border-radius: $button-push-border-radius;

  &__title {
    font-weight: map-get($text-weights, bold);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
  }

  &__save {
    border-radius: $generic-border-radius;
  }

  &__tab {
    font-weight: map-get($text-weights, bold);
  }

  &__panels {
    padding-top: 1rem;
  }
}
</style>
