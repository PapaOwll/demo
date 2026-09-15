<template>
  <div class="cheque-paper__wrapper">
    <div :class="['cheque-paper', { 'cheque-paper--modal': isModal }]">
      <div class="cheque-paper__row1">
        <div class="cheque-paper__date-block">
          <div class="cheque-paper__info-box2" />

          <div class="cheque-paper__date-content">
            <div class="cheque-paper__date-label-row">
              <Typography variant="caption" weight="medium" color="grey">تاریخ</Typography>

              <div class="cheque-paper__date-digits">
                <template v-for="(digit, index) in cheque.dateDigits" :key="`date-${index}`">
                  <div class="cheque-paper__digit-box">{{ digit }}</div>
                </template>
              </div>
            </div>
            <div class="cheque-paper__date-words-row">
              <Typography variant="caption" weight="medium" color="grey">
                تاریخ به تمام حروف
              </Typography>
              <Typography variant="body" size="3" weight="medium">{{ cheque.dateText }}</Typography>
            </div>
          </div>
        </div>

        <div class="cheque-paper__row1-spacer" />

        <div class="cheque-paper__info-boxes">
          <div class="cheque-paper__info-box" />
          <div class="cheque-paper__info-box" />
        </div>
      </div>

      <div class="cheque-paper__row3">
        <Typography variant="caption" weight="medium" color="grey">
          به موجب این چک مبلغ (به حروف)
        </Typography>
        <div class="cheque-paper__amount-words-center">
          <Typography variant="body" size="3" weight="medium">{{ cheque.amountText }}</Typography>
        </div>
        <Typography variant="caption" weight="medium" color="grey">ریال</Typography>
      </div>

      <div class="cheque-paper__row4">
        <Typography variant="caption" weight="medium" color="grey">در وجه</Typography>
        <Typography variant="body" size="3" weight="medium">
          {{ cheque.payeeName }}
        </Typography>
        <Typography variant="caption" weight="medium" color="grey">به شناسه ملی</Typography>
        <Typography variant="body" size="3" weight="medium">{{ cheque.nationalId }}</Typography>
        <Typography variant="caption" weight="medium" color="grey">
          یا به حواله کرد بپردازید.
        </Typography>
      </div>

      <div class="cheque-paper__row5">
        <div class="cheque-paper__signature-block">
          <img
            src="/src/assets/images/cheque/bank-logo.png"
            alt="Signature Logo"
            class="cheque-paper__signature-logo-img"
          />
        </div>

        <div class="cheque-paper__amount-digits-block">
          <Typography variant="caption" weight="medium" color="grey">(مبلغ به عدد) ریال</Typography>
          <div class="cheque-paper__amount-digits">
            <template v-for="(digit, index) in cheque.amountDigits" :key="`amount-${index}`">
              <div
                class="cheque-paper__digit-box cheque-paper__digit-box--amount"
                :class="{
                  'cheque-paper__digit-box--empty':
                    isZeroDigit(digit) && index < cheque.firstNonZero,
                }"
              >
                {{ isZeroDigit(digit) && index < cheque.firstNonZero ? '' : digit }}
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="cheque-paper__bottom-controls">
      <div class="cheque-paper__nav-controls">
        <Button
          variant="flat"
          color="dark"
          :is-icon-only="true"
          :left-icon="IconChevronRight"
          class="cheque-paper__bottom-nav"
          :is-disabled="currentChequeIndex === totalCheques - 1"
          @click="onNext"
        />

        <Button
          variant="flat"
          color="dark"
          :is-icon-only="true"
          :left-icon="IconChevronLeft"
          class="cheque-paper__bottom-nav"
          :is-disabled="currentChequeIndex === 0"
          @click="onPrev"
        />

        <Typography variant="caption" weight="medium" color="grey" class="cheque-paper__counter">
          {{ currentChequeIndex + 1 }} / {{ totalCheques }}
        </Typography>
      </div>

      <Button
        v-if="!isModal"
        variant="outline"
        color="dark"
        :is-icon-only="true"
        :left-icon="IconZoomInArea"
        @click="onPreview"
      />
    </div>
  </div>
</template>

<script setup>
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import { IconChevronLeft, IconChevronRight, IconZoomInArea } from '@tabler/icons-vue'

defineProps({
  isModal: { type: Boolean, default: false },
  cheque: {
    type: Object,
    default: () => ({
      dateDigits: [],
      dateText: '',
      amountText: '',
      payeeName: '',
      nationalId: '',
      amountDigits: [],
      firstNonZero: 0,
    }),
  },
  currentChequeIndex: { type: Number, default: 0 },
  totalCheques: { type: Number, default: 1 },
})

const emit = defineEmits(['next', 'prev', 'preview'])

const onNext = () => {
  emit('next')
}

const onPrev = () => {
  emit('prev')
}

const onPreview = () => {
  emit('preview')
}

const isZeroDigit = (digit) => digit === '0' || digit === '۰'
</script>

<style scoped lang="scss">
.cheque-paper {
  &__wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-lg;
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    @media (max-width: $breakpoint-md-max) {
      align-items: flex-start;
      padding: 0;
    }
  }

  background: $purple-1;
  border-radius: $spacing-sm;
  padding: 14px $spacing-lg;
  width: 740px;
  min-width: 800px;
  height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  min-height: 320px;

  &--modal {
    width: 100%;
    min-width: 800px;
    height: auto;
    max-height: 80vh;
  }

  &__bottom-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0 $spacing-lg;
  }

  &__nav-controls {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__bottom-nav {
    flex-shrink: 0;
  }

  &__counter {
    margin-right: $spacing-sm;
  }

  &__row1 {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__date-block {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: $spacing-sm;
  }

  &__date-content {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__date-label-row {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__date-digits {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    gap: $spacing-xxs;
  }

  &__info-boxes {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
  }

  &__info-box {
    width: 200px;
    height: 16px;
    background: white;
    border-radius: 4px;
  }

  &__info-box2 {
    width: 32px;
    height: 48px;
    background: white;
    border-radius: 4px;
  }

  &__row1-spacer {
    width: 80px;
  }

  &__date-words-row {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__row3 {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__amount-words-center {
    flex: 1;
    text-align: center;
  }

  &__row4 {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__row5 {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }

  &__amount-digits-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }

  &__amount-digits {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    gap: 0;
  }

  &__digit-box {
    width: 22px;
    height: 26px;
    border: 1px solid #bbb;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: map-get($subtitle2, size);
    font-weight: 500;
    color: #222;
    background: rgba(255, 255, 255, 0.65);
    position: relative;

    &--amount {
      width: 26px;
    }

    &--empty::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 1px;
      background: #999;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
    }
  }

  &__signature-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 220px;
    height: 80px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.7);
  }

  &__signature-logo-img {
    height: 150px;
    width: auto;
    object-fit: contain;
    opacity: 0.85;
  }

  &__row6 {
    padding-top: $spacing-sm;
  }

  &__account-row {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: $spacing-xs;
  }

  &__account-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}
</style>
