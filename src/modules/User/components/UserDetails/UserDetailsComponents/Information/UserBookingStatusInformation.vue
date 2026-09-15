<template>
  <div class="user-booking-status-information">
    <QTooltip v-if="booking.type === 1" anchor="top middle" self="bottom middle">
      {{ prepayStatus?.title }}
    </QTooltip>
    <TablerIconCoin
      v-if="booking.type === 1"
      :class="prepayStatus?.iconClass"
      class="user-booking-status-information__icon"
    />
  </div>
</template>

<script setup>
import { IconCoin as TablerIconCoin } from '@tabler/icons-vue'
import { computed } from 'vue'
import { convertToJalaliWithTime } from '@/utils/date-utils'

const props = defineProps({
  booking: {
    type: Object,
    default: () => ({}),
  },
})
const generatePriceFormat = (amount) => {
  if (!amount) return 'نامشخص'
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
const generateDate = (date) => {
  if (!date) return 'نامشخص'
  return convertToJalaliWithTime(date, 'HH:mm jYYYY/jMM/jDD')
}
const prepayStatus = computed(() => {
  const { treatmentPlan } = props.booking
  if (treatmentPlan) {
    if (!treatmentPlan.extraditionAt && treatmentPlan.prepayAt) {
      return {
        title: `${generatePriceFormat(treatmentPlan.prepay)} تومان | ${generateDate(treatmentPlan.prepayAt)}`,
        iconClass: 'user-booking-status-information__icon--warning',
      }
    }
    if (treatmentPlan.extraditionAt) {
      return {
        title: 'عودت داده شده',
        iconClass: 'user-booking-status-information__icon--danger',
      }
    }
    if (!treatmentPlan.extraditionAt && !treatmentPlan.prepayAt) {
      return {
        title: 'بیعانه ندارد',
        iconClass: 'user-booking-status-information__icon--muted',
      }
    }
  }
  return {
    title: 'بیعانه ندارد',
    iconClass: 'user-booking-status-information__icon--muted',
  }
})
</script>

<style lang="scss" scoped>
.user-booking-status-information {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;

  &__icon {
    width: 20px;
    height: 20px;
    margin-left: 12px;

    &--warning {
      color: $warning;
    }

    &--danger {
      color: $negative;
    }

    &--muted {
      color: $grey-6;
    }
  }
}
</style>
