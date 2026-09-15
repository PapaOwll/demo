<template>
  <div class="report-dashboard">
    <div class="report-dashboard__header">
      <div class="report-dashboard__date-container" @click="datePopup?.show()">
        <QInput
          v-model="dateRangeDisplay"
          outlined
          readonly
          bg-color="white"
          label="بازه زمانی گزارش"
          class="report-dashboard__date-input"
          color="primary"
          clearable
          @click="datePopup?.show()"
          @clear="clearDateRange"
        >
          <template #prepend>
            <QIcon name="date_range" color="primary" />
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
            <div class="report-dashboard-date-popup">
              <QDate
                v-model="dateRange"
                range
                calendar="persian"
                mask="YYYY/MM/DD"
                color="primary"
                first-day-of-week="6"
                today-btn
                :navigation-min-year-month="'1300/01'"
                :navigation-max-year-month="'1450/12'"
              >
                <div class="report-dashboard__date-actions">
                  <QBtn label="امروز" color="primary" flat @click="setToday" />
                  <QBtn label="هفته گذشته" color="primary" flat @click="setLastWeek" />
                  <QBtn label="ماه گذشته" color="primary" flat @click="setLastMonth" />
                  <QBtn
                    label="تایید"
                    color="primary"
                    unelevated
                    :disable="!isDateRangeValid"
                    @click="confirmDateRange"
                  />
                </div>
              </QDate>
            </div>
          </QPopupProxy>
        </QInput>
      </div>
    </div>
    <Widgets :start="startTime" :end="endTime" />
    <!-- <Charts :start="startTime" :end="endTime" /> -->
    <AdvisersReport />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { convertToGregorian, toJalaali } from '@/utils/date-utils'
import Widgets from '../components/DashboardWidgets'
// import Charts from '../components/DashboardCharts'
import AdvisersReport from '@/modules/Dashboard/components/AdvisersReport'

const datePopup = ref(null)

// Get current date and previous month date
const today = new Date()
const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())

// Convert to Jalali for initial range
const todayJalali = toJalaali(today)
const prevMonthJalali = toJalaali(prevMonthDate)

// Initialize date range in Jalali format (YYYY/MM/DD)
const dateRange = ref({
  from: `${prevMonthJalali.jy}/${String(prevMonthJalali.jm).padStart(2, '0')}/${String(prevMonthJalali.jd).padStart(2, '0')}`,
  to: `${todayJalali.jy}/${String(todayJalali.jm).padStart(2, '0')}/${String(todayJalali.jd).padStart(2, '0')}`,
})

// Keep a copy of confirmed date range
const confirmedDateRange = ref({
  from: `${prevMonthJalali.jy}/${String(prevMonthJalali.jm).padStart(2, '0')}/${String(prevMonthJalali.jd).padStart(2, '0')}`,
  to: `${todayJalali.jy}/${String(todayJalali.jm).padStart(2, '0')}/${String(todayJalali.jd).padStart(2, '0')}`,
})

// Check if date range is valid
const isDateRangeValid = computed(() => {
  return dateRange.value && dateRange.value.from && dateRange.value.to
})

// Display text for the date range
const dateRangeDisplay = computed(() => {
  if (confirmedDateRange.value && confirmedDateRange.value.from && confirmedDateRange.value.to) {
    return `از ${confirmedDateRange.value.from} تا ${confirmedDateRange.value.to}`
  }
  return ''
})

// Convert Jalali dates to Gregorian with time for API
const startTime = computed(() => {
  if (confirmedDateRange.value && confirmedDateRange.value.from) {
    return `${convertToGregorian(confirmedDateRange.value.from, 'YYYY-MM-DD')} 00:00:00`
  }
  return null
})

const endTime = computed(() => {
  if (confirmedDateRange.value && confirmedDateRange.value.to) {
    return `${convertToGregorian(confirmedDateRange.value.to, 'YYYY-MM-DD')} 23:59:59`
  }
  return null
})

// Helper functions for quick date selection
const setToday = () => {
  const currentDate = new Date()
  const currentJalali = toJalaali(currentDate)
  const todayStr = `${currentJalali.jy}/${String(currentJalali.jm).padStart(2, '0')}/${String(currentJalali.jd).padStart(2, '0')}`
  dateRange.value = {
    from: todayStr,
    to: todayStr,
  }
}

const setLastWeek = () => {
  const currentDate = new Date()
  const lastWeek = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
  const currentJalali = toJalaali(currentDate)
  const lastWeekJalali = toJalaali(lastWeek)

  dateRange.value = {
    from: `${lastWeekJalali.jy}/${String(lastWeekJalali.jm).padStart(2, '0')}/${String(lastWeekJalali.jd).padStart(2, '0')}`,
    to: `${currentJalali.jy}/${String(currentJalali.jm).padStart(2, '0')}/${String(currentJalali.jd).padStart(2, '0')}`,
  }
}

const setLastMonth = () => {
  const currentDate = new Date()
  const lastMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1,
    currentDate.getDate()
  )
  const currentJalali = toJalaali(currentDate)
  const lastMonthJalali = toJalaali(lastMonth)

  dateRange.value = {
    from: `${lastMonthJalali.jy}/${String(lastMonthJalali.jm).padStart(2, '0')}/${String(lastMonthJalali.jd).padStart(2, '0')}`,
    to: `${currentJalali.jy}/${String(currentJalali.jm).padStart(2, '0')}/${String(currentJalali.jd).padStart(2, '0')}`,
  }
}

const clearDateRange = () => {
  dateRange.value = { from: '', to: '' }
  confirmedDateRange.value = { from: '', to: '' }
}

// Confirm date range and close popup
const confirmDateRange = () => {
  if (isDateRangeValid.value) {
    confirmedDateRange.value = { ...dateRange.value }
    datePopup.value?.hide()
  }
}
</script>

<style lang="scss" scoped>
.report-dashboard {
  &__header {
    margin-bottom: 1.5rem;
  }

  &__date-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 250px;
  }

  &__date-input {
    width: 250px;

    :deep(.q-field__control) {
      cursor: pointer;
    }
  }

  &__date-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 1rem;
  }
}
.report-dashboard-date-popup {
  .q-date {
    min-width: 400px !important;
    width: 400px !important;
    border: 1px solid $grey-4;
    border-radius: 8px;

    &__calendar {
      padding: 1rem;
      min-width: 350px !important;
    }

    &__header {
      min-width: 350px !important;
      background-color: $grey-1;
      border-radius: 8px 8px 0 0;
      padding: 1rem;
    }

    &__content {
      min-width: 350px !important;
    }

    &__main {
      overflow: visible !important;
    }
  }
}

.q-popup__inner {
  overflow: visible !important;
  max-height: none !important;
  padding: 0 !important;
}
</style>
