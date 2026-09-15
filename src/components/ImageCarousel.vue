<template>
  <div>
    <VueEasyLightbox :visible="visibleRef" :imgs="imgs" :index="indexRef" @hide="onHide">
      <template v-if="hasSlot('prev-btn')" #prev-btn="{ prev }">
        <slot name="prev-btn" :prev="prev" />
      </template>

      <template v-if="hasSlot('next-btn')" #next-btn="{ next }">
        <slot name="next-btn" :next="next" />
      </template>

      <template v-if="hasSlot('close-btn')" #close-btn="{ close }">
        <slot name="close-btn" :close="close" />
      </template>

      <template v-if="hasSlot('toolbar')" #:toolbar="{ toolbarMethods }">
        <slot name="toolbar" :toolbar-methods="toolbarMethods" />
      </template>
    </VueEasyLightbox>
  </div>
</template>
<script setup>
import { ref, useSlots, watch } from 'vue'
import VueEasyLightbox from 'vue-easy-lightbox'
import 'vue-easy-lightbox/external-css/vue-easy-lightbox.css'

const emit = defineEmits(['close'])
const props = defineProps({
  imgs: {
    type: Array,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  visible: {
    type: Boolean,
  },
})
const indexRef = ref(props.index)
const visibleRef = ref(props.visible)
watch(
  () => props.index,
  (value) => {
    indexRef.value = value
  }
)
watch(
  () => props.visible,
  (value) => {
    visibleRef.value = value
  }
)

const onHide = () => {
  emit('close')
  visibleRef.value = false
}
const slots = useSlots()
const hasSlot = (name) => {
  return !!slots[name]
}
</script>
