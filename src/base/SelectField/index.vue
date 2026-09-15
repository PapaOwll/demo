<template>
  <div :class="selectfieldClasses">
    <div class="selectfield__label">
      <Typography variant="body" size="4" weight="medium" :color="labelColor">
        {{ label }}
      </Typography>

      <span v-if="required" class="selectfield__required">*</span>
    </div>
    <QSelect
      ref="selectRef"
      v-model="inputValue"
      class="selectfield__qselect"
      v-bind="qSelectProps"
      :options="options"
      :placeholder="!!isNotEmpty ? '' : props.placeholder"
      @filter="handleFilter"
      @popup-show="onPopupShow"
      @popup-hide="onPopupHide"
    >
      <template #no-option>
        <slot v-if="$slots['no-option']" name="no-option" />
        <QItem v-else-if="props.loading" class="selectfield__no-option--loading">
          <QItemSection class="selectfield__no-option__section">
            <QSpinnerDots size="32px" color="primary" />
          </QItemSection>
        </QItem>
        <QItem
          v-else-if="hasError"
          class="selectfield__no-option--error"
          clickable
          @click="emit('retry')"
        >
          <QItemSection>
            <QItemLabel class="selectfield__no-option__label">خطا در دریافت اطلاعات</QItemLabel>
          </QItemSection>
          <QItemSection class="selectfield__no-option__action">
            <QBtn
              flat
              dense
              no-capsule
              color="primary"
              label="تلاش مجدد"
              size="sm"
              icon="refresh"
            />
          </QItemSection>
        </QItem>
        <QItem v-else class="selectfield__no-option--empty">
          <QItemSection class="selectfield__no-option__text">
            موردی برای نمایش وجود ندارد
          </QItemSection>
        </QItem>
      </template>
      <template v-if="$slots.startSection" #prepend>
        <slot name="startSection" />
      </template>
      <template #append>
        <IconRefresh
          v-if="props.hasError"
          class="selectfield__retry-icon"
          @click.stop="emit('retry')"
        >
          <QTooltip>تلاش مجدد</QTooltip>
        </IconRefresh>
        <slot v-if="isShowingClearIcon && !props.loading && !props.hasError" name="clearIcon">
          <IconX class="selectfield__clear-icon" @click.stop.prevent="handleClear" />
        </slot>
        <slot name="endSection" />
      </template>
      <template v-for="(_slot, index) in dynamicSlots" :key="index" #[_slot.name]="slotProps">
        <slot :name="_slot.name" v-bind="slotProps" />
      </template>
    </QSelect>

    <div v-if="displayHint" class="selectfield__hint">
      <Typography variant="caption" :color="hintColor" class="selectfield__hint-text">
        {{ displayHint }}
      </Typography>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, toRef, useAttrs, useSlots, useTemplateRef } from 'vue'
import { QSelect } from 'quasar'
import { IconX, IconRefresh } from '@tabler/icons-vue'
import Typography from '@/base/Typography'
import useControllableValue from '@/composables/use-controllable-value'
import { QUASAR_COLORS } from '@/constants/colors'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  label: {
    type: String,
    default: '',
  },
  required: Boolean,
  hint: {
    type: String,
    default: undefined,
  },

  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  variant: {
    type: String,
    default: 'filled',
    validator: (value) => ['filled', 'outline', 'outlined'].includes(value),
  },

  modelValue: {
    type: [String, Number, Object, Array],
    default: undefined,
  },
  defaultValue: {
    type: [String, Number, Object, Array],
    default: null,
  },

  options: {
    type: Array,
    default: () => [],
  },
  useInput: {
    type: Boolean,
    default: false,
  },
  disable: Boolean,
  readonly: Boolean,
  clearable: Boolean,
  multiple: Boolean,
  error: {
    type: [Boolean, String],
    default: undefined,
  },
  errorMessage: {
    type: String,
    default: undefined,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  searchFn: {
    type: Function,
    default: null,
  },
  chipColor: {
    type: String,
    default: undefined,
    validator: (value) => !value || QUASAR_COLORS.includes(value),
  },
  optionLabel: {
    type: [String, Function],
    default: undefined,
  },
  optionValue: {
    type: [String, Function],
    default: undefined,
  },
  optionDisable: {
    type: [String, Function],
    default: undefined,
  },
  emitValue: Boolean,
  mapOptions: Boolean,
  inputDebounce: {
    type: [String, Number],
    default: undefined,
  },
  useChips: Boolean,
  hideDropdownIcon: Boolean,
  hintColor: {
    type: String,
    default: undefined,
  },
  placeholder: {
    type: String,
    default: undefined,
  },
  hasError: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'clear', 'popup-show', 'popup-hide', 'retry'])
const attrs = useAttrs()
const slots = useSlots()
const selectRef = useTemplateRef('selectRef')
const isFocused = ref(false)

const { currentValue: inputValue } = useControllableValue({
  value: toRef(props, 'modelValue'),
  defaultValue: toRef(props, 'defaultValue'),
  onChange: (val) => emit('update:modelValue', val),
})

const EXCLUDED_SLOTS = new Set(['startSection', 'endSection', 'loading', 'no-option'])

const dynamicSlots = computed(() => {
  return Object.keys(slots)
    .filter((name) => !EXCLUDED_SLOTS.has(name))
    .map((name) => ({ name }))
})

const normalizedVariant = computed(() => {
  if (attrs.outlined !== undefined) return 'outline'
  return props.variant === 'outlined' ? 'outline' : props.variant
})

const displayHint = computed(() => {
  if (typeof props.error === 'string') return props.error
  if (props.error === true && props.errorMessage) return props.errorMessage
  return props.hint || ''
})

const labelColor = computed(() => {
  if (props.disable) return 'grey'
  if (props.error) return 'red'
  if (isFocused.value) return 'light-blue'
  return 'body'
})

const hintColor = computed(() => props.hintColor || (props.error ? 'red' : 'grey'))

const isShowingClearIcon = computed(
  () =>
    props.clearable &&
    inputValue.value &&
    !props.disable &&
    !props.readonly &&
    !(Array.isArray(inputValue.value) && inputValue.value.length === 0)
)

const isNotEmpty = computed(
  () => inputValue.value && !(Array.isArray(inputValue.value) && inputValue.value.length === 0)
)

const selectfieldClasses = computed(() => {
  const classes = ['selectfield']

  if (props.size?.length > 0) classes.push(`selectfield--${props.size}`)
  if (normalizedVariant.value) classes.push(`selectfield--${normalizedVariant.value}`)
  if (props.error) classes.push('selectfield--error')
  if (props.disable) classes.push('selectfield--disabled')
  if (props.multiple) classes.push('selectfield--multiple')
  if (props.chipColor) classes.push(`selectfield--chip-${props.chipColor}`)

  return classes
})

const qSelectProps = computed(() => {
  const {
    label,
    required,
    hint,
    size,
    variant,
    clearable,
    error,
    errorMessage,
    modelValue,
    defaultValue,
    options,
    useInput,
    loading,
    searchFn,
    multiple,
    chipColor,
    optionLabel,
    optionValue,
    optionDisable,
    emitValue,
    mapOptions,
    inputDebounce,
    useChips,
    hideDropdownIcon,
    placeholder,
    hasError,
    ...rest
  } = props
  const { outlined, ...restAttrs } = attrs

  return {
    ...rest,
    ...restAttrs,
    useInput: props.useInput,
    optionLabel: props.optionLabel,
    optionValue: props.optionValue,
    optionDisable: props.optionDisable,
    emitValue: props.emitValue || undefined,
    mapOptions: props.mapOptions || undefined,
    inputDebounce: props.inputDebounce,
    useChips: props.useChips || undefined,
    hideDropdownIcon: props.hideDropdownIcon || undefined,
    placeholder: props.placeholder,
    filled: normalizedVariant.value === 'filled',
    outlined: normalizedVariant.value === 'outline',
    hideBottomSpace: true,
    multiple: props.multiple,
  }
})

const handleFilter = (val, update, abort) => {
  if (props.searchFn) {
    props.searchFn(val, update, abort)
  } else {
    update()
  }
}

const onPopupShow = () => {
  isFocused.value = true
  emit('popup-show')
}

const onPopupHide = () => {
  isFocused.value = false
  emit('popup-hide')
}

const handleClear = () => {
  inputValue.value = null
  emit('clear', null)
  selectRef.value?.focus()
}

defineExpose({
  focus: () => selectRef.value?.focus(),
  blur: () => selectRef.value?.blur(),
})
</script>

<style lang="scss" scoped src="./selectfield.scss"></style>
