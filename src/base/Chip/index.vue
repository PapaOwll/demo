<template>
  <div :class="chipClasses">
    <div v-if="avatar" class="chip__avatar">
      <component :is="leftComponent" v-bind="leftProps" />
    </div>
    <component :is="leftComponent" v-else-if="leftComponent" v-bind="leftProps" />
    <Typography
      v-if="text"
      variant="body"
      :size="textSize"
      :weight="textWeight"
      tag="span"
      class="chip__text"
    >
      {{ text }}
    </Typography>
    <component
      :is="rightComponent"
      :size="iconSize"
      class="chip__action"
      @click="handleRightClick"
    />
  </div>
</template>
<script setup>
import { computed } from 'vue'
import Typography from '@/base/Typography'
import { IconUser, IconX } from '@tabler/icons-vue'

const props = defineProps({
  leftIcon: {
    type: [Object, Function],
    default: undefined,
  },
  rightIcon: {
    type: [Object, Function],
    default: null,
  },
  removable: {
    type: Boolean,
    default: true,
  },
  text: {
    type: String,
    default: undefined,
  },
  variant: {
    type: String,
    default: 'filled',
    validator: (val) => ['filled', 'outline', 'flat'].includes(val),
  },
  size: {
    type: String,
    default: 'md',
    validator: (val) => ['sm', 'md', 'lg'].includes(val),
  },
  color: {
    type: String,
    default: 'light-blue',
    validator: (val) => ['light-blue', 'amber', 'red', 'green', 'blue-grey', 'dark'].includes(val),
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
  isRounded: {
    type: Boolean,
    default: false,
  },
  avatar: {
    type: Object,
    default: undefined,
  },
})

const emit = defineEmits(['remove', 'right-click'])

const iconSize = computed(() => {
  const sizes = {
    sm: 15,
    md: 15,
    lg: 20,
  }
  return sizes[props.size] || sizes.md
})
const textSize = computed(() => {
  const sizes = {
    sm: '4',
    md: '3',
    lg: '2',
  }
  return sizes[props.size] || sizes.md
})

const textWeight = computed(() => {
  return props.size === 'lg' ? 'semibold' : 'medium'
})

const chipClasses = computed(() => {
  return [
    'chip',
    `chip--${props.variant}`,
    `chip--${props.size}`,
    `chip--${props.color}`,
    {
      'chip--rounded': props.isRounded,
      'chip--loading': props.isLoading,
      'chip--disabled': props.isDisabled,
      'chip--full-width': props.isFullWidth,
      'chip--left-avatar': props.avatar,
    },
  ]
})

const rightComponent = computed(() => {
  if (props.rightIcon) return props.rightIcon
  if (props.removable) return IconX
  return null
})

const leftComponent = computed(() => {
  if (props.avatar) {
    return props.avatar.src ? 'img' : IconUser
  }
  return props.leftIcon
})

const leftProps = computed(() => {
  if (props.avatar) {
    return props.leftIcon
      ? { size: iconSize.value, class: 'chip--icon' }
      : { src: props.avatar.src, alt: 'avatar', loading: 'lazy', class: 'chip--avatar' }
  }

  if (props.leftIcon) {
    return { size: iconSize.value }
  }

  return {}
})

const handleRightClick = () => {
  if (props.isDisabled) return
  if (props.removable && !props.rightIcon) {
    emit('remove')
  } else {
    emit('right-click')
  }
}
</script>
<style scoped lang="scss" src="./chip.scss" />
