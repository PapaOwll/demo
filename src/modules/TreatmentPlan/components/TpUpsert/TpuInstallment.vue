<template>
  <QCard v-if="finalPrice" flat bordered>
    <QCardSection>
      <QTable
        :rows="showableItems"
        :columns="columns"
        row-key="id"
        flat
        class="quasar-table"
        :rows-per-page-options="[0]"
        hide-pagination
      >
        <template #body-cell-month="props">
          <QTd :props="props">
            <Badge
              variant="light"
              :color="
                props.row?.id === selectedInstallment?.id && isPerformed ? 'light-blue' : 'dark'
              "
            >
              {{ `${props.row.month} ماهه` }}
            </Badge>
          </QTd>
        </template>

        <template #body-cell-percentage="props">
          <QTd :props="props">
            <Typography variant="body" size="2" weight="semibold">
              {{ `${props.row.percentage} %` }}
            </Typography>
          </QTd>
        </template>

        <template #body-cell-actions="props">
          <QTd :props="props">
            <template v-if="!isPerformed">
              <Button
                v-if="props.row?.id !== selectedInstallment?.id"
                variant="flat"
                color="light-blue"
                size="sm"
                text="انتخاب"
                @click="onSelectInstallment(props.row)"
              />
              <Chip v-else variant="filled" :removable="false" text="انتخاب شده" />
            </template>
          </QTd>
        </template>
      </QTable>
    </QCardSection>
  </QCard>
</template>

<script setup>
import { computed } from 'vue'
import { roundBy } from '@/utils/round'
import { useGetInstallmentQuery } from '../../query'
import { numberSeparator } from '@/utils/formatter'
import { useTpProvider } from '../../composables/use-tp-provider'
import { calculatePrePayAmount, calculatePriceWithBenefit } from '../../utils/installment'
import {
  useTpPricing,
  ROUNDING_PRECISION,
} from '@/modules/TreatmentPlan/composables/use-tp-pricing'
import { getSelectedTeethAndServices } from '@/modules/TreatmentPlan/utils/teeth'
import { useTpStatus } from '@/modules/TreatmentPlan/composables/use-tp-status'
import Typography from '@/base/Typography'
import Badge from '@/base/Badge'
import Button from '@/base/Button'
import Chip from '@/base/Chip'

const {
  isNewCalculationDate: isNewDate,
  treatmentData,
  serveData: serveItems,
  updateSelectedInstallment: updateInstallment,
} = useTpProvider([
  'isNewCalculationDate',
  'treatmentData',
  'serveData',
  'updateSelectedInstallment',
])
const selectedInstallment = computed(() => treatmentData?.value?.installment)

const isPerformed = computed(() => treatmentData?.value?.isPerformed ?? false)

const { data: installmentData } = useGetInstallmentQuery(true)

const { backendStepNumber } = useTpStatus(treatmentData)

const columns = [
  {
    name: 'month',
    label: 'شرایط اقساط',
    align: 'right',
    field: 'month',
  },
  {
    name: 'percentage',
    label: 'پیش پرداخت (درصد)',
    align: 'right',
    field: 'percentage',
  },
  {
    name: 'prePayAmount',
    label: 'پیش پرداخت (تومان)',
    align: 'right',
    field: 'prePayAmount',
  },
  {
    name: 'monthInstallment',
    label: 'قسط هر ماه',
    align: 'right',
    field: 'monthInstallment',
  },
  {
    name: 'withBenefitPrice',
    label: 'مبلغ نهایی',
    align: 'right',
    field: (row) => numberSeparator(row?.withBenefitPrice || 0),
  },
  {
    name: 'actions',
    label: '',
    align: 'right',
    field: 'actions',
  },
]

const itemList = computed(() =>
  getSelectedTeethAndServices(treatmentData, serveItems, backendStepNumber.value)
)

const { finalPrice, discountPrice, couponPrice, totalPrice } = useTpPricing(itemList, treatmentData)

const showableItems = computed(
  () =>
    installmentData.value?.items
      ?.map((item) => {
        const withBenefitPrice = isNewDate.value
          ? calculatePriceWithBenefit(item?.profit, totalPrice.value) -
            (discountPrice.value + couponPrice.value)
          : calculatePriceWithBenefit(item?.profit, finalPrice.value)
        const prePayAmount = calculatePrePayAmount(
          withBenefitPrice,
          Number(item.percentage),
          item.month
        )
        const monthInstallment = roundBy(
          (withBenefitPrice - prePayAmount) / item.month,
          ROUNDING_PRECISION
        )
        return {
          ...item,
          withBenefitPrice,
          prePayAmount: numberSeparator(prePayAmount),
          monthInstallment: numberSeparator(monthInstallment),
        }
      })
      .filter(
        (item) =>
          item.withBenefitPrice < item?.maxPrepay &&
          item.withBenefitPrice > item?.minPrice &&
          item.isActive
      ) || []
)

const onSelectInstallment = (installment) => {
  selectedInstallment.value?.id !== installment?.id && updateInstallment(installment)
}
</script>
