<template>
  <div class="overlap-more" @click.stop @mousedown.stop>
    <span class="overlap-more__chip" :class="`overlap-more__chip--color-${color}`">
      +{{ bookings.length }} مورد دیگر
    </span>
    <QPopupProxy transition-show="scale" transition-hide="scale">
      <div class="overlap-more__panel" @click.stop>
        <QList dense separator>
          <QItem
            v-for="booking in bookings"
            :key="booking.id"
            v-close-popup
            clickable
            class="overlap-more__item"
            @click="emit('detail', booking)"
          >
            <QItemSection>
              <Typography variant="caption" weight="medium">
                {{ getCustomerName(booking) }}
              </Typography>
              <Typography variant="caption" color="grey">
                {{ timeLabel(booking) }}
              </Typography>
            </QItemSection>
          </QItem>
        </QList>
      </div>
    </QPopupProxy>
  </div>
</template>

<script setup>
import Typography from '@/base/Typography'
import { getCustomerName, formatTimeHHMM, getBookingTimeRange } from '../../utils/bookingDisplay'

defineProps({
  bookings: { type: Array, default: () => [] },
  color: { type: String, default: 'blue' },
})

const emit = defineEmits(['detail'])

const timeLabel = (booking) => {
  const start = formatTimeHHMM(booking?.bookingAt)
  const end = getBookingTimeRange(booking).endTime
  return `${start} - ${end}`
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/calendar/color-variants';

.overlap-more {
  position: absolute;
  bottom: 4px;
  left: 4px;
  z-index: 5;
}

.overlap-more__chip {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 1px 6px;
  cursor: pointer;
  transition: filter 0.15s;

  @include color-variants.apply;

  &:hover {
    filter: brightness(0.95);
  }
}

.overlap-more__panel {
  min-width: 180px;
  max-width: 260px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
}

.overlap-more__item {
  min-height: 36px;
}
</style>
