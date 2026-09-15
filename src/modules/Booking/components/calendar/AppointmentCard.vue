<template>
  <div
    class="appointment-card"
    :style="cardStyle"
    :class="[
      `appointment-card--color-${color}`,
      {
        'appointment-card--canceled': isCanceled,
        'appointment-card--row': layoutMode === 'row',
        'appointment-card--mini': layoutMode === 'mini',
        'appointment-card--stacked': columnCount > 1 && columnIndex > 0,
      },
    ]"
    @click="$emit('click')"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <QTooltip v-if="layoutMode === 'mini'" :delay="200" anchor="top middle" self="bottom middle">
      {{ customerName }} &mdash; {{ formattedTime }} تا {{ bookingEndTime }}
    </QTooltip>

    <Typography variant="caption" weight="medium" class="appointment-card__customer-name">
      {{ customerName }}
    </Typography>

    <Typography variant="caption" class="appointment-card__time">
      {{ formattedTime }} - {{ bookingEndTime }}
    </Typography>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import Typography from '@/base/Typography'
import { getCustomerName, formatTimeHHMM, getBookingTimeRange } from '../../utils/bookingDisplay'

const HOUR_HEIGHT = 100

const props = defineProps({
  booking: { type: Object, required: true },
  color: { type: String, default: 'blue' },
  columnIndex: { type: Number, default: 0 },
  columnCount: { type: Number, default: 1 },
  sideBySide: { type: Boolean, default: false },
  textPosition: { type: String, default: 'top' },
})

defineEmits(['click'])

// Raise the card above its siblings after hovering for 1s (delayed z-index)
const raised = ref(false)
let raiseTimer = null

const onMouseEnter = () => {
  raiseTimer = setTimeout(() => {
    raised.value = true
  }, 500)
}

const onMouseLeave = () => {
  if (raiseTimer) clearTimeout(raiseTimer)
  raised.value = false
}

const isCanceled = computed(() => !!props.booking?.canceledAt)

const customerName = computed(() => getCustomerName(props.booking))

const formattedTime = computed(() => formatTimeHHMM(props.booking?.bookingAt))
const bookingEndTime = computed(() => getBookingTimeRange(props.booking).endTime)

const durationMinutes = computed(() => {
  const start = new Date(props.booking?.bookingAt)
  if (Number.isNaN(start.getTime())) return 30
  const end = props.booking?.bookingEndedAt ? new Date(props.booking.bookingEndedAt) : null
  if (end && !Number.isNaN(end.getTime())) {
    return Math.max(5, (end.getTime() - start.getTime()) / 60_000)
  }
  return 30
})

const MIN_HEIGHT = 20
const cardHeight = computed(() => Math.max(MIN_HEIGHT, (durationMinutes.value / 60) * HOUR_HEIGHT))

const layoutMode = computed(() => {
  const h = cardHeight.value
  if (h >= 44) return 'column'
  if (h >= 22) return 'row'
  return 'mini'
})

const cardStyle = computed(() => {
  const d = new Date(props.booking?.bookingAt)
  if (Number.isNaN(d.getTime())) return {}
  const startMinute = d.getMinutes()
  const top = (startMinute / 60) * HOUR_HEIGHT

  const { columnIndex, columnCount } = props

  // Standalone card: full width via CSS defaults
  if (columnCount <= 1) {
    return {
      height: `${cardHeight.value}px`,
      top: `${top}px`,
      ...(raised.value && { zIndex: 999 }),
    }
  }

  // Two equal-time cards: render side-by-side (50/50)
  if (props.sideBySide) {
    return {
      height: `${cardHeight.value}px`,
      top: `${top}px`,
      left: `${columnIndex * 50}%`,
      width: 'calc(50% - 4px)',
      zIndex: raised.value ? 999 : 1,
    }
  }

  const STACK_STEP = '15%'
  const STACK_STEP2 = '10%'
  // Vertical text alignment: place text on the side not covered by an overlap
  // (or center when covered from both above and below).
  const verticalAlignByPosition = { top: 'flex-start', bottom: 'flex-end', center: 'center' }
  const verticalAlign = verticalAlignByPosition[props.textPosition] || 'center'
  const textPos =
    layoutMode.value === 'column'
      ? { justifyContent: verticalAlign }
      : { alignItems: verticalAlign }

  // Bigger (base) card: inset from the LEFT so the smaller cards can peek out
  if (columnIndex === 0) {
    return {
      height: `${cardHeight.value}px`,
      top: `${top}px`,
      left: `calc( 10px + ${STACK_STEP})`,
      width: `calc(100% - 10px - ${STACK_STEP})`,
      ...textPos,
      zIndex: raised.value ? 999 : 1,
    }
  }

  // Shorter cards: overlap ON TOP of the base.
  // Left margin is inverted (smaller cards → 0): the biggest stacked card shifts
  // right the most, the smallest sits flush-left. Right inset grows with the index.
  const leftIndex = columnCount - 1 - columnIndex
  return {
    height: `${cardHeight.value}px`,
    top: `${top}px`,
    left: 0,
    marginLeft: `calc(${leftIndex} * ${STACK_STEP2})`,
    width: `calc(100% - 10px - ${leftIndex} * ${STACK_STEP2} - ${columnIndex} * ${STACK_STEP})`,
    ...textPos,
    zIndex: raised.value ? 999 : columnIndex + 1,
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/calendar/color-variants';

.appointment-card {
  position: absolute;
  width: calc(100% - 10px);
  margin-right: 5px;
  border-radius: 10px;
  padding: 4px $spacing-xs;
  border: 1px solid transparent;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 1;
  transition:
    opacity 0.15s,
    filter 0.15s,
    transform 0.1s;

  &:hover {
    filter: brightness(0.95);
  }

  &:active {
    transform: scale(1.01);
  }

  &--canceled {
    opacity: 0.5;
    text-decoration: line-through;
  }

  &--stacked {
    border-left: 2px solid #fff;
    box-shadow: -2px 0 4px rgba(0, 0, 0, 0.12);
  }

  @include color-variants.apply;

  &__time {
    opacity: 0.85;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__customer-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &--row {
    flex-direction: row;
    align-items: end;
    justify-content: start;
    gap: 4px;
    padding: 1px;

    .appointment-card__customer-name,
    .appointment-card__time {
      flex-shrink: 1;
      min-width: 0;
    }
  }

  &--mini {
    flex-direction: row;
    gap: 4px;
    padding: 1px $spacing-xs;

    .appointment-card__customer-name {
      flex-shrink: 1;
      min-width: 0;
    }

    .appointment-card__time {
      flex-shrink: 0;
    }
  }
}
</style>
