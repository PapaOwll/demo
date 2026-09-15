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
    :search-fn="filterItems"
    @popup-show="isOpened = true"
    @retry="refetch"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur')"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import SelectField from '@/base/SelectField'
import { useGetInstallment } from '@/modules/TreatmentPlan/query'

const props = defineProps({
  modelValue: {
    type: [String, Number, Array, Object],
    default: null,
  },
  label: {
    type: String,
    default: 'شیوه پرداخت',
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
const enabled = computed(() => !props.lazy || isOpened.value)
const { data, isLoading, isError, refetch } = useGetInstallment(enabled)

const isPending = computed(
  () => (props.lazy && isOpened.value && !data.value && !isError.value) || isLoading.value
)

const items = computed(() => {
  const cashState = { label: 'نقد', value: 0 }
  const installments =
    data.value?.items?.map((installment) => ({
      label: `${installment.month} ماه`,
      value: installment.month,
    })) || []
  return [cashState, ...installments]
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
