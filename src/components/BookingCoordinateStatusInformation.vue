<template>
  <div class="status-information">
    <div>
      <IconClipboardHeart
        :class="activeTreatmentPlan?.status === 3 ? 'text-positive' : 'text-grey-6'"
      />
      <QTooltip>
        {{ activeTreatmentPlan?.status ? 'طرح درمان فعال است' : 'طرح درمان فعال نیست' }}
      </QTooltip>
    </div>
    <div>
      <IconBooks :class="creditStatus.color" />
      <QTooltip>{{ creditStatus.text }}</QTooltip>
    </div>
    <div>
      <QIcon
        name="folder_open"
        size="20px"
        :color="
          activeTreatmentPlan?.financialFiles?.length ||
          treatmentPlan?.hasConfirmedTreatmentPlanFinancial
            ? 'positive'
            : 'grey-6'
        "
      />
      <QTooltip>
        {{
          activeTreatmentPlan?.financialFiles?.length
            ? `دارای ${activeTreatmentPlan?.financialFiles?.length} مدرک مالی`
            : treatmentPlan?.hasConfirmedTreatmentPlanFinancial
              ? 'دارای مدارک مالی'
              : ' بدون مدرک مالی'
        }}
      </QTooltip>
    </div>
    <div>
      <IconCoin :class="prepayStatus?.color" />
      <QTooltip class="text-white bg-black text-subtitle2">{{ prepayStatus?.title }}</QTooltip>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import { IconClipboardHeart, IconBooks, IconCoin } from '@tabler/icons-vue'
import { generatePriceFormat } from '@/utils/formatter'

const props = defineProps(['treatmentPlan'])

const activeTreatmentPlan = computed(() => props.treatmentPlan?.activeTreatmentPlan)

const creditStatus = computed(() => {
  switch (props.treatmentPlan.creditStatus) {
    case 1: {
      return {
        text: 'اعتبارسنجی تایید شده',
        color: 'text-positive',
      }
    }
    case 2: {
      return {
        text: 'اعتبارسنجی رد شده',
        color: 'text-negative',
      }
    }
    case 3: {
      return {
        text: 'درحال اعتبارسنجی',
        color: 'text-warning',
      }
    }
    default: {
      return {
        text: 'اعتبار سنجی ندارد',
        color: 'text-grey-6',
      }
    }
  }
})

const prepayStatus = computed(() => {
  if (activeTreatmentPlan.value) {
    if (!activeTreatmentPlan.value?.extraditionAt && activeTreatmentPlan.value?.prepayAt) {
      return {
        title: `${generatePriceFormat(activeTreatmentPlan.value?.prepay)} | ${convertToJalaliWithTime(activeTreatmentPlan.value?.prepayAt)}`,
        color: 'text-warning',
      }
    }
    if (activeTreatmentPlan.value?.extraditionAt) {
      return { title: 'عودت داده شده', color: 'text-negative' }
    }
    if (!activeTreatmentPlan.value?.extraditionAt && !activeTreatmentPlan.value?.prepayAt) {
      return { title: 'بیعانه ندارد', color: 'text-grey-6' }
    }
  }
  return { title: 'بیعانه ندارد', color: 'text-grey-6' }
})
</script>

<style lang="scss" scoped>
.status-information {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
</style>
