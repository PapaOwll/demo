<template>
  <div :class="radioClasses" @click="handleInput">
    <div class="custom-radio__container">
      <div v-if="label || description" class="custom-radio__content">
        <Typography variant="body2" weight="medium" class="custom-radio__label">
          {{ label }}
        </Typography>

        <Typography
          v-if="description"
          weight="regular"
          variant="caption"
          class="custom-radio__description"
        >
          {{ description }}
        </Typography>
      </div>

      <div class="custom-radio__indicator">
        <div class="custom-radio__point" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, toRef } from 'vue'
import Typography from '@/base/Typography'
import useControllableValue from '@/composables/use-controllable-value'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Object],
    default: undefined,
  },
  defaultValue: {
    type: [String, Number, Boolean, Object],
    default: undefined,
  },
  val: {
    type: [String, Number, Boolean, Object],
    default: undefined,
  },
  label: {
    type: String,
    default: undefined,
  },
  description: {
    type: String,
    default: undefined,
  },
  disable: Boolean,
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md'].includes(v),
  },
  flip: Boolean,
  color: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'orange'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue'])

const { currentValue: inputValue } = useControllableValue({
  value: toRef(props, 'modelValue'),
  defaultValue: toRef(props, 'defaultValue'),
  onChange: (val) => emit('update:modelValue', val),
})

const isChecked = computed(() => inputValue.value === props.val)

const radioClasses = computed(() => [
  'custom-radio',
  `custom-radio--${props.size}`,
  `custom-radio--${props.color}`,
  {
    'custom-radio--checked': isChecked.value,
    'custom-radio--disabled': props.disable,
    'custom-radio--flip': props.flip,
  },
])

const handleInput = () => {
  if (!props.disable) {
    inputValue.value = props.val
  }
}
</script>

<style lang="scss" scoped>
@import './radio.scss';
</style>
