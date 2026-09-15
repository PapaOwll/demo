<template>
  <QDialog
    :model-value="visible"
    backdrop-filter="blur(1px)"
    transition-show="scale"
    style="width: 620px"
    @update:model-value="closeForm"
    @escape-key="closeForm"
  >
    <QCard class="full-width">
      <QCardSection style="max-height: 90vh" class="scroll">
        <div class="form-header">
          <h5>ویرایش حضور و غیاب</h5>
          <QBtn flat color="secondary" unelevated round @click="closeForm">
            <IconSquareRoundedX />
          </QBtn>
        </div>
        <QSeparator />
        <QForm @submit.prevent="submitForm">
          <div class="row q-col-gutter-sm">
            <div class="col-12">
              <QInput :model-value="userName" label="کاربر" outlined disable readonly />
            </div>
            <div class="col-12">
              <RoomSelectField
                :model-value="formData.roomId"
                label="اتاق"
                placeholder="انتخاب اتاق..."
                :branch-id="userBranchId"
                clearable
                @update:model-value="(e) => handleChange('roomId', e)"
              />
            </div>
            <div class="col-md-6 col-12">
              <PersianDate
                label="تاریخ ورود"
                placeholder="YYYY/MM/DD"
                :model-value="formData.checkedInDate"
                :error="errors?.checkedInDate ? !!errors?.checkedInDate : null"
                :error-message="errors?.checkedInDate"
                @update:model-value="(e) => handleChange('checkedInDate', e, 'checkInTimeInput')"
              />
            </div>
            <div class="col-md-6 col-12">
              <QInput
                ref="checkInTimeInput"
                :model-value="formData.checkedInTime"
                label="ساعت ورود"
                outlined
                :error="errors?.checkedInTime ? !!errors?.checkedInTime : null"
                :error-message="errors?.checkedInTime"
                mask="time"
                readonly
                :disable="!formData.checkedInDate"
              >
                <template #append>
                  <QIcon
                    name="access_time"
                    :class="formData.checkedInDate ? 'cursor-pointer' : 'cursor-not-allowed'"
                  >
                    <QPopupProxy
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                      :disable="!formData.checkedInDate"
                    >
                      <QTime
                        ref="checkInTimePicker"
                        :model-value="formData.checkedInTime"
                        format24h
                        mask="HH:mm"
                        @update:model-value="(val) => handleChange('checkedInTime', val)"
                      >
                        <div class="row items-center justify-end">
                          <QBtn v-close-popup label="بستن" color="primary" flat />
                        </div>
                      </QTime>
                    </QPopupProxy>
                  </QIcon>
                </template>
              </QInput>
            </div>
            <div class="col-md-6 col-12">
              <PersianDate
                label="تاریخ خروج"
                placeholder="YYYY/MM/DD"
                :model-value="formData.checkedOutDate"
                clearable
                :error="errors?.checkedOutDate ? !!errors?.checkedOutDate : null"
                :error-message="errors?.checkedOutDate"
                @update:model-value="(e) => handleChange('checkedOutDate', e, 'checkOutTimeInput')"
              />
            </div>
            <div class="col-md-6 col-12">
              <QInput
                ref="checkOutTimeInput"
                :model-value="formData.checkedOutTime"
                label="ساعت خروج"
                outlined
                :error="errors?.checkedOutTime ? !!errors?.checkedOutTime : null"
                :error-message="errors?.checkedOutTime"
                mask="time"
                readonly
                :disable="!formData.checkedOutDate"
              >
                <template #append>
                  <QIcon
                    name="access_time"
                    :class="formData.checkedOutDate ? 'cursor-pointer' : 'cursor-not-allowed'"
                  >
                    <QPopupProxy
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                      :disable="!formData.checkedOutDate"
                    >
                      <QTime
                        ref="checkOutTimePicker"
                        :model-value="formData.checkedOutTime"
                        format24h
                        mask="HH:mm"
                        @update:model-value="(val) => handleChange('checkedOutTime', val)"
                      >
                        <div class="row items-center justify-end">
                          <QBtn v-close-popup label="بستن" color="primary" flat />
                        </div>
                      </QTime>
                    </QPopupProxy>
                  </QIcon>
                </template>
              </QInput>
            </div>
            <div class="col-12 flex justify-end items-center q-gutter-sm">
              <QBtn
                outline
                square
                label="انصراف"
                color="negative"
                class="q-px-xl"
                :loading="isUpdatePending"
                @click="closeForm"
              />
              <QBtn
                :loading="isUpdatePending"
                square
                unelevated
                type="submit"
                label="ثبت"
                class="q-px-xl"
                color="primary"
              />
            </div>
          </div>
        </QForm>
      </QCardSection>
    </QCard>
  </QDialog>
</template>

<script setup>
import { computed, nextTick, ref, toRefs } from 'vue'
import { object, string } from 'yup'
import { useApiUpdateAttendance } from '../query'
import useYup from '@/composables/use-yup'
import { Notif } from '@/data/services/notification-service'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/user'
import PersianDate from '@/components/Form/PersianDate'
import RoomSelectField from '@/components/Form/RoomSelectField'
import { IconSquareRoundedX } from '@tabler/icons-vue'
import { formatDate } from '@/utils/date-utils'

const emits = defineEmits(['close', 'submitted'])
const props = defineProps({
  visible: { type: Boolean, default: false },
  editValue: {
    type: Object,
    default: () => ({}),
  },
})

const userStore = useUserStore()
const { userData } = storeToRefs(userStore)
const { visible, editValue } = toRefs(props)

const userBranchId = computed(() => userData.value?.branch?.id)

const updatedFormData = ref(null)

const initialFormData = computed(() => {
  if (!editValue.value) return {}

  const result = {}

  if (editValue.value?.checkedInAt) {
    const checkedInDate = new Date(editValue.value.checkedInAt)
    result.checkedInDate = formatDate(checkedInDate, 'YYYY-MM-DD')
    result.checkedInTime = formatDate(checkedInDate, 'HH:mm')
  }

  if (editValue.value?.checkedOutAt) {
    const checkedOutDate = new Date(editValue.value.checkedOutAt)
    result.checkedOutDate = formatDate(checkedOutDate, 'YYYY-MM-DD')
    result.checkedOutTime = formatDate(checkedOutDate, 'HH:mm')
  }

  if (editValue.value?.room?.id) {
    result.roomId = editValue.value.room.id
  }

  return result
})

const formData = computed(() => updatedFormData.value || initialFormData.value || {})

const userName = computed(() => {
  const user = editValue.value?.user
  if (!user) return ''
  return `${user.name || ''} / ${user.mobile || ''}`
})

const attendanceFormSchema = object().shape({
  checkedInDate: string().required('تاریخ ورود الزامیست'),
  checkedInTime: string().required('ساعت ورود الزامیست'),
  checkedOutDate: string().nullable(),
  checkedOutTime: string().nullable(),
  roomId: string()
    .nullable()
    .test('is-valid-room', 'اتاق معتبر نیست', (val) => {
      if (!val) return true
      return typeof val === 'number' || typeof val?.id === 'number' || typeof val === 'string'
    }),
})

const { validate, validateAt, errors } = useYup(attendanceFormSchema)

const handleChange = (field, value, focusRef) => {
  const newData = { ...formData.value, [field]: value }
  updatedFormData.value = newData
  validateAt(field, value, newData)

  // If this is a date field change, focus on corresponding time input
  if (focusRef) {
    nextTick(() => {
      const timeIcon = document.querySelector(`[ref="${focusRef}"] i.q-icon.cursor-pointer`)
      if (timeIcon) {
        timeIcon.click()
      }
    })
  }
}

const { mutate: updateAttendance, isPending: isUpdatePending } = useApiUpdateAttendance()

const closeForm = () => {
  emits('close', false)
  updatedFormData.value = null
}

const extractId = (value) => {
  if (!value) return null
  return typeof value === 'object' ? value?.id || value?.value : value
}

const submitForm = async () => {
  const { isValid, payload } = await validate(formData.value)
  if (!isValid) return

  let checkedInAt = null
  let checkedOutAt = null

  if (payload.checkedInDate) {
    const dateStr =
      typeof payload.checkedInDate === 'object' && payload.checkedInDate.en
        ? payload.checkedInDate.en
        : payload.checkedInDate
    checkedInAt = `${dateStr} ${payload.checkedInTime || '00:00'}:00`
  }

  if (payload.checkedOutDate) {
    const dateStr =
      typeof payload.checkedOutDate === 'object' && payload.checkedOutDate.en
        ? payload.checkedOutDate.en
        : payload.checkedOutDate
    checkedOutAt = `${dateStr} ${payload.checkedOutTime || '00:00'}:00`
  }

  const data = {
    id: editValue.value?.id,
    checkedInAt,
    checkedOutAt,
  }

  // Always send roomId, even if it's null (to clear the room)
  data.roomId = extractId(payload.roomId)

  updateAttendance(data, {
    onSuccess: (response) => {
      Notif.success(response.message || 'اطلاعات با موفقیت ویرایش شد')
      emits('submitted')
      closeForm()
    },
  })
}
</script>

<style lang="scss" scoped>
.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h5 {
    margin: 0;
  }
}

.cursor-not-allowed {
  cursor: not-allowed !important;
  opacity: 0.6;
}
</style>
