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
    :multiple="multiple"
    :error="!!errorMessage"
    :error-message="errorMessage"
    :loading="isPending"
    :has-error="isError"
    v-bind="$attrs"
    :search-fn="filterCampaigns"
    @popup-show="onPopupShow"
    @retry="refetch"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur')"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import SelectField from '@/base/SelectField'
import { useGetCampaignListQuery } from '@/modules/Ads/query'
import { addFallbackOption } from '@/utils/select-fallback-option'

const props = defineProps({
  modelValue: {
    type: [String, Number, Array, Object],
    default: null,
  },
  label: {
    type: String,
    default: 'کمپین ها',
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
const searchQuery = ref('')

const queryParams = computed(() => {
  const params = {}
  if (searchQuery.value) params['filter[title]'] = searchQuery.value
  return params
})

const { data, isLoading, isError, refetch } = useGetCampaignListQuery(queryParams, {
  enabled: computed(() => !props.lazy || isOpened.value),
})

const isPending = computed(
  () => (props.lazy && isOpened.value && !data.value && !isError.value) || isLoading.value
)

const items = computed(() => {
  const options =
    data.value?.items?.map((item) => ({
      label: item.title,
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

const filterCampaigns = (val, update) => {
  searchQuery.value = val
  update(() => {
    allOptions.value = items.value
  })
}

const onPopupShow = () => {
  isOpened.value = true
}

watch(
  items,
  (newOptions) => {
    allOptions.value = newOptions
  },
  { immediate: true }
)
</script>
