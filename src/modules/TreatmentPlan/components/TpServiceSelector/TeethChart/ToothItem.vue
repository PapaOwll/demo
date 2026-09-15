<template>
  <div
    :class="['tooth-item', { selected: isSelected, disabled, implant: isImplant }]"
    @click="handleClick"
  >
    <Typography
      variant="body"
      size="3"
      :color="isSelected ? 'blue' : undefined"
      :weight="isSelected ? 'bold' : 'medium'"
      class="tooth-number"
    >
      {{ toothNumber }}
    </Typography>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Typography from '@/base/Typography'

const props = defineProps({
  toothId: {
    type: Number,
    required: true,
  },
  toothNumber: {
    type: Number,
    required: true,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  isImplant: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const isSelected = computed(() => props.modelValue)

const handleClick = () => {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}
</script>

<style lang="scss" scoped>
.tooth-item {
  position: relative;
  width: 48px;
  height: 48px;
  border: 2px solid $grey-4;
  border-radius: $radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: white;

  &:hover:not(.disabled) {
    border-color: $blue-filled-hover !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &.selected {
    border-color: $blue-3;
    background-color: $blue-1;
    color: $blue-8 !important;
  }

  &.implant.selected {
    border-color: $grey-4;
    background-color: transparent;

    &::after {
      content: '';
      position: absolute;
      width: 28px;
      height: 28px;
      border-radius: $radius-round;
      background-color: rgba($light-blue-6, 0.15);
      z-index: 0;
    }
  }

  .tooth-number {
    position: relative;
    z-index: 1;
  }
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
