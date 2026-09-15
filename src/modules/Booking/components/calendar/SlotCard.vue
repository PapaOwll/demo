<template>
  <div class="slot-card" :class="`slot-card--color-${color}`" @click.stop="$emit('click')">
    <Typography v-if="doctorName" variant="caption" weight="medium" class="slot-card__doctor">
      {{ doctorName }}
    </Typography>

    <div v-if="!doctorName" class="slot-card__time">
      <IconClock :size="20" />
      <Typography variant="body" size="3" weight="medium" class="currentColor">
        {{ slotData.time }}
      </Typography>
      <QTooltip>زمان همه نوبت ها</QTooltip>
    </div>
    <div class="slot-card__meta">
      <div class="slot-card__badge">
        <IconStethoscope :size="20" />
        <Typography variant="body" size="3">{{ slotData.perform }}</Typography>
        <QTooltip>نوبت درمان</QTooltip>
      </div>
      <span class="slot-card__divider" />

      <div class="slot-card__badge">
        <IconCalendarClock :size="20" />
        <Typography variant="body" size="3">{{ slotData.visit }}</Typography>
        <QTooltip>ویزیت اولیه</QTooltip>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconClock, IconCalendarClock, IconStethoscope } from '@tabler/icons-vue'
import Typography from '@/base/Typography'

defineProps({
  slotData: { type: Object, required: true },
  color: { type: String, default: 'blue' },
  doctorName: { type: String, default: '' },
})
defineEmits(['click'])
</script>

<style scoped lang="scss">
@use '@/assets/styles/calendar/color-variants';

.currentColor {
  color: currentColor;
}
.slot-card {
  border-radius: 10px;
  padding: 9px 11px;
  border: 1px solid transparent;
  cursor: pointer;
  width: 100%;
  height: 100%;
  gap: 10px;
  display: flex;
  flex-direction: column;
  transition:
    filter 0.15s,
    transform 0.1s;

  &:hover {
    filter: brightness(0.95);
  }

  &:active {
    transform: scale(0.98);
  }

  @include color-variants.apply;

  &__time {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 5px;
    background: rgba(255, 255, 255);
    border-radius: $radius-sm;
    padding: $spacing-sm;
  }

  &__doctor {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: rgba(255, 255, 255, 0.85);
    border-radius: $radius-sm;
    padding: 3px 8px;
    width: fit-content;
    align-self: center;
    margin-bottom: 6px;
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-lg;
  }

  &__badge {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: 2px 7px;
  }

  &__divider {
    display: inline-block;
    width: 0.5px;
    height: 13px;
    background: currentcolor;
    opacity: 0.25;
  }
}
</style>
