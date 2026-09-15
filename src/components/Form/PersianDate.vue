<template>
  <div @click="disable ? null : datePopup?.show()">
    <TextField
      :model-value="form"
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
        <IconCalendar :size="18" color="#9E9E9E" />
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
        <div class="persian-popup">
          <QDate
            v-model="tempDate"
            :first-day-of-week="firstDayOfWeek"
            mask="YYYY/MM/DD"
            color="primary"
            today-btn
            calendar="persian"
            :navigation-min-year-month="'1300/01'"
            :navigation-max-year-month="'1450/12'"
          >
            <div class="persian-popup__actions">
              <QBtn label="امروز" color="primary" flat @click="setToday" />
              <QBtn label="هفته گذشته" color="primary" flat @click="setLastWeek" />
              <QBtn label="ماه گذشته" color="primary" flat @click="setLastMonth" />
              <QBtn
                label="تایید"
                color="primary"
                unelevated
                :disable="!tempDate"
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
import { IconCalendar } from '@tabler/icons-vue'
import TextField from '@/base/TextField'
import { convertToJalali, convertToGregorian, toJalaali } from '@/utils/date-utils'

const props = defineProps({
  options: {
    type: [Array, Object, Function],
    default: null,
  },
  disable: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  dense: {
    type: Boolean,
    default: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: '',
  },
  modelValue: {
    type: String,
    default: null,
  },
  format: {
    type: String,
    default: 'YYYY-MM-DD',
  },
  displayFormat: {
    type: String,
    default: '',
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
})

const emit = defineEmits(['update:modelValue'])
const datePopup = ref(null)
const tempDate = ref(null)

watch(
  () => datePopup.value?.showing,
  (isShowing) => {
    if (isShowing) {
      if (props.modelValue) {
        tempDate.value = convertToJalali(props.modelValue)
      } else {
        // Set to current date if no value exists
        const currentDate = new Date()
        const currentJalali = toJalaali(currentDate)
        tempDate.value = `${currentJalali.jy}/${String(currentJalali.jm).padStart(2, '0')}/${String(currentJalali.jd).padStart(2, '0')}`
      }
    }
  }
)

const form = computed(() => {
  if (!props.modelValue) return ''
  return props.displayFormat
    ? convertToJalali(props.modelValue, props.displayFormat)
    : convertToJalali(props.modelValue)
})

const handleClear = () => {
  emit('update:modelValue', null)
}

const confirmDate = () => {
  if (tempDate.value) {
    emit('update:modelValue', convertToGregorian(tempDate.value, props.format))
    datePopup.value?.hide()
  }
}

const setToday = () => {
  const currentDate = new Date()
  const currentJalali = toJalaali(currentDate)
  tempDate.value = `${currentJalali.jy}/${String(currentJalali.jm).padStart(2, '0')}/${String(currentJalali.jd).padStart(2, '0')}`
}

const setLastWeek = () => {
  const currentDate = new Date()
  const lastWeek = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
  const lastWeekJalali = toJalaali(lastWeek)
  tempDate.value = `${lastWeekJalali.jy}/${String(lastWeekJalali.jm).padStart(2, '0')}/${String(lastWeekJalali.jd).padStart(2, '0')}`
}

const setLastMonth = () => {
  const currentDate = new Date()
  const lastMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1,
    currentDate.getDate()
  )
  const lastMonthJalali = toJalaali(lastMonth)
  tempDate.value = `${lastMonthJalali.jy}/${String(lastMonthJalali.jm).padStart(2, '0')}/${String(lastMonthJalali.jd).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.persian {
  :deep(.q-field__control) {
    cursor: pointer;
  }
}

.persian-popup {
  .q-date {
    min-width: 400px !important;
    width: 400px !important;
    border: 1px solid $grey-4;
    border-radius: 8px;
  }

  :deep(.q-date__calendar) {
    padding: 1rem;
    min-width: 350px !important;
  }

  :deep(.q-date__header) {
    min-width: 350px !important;
    background-color: $grey-1;
    border-radius: 8px 8px 0 0;
    padding: 1rem;
  }

  :deep(.q-date__content) {
    min-width: 350px !important;
  }

  :deep(.q-date__main) {
    overflow: visible !important;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid $grey-3;
  }
}

:deep(.q-menu.q-position-engine) {
  max-height: none !important;
  overflow: visible !important;
  background: transparent !important;
  box-shadow: none !important;
}

:deep(.q-popup__inner) {
  overflow: visible !important;
  max-height: none !important;
  padding: 0 !important;
}
</style>
