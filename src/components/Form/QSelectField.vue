<template>
  <SelectField
    :model-value="modelValue"
    :label="label"
    :options="filteredOptions"
    :option-label="optionLabel || 'title'"
    :option-value="optionValue || 'id'"
    emit-value
    map-options
    variant="outline"
    clearable
    use-input
    :multiple="multiple"
    :error="!!errorMessage || null"
    :error-message="errorMessage"
    :class="componentClasses"
    v-bind="$attrs"
    :search-fn="onFilter"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur')"
  >
    <template v-if="chips && multiple" #selected-item="scope">
      <template v-if="scope.index === 0">
        <QChip class="q-ma-xs" dense outline color="primary">
          <div class="q-chip__content">
            {{ scope.opt[optionLabel || 'title'] }}
          </div>
        </QChip>
        <QChip v-if="(modelValue?.length ?? 0) > 1" color="primary" outline dense class="q-ma-xs">
          <div class="q-chip__content">+ {{ modelValue.length - 1 }} مورد دیگر</div>
        </QChip>
      </template>
    </template>
  </SelectField>
</template>

<script setup>
import { ref, computed } from 'vue'
import SelectField from '@/base/SelectField'

const props = defineProps({
  modelValue: {
    type: [String, Number, Array, Object],
    default: null,
  },
  label: {
    type: String,
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  optionLabel: {
    type: String,
    default: 'label',
  },
  optionValue: {
    type: String,
    default: 'value',
  },
  errorMessage: {
    type: String,
    default: null,
  },
  class: {
    type: String,
    default: '',
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  chips: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue', 'blur'])

const search = ref('')

const filteredOptions = computed(() => {
  if (!search.value) return props.options

  return props.options.filter((option) => {
    const label = option[props.optionLabel]
    return label?.toString().toLowerCase().includes(search.value.toLowerCase().trim())
  })
})

const onFilter = (val, update) => {
  search.value = val
  update()
}

const componentClasses = computed(() => {
  const baseClass = 'q-select-custom'
  return [baseClass, { [`${baseClass}--error`]: !!props.errorMessage }, props.class]
})
</script>

<style scoped lang="scss">
.q-select-custom {
  width: 100%;
}
</style>
