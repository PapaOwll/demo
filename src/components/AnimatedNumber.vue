<template>
  <span :class="props.style">
    {{ numberSeparator(displayNumber) }}
  </span>
</template>
<script setup>
import { ref, watch } from 'vue'
import { numberSeparator } from '@/utils/formatter'

const props = defineProps({ number: { type: [Number, String], default: 0 } })

const displayNumber = ref(0)
const interval = ref(false)

displayNumber.value = props.number || 0

watch(
  () => props.number,
  () => {
    clearInterval(interval.value)
    if (props.number === displayNumber.value) {
      return
    }

    interval.value = setInterval(() => {
      if (displayNumber.value !== props.number) {
        let change = (props.number - displayNumber.value) / 2
        change = change >= 0 ? Math.ceil(change) : Math.floor(change)
        displayNumber.value += change
      }
    }, 20)
  }
)
</script>
