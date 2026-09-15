<template>
  <SelectField
    :model-value="modelValue"
    :label="label"
    :options="allOptions"
    option-label="label"
    option-value="value"
    emit-value
    map-options
    variant="outline"
    clearable
    use-input
    input-debounce="300"
    :error="!!errorMessage || null"
    :error-message="errorMessage || null"
    :loading="isPending"
    :has-error="isError"
    v-bind="$attrs"
    :search-fn="filterItems"
    @popup-show="isOpened = true"
    @retry="refetch"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur')"
  >
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData ?? {}" />
    </template>
  </SelectField>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import SelectField from '@/base/SelectField'
import { useApiGetSettings } from '@/modules/Settings'
import { addFallbackOption } from '@/utils/select-fallback-option'

const props = defineProps({
  modelValue: {
    type: [String, Number, Array, Object],
    default: null,
  },
  label: {
    type: String,
    default: 'زمان',
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
  lazy: {
    type: Boolean,
    default: false,
  },
  displayLabel: {
    type: String,
    default: null,
  },
})

defineEmits(['update:modelValue', 'blur'])

const isOpened = ref(false)
const { data, isLoading, isError, refetch } = useApiGetSettings('taskDueTimeRange', undefined, {
  enabled: computed(() => !props.lazy || isOpened.value),
})

const isPending = computed(
  () => (props.lazy && isOpened.value && !data.value && !isError.value) || isLoading.value
)

const items = computed(() => {
  const options = Array.isArray(data.value)
    ? data.value.map((item) => ({
        label: item.faTitle,
        value: item.enTitle,
        rawData: item,
      }))
    : []

  addFallbackOption(options, props.modelValue, 'faTitle', props.displayLabel, !!data.value)
  return options
})

const allOptions = ref([])

const filterItems = (val, update) => {
  update(() => {
    if (val === '') {
      allOptions.value = items.value
    } else {
      const needle = val.toLowerCase()
      allOptions.value = items.value.filter((option) => option.label.toLowerCase().includes(needle))
    }
  })
}

watch(
  items,
  (newOptions) => {
    allOptions.value = newOptions
  },
  { immediate: true }
)
</script>
