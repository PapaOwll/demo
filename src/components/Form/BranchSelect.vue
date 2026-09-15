<template>
  <SelectField
    :model-value="modelValue"
    :label="label"
    :placeholder="placeholder"
    :options="branchOptions"
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
    :class="componentClasses"
    :loading="isPending"
    :has-error="isError"
    v-bind="$attrs"
    :search-fn="filterBranches"
    @popup-show="isOpened = true"
    @retry="refetch"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur')"
  />
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import SelectField from '@/base/SelectField'
import { useApiGetBranches } from '@/modules/Settings/ClinicSetting/query'
import { addFallbackOption } from '@/utils/select-fallback-option'

const props = defineProps({
  modelValue: {
    type: [String, Number, Array, Object],
    default: null,
  },
  label: {
    type: String,
    default: 'شعبه',
  },
  placeholder: {
    type: String,
    default: 'انتخاب شعبه',
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
  autoSelectSingleOption: {
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

const emit = defineEmits(['update:modelValue', 'blur'])

const isOpened = ref(false)
const {
  data: branchesData,
  isLoading,
  isError,
  refetch,
} = useApiGetBranches({
  enabled: computed(() => !props.lazy || isOpened.value),
})

const isPending = computed(
  () => (props.lazy && isOpened.value && !branchesData.value && !isError.value) || isLoading.value
)

const allBranches = computed(() => {
  const items = branchesData.value?.items || []
  const options = items.map((item) => ({
    label: item.name,
    value: item.id,
    rawData: item,
  }))
  addFallbackOption(options, props.modelValue, 'name', props.displayLabel, !!branchesData.value)
  return options
})

const branchOptions = ref([])

const filterBranches = (val, update) => {
  update(() => {
    if (val === '') {
      branchOptions.value = allBranches.value
    } else {
      const needle = val.toLowerCase()
      branchOptions.value = allBranches.value.filter((option) =>
        option.label.toLowerCase().includes(needle)
      )
    }
  })
}

watch(
  allBranches,
  (newOptions) => {
    branchOptions.value = newOptions

    if (newOptions.length === 1 && props.autoSelectSingleOption) {
      const singleValue = newOptions[0].value
      nextTick(() => {
        emit('update:modelValue', singleValue)
      })
    }
  },
  { immediate: true }
)

const componentClasses = computed(() => {
  const baseClass = 'branch-select'
  const customClasses = props.class

  return [
    baseClass,
    {
      [`${baseClass}--error`]: !!props.errorMessage,
      [`${baseClass}--multiple`]: props.multiple,
    },
    customClasses,
  ]
})
</script>

<style lang="scss" scoped>
.branch-select {
  width: 100%;
}
</style>
