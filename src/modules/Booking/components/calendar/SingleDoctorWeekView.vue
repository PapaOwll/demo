<template>
  <div class="single-week" dir="rtl">
    <div ref="scrollRef" class="single-week__scroll-area">
      <div class="single-week__col-headers">
        <div class="single-week__col-hdr-hour" />
        <div
          v-for="day in weekDays"
          :key="day.date"
          class="single-week__col-hdr"
          role="button"
          @click="$emit('go-day', day.date)"
        >
          <span
            class="single-week__col-hdr-inner"
            :class="{ 'single-week__col-hdr-inner--today': day.isToday }"
          >
            <template v-if="!day.isToday">
              <Typography
                variant="body"
                size="4"
                weight="medium"
                color="grey"
                class="single-week__hdr-num"
              >
                {{ day.dayNumber }}
              </Typography>
              <Typography variant="caption" color="grey" class="single-week__hdr-name">
                - {{ day.dayName }}
              </Typography>
            </template>
            <template v-else>
              <div class="single-week__today-circle">{{ day.dayNumber }}</div>
              <Typography
                variant="caption"
                color="blue"
                weight="bold"
                class="single-week__hdr-name single-week__today-name"
              >
                - {{ day.dayName }}
              </Typography>
            </template>
          </span>
        </div>
      </div>

      <Transition :name="transitDir">
        <div :key="currentDate" class="single-week__grid">
          <div
            v-if="isCurrentWeek && currentTimeIndicatorTop !== -100"
            class="single-week__time-indicator"
            :style="{ top: `${currentTimeIndicatorTop}px` }"
          >
            <div class="single-week__time-indicator-dot" />
            <div class="single-week__time-indicator-line" />
          </div>
          <div class="single-week__hour-col">
            <div v-for="(hour, index) in hours" :key="hour" class="single-week__hour-block">
              <div class="single-week__hour-cell single-week__hour-cell--label">
                <Typography v-if="index !== 0" variant="caption" color="grey">
                  {{ hour }}:00
                </Typography>
              </div>
              <div class="single-week__hour-cell" />
            </div>
            <div
              v-if="isCurrentWeek && currentTimeIndicatorTop !== -100"
              class="single-week__current-time-label"
              :style="{ top: `${currentTimeIndicatorTop}px` }"
            >
              {{ currentTimeLabel }}
            </div>
          </div>
          <div
            v-for="day in weekDays"
            :key="day.date"
            ref="cellRefs"
            class="single-week__cell"
            :class="{
              'single-week__cell--today': day.isToday,
              'single-week__cell--vacation': day.isVacation,
              'single-week__cell--disabled': !isWorkingDay(day.dow),
            }"
            @mousedown="!isWorkingDay(day.dow) || onCellMouseDown($event, day)"
          >
            <div
              v-if="dragSelectionStyle && activeDragDayDate === day.date"
              class="single-week__drag-selection"
              :class="[`single-week__drag-selection--color-${doctorColor}`]"
              :style="dragSelectionStyle"
            >
              <span v-if="dragTimeLabel" class="single-week__drag-label">{{ dragTimeLabel }}</span>
            </div>
            <div v-for="hour in hours" :key="hour" class="single-week__cell-block">
              <div class="single-week__cell-rows">
                <div
                  v-for="n in 2"
                  :key="n"
                  class="single-week__cell-row"
                  :class="{ 'single-week__cell-row--disabled': !isWorkingHour(day.dow, hour) }"
                />
              </div>
              <BookingAppointmentPopup
                v-for="item in getSlot(day.date, hour).visible"
                :key="item.booking.id"
                :booking="item.booking"
                :color="doctorColor"
                :column-index="item.columnIndex"
                :column-count="item.columnCount"
                :side-by-side="item.sideBySide"
                :text-position="item.textPosition"
                @detail="(b) => $emit('detail', b)"
              />
              <OverlapMorePopover
                v-if="getSlot(day.date, hour).hidden.length > 0"
                :bookings="getSlot(day.date, hour).hidden"
                :color="doctorColor"
                @detail="(b) => $emit('detail', b)"
              />
              <AppointmentCard
                v-if="previewForDayAndHour(day.date, hour)"
                :booking="previewBooking.booking"
                :color="previewBooking.color"
                class="single-week__preview-card"
              />
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { convertToJalali } from '@/utils/date-utils'
import { useCurrentTimeIndicator } from '../../composables/useCurrentTimeIndicator'
import { useScrollToFirstBooking } from '../../composables/useScrollToFirstBooking'
import { useDragTimeSelect } from '../../composables/useDragTimeSelect'
import { computeOverlapInfo } from '../../composables/useOverlapDetection'
import Typography from '@/base/Typography'
import BookingAppointmentPopup from './BookingAppointmentPopup'
import AppointmentCard from './AppointmentCard'
import OverlapMorePopover from './OverlapMorePopover'

const props = defineProps({
  weekDays: { type: Array, default: () => [] },
  currentDate: { type: [Date, String, Object], required: true },
  transitDir: { type: String, default: '' },
  sessions: { type: Array, default: () => [] },
  bookings: { type: Array, default: () => [] },
  doctorColor: { type: String, default: 'blue' },
  doctorWorkingHours: { type: Array, default: () => [] },
  previewBooking: { type: Object, default: null },
})
const emit = defineEmits(['day-click', 'slot-click', 'detail', 'go-day'])

const { hours, currentTime, currentTimeIndicatorTop } = useCurrentTimeIndicator()

const { scrollRef } = useScrollToFirstBooking(() => props.bookings)

const currentTimeLabel = computed(() => {
  const now = currentTime.value
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
})

const isCurrentWeek = computed(() => props.weekDays.some((d) => d.isToday))

const dayWorkingHoursMap = computed(() => {
  const map = {}
  props.doctorWorkingHours.forEach((wh) => {
    map[wh.dayOfWeek] = wh.hours || []
  })
  return map
})

const isWorkingDay = (dow) => {
  if (props.doctorWorkingHours.length === 0) return true
  return !!dayWorkingHoursMap.value[dow]
}

const isWorkingHour = (dow, hour) => {
  const dayHours = dayWorkingHoursMap.value[dow]
  if (!dayHours) return false
  return dayHours.some((h) => {
    const start = Number.parseInt(h.startTime?.split(':')[0], 10)
    const end = Number.parseInt(h.endTime?.split(':')[0], 10)
    return hour >= start && hour < end
  })
}

const bookingsByJalaliDate = computed(() => {
  if (!props.bookings?.length) return {}
  const map = {}
  props.bookings.forEach((booking) => {
    const jalaliDate = convertToJalali(booking.bookingAt, 'jYYYY-jM-jD')
    if (!jalaliDate) return
    if (!map[jalaliDate]) map[jalaliDate] = []
    map[jalaliDate].push(booking)
  })
  return map
})

// Pre-compute overlap detection maps for each day
const overlapMapsByDate = computed(() =>
  Object.fromEntries(
    Object.entries(bookingsByJalaliDate.value).map(([date, dayBookings]) => [
      date,
      computeOverlapInfo(dayBookings),
    ])
  )
)

function getOverlapInfo(booking, jalaliDate) {
  const map = overlapMapsByDate.value[jalaliDate]
  if (!map) return { columnIndex: 0, columnCount: 1, sideBySide: false, textPosition: 'top' }
  return (
    map.get(booking.id) ?? {
      columnIndex: 0,
      columnCount: 1,
      sideBySide: false,
      textPosition: 'top',
    }
  )
}

function bookingsForDayAndHour(jalaliDate, hour) {
  const dayBookings = bookingsByJalaliDate.value[jalaliDate] ?? []
  return dayBookings.filter((booking) => {
    const d = new Date(booking.bookingAt)
    if (Number.isNaN(d.getTime())) return false
    return d.getHours() === hour
  })
}

// Collapse dense overlaps: keep at most MAX_VISIBLE lanes visible (rendered with
// a capped columnCount so they stay wide); the rest go behind a "+N more" chip.
const MAX_VISIBLE = 5
const slotBookingsMap = computed(() => {
  const map = {}
  props.weekDays.forEach((day) => {
    hours.value.forEach((hour) => {
      const visible = []
      const hidden = []
      bookingsForDayAndHour(day.date, hour).forEach((booking) => {
        const info = getOverlapInfo(booking, day.date)
        const dense = info.columnCount > MAX_VISIBLE
        if (dense && info.columnIndex >= MAX_VISIBLE) {
          hidden.push(booking)
        } else {
          visible.push({
            booking,
            columnIndex: info.columnIndex,
            columnCount: Math.min(info.columnCount, MAX_VISIBLE),
            sideBySide: info.sideBySide,
            textPosition: info.textPosition,
          })
        }
      })
      map[`${day.date}|${hour}`] = { visible, hidden }
    })
  })
  return map
})

function getSlot(date, hour) {
  return slotBookingsMap.value[`${date}|${hour}`] ?? { visible: [], hidden: [] }
}

function previewForDayAndHour(jalaliDate, hour) {
  if (!props.previewBooking?.booking) return false
  return props.previewBooking.jalaliDate === jalaliDate && props.previewBooking.hour === hour
}

const {
  selectionStyle: dragSelectionStyle,
  startDrag,
  dragResult,
  dragTimeLabel,
} = useDragTimeSelect()
const activeDragDayDate = ref(null)
const dragStartEvent = ref(null)

function onCellMouseDown(event, day) {
  if (event.target.closest('.appointment-popup-trigger')) return
  activeDragDayDate.value = day.date
  dragStartEvent.value = event
  startDrag(event, event.currentTarget)
}

watch(dragResult, (result) => {
  if (!result || !activeDragDayDate.value) return
  const day = props.weekDays.find((d) => d.date === activeDragDayDate.value)
  const mouseEvent = dragStartEvent.value
  activeDragDayDate.value = null
  dragStartEvent.value = null
  emit('day-click', day)
  if (result.isDrag) {
    emit('slot-click', { day, event: mouseEvent, time: result.startTime, endTime: result.endTime })
  } else {
    emit('slot-click', { day, event: mouseEvent, time: result.time })
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/calendar/transitions';
@use '@/assets/styles/calendar/color-variants';

.single-week {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__scroll-area {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  &__col-headers {
    display: grid;
    grid-template-columns: 50px repeat(7, 1fr);
    background: #fff;
    position: sticky;
    top: 0;
    z-index: 5;
    border-bottom: 0.5px solid $grey-4;
  }

  &__col-hdr-hour {
    width: 50px;
    flex-shrink: 0;
  }

  &__col-hdr {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 0;
    border-right: 0.5px solid $grey-4;
    cursor: pointer;
  }

  &__col-hdr-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    padding: $spacing-xs;
    border-radius: $radius-xs;
    user-select: none;

    &--today {
      background: $blue-1;
      width: 98%;
      height: 100%;
      .single-week__hdr-name {
        color: $blue-7;
      }
    }
  }

  &__hdr-name {
    display: inline-block;
  }

  &__hdr-num {
    display: inline-block;
  }

  &__today-name {
    color: $blue-7;
  }

  &__today-circle {
    width: 28px;
    height: 28px;
    background: $blue-7;
    color: #fff;
    border-radius: $radius-round;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 500;
  }

  &__grid {
    display: grid;
    grid-template-columns: 50px repeat(7, 1fr);
    position: relative;

    .single-week__cell:last-child {
      border-bottom: none;
    }
  }

  &__hour-col {
    display: flex;
    flex-direction: column;
    border-left: 0.5px solid $grey-4;
    background: $grey-1;
    flex-shrink: 0;
    position: relative;

    .single-week__hour-block {
      height: 100px;
      display: flex;
      flex-direction: column;

      &:last-child {
        border-bottom: none;
      }
    }
  }

  &__hour-cell {
    flex: 1;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    color: $grey-6;

    &--label {
      span {
        transform: translateY(-50%);
        background: $grey-1;
        padding: 0 2px;
        line-height: 1;
      }
    }
  }

  &__cell {
    min-height: 50px;
    border-left: 0.5px solid $grey-4;
    border-bottom: 0.5px solid $grey-4;
    padding: 0;
    cursor: pointer;
    background: #fff;
    transition: background 0.1s;
    display: flex;
    flex-direction: column;
    position: relative;
    height: 100%;

    &:last-child {
      border-left: none;
    }

    &:hover {
      background: rgba($blue-7, 0.04);

      :deep(.appointment-card) {
        opacity: 0.75;
      }

      :deep(.appointment-card:hover) {
        opacity: 1;
        z-index: 10;
      }
    }

    &--vacation {
      background: $red-1;
    }

    &--disabled {
      background: $grey-2;
      cursor: not-allowed;
      pointer-events: none;
      opacity: 0.5;

      &:hover {
        background: $grey-2;
      }
    }

    .single-week__cell-block {
      &:last-child {
        border-bottom: none;
      }

      .single-week__cell-row {
        &:first-child {
          border-top: 0.5px solid $grey-4;
        }

        &:last-child {
          border-bottom: none;
        }
      }
    }
  }

  &__cell-block {
    position: relative;
    gap: 4px;
    height: 100px;
    display: flex;
    flex-direction: column;
    width: 100%;
    border-bottom: none;
  }

  &__cell-rows {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    pointer-events: none;
  }

  &__cell-row {
    flex: 1;
    border-bottom: 0.5px solid $grey-4;
  }

  &__time-indicator {
    position: absolute;
    left: 0;
    right: 50px;
    height: 2px;
    background-color: $red-6;
    z-index: 3;
    display: flex;
    align-items: center;

    &-dot {
      width: 10px;
      height: 10px;
      background-color: $red-6;
      border-radius: $radius-round;
      margin-left: -5px;
      flex-shrink: 0;
    }

    &-line {
      flex-grow: 1;
      height: 2px;
      background-color: $red-6;
    }
  }

  &__current-time-label {
    position: absolute;
    left: 0;
    transform: translateY(-50%);
    font-size: 11px;
    font-weight: 600;
    color: $red-6;
    width: 100%;
    text-align: center;
    z-index: 4;
    pointer-events: none;
  }

  &__drag-selection {
    position: absolute;
    left: 5px;
    right: 5px;
    border-radius: 10px;
    z-index: 2;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    padding: 4px $spacing-xs;
    border: 1px solid transparent;
    transition: none;

    @include color-variants.apply;

    &--color-blue {
      background: rgba($blue-1, 0.85);
      border-color: rgba($blue-2, 0.7);
    }

    &--color-pink {
      background: rgba($pink-1, 0.85);
      border-color: rgba($pink-2, 0.7);
    }

    &--color-purple {
      background: rgba($purple-1, 0.85);
      border-color: rgba($purple-2, 0.7);
    }

    &--color-teal {
      background: rgba($teal-1, 0.85);
      border-color: rgba($teal-2, 0.7);
    }

    &--color-amber {
      background: rgba($amber-1, 0.85);
      border-color: rgba($amber-2, 0.7);
    }

    &--color-gray {
      background: rgba($grey-1, 0.85);
      border-color: rgba($grey-3, 0.7);
    }

    &--color-light-blue {
      background: rgba(#e8f4fd, 0.85);
      border-color: rgba(#b8d9f0, 0.7);
    }

    &--color-light-red {
      background: rgba(#fde8e8, 0.85);
      border-color: rgba(#f0b8b8, 0.7);
    }

    &--color-light-purple {
      background: rgba(#ede8fd, 0.85);
      border-color: rgba(#c4b8f0, 0.7);
    }

    &--color-light-green {
      background: rgba(#e8fde8, 0.85);
      border-color: rgba(#b8f0b8, 0.7);
    }

    &--color-light-gray {
      background: rgba(#f5f5f5, 0.85);
      border-color: rgba(#cccccc, 0.7);
    }

    &--color-light-orange {
      background: rgba(#fdf5e8, 0.85);
      border-color: rgba(#f0d9b8, 0.7);
    }

    &--color-light-teal {
      background: rgba(#e8fdf5, 0.85);
      border-color: rgba(#b8f0d9, 0.7);
    }

    &--color-light-pink {
      background: rgba(#fde8f5, 0.85);
      border-color: rgba(#f0b8d9, 0.7);
    }

    &--color-light-yellow {
      background: rgba(#fdfae8, 0.85);
      border-color: rgba(#f0eab8, 0.7);
    }
  }

  &__drag-label {
    font-size: 11px;
    font-weight: 600;
    color: inherit;
    opacity: 0.85;
    border-radius: 4px;
    padding: 1px 6px;
    white-space: nowrap;
  }

  &__preview-card {
    opacity: 0.95 !important;
    pointer-events: none !important;
  }
}
</style>
