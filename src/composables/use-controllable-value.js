import { computed, ref, watch } from 'vue'

export default function useControllableValue({ value, defaultValue, onChange }) {
  const isControlled = computed(() => value.value !== undefined)
  const internalValue = ref(defaultValue.value)

  watch(value, (val) => {
    if (val !== undefined) internalValue.value = val
  })

  const currentValue = computed({
    get() {
      return isControlled.value ? value.value : internalValue.value
    },
    set(val) {
      internalValue.value = val
      onChange?.(val)
    },
  })

  return { currentValue }
}
