<template>
  <div :class="bannerClasses" role="alert">
    <div class="banner__container">
      <div class="banner__content-side">
        <div class="banner__graphic-layer" />
        <div v-if="icon" class="banner__status-icon-wrapper">
          <component :is="icon" :size="iconSize" class="banner__status-icon" />
        </div>

        <div class="banner__text-group">
          <Typography variant="body" :size="titleSize" weight="bold" class="banner__title">
            {{ title }}
          </Typography>

          <Typography
            v-if="description"
            variant="body"
            :size="descriptionSize"
            class="banner__description"
          >
            {{ description }}
          </Typography>
        </div>
      </div>
      <div class="banner__actions-side">
        <div v-if="showClose" class="banner__close" @click="emit('close')">
          <QIcon name="close" :size="closeIconSize" />
        </div>

        <div v-if="actionLabel" class="banner__action-wrapper">
          <Button
            variant="filled"
            :size="actionButtonSize"
            :color="color"
            :text="actionLabel"
            @click="emit('action')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { QIcon } from 'quasar'
import Typography from '@/base/Typography'
import Button from '@/base/Button'

const props = defineProps({
  type: {
    type: String,
    default: 'neutral',
    validator: (val) => ['error', 'warning', 'neutral'].includes(val),
  },
  size: {
    type: String,
    default: 'md',
    validator: (val) => ['sm', 'md', 'lg', 'xl'].includes(val),
  },
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  icon: { type: [Object, Function, String], default: undefined },
  showClose: { type: Boolean, default: false },
  actionLabel: { type: String, default: undefined },
})

const emit = defineEmits(['close', 'action'])

const sizeConfig = {
  sm: { icon: 20, closeIcon: 16, title: '4', description: '5', actionButton: 'sm' },
  md: { icon: 24, closeIcon: 20, title: '3', description: '4', actionButton: 'sm' },
  lg: { icon: 28, closeIcon: 22, title: '2', description: '3', actionButton: 'md' },
  xl: { icon: 32, closeIcon: 24, title: '1', description: '2', actionButton: 'lg' },
}

const iconSize = computed(() => sizeConfig[props.size].icon)
const closeIconSize = computed(() => `${sizeConfig[props.size].closeIcon}px`)
const titleSize = computed(() => sizeConfig[props.size].title)
const descriptionSize = computed(() => sizeConfig[props.size].description)
const actionButtonSize = computed(() => sizeConfig[props.size].actionButton)

const color = computed(() => {
  // red, orange, blue is not color
  const map = { error: '$red-6', warning: 'orange', neutral: 'light-blue' }
  return map[props.type] || 'blue'
})

const bannerClasses = computed(() => [
  'banner',
  `banner--${props.type}`,
  `banner--${props.size}`,
  { 'banner--has-description': !!props.description },
])
</script>

<style lang="scss" scoped>
@import './banner.scss';
</style>
