<template>
  <div class="booking-status">
    <div v-if="booking?.type === 2">
      <IconUserHeart :class="!!booking.assignTo ? 'text-primary' : 'text-grey-6'" />
      <QTooltip class="text-subtitle2 bg-black text-white">
        {{ booking.assignTo ? 'دکتر ' + booking.assignTo.name : 'پزشک نامشخص' }}
      </QTooltip>
    </div>

    <div>
      <IconCoin :class="prepayStatus?.color" />

      <QTooltip class="text-subtitle2 q-gutter-xs bg-black text-white text-center">
        <span v-if="prepayStatus?.date">در تاریخ {{ prepayStatus?.date }}</span>
        <span>{{ prepayStatus?.title }}</span>
      </QTooltip>
    </div>

    <div
      v-if="
        props.booking?.hasTreatmentPlan &&
        props.booking.treatmentPlan?.user?.id &&
        props.booking.treatmentPlan?.id
      "
    >
      <RouterLink
        target="_blank"
        :to="{
          path: '/treatment-plan',
          query: {
            userId: props.booking.treatmentPlan?.userId,
            id: props.booking.treatmentPlan?.id,
            mode: 'edit',
          },
        }"
      >
        <IconClipboardHeart :class="booking?.hasTreatmentPlan ? 'text-positive' : 'text-grey-6'" />
        <QTooltip class="text-subtitle2 bg-black text-white">
          {{ booking?.hasTreatmentPlan ? 'طرح درمان دارد' : 'طرح درمان ندارد' }}
        </QTooltip>
      </RouterLink>
    </div>
    <div v-else>
      <IconClipboardHeart :class="booking?.hasTreatmentPlan ? 'text-positive' : 'text-grey-6'" />
      <QTooltip class="text-subtitle2 bg-black text-white">
        {{ booking?.hasTreatmentPlan ? 'طرح درمان دارد' : 'طرح درمان ندارد' }}
      </QTooltip>
    </div>
    <div>
      <IconBooks :class="booking?.hasDoc ? 'text-primary' : 'text-grey-6'" />
      <QTooltip class="text-subtitle2 bg-black text-white">
        {{ booking?.hasDoc ? 'مدارک دارد' : 'مدارک ندارد' }}
      </QTooltip>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IconUserHeart, IconCoin, IconBooks, IconClipboardHeart } from '@tabler/icons-vue'
import { convertToJalaliWithTime } from '@/utils/date-utils'

const props = defineProps(['booking'])

const generatePriceFormat = (amount) => {
  if (!amount) return 'نامشخص'
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const prepayStatus = computed(() => {
  const treatmentPlan = props.booking.treatmentPlan || {}
  if (treatmentPlan) {
    if (!treatmentPlan.extraditionAt && treatmentPlan.prepayAt) {
      return {
        title: `${generatePriceFormat(treatmentPlan.prepay)} تومان | ${convertToJalaliWithTime(treatmentPlan.prepayAt)}`,
        color: 'text-yellow-8',
      }
    }
    if (treatmentPlan.extraditionAt) {
      return {
        title: 'عودت داده شده',
        color: 'text-negative',
        date: convertToJalaliWithTime(treatmentPlan?.extraditionAt),
      }
    }
    if (!treatmentPlan.extraditionAt && !treatmentPlan.prepayAt) {
      return { title: 'بیعانه ندارد', color: 'text-grey-6' }
    }
  }
  return { title: 'بیعانه ندارد', color: 'text-grey-6' }
})
</script>
<style scoped lang="scss">
.booking-status {
  display: flex;
  justify-content: center;
  align-items: end;
  text-align: center;
  gap: 4px;
}
</style>
