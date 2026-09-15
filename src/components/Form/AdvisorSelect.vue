<template>
  <SelectField
    :model-value="modelValue"
    :label="label"
    :placeholder="placeholder"
    :options="advisorOptions"
    option-label="label"
    option-value="value"
    emit-value
    map-options
    variant="outline"
    dense
    clearable
    use-input
    :use-chips="chips"
    input-debounce="300"
    :multiple="multiple"
    :error="!!errorMessage || null"
    :error-message="errorMessage"
    :loading="isPending"
    :has-error="isError"
    :class="componentClasses"
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
import useRoles from '@/composables/use-roles'
import { addFallbackOption } from '@/utils/select-fallback-option'

const props = defineProps({
  modelValue: {
    type: [String, Number, Array, Object],
    default: null,
  },
  label: {
    type: String,
    default: 'مشاور',
  },
  placeholder: {
    type: String,
    default: 'انتخاب مشاور',
  },
  errorMessage: {
    type: String,
    default: null,
  },
  class: {
    type: String,
    default: '',
  },
  userRole: {
    type: Array,
    default: () => [
      'advisor',
      'super_admin',
      'secretary',
      'writer',
      'coordinator',
      'doctor',
      'validator',
      'presenter',
      'financial',
      'support',
      'admin',
      'advisor_and_online_visit',
    ],
  },
  showRole: {
    type: Boolean,
    default: false,
  },
  chips: {
    type: Boolean,
    default: false,
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
const { data: advisorsData } = useRoles(props.userRole, {
  enabled: computed(() => !props.lazy || isOpened.value),
})

const isError = ref(false)
const refetch = () => {}
const isPending = computed(() => props.lazy && isOpened.value && !advisorsData.value)

const allAdvisors = computed(() => {
  const advisors =
    advisorsData.value?.items?.map((item) => ({
      label: props.showRole
        ? `${item.name} / ${item.mobile} (${item.role?.faTitle || 'نامشخص'})`
        : `${item.name} / ${item.mobile}`,
      value: item.id,
      rawData: item,
    })) || []

  addFallbackOption(advisors, props.modelValue, 'name', props.displayLabel, !!advisorsData.value)

  if (props.showUnknown) {
    return [{ label: 'نامشخص', value: 'unknown', rawData: null }, ...advisors]
  }

  return advisors
})

const advisorOptions = ref([])

const filterAdvisors = (val, update) => {
  update(() => {
    if (val === '') {
      advisorOptions.value = allAdvisors.value
    } else {
      const needle = val.toLowerCase()
      advisorOptions.value = allAdvisors.value.filter((option) =>
        option.label.toLowerCase().includes(needle)
      )
    }
  })
}

watch(
  allAdvisors,
  (newOptions) => {
    advisorOptions.value = newOptions
  },
  { immediate: true }
)

const componentClasses = computed(() => {
  const baseClass = 'advisor-select'
  const customClasses = props.class

  return [
    baseClass,
    {
      [`${baseClass}--error`]: !!props.errorMessage,
      [`${baseClass}--multiple`]: props.multiple,
      [`${baseClass}--with-role`]: props.showRole,
    },
    customClasses,
  ]
})
</script>

<style lang="scss" scoped>
.advisor-select {
  width: 100%;
}
</style>
