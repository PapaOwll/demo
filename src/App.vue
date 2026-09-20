<template>
  <component :is="currentLayout" />
  <VueQueryDevtools />
  <ContactPopupWrapper />
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { useQueryClient } from '@tanstack/vue-query'
import { hasAccessToken } from '@/utils/auth'
import { sweepVoiceRecoveries } from '@/modules/TreatmentPlan/composables/use-voice-auto-save'

const AppLayout = defineAsyncComponent(() => import('./layout/AppLayout'))
const PureLayout = defineAsyncComponent(() => import('./layout/PureLayout'))
const ContactPopupWrapper = defineAsyncComponent(() => import('@/components/ContactPopupWrapper'))

const route = useRoute()
const queryClient = useQueryClient()

const currentLayout = computed(() => {
  const layout = route?.meta?.layout
  if (!layout) return PureLayout
  if (layout === 'AppLayout') return AppLayout
  return layout
})

onMounted(() => {
  if (!hasAccessToken()) return

  sweepVoiceRecoveries().then((savedCount) => {
    if (!savedCount) return

    queryClient.invalidateQueries({ queryKey: ['booking-voices'] })
    queryClient.invalidateQueries({ queryKey: ['new-treatment-plan', 'treatment'] })
  })
})
</script>
