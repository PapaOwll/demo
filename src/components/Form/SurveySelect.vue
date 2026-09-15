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
    :search-fn="filterSurveys"
    @popup-show="onPopupShow"
    @retry="refetch"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur')"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import SelectField from '@/base/SelectField'
import { useSurveyListQuery } from '@/modules/Survey/SurveyList/query/index'
import { addFallbackOption } from '@/utils/select-fallback-option'

const props = defineProps({
  modelValue: {
    type: [String, Number, Array, Object],
    default: null,
  },
  label: {
    type: String,
    default: 'نظرسنجی',
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
})

defineEmits(['update:modelValue', 'blur'])

const isOpened = ref(false)
const searchQuery = ref('')

const queryParams = computed(() => {
  const params = { per_page: 10 }
  if (searchQuery.value) params['filter[title]'] = searchQuery.value
  return params
})

const { data, isLoading, isError, refetch } = useSurveyListQuery(queryParams, {
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
    })) || []

  addFallbackOption(options, props.modelValue, 'title', props.displayLabel, !!data.value)

  return options
})

const allOptions = ref([])

const filterSurveys = (val, update) => {
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
