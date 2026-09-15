<template>
  <div class="persian-calendar">
    <CalendarTopbar
      :display-label="displayLabel"
      :view-mode="viewMode"
      :doctors="doctors"
      :selected-doctor-id="selectedDoctorId"
      :can-go-prev="canGoPrev()"
      :can-go-next="canGoNext()"
      :is-today-visible="isTodayVisible"
      :selected-tab="selectedTab"
      :current-date="currentDate"
      @prev="prev"
      @next="next"
      @today="goToday"
      @update:view-mode="setViewMode"
      @select-doctor="selectDoctor"
      @update:selected-tab="selectedTab = $event"
      @select-date="onSelectDate"
      @select-booking="onSearchSelectBooking"
    />

    <div class="persian-calendar__body">
      <CalendarBookingSidebar
        v-if="isDay || (isWeek && !isMulti)"
        :bookings="doctorBookings"
        :display-date="displayLabel"
        :selected-booking="effectiveSelectedBooking"
        :is-loading="isBookingsLoading"
        :is-detail-loading="isDetailLoading"
        :doctors="doctors"
        @add="onAdd"
        @select-booking="onSelectBooking"
      />

      <div class="persian-calendar__views">
        <div class="persian-calendar__views-card">
          <template v-if="isLoading">
            <div class="loading-state">
              <QSpinner color="primary" size="40px" />
            </div>
          </template>

          <template v-else-if="isError">
            <div class="error-state">
              <Typography variant="body" color="red">خطا در بارگذاری اطلاعات</Typography>
            </div>
          </template>

          <template v-else>
            <MultiDoctorWeekView
              v-if="isMulti && isWeek"
              :week-days="weekDays"
              :current-date="currentDate"
              :transit-dir="transitDir"
              :doctors="doctors"
              :sessions="sessions"
              :doctors-working-hours="doctorsWorkingHoursMap"
              @day-click="onDayClick"
              @select-doctor="selectDoctor"
            />

            <MultiDoctorMonthView
              v-else-if="isMulti && !isWeek"
              :month-weeks="monthWeeks"
              :current-date="currentDate"
              :transit-dir="transitDir"
              :today="TODAY"
              :doctors="doctors"
              :sessions="sessions"
              @day-click="onDayClick"
              @slot-click="$emit('slot-click', $event)"
              @select-doctor="selectDoctor"
            />

            <SingleDoctorWeekView
              v-else-if="!isMulti && isWeek"
              :week-days="weekDays"
              :current-date="currentDate"
              :transit-dir="transitDir"
              :bookings="doctorBookings"
              :doctor-color="selectedDoctorColor"
              :doctor-working-hours="selectedDoctorWorkingHours"
              :preview-booking="previewBookingData"
              @day-click="$emit('day-click', $event)"
              @slot-click="onSlotClick"
              @detail="onDetail"
              @go-day="goToDay"
            />

            <SingleDoctorDayView
              v-else-if="!isMulti && isDay"
              :day="dayData"
              :current-date="currentDate"
              :transit-dir="transitDir"
              :bookings="doctorBookings"
              :doctor-color="selectedDoctorColor"
              :doctor-working-hours="selectedDoctorWorkingHours"
              :preview-booking="previewBookingData"
              @detail="onDetail"
              @slot-click="onSlotClick"
            />

            <SingleDoctorMonthView
              v-else
              :month-weeks="monthWeeks"
              :current-date="currentDate"
              :transit-dir="transitDir"
              :sessions="selectedDoctorSessions"
              :bookings="doctorBookings"
              :doctor-color="selectedDoctorColor"
              :today="TODAY"
              @day-click="$emit('day-click', $event)"
              @slot-click="$emit('slot-click', $event)"
              @go-week="goToWeek"
              @go-day="goToDay"
            />
          </template>
        </div>
      </div>
    </div>

    <BookingFormCompact
      :visible="bookingFormVisible"
      :prefill-doctor-id="bookingFormPrefillDoctorId"
      :prefill-date="bookingFormPrefillDate"
      :prefill-type="bookingFormPrefillType"
      :prefill-time="bookingFormPrefillTime"
      :prefill-end-time="bookingFormPrefillEndTime"
      :anchor-x="bookingFormAnchorX"
      :anchor-y="bookingFormAnchorY"
      :doctors="doctors"
      @close="closeBookingForm"
      @after-submit="onBookingFormSubmit"
      @preview="onPreviewUpdate"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCalendar } from '../composables/useCalendar'
import { useBookingCalendarQuery, useBookingCalendarListQuery, useBookingQuery } from '../query'
import { useApiGetBranchDoctorsList } from '@/modules/Settings/ClinicSetting/query'
import { convertToJalali, convertToGregorian, jalaaliMonthLength } from '@/utils/date-utils'
import CalendarTopbar from './calendar/CalendarTopbar'
import CalendarBookingSidebar from './calendar/CalendarBookingSidebar'
import BookingFormCompact from './calendar/BookingFormCompact'
import MultiDoctorWeekView from './calendar/MultiDoctorWeekView'
import MultiDoctorMonthView from './calendar/MultiDoctorMonthView'
import SingleDoctorWeekView from './calendar/SingleDoctorWeekView'
import SingleDoctorDayView from './calendar/SingleDoctorDayView'
import SingleDoctorMonthView from './calendar/SingleDoctorMonthView'
import Typography from '@/base/Typography'
import { useUserStore } from '@/store/user'

const DOCTOR_COLORS = [
  'light-blue',
  'light-red',
  'light-purple',
  'light-green',
  'light-gray',
  'light-teal',
  'light-orange',
  'light-pink',
  'light-yellow',
  'blue',
  'pink',
  'purple',
  'teal',
  'amber',
  'gray',
]

const props = defineProps({
  initialDate: {
    type: [Date, String, Object],
    default: undefined,
  },
})

defineEmits(['day-click', 'slot-click', 'detail'])

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const currentBranchId = computed(() => userStore.userData?.branch?.id)

const selectedDoctorId = ref(null)
const selectedTab = ref('doctor')
const detailBookingId = ref(null)
const detailPlaceholder = ref(null)
let initialized = false
let skipTabWatch = false

const { data: detailBooking, isLoading: isDetailLoading } = useBookingQuery(
  detailBookingId,
  detailPlaceholder
)

const effectiveSelectedBooking = computed(() => {
  if (detailBooking.value && detailBooking.value?.id === detailBookingId.value) {
    return detailBooking.value
  }
  return detailPlaceholder.value
})

const bookingFormVisible = ref(false)
const bookingFormPrefillDoctorId = ref(null)
const bookingFormPrefillDate = ref('')
const bookingFormPrefillType = ref(2)
const bookingFormPrefillTime = ref(null)
const bookingFormPrefillEndTime = ref(null)
const bookingFormAnchorX = ref(0)
const bookingFormAnchorY = ref(0)
const previewBookingData = ref(null)

const {
  TODAY,
  currentDate,
  viewMode,
  transitDir,
  displayLabel,
  isTodayVisible,
  weekDays,
  dayData,
  monthWeeks,
  prev,
  next,
  goToday,
  canGoPrev,
  canGoNext,
  setViewMode,
} = useCalendar({
  initialDate: route.query.date || props.initialDate,
  initialViewMode: route.query.view || 'week',
})

if (route.query.doctor) selectedDoctorId.value = Number(route.query.doctor)
if (route.query.tab) selectedTab.value = route.query.tab
if (route.query.booking) detailBookingId.value = Number(route.query.booking)
initialized = true

const isMulti = computed(() => selectedDoctorId.value === null)
const isWeek = computed(() => viewMode.value === 'week')
const isDay = computed(() => viewMode.value === 'day')

function buildQuery() {
  const q = {}
  if (viewMode.value && viewMode.value !== 'week') q.view = viewMode.value
  if (currentDate.value) q.date = currentDate.value
  if (selectedDoctorId.value) q.doctor = String(selectedDoctorId.value)
  if (selectedTab.value && selectedTab.value !== 'doctor') q.tab = selectedTab.value
  if (detailBookingId.value) q.booking = String(detailBookingId.value)
  return q
}

watch([viewMode, currentDate, selectedDoctorId, selectedTab, detailBookingId], () => {
  const newQuery = buildQuery()
  const currentQuery = { ...route.query }
  if (JSON.stringify(newQuery) === JSON.stringify(currentQuery)) return
  router.replace({ query: newQuery })
})

watch(selectedTab, () => {
  if (!initialized || skipTabWatch) return
  selectedDoctorId.value = null
  setViewMode('week')
})

watch(
  () => route.query,
  (query) => {
    skipTabWatch = true
    viewMode.value = query.view || 'week'
    if (query.date) currentDate.value = query.date
    selectedDoctorId.value = query.doctor ? Number(query.doctor) : null
    selectedTab.value = query.tab || 'doctor'
    if (query.booking) {
      detailBookingId.value = Number(query.booking)
    }
    nextTick(() => {
      skipTabWatch = false
    })
  }
)

watch(selectedDoctorId, (newDoctorId) => {
  if (newDoctorId === null && (viewMode.value === 'day' || viewMode.value === 'month')) {
    viewMode.value = 'week'
  }
  if (!skipTabWatch) {
    detailBookingId.value = null
    detailPlaceholder.value = null
  }
})

watch([viewMode, currentDate], () => {
  if (!skipTabWatch) {
    detailBookingId.value = null
    detailPlaceholder.value = null
  }
})

function jalaliToGregorianStr(jalaliDateStr) {
  return convertToGregorian(jalaliDateStr.replace(/-/g, '/'), 'YYYY-MM-DD')
}

const dateRange = computed(() => {
  let from
  let to
  if (isDay.value) {
    from = jalaliToGregorianStr(currentDate.value)
    to = from
  } else if (isWeek.value) {
    const days = weekDays.value
    if (days.length > 0) {
      from = jalaliToGregorianStr(days[0].date)
      to = jalaliToGregorianStr(days.at(-1).date)
    } else {
      from = jalaliToGregorianStr(currentDate.value)
      to = from
    }
  } else {
    const [jYear, jMonth] = currentDate.value.split('-').map(Number)
    const monthLen = jalaaliMonthLength(jYear, jMonth)
    from = jalaliToGregorianStr(`${jYear}-${jMonth}-1`)
    to = jalaliToGregorianStr(`${jYear}-${jMonth}-${monthLen}`)
  }
  return { from, to }
})

const calendarFilters = computed(() => ({
  from: dateRange.value.from,
  to: dateRange.value.to,
  type: selectedTab.value,
}))

const { data: calendarData, isLoading, isError } = useBookingCalendarQuery(calendarFilters)

const { data: branchDoctorsData } = useApiGetBranchDoctorsList({
  branchId: currentBranchId,
  enabled: computed(() => !!currentBranchId.value),
})

const doctorsWorkingHoursMap = computed(() => {
  const map = {}
  const items = branchDoctorsData.value ?? []
  items.forEach((item) => {
    if (item.doctor?.id) {
      map[item.doctor.id] = item.workingHours || []
    }
  })
  return map
})

const selectedDoctorWorkingHours = computed(() => {
  if (!selectedDoctorId.value) return []
  return doctorsWorkingHoursMap.value[selectedDoctorId.value] || []
})

const doctors = computed(() => {
  if (!calendarData.value?.items) return []
  return calendarData.value.items.map((item, index) => ({
    id: item.id,
    name: item.name,
    color: DOCTOR_COLORS[index % DOCTOR_COLORS.length],
    totalBookingsCount: item.totalBookingsCount ?? item.total_bookings_count ?? 0,
  }))
})

const sessions = computed(() => {
  if (!calendarData.value?.items) return []
  const result = []
  calendarData.value.items.forEach((doctor) => {
    const days = doctor.days ?? []
    days.forEach((day) => {
      const jalaliDate = convertToJalali(day.date, 'jYYYY-jM-jD')
      result.push({
        id: `${doctor.id}-${day.date}`,
        doctorId: doctor.id,
        date: jalaliDate,
        slot: {
          time: day.totalBusyTime ?? '00:00',
          visit: day.visitBookingsCount ?? 0,
          perform: day.performBookingsCount ?? 0,
        },
      })
    })
  })
  return result
})

const selectedDoctorSessions = computed(() => {
  if (!selectedDoctorId.value) return []
  return sessions.value.filter((s) => s.doctorId === selectedDoctorId.value)
})

const selectedDoctorColor = computed(() => {
  if (!selectedDoctorId.value) return 'blue'
  return doctors.value.find((d) => d.id === selectedDoctorId.value)?.color ?? 'blue'
})

const bookingListFilters = computed(() => {
  if (!selectedDoctorId.value) return { 'filter[assign_to]': null }
  return {
    'filter[assign_to]': selectedDoctorId.value,
    'filter[type]': selectedTab.value === 'doctor' ? 2 : 1,
    'filter[booking_at_after]': `${dateRange.value.from} 00:00:00`,
    'filter[booking_at_before]': `${dateRange.value.to} 23:59:59`,
    page: 1,
  }
})

const { data: doctorBookings, isLoading: isBookingsLoading } =
  useBookingCalendarListQuery(bookingListFilters)

function selectDoctor(id) {
  selectedDoctorId.value = id
}

function onDayClick(event) {
  let clickedDay
  let doctorData

  if (event.doctor && event.day) {
    clickedDay = event.day
    doctorData = event.doctor
  } else {
    clickedDay = event
  }

  if (selectedDoctorId.value === null) {
    if (doctorData) {
      selectedDoctorId.value = doctorData.id
    }
    return
  }

  if (doctorData) {
    selectedDoctorId.value = doctorData.id
  }
  currentDate.value = clickedDay.date
  viewMode.value = 'day'
}

function goToWeek(date) {
  currentDate.value = date
  viewMode.value = 'week'
}

function goToDay(date) {
  currentDate.value = date
  viewMode.value = 'day'
}

function onSearchSelectBooking(booking) {
  if (!booking) return

  detailPlaceholder.value = booking

  const tab = booking.type === 2 ? 'doctor' : 'adviser'
  const doctorId =
    booking.assignTo && typeof booking.assignTo === 'object'
      ? booking.assignTo.id
      : booking.assignTo
  const jalaliDate = booking.bookingAt
    ? convertToJalali(booking.bookingAt, 'jYYYY-jM-jD')
    : currentDate.value

  router.replace({
    query: {
      view: 'day',
      date: jalaliDate,
      doctor: String(doctorId),
      tab,
      booking: String(booking.id),
    },
  })
}

function onSelectDate(date) {
  const [year, month, day] = date.split('-')
  currentDate.value = `${year}-${Number(month)}-${Number(day)}`
}

function onDetail(booking) {
  detailBookingId.value = null
  nextTick(() => {
    detailPlaceholder.value = booking
    detailBookingId.value = booking.id
  })
}

function onSelectBooking(booking) {
  if (!booking) {
    detailBookingId.value = null
    detailPlaceholder.value = null
    return
  }
  if (detailBookingId.value === booking.id) {
    detailBookingId.value = null
  }
  nextTick(() => {
    detailPlaceholder.value = booking
    detailBookingId.value = booking.id
  })
}

function openBookingForm(setupFn) {
  if (bookingFormVisible.value) {
    bookingFormVisible.value = false
    nextTick(() => {
      setupFn()
      bookingFormVisible.value = true
    })
  } else {
    setupFn()
    bookingFormVisible.value = true
  }
}

function onAdd(event) {
  openBookingForm(() => {
    if (event?.clientX != null && event?.clientY != null) {
      bookingFormAnchorX.value = event.clientX
      bookingFormAnchorY.value = event.clientY
    } else {
      bookingFormAnchorX.value = window.innerWidth / 2
      bookingFormAnchorY.value = window.innerHeight / 2
    }
    if (selectedDoctorId.value) {
      bookingFormPrefillDoctorId.value = selectedDoctorId.value
    }
    bookingFormPrefillDate.value = ''
    bookingFormPrefillType.value = selectedTab.value === 'doctor' ? 2 : 1
    bookingFormPrefillTime.value = null
  })
}

function onSlotClick({ day, event, time, endTime }) {
  openBookingForm(() => {
    if (event?.clientX != null && event?.clientY != null) {
      bookingFormAnchorX.value = event.clientX
      bookingFormAnchorY.value = event.clientY
    } else {
      bookingFormAnchorX.value = window.innerWidth / 2
      bookingFormAnchorY.value = window.innerHeight / 2
    }
    if (selectedDoctorId.value) {
      bookingFormPrefillDoctorId.value = selectedDoctorId.value
    }
    bookingFormPrefillDate.value = day?.date
      ? convertToGregorian(day.date.replace(/-/g, '/'), 'YYYY-MM-DD')
      : ''
    bookingFormPrefillType.value = selectedTab.value === 'doctor' ? 2 : 1
    bookingFormPrefillTime.value = time ?? null
    bookingFormPrefillEndTime.value = endTime ?? null
  })
}

function closeBookingForm() {
  bookingFormVisible.value = false
  previewBookingData.value = null
}

function onPreviewUpdate(data) {
  previewBookingData.value = data
}

function onBookingFormSubmit() {
  bookingFormVisible.value = false
  detailBookingId.value = null
  detailPlaceholder.value = null
}
</script>

<style scoped>
.persian-calendar {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  direction: rtl;
}

.persian-calendar__body {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.persian-calendar__views {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 7px 4px;
}

.persian-calendar__views-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.loading-state,
.error-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
