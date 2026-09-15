<template>
  <BaseModal
    :model-value="visible"
    :title="safeEditValue.id ? 'ویرایش شعبه' : 'افزودن شعبه'"
    persistent
    :show-close="!isStatusSubmitting"
    :width="1000"
    transition-show="slide-down"
    transition-hide="slide-up"
    class="branches-tabs"
    @close="closeForm"
    @before-show="onOpenForm"
  >
    <QTabs
      v-model="activeTab"
      dense
      class="branches-tabs__navigation"
      align="justify"
      narrow-indicator
      active-color="primary"
      indicator-color="primary"
    >
      <QTab name="general" label="اطلاعات کلی" class="branches-tabs__tab" />
      <QTab
        :disable="!safeEditValue.id"
        class="branches-tabs__tab"
        label="تقویم هفتگی"
        name="settings"
      />
      <QTab
        :disable="!safeEditValue.id"
        class="branches-tabs__tab"
        label="تقویم کاری شعبه"
        name="permissions"
      />
      <QTab
        :disable="!safeEditValue.id"
        class="branches-tabs__tab"
        label="مکان‌ها"
        name="locations"
      />
      <QTab
        :disable="!safeEditValue.id"
        class="branches-tabs__tab"
        label="ساعت کاری پزشکان"
        name="doctors"
      />
      <QTab
        :disable="!safeEditValue.id"
        class="branches-tabs__tab"
        label="وضعیت شعبه"
        name="status"
      />
    </QTabs>

    <QTabPanels v-model="activeTab" animated class="branches-tabs__panels">
      <QTabPanel name="general" class="branches-tabs__panel">
        <GeneralInformation
          ref="generalInfoRef"
          :edit-value="safeEditValue"
          @close="closeForm"
          @after-submit="handleAfterSubmit"
          @saved="handleSaved"
        />
      </QTabPanel>

      <QTabPanel name="settings" class="branches-tabs__panel">
        <WorkWeeklyCalendar
          ref="weeklyCalendarRef"
          :branch-id="safeEditValue?.id"
          @after-submit="handleWeeklyAfterSubmit"
        />
      </QTabPanel>

      <QTabPanel name="permissions" class="branches-tabs__panel">
        <WorkMonthlyCalendar ref="monthlyCalendarRef" :branch-id="safeEditValue?.id" />
      </QTabPanel>

      <QTabPanel name="locations" class="branches-tabs__panel">
        <LocationsTab ref="locationsTabRef" :branch-id="safeEditValue?.id" />
      </QTabPanel>

      <QTabPanel name="doctors" class="branches-tabs__panel">
        <BranchDoctors ref="branchDoctorsRef" :branch-id="safeEditValue?.id" />
      </QTabPanel>

      <QTabPanel name="status" class="branches-tabs__panel">
        <BranchStatusTab
          ref="branchStatusRef"
          :branch-id="safeEditValue?.id"
          :branch="safeEditValue"
          @saved="handleSaved"
        />
      </QTabPanel>
    </QTabPanels>

    <template #footer>
      <div class="branches-tabs__actions">
        <Button
          variant="outline"
          color="primary"
          :is-loading="isLoading"
          :is-disabled="isLoading || isStatusSubmitting"
          class="branches-tabs__cancel-btn"
          text="انصراف"
          @click="closeForm"
        />
        <Button
          variant="filled"
          color="primary"
          :is-loading="isLoading || isStatusSubmitting"
          :is-disabled="
            isLoading || (activeTab === 'general' && isPhoneNumberInvalid) || isStatusSubmitDisabled
          "
          class="branches-tabs__submit-btn"
          text="ثبت تغییرات"
          @click="handleSubmit"
        />
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, toRefs, computed } from 'vue'
import BaseModal from '@/base/Modal'
import Button from '@/base/Button'
import GeneralInformation from './GeneraInformation'
import WorkMonthlyCalendar from './WorkMonthlyCalendar'
import WorkWeeklyCalendar from '../../GeneralSettings/components/WorkWeeklyCalendar'
import BranchDoctors from '@/modules/Settings/ClinicSetting/components/BranchDoctors'
import LocationsTab from './LocationsTab'
import BranchStatusTab from './BranchStatusTab'

const emits = defineEmits(['close', 'afterSubmit', 'saved'])
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  editValue: {
    type: Object,
    default: () => ({}),
  },
})

const { visible } = toRefs(props)
const activeTab = ref('general')
const generalInfoRef = ref(null)
const isLoading = ref(false)
const weeklyCalendarRef = ref(null)
const monthlyCalendarRef = ref(null)
const branchDoctorsRef = ref(null)
const locationsTabRef = ref(null)
const branchStatusRef = ref(null)

const safeEditValue = computed(() => props.editValue ?? {})

const isPhoneNumberInvalid = computed(() => {
  return generalInfoRef.value?.isPhoneNumberInvalid || false
})

const isStatusSubmitDisabled = computed(() => {
  if (activeTab.value !== 'status') return false
  const statusRef = branchStatusRef.value
  return !statusRef || !statusRef.hasChanges || !!statusRef.isSubmitting
})

const isStatusSubmitting = computed(
  () => activeTab.value === 'status' && !!branchStatusRef.value?.isSubmitting
)

const onOpenForm = () => {
  activeTab.value = 'general'
  branchStatusRef.value?.reset?.()
}

const closeForm = () => {
  emits('close')
}

const handleAfterSubmit = () => {
  activeTab.value = 'general'
  emits('afterSubmit')
}

const handleSaved = () => {
  emits('saved')
}

const handleSubmit = () => {
  try {
    if (activeTab.value === 'general' && generalInfoRef.value) {
      generalInfoRef.value?.submitForm()
      return
    }

    if (activeTab.value === 'settings') {
      weeklyCalendarRef.value?.submit()
      return
    }

    if (activeTab.value === 'permissions') {
      monthlyCalendarRef.value?.saveHolidays()
      return
    }

    if (activeTab.value === 'locations') {
      locationsTabRef.value?.submit()
      return
    }

    if (activeTab.value === 'doctors' && typeof branchDoctorsRef.value?.submit === 'function') {
      branchDoctorsRef.value.submit()
      return
    }

    if (activeTab.value === 'status' && typeof branchStatusRef.value?.submit === 'function') {
      branchStatusRef.value.submit()
    }
  } catch (error) {
    console.error('BranchesTabs handleSubmit error:', error)
  }
}

const handleWeeklyAfterSubmit = () => {
  emits('afterSubmit')
}
</script>

<style scoped lang="scss">
// BaseModal adaptations: keep the previous fixed-width / scrollable layout
.branches-tabs {
  :deep(.modal) {
    max-width: 95vw;
    max-height: 80vh;
  }

  :deep(.modal__body) {
    flex: 1 1 0;
    min-height: 0;
  }
}

.branches-tabs {
  &__navigation {
    flex-shrink: 0;
  }

  &__tab {
    font-weight: map-get($body2, weight);
    min-height: 48px;
  }

  &__panels {
    flex: 1;
    overflow-y: auto;
  }

  &__panel {
    min-height: 400px;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: map-get($space-sm, x);
    width: 100%;
  }

  &__submit-btn,
  &__cancel-btn {
    min-width: 120px;
    font-weight: map-get($body2, weight);
  }

  &__submit-btn {
    order: 2;
  }

  &__cancel-btn {
    order: 1;
  }
}
</style>
