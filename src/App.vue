<template>
  <component :is="currentLayout" />
  <VueQueryDevtools />
  <ContactPopupWrapper />
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
// import { setThemeColors } from '@/utils/theme-setting'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

const AppLayout = defineAsyncComponent(() => import('./layout/AppLayout'))
const PureLayout = defineAsyncComponent(() => import('./layout/PureLayout'))
const ContactPopupWrapper = defineAsyncComponent(() => import('@/components/ContactPopupWrapper'))

const route = useRoute()

const currentLayout = computed(() => {
  const layout = route?.meta?.layout
  if (!layout) return PureLayout
  if (layout === 'AppLayout') return AppLayout
  return layout
})

// onMounted(() => {
//   setThemeColors()
// })
</script>
