<template>
  <div class="edit-sidebar">
    <div class="edit-sidebar__topbar">
      <div class="edit-sidebar__topbar-back" @click="emit('close')">
        <IconArrowForwardUp :size="18" />
        <Typography variant="body" size="4" weight="medium" color="blue">
          بازگشت به لیست نوبت‌ها
        </Typography>
      </div>
      <div>
        <div
          class="edit-sidebar__topbar-delete"
          :class="{
            'edit-sidebar__topbar-delete--disabled': bookingData?.hasTreatmentDescription,
          }"
          @click="!bookingData?.hasTreatmentDescription && confirmDelete()"
        >
          <IconTrash :size="18" />
        </div>
        <QTooltip v-if="bookingData?.hasTreatmentDescription">
          به دلیل ثبت شرح درمان برای این نوبت، امکان حذف آن وجود ندارد.
        </QTooltip>
      </div>
    </div>

    <QForm class="edit-sidebar__content" @submit.prevent="submitForm">
      <div class="edit-sidebar__patient" @click="openUserDetails">
        <div class="edit-sidebar__patient-top">
          <Typography variant="body" size="3" weight="bold" class="edit-sidebar__patient-name">
            {{ customerName }}
          </Typography>
        </div>
        <div class="edit-sidebar__patient-top">
          <Typography variant="body" size="4" weight="medium" color="grey">
            {{ bookingData?.user?.nationalCode }}
          </Typography>
          <div v-if="bookingData?.cbctStatus === 'has'" class="edit-sidebar__cbct">
            <Chip label="CBCT" color="blue" />
            <div class="edit-sidebar__cbct-dot" />
          </div>
        </div>
      </div>

      <div v-if="bookingData?.user?.mobile" class="edit-sidebar__call-btns">
        <a :href="`tel:${bookingData.user.mobile}`" class="edit-sidebar__call-btn">
          <IconPhone :size="18" />
          <span>موبایل اول</span>
          <QTooltip>{{ bookingData.user.mobile }}</QTooltip>
        </a>
      </div>

      <div>
        <div class="edit-sidebar__status-row">
          <Typography variant="caption" color="grey">اطلاعات نوبت</Typography>

          <div class="edit-sidebar__status-right">
            <div
              class="edit-sidebar__status-badge"
              :class="{
                'edit-sidebar__status-badge--canceled': bookingData?.canceledAt,
                'edit-sidebar__status-badge--done': bookingData?.doneAt && !bookingData?.canceledAt,
                'edit-sidebar__status-badge--active':
                  !bookingData?.canceledAt && !bookingData?.doneAt,
              }"
            >
              <IconClock v-if="!bookingData?.doneAt" :size="14" />
              <IconCircleCheck v-else :size="14" />
              <Typography variant="caption" weight="medium">{{ statusLabel }}</Typography>
            </div>

            <QPopupProxy anchor="bottom right" self="top right" :offset="[0, 4]">
              <div class="edit-sidebar__status-dropdown">
                <div
                  v-if="!bookingData?.doneAt"
                  v-close-popup
                  class="edit-sidebar__status-dropdown-item edit-sidebar__status-dropdown-item--pending"
                  @click="onReactivateBooking"
                >
                  <IconClock :size="16" />
                  <span>در انتظار انجام</span>
                </div>
                <div
                  v-if="!bookingData?.doneAt"
                  v-close-popup
                  class="edit-sidebar__status-dropdown-item edit-sidebar__status-dropdown-item--done"
                  @click="onMarkDone"
                >
                  <IconCircleCheck :size="16" />
                  <span>انجام شده</span>
                </div>
                <div
                  v-if="!bookingData?.canceledAt"
                  v-close-popup
                  class="edit-sidebar__status-dropdown-item edit-sidebar__status-dropdown-item--canceled"
                  @click="onCancelBooking"
                >
                  <IconCircleX :size="16" />
                  <span>لغو شده</span>
                </div>
              </div>
            </QPopupProxy>
            <IconChevronDown :size="16" color="#616161" />
          </div>
        </div>
      </div>

      <div class="edit-sidebar__card">
        <PersianDate
          label="تاریخ نوبت"
          :model-value="bookingData.bookingAt"
          :disable="!bookingData.branch"
          display-format="jdddd، jD jMMMM، jYYYY"
          :error-message="errors?.bookingAt"
          :error="errors?.bookingAt ? !!errors?.bookingAt : null"
          @update:model-value="onDateChange"
        />

        <div class="edit-sidebar__dashed" />

        <div class="edit-sidebar__time-row">
          <Typography variant="caption" color="grey">از</Typography>

          <div class="edit-sidebar__time-field">
            <TimeField
              :model-value="manualStartTime"
              :error="errors?.bookingAtTime ? !!errors?.bookingAtTime : null"
              :error-message="errors?.bookingAtTime"
              @update:model-value="onManualStartTimeChange"
            />
          </div>
          <Typography variant="caption" color="grey">تا</Typography>

          <div class="edit-sidebar__time-field">
            <TimeField
              :model-value="manualEndTime"
              :error="errors?.bookingEndedAtTime ? !!errors?.bookingEndedAtTime : null"
              :error-message="errors?.bookingEndedAtTime"
              @update:model-value="onManualEndTimeChange"
            />
          </div>
        </div>

        <div>
          <div class="edit-sidebar__two-col">
            <div class="edit-sidebar__col">
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
                label="نوع نوبت"
                emit-value
                map-options
                dense
                @update:model-value="(e) => handleChange('type', e)"
              />
            </div>
            <div class="edit-sidebar__col">
              <SelectField
                variant="outline"
                :model-value="bookingData.assignTo?.id ?? bookingData.assignTo"
                :options="doctorOptions"
                option-label="label"
                option-value="value"
                label="دکتر"
                emit-value
                map-options
                dense
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
                        class="edit-sidebar__doctor-box"
                        :class="`edit-sidebar__doctor-box--color-${opt.colorKey}`"
                      />
                    </QItemSection>
                    <QItemSection>
                      <QItemLabel>{{ opt.label }}</QItemLabel>
                    </QItemSection>
                  </QItem>
                </template>
              </SelectField>
            </div>
          </div>
          <TextField
            :model-value="bookingData?.creator?.name ?? ''"
            label="کاربر ایجاد کننده"
            readonly
            disable
            variant="outline"
          />
        </div>

        <div class="edit-sidebar__section">
          <Typography variant="body" size="4" weight="medium" color="grey">خدمات</Typography>
          <Tag
            :model-value="serveSelectModelValue"
            :options="serveOptions"
            item-label="label"
            item-value="value"
            @update:model-value="(e) => handleChange('serves', e)"
          />
        </div>
      </div>

      <div>
        <Typography variant="body" size="4" weight="medium" color="grey">توضیحات</Typography>
        <TextField
          variant="outline"
          :model-value="bookingData.description"
          type="textarea"
          :rows="3"
          clearable
          @update:model-value="(e) => handleChange('description', e)"
        />
      </div>
    </QForm>

    <div class="edit-sidebar__divider" />

    <div class="edit-sidebar__bottom">
      <Button
        variant="filled"
        text="ثبت"
        :is-loading="isBookingUpdatePending"
        :is-full-width="true"
        :is-disabled="noTreatmentPlan"
        @click="submitForm"
      />
      <Button
        variant="flat"
        color="light-blue"
        :is-full-width="true"
        :left-icon="IconArrowLeft"
        text="مشاهده طرح درمان"
        @click="goToTreatmentPlan"
      />
    </div>
  </div>

  <UserDetails
    v-if="userDetailsVisible"
    :visible="userDetailsVisible"
    :user-id="userData?.userId"
    @close="closeUserDetails"
  />
</template>

<script setup>
import { computed, ref, toRefs, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  useUserActivateTreatmentPlanMutation,
  useGetTreatmentPlanByIdQuery,
} from '@/modules/TreatmentPlan/query/index'
import { useQueryClient } from '@tanstack/vue-query'
import useYup from '@/composables/use-yup'
import { lazy, mixed, object, string, number, array } from 'yup'
import { QTooltip } from 'quasar'
import {
  useUpdateBookingMutation,
  useDeleteBookingMutation,
  useCancellationMutation,
} from '@/modules/Booking/query'

import { handleError } from '@/utils/error-handler'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import { formatDate } from '@/utils/date-utils'
import { getCustomerName } from '../../utils/bookingDisplay'
import { calculateServeTitle } from '@/modules/TreatmentPlan/utils/teeth'
import UserDetails from '@/modules/User/components/UserDetails/UserDetails'
import useDisclosure from '@/composables/use-disclosure'
import Tag from '@/base/Tag'
import SelectField from '@/base/SelectField'
import TextField from '@/base/TextField'
import TimeField from '@/base/TimeField'
import PersianDate from '@/components/Form/PersianDate'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import Chip from '@/base/Chip'
import {
  IconArrowForwardUp,
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconTrash,
  IconPhone,
  IconClock,
  IconArrowLeft,
} from '@tabler/icons-vue'

const props = defineProps({
  editValue: { type: Object, default: () => null },
  doctors: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'afterSubmit'])

const { editValue } = toRefs(props)
const router = useRouter()
const queryClient = useQueryClient()

const updatedBookingData = ref(null)
const noTreatmentPlan = ref(false)
const ONLINE_VISIT = 2
const BOOKING_VISIT = 1
const BOOKING_PERFORM = 2

const initialBookingData = computed(() => editValue.value || {})
const bookingData = computed(() => updatedBookingData.value || initialBookingData.value || {})
const bookingId = computed(() => bookingData.value?.id || editValue.value?.id)
const bookingType = computed(() => bookingData.value.type || editValue.value?.type || [])
const visitType = computed(() => bookingData.value?.visitType)

const customerName = computed(() => getCustomerName(bookingData.value))

// Time values (HH:mm) for the start/end time fields
const manualStartTime = computed(() =>
  bookingData.value?.bookingAtTime ? bookingData.value.bookingAtTime.slice(0, 5) : null
)
const manualEndTime = computed(() =>
  bookingData.value?.bookingEndedAtTime ? bookingData.value.bookingEndedAtTime.slice(0, 5) : null
)

const statusLabel = computed(() => {
  if (bookingData.value?.canceledAt) return 'لغو شده'
  if (bookingData.value?.doneAt) return 'انجام شده'
  return 'در انتظار انجام'
})

const doctorOptions = computed(() =>
  (props.doctors || []).map((d) => ({
    label: d.name,
    value: d.id,
    rawData: d,
    colorKey: d.color || 'gray',
  }))
)

const editFormSchema = () =>
  object().shape({
    bookingAt: string().required('تاریخ نوبت الزامیست'),
    bookingAtTime: string().required('زمان نوبت را وارد کنید').typeError('زمان نوبت را وارد کنید'),
    bookingEndedAtTime: string()
      .nullable()
      .test('after-start', 'ساعت پایان باید بعد از ساعت شروع باشد', function (value) {
        if (!value) return true
        const start = this.parent.bookingAtTime
        if (!start) return true
        return value > start
      }),
    user: object().shape({ id: number().required() }).required('انتخاب کاربر الزامیست'),
    assignTo: number().nullable(),
    type: lazy(() =>
      bookingType.value === 2
        ? string().nullable()
        : visitType.value === 2
          ? string().required('نوع ویزیت الزامیست')
          : string().nullable()
    ),
    visitType: lazy(() =>
      bookingType.value === 1 && visitType.value !== ONLINE_VISIT
        ? string().required('نوع ویزیت الزامیست')
        : string().nullable()
    ),
    branch: mixed().nullable(),
    files: array().of(object().shape({ id: number() })),
    description: string().nullable(),
    serves: array().nullable(),
    treatmentPlanId: string().nullable(),
  })

const { validate, validateAt, errors } = useYup(editFormSchema())

const { mutate: getUserActiveTreatmentPlan } = useUserActivateTreatmentPlanMutation()

const handleChange = (field, value) => {
  updatedBookingData.value = { ...bookingData.value, [field]: value }
  validateAt(field, value)
}

const onDateChange = (value) => {
  handleChange('bookingAt', value)
}

// Manual time values arrive as "HH:mm"; store as "HH:mm:ss" to match the slot value format.
const onManualStartTimeChange = (value) =>
  handleChange('bookingAtTime', value ? `${value}:00` : value)
const onManualEndTimeChange = (value) =>
  handleChange('bookingEndedAtTime', value ? `${value}:00` : value)

const serveSelectModelValue = computed(() => {
  const serves = bookingData.value?.serves
  if (!Array.isArray(serves)) return serves
  return serves.map((s) => (typeof s === 'object' ? s?.id : s))
})

const treatmentPlanId = computed(
  () => bookingData.value?.treatmentPlanId || bookingData.value?.treatmentPlan?.id
)
const { data: tpData } = useGetTreatmentPlanByIdQuery(treatmentPlanId, {
  enabled: computed(() => !!treatmentPlanId.value),
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

const { mutate: updateBooking, isPending: isBookingUpdatePending } = useUpdateBookingMutation()

const submitForm = async () => {
  const { isValid, payload } = await validate(bookingData.value)
  if (!isValid) return
  const data = {
    ...payload,
    userId: payload?.user?.id,
    branchId: typeof payload?.branch === 'object' ? payload?.branch?.id : payload?.branch,
    assignTo: typeof payload?.assignTo === 'object' ? payload?.assignTo?.id : payload?.assignTo,
    fileIds: payload?.files ? payload?.files.map((f) => f?.id) : [],
    bookingAt: `${payload?.bookingAt} ${payload?.bookingAtTime?.length === 5 ? `${payload.bookingAtTime}:00` : payload?.bookingAtTime}`,
    bookingEndedAt: payload?.bookingEndedAtTime
      ? `${payload?.bookingAt} ${payload.bookingEndedAtTime?.length === 5 ? `${payload.bookingEndedAtTime}:00` : payload?.bookingEndedAtTime}`
      : undefined,
    serveIndustryIds: Array.isArray(payload?.serves)
      ? payload.serves.map((s) => (typeof s === 'object' ? s?.id : s))
      : undefined,
    treatmentPlanId: payload?.treatmentPlanId ?? bookingData.value?.treatmentPlanId,
  }
  updateBooking(
    { ...data, id: bookingId.value },
    {
      onSuccess: (response) => {
        Notif.success(response.message)
        queryClient.invalidateQueries({ queryKey: ['booking'] }).then(() => {
          emit('afterSubmit')
        })
      },
    }
  )
}

const { mutate: deleteBooking } = useDeleteBookingMutation()

const { mutate: cancelBooking } = useCancellationMutation()

function invalidateBookingQueries() {
  queryClient.invalidateQueries({ queryKey: ['booking'] })
}

function onReactivateBooking() {
  updateBooking(
    {
      ...bookingData.value,
      bookingAt: `${bookingData.value.bookingAt} ${bookingData.value.bookingAtTime?.length === 5 ? `${bookingData.value.bookingAtTime}:00` : bookingData.value.bookingAtTime}`,
      userId: bookingData.value?.user?.id,
      assignTo:
        typeof bookingData.value?.assignTo === 'object'
          ? bookingData.value?.assignTo?.id
          : bookingData.value?.assignTo,
      id: bookingId.value,
      done: false,
      canceledAt: null,
    },
    {
      onSuccess: () => {
        invalidateBookingQueries()
        updatedBookingData.value = { ...bookingData.value, canceledAt: null, doneAt: null }
        Notif.success('نوبت فعال شد')
      },
    }
  )
}

function onCancelBooking() {
  cancelBooking(
    { id: bookingId.value, canceled_at: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss') },
    {
      onSuccess: (response) => {
        invalidateBookingQueries()
        updatedBookingData.value = {
          ...bookingData.value,
          canceledAt: response.data?.canceledAt || formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
        }
        Notif.success('نوبت لغو شد')
      },
    }
  )
}

function onMarkDone() {
  updateBooking(
    {
      ...bookingData.value,
      bookingAt: `${bookingData.value.bookingAt} ${bookingData.value.bookingAtTime?.length === 5 ? `${bookingData.value.bookingAtTime}:00` : bookingData.value.bookingAtTime}`,
      userId: bookingData.value?.user?.id,
      assignTo:
        typeof bookingData.value?.assignTo === 'object'
          ? bookingData.value?.assignTo?.id
          : bookingData.value?.assignTo,
      done: true,
      canceledAt: null,
      id: bookingId.value,
    },
    {
      onSuccess: (response) => {
        invalidateBookingQueries()
        updatedBookingData.value = {
          ...bookingData.value,
          doneAt: response.data?.doneAt || formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
          canceledAt: null,
        }
        Notif.success('نوبت انجام شد')
      },
    }
  )
}

function confirmDelete() {
  confirmDialog(
    'حذف نوبت',
    'آیا از حذف این نوبت اطمینان دارید؟',
    () => {
      deleteBooking(bookingId.value, {
        onSuccess: (response) => {
          queryClient.invalidateQueries({ queryKey: ['booking', 'all-booking'] })
          queryClient.invalidateQueries({ queryKey: ['booking', 'calendar'] })
          queryClient.invalidateQueries({ queryKey: ['booking', 'calendar-list'] })
          queryClient.invalidateQueries({ queryKey: ['booking', 'detail'] })
          Notif.success(response.message || 'نوبت با موفقیت حذف شد')
          emit('afterSubmit')
        },
      })
    },
    { ok: { label: 'بله', color: 'red' } }
  )
}

function goToTreatmentPlan() {
  if (!bookingData.value?.treatmentPlan?.id) return
  const route = router.resolve({
    name: 'treatment-plan-edit',
    params: { id: bookingData.value.treatmentPlan.id },
  })
  window.open(route.href, '_blank')
}

const [userDetailsVisible, { toggle: toggleDetailsDialog }] = useDisclosure()
const userData = ref(null)

const openUserDetails = () => {
  const userId = bookingData.value?.user?.id
  if (!userId) return
  userData.value = { userId }
  toggleDetailsDialog()
}
const closeUserDetails = () => {
  toggleDetailsDialog()
}

watch(
  editValue,
  (newVal) => {
    if (newVal?.bookingAt) {
      const dateTime = newVal.bookingAt
      const datePart = formatDate(dateTime, 'YYYY-MM-DD')
      const timePart = formatDate(dateTime, 'HH:mm')
      const endedAtTimePart = newVal.bookingEndedAt
        ? formatDate(newVal.bookingEndedAt, 'HH:mm')
        : formatDate(new Date(new Date(dateTime).getTime() + 30 * 60 * 1000), 'HH:mm')
      updatedBookingData.value = {
        ...newVal,
        bookingAt: datePart,
        bookingAtTime: timePart,
        bookingEndedAtTime: endedAtTimePart,
        assignTo: typeof newVal.assignTo === 'object' ? newVal.assignTo?.id : newVal.assignTo,
      }
    }
    if (newVal?.user?.id && bookingType.value === BOOKING_PERFORM) {
      getActiveTp()
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => updatedBookingData.value?.user?.id,
  (newVal) => {
    if (newVal) getActiveTp()
  }
)
</script>

<style scoped lang="scss">
@use '@/assets/styles/calendar/color-variants';

.edit-sidebar {
  display: flex;
  flex-direction: column;
  direction: rtl;
  height: 100%;
  padding-top: 4px;

  &__topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 8px;
    flex-shrink: 0;
  }

  &__topbar-back {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    color: #0055ff;
  }

  &__topbar-delete {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff3f3;
    border-radius: 8px;
    cursor: pointer;
    color: #e53935;

    &--disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 5px;

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

  &__patient {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    border: 1px solid #eee;
    border-radius: 12px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: #fafafa;
    }
  }

  &__patient-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  &__patient-name {
    font-size: 18px;
    font-weight: 700;
    color: #1d1d1d;
  }

  &__patient-phone {
    font-size: 14px;
    font-weight: 500;
    color: #424242;
    direction: ltr;
  }

  &__cbct {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__cbct-dot {
    width: 8px;
    height: 8px;
    background: #0055ff;
    border-radius: 50%;
  }

  &__call-btns {
    display: flex;
    gap: 10px;
    width: 100%;
  }

  &__call-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 40px;
    border: 1.5px solid #c8e6c9;
    border-radius: 10px;
    background: #f1f8f1;
    font-size: 14px;
    font-weight: 500;
    color: #2e7d32;
    cursor: pointer;
    text-decoration: none;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid #eee;
  }

  &__card {
    border: 1px solid #eee;
    border-radius: 12px;
    padding: 10px 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__status-right {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  &__status-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 20px;
    transition: all 0.2s ease;

    &--active {
      background: rgba(255, 152, 0, 0.1);
      color: #e65100;
    }

    &--done {
      background: rgba(76, 175, 80, 0.1);
      color: #2e7d32;
    }

    &--canceled {
      background: rgba(229, 57, 53, 0.1);
      color: #e53935;
    }
  }

  &__date-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  &__cal-icon {
    width: 32px;
    height: 32px;
    background: #f5f5f5;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__dashed {
    border-top: 2px dashed #e0e0e0;
  }

  &__time-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__time-field {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__time-sep {
    padding-top: 20px;
    flex-shrink: 0;
  }

  &__two-col {
    display: flex;
    gap: 10px;
  }

  &__col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__status-dropdown {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    background: #ffffff;
    border: 1px solid #eeeeee;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(105, 117, 134, 0.15);
    width: 180px;
  }

  &__status-dropdown-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;

    &--pending {
      background: rgba(0, 85, 255, 0.08);
      color: #0055ff;

      &:hover {
        background: rgba(0, 85, 255, 0.14);
      }
    }

    &--done {
      background: rgba(76, 175, 80, 0.1);
      color: #2e7d32;

      &:hover {
        background: rgba(76, 175, 80, 0.18);
      }
    }

    &--canceled {
      background: rgba(244, 67, 54, 0.08);
      color: #e53935;

      &:hover {
        background: rgba(244, 67, 54, 0.14);
      }
    }
  }

  &__divider {
    height: 1px;
    background: #f0f0f0;
    margin: 4px -20px 0;
    flex-shrink: 0;
  }

  &__bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px 0 8px;
    flex-shrink: 0;
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
