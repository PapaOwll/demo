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
    :error="!!errorMessage || null"
    :error-message="errorMessage || null"
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
import { useGetEnumsQuery, useGetEnumsBySlug } from '@/modules/User/query'

const props = defineProps({
  modelValue: {
    type: [String, Number, Array, Object],
    default: null,
  },
  label: {
    type: String,
    default: '',
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
  enumKey: {
    type: String,
    default: '',
  },
  slug: {
    type: String,
    default: '',
  },
  lazy: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue', 'blur'])

const isOpened = ref(false)
const isSlugMode = computed(() => !!props.slug)
const enabled = computed(() => !props.lazy || isOpened.value)

const key = computed(() => props.enumKey)
const enumQuery = useGetEnumsQuery(key, {
  enabled: computed(() => enabled.value && !isSlugMode.value),
})

const slugRef = computed(() => props.slug)
const slugQuery = useGetEnumsBySlug(slugRef, {
  enabled: computed(() => enabled.value && isSlugMode.value),
})
const data = computed(() => (isSlugMode.value ? slugQuery.data.value : enumQuery.data.value))
const isLoading = computed(() =>
  isSlugMode.value ? slugQuery.isLoading.value : enumQuery.isLoading.value
)
const isError = computed(() =>
  isSlugMode.value ? slugQuery.isError.value : enumQuery.isError.value
)
const refetch = () => (isSlugMode.value ? slugQuery.refetch() : enumQuery.refetch())

const isPending = computed(
  () => (props.lazy && isOpened.value && !data.value && !isError.value) || isLoading.value
)

const items = computed(() => {
  if (!data.value) return []
  if (isSlugMode.value) {
    return (
      data.value?.items?.map((item) => ({
        label: item?.title,
        value: item?.id,
      })) || []
    )
  }
  return Object.keys(data.value).map((it) => ({
    label: data.value[it].faTitle,
    value: data.value[it].id,
  }))
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
