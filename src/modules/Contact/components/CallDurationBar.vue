<template>
  <div class="call-duration-bar">
    <QLinearProgress
      :value="callTime.percentage / 100"
      :color="!callTime.percentage ? 'negative' : 'positive'"
      track-color="negative"
      size="md"
      class="call-duration-bar__progress"
    />
    <QTooltip class="call-duration-bar__tooltip text-subtitle1 bg-grey-10 text-white">
      <div class="call-duration-bar__content">
        <div class="call-duration-bar__row call-duration-bar__row--billsec">
          <div class="call-duration-bar__label">
            <div class="call-duration-bar__dot call-duration-bar__dot--billsec" />
            <span class="call-duration-bar__title">مکالمه</span>
          </div>
          <div class="call-duration-bar__time">{{ callTime.billsec }}</div>
        </div>
        <div class="call-duration-bar__row call-duration-bar__row--duration">
          <div class="call-duration-bar__label">
            <div class="call-duration-bar__dot call-duration-bar__dot--duration" />
            <span class="call-duration-bar__title">انتظار</span>
          </div>
          <div class="call-duration-bar__time">{{ callTime.callWaitingDuration }}</div>
        </div>
        <div class="call-duration-bar__row call-duration-bar__row--total">
          <div class="call-duration-bar__label">
            <span class="call-duration-bar__title">کل</span>
          </div>
          <div class="call-duration-bar__time">{{ callTime.total }}</div>
        </div>
      </div>
    </QTooltip>
  </div>
</template>
<script setup>
import { computed } from 'vue'

const props = defineProps({
  contactItem: {
    default: () => ({}),
    type: Object,
  },
})

const timeFormat = (time) =>
  `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(Math.floor(time % 60)).padStart(
    2,
    '0'
  )}`
const callTime = computed(() => {
  const { duration, billsec = 0 } = props.contactItem
  return {
    percentage: (billsec / duration) * 100,
    callWaitingDuration: timeFormat(duration - billsec),
    billsec: timeFormat(billsec),
    total: timeFormat(duration),
  }
})
</script>
<style lang="scss" scoped>
.call-duration-bar {
  min-width: 100px;

  &__progress {
    direction: rtl;
  }

  &__tooltip {
    min-width: 100px;
  }

  &__content {
    min-width: 100px;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__label {
    display: flex;
    align-items: center;
  }

  &__title {
    color: #b3b3b3;
    font-size: 12px;
    margin-right: 3px;
  }

  &__time {
    font-weight: 500;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-left: 6px;

    &--duration {
      background-color: $negative;
    }

    &--billsec {
      background-color: $positive;
    }
  }
}
</style>
