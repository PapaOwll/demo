<template>
  <div class="row">
    <div class="col-md-6 col-12 full-width">
      <SelectField
        v-model="localValue"
        :options="selectOptions"
        option-value="value"
        option-label="label"
        :label="label"
        clearable
        :multiple="multiple"
        emit-value
        map-options
        variant="outline"
        :disable="disabled"
      >
        <template #option="{ itemProps, opt }">
          <QItem v-bind="itemProps" clickable>
            <QItemSection>
              <div class="flex justify-between">
                <span>{{ opt.label }}</span>
                <span v-if="getPerms('user', 'mass-update')">
                  {{ numberSeparator(opt.price) }} تومان
                </span>
              </div>
            </QItemSection>
          </QItem>
        </template>
      </SelectField>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SelectField from '@/base/SelectField'
import { numberSeparator } from '@/utils/formatter'
import { getPerms } from '@/utils/get-perms'

const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: [String, Number, Array, Object],
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: '',
  },
  multiple: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const selectOptions = computed(() => {
  return props.options.map((option) => ({
    label: option.title || option.label,
    value: option.id || option.value,
    price: option.price || 0,
    originalData: option,
  }))
})

const localValue = computed({
  get: () => {
    if (props.multiple) {
      if (Array.isArray(props.modelValue)) {
        // Filter null/undefined and extract IDs from array of objects for QSelect compatibility
        return props.modelValue
          .filter((item) => item != null)
          .map((item) => {
            if (typeof item === 'object') {
              return item?.id ?? item?.value
            }
            return item
          })
      }
      return []
    }

    if (props.modelValue && typeof props.modelValue === 'object') {
      return props.modelValue.id ?? props.modelValue.value
    }
    return props.modelValue
  },
  set: (value) => {
    if (props.multiple) {
      if (Array.isArray(value)) {
        // Return array of full objects for dropdown questions
        const selectedObjects = value
          .map((val) => selectOptions.value.find((opt) => opt.value === val))
          .filter(Boolean)
          .map((opt) => opt.originalData || opt.value)

        // Emit null instead of empty array for consistency with parent expectations
        emit('update:modelValue', selectedObjects.length > 0 ? selectedObjects : null)
      } else {
        emit('update:modelValue', value)
      }
      return
    }

    const selectedOption = selectOptions.value.find((opt) => opt.value === value)
    if (selectedOption?.originalData) {
      emit('update:modelValue', selectedOption.originalData)
    } else {
      emit('update:modelValue', value)
    }
  },
})
</script>
