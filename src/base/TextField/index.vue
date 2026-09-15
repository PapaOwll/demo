<template>
  <div :class="textfieldClasses">
    <div class="textfield__label">
      <Typography variant="body" size="4" weight="medium" :color="labelColor">
        {{ label }}
      </Typography>

      <span v-if="required" class="textfield__required">*</span>
    </div>

    <QInput
      ref="inputRef"
      v-model="inputValue"
      class="textfield__qinput"
      v-bind="qInputProps"
      @focus="isFocused = true"
      @blur="isFocused = false"
    >
      <template v-if="$slots.startSection" #prepend>
        <slot name="startSection" />
      </template>

      <template #append>
        <slot v-if="isShowingClearIcon" name="clearIcon">
          <IconX class="textfield__clear-icon" @click.stop.prevent="handleClear" />
        </slot>
        <slot name="endSection" />
      </template>
      <slot />
    </QInput>

    <div class="textfield__hint">
      <Typography variant="caption" :color="hintColor" class="textfield__hint-text">
        {{ displayHint }}
      </Typography>
      <Typography
        v-if="showCharacterCount && maxlength"
        variant="caption"
        :color="hintColor"
        class="textfield__hint-count"
      >
        {{ characterCount }} / {{ maxlength }}
      </Typography>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, toRef, useAttrs, useTemplateRef } from 'vue'
import { QInput } from 'quasar'
import { IconX } from '@tabler/icons-vue'
import Typography from '@/base/Typography'
import useControllableValue from '@/composables/use-controllable-value'

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
  showCharacterCount: Boolean,

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
    type: [String, Number],
    default: undefined,
  },
  defaultValue: {
    type: [String, Number],
    default: '',
  },

  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: undefined,
  },
  disable: Boolean,
  readonly: Boolean,
  clearable: Boolean,
  error: {
    type: [Boolean, String],
    default: undefined,
  },
  errorMessage: {
    type: String,
    default: undefined,
  },
  maxlength: {
    type: [String, Number],
    default: undefined,
  },
  mask: {
    type: String,
    default: undefined,
  },
  fillMask: {
    type: [Boolean, String],
    default: undefined,
  },
  reverseFillMask: Boolean,
  unmaskedValue: Boolean,
  debounce: {
    type: [String, Number],
    default: undefined,
  },
  autogrow: Boolean,
  suffix: {
    type: String,
    default: undefined,
  },
  // dense: Boolean,
  bgColor: {
    type: String,
    default: undefined,
  },
  hintColor: {
    type: String,
    default: undefined,
  },
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'clear'])
const attrs = useAttrs()
const inputRef = useTemplateRef('inputRef')
const isFocused = ref(false)

const { currentValue: inputValue } = useControllableValue({
  value: toRef(props, 'modelValue'),
  defaultValue: toRef(props, 'defaultValue'),
  onChange: (val) => emit('update:modelValue', val),
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

const characterCount = computed(() => String(inputValue.value || '').length)

const isShowingClearIcon = computed(() => props.clearable && inputValue.value && !props.disable)

const textfieldClasses = computed(() => {
  const classes = ['textfield']

  if (props.size?.length > 0) classes.push(`textfield--${props.size}`)
  if (normalizedVariant.value) classes.push(`textfield--${normalizedVariant.value}`)
  if (props.error) classes.push('textfield--error')
  if (props.disable) classes.push('textfield--disabled')
  if (props.autogrow || props.type === 'textarea') classes.push('textfield--autogrow')

  return classes
})

const qInputProps = computed(() => {
  const {
    label,
    required,
    hint,
    showCharacterCount,
    size,
    variant,
    clearable,
    error,
    errorMessage,
    modelValue,
    defaultValue,
    suffix,
    // dense,
    bgColor,
    ...rest
  } = props
  const { outlined, ...restAttrs } = attrs

  return {
    ...rest,
    ...restAttrs,
    suffix: props.suffix,
    bgColor: props.bgColor || undefined,
    filled: normalizedVariant.value === 'filled',
    outlined: normalizedVariant.value === 'outline',
    hideBottomSpace: true,
  }
})

const handleClear = () => {
  inputValue.value = null
  emit('clear', null)
  inputRef.value?.focus()
}

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  select: () => inputRef.value?.select(),
})
</script>

<style lang="scss" scoped src="./textfield.scss"></style>
