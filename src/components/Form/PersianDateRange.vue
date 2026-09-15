<template>
  <div class="persian-range-wrapper" @click="openPopup">
    <TextField
      :model-value="displayValue"
      color="primary"
      variant="outline"
      :label="label"
      :clearable="clearable"
      :disable="disable"
      :loading="loading"
      :error="error"
      :error-message="errorMessage"
      readonly
      bg-color="white"
      @clear="handleClear"
      @click="datePopup?.show()"
    >
      <template #endSection>
        <IconCalendarStats :size="18" color="#9E9E9E" />
      </template>
      <QPopupProxy
        ref="datePopup"
        transition-show="scale"
        transition-hide="scale"
        :offset="[0, 10]"
        anchor="bottom left"
        self="top left"
        :max-height="'none'"
        :max-width="'none'"
      >
        <div class="persian-range-popup">
          <QDate
            v-model="tempRange"
            :first-day-of-week="firstDayOfWeek"
            mask="YYYY/MM/DD"
            color="primary"
            range
            calendar="persian"
            :navigation-min-year-month="'1300/01'"
            :navigation-max-year-month="maxYearMonth"
            :options="dateOptions"
          >
            <div class="persian-range-popup__actions">
              <QBtn
                label="امروز"
                color="grey-7"
                flat
                dense
                no-caps
                class="persian-range-popup__action-btn"
                @click="setToday"
              />
              <QBtn
                label="هفته گذشته"
                color="grey-7"
                flat
                dense
                no-caps
                class="persian-range-popup__action-btn"
                @click="setLastWeek"
              />
              <QBtn
                label="ماه گذشته"
                color="grey-7"
                flat
                dense
                no-caps
                class="persian-range-popup__action-btn"
                @click="setLastMonth"
              />
              <QBtn
                label="تایید"
                color="primary"
                unelevated
                dense
                no-caps
                class="persian-range-popup__confirm-btn"
                :disable="!isValidRange"
                @click="confirmDate"
              />
            </div>
          </QDate>
        </div>
      </QPopupProxy>
    </TextField>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IconCalendarStats } from '@tabler/icons-vue'
import TextField from '@/base/TextField'
import { convertToJalali, convertToGregorian, toJalaali } from '@/utils/date-utils'

const props = defineProps({
  disable: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: 'بازه تاریخ',
  },
  modelValue: {
    type: Object,
    default: null,
  },
  format: {
    type: String,
    default: 'YYYY-MM-DD',
  },
  firstDayOfWeek: {
    type: Number,
    default: 6,
  },
  error: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  maxToday: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])
const datePopup = ref(null)
const tempRange = ref(null)

const todayJalali = computed(() => {
  const today = new Date()
  const jalali = toJalaali(today)
  return `${jalali.jy}/${String(jalali.jm).padStart(2, '0')}/${String(jalali.jd).padStart(2, '0')}`
})

const maxYearMonth = computed(() => {
  if (props.maxToday) {
    const today = new Date()
    const jalali = toJalaali(today)
    return `${jalali.jy}/${String(jalali.jm).padStart(2, '0')}`
  }
  return '1450/12'
})

const dateOptions = (date) => {
  if (!props.maxToday) return true
  return date <= todayJalali.value
}

const isValidRange = computed(() => {
  if (!tempRange.value) return false
  if (typeof tempRange.value === 'object' && tempRange.value.from && tempRange.value.to) {
    return true
  }
  return typeof tempRange.value === 'string'
})

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const { from, to } = props.modelValue
  if (from && to) {
    const fromJalali = convertToJalali(from)
    const toJalali = convertToJalali(to)
    return `${fromJalali} - ${toJalali}`
  }
  return ''
})

watch(
  () => datePopup.value?.showing,
  (isShowing) => {
    if (isShowing) {
      tempRange.value =
        props.modelValue?.from && props.modelValue?.to
          ? {
              from: convertToJalali(props.modelValue.from),
              to: convertToJalali(props.modelValue.to),
            }
          : null
    }
  }
)

const openPopup = () => {
  if (!props.disable) {
    datePopup.value?.show()
  }
}

const handleClear = () => {
  datePopup.value?.hide()
  emit('update:modelValue', null)
}

const confirmDate = () => {
  if (!tempRange.value) return

  let from
  let to

  if (typeof tempRange.value === 'string') {
    from = convertToGregorian(tempRange.value, props.format)
    to = from
  } else if (tempRange.value.from && tempRange.value.to) {
    from = convertToGregorian(tempRange.value.from, props.format)
    to = convertToGregorian(tempRange.value.to, props.format)
  } else {
    return
  }

  emit('update:modelValue', { from, to })
  datePopup.value?.hide()
}

const setToday = () => {
  tempRange.value = {
    from: todayJalali.value,
    to: todayJalali.value,
  }
}

const setLastWeek = () => {
  const today = new Date()
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const lastWeekJalali = toJalaali(lastWeek)
  const lastWeekStr = `${lastWeekJalali.jy}/${String(lastWeekJalali.jm).padStart(2, '0')}/${String(lastWeekJalali.jd).padStart(2, '0')}`

  tempRange.value = {
    from: lastWeekStr,
    to: todayJalali.value,
  }
}

const setLastMonth = () => {
  const today = new Date()
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
  const lastMonthJalali = toJalaali(lastMonth)
  const lastMonthStr = `${lastMonthJalali.jy}/${String(lastMonthJalali.jm).padStart(2, '0')}/${String(lastMonthJalali.jd).padStart(2, '0')}`

  tempRange.value = {
    from: lastMonthStr,
    to: todayJalali.value,
  }
}
</script>

<style scoped lang="scss">
.persian-range-wrapper {
  cursor: pointer;

  :deep(*) {
    cursor: pointer;
  }

  :deep(input) {
    cursor: pointer !important;
  }
}

.persian-range-popup {
  .q-date {
    min-width: 400px !important;
    min-height: 400px;
    width: 400px !important;
    border: 1px solid $grey-4;
    border-radius: 8px;
  }

  :deep(.q-date__calendar) {
    padding: 0.2rem 1rem;
    min-width: 350px !important;
  }
  :deep(.q-date__view) {
    padding: 0;
    min-height: auto !important;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 2px 4px;
  }

  &__confirm-btn {
    padding: 4px 12px;
    margin-inline-start: 4px;
  }
}
</style>
