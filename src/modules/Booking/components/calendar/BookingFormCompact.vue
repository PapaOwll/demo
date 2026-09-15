<template>
  <div
    v-if="visible"
    class="booking-popup__anchor"
    :style="{ left: `${anchorX}px`, top: `${anchorY}px` }"
  >
    <QPopupProxy
      ref="proxyRef"
      transition-show="scale"
      transition-hide="scale"
      :offset="[-20, 5]"
      @before-show="handleDialogOpen"
      @before-hide="closeForm"
    >
      <div class="booking-popup">
        <div class="booking-popup__header">
          <Typography variant="heading" size="h5" class="booking-popup__title">
            {{ visitTypeTitle ? formTitle + ' ' + visitTypeTitle : formTitle }}
          </Typography>
        </div>

        <QForm class="booking-popup__body" @submit.prevent="submitForm">
          <div class="booking-popup__section">
            <UserSelectField
              :model-value="userSelectModelValue"
              label="کاربر"
              placeholder="جستجو با نام، موبایل، کد ملی، شماره پرونده"
              :error-message="errors?.user"
              :emit-value="false"
              @update:model-value="handleUserSelect"
            />
          </div>

          <div class="booking-popup__section">
            <PersianDate
              label="تاریخ نوبت"
              :model-value="bookingData.bookingAt"
              :disable="!selectedBranchId"
              :loading="checkHolidayLoading"
              display-format="jdddd، jD jMMMM، jYYYY"
              :error-message="errors?.bookingAt"
              :error="errors?.bookingAt ? !!errors?.bookingAt : null"
              @update:model-value="(e) => handleChange('bookingAt', e)"
            />
            <div class="booking-popup__row">
              <div class="booking-popup__time-item">
                <TimeField
                  label="از"
                  :model-value="
                    bookingData.bookingAtTime ? bookingData.bookingAtTime.slice(0, 5) : null
                  "
                  :error="errors?.bookingAtTime ? !!errors?.bookingAtTime : null"
                  :error-message="errors?.bookingAtTime"
                  @update:model-value="(e) => handleChange('bookingAtTime', e ? `${e}:00` : e)"
                />
              </div>
              <div class="booking-popup__time-item">
                <TimeField
                  label="تا"
                  :model-value="
                    bookingData.bookingEndedAtTime
                      ? bookingData.bookingEndedAtTime.slice(0, 5)
                      : null
                  "
                  :error="errors?.bookingEndedAtTime ? !!errors?.bookingEndedAtTime : null"
                  :error-message="errors?.bookingEndedAtTime"
                  @update:model-value="(e) => handleChange('bookingEndedAtTime', e ? `${e}:00` : e)"
                />
              </div>
            </div>
          </div>

          <div class="booking-popup__section">
            <div class="booking-popup__row">
              <SelectField
                variant="outline"
                :model-value="bookingType"
                :options="[
                  { label: 'ویزیت', value: BOOKING_VISIT },
                  { label: 'انجام کار', value: BOOKING_PERFORM },
                ]"
                option-label="label"
                option-value="value"
                disable
                emit-value
                map-options
                label="نوع نوبت"
                @update:model-value="(e) => handleChange('type', e)"
              />
              <SelectField
                variant="outline"
                :model-value="bookingData.assignTo?.id ?? bookingData.assignTo"
                :options="doctorOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                label="دکتر"
                menu-anchor="bottom middle"
                menu-self="top middle"
                :error-message="errors?.assignTo"
                :error="errors?.assignTo ? !!errors?.assignTo : null"
                @update:model-value="(e) => handleChange('assignTo', e)"
              >
                <template #option="{ opt, itemProps }">
                  <QItem v-bind="itemProps">
                    <QItemSection side>
                      <span
                        class="booking-popup__doctor-box"
                        :class="`booking-popup__doctor-box--color-${opt.colorKey}`"
                      />
                    </QItemSection>
                    <QItemSection>
                      <QItemLabel>{{ opt.label }}</QItemLabel>
                    </QItemSection>
                  </QItem>
                </template>
              </SelectField>
            </div>
            <TextField
              :model-value="userStore.userData?.user?.name ?? ''"
              label="کاربر ایجاد کننده"
              readonly
              disable
              variant="outline"
            />
          </div>

          <div class="booking-popup__section">
            <Typography variant="body" size="4" weight="medium" color="grey">خدمات</Typography>
            <Tag
              :model-value="serveSelectModelValue"
              :options="serveOptions"
              item-label="label"
              item-value="value"
              @update:model-value="(e) => handleChange('serves', e)"
            />
          </div>

          <div class="booking-popup__actions">
            <Button variant="outline" text="انصراف" :is-full-width="true" @click="closeForm" />
            <Button
              variant="filled"
              text="ثبت نوبت"
              :is-loading="isBookingCreatePending"
              :is-full-width="true"
              :is-disabled="noTreatmentPlan"
              @click="submitForm"
            />
          </div>
        </QForm>
      </div>
    </QPopupProxy>
  </div>
</template>

<script setup>
import { computed, ref, toRefs, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import {
  useUserActivateTreatmentPlanMutation,
  useGetTreatmentPlanByIdQuery,
} from '@/modules/TreatmentPlan/query/index'
import { useQueryClient } from '@tanstack/vue-query'
import useYup from '@/composables/use-yup'
import { lazy, mixed, object, string, number, array } from 'yup'
import PersianDate from '@/components/Form/PersianDate'
import { useApiCheckHoliday } from '@/modules/Task/query'
import { useUserStore } from '@/store/user'
import { useCreateBookingMutation } from '@/modules/Booking/query'
import { handleError } from '@/utils/error-handler'
import { Notif } from '@/data/services/notification-service'
import { formatDate, convertToJalali } from '@/utils/date-utils'
import { calculateServeTitle } from '@/modules/TreatmentPlan/utils/teeth'
import UserSelectField from '@/components/Form/UserSelectField'
import SelectField from '@/base/SelectField'
import TextField from '@/base/TextField'
import TimeField from '@/base/TimeField'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import Tag from '@/base/Tag'

const props = defineProps({
  visible: { type: Boolean, default: false },
  userId: { type: Number, default: null },
  prefillDoctorId: { type: Number, default: null },
  prefillDate: { type: String, default: '' },
  prefillType: { type: Number, default: 2 },
  prefillTime: { type: String, default: null },
  prefillEndTime: { type: String, default: null },
  anchorX: { type: Number, default: 0 },
  anchorY: { type: Number, default: 0 },
  doctors: { type: Array, default: () => [] },
})

const emits = defineEmits(['close', 'afterSubmit', 'preview'])
const { visible } = toRefs(props)
const queryClient = useQueryClient()
const userStore = useUserStore()

const proxyRef = ref(null)

const updatedBookingData = ref(null)
const noTreatmentPlan = ref(false)
const ONLINE_VISIT = 2
const IN_PERSON_VISIT = 1
const BOOKING_VISIT = 1
const BOOKING_PERFORM = 2
const isPerformType = ref(false)

const bookingData = computed(() => updatedBookingData.value || {})
const bookingType = computed(() => bookingData.value.type || props.prefillType)
const visitType = computed(() => bookingData.value?.visitType)

const previewPayload = computed(() => {
  const bd = bookingData.value
  if (!bd.bookingAtTime && !bd.user) return null
  const dateStr = bd.bookingAt || formatDate(new Date(), 'YYYY-MM-DD')
  const startTime = bd.bookingAtTime
  const endTime = bd.bookingEndedAtTime
  return {
    booking: {
      bookingAt: startTime
        ? `${dateStr} ${startTime.length === 5 ? `${startTime}:00` : startTime}`
        : null,
      bookingEndedAt: endTime
        ? `${dateStr} ${endTime.length === 5 ? `${endTime}:00` : endTime}`
        : null,
      canceledAt: null,
      user: bd.user || null,
    },
    color: (() => {
      const { assignTo } = bd
      const doc = props.doctors.find((d) => d.id === assignTo)
      return doc?.color || 'blue'
    })(),
    hour: startTime ? Number.parseInt(startTime.split(':')[0], 10) : null,
    jalaliDate: convertToJalali(dateStr, 'jYYYY-jM-jD'),
  }
})

watch(previewPayload, (val) => emits('preview', val), { immediate: true })

const tempDate = computed(() => ({
  date: bookingData.value?.bookingAt
    ? formatDate(bookingData.value?.bookingAt, 'YYYY-MM-DD')
    : formatDate(new Date(), 'YYYY-MM-DD'),
}))

const selectedBranchId = computed(() => {
  const branch = bookingData.value?.branch
  return typeof branch === 'object' ? branch?.id : branch
})

const formTitle = computed(() =>
  bookingType.value === BOOKING_PERFORM ? 'افزودن نوبت' : 'افزودن ویزیت'
)
const visitTypeTitle = computed(() =>
  visitType.value === IN_PERSON_VISIT ? 'حضوری' : visitType.value === ONLINE_VISIT ? 'آنلاین' : ''
)

const treatmentPlanId = computed(() => bookingData.value?.treatmentPlanId)
const { data: tpData } = useGetTreatmentPlanByIdQuery(treatmentPlanId, {
  enabled: computed(() => !!treatmentPlanId.value),
})
const serveSelectModelValue = computed(() => {
  const serves = bookingData.value?.serves
  if (!Array.isArray(serves)) return serves
  return serves.map((s) => (typeof s === 'object' ? s?.id : s))
})
const serveOptions = computed(() =>
  (tpData.value?.items || []).map((item) => {
    const category = item.title || item.serveTitle
    const details = (item.questions || [])
      .map((question) => calculateServeTitle(question, item, false))
      .filter((detail) => detail && detail !== 'ندارد')
    const label = details.length > 0 ? `${category} - ${details.join('، ')}` : category
    return { label, value: item?.id }
  })
)
const compactFormSchema = () =>
  object().shape({
    bookingAt: string().required('تاریخ نوبت الزامیست'),
    bookingAtTime: string().required('زمان نوبت را وارد کنید').typeError('زمان نوبت را وارد کنید'),
    bookingEndedAtTime: string()
      .nullable()
      .test(
        'after-start',
        'ساعت پایان باید بعد از ساعت شروع باشد',
        function validateEndTime(value) {
          if (!value) return true
          const start = this.parent.bookingAtTime
          if (!start) return true
          return value > start
        }
      ),
    user: object().shape({ id: number().required() }).required('انتخاب کاربر الزامیست'),
    assignTo: number().nullable(),
    type: lazy(() =>
      bookingType.value === 2 ? string().nullable() : string().required('نوع ویزیت الزامیست')
    ),
    visitType: lazy(() =>
      bookingType.value === 1 ? string().required('نوع ویزیت الزامیست') : string().nullable()
    ),
    branch: mixed().nullable(),
    files: array().of(object().shape({ id: number() })),
    treatmentPlanId: string().nullable(),
    serves: array().nullable(),
  })

const { validate, validateAt, errors } = useYup(compactFormSchema())

const { mutate: getUserActiveTreatmentPlan } = useUserActivateTreatmentPlanMutation()

const addMinutes = (time, mins) => {
  if (!time) return null
  const parts = time.split(':').map(Number)
  const total = parts[0] * 60 + parts[1] + mins
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const handleChange = (field, value) => {
  updatedBookingData.value = { ...bookingData.value, [field]: value }
  validateAt(field, value)
  if (field === 'bookingAtTime' && value) {
    const currentEnd = bookingData.value.bookingEndedAtTime
    if (!currentEnd || currentEnd <= value) {
      updatedBookingData.value = {
        ...updatedBookingData.value,
        bookingEndedAtTime: addMinutes(value, 25),
      }
    }
  }
}

const userSelectModelValue = computed(() => {
  const user = bookingData.value?.user
  if (!user) return null
  if (user.rawData) return user
  return {
    label: `${user?.name || 'بدون نام'} / ${user.mobile || ''}`,
    value: user.id,
    rawData: user,
  }
})

const handleUserSelect = (e) => {
  if (e?.rawData) {
    handleChange('user', e.rawData)
  } else {
    handleChange('user', e)
  }
}

const doctorOptions = computed(() =>
  (props.doctors || []).map((d) => ({
    label: d.name,
    value: d.id,
    rawData: d,
    colorKey: d.color || 'gray',
  }))
)

const filteredDoctorOptions = ref([])

watch(
  doctorOptions,
  (newOptions) => {
    filteredDoctorOptions.value = newOptions
  },
  { immediate: true }
)

const { data: isHoliday, isLoading: checkHolidayLoading } = useApiCheckHoliday(
  tempDate,
  selectedBranchId,
  {
    enabled: () => visible.value && !!tempDate.value.date,
  }
)
watch(isHoliday, (val) => {
  if (val?.data) {
    Notif.error(val.message, { group: false })
  }
})
const getActiveTp = () => {
  if (bookingType.value !== BOOKING_PERFORM) return
  handleChange('assignToId', bookingData.value?.assignToId)
  if (!bookingData.value?.user?.id) return
  noTreatmentPlan.value = false
  getUserActiveTreatmentPlan(bookingData.value.user.id || bookingData.value?.userId, {
    onSuccess: ({ data }) => {
      if (data) {
        handleChange('treatmentPlanId', data?.id)
        noTreatmentPlan.value = false
      } else {
        handleChange('treatmentPlanId', null)
        noTreatmentPlan.value = true
        Notif.error('طرح درمان فعالی برای این کاربر یافت نشد')
      }
    },
    onError: (e) => {
      handleError(e)
    },
  })
}

const handleDialogOpen = () => {
  if (props.prefillType) {
    handleChange('type', props.prefillType)
    if (props.prefillType === BOOKING_PERFORM) {
      isPerformType.value = true
    } else {
      handleChange('visitType', IN_PERSON_VISIT)
    }
  }
  if (props.prefillDate) {
    handleChange('bookingAt', props.prefillDate)
  }
  if (props.prefillTime && !bookingData.value?.bookingAtTime) {
    handleChange('bookingAtTime', props.prefillTime)
  }
  if (props.prefillEndTime) {
    handleChange('bookingEndedAtTime', props.prefillEndTime)
  }

  handleChange('type', bookingType.value)
  if (!isPerformType.value) {
    handleChange('visitType', IN_PERSON_VISIT)
  }

  if (props.prefillDoctorId && props.doctors?.length) {
    const doctor = props.doctors.find((d) => d.id === props.prefillDoctorId)
    if (doctor) handleChange('assignTo', doctor.id)
  }

  if (!selectedBranchId.value) {
    const userBranchId = userStore.userData?.branch?.id
    if (userBranchId) {
      handleChange('branch', userBranchId)
    }
  }
}

const closeForm = () => {
  updatedBookingData.value = null
  noTreatmentPlan.value = false
  errors.value = {}
  emits('preview', null)
  proxyRef.value?.hide()
  emits('close')
}

const { mutate: createBooking, isPending: isBookingCreatePending } = useCreateBookingMutation()
const createUserBooking = (data) => {
  createBooking(data, {
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['booking'] })
      Notif.success(response.message)
      emits('afterSubmit')
      closeForm()
    },
  })
}
const submitForm = async () => {
  const { isValid, payload } = await validate(bookingData.value)
  if (!isValid) return
  const data = {
    ...payload,
    userId: payload?.user?.id,
    branchId: typeof payload?.branch === 'object' ? payload?.branch?.id : payload?.branch,
    assignTo: payload?.assignTo ?? undefined,
    fileIds: payload?.files ? payload?.files.map((f) => f?.id) : [],
    bookingAt: `${payload?.bookingAt} ${payload?.bookingAtTime?.length === 5 ? `${payload.bookingAtTime}:00` : payload?.bookingAtTime}`,
    bookingEndedAt: payload?.bookingEndedAtTime
      ? `${payload?.bookingAt} ${payload.bookingEndedAtTime?.length === 5 ? `${payload.bookingEndedAtTime}:00` : payload.bookingEndedAtTime}`
      : undefined,
    serveIndustryIds: Array.isArray(payload?.serves)
      ? payload.serves.map((s) => (typeof s === 'object' ? s?.id : s))
      : undefined,
  }
  createUserBooking(data)
}

function onKeydown(e) {
  if (e.key === 'Escape' && visible.value) {
    closeForm()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})

watch(visible, (val) => {
  if (val) {
    nextTick(() => {
      proxyRef.value?.show()
    })
  }
})

watch(
  () => updatedBookingData.value?.user?.id,
  (newVal) => {
    if (isPerformType.value || newVal) getActiveTp()
  }
)

watch(
  () => props.doctors,
  (list) => {
    if (!list?.length || !props.prefillDoctorId) return
    const currentDoctorId =
      typeof bookingData.value?.assignTo === 'object'
        ? bookingData.value?.assignTo?.id
        : bookingData.value?.assignTo
    if (currentDoctorId === props.prefillDoctorId) return
    const doctor = list.find((d) => d.id === props.prefillDoctorId)
    if (doctor) handleChange('assignTo', doctor.id)
  }
)
</script>

<style scoped lang="scss">
@use '@/assets/styles/calendar/color-variants';

.booking-popup__anchor {
  position: fixed;
  width: 1px;
  height: 1px;
  z-index: 1;
  pointer-events: none;
}

.booking-popup {
  width: 345px;
  background: #f6f6f6;
  border: 1px solid $grey-3;
  box-shadow: 0 4px 12px rgba(105, 117, 134, 0.25);
  border-radius: 12px;
  overflow: visible;
  display: flex;
  flex-direction: column;
  direction: rtl;
  padding: 8px;
  gap: 16px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  &__title {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    color: #111827;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 4px;
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    padding: 8px;
    gap: 8px;
    width: 100%;
    background: $white;
    border: 1px solid $grey-3;
    border-radius: 8px;
  }

  &__label {
    width: 100%;
  }

  &__row {
    display: flex;
    gap: 10px;

    > * {
      flex: 1;
      min-width: 0;
    }
  }

  &__time-item {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }

  &__actions {
    display: flex;
    gap: 10px;
    margin-top: 8px;
  }

  &__doctor-box {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid transparent;
    flex-shrink: 0;

    @include color-variants.apply;
  }
}
</style>
