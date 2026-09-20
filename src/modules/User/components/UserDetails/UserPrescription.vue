<template>
  <Modal
    :model-value="visible"
    title="افزودن نسخه"
    class="prescription"
    :width="560"
    height="650px"
    @update:model-value="closeForm"
  >
    <div class="prescription__body">
      <TabItem v-model="activeTab" class="prescription__tabs" :group="tabItems" />

      <div v-if="!userData?.nationalCode" class="prescription__national-code">
        <div class="prescription__foreign-toggle">
          <Toggle v-model="isForeignNational" label="اتباع است؟" />
        </div>
        <TextField
          v-model="nationalCode"
          :label="isForeignNational ? 'کد فراگیر/ فیدا/ پاسپورت' : 'کد ملی بیمار'"
          required
          variant="outline"
          clearable
          :maxlength="nationalCodeMaxLength"
          :error="!!errors.nationalCode"
          :error-message="errors.nationalCode"
        />
      </div>

      <div v-if="activeTab === TABS.IMAGING" class="prescription__form">
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
          :error="!!errors.imagingSrvId"
          :error-message="errors.imagingSrvId"
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
            با {{ isForeignNational ? 'کد فراگیر/ فیدا/ پاسپورت' : 'شماره ملی' }}
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
          :error="!!errors.prescriptionReason"
          :error-message="errors.prescriptionReason"
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
          :error="!!errors.selectedMedicines"
          :error-message="errors.selectedMedicines"
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
import Toggle from '@/base/Toggle'
import { useApiSendOpgRequest, useApiSendDrugPrescription } from '@/modules/User/query/index'
import { useApiGetSettings } from '@/modules/Settings/query'
import { convertToEnNumber, extractNumbers } from '@/utils/convert-check-digits'
import { Notif } from '@/data/services/notification-service'
import { useQueryClient } from '@tanstack/vue-query'
import { array, mixed, object, string } from 'yup'
import useYup from '@/composables/use-yup'

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
const isForeignNational = ref(false)
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

const selectedImaging = computed(() =>
  imagingOptions.value.find((item) => item.srvId === imagingSrvId.value)
)

const reasonDrugs = computed(() => prescriptionReason.value?.drugs ?? [])
const filteredMedicineOptions = ref([])

watch(
  reasonDrugs,
  (drugs) => {
    filteredMedicineOptions.value = [...drugs]
    selectedMedicines.value = [...drugs]
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

watch(
  () => props.userData?.nationalCode,
  (val) => {
    nationalCode.value = val || ''
  },
  { immediate: true }
)

const nationalCodeMaxLength = computed(() => (isForeignNational.value ? 16 : 10))

watch(nationalCode, (val) => {
  const sanitized = extractNumbers(val).slice(0, nationalCodeMaxLength.value)
  if (sanitized !== val) {
    nationalCode.value = sanitized
  }
})

const displayNationalCode = computed(
  () => convertToEnNumber(nationalCode.value) || convertToEnNumber(props.userData?.nationalCode)
)

watch(isForeignNational, () => {
  if (nationalCode.value.length > nationalCodeMaxLength.value) {
    nationalCode.value = nationalCode.value.slice(0, nationalCodeMaxLength.value)
  }
})

const formData = computed(() => ({
  nationalCode: displayNationalCode.value,
  isForeignNational: isForeignNational.value,
  activeTab: activeTab.value,
  imagingSrvId: imagingSrvId.value,
  prescriptionReason: prescriptionReason.value,
  selectedMedicines: selectedMedicines.value,
}))

const validationSchema = object().shape({
  nationalCode: string()
    .nullable()
    .required('کد ملی بیمار الزامیست')
    .matches(/^\d*$/, 'مقدار باید عدد باشد')
    .test('nationalCode-max-length', function (value) {
      const { isForeignNational: foreign } = this.parent
      if (!value) return true
      const maxLength = foreign ? 16 : 10
      const message = foreign
        ? 'کد فراگیر/ فیدا/ پاسپورت حداکثر 16 رقم است'
        : 'کدملی حداکثر 10 رقم است'
      return value.length <= maxLength || this.createError({ message })
    }),
  isForeignNational: mixed().nullable(),
  activeTab: mixed().nullable(),
  imagingSrvId: mixed()
    .nullable()
    .test('imaging-required', 'نوع تصویربرداری الزامیست', function (value) {
      if (this.parent.activeTab !== 'imaging') return true
      return value != null
    }),
  prescriptionReason: mixed()
    .nullable()
    .test('reason-required', 'علت تجویز دارو الزامیست', function (value) {
      if (this.parent.activeTab === 'imaging') return true
      return !!value
    }),
  selectedMedicines: array()
    .nullable()
    .test('medicines-required', 'انتخاب حداقل یک دارو الزامیست', function (value) {
      if (this.parent.activeTab === 'imaging') return true
      return value?.length > 0
    }),
})

const { validate, validateAt, errors, resetErrors } = useYup(validationSchema)

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

const onSendImagingRequest = (code) => {
  sendOpgRequest(
    {
      id: props.userData?.id,
      nationalCode: code,
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

const onSendDrugRequest = (code) => {
  sendDrugPrescription(
    {
      id: props.userData?.id,
      nationalCode: code,
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

const onSubmit = async () => {
  const { isValid, payload } = await validate(formData.value)
  if (!isValid) {
    Notif.error('لطفا خطاهای فرم را برطرف کنید')
    return
  }
  if (activeTab.value === TABS.IMAGING) {
    onSendImagingRequest(payload.nationalCode)
  } else {
    onSendDrugRequest(payload.nationalCode)
  }
}

const resetForm = () => {
  nationalCode.value = ''
  isForeignNational.value = false
  imagingSrvId.value = null
  prescriptionReason.value = null
  selectedMedicines.value = []
  filteredMedicineOptions.value = []
  activeTab.value = props.initialTab
  resetErrors()
}

const closeForm = () => {
  resetForm()
  emits('close')
}

watch(nationalCode, () => {
  // Skip live validation while the modal is closed so resetForm's clearing
  // doesn't leave a stale "required" error for the next open.
  if (!props.visible) return
  validateAt('nationalCode', displayNationalCode.value, formData.value)
})

watch(imagingSrvId, (val) => {
  validateAt('imagingSrvId', val, formData.value)
})

watch(prescriptionReason, (val) => {
  validateAt('prescriptionReason', val, formData.value)
})

watch(selectedMedicines, (val) => {
  validateAt('selectedMedicines', val, formData.value)
})

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

  &__national-code {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__foreign-toggle {
    display: flex;
    justify-content: flex-start;
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
