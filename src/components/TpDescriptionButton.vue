<template>
  <RouterLink v-if="isValidData" v-slot="{ navigate, href }" :to="routeObject" custom>
    <Button variant="flat" color="blue" text="شرح درمان" :href="href" @click="navigate" />
  </RouterLink>
  <Button v-else variant="flat" color="blue" text="شرح درمان" @click="handleInvalidClick" />
</template>

<script setup>
import Button from '@/base/Button'
import { computed } from 'vue'
import { Notif } from '@/data/services/notification-service'

const props = defineProps({
  data: {
    type: [Object, Array],
    default: () => ({}),
  },
})

const isValidData = computed(() => {
  return !!props.data?.treatmentPlan?.id
})

const routeObject = computed(() => {
  const treatmentPlanId = props.data?.treatmentPlan?.id
  const bookingId = props.data?.id

  return {
    name: 'treatment-plan-description',
    params: { tpId: treatmentPlanId },
    query: { bookingId },
  }
})

const handleInvalidClick = () => {
  Notif.error('اطلاعات نوبت ناقص است. لطفاً مجدداً تلاش کنید.')
}
</script>
