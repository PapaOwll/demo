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
    :use-chips="!!multiple"
    :loading="isPending"
    :has-error="isError"
    input-debounce="300"
    :multiple="multiple"
    :error="!!errorMessage"
    :error-message="errorMessage"
    v-bind="$attrs"
    :search-fn="filterAdvisors"
    @popup-show="isOpened = true"
    @retry="refetch"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur')"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import SelectField from '@/base/SelectField'
import { useGetServesQuery } from '@/modules/User/query'
import { useApiGetMinimalServe } from '@/modules/Settings/index'
import createFilterObject from '@/utils/create-filter-object'
import { addFallbackOption } from '@/utils/select-fallback-option'

const props = defineProps({
  modelValue: {
    type: [String, Number, Array],
    default: null,
  },
  label: {
    type: String,
    default: 'خدمات',
  },
  errorMessage: {
    type: String,
    default: null,
  },
  class: {
    type: String,
    default: '',
  },
  showUnknown: {
    type: Boolean,
    default: false,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  miniServeService: {
    type: Boolean,
    default: false,
  },
  propFilter: {
    type: [Object, Array],
    default: () => ({}),
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
const enabled = computed(() => !props.lazy || isOpened.value)

const queryParams = computed(() => {
  if (!props.miniServeService) return {}

  const cleanedFilters = createFilterObject(props.propFilter || {})
  return Object.keys(cleanedFilters).length > 0 ? cleanedFilters : {}
})

const { data, isLoading, isError, refetch } = props.miniServeService
  ? useApiGetMinimalServe(queryParams.value, { enabled })
  : useGetServesQuery({ enabled })

const isPending = computed(
  () => (props.lazy && isOpened.value && !data.value && !isError.value) || isLoading.value
)

const items = computed(() => {
  const options =
    data.value?.items?.map((item) => ({
      label: item.title || item?.serveTitle,
      value: item.id,
      rawData: item,
    })) || []

  addFallbackOption(options, props.modelValue, 'title', props.displayLabel, !!data.value)

  if (props.showUnknown) {
    return [{ label: 'نامشخص', value: 'unknown', rawData: null }, ...options]
  }

  return options
})

const allOptions = ref([])

const filterAdvisors = (val, update) => {
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
