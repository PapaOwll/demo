<template>
  <SelectField
    :model-value="modelValue"
    :label="label"
    :options="allOptions"
    :option-label="(i) => i.label || i.name"
    option-value="value"
    emit-value
    map-options
    variant="outline"
    clearable
    use-input
    :use-chips="chips"
    input-debounce="300"
    :multiple="multiple"
    :error="!!errorMessage"
    :error-message="errorMessage"
    :loading="isPending"
    :has-error="isError"
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
import { useGetProvincesQuery } from '@/modules/User/query'
import { addFallbackOption } from '@/utils/select-fallback-option'

const props = defineProps({
  modelValue: {
    type: [String, Number, Array, Object],
    default: null,
  },
  label: {
    type: String,
    default: 'استان',
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
  chips: {
    type: Boolean,
    default: true,
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
const { data, isLoading, isError, refetch } = useGetProvincesQuery({
  enabled: computed(() => !props.lazy || isOpened.value),
})
const isPending = computed(
  () => (props.lazy && isOpened.value && !data.value && !isError.value) || isLoading.value
)

const items = computed(() => {
  const options =
    data.value?.items?.map((item) => ({
      label: item.name,
      value: item.id,
      rawData: item,
    })) || []

  addFallbackOption(options, props.modelValue, 'name', props.displayLabel, !!data.value)

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
