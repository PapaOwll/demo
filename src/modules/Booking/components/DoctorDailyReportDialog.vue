<template>
  <QDialog
    :model-value="visible"
    transition-show="slide-down"
    transition-hide="slide-up"
    @update:model-value="closeModal"
    @escape-key="closeModal"
  >
    <QCard flat class="ddr">
      <div class="form-header">
        <Typography variant="heading" size="h6">دریافت شرح درمان روزانه پزشک</Typography>
        <Button
          variant="flat"
          is-icon-only
          :left-icon="IconX"
          color="grey"
          is-rounded
          @click="closeModal"
        />
      </div>
      <div class="ddr__body">
        <div class="ddr__body-item">
          <AdvisorSelect
            :model-value="doctorReportData.doctor"
            label="پزشک"
            placeholder=""
            :dense="false"
            option-value="rawData"
            :user-role="['doctor']"
            :error-message="errors.doctor || null"
            @update:model-value="(e) => handleChange('doctor', e)"
          />
        </div>
        <div class="ddr__body-item">
          <PersianDate
            :model-value="doctorReportData.date"
            label="تاریخ"
            :dense="false"
            :error-message="errors.date || null"
            @update:model-value="(e) => handleChange('date', e)"
          />
        </div>
      </div>
      <div class="ddr__actions">
        <Button variant="outline" color="dark" text="انصراف" @click="closeModal" />
        <Button
          variant="filled"
          color="blue"
          text="ثبت"
          :is-disabled="!isFormValid"
          @click="getDoctorReport"
        />
      </div>
    </QCard>
  </QDialog>
</template>

<script setup>
import { computed, ref, toRefs } from 'vue'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import { IconX } from '@tabler/icons-vue'
import { Notif } from '@/data/services/notification-service'
import { useRouter } from 'vue-router'
import PersianDate from '@/components/Form/PersianDate'
import AdvisorSelect from '@/components/Form/AdvisorSelect'
import { object, string } from 'yup'
import useYup from '@/composables/use-yup'
import { useNavigationStore } from '@/store/navigation'
import { formatDate } from '@/utils/date-utils'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})
const emits = defineEmits(['close', 'submit'])
const { visible } = toRefs(props)
const router = useRouter()
const navigationStore = useNavigationStore()

const defaultValue = {
  date: undefined,
  doctor: undefined,
}
const updatedReportData = ref(null)
const doctorReportData = computed(() => updatedReportData.value || defaultValue || {})

const validationSchema = object().shape({
  doctor: object()
    .shape({
      name: string(),
      id: string().required(),
    })
    .required('پزشک مورد نظر را انتخاب کنید'),
  date: string().required('تاریخ مورد نظر را انتخاب کنید'),
})

const { validate, validateAt, errors } = useYup(validationSchema)

const isFormValid = computed(() => {
  return (
    doctorReportData.value.doctor?.id &&
    doctorReportData.value.date &&
    !errors.value.doctor &&
    !errors.value.date
  )
})

const handleChange = (field, value) => {
  updatedReportData.value = { ...doctorReportData.value, [field]: value }
  validateAt(field, value)
}

const getDoctorReport = async () => {
  const { isValid, payload } = await validate(doctorReportData.value)
  if (!isValid) return
  const data = {
    date: formatDate(payload.date || Date.now(), 'YYYY-MM-DD'),
    doctor: payload.doctor,
  }
  const stored = navigationStore.setTpDescriptionData(data)
  if (!stored) {
    Notif.error('ذخیره داده نوبت برای چاپ پرونده انجام نشد')
    return
  }

  Notif.info('گزارش روزانه پزشک در حال آماده‌سازی است')
  const route = router.resolve({ name: 'doctor-tpd-form' })
  window.open(route.href, '_blank')
}

const closeModal = () => {
  updatedReportData.value = null
  emits('close')
}
</script>
<style scoped lang="scss">
.ddr {
  width: 550px;
  padding: $spacing-lg;
  border-radius: $radius-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-3xl;
  &__body {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    &-item:first-child {
      width: 60%;
    }
    &-item:last-child {
      width: 40%;
    }
  }
  &__actions {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: $spacing-md;
  }
}
</style>
