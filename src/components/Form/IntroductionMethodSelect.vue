<template>
  <SelectField
    :model-value="modelValue"
    :label="label"
    :placeholder="placeholder"
    :options="options"
    :option-label="(i) => i?.label || i?.faTitle || '-'"
    option-value="value"
    emit-value
    map-options
    variant="outline"
    :use-chips="chips"
    clearable
    :error="!!errorMessage"
    :error-message="errorMessage"
    :class="componentClasses"
    :loading="isPending"
    :has-error="isError"
    v-bind="$attrs"
    @popup-show="isOpened = true"
    @retry="refetch"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur')"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import SelectField from '@/base/SelectField'
import { useGetMethodOfIntroductionsQuery } from '@/modules/User/query'
import { addFallbackOption } from '@/utils/select-fallback-option'

const props = defineProps({
  modelValue: {
    type: [String, Number, Array, Object],
    default: null,
  },
  label: {
    type: String,
    default: 'شیوه آشنایی',
  },
  placeholder: {
    type: String,
    default: 'انتخاب شیوه آشنایی',
  },
  errorMessage: {
    type: String,
    default: null,
  },
  class: {
    type: String,
    default: '',
  },
  chips: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: undefined,
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
const {
  data: methodData,
  isLoading,
  isError,
  refetch,
} = useGetMethodOfIntroductionsQuery({
  enabled: computed(() => {
    if (props.lazy) return isOpened.value
    return props.enabled ?? true
  }),
})

const isPending = computed(
  () => (props.lazy && isOpened.value && !methodData.value && !isError.value) || isLoading.value
)

const options = computed(() => {
  const result =
    methodData.value?.items?.map((item) => ({
      label: item.faTitle,
      value: item.id,
    })) || []
  addFallbackOption(result, props.modelValue, 'faTitle', props.displayLabel, !!methodData.value)
  return result
})

const componentClasses = computed(() => {
  const baseClass = 'introduction-method-select'
  const customClasses = props.class

  return [
    baseClass,
    {
      [`${baseClass}--loading`]: isLoading.value,
      [`${baseClass}--error`]: !!props.errorMessage,
    },
    customClasses,
  ]
})
</script>

<style lang="scss" scoped>
.introduction-method-select {
  width: 100%;

  &--loading {
    opacity: 0.7;
  }
}
</style>
