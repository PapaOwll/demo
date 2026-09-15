<template>
  <component
    :is="buttonTag"
    :class="buttonClasses"
    :type="buttonTag === 'button' ? type : undefined"
    :to="to"
    :href="href"
    :target="target"
    :disabled="isDisabled || isLoading || undefined"
    :aria-label="computedAriaLabel || ariaLabel"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <div class="button__content" :class="{ 'button__content--loading': isLoading }">
      <component :is="rightIcon" v-if="rightIcon" :size="iconSize" class="button__icon" />

      <Typography
        v-if="text"
        variant="body"
        :size="textSize"
        :weight="textWeight"
        tag="span"
        class="button__text"
      >
        {{ text }}
      </Typography>

      <component :is="leftIcon" v-if="leftIcon" :size="iconSize" class="button__icon" />
    </div>

    <div v-if="isLoading" class="button__loader">
      <QSpinner :size="spinnerSize" color="currentColor" />
    </div>
    <slot />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { QSpinner } from 'quasar'
import Typography from '@/base/Typography'

const props = defineProps({
  type: {
    type: String,
    default: 'submit',
    validator: (val) => ['button', 'submit', 'reset'].includes(val),
  },

  variant: {
    type: String,
    default: 'filled',
    validator: (val) => ['filled', 'outline', 'flat'].includes(val),
  },

  size: {
    type: String,
    default: 'md',
    validator: (val) => ['sm', 'md', 'lg', 'xl'].includes(val),
  },

  color: {
    type: String,
    default: 'light-blue',
    validator: (val) =>
      [
        'primary',
        'pink',
        'purple',
        'deep-purple',
        'indigo',
        'blue',
        'light-blue',
        'cyan',
        'teal',
        'amber',
        'red',
        'green',
        'grey',
        'blue-grey',
        'dark',
      ].includes(val),
  },

  isRounded: {
    type: Boolean,
    default: false,
  },

  isLoading: {
    type: Boolean,
    default: false,
  },

  isDisabled: {
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

  isIconOnly: {
    type: Boolean,
    default: false,
  },

  isFullWidth: {
    type: Boolean,
    default: false,
  },

  isLink: {
    type: Boolean,
    default: true,
  },

  to: {
    type: [String, Object],
    default: undefined,
  },

  href: {
    type: String,
    default: undefined,
  },

  target: {
    type: String,
    default: undefined,
    validator: (val) => !val || ['_blank', '_self', '_parent', '_top'].includes(val),
  },

  ariaLabel: {
    type: String,
    default: undefined,
  },

  text: {
    type: String,
    default: undefined,
  },
})

const emit = defineEmits(['click', 'mouseenter', 'mouseleave', 'focus', 'blur'])
const slots = defineSlots()

const hasContent = computed(() => {
  if (props.text) return true
  return slots.default && slots.default().length > 0 && !props.isIconOnly
})

const isActuallyIconOnly = computed(() => {
  if (props.isIconOnly) return true

  if (!hasContent.value && (props.leftIcon || props.rightIcon)) {
    return true
  }

  return false
})

const buttonTag = computed(() => {
  if (!props.isLink) return 'button'

  if (props.to) return 'router-link'

  if (props.href) return 'a'

  return 'button'
})

const buttonClasses = computed(() => {
  return [
    'button',
    `button--${props.variant}`,
    `button--${props.size}`,
    `button--${props.color}`,
    {
      'button--rounded': props.isRounded,
      'button--loading': props.isLoading,
      'button--disabled': props.isDisabled,
      'button--full-width': props.isFullWidth,
      'button--icon-only': isActuallyIconOnly.value,
    },
  ]
})

const iconSize = computed(() => {
  const sizes = {
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
  }
  return sizes[props.size] || sizes.md
})

const spinnerSize = computed(() => {
  const sizes = {
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
  }
  return sizes[props.size] || sizes.md
})

const textSize = computed(() => {
  const sizes = {
    sm: '4',
    md: '3',
    lg: '2',
    xl: '1',
  }
  return sizes[props.size] || sizes.md
})

const textWeight = computed(() => {
  return ['lg', 'xl'].includes(props.size) ? 'semibold' : 'medium'
})

const computedAriaLabel = computed(() => {
  if (props.ariaLabel) return props.ariaLabel

  if (isActuallyIconOnly.value && !hasContent.value) {
    return null
  }

  return null
})

const handleClick = (e) => {
  if (props.isDisabled || props.isLoading) {
    e.preventDefault()
    e.stopPropagation()
    return
  }

  emit('click', e)
}

const handleMouseEnter = () => {
  emit('mouseenter')
}

const handleMouseLeave = () => {
  emit('mouseleave')
}

const handleFocus = () => {
  emit('focus')
}

const handleBlur = () => {
  emit('blur')
}
</script>

<style lang="scss" scoped>
@import './button.scss';
</style>
