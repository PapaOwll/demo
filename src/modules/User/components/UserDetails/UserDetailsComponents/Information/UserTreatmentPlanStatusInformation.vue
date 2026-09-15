<template>
  <div class="user-treatment-plan-status-information">
    <QTooltip anchor="top middle" self="bottom middle">
      {{ prepayStatus?.title }}
    </QTooltip>
    <TablerIconCoin
      :class="prepayStatus?.iconClass"
      class="user-treatment-plan-status-information__icon"
    />
  </div>
</template>

<script setup>
import { IconCoin as TablerIconCoin } from '@tabler/icons-vue'
import { computed } from 'vue'
import { convertToJalaliWithTime } from '@/utils/date-utils'

const props = defineProps({
  treatmentPlan: {
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
  if (props.treatmentPlan) {
    if (!props.treatmentPlan.extraditionAt && props.treatmentPlan.prepayAt) {
      return {
        title: `${generatePriceFormat(props.treatmentPlan.prepay)} تومان | ${generateDate(props.treatmentPlan.prepayAt)}`,
        iconClass: 'user-treatment-plan-status-information__icon--warning',
      }
    }
    if (props.treatmentPlan.extraditionAt) {
      return {
        title: 'عودت داده شده',
        iconClass: 'user-treatment-plan-status-information__icon--danger',
      }
    }
    if (!props.treatmentPlan.extraditionAt && !props.treatmentPlan.prepayAt) {
      return {
        title: 'بیعانه ندارد',
        iconClass: 'user-treatment-plan-status-information__icon--muted',
      }
    }
  }
  return {
    title: 'بیعانه ندارد',
    iconClass: 'user-treatment-plan-status-information__icon--muted',
  }
})
</script>

<style lang="scss" scoped>
.user-treatment-plan-status-information {
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
