<template>
  <Modal
    :model-value="visible"
    title="افزودن نسخه"
    class="prescription"
    :width="560"
    height="650px"
    @update:model-value="emits('close')"
    @close="closeForm"
  >
    <div class="prescription__body">
      <TabItem v-model="activeTab" class="prescription__tabs" :group="tabItems" />

      <div v-if="activeTab === TABS.IMAGING" class="prescription__form">
        <TextField
          v-if="!userData?.nationalCode"
          v-model="nationalCode"
          label="کد ملی بیمار"
          required
          variant="outline"
          clearable
        />
        <SelectField
          v-model="imagingSrvId"
          :options="imagingOptions"
          option-label="title"
          option-value="srvId"
          emit-value
          map-options
          clearable
          label="نوع تصویربرداری"
          variant="outline"
          required
          :loading="isSettingsLoading"
        />
        <div v-if="selectedImaging" class="prescription__info">
          <div class="prescription__info-header">
            <IconAlertCircle class="prescription__info-icon" size="18" />
            <Typography variant="body" size="4" weight="bold">درخواست تصویربرداری</Typography>
          </div>
          <Typography variant="body" size="4" color="body">
            درخواست
            <Typography variant="body" size="4" weight="bold" color="light-blue" tag="span">
              {{ selectedImaging?.title }}
            </Typography>
            برای کاربر
            <Typography variant="body" size="4" weight="bold" color="light-blue" tag="span">
              {{ userData?.name }}
            </Typography>
            با شماره ملی
            <Typography variant="body" size="4" weight="bold" color="light-blue" tag="span">
              {{ displayNationalCode }}
            </Typography>
            ثبت خواهد شد
          </Typography>
        </div>
      </div>

      <div v-else class="prescription__form">
        <SelectField
          v-model="prescriptionReason"
          :options="reasonOptions"
          option-label="title"
          label="علت تجویز دارو"
          variant="outline"
          required
          clearable
          :loading="isSettingsLoading"
        />
        <SelectField
          v-model="selectedMedicines"
          :options="filteredMedicineOptions"
          option-label="name"
          label="نام دارو"
          variant="outline"
          multiple
          use-chips
          use-input
          :search-fn="filterMedicines"
          required
          :disable="!prescriptionReason"
          :placeholder="prescriptionReason ? 'جستجوی دارو...' : 'ابتدا علت تجویز را انتخاب کنید'"
        />
      </div>
    </div>

    <template #footer>
      <div class="prescription__actions">
        <Button variant="outline" text="انصراف" color="dark" is-full-width @click="closeForm" />
        <Button
          text="ثبت نسخه"
          is-full-width
          :is-loading="isImagingPending || isDrugPending"
          :is-disabled="!isFormValid"
          @click="onSubmit"
        />
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { IconAlertCircle } from '@tabler/icons-vue'
import Modal from '@/base/Modal'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import TextField from '@/base/TextField'
import SelectField from '@/base/SelectField'
import TabItem from '@/base/TabItem'
import { useApiSendOpgRequest, useApiSendDrugPrescription } from '@/modules/User/query/index'
import { useApiGetSettings } from '@/modules/Settings/query'
import { convertToEnNumber } from '@/utils/convert-check-digits'
import { Notif } from '@/data/services/notification-service'
import { useQueryClient } from '@tanstack/vue-query'

const TABS = {
  IMAGING: 'imaging',
  DRUG: 'drug',
}

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  userData: {
    type: Object,
    default: null,
  },
  initialTab: {
    type: String,
    default: 'drug',
    validator: (value) => ['drug', 'imaging'].includes(value),
  },
})
const emits = defineEmits(['close'])

const queryClient = useQueryClient()

const { data: prescriptionSettings, isLoading: isSettingsLoading } =
  useApiGetSettings('medicalPrescriptions')

const activeTab = ref(props.initialTab)
const nationalCode = ref('')
const imagingSrvId = ref(null)
const prescriptionReason = ref(null)
const selectedMedicines = ref([])

const tabItems = [
  { value: TABS.DRUG, label: 'دارو' },
  { value: TABS.IMAGING, label: 'تصویربرداری' },
]

const reasonOptions = computed(
  () => prescriptionSettings.value?.drugs?.filter((reason) => reason.isActive) ?? []
)

const imagingOptions = computed(
  () => prescriptionSettings.value?.imaging?.filter((item) => item.isActive) ?? []
)

// Identified by srvId (not the kind string) so the whole flow — selection,
// validation and payload — carries the service id the backend expects.
const selectedImaging = computed(() =>
  imagingOptions.value.find((item) => item.srvId === imagingSrvId.value)
)

const reasonDrugs = computed(() => prescriptionReason.value?.drugs ?? [])
const filteredMedicineOptions = ref([])

watch(
  reasonDrugs,
  (drugs) => {
    filteredMedicineOptions.value = [...drugs]
    selectedMedicines.value = []
  },
  { immediate: true }
)

const filterMedicines = (val, update) => {
  update(() => {
    const needle = val.trim().toLowerCase()
    filteredMedicineOptions.value = reasonDrugs.value.filter((drug) =>
      drug.name?.toLowerCase().includes(needle)
    )
  })
}

const resetForm = () => {
  nationalCode.value = ''
  imagingSrvId.value = null
  prescriptionReason.value = null
  activeTab.value = props.initialTab
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      activeTab.value = props.initialTab
    } else {
      resetForm()
    }
  }
)

watch(
  () => props.userData?.nationalCode,
  (val) => {
    nationalCode.value = val || ''
  },
  { immediate: true }
)

const displayNationalCode = computed(
  () => convertToEnNumber(nationalCode.value) || convertToEnNumber(props.userData?.nationalCode)
)

const isFormValid = computed(() => {
  if (activeTab.value === TABS.IMAGING) {
    return !!imagingSrvId.value && !!displayNationalCode.value
  }
  return !!prescriptionReason.value && selectedMedicines.value?.length > 0
})

const { mutate: sendOpgRequest, isPending: isImagingPending } = useApiSendOpgRequest({
  onError: undefined,
})
const { mutate: sendDrugPrescription, isPending: isDrugPending } = useApiSendDrugPrescription({
  onError: undefined,
})

const invalidatePrescriptions = () => {
  queryClient.invalidateQueries({ queryKey: ['users', 'all-users'] })
  queryClient.invalidateQueries({ queryKey: ['user', 'opg-list'] })
}

const notifySuccess = (response) => {
  Notif.success(response?.message || 'نسخه ثبت شد', {
    caption: 'نسخه با موفقیت ثبت شد.',
    position: 'bottom-right',
    timeout: 5000,
  })
}

const notifyError = (error) => {
  Notif.error(error?.response?.data?.message || 'خطا در ثبت نسخه', {
    caption: 'لطفاً دوباره تلاش کنید.',
    position: 'bottom-left',
    timeout: 5000,
  })
}

const onSendImagingRequest = () => {
  sendOpgRequest(
    {
      id: props.userData?.id,
      nationalCode: displayNationalCode.value,
      srvId: imagingSrvId.value,
    },
    {
      onSuccess: (response) => {
        notifySuccess(response)
        invalidatePrescriptions()
        emits('close')
      },
      onError: notifyError,
    }
  )
}

const onSendDrugRequest = () => {
  sendDrugPrescription(
    {
      id: props.userData?.id,
      nationalCode: convertToEnNumber(props.userData?.nationalCode),
      items: selectedMedicines.value.map((drug) => ({ srvId: drug.srvId })),
    },
    {
      onSuccess: (response) => {
        notifySuccess(response)
        invalidatePrescriptions()
        emits('close')
      },
      onError: notifyError,
    }
  )
}

const onSubmit = () => {
  if (activeTab.value === TABS.IMAGING) {
    onSendImagingRequest()
  } else {
    onSendDrugRequest()
  }
}

const closeForm = () => {
  resetForm()
  emits('close')
}
</script>

<style scoped lang="scss">
.prescription {
  &__body {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__tabs {
    align-self: center;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border: 1px solid $default-border;
    border-radius: $radius-md;
  }

  &__info-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: $spacing-sm;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: $spacing-md;
    width: 100%;
  }
}
</style>
