<template>
  <label
    :class="[
      'checkbox',
      `checkbox--${size}`,
      { 'checkbox--checked': inputValue && !indeterminate },
      { 'checkbox--indeterminate': indeterminate },
      { 'checkbox--disabled': disabled },
      { 'checkbox--flip': flip },
    ]"
  >
    <input
      type="checkbox"
      class="checkbox__input"
      :checked="inputValue"
      :disabled="disabled"
      @change="handleChange"
    />

    <div class="checkbox__indicator">
      <div class="checkbox__mark">
        <svg v-if="indeterminate" viewBox="0 0 24 24">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <svg v-else viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    </div>

    <div v-if="label || description" class="checkbox__content">
      <span v-if="label" class="checkbox__title">{{ label }}</span>
      <span v-if="description" class="checkbox__description">{{ description }}</span>
    </div>
  </label>
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
  indeterminate: {
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
    validator: (v) => ['sm', 'md'].includes(v),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  flip: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const { currentValue: inputValue } = useControllableValue({
  value: toRef(props, 'modelValue'),
  defaultValue: toRef(props, 'defaultValue'),
  onChange: (val) => emit('update:modelValue', val),
})

const handleChange = (event) => {
  if (props.disabled) return
  inputValue.value = event.target.checked
}
</script>

<style lang="scss" scoped src="./checkbox.scss" />
