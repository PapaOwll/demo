<template>
  <div :class="badgeClasses" :aria-label="label">
    <div v-if="!isDot" class="badge__content">
      <component :is="rightIcon" v-if="rightIcon" size="14px" class="badge__icon" />

      <span v-if="label" class="badge__text">
        {{ label }}
      </span>
      <slot v-else />

      <component :is="leftIcon" v-if="leftIcon" size="14px" class="badge__icon" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { QUASAR_COLORS } from '@/constants/colors'

const props = defineProps({
  variant: {
    type: String,
    default: 'filled',
    validator: (val) => ['filled', 'light', 'outline'].includes(val),
  },
  color: {
    type: String,
    default: 'light-blue',
    validator: (val) => QUASAR_COLORS.includes(val),
  },
  label: {
    type: String,
    default: undefined,
  },
  isRounded: {
    type: Boolean,
    default: false,
  },
  isDot: {
    type: Boolean,
    default: false,
  },
  floating: {
    type: Boolean,
    default: false,
  },
  leftIcon: {
    type: [Object, Function],
    default: undefined,
  },
  rightIcon: {
    type: [Object, Function],
    default: undefined,
  },
})

const badgeClasses = computed(() => {
  return [
    'badge',
    `badge--${props.variant}`,
    `badge--${props.color}`,
    {
      'badge--rounded': props.isRounded,
      'badge--dot': props.isDot,
      'badge--floating': props.floating,
    },
  ]
})
</script>

<style lang="scss" scoped>
@import './badge.scss';
</style>
