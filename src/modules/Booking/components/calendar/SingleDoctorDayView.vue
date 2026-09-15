<template>
  <div class="single-day" dir="rtl">
    <div ref="scrollRef" class="single-day__scroll-area">
      <div class="single-day__col-headers">
        <div class="single-day__col-hdr-hour" />
        <div class="single-day__col-hdr">
          <span
            class="single-day__col-hdr-inner"
            :class="{ 'single-day__col-hdr-inner--today': day.isToday }"
          >
            <template v-if="!day.isToday">
              <Typography
                variant="body"
                size="4"
                weight="medium"
                color="grey"
                class="single-day__hdr-num"
              >
                {{ day.dayNumber }}
              </Typography>
              <Typography variant="caption" color="grey" class="single-day__hdr-name">
                - {{ day.dayName }}
              </Typography>
            </template>
            <template v-else>
              <div class="single-day__today-circle">{{ day.dayNumber }}</div>
              <Typography
                variant="caption"
                color="blue"
                weight="bold"
                class="single-day__hdr-name single-day__today-name"
              >
                - {{ day.dayName }}
              </Typography>
            </template>
          </span>
        </div>
      </div>

      <Transition :name="transitDir">
        <div :key="currentDate" class="single-day__day-row">
          <div
            v-if="day.isToday && currentTimeIndicatorTop !== -100"
            class="single-day__current-time-indicator"
            :style="{ top: `${currentTimeIndicatorTop}px` }"
          >
            <div class="single-day__current-time-indicator-dot" />
            <div class="single-day__current-time-indicator-line" />
          </div>
          <div class="single-day__hour-col">
            <div v-for="(hour, index) in hours" :key="hour" class="single-day__hour-block">
              <div class="single-day__hour-cell single-day__hour-cell--label">
                <Typography v-if="index !== 0" variant="caption" color="grey">
                  {{ hour }}:00
                </Typography>
              </div>
              <div class="single-day__hour-cell" />
            </div>
            <div
              v-if="day.isToday && currentTimeIndicatorTop !== -100"
              class="single-day__current-time-label"
              :style="{ top: `${currentTimeIndicatorTop}px` }"
            >
              {{ currentTimeLabel }}
            </div>
          </div>
          <div
            class="single-day__cell"
            :class="{
              'single-day__cell--today': day.isToday,
              'single-day__cell--vacation': day.isVacation,
              'single-day__cell--disabled': !isWorkingDay(day.dow),
            }"
            @mousedown="!isWorkingDay(day.dow) || onCellMouseDown($event)"
          >
            <div
              v-if="dragSelectionStyle"
              class="single-day__drag-selection"
              :class="[`single-day__drag-selection--color-${doctorColor}`]"
              :style="dragSelectionStyle"
            >
              <span v-if="dragTimeLabel" class="single-day__drag-label">{{ dragTimeLabel }}</span>
            </div>
            <div v-for="hour in hours" :key="hour" class="single-day__hour-block">
              <div class="single-day__hour-rows">
                <div
                  v-for="n in 2"
                  :key="n"
                  class="single-day__hour-row"
                  :class="{ 'single-day__hour-row--disabled': !isWorkingHour(day.dow, hour) }"
                />
              </div>
              <BookingAppointmentPopup
                v-for="booking in bookingsForHour(hour)"
                :key="booking.id"
                :booking="booking"
                :color="doctorColor"
                :column-index="getOverlapInfo(booking).columnIndex"
                :column-count="getOverlapInfo(booking).columnCount"
                :side-by-side="getOverlapInfo(booking).sideBySide"
                :text-position="getOverlapInfo(booking).textPosition"
                @detail="(b) => $emit('detail', b)"
              />
              <AppointmentCard
                v-if="previewForHour(hour)"
                :booking="previewBooking.booking"
                :color="previewBooking.color"
                class="single-day__preview-card"
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
import { useOverlapDetection } from '../../composables/useOverlapDetection'
import Typography from '@/base/Typography'
import BookingAppointmentPopup from './BookingAppointmentPopup'
import AppointmentCard from './AppointmentCard'

const props = defineProps({
  day: { type: Object, required: true },
  currentDate: { type: [Date, String, Object], required: true },
  transitDir: { type: String, default: '' },
  sessions: { type: Array, default: () => [] },
  bookings: { type: Array, default: () => [] },
  doctorColor: { type: String, default: 'blue' },
  doctorWorkingHours: { type: Array, default: () => [] },
  previewBooking: { type: Object, default: null },
})
const emit = defineEmits(['detail', 'slot-click'])

const { hours, currentTime, currentTimeIndicatorTop } = useCurrentTimeIndicator()

const currentTimeLabel = computed(() => {
  const now = currentTime.value
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
})

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

const bookingsForDate = computed(() => {
  if (!props.bookings?.length) return []
  return props.bookings.filter((booking) => {
    const jalaliDate = convertToJalali(booking.bookingAt, 'jYYYY-jM-jD')
    return jalaliDate === props.day.date
  })
})

const { scrollRef } = useScrollToFirstBooking(() => bookingsForDate.value)

// Overlap detection: compute overlap info for all bookings of this day
const overlapMap = useOverlapDetection(bookingsForDate)

function getOverlapInfo(booking) {
  return (
    overlapMap.value.get(booking.id) ?? {
      columnIndex: 0,
      columnCount: 1,
      sideBySide: false,
      textPosition: 'top',
    }
  )
}

function bookingsForHour(hour) {
  return bookingsForDate.value.filter((booking) => {
    const d = new Date(booking.bookingAt)
    if (Number.isNaN(d.getTime())) return false
    return d.getHours() === hour
  })
}

function previewForHour(hour) {
  if (!props.previewBooking?.booking) return false
  return props.previewBooking.jalaliDate === props.day.date && props.previewBooking.hour === hour
}

const {
  selectionStyle: dragSelectionStyle,
  startDrag,
  dragResult,
  dragTimeLabel,
} = useDragTimeSelect()
const dragStartEvent = ref(null)

function onCellMouseDown(event) {
  if (event.target.closest('.appointment-popup-trigger')) return
  dragStartEvent.value = event
  startDrag(event, event.currentTarget)
}

watch(dragResult, (result) => {
  if (!result) return
  const event = dragStartEvent.value
  dragStartEvent.value = null
  if (result.isDrag) {
    emit('slot-click', { day: props.day, event, time: result.startTime, endTime: result.endTime })
  } else {
    emit('slot-click', { day: props.day, event, time: result.time })
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/calendar/transitions';
@use '@/assets/styles/calendar/color-variants';

.single-day {
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
    grid-template-columns: 50px 1fr;
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
    border-left: 0.5px solid $grey-4;
    border-right: 0.5px solid $grey-4;
  }

  &__col-hdr-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    padding: $spacing-sm;
    border-radius: $radius-xs;
    user-select: none;

    &--today {
      background: $blue-1;
      width: 98%;
      height: 100%;
      .single-day__hdr-name {
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

  &__day-row {
    display: grid;
    grid-template-columns: 50px 1fr;
    position: relative;

    .single-day__cell:last-child {
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

    .single-day__hour-block {
      height: 100px;
      display: flex;
      flex-direction: column;
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
    border-bottom: 0.5px solid $grey-4;
    padding: 0;
    cursor: pointer;
    background: #fff;
    transition: background 0.1s;
    display: flex;
    flex-direction: column;
    position: relative;
    height: 100%;

    &:hover {
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

    .single-day__hour-block {
      &:last-child {
        border-bottom: none;
      }

      .single-day__hour-row {
        &:first-child {
          border-top: 0.5px solid $grey-4;
        }

        &:last-child {
          border-bottom: none;
        }
      }
    }
  }

  &__hour-block {
    position: relative;
    gap: 4px;
    height: 100px;
    display: flex;
    flex-direction: column;
    width: 100%;
    border-bottom: none;
  }

  &__hour-rows {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    pointer-events: none;
  }

  &__hour-row {
    flex: 1;
    border-bottom: 0.5px solid $grey-4;

    &--disabled {
      background: repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 4px,
        rgba(0, 0, 0, 0.04) 4px,
        rgba(0, 0, 0, 0.04) 8px
      );
    }
  }

  &__current-time-indicator {
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
