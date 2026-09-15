<template>
  <SelectField
    :model-value="modelValue"
    :label="label"
    :placeholder="placeholder"
    :options="roomOptions"
    option-label="label"
    option-value="value"
    emit-value
    map-options
    variant="outline"
    :clearable="clearable"
    :loading="isLoading"
    :error="!!errorMessage || null"
    :error-message="errorMessage"
    :disable="disable"
    :dense="dense"
    v-bind="$attrs"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur')"
  />
</template>

<script setup>
import { computed } from 'vue'
import SelectField from '@/base/SelectField'
import { useApiGetRooms } from '@/modules/Settings/ClinicSetting/query'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null,
  },
  label: {
    type: String,
    default: 'اتاق',
  },
  placeholder: {
    type: String,
    default: 'انتخاب اتاق...',
  },
  branchId: {
    type: Number,
    required: true,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  disable: {
    type: Boolean,
    default: false,
  },
  dense: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: null,
  },
})

defineEmits(['update:modelValue', 'blur'])

const { data: roomsData, isLoading } = useApiGetRooms({ branchId: props.branchId })

const roomOptions = computed(() => {
  if (!roomsData.value?.items) return []

  return roomsData.value.items
    .filter((room) => room?.branchId === props.branchId)
    .map((item) => ({
      label: item.title,
      value: item.id,
      rawData: item,
    }))
})
</script>
