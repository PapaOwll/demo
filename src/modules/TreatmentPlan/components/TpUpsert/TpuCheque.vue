<template>
  <div v-if="shouldShowCalculator" class="tpc">
    <div class="tpc__top">
      <Typography variant="heading" size="h6">محاسبه راس چک</Typography>
      <div class="tpc__date">
        <QInput
          :model-value="displayDate"
          label="تاریخ شروع"
          placeholder="انتخاب تاریخ"
          outlined
          dense
          readonly
          :disable="isPerformed"
          :class="['tpc__date-input', { 'cursor-pointer': !isPerformed }]"
        >
          <template #append>
            <QIcon name="event" class="cursor-pointer" />
          </template>
          <QPopupProxy cover transition-show="scale" transition-hide="scale">
            <QDate
              v-model="persianDateValue"
              mask="jYYYY/jMM/jDD"
              locale="fa"
              calendar="persian"
              today-btn
              @update:model-value="handleDateChange"
            >
              <div class="row items-center justify-end q-pt-sm">
                <Button v-close-popup variant="flat" color="primary" size="sm" text="بستن" />
              </div>
            </QDate>
          </QPopupProxy>
        </QInput>
      </div>
    </div>

    <div class="tpc__installment">
      <div class="tpc__installment-item">
        <Typography variant="caption" class="tpc__installment-label">شیوه پرداخت</Typography>
        <Typography variant="body" size="3" weight="bold" class="tpc__installment-content">
          {{ `اقساط ${selectedInstallment?.month} ماهه` }}
        </Typography>
      </div>

      <div class="tpc__installment-item">
        <Typography variant="caption" class="tpc__installment-label">پیش پرداخت (درصد)</Typography>
        <div class="tpc__installment-content">
          <template v-if="!isEditingInstallment">
            <Typography variant="body" size="3" weight="bold">
              {{ `${prepaymentPercentage} %` }}
            </Typography>
            <Button
              v-if="!isPerformed"
              variant="flat"
              color="light-blue"
              size="sm"
              text="تغییر"
              @click="setEditInstallment"
            />
          </template>
          <div v-else class="tpc__installment-edit">
            <NumberField
              :model-value="prepaymentPercentage"
              variant="outline"
              @update:model-value="handlePrepaymentChange"
            />
            <Button
              variant="flat"
              size="sm"
              color="primary"
              text="ثبت"
              @click="hideEditInstallment"
            />
          </div>
        </div>
      </div>

      <div class="tpc__installment-item">
        <Typography variant="caption" class="tpc__installment-label">مبلغ پیش پرداخت</Typography>
        <Typography variant="body" size="3" weight="bold" class="tpc__installment-content">
          {{ `${numberSeparator(prePayAmount)} تومان` }}
        </Typography>
      </div>

      <div class="tpc__installment-item">
        <Typography variant="caption" class="tpc__installment-label">قسط هر ماه</Typography>
        <div class="tpc__installment-content">
          <Typography variant="body" size="3" weight="bold">
            {{ `${numberSeparator(monthInstallment)} تومان` }}
          </Typography>
          <Typography variant="caption" class="tpc__installment-subtext" color="grey">
            {{ convertTomanToRialText(monthInstallment) }}
          </Typography>
        </div>
      </div>

      <div class="tpc__installment-item">
        <Typography variant="caption" class="tpc__installment-label">مبلغ نهایی</Typography>
        <Typography variant="body" size="3" weight="bold" class="tpc__installment-content">
          {{ `${numberSeparator(costWithProfit)} تومان` }}
        </Typography>
      </div>
    </div>

    <QTable
      :rows="chequeList"
      :columns="columns"
      row-key="count"
      :rows-per-page-options="[0]"
      flat
      class="quasar-table tpc__table"
    >
      <template #body-cell-count="props">
        <QTd :props="props">
          <Badge
            variant="light"
            :color="isPerformed && chequeCount === props.row.count ? 'light-blue' : 'dark'"
            :label="props.row.count"
          />
        </QTd>
      </template>
      <template #body-cell-dates="props">
        <QTd :props="props">
          <div class="tpc__tags">
            <Chip
              v-for="time in props.row.dates"
              :key="time"
              variant="outline"
              :text="time"
              :removable="false"
              color="dark"
            />
          </div>
        </QTd>
      </template>
      <template #body-cell-actions="props">
        <QTd :props="props">
          <Button
            v-if="props.row.count !== chequeCount"
            variant="flat"
            color="info"
            text="انتخاب"
            @click="onSelectCheque(props.row)"
          />
          <Chip v-else variant="filled" text="انتخاب شده" :removable="false" />
        </QTd>
      </template>
    </QTable>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  convertToJalali,
  convertToGregorian,
  formatDate,
  subtractFromDate,
} from '@/utils/date-utils'
import { roundBy } from '@/utils/round'
import { numberSeparator } from '@/utils/formatter'
import { convertTomanToRialText } from '@/utils/persian-number-to-text'
import { getSelectedTeethAndServices } from '@/modules/TreatmentPlan/utils/teeth'
import useDisclosure from '@/composables/use-disclosure'
import { useGetTreatmentPlanByIdQuery, useCalculateChequesQuery } from '../../query'
import { useTpStatus } from '@/modules/TreatmentPlan/composables/use-tp-status'
import {
  useTpPricing,
  ROUNDING_PRECISION,
} from '@/modules/TreatmentPlan/composables/use-tp-pricing'
import { useTpProvider } from '../../composables/use-tp-provider'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import Badge from '@/base/Badge'
import Chip from '@/base/Chip'
import NumberField from '@/components/Form/NumberField'

const route = useRoute()

const {
  treatmentData,
  selectedCheque,
  updateSelectedCheque,
  isNewCalculationDate: isNewDate,
  updateTreatment,
  serveData: serveItems,
} = useTpProvider([
  'treatmentData',
  'selectedCheque',
  'updateSelectedCheque',
  'isNewCalculationDate',
  'updateTreatment',
  'serveData',
])

const calculationStartDate = ref(null)
const [isEditingInstallment, { open: setEditInstallment, close: hideEditInstallment }] =
  useDisclosure()

const { isSuccess: isTreatmentPlanLoaded } = useGetTreatmentPlanByIdQuery(route.params?.id)

const selectedInstallment = computed(() => treatmentData.value?.installment)

const prepaymentPercentage = computed(
  () => treatmentData.value?.prepaymentPercent ?? selectedInstallment.value?.percentage
)
const { backendStepNumber } = useTpStatus(treatmentData)

const itemList = computed(() =>
  getSelectedTeethAndServices(treatmentData, serveItems, backendStepNumber.value)
)

const { couponPrice, newFinalPrice, finalPrice, totalPrice } = useTpPricing(itemList, treatmentData)

const basePrice = computed(() => (isNewDate.value ? newFinalPrice.value : finalPrice.value))

const effectiveStartDate = computed(
  () =>
    treatmentData.value?.startDate ||
    calculationStartDate.value ||
    formatDate(new Date(), 'YYYY/MM/DD')
)

const updateStartDate = (date) => {
  updateTreatment({ startDate: date })
  calculationStartDate.value = date
}

const handleDateChange = (value) =>
  value && updateStartDate(convertToGregorian(value, 'YYYY/MM/DD'))

const handlePrepaymentChange = (value) => {
  updateTreatment({ prepaymentPercent: Math.min(value, 99) })
}

const chequeQueryParams = computed(() => ({
  installmentId: selectedInstallment.value?.id,
  amount: basePrice.value,
  startDate: effectiveStartDate.value,
  prepaymentPercent: prepaymentPercentage.value,
  totalAmount: totalPrice.value,
  couponDiscount: couponPrice.value,
  discount: treatmentData.value?.discountData?.value || 0,
  discountType: treatmentData.value?.discountData?.type || 'amount',
  prepay: treatmentData.value?.prepay || 0,
  treatmentplanId: route.params?.id,
  isTreatmentPlanLoaded: isTreatmentPlanLoaded.value,
}))

const { data: chequeCalculationData } = useCalculateChequesQuery(chequeQueryParams)

const costWithProfit = computed(() => chequeCalculationData.value?.costWithProfit ?? 0)
const prePayAmount = computed(
  () =>
    selectedCheque.value?.prepaymentAmount ??
    chequeCalculationData.value?.chequeOptions?.[0]?.prepaymentAmount ??
    0
)

const monthInstallment = computed(() => {
  const month = selectedInstallment.value?.month
  if (!month || !costWithProfit.value) return 0
  return roundBy((costWithProfit.value - prePayAmount.value) / month, ROUNDING_PRECISION)
})

const chequeList = computed(() =>
  (chequeCalculationData.value?.chequeOptions ?? []).map((option) => ({
    count: option.count,
    chequeAmount: numberSeparator(option.chequeAmount),
    residual: option.residualAmount > 0 ? numberSeparator(option.residualAmount) : 0,
    dates: option.dates,
    prepaymentAmount: option.prepaymentAmount,
  }))
)

const chequeCount = computed(
  () => selectedCheque.value?.count || treatmentData.value?.cheques?.length || 0
)

const persianDateValue = computed({
  get: () =>
    effectiveStartDate.value ? convertToJalali(effectiveStartDate.value, 'jYYYY/jMM/jDD') : '',
  set: (value) => value && updateStartDate(convertToGregorian(value, 'YYYY/MM/DD')),
})

const displayDate = computed(() =>
  effectiveStartDate.value ? convertToJalali(effectiveStartDate.value, 'jYYYY/jMM/jDD') : ''
)

const shouldShowCalculator = computed(() => finalPrice.value && selectedInstallment.value)

const isPerformed = computed(() => treatmentData.value?.isPerformed ?? false)

const columns = computed(() => {
  const baseColumns = [
    { name: 'count', label: 'تعداد چک', field: 'count', align: 'center' },
    { name: 'chequeAmount', label: 'مبلغ هر چک', field: 'chequeAmount', align: 'center' },
    { name: 'dates', label: 'تاریخ هر چک (راس)', field: 'dates', align: 'center' },
    { name: 'residual', label: 'باقی مانده', field: 'residual', align: 'center' },
  ]
  if (!isPerformed.value) {
    baseColumns.push({ name: 'actions', label: '', field: '', align: 'center' })
  }
  return baseColumns
})

const onSelectCheque = (cheque) => updateSelectedCheque(cheque)

const estimateStartDateFromCheques = () => {
  const cheques = treatmentData.value?.cheques
  if (!cheques?.[0]) return

  const installmentMonth = selectedInstallment.value?.month
  if (!chequeCount.value || !installmentMonth) return

  const monthDiff = installmentMonth / (2 * chequeCount.value)
  const integerMonth = Math.floor(monthDiff)
  const residualDays = Math.round((monthDiff % 1) * 30)

  const chequeTime = new Date(cheques[0].time)
  const estimatedStartDay = subtractFromDate(
    subtractFromDate(chequeTime, 20 + residualDays, 'days'),
    integerMonth,
    'months'
  )

  calculationStartDate.value = formatDate(estimatedStartDay, 'YYYY/MM/DD')

  const matchingCheque = chequeList.value.find((el) => el.count === chequeCount.value)
  if (matchingCheque) updateSelectedCheque(matchingCheque)
}

watch(
  () => isTreatmentPlanLoaded.value,
  (isLoaded) => {
    if (isLoaded && chequeList.value.length > 0) {
      estimateStartDateFromCheques()
    }
  }
)

watch(
  () => chequeList.value,
  (list) => {
    if (!selectedCheque.value && treatmentData.value?.cheques?.length && list.length > 0) {
      const matchingCheque = list.find((el) => el.count === chequeCount.value)
      if (matchingCheque) updateSelectedCheque(matchingCheque)
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.tpc {
  border-radius: 4px;
  border: 1px solid $grey-4;
  background-color: $white;
  color: $grey-9;
  padding: 20px;
  font-size: 0.875rem;

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }

  &__date {
    display: flex;
    align-items: center;
    gap: 1rem;

    &-input {
      min-width: 200px;
    }
  }

  &__tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  &__installment {
    margin: 1rem 0;
    padding: 1rem;
    border-top: 1px solid $grey-3;
    border-bottom: 1px solid $grey-3;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    &-label {
      color: $grey-7;
      font-size: 0.75rem;
    }

    &-content {
      color: $grey-9;
      font-size: 0.875rem;
      font-weight: bold;
      text-align: center;
      margin-top: 0.25rem;
    }

    &-subtext {
      color: $grey-6;
      font-size: 0.75rem;
      font-style: italic;
      margin-top: 0.25rem;
    }

    &-edit {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      :deep(.q-field__control) {
        text-align: center;
      }

      & > div {
        width: 70px;
      }
    }
  }

  &__table {
    margin-top: 1rem;
    border: 1px solid $grey-4;
    border-radius: 4px;
  }
}
</style>
