<template>
  <div
    :class="[
      'toggle',
      `toggle--${size}`,
      { 'toggle--checked': checked },
      { 'toggle--disabled': disabled },
      { 'toggle--dense': dense },
      { 'toggle--flip': flip },
    ]"
    @click="toggle"
  >
    <div class="toggle__indicator">
      <div class="toggle__circle" />
    </div>

    <div v-if="label || description" class="toggle__content">
      <span v-if="label" class="toggle__title">{{ label }}</span>
      <span v-if="description" class="toggle__description">{{ description }}</span>
    </div>
  </div>
</template>

<script setup>
import { toRef } from 'vue'
import useControllableValue from '@/composables/use-controllable-value'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: undefined,
  },
  defaultValue: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md'].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  dense: {
    type: Boolean,
    default: false,
  },
  flip: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const { currentValue: checked } = useControllableValue({
  value: toRef(props, 'modelValue'),
  defaultValue: toRef(props, 'defaultValue'),
  onChange: (val) => emit('update:modelValue', val),
})

const toggle = () => {
  if (!props.disabled) {
    checked.value = !checked.value
  }
}
</script>

<style lang="scss" scoped>
@import './toggle.scss';
</style>
