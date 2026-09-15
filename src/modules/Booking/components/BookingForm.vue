<template>
  <BaseModal
    :model-value="visible"
    width="720px"
    :title="visitTypeTitle ? formTitle + ' ' + visitTypeTitle : formTitle"
    @close="closeForm"
    @before-show="handleDialogOpen"
    @before-hide="closeForm"
  >
    <QForm class="booking-form" @submit.prevent="submitForm">
      <div class="row q-col-gutter-md q-my-sm">
        <div class="col-md-6 col-12">
          <UserSelectField
            :model-value="bookingData.user?.id"
            :display-label="
              bookingData.user
                ? `${bookingData.user.firstName || ''} ${bookingData.user.name || ''} / ${bookingData.user.mobile || ''}`.trim()
                : null
            "
            :error-message="errors?.user"
            :error="errors?.user ? !!errors?.user : null"
            :disable="!!bookingData?.id"
            @update:model-value="(e) => handleChange('user', { id: e })"
          />
        </div>
        <div class="col-12 col-md-6">
          <AdvisorSelect
            lazy
            :model-value="bookingData?.advisorId"
            :display-label="
              bookingData?.advisor
                ? `${bookingData.advisor.firstName ?? ''} ${bookingData.advisor.name ?? ''} `.trim()
                : null
            "
            :user-role="advisorRoles"
            :label="advisorFieldTitle"
            :dense="false"
            show-role
            :disable="advisorFieldDisable"
            :error-message="errors?.advisorId"
            :error="errors?.advisorId ? !!errors?.advisorId : null"
            @update:model-value="(e) => handleChange('advisorId', e ?? null)"
          />
        </div>
        <div v-show="false" class="col-12 col-md-6">
          <EnumSelect
            v-if="!isPerformType"
            lazy
            :model-value="visitType"
            enum-key="BookingVisitTypeEnum"
            disable
            :error-message="errors?.visitType"
            :error="errors?.visitType ? !!errors?.visitType : null"
            label="نوع ویزیت"
            @update:model-value="(e) => handleChange('visitType', e)"
          />
          <EnumSelect
            v-else
            lazy
            :model-value="bookingType?.id ?? bookingType"
            enum-key="BookingTypeEnums"
            clearable
            disable
            :error-message="errors?.type"
            :error="errors?.type ? !!errors?.type : null"
            label="نوع"
            @update:model-value="(e) => handleChange('type', e)"
          />
        </div>
        <div class="col-12 col-md-6">
          <BranchSelect
            lazy
            :display-label="bookingData?.branch?.name"
            :model-value="bookingData.branch?.id"
            :error="errors?.branch ? !!errors?.branch : null"
            :error-message="errors?.branch"
            @update:model-value="(e) => handleChange('branch', { id: e })"
          />
        </div>
        <div v-if="isPerformType" class="col-12 col-md-6">
          <AdvisorSelect
            lazy
            :model-value="bookingData.assignTo?.id"
            :user-role="doctorsRoles"
            label="دکتر"
            clearable
            :error-message="errors?.assignTo"
            :error="errors?.assignTo ? !!errors?.assignTo : null"
            @update:model-value="(e) => handleChange('assignTo', e ? { id: e } : null)"
          />
        </div>
        <div v-if="isPerformType" class="col-12 col-md-6">
          <SelectField
            :model-value="bookingData?.treatmentPlanId"
            variant="outline"
            emit-value
            map-options
            disable
            :loading="getActiveTpLoading"
            :hint="getActiveTpLoading ? 'درحال دریافت طرح درمان فعال' : undefined"
            :error-message="errors?.treatmentPlanId"
            :error="!!errors?.treatmentPlanId"
            label="طرح درمان فعال"
            option-label="id"
            @update:model-value="(e) => handleChange('treatmentPlanId', e)"
          >
            <template v-if="bookingData?.treatmentPlanId" #after>
              <Button
                variant="flat"
                color="light-blue"
                @click="openTp(activeTreatmentPlan?.publicLink)"
              >
                <QIcon color="primary" name="fa-solid fa-eye" size="sm" />
              </Button>
            </template>
          </SelectField>
        </div>
        <div class="col-md-6 col-12">
          <div v-if="isHoliday?.data" />
          <PersianDate
            label="تاریخ"
            :model-value="bookingData.bookingAt"
            :disable="!bookingData.branch"
            :loading="checkHolidayLoading"
            :error-message="errors?.bookingAt"
            placeholder="YYYY/MM/DD"
            :error="errors?.bookingAt ? !!errors?.bookingAt : null"
            @update:model-value="(e) => handleChange('bookingAt', e)"
            @change="handleChange('bookingAtTime', null)"
          />
        </div>
        <div class="col-md-6 col-12">
          <template v-if="!isPerformType">
            <SelectField
              :model-value="bookingData.bookingAtTime || bookingAtTime"
              :options="sessionTimes"
              variant="outline"
              emit-value
              map-options
              clearable
              :disable="!bookingData.bookingAt || checkHolidayLoading"
              :error-message="errors?.bookingAtTime"
              :error="errors?.bookingAtTime ? !!errors?.bookingAtTime : null"
              :loading="getOnlineTimeLoading || getPresentTimeLoading"
              label="ساعت نوبت/ویزیت"
              option-value="start"
              :option-label="
                (item) =>
                  item?.start ? item?.start.slice(0, Math.max(0, item?.start?.length - 3)) : null
              "
              @update:model-value="(e) => handleChange('bookingAtTime', e)"
            >
              <template #option="scope">
                <QItem v-bind="scope.itemProps">
                  <QItemSection :class="visitType === inPersonVisit ? 'select-input' : ''">
                    <div class="row justify-between">
                      <span>
                        {{ scope.opt.start.slice(0, Math.max(0, scope.opt.start.length - 3)) }}
                      </span>
                      <span v-if="visitType === onlineVisit" class="booking-form__reserved">
                        {{ scope.opt.isFree ? '' : 'رزرو شده' }}
                      </span>
                      <span
                        v-if="visitType === inPersonVisit"
                        :class="
                          scope.opt.reserve ? 'booking-form__reserved' : 'booking-form__available'
                        "
                      >
                        {{ scope.opt.reserve ? 'رزرو شده' : scope.opt?.count + ' نوبت' }}
                      </span>
                    </div>
                  </QItemSection>
                </QItem>
              </template>
            </SelectField>
          </template>
          <template v-else>
            <TimeField
              :disable="!bookingData.bookingAt"
              label="انتخاب زمان"
              stack-label
              :model-value="
                bookingData.bookingAtTime ? bookingData.bookingAtTime.slice(0, 5) : null
              "
              @update:model-value="(e) => handleChange('bookingAtTime', e ? `${e}:00` : e)"
            />
          </template>
        </div>
        <div class="col-12">
          <ServeSelect
            mini-serve-service
            :model-value="
              Array.isArray(bookingData?.serves)
                ? bookingData.serves.map((s) => s?.id ?? s)
                : bookingData?.serves
            "
            multiple
            chips
            :error-message="errors?.serves"
            :error="errors?.serves ? !!errors?.serves : null"
            label="خدمات"
            @update:model-value="
              (e) =>
                handleChange(
                  'serves',
                  (Array.isArray(e) ? e : e ? [e] : []).map((id) => ({ id }))
                )
            "
          />
          <div v-if="activeTreatmentPlan?.serves && isPerformType" class="row items-baseline">
            <p class="booking-form__tp-label">خدمات طرح درمان:</p>
            <QChip
              v-for="serve in activeTreatmentPlan?.serves"
              :key="serve.id"
              color="primary"
              outline
              clickable
              @click="addServe(serve)"
            >
              {{ serve.title }}
            </QChip>
          </div>
        </div>
        <div class="col-md-12 col-12">
          <BaseUploader
            :max-file-size="1048576 * 2.7"
            :accept="'.jpg, image/*'"
            enum-type="booking.files"
            auto-upload
            multiple
            @update:model-value="(e) => handleFileUploaded(e)"
          />
          <div v-if="bookingFiles.length > 0">
            <div v-for="(file, index) in bookingFiles" :key="index" class="q-my-sm">
              <a :href="file?.path" target="_blank" class="booking-form__file-link">
                مشاهده فایل {{ index + 1 }}
              </a>
            </div>
          </div>
        </div>
        <div class="col-md-12 col-12">
          <TextField
            :model-value="bookingData.description"
            type="textarea"
            label="توضیحات"
            :rows="2"
            variant="outline"
            clearable
            @update:model-value="(e) => handleChange('description', e)"
          />
        </div>
        <div class="col-md-12 col-12 booking-form__actions">
          <Button
            variant="outline"
            color="amber"
            :is-loading="isBookingCreatePending || isBookingUpdatePending"
            text="انصراف"
            @click="closeForm"
          />
          <Button
            variant="outline"
            color="light-blue"
            :is-loading="isBookingCreatePending || isBookingUpdatePending"
            text="ثبت"
          />
        </div>
      </div>
    </QForm>
  </BaseModal>
</template>

<script setup>
import { computed, ref, toRefs, watch } from 'vue'
import { useUserActivateTreatmentPlanMutation } from '@/modules/TreatmentPlan/query/index'
import { useQueryClient } from '@tanstack/vue-query'
// import { storeToRefs } from 'pinia'
import useYup from '@/composables/use-yup'
import { bookingFormSchema } from '@/modules/Booking/schema'
import { useRoleManager } from '@/composables/use-role-manager'
import PersianDate from '@/components/Form/PersianDate'
import { useApiCheckHoliday } from '@/modules/Task/query'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import {
  useApiGetOnlineSessionTimes,
  useBookingQuery,
  useCreateBookingMutation,
  useGetPresentSessionTimes,
  useUpdateBookingMutation,
} from '@/modules/Booking/query'
import { handleError } from '@/utils/error-handler'
import BaseUploader from '@/components/Form/BaseUploader/BaseUploader'
import { diffDates, formatDate } from '@/utils/date-utils'
import UserSelectField from '@/components/Form/UserSelectField'
import AdvisorSelect from '@/components/Form/AdvisorSelect'
import EnumSelect from '@/components/Form/EnumSelect'
import BranchSelect from '@/components/Form/BranchSelect'
import ServeSelect from '@/components/Form/ServeSelect'
import SelectField from '@/base/SelectField'
import TextField from '@/base/TextField'
import Button from '@/base/Button'
import BaseModal from '@/base/Modal'
import TimeField from '@/base/TimeField'

const props = defineProps({
  visible: { type: Boolean, default: false },
  editValue: { type: Object, default: () => null },
  userId: { type: Number, default: null },
})

const emits = defineEmits(['close', 'afterSubmit'])
const openTp = (link) => {
  window.open(link, '_blank')
}
const { editValue, visible } = toRefs(props)
const { hasRole } = useRoleManager()
const queryClient = useQueryClient()

// Booking Data States
const updatedBookingData = ref(null)
const onlineVisit = ref(2)
const inPersonVisit = ref(1)
const bookingVisit = ref(1)
const bookingPerform = ref(2)
const presentSessionTimesData = ref(null)
const isPerformType = ref(false)
const activeTreatmentPlan = ref({})
const files = ref([])

// Booking data computed value
const isAdmin = computed(() => hasRole('superAdmin') || hasRole('admin'))
const editBookingId = computed(() => editValue.value?.id || null)
const editBookingPlaceholder = computed(() => editValue.value || undefined)
const { data: fetchedBooking } = useBookingQuery(editBookingId, editBookingPlaceholder)
const initialBookingData = computed(() => fetchedBooking.value || editValue.value || {})
const bookingData = computed(() => updatedBookingData.value || initialBookingData.value || {})

watch(fetchedBooking, (newData) => {
  if (newData && updatedBookingData.value) {
    updatedBookingData.value = { ...newData, ...updatedBookingData.value }
  }
})
const bookingAtTime = computed(() => formatDate(bookingData.value.bookingAt, 'HH:mm:ss'))
const bookingId = computed(() => bookingData.value?.id || editValue.value?.id)
const bookingFiles = computed(() => initialBookingData.value?.files || [])
const bookingType = computed(() => bookingData.value.type || editValue.value?.type || [])
const visitType = computed(() => bookingData.value?.visitType?.id ?? bookingData.value?.visitType)
const advisorFieldDisable = computed(() => !isAdmin.value && visitType.value === onlineVisit.value)
const tempDate = computed(() => ({
  date: bookingData.value?.bookingAt
    ? formatDate(bookingData.value?.bookingAt, 'YYYY-MM-DD')
    : null,
}))
const onlineVisitTimeSelected = computed(() =>
  bookingData.value?.bookingAt ? formatDate(bookingData.value?.bookingAt, 'YYYY-MM-DD') : null
)

const selectedBranchId = computed(() => bookingData.value?.branch?.id)
const onlineSessionTimesEnabled = computed(
  () =>
    visible.value &&
    visitType.value === onlineVisit.value &&
    !!selectedBranchId.value &&
    !!onlineVisitTimeSelected.value
)
const formTitle = computed(() =>
  bookingId.value && bookingType.value === bookingPerform.value
    ? 'ویرایش نوبت انجام کار'
    : !bookingId.value && bookingType.value === bookingPerform.value
      ? 'افزودن نوبت انجام کار'
      : bookingId.value && bookingType.value === bookingVisit.value
        ? 'ویرایش ویزیت'
        : !bookingId.value && bookingType.value === bookingVisit.value
          ? 'افزودن ویزیت'
          : ''
)
const visitTypeTitle = computed(() =>
  visitType.value === inPersonVisit.value
    ? 'حضوری'
    : visitType.value === onlineVisit.value
      ? 'آنلاین'
      : undefined
)
const advisorFieldTitle = computed(() =>
  visitType.value === onlineVisit.value ? 'کاربر اتاق مشاوره' : 'مشاور'
)
const advisorRoles = computed(() =>
  visitType.value === onlineVisit.value
    ? ['presenter', 'online_visit', 'advisor_and_online_visit']
    : ['advisor', 'advisor_and_online_visit']
)
const doctorsRoles = computed(() => ['doctor'])

// Booking Data functions
const { validate, validateAt, errors } = useYup(
  bookingFormSchema(visitType, onlineVisit, bookingType)
)
const { data: visitSessionsTimes, isLoading: getOnlineTimeLoading } = useApiGetOnlineSessionTimes(
  onlineVisitTimeSelected,
  selectedBranchId,
  {
    enabled: onlineSessionTimesEnabled,
  }
)
const { mutate: presentSessionTimes, isLoading: getPresentTimeLoading } =
  useGetPresentSessionTimes()
const getPresentSessionTime = (date, id) => {
  if (visitType.value === inPersonVisit.value && date && id) {
    presentSessionTimes(
      { ...date, branchId: id },
      {
        onSuccess: ({ data }) => {
          presentSessionTimesData.value = data
        },
        onError: (e) => {
          handleError(e)
        },
      }
    )
  }
}

const sessionTimes = computed(() => {
  return visitSessionsTimes.value?.length
    ? visitSessionsTimes.value
    : presentSessionTimesData.value || []
})
const { data: isHoliday, isLoading: checkHolidayLoading } = useApiCheckHoliday(
  tempDate,
  selectedBranchId,
  {
    enabled: () => visible.value && !!tempDate.value?.date && !!selectedBranchId.value,
  }
)
watch(isHoliday, (holiday) => {
  if (holiday?.data) {
    Notif.error(holiday.message, { group: false })
  }
})

const { mutate: getUserActiveTreatmentPlan, isPending: getActiveTpLoading } =
  useUserActivateTreatmentPlanMutation()
const handleChange = (field, value) => {
  updatedBookingData.value = { ...bookingData.value, [field]: value }
  validateAt(field, value)
  if (
    (field === 'bookingAt' || field === 'branch') &&
    bookingData.value?.bookingAt &&
    bookingData.value?.branch?.id &&
    visitType.value === inPersonVisit.value
  ) {
    getPresentSessionTime(
      { date: formatDate(bookingData.value.bookingAt, 'YYYY-MM-DD') },
      bookingData.value.branch.id
    )
  }
}
const handleFileUploaded = (file) => {
  files.value.push({ ...files.value, ...file.data[0] })
  handleChange('files', files.value)
}

const addServe = (newServe) => {
  const currentServes = bookingData.value.serves || []

  const exists = currentServes.some((serve) =>
    typeof serve === 'object' ? serve.id === newServe.id : serve === newServe.id
  )
  if (exists) return

  handleChange('serves', [...currentServes, { id: newServe.id }])
}

const getActiveTp = () => {
  if (bookingType.value !== bookingPerform.value) return
  handleChange('assignToId', bookingData.value?.assignToId)
  if (!bookingData.value?.user?.id) return
  getUserActiveTreatmentPlan(bookingData.value.user.id || bookingData.value?.userId, {
    onSuccess: ({ data }) => {
      if (data) {
        activeTreatmentPlan.value = data
        handleChange('treatmentPlanId', data?.id)
      } else {
        handleChange('treatmentPlanId')
        handleChange('treatmentPlanId', null)
      }
    },
    onError: (e) => {
      handleError(e)
    },
  })
}
const handleDialogOpen = () => {
  handleChange('type', bookingType.value)
  if (!isPerformType.value) handleChange('visitType', visitType.value)
  if (!bookingId.value) handleChange('advisor', null)
  if (bookingType.value === bookingPerform.value) isPerformType.value = true
  if (bookingData.value?.branch?.id && bookingData.value?.bookingAt) {
    getPresentSessionTime({ date: tempDate.value?.date }, bookingData.value.branch.id)
  }
  files.value = [...bookingFiles.value]
}
const closeForm = () => {
  updatedBookingData.value = null
  files.value = []
  errors.value = {}
  emits('close')
}
const { mutate: createBooking, isPending: isBookingCreatePending } = useCreateBookingMutation()
const { mutate: updateBooking, isPending: isBookingUpdatePending } = useUpdateBookingMutation()
const updateUserBooking = (data, id) => {
  updateBooking(
    { ...data, id },
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ['booking'] })
        Notif.success(response.message)
        emits('afterSubmit')
        closeForm()
      },
    }
  )
}
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
    advisorId: payload?.advisorId ?? payload?.advisor?.id,
    branchId: payload?.branch?.id,
    assignTo: payload?.assignTo?.id ?? undefined,
    fileIds: payload?.files ? payload?.files.map((f) => f?.id) : [],
    bookingAt: `${payload?.bookingAt} ${payload?.bookingAtTime?.length === 5 ? `${payload.bookingAtTime}:00` : payload?.bookingAtTime}`,
    serveIndustryIds: payload?.serves ? payload?.serves.map((_s) => _s?.id) : undefined,
  }
  const diffDays = diffDates(new Date(data.bookingAt), new Date(), 'days')
  if (diffDays >= 30) {
    confirmDialog(
      'توجه',
      `آیا از ثبت برای ${diffDays} روز آینده مطمئن هستید؟`,
      () => {
        bookingId.value ? updateUserBooking(data, bookingId.value) : createUserBooking(data)
      },
      {
        ok: {
          label: 'تایید',
          color: 'positive',
          flat: true,
        },
        cancel: {
          label: 'انصراف',
          color: 'negative',
          flat: true,
        },
        persistent: true,
      }
    )
  } else {
    bookingId.value ? updateUserBooking(data, bookingId.value) : createUserBooking(data)
  }
}
watch(
  editValue,
  (newVal) => {
    if (newVal?.bookingAt) {
      const dateTime = newVal.bookingAt
      const datePart = formatDate(dateTime, 'YYYY-MM-DD')
      const timePart = formatDate(dateTime, 'HH:mm:ss')
      updatedBookingData.value = {
        ...newVal,
        bookingAt: datePart,
        bookingAtTime: timePart,
      }
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => updatedBookingData.value?.user?.id,
  (newVal) => {
    if (isPerformType.value || newVal) getActiveTp()
  }
)
</script>
<style scoped lang="scss">
.booking-form {
  &__option {
    min-width: 350px;
  }

  &__reserved {
    color: $red-6;
  }

  &__available {
    color: $light-blue-6;
  }

  &__tp-label {
    font-size: 14px;
    color: $grey-6;
    margin-top: $spacing-sm;
  }

  &__file-link {
    color: $green-6;
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: $spacing-md;
  }
}
</style>
