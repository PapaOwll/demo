<template>
  <QCard flat bordered class="cheque-view">
    <QCardSection class="cheque-view__header">
      <Typography variant="heading" size="h3">نمونه چک صیادی</Typography>
    </QCardSection>

    <QCardSection class="cheque-view__body">
      <div class="cheque-view__info">
        <QExpansionItem
          v-for="(section, index) in infoSections"
          :key="index"
          group="somegroup"
          class="cheque-view__info-section"
          header-class="cheque-view__section-header"
          :label="section.title"
          :default-opened="index === 0"
        >
          <div class="cheque-view__section-content">
            <template v-if="section.type === 'simple'">
              <div
                v-for="(row, rowIndex) in section.rows"
                :key="rowIndex"
                :class="[
                  'cheque-view__info-row',
                  { 'cheque-view__info-row--highlighted': row.highlighted },
                ]"
              >
                <div class="cheque-view__info-content">
                  <Typography variant="body" size="4" weight="medium">{{ row.value }}</Typography>
                  <Typography variant="caption" class="cheque-view__label">
                    {{ row.label }}
                  </Typography>
                </div>
              </div>
            </template>

            <template v-else-if="section.type === 'financial'">
              <div class="cheque-view__financial-content">
                <template v-for="(row, rowIndex) in section.rows" :key="`fin-${rowIndex}`">
                  <QSeparator v-if="rowIndex != 0" class="cheque-view__separator" />
                  <div class="cheque-view__financial-row">
                    <div v-if="row.subValue" class="cheque-view__financial-value">
                      <Typography variant="body" size="3">{{ row.value }}</Typography>
                      <Typography variant="caption" class="cheque-view__sublabel">
                        {{ row.subValue }}
                      </Typography>
                    </div>
                    <Typography v-else variant="body" size="3" :color="row.color || undefined">
                      {{ row.value }}
                    </Typography>
                    <Typography variant="caption" class="cheque-view__label">
                      {{ row.label }}
                    </Typography>
                  </div>
                </template>
              </div>
            </template>
          </div>
        </QExpansionItem>
      </div>

      <div class="cheque-view__visual">
        <div class="cheque-view__slider-container">
          <div class="cheque-view__carousel">
            <div
              class="cheque-view__carousel-track"
              :style="{ transform: `translateX(${carouselOffset}%)` }"
            >
              <div
                v-for="(cheque, index) in cheques"
                :key="index"
                class="cheque-view__carousel-item"
              >
                <ChequePaper
                  :cheque="buildChequePaperData(cheque)"
                  :current-cheque-index="currentChequeIndex"
                  :total-cheques="cheques.length"
                  @next="nextCheque"
                  @prev="prevCheque"
                  @preview="openPreviewModal"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <QDialog v-model="previewModalOpen">
        <QCard class="cheque-view__modal">
          <QCardSection class="cheque-view__modal-header">
            <Typography variant="heading" size="h4">نمونه چک صیادی</Typography>
            <Button
              variant="flat"
              color="dark"
              :is-icon-only="true"
              :left-icon="IconX"
              @click="closePreviewModal"
            />
          </QCardSection>

          <QCardSection class="cheque-view__modal-body">
            <div class="cheque-view__modal-carousel">
              <div
                class="cheque-view__modal-carousel-track"
                :style="{ transform: `translateX(${modalCarouselOffset}%)` }"
              >
                <div
                  v-for="(cheque, index) in cheques"
                  :key="index"
                  class="cheque-view__modal-carousel-item"
                >
                  <ChequePaper
                    :is-modal="true"
                    :cheque="buildChequePaperData(cheque)"
                    :current-cheque-index="modalChequeIndex"
                    :total-cheques="cheques.length"
                    @next="nextModalCheque"
                    @prev="prevModalCheque"
                  />
                </div>
              </div>
            </div>
          </QCardSection>
        </QCard>
      </QDialog>
    </QCardSection>
  </QCard>
</template>

<script setup>
import { computed, ref } from 'vue'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import ChequePaper from './ChequePaper'
import { IconX } from '@tabler/icons-vue'
import { convertNumberToPersianText } from '@/utils/persian-number-to-text'

const persianMonths = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

const props = defineProps({
  previewData: {
    type: Object,
    default: () => ({
      dateNumber: '',
      amountNumber: '',
      amountText: '',
      payeeName: '',
      nationalId: '',
      paymentStatus: '',
      paymentMethod: '',
      monthlyInstallment: '',
      monthlyInstallmentEquivalent: '',
      prepaymentPercentage: '',
      prepaymentAmount: '',
      totalAmount: '',
      dates: [],
    }),
  },
})

function convertJalaliDateToText(dateString) {
  if (!dateString) return ''

  try {
    const [year, month, day] = dateString.split('/').map((d) => Number.parseInt(d, 10))
    if (!year || !month || !day) return dateString

    const dayText = convertNumberToPersianText(day)
    const monthName = persianMonths[month - 1] || ''
    const yearText = convertNumberToPersianText(year)

    return `${dayText} ${monthName} ${yearText}`
  } catch {
    return dateString
  }
}

const parseDateDigits = (dateString = '') => [...dateString.replace(/[./]/g, '')]

const isZeroDigit = (digit) => digit === '0' || digit === '۰'

const parseAmountDigits = (amountString = '') => {
  const digits = [...String(amountString).replace(/[,٬]/g, '')]
  while (digits.length < 14) {
    digits.unshift('0')
  }
  digits.push('0')

  const firstNonZero = digits.findIndex((digit) => !isZeroDigit(digit))
  return { digits, firstNonZero: firstNonZero === -1 ? digits.length : firstNonZero }
}

const sourceDates = computed(() => props.previewData?.dates || [])
const amountNumber = computed(() => props.previewData?.amountNumber || '')
const amountText = computed(() => props.previewData?.amountText || '')
const payeeName = computed(() => props.previewData?.payeeName || '')
const nationalId = computed(() => props.previewData?.nationalId || '')

const cheques = computed(() => {
  const { digits: amountDigits, firstNonZero } = parseAmountDigits(amountNumber.value)

  if (sourceDates.value.length > 0) {
    return sourceDates.value.map((dateNumber) => ({
      dateNumber,
      dateText: convertJalaliDateToText(dateNumber),
      amountNumber: amountNumber.value,
      amountText: amountText.value,
      dateDigits: parseDateDigits(dateNumber),
      amountDigits,
      firstNonZero,
    }))
  }

  const dateNumber = props.previewData?.dateNumber || ''
  return [
    {
      dateNumber,
      dateText: convertJalaliDateToText(dateNumber),
      amountNumber: amountNumber.value,
      amountText: amountText.value,
      dateDigits: parseDateDigits(dateNumber),
      amountDigits,
      firstNonZero,
    },
  ]
})

const currentChequeIndex = ref(0)
const modalChequeIndex = ref(0)

const infoSections = computed(() => {
  const currentCheque = cheques.value[currentChequeIndex.value] || {}

  return [
    {
      title: 'اطلاعات چک',
      type: 'simple',
      rows: [
        {
          label: 'تاریخ به عدد',
          value: currentCheque.dateNumber || props.previewData?.dateNumber || '',
          highlighted: true,
        },
        {
          label: 'تاریخ به حروف',
          value: currentCheque.dateText || '',
          highlighted: false,
        },
        {
          label: 'مبلغ به عدد',
          value: currentCheque.amountNumber || amountNumber.value,
          highlighted: true,
        },
        {
          label: 'مبلغ به حروف',
          value: currentCheque.amountText || amountText.value,
          highlighted: false,
        },
        { label: 'در وجه', value: payeeName.value, highlighted: true },
        { label: 'به شناسه ملی', value: nationalId.value, highlighted: false },
      ],
    },
    {
      title: 'اطلاعات مالی',
      type: 'financial',
      data: { paymentStatus: props.previewData?.paymentStatus || '' },
      rows: [
        { label: 'شیوه پرداخت', value: props.previewData?.paymentMethod || '' },
        {
          label: 'قسط هر ماه',
          value: props.previewData?.monthlyInstallment || '',
        },
        { label: 'پیش پرداخت (درصد)', value: props.previewData?.prepaymentPercentage || '' },
        { label: 'مبلغ پیش پرداخت', value: props.previewData?.prepaymentAmount || '' },
        {
          label: 'مبلغ کل خدمات',
          value: props.previewData?.totalAmount || '',
          color: 'light-blue',
        },
      ],
    },
  ]
})

const carouselOffset = computed(() => -currentChequeIndex.value * 100)
const modalCarouselOffset = computed(() => -modalChequeIndex.value * 100)

const buildChequePaperData = (cheque) => ({
  ...cheque,
  payeeName: payeeName.value,
  nationalId: nationalId.value,
})

const nextCheque = () => {
  if (currentChequeIndex.value < cheques.value.length - 1) {
    currentChequeIndex.value += 1
  }
}

const prevCheque = () => {
  if (currentChequeIndex.value > 0) {
    currentChequeIndex.value -= 1
  }
}

const nextModalCheque = () => {
  if (modalChequeIndex.value < cheques.value.length - 1) {
    modalChequeIndex.value += 1
  }
}

const prevModalCheque = () => {
  if (modalChequeIndex.value > 0) {
    modalChequeIndex.value -= 1
  }
}

const previewModalOpen = ref(false)

const openPreviewModal = () => {
  modalChequeIndex.value = currentChequeIndex.value
  previewModalOpen.value = true
}

const closePreviewModal = () => {
  previewModalOpen.value = false
}
</script>

<style scoped lang="scss">
.cheque-view {
  border-radius: $spacing-md;
  box-shadow: 2px 2px 4px 1px rgba(0, 0, 0, 0.05);
  background: $white;

  &__header {
    padding: $spacing-xl $spacing-xl 0;
  }

  &__body {
    display: flex;
    flex-direction: row-reverse;
    gap: 28px;
    padding: $spacing-lg $spacing-xl $spacing-xl;

    @media (max-width: $breakpoint-md-max) {
      flex-direction: column;
      gap: $spacing-lg;
    }
  }

  &__info {
    width: 399px;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
    flex-shrink: 0;

    @media (max-width: $breakpoint-md-max) {
      width: 100%;
      max-width: none;
    }
  }

  &__info-section {
    border: 1px solid $grey-4;
    border-radius: $spacing-sm;
    gap: $spacing-md;
  }

  &__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 70px;
    color: $dark;
  }

  &__info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-sm $spacing-sm;
    border-radius: $spacing-xs;

    &--highlighted {
      background: #faf5fb;
    }
  }

  &__info-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $spacing-md;
    width: 100%;
    flex-direction: row-reverse;
  }

  &__label {
    color: $grey-7;
  }

  &__sublabel {
    color: $grey-7;
    font-size: $spacing-md;
  }

  &__financial-content {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
    padding: $spacing-sm $spacing-sm;
  }

  &__status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md;
    background: #f5f5f5;
    border-radius: $spacing-sm;
    flex-direction: row-reverse;
  }

  &__status-badge {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__financial-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row-reverse;
  }

  &__separator {
    background: $grey-4;
    border-style: dashed;
    border-width: 1.5px;
  }

  &__visual {
    flex: 1;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    overflow-x: auto;
    overflow-y: visible;
    min-width: 0;
    -webkit-overflow-scrolling: touch;

    @media (max-width: $breakpoint-md-max) {
      padding: 0;
    }
  }

  &__slider-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-lg;
    width: 100%;
    max-width: 950px;
    position: relative;
  }

  &__carousel {
    width: 100%;
    max-width: 950px;
    overflow: hidden;
    position: relative;
  }

  &__carousel-track {
    display: flex;
    transition: transform 0.3s ease-in-out;
    direction: ltr;
  }

  &__carousel-item {
    flex-shrink: 0;
    width: 100%;
    direction: rtl;
  }

  &__modal {
    width: 95vw !important;
    max-width: 950px !important;

    @media (max-width: $breakpoint-md-max) {
      width: 100vw !important;
      max-width: none !important;
      border-radius: 0 !important;
    }
  }

  &__modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-lg $spacing-xl;
    background: $white;
    border-radius: $spacing-md $spacing-md 0 0;
  }

  &__modal-body {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: $spacing-xl;
    overflow-x: auto;
  }

  &__modal-carousel {
    width: 100%;
    max-width: 900px;
    overflow: hidden;
  }

  &__modal-carousel-track {
    display: flex;
    transition: transform 0.3s ease-in-out;
    direction: ltr;
  }

  &__modal-carousel-item {
    flex-shrink: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    direction: rtl;
  }
}
</style>
