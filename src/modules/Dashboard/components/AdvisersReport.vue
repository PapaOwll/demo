<template>
  <QCard class="advisers-report">
    <QCardSection class="advisers-report__header">
      <div class="advisers-report__header-content">
        <h4 class="advisers-report__title">گزارش مشاوران</h4>
        <div class="advisers-report__filters" @click="datePopup?.show()">
          <QInput
            v-model="dateRangeDisplay"
            outlined
            dense
            readonly
            class="advisers-report__date-input"
            @click="datePopup?.show()"
          >
            <template #prepend>
              <QIcon name="event" class="cursor-pointer" />
            </template>
            <QPopupProxy ref="datePopup" cover transition-show="scale" transition-hide="scale">
              <div class="advisers-report-date-popup">
                <QDate
                  v-model="tempDateRange"
                  range
                  calendar="persian"
                  mask="YYYY/MM/DD"
                  color="primary"
                  first-day-of-week="6"
                  today-btn
                  :navigation-min-year-month="'1300/01'"
                  :navigation-max-year-month="'1450/12'"
                >
                  <div class="advisers-report__date-actions">
                    <QBtn label="امروز" color="primary" flat size="sm" @click="setToday" />
                    <QBtn label="هفته گذشته" color="primary" flat size="sm" @click="setLastWeek" />
                    <QBtn label="ماه گذشته" color="primary" flat size="sm" @click="setLastMonth" />
                    <QBtn
                      label="تایید"
                      color="primary"
                      unelevated
                      size="sm"
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
    </QCardSection>
    <QCardSection class="advisers-report__content">
      <div v-if="isLoading" class="advisers-report__loading">
        <QSpinner color="grey-6" size="3em" />
      </div>
      <QTable
        v-else
        :rows="data || []"
        :columns="tableColumns"
        :pagination="{ rowsPerPage: 0 }"
        flat
        bordered
        separator="horizontal"
        class="quasar-table advisers-report__table"
        virtual-scroll
        :virtual-scroll-slice-size="30"
        :table-style="{ maxHeight: '600px' }"
        :no-data-label="null"
        hide-pagination
      >
        <template #bottom>
          <div class="advisers-report__table-footer">تعداد رکورد: {{ data?.length || 0 }}</div>
        </template>
        <template #body-cell-advisor="props">
          <QTd :props="props">
            <UserMenu :user="props.row.advisor" />
          </QTd>
        </template>
        <template
          v-for="(date, index) in dates"
          :key="`date-${index}`"
          #[`body-cell-date-${index}`]="props"
        >
          <QTd :props="props">
            <ul class="advisers-report__data-list">
              <li
                class="advisers-report__data-item advisers-report__data-item--visit"
                @click="
                  openBooking({
                    status: 1,
                    advisor_id: props.row.advisor.id,
                    booking_at_after: date.en,
                    booking_at_before: date.en,
                    has_visit: true,
                  })
                "
              >
                {{ props.row.dailyStatistics[index].visitCount }}
                <QTooltip>ویزیت</QTooltip>
              </li>
              <li
                class="advisers-report__data-item advisers-report__data-item--booking"
                @click="
                  openBooking({
                    status: 1,
                    advisor_id: props.row.advisor.id,
                    booking_at_after: date.en,
                    booking_at_before: date.en,
                  })
                "
              >
                {{ props.row.dailyStatistics[index].bookingCount }}
                <QTooltip>نوبت</QTooltip>
              </li>
              <li
                class="advisers-report__data-item advisers-report__data-item--canceled"
                @click="
                  openBooking({
                    status: 2,
                    advisor_id: props.row.advisor.id,
                    booking_at_after: date.en,
                    booking_at_before: date.en,
                  })
                "
              >
                {{ props.row.dailyStatistics[index].canceledBookingCount }}
                <QTooltip>نوبت کنسلی</QTooltip>
              </li>
            </ul>
          </QTd>
        </template>
      </QTable>
      <div class="advisers-report__guide">
        <span class="advisers-report__guide-title">راهنما:</span>
        <span class="advisers-report__guide-item">
          <i class="advisers-report__guide-icon advisers-report__guide-icon--booking">
            <QIcon name="check" size="10px" color="white" />
          </i>
          نوبت
        </span>
        <span class="advisers-report__guide-item">
          <i class="advisers-report__guide-icon advisers-report__guide-icon--visit">
            <QIcon name="check" size="10px" color="white" />
          </i>
          ویزیت
        </span>
        <span class="advisers-report__guide-item">
          <i class="advisers-report__guide-icon advisers-report__guide-icon--canceled">
            <QIcon name="check" size="10px" color="white" />
          </i>
          نوبت کنسلی
        </span>
      </div>
    </QCardSection>
  </QCard>
</template>

<script setup>
import { computed, ref } from 'vue'
import { toJalaali, convertToGregorian } from '@/utils/date-utils'
import UserMenu from '@/components/UserMenu'
import { useRouter } from 'vue-router'
import { useStatisticsQuery } from '@/modules/Dashboard/query'

const router = useRouter()
const datePopup = ref(null)

// Get date one week ago
const today = new Date()
const prevWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

// Convert to Jalali for initial range
const todayJalali = toJalaali(today)
const prevWeekJalali = toJalaali(prevWeek)

// Initialize date range in Jalali format (YYYY/MM/DD)
const dateRange = ref({
  from: `${prevWeekJalali.jy}/${String(prevWeekJalali.jm).padStart(2, '0')}/${String(prevWeekJalali.jd).padStart(2, '0')}`,
  to: `${todayJalali.jy}/${String(todayJalali.jm).padStart(2, '0')}/${String(todayJalali.jd).padStart(2, '0')}`,
})

// Temporary date range for the date picker (before confirmation)
const tempDateRange = ref({ ...dateRange.value })

// Check if date range is valid
const isDateRangeValid = computed(() => {
  return tempDateRange.value && tempDateRange.value.from && tempDateRange.value.to
})

// Display text for the date range
const dateRangeDisplay = computed(() => {
  if (dateRange.value && dateRange.value.from && dateRange.value.to) {
    return `${dateRange.value.from} - ${dateRange.value.to}`
  }
  return ''
})

// Convert dates to API format
const startTime = computed(() => {
  if (dateRange.value && dateRange.value.from) {
    return convertToGregorian(dateRange.value.from, 'YYYY-MM-DD')
  }
  return null
})

const endTime = computed(() => {
  if (dateRange.value && dateRange.value.to) {
    return convertToGregorian(dateRange.value.to, 'YYYY-MM-DD')
  }
  return null
})

const filters = computed(() => {
  return {
    start: startTime.value,
    end: endTime.value,
  }
})

const { data, isLoading } = useStatisticsQuery(filters)

const dates = computed(() => {
  const days = []
  data.value?.[0]?.dailyStatistics.forEach((day) => {
    const dateObj = new Date(day.date)
    const jalaliDate = toJalaali(dateObj)
    const dayName = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(dateObj)
    const formattedDate = `${jalaliDate.jy}/${String(jalaliDate.jm).padStart(2, '0')}/${String(jalaliDate.jd).padStart(2, '0')}`

    days.push({
      en: day.date,
      fa: `${dayName} \n ${formattedDate}`,
    })
  })
  return days
})

// Define table columns for QTable
const tableColumns = computed(() => {
  const columns = [
    {
      name: 'advisor',
      label: 'مشاور',
      field: 'advisor',
      align: 'right',
    },
  ]

  // Add columns for each date
  dates.value.forEach((date, index) => {
    columns.push({
      name: `date-${index}`,
      label: date.fa,
      field: (row) => row.dailyStatistics[index],
      align: 'center',
    })
  })

  return columns
})
// Helper functions for quick date selection
const setToday = () => {
  const currentDate = new Date()
  const currentJalali = toJalaali(currentDate)
  const todayStr = `${currentJalali.jy}/${String(currentJalali.jm).padStart(2, '0')}/${String(currentJalali.jd).padStart(2, '0')}`
  tempDateRange.value = {
    from: todayStr,
    to: todayStr,
  }
}

const setLastWeek = () => {
  const currentDate = new Date()
  const lastWeek = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
  const currentJalali = toJalaali(currentDate)
  const lastWeekJalali = toJalaali(lastWeek)

  tempDateRange.value = {
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

  tempDateRange.value = {
    from: `${lastMonthJalali.jy}/${String(lastMonthJalali.jm).padStart(2, '0')}/${String(lastMonthJalali.jd).padStart(2, '0')}`,
    to: `${currentJalali.jy}/${String(currentJalali.jm).padStart(2, '0')}/${String(currentJalali.jd).padStart(2, '0')}`,
  }
}

// Confirm date range and close popup
const confirmDateRange = () => {
  if (isDateRangeValid.value) {
    dateRange.value = { ...tempDateRange.value }
    datePopup.value?.hide()
  }
}

const openBooking = (row) => {
  const routeData = router.resolve({ path: '/booking', query: row })
  window.open(routeData.href, '_blank')
}
</script>

<style lang="scss" scoped>
.advisers-report {
  margin-top: 2rem;

  &__header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid $grey-3;
  }

  &__header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 500;
    color: $grey-9;
  }

  &__filters {
    display: flex;
    gap: 1rem;
  }

  &__date-input {
    width: 250px;

    :deep(.q-field__control) {
      cursor: pointer;
      height: 36px;
    }

    :deep(.q-field__native) {
      font-size: 0.875rem;
    }
  }

  &__date-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.25rem;
    padding: 0.75rem;
    border-top: 1px solid $grey-3;
  }

  &__content {
    padding: 1.5rem;
  }

  &__table {
    margin-bottom: 1rem;

    :deep(.q-table__container) {
      overflow-x: auto;
    }

    :deep(.q-table__middle) {
      max-height: 600px;
      overflow-y: auto;
    }

    :deep(.q-table th) {
      position: sticky;
      top: 0;
      background-color: $blue-1;
      z-index: 1;
      font-weight: 500;
      color: $primary;
      text-align: center;
    }

    :deep(.q-table tbody tr td:first-child) {
      position: sticky;
      left: 0;
      background-color: $white;
      z-index: 1;
      box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.1);
    }

    :deep(.q-table thead tr th:first-child) {
      position: sticky;
      left: 0;
      background-color: $blue-1;
      z-index: 2;
      box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.1);
      text-align: right;
    }

    :deep(.q-table tbody tr:nth-child(even)) {
      background-color: rgba(0, 0, 0, 0.02);
    }

    :deep(.q-table tbody tr:nth-child(even) td) {
      background-color: rgba(0, 0, 0, 0.02);
    }

    :deep(.q-table tbody tr:nth-child(even) td:first-child) {
      background-color: rgba(0, 0, 0, 0.02);
    }
  }

  &__table-footer {
    padding: 0.75rem 1rem;
    text-align: right;
    font-size: 0.875rem;
    color: $grey-7;
    border-top: 1px solid $grey-3;
  }

  &__data-list {
    display: flex;
    gap: 0.5rem;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  &__data-item {
    flex: 1;
    padding: 0.25rem;
    text-align: center;
    border-radius: 4px;
    background-color: $grey-3;
    border-bottom-width: 3px;
    border-bottom-style: solid;
    cursor: pointer;
    font-size: 0.875rem;

    &--visit {
      border-bottom-color: $green-6;
    }

    &--booking {
      border-bottom-color: $blue-6;
    }

    &--canceled {
      border-bottom-color: $red-6;
    }
  }

  &__guide {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
  }

  &__guide-title {
    font-size: 0.875rem;
    color: $grey-8;
    margin-right: 0.5rem;
  }

  &__guide-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.813rem;
    color: $grey-7;
  }

  &__guide-icon {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    &--booking {
      background-color: $blue-6;
    }

    &--visit {
      background-color: $green-6;
    }

    &--canceled {
      background-color: $red-6;
    }
  }

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 600px;
  }
}
</style>

<style lang="scss">
.advisers-report-date-popup {
  .q-date {
    min-width: 320px !important;
    width: 320px !important;
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.12),
      0 0 6px rgba(0, 0, 0, 0.04);

    &__calendar {
      padding: 0.5rem;
    }

    &__header {
      background-color: $grey-1;
      padding: 0.5rem;
    }

    &__content {
      padding: 0.5rem;
    }

    &__years-content {
      height: 200px !important;
    }
  }
}
</style>
