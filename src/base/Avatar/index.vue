<template>
  <div
    :class="[
      'avatar',
      `avatar--${size}`,
      `avatar--${color}`,
      {
        'avatar--rounded': rounded,
        'avatar--square': !rounded,
      },
    ]"
  >
    <img
      v-if="shouldRenderImage"
      :src="src"
      alt="avatar"
      class="avatar__image"
      @error="handleImageError"
    />

    <div v-else-if="shouldRenderIcon" class="avatar__icon">
      <component :is="resolvedIcon" :size="iconSize" />
    </div>

    <div v-else class="avatar__text">
      {{ displayText }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { IconUser } from '@tabler/icons-vue'

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value),
  },
  color: {
    type: String,
    default: 'light-blue',
    validator: (value) =>
      ['light-blue', 'amber', 'red', 'green', 'blue-grey', 'dark'].includes(value),
  },
  rounded: {
    type: Boolean,
    default: true,
  },
  type: {
    type: String,
    default: 'label',
    validator: (value) => ['label', 'icon', 'image'].includes(value),
  },
  label: {
    type: String,
    default: '',
  },
  userName: {
    type: String,
    default: '',
  },
  isShowIcon: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: [Object, Function],
    default: null,
  },
  src: {
    type: String,
    default: '',
  },
})

const imageLoadError = ref(false)

const iconSize = computed(() => {
  const sizeMap = {
    sm: 14,
    md: 16,
    lg: 20,
    xl: 22,
  }

  return sizeMap[props.size] || sizeMap.md
})

const displayText = computed(() => {
  const trimmed = props.label?.trim() || ''
  if (!trimmed) return ''
  return trimmed.charAt(0).toUpperCase()
})

const resolvedIcon = computed(() => props.icon || IconUser)
const hasValidImageSource = computed(() => Boolean(props.src && String(props.src).trim()))

const shouldRenderImage = computed(
  () => props.type === 'image' && hasValidImageSource.value && !imageLoadError.value
)

const shouldRenderIcon = computed(() => {
  if (props.type === 'icon') return true
  if (props.type === 'image') return !shouldRenderImage.value
  return props.isShowIcon || !displayText.value
})

const handleImageError = () => {
  imageLoadError.value = true
}
</script>

<style lang="scss" src="./avatar.scss" />
