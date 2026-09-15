<template>
  <div v-if="finalPrice && selectedInstallment && chequeItem.length > 0" class="tpc">
    <div class="tpc__header">
      <h3 class="tpc__title">محاسبه راس چک</h3>
      <div class="tpc__date">
        <div v-if="displayDate" class="tpc__date-display">
          {{ displayDate }}
        </div>
      </div>
    </div>

    <div class="tpc__table-container">
      <QTable
        flat
        bordered
        :rows="chequeItem"
        :columns="columns"
        row-key="count"
        :pagination="{ rowsPerPage: 0 }"
        hide-pagination
        class="quasar-table tpc__table"
      >
        <template #body-cell-dates="props">
          <QTd :props="props">
            <div class="tpc__tags">
              <QChip
                v-for="time in props.row.dates"
                :key="time"
                square
                outline
                color="info"
                text-color="white"
              >
                {{ time }}
              </QChip>
            </div>
          </QTd>
        </template>
      </QTable>
    </div>

    <div class="tpc__cheque-view">
      <TppChequeView v-if="chequeViewData.dates.length > 0" :preview-data="chequeViewData" />
    </div>
  </div>
</template>

<script setup>
import { convertToJalali } from '@/utils/date-utils'
import { roundBy } from '@/utils/round'
import { computed } from 'vue'
import { numberSeparator } from '@/utils/formatter'
import { convertTomanToRialText } from '@/utils/persian-number-to-text'
import { calculatePrePayAmount, calculatePriceWithBenefit } from '../../utils/installment'
import { useBranchInfo } from '../../composables/use-branch-info'
import { useTpProvider } from '../../composables/use-tp-provider'
import TppChequeView from './TppChequeView'
import {
  useTpPricing,
  ROUNDING_PRECISION,
} from '@/modules/TreatmentPlan/composables/use-tp-pricing'

const {
  finalPrice,
  treatmentData,
  isNewCalculationDate: isNewDate,
  newFinalPrice,
} = useTpProvider(['finalPrice', 'treatmentData', 'isNewCalculationDate', 'newFinalPrice'])
const cheques = computed(() => treatmentData?.value?.cheques)
const { payeeName, nationalId } = useBranchInfo(treatmentData)

const columns = [
  {
    name: 'count',
    label: 'تعداد چک',
    field: 'count',
    align: 'center',
  },
  {
    name: 'chequeAmount',
    label: 'مبلغ هر چک',
    field: 'chequeAmount',
    align: 'center',
  },
  {
    name: 'dates',
    label: 'تاریخ هر چک (راس)',
    field: 'dates',
    align: 'center',
  },
  {
    name: 'residual',
    label: 'باقی مانده',
    field: 'residual',
    align: 'center',
  },
]

const selectedInstallment = computed(() => treatmentData?.value?.installment)

const modifiedPrepaymentPercentage = computed(
  () => treatmentData?.value?.prepaymentPercent || selectedInstallment.value?.percentage
)

// Use the shared pricing composable to avoid duplicate logic
const { discountPrice: calculatedDiscountPrice, couponPrice: calculatedCouponPrice } = useTpPricing(
  computed(() => treatmentData?.value?.items || []),
  treatmentData
)

const priceWithBenefit = computed(() => {
  const basePrice = isNewDate.value
    ? calculatePriceWithBenefit(selectedInstallment.value?.profit, newFinalPrice.value)
    : calculatePriceWithBenefit(selectedInstallment.value?.profit, finalPrice.value)

  return basePrice - (calculatedDiscountPrice.value + calculatedCouponPrice.value)
})

const prePayAmount = computed(() =>
  calculatePrePayAmount(
    priceWithBenefit.value,
    modifiedPrepaymentPercentage.value,
    selectedInstallment.value?.month
  )
)

const chequeItem = computed(() => {
  return [
    {
      count: cheques.value.length,
      chequeAmount: numberSeparator(cheques.value[0]?.price || 0),
      residual: numberSeparator(0),
      dates: cheques.value.map((_cheque) => convertToJalali(_cheque.time, 'jYYYY/jMM/jDD')),
    },
  ]
})

const displayDate = computed(() => {
  if (!treatmentData?.value?.startDate) return ''
  return convertToJalali(treatmentData?.value?.startDate, 'jYYYY/jMM/jDD')
})

const monthInstallment = computed(() => {
  const month = selectedInstallment.value?.month || 1
  return roundBy((priceWithBenefit.value - prePayAmount.value) / month, ROUNDING_PRECISION)
})

const chequeViewData = computed(() => {
  const firstChequeRow = chequeItem.value[0] || {}
  const dates = firstChequeRow.dates || []
  const amountNumber = firstChequeRow.chequeAmount || 0
  const prepaymentPercentage = modifiedPrepaymentPercentage.value ?? 0

  return {
    dateNumber: dates[0] || displayDate.value || '',
    amountNumber,
    amountText: convertTomanToRialText(amountNumber),
    payeeName: payeeName.value,
    nationalId: nationalId.value,
    paymentStatus: treatmentData.value?.paymentStatus || 'در انتظار پیش‌پرداخت',
    paymentMethod: `اقساط ${selectedInstallment.value?.month || 0} ماهه`,
    monthlyInstallment: `${numberSeparator(monthInstallment.value)} تومان`,
    monthlyInstallmentEquivalent: `معادل ${convertTomanToRialText(monthInstallment.value / 10)}`,
    prepaymentPercentage: `${prepaymentPercentage} درصد`,
    prepaymentAmount: `${numberSeparator(prePayAmount.value)} تومان`,
    totalAmount: `${numberSeparator(priceWithBenefit.value)} تومان`,
    dates,
  }
})
</script>

<style lang="scss" scoped>
.tpc {
  border-radius: 8px;
  border: 1px solid $grey-4;
  background-color: $white;
  color: $grey-9;
  padding: 24px;
  font-size: 0.875rem;
  margin-top: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid $grey-3;
  }

  &__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: $primary;
  }

  &__date {
    display: flex;
    align-items: center;

    &-display {
      padding: 8px 16px;
      border: 1px solid $primary;
      border-radius: 6px;
      background-color: rgba($primary, 0.05);
      color: $primary;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        background-color: rgba($primary, 0.1);
      }
    }
  }

  &__tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
  }

  &__table-container {
    margin-top: 20px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba($primary, 0.2);
  }

  &__table {
    border-radius: 0;

    :deep(.q-table__top) {
      background-color: rgba($primary, 0.05);
      padding: 12px 16px;
    }

    :deep(.q-table th) {
      font-weight: 600;
      background-color: rgba($primary, 0.1);
      color: $primary;
    }

    :deep(.q-table td) {
      padding: 12px 8px;
    }

    :deep(.q-table tr:nth-child(even)) {
      background-color: rgba($primary, 0.02);
    }
  }

  &__cheque-view {
    margin-top: 24px;
  }

  &__error {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
  }

  @include media-breakpoint-down(sm) {
    padding: 16px;
  }
}
</style>
