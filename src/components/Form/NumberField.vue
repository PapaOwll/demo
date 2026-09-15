<template>
  <TextField
    :model-value="props.modelValue || 0"
    :size="dense ? 'sm' : 'md'"
    v-bind="$attrs"
    :label="label"
    clearable
    variant="outline"
    :error="!!errorMessage || null"
    :error-message="errorMessage"
    @update:model-value="changeValue"
  />
</template>

<script setup>
import TextField from '@/base/TextField'
import { convertToEnNumber } from '@/utils/convert-check-digits'

const emits = defineEmits(['update:model-value'])
const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true,
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
})
const changeValue = (value) => {
  if (!value || value === '') {
    emits('update:model-value', null)
    return
  }

  const cleanValue = convertToEnNumber(value)

  const numericValue = Number(cleanValue)
  if (Number.isNaN(numericValue)) {
    return
  }

  emits('update:model-value', cleanValue)
}
</script>

<style scoped lang="scss"></style>
