<template>
  <div class="treatment-plan-status">
    <div>
      <RouterLink
        v-if="
          treatmentPlan?.is_active &&
          treatmentPlan?.user?.id &&
          (treatmentPlan?.treatmentId ?? treatmentPlan?.id)
        "
        target="_blank"
        :to="{
          path: '/treatment-plan',
          query: {
            userId: treatmentPlan?.user?.id,
            id: treatmentPlan?.treatmentId ?? treatmentPlan?.id,
            mode: 'edit',
          },
        }"
      >
        <IconStethoscope
          class="treatment-plan-status__icon"
          :class="treatmentPlanStatus?.colorClass"
          size="24"
        />
        <QTooltip class="text-subtitle2 bg-black text-white">
          {{ treatmentPlanStatus?.text }}
        </QTooltip>
      </RouterLink>
      <IconStethoscope
        v-else
        class="treatment-plan-status__icon"
        :class="treatmentPlanStatus.colorClass"
        size="24"
      />
      <QTooltip class="text-subtitle2 bg-black text-white">
        {{ treatmentPlanStatus?.text }}
      </QTooltip>
    </div>
    <div>
      <IconTicket
        v-if="treatmentPlan?.installment?.id"
        class="treatment-plan-status__icon"
        :class="creditStatus.colorClass"
        size="22"
      />
      <QTooltip class="text-subtitle2 bg-black text-white">
        {{ creditStatus.text }}
      </QTooltip>
    </div>
    <div>
      <IconFileDiff
        v-if="treatmentPlan?.installment?.id"
        class="treatment-plan-status__icon"
        :class="
          treatmentPlan.financialFiles?.length || treatmentPlan.hasConfirmedTreatmentPlanFinancial
            ? 'text-positive'
            : 'text-grey-6'
        "
        size="24"
      />
      <QTooltip class="text-subtitle2 bg-black text-white">
        {{
          treatmentPlan.financialFiles?.length
            ? `دارای ${treatmentPlan.financialFiles?.length} مدرک مالی`
            : treatmentPlan.hasConfirmedTreatmentPlanFinancial
              ? 'دارای مدارک مالی'
              : ' بدون مدرک مالی'
        }}
      </QTooltip>
    </div>
    <div>
      <IconCoin class="treatment-plan-status__icon" :class="prepayStatus?.colorClass" size="24" />
      <QTooltip class="text-subtitle2 bg-black text-white">
        {{ prepayStatus?.title }}
      </QTooltip>
    </div>
    <div>
      <IconMicrophone
        v-if="treatmentPlan.voices?.length"
        class="treatment-plan-status__icon"
        :class="voiceStatus.colorClass"
        size="24"
      />
      <QTooltip class="text-subtitle2 bg-black text-white">
        {{ voiceStatus.tooltip }}
      </QTooltip>
    </div>
    <div v-if="treatmentPlan.userIsBeta">
      <IconBeta
        class="treatment-plan-status__icon"
        :class="treatmentPlan.userIsBeta ? 'text-positive' : 'text-info'"
        size="24"
      />
      <QTooltip class="bg-black text-white text-caption">
        بتا ({{ getBranchLabel(treatmentPlan.userBeta?.branch?.id) }})
      </QTooltip>
    </div>
    <div v-if="stepStatus">
      <QChip :color="stepStatus.color" text-color="white" size="sm" square>
        {{ stepStatus.label }}
      </QChip>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import {
  IconStethoscope,
  IconTicket,
  IconFileDiff,
  IconCoin,
  IconMicrophone,
  IconBeta,
} from '@tabler/icons-vue'
import { TREATMENT_PLAN_STATUS } from '@/modules/TreatmentPlan/constants/enums'
import { getBranchLabel } from '@/utils/branch-utils'

const props = defineProps({
  treatmentPlan: {
    type: Object,
    default: null,
  },
})

const voiceStatus = computed(() => {
  const count = props.treatmentPlan.voices?.length || 0
  if (count === 0) {
    return {
      tooltip: 'صدایی ندارد',
      colorClass: 'text-grey-6',
    }
  }
  if (count === 1) {
    return {
      tooltip: 'دارای یک صدا',
      colorClass: 'text-info',
    }
  }
  return {
    tooltip: `دارای ${count} صدا`,
    colorClass: 'text-info',
  }
})
const creditStatus = computed(() => {
  switch (props.treatmentPlan.creditStatus) {
    case 1: {
      return {
        text: 'اعتبارسنجی تایید شده',
        colorClass: 'text-positive',
      }
    }
    case 2: {
      return {
        text: 'اعتبارسنجی رد شده',
        colorClass: 'text-negative',
      }
    }
    case 3: {
      return {
        text: 'درحال اعتبارسنجی',
        colorClass: 'text-warning',
      }
    }

    default: {
      return {
        text: 'اعتبار سنجی ندارد',
        colorClass: 'text-grey-6',
      }
    }
  }
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
        colorClass: 'text-warning',
      }
    }
    if (props.treatmentPlan.extraditionAt) {
      return { title: 'عودت داده شده', colorClass: 'text-negative' }
    }
    if (!props.treatmentPlan.extraditionAt && !props.treatmentPlan.prepayAt) {
      return { title: 'بیعانه ندارد', colorClass: 'text-grey-6' }
    }
  }
  return { title: 'بیعانه ندارد', colorClass: 'text-grey-6' }
})
const treatmentPlanStatus = computed(() => {
  switch (props.treatmentPlan.status) {
    case TREATMENT_PLAN_STATUS.PERFORMED: {
      return {
        text: 'طرح درمان فعال',
        colorClass: 'text-positive',
      }
    }
    case TREATMENT_PLAN_STATUS.PROPOSED: {
      return {
        text: 'طرح درمان غیر فعال',
        colorClass: 'text-grey-6',
      }
    }
    case TREATMENT_PLAN_STATUS.COMPLETED: {
      return {
        text: 'طرح درمان پایان یافته',
        colorClass: 'text-negative',
      }
    }
    default: {
      return {
        text: 'طرح درمان غیر فعال',
        colorClass: 'text-grey-6',
      }
    }
  }
})

const stepStatus = computed(() => {
  if (props.treatmentPlan.isPerformed) {
    return {
      label: 'شرح درمان',
      color: 'positive',
    }
  }
  if (props.treatmentPlan.isProposed) {
    return {
      label: 'طرح درمان',
      color: 'positive',
    }
  }
  if (props.treatmentPlan.isDraft) {
    return {
      label: 'پیش نویس',
      color: 'warning',
    }
  }
  return null
})
</script>

<style scoped lang="scss">
.treatment-plan-status {
  display: flex;
  align-items: end;
  text-align: center;
  justify-content: center;

  &__icon {
    margin-left: 12px;
  }
  .text-primary {
    color: #{$primary} !important;
  }
}
</style>
