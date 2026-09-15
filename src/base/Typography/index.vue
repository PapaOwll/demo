<template>
  <component :is="computedTag" :class="classes">
    <slot />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { QUASAR_COLORS } from '@/constants/colors'

const props = defineProps({
  variant: {
    type: String,
    required: true,
    validator: (value) => ['heading', 'body', 'caption'].includes(value),
  },
  size: {
    type: String,
    default: null,
    validator: (value) =>
      value === null || ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', '1', '2', '3', '4'].includes(value),
  },
  weight: {
    type: String,
    default: null,
    validator: (value) =>
      value === null || ['bold', 'semibold', 'medium', 'regular'].includes(value),
  },
  tag: {
    type: String,
    default: null,
  },
  color: {
    type: String,
    default: 'currentColor',
    validator: (value) => QUASAR_COLORS.includes(value),
  },
})

const computedSize = computed(() => {
  if (props.size !== null) return props.size

  switch (props.variant) {
    case 'heading': {
      return 'h1'
    }
    case 'body': {
      return '3'
    }
    default: {
      return null
    }
  }
})

const computedWeight = computed(() => {
  if (props.weight) return props.weight

  return props.variant === 'heading' ? 'bold' : 'regular'
})

const computedTag = computed(() => {
  if (props.tag) return props.tag

  switch (props.variant) {
    case 'heading': {
      return computedSize.value || 'h1'
    }
    case 'body': {
      return 'p'
    }
    case 'caption': {
      return 'span'
    }
    default: {
      return 'span'
    }
  }
})

const classes = computed(() => {
  const baseClass = 'typography'
  const classList = [baseClass]

  switch (props.variant) {
    case 'heading': {
      classList.push(
        `${baseClass}--heading-${computedSize.value}`,
        `${baseClass}--weight-${computedWeight.value}`
      )

      break
    }
    case 'body': {
      classList.push(
        `${baseClass}--body-${computedSize.value}`,
        `${baseClass}--weight-${computedWeight.value}`
      )

      break
    }
    case 'caption': {
      classList.push(
        `${baseClass}--caption`,
        `${baseClass}--weight-${computedWeight.value}`,
        `${baseClass}--body-${computedSize.value}`
      )

      break
    }
    default: {
      break
    }
  }

  classList.push(`${baseClass}--color-${props.color}`)

  return classList
})
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
