<template>
  <TextField
    :model-value="numberSeparator(modelValue) || 0"
    :suffix="suffix"
    v-bind="$attrs"
    :label="label"
    clearable
    variant="outline"
    :error="!!errorMessage || null"
    :error-message="errorMessage"
    @update:model-value="(e) => changeValue(e)"
  />
</template>

<script setup>
import TextField from '@/base/TextField'
import { convertToEnNumber } from '@/utils/convert-check-digits'
import { numberSeparator } from '@/utils/formatter'

const emits = defineEmits(['update:model-value'])
const props = defineProps({
  modelValue: {
    type: [Number, null],
    default: 0,
  },
  dense: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  label: String,
  suffix: {
    type: String,
    default: 'تومان',
  },
  min: {
    type: Number,
    default: undefined,
  },
  max: {
    type: Number,
    default: undefined,
  },
})

const changeValue = (value) => {
  if (!value || value === '') {
    emits('update:model-value', null)
    return
  }

  const cleanValue = convertToEnNumber(value).replace(/,/g, '')

  const numericValue = Number(cleanValue)
  if (Number.isNaN(numericValue)) {
    return
  }

  if (props.max !== undefined && numericValue > props.max) {
    return
  }

  if (props.min !== undefined && numericValue < props.min) {
    emits('update:model-value', numericValue)
    return
  }
  emits('update:model-value', numericValue)
}
</script>

<style scoped lang="scss"></style>
