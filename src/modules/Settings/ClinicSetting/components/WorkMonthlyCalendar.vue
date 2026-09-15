<template>
  <div class="work-time-calendar">
    <div class="work-time-calendar__header">
      <QBtn
        outline
        color="primary"
        :disable="!selectedDates || selectedDates.length === 0"
        @click="clearSelection"
      >
        پاک کردن انتخاب‌ها
      </QBtn>
    </div>

    <QDate
      v-model="selectedDates"
      calendar="persian"
      :first-day-of-week="6"
      mask="YYYY/MM/DD"
      color="primary"
      today-btn
      :navigation-min-year-month="'1300/01'"
      :navigation-max-year-month="'1450/12'"
      :events="holidayEvents"
      :event-color="getEventColor"
      :options="isDateEnabled"
      multiple
      minimal
      @navigation="handleNavigation"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { toJalaali, convertToJalali, convertToGregorian } from '@/utils/date-utils'
import {
  useApiGetWorkTimeCalendar,
  useApiSetWorkTimeCalendar,
} from '@/modules/Settings/ClinicSetting/query'
import { useApiGetSettings } from '@/modules/Settings'
import { useQueryClient } from '@tanstack/vue-query'
import { Notif } from '@/data/services/notification-service'

const props = defineProps({
  branchId: {
    type: [Number, String],
    default: null,
  },
})

const queryClient = useQueryClient()

const now = new Date()
const jalali = toJalaali(now)
const selectedDates = ref([])

watch(selectedDates, (newValue) => {
  if (newValue === null || newValue === undefined) {
    selectedDates.value = []
  }
})

const currentMonth = ref({
  year: jalali.jy,
  month: jalali.jm,
})

const branchIdRef = computed(() => props.branchId)

const workTimeQueryParams = computed(() =>
  props.branchId ? { branch_id: props.branchId } : undefined
)
const { data: clinicWorkTime } = useApiGetSettings('workTime', workTimeQueryParams)

const weekdayMap = {
  saturday: 0,
  sunday: 1,
  monday: 2,
  tuesday: 3,
  wednesday: 4,
  thursday: 5,
  friday: 6,
}

const inactiveWeekdays = computed(() => {
  if (!clinicWorkTime.value?.workTimes) return new Set()

  const workTimesObject = clinicWorkTime.value.workTimes
  const inactiveSet = new Set()

  Object.entries(workTimesObject).forEach(([weekdayName, workTime]) => {
    if (!workTime.isActive) {
      const weekdayNumber = weekdayMap[weekdayName.toLowerCase()]
      if (weekdayNumber !== undefined) {
        inactiveSet.add(weekdayNumber)
      }
    }
  })

  return inactiveSet
})

const queryParams = computed(() => ({
  year: currentMonth.value.year,
  month: currentMonth.value.month,
  branchId: branchIdRef.value,
}))

const { data: workTimeData } = useApiGetWorkTimeCalendar(queryParams)

const { mutate: saveWorkTime, isPending: isSaving } = useApiSetWorkTimeCalendar({
  onSuccess: () => {
    Notif.success('تغییرات با موفقیت ثبت شد', { position: 'top' })
    selectedDates.value = []
    queryClient.invalidateQueries({
      queryKey: ['work-time-calendar'],
    })
  },
})

const holidayEvents = computed(() => {
  if (!workTimeData.value?.items || !Array.isArray(workTimeData.value.items)) return []

  return workTimeData.value.items
    .filter((item) => item?.branchHoliday)
    .map((item) => {
      return convertToJalali(item.date, 'jYYYY/jMM/jDD')
    })
})

const getEventColor = () => {
  return 'negative'
}

// QDate options function (Quasar pattern)
function isDateEnabled(date) {
  if (inactiveWeekdays.value.size === 0) return true
  const gregorian = convertToGregorian(date, 'YYYY-MM-DD')
  const weekday = (new Date(gregorian).getDay() + 1) % 7
  return !inactiveWeekdays.value.has(weekday)
}

const handleNavigation = (view) => {
  if (view.year && view.month) {
    currentMonth.value = {
      year: view.year,
      month: view.month,
    }
  }
}

const clearSelection = () => {
  selectedDates.value = []
}

const saveHolidays = () => {
  if (isSaving.value) return
  if (!selectedDates.value || selectedDates.value.length === 0) return

  const workTimes = selectedDates.value.map((persianDate) => {
    const gregorianDate = convertToGregorian(persianDate, 'YYYY-MM-DD')
    const isCurrentlyHoliday = holidayEvents.value.includes(persianDate)
    return {
      date: gregorianDate,
      holiday: !isCurrentlyHoliday,
    }
  })

  const payload = {
    workTimes,
  }

  if (props.branchId) {
    payload.branchId = props.branchId
  }

  saveWorkTime(payload)
}

defineExpose({
  saveHolidays,
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/mixins';

.work-time-calendar {
  width: 100%;
  direction: rtl;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.2rem;

  @include media-breakpoint-down(md) {
    padding: 0.5rem;
    overflow-x: auto;
  }

  &__header {
    display: flex;
    gap: 1rem;
    justify-content: flex-start;
    align-items: center;
    padding: 0.5rem 0;

    @include media-breakpoint-down(sm) {
      flex-direction: column;
      align-items: stretch;

      button {
        width: 100%;
      }
    }
  }

  :deep(.q-date) {
    width: 100%;
    max-width: 900px;
    box-shadow: none;
    margin: 0 auto;

    @include media-breakpoint-down(md) {
      min-width: 600px;
    }
  }

  :deep(.q-date__header) {
    background-color: $grey-2;
    padding: 1rem;
    border-radius: 8px 8px 0 0;

    @include media-breakpoint-down(sm) {
      padding: 0.75rem;
    }
  }

  :deep(.q-date__calendar) {
    padding: 1rem;

    @include media-breakpoint-down(sm) {
      padding: 0.5rem;
    }
  }

  :deep(.q-date__calendar-weekdays) {
    background-color: $grey-2;
    border-radius: 4px;
    padding: 0.5rem 0;
    margin-bottom: 0.5rem;

    > div {
      font-weight: 600;
      color: $grey-8;
      font-size: 14px;

      @include media-breakpoint-down(sm) {
        font-size: 12px;
      }
    }
  }

  :deep(.q-date__calendar-item) {
    button {
      font-size: 14px;
      font-weight: 500;
      height: 40px;
      width: 40px;
      border: 1px solid $grey-3;
      border-radius: 4px;

      @include media-breakpoint-down(sm) {
        font-size: 12px;
        height: 36px;
        width: 36px;
      }

      @include media-breakpoint-up(lg) {
        font-size: 16px;
        min-height: 72px;
        min-width: 72px;
      }
    }
  }

  :deep(.q-date__view) {
    padding: 0;
  }

  :deep(.q-date__event) {
    width: 12px;
    height: 12px;
    border-radius: 20px;
    background-color: $negative;
  }
}
</style>
