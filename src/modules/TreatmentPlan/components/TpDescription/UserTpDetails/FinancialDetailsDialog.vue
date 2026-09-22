<template>
  <BaseModal
    :model-value="visible"
    :show-header="false"
    :show-close="false"
    content-class="financial-details-modal-inner"
    transition-show="slide-up"
    transition-hide="slide-down"
    :width="isMobile ? '100%' : '600px'"
    @close="$emit('update:visible', false)"
  >
    <div class="financial-details">
      <div class="financial-details__header">
        <Typography variant="heading" size="h6">جزئیات اطلاعات مالی</Typography>
        <Button
          variant="flat"
          color="grey"
          is-icon-only
          is-rounded
          :left-icon="IconX"
          @click="$emit('update:visible', false)"
        />
      </div>

      <div
        :class="[
          'financial-details__summary ',
          { 'financial-details__summary--debt': debtAmount > 0 },
        ]"
      >
        <div class="financial-details__stats">
          <div class="financial-details__stat">
            <Typography variant="caption" color="$gray-700" weight="500">کیف پول</Typography>
            <Typography variant="body" size="4" weight="bold" color="dark">
              {{ totalBalanceAmount }}
            </Typography>
          </div>

          <div class="financial-details__stat-divider" />

          <div class="financial-details__stat">
            <Typography variant="caption" color="$gray-700" weight="500">خدمات دریافتی</Typography>
            <Typography variant="body" size="4" weight="bold" color="dark">
              {{ generatePriceFormat(creditData?.performedServesPrice) }}
            </Typography>
          </div>

          <div v-if="debtAmount" class="financial-details__stat-divider" />

          <div v-if="debtAmount" class="financial-details__stat">
            <Typography variant="caption" color="$gray-700" weight="500">بدهی</Typography>
            <Badge
              color="red"
              class="q-pa-xs"
              variant="outline"
              :is-rounded="true"
              outline
              rounded
              :label="generatePriceFormat(debtAmount)"
            />
          </div>
        </div>

        <div v-if="treatmentPlan.userIsBeta" class="financial-details__summary-badge">
          <IconBeta size="14" />
          <Typography variant="body" color="dark" size="4">دارای بتا</Typography>
        </div>
      </div>

      <QSeparator class="financial-details__divider" />

      <div class="financial-details__details">
        <Typography
          variant="body"
          weight="bold"
          color="dark"
          class="financial-details__details-title"
        >
          جزئیات اقساط
        </Typography>

        <div class="financial-details__table">
          <div class="financial-details__row">
            <Typography variant="body" size="4" color="grey" class="title" weight="semibold">
              مبلغ طرح درمان
            </Typography>
            <Typography variant="body" size="4" weight="bold" color="dark">
              {{ generatePriceFormat(treatmentPlan.totalCost) }}
            </Typography>
          </div>
          <div class="divider" />
          <div class="financial-details__row">
            <Typography variant="body" size="4" color="grey" class="title" weight="semibold">
              تخفیف طرح درمان
            </Typography>
            <Typography variant="body" size="4" weight="bold" color="dark">
              {{ treatmentPlanDiscountLabel }}
            </Typography>
          </div>
          <div class="divider" />
          <div class="financial-details__row">
            <div>
              <Typography variant="body" size="4" color="dark" class="title">
                شیوه پرداخت
              </Typography>
              <Typography
                v-if="treatmentPlan && treatmentPlan.installment"
                variant="body"
                size="4"
                color="dark"
              >
                {{ treatmentPlan.installment.month }} ماهه - {{ treatmentPlan.cheques.length }} چک
              </Typography>
            </div>
            <Typography
              v-if="treatmentPlan && treatmentPlan.installment"
              variant="body"
              size="4"
              weight="bold"
              color="dark"
            >
              {{ generatePriceFormat(treatmentPlan.installmentPrice) }}
            </Typography>
          </div>
          <div class="divider" />
          <div class="financial-details__row">
            <div>
              <Typography variant="body" size="4" color="dark" class="title">پیش پرداخت</Typography>
              <Typography variant="body" size="4" color="dark">
                {{ treatmentPlan.prepaymentPercent }} درصد
              </Typography>
            </div>
            <Typography variant="body" size="4" weight="bold" color="dark">
              {{ generatePriceFormat(treatmentPlan.prepayment) }}
            </Typography>
          </div>
          <div class="divider" />
          <div class="financial-details__row">
            <div>
              <Typography variant="body" size="4" color="dark" class="title">
                میزان تخفیف
              </Typography>
              <Typography variant="body" size="4" color="dark">کد تخفیف</Typography>
            </div>
            <div v-if="!isEditingDiscount">
              <Typography variant="body" size="4" weight="bold" color="dark">
                {{ discountLabel }}
              </Typography>
              <Typography variant="body" size="4" weight="bold" color="dark">
                {{
                  treatmentPlan.couponDiscount
                    ? generatePriceFormat(treatmentPlan.couponDiscount) +
                      ` ${treatmentPlan.coupon ? ' - ' + treatmentPlan.coupon.code : ''}`
                    : 'ندارد'
                }}
              </Typography>
            </div>
            <div v-else class="financial-details__discount-edit">
              <CurrencyField
                v-model="discountAmount"
                label="مبلغ تخفیف"
                outlined
                dense
                dir="ltr"
                suffix="ریال"
                :min="10000"
                :max="999999999999"
                placeholder=""
                :error="!!discountError"
                :error-message="discountError"
              />
              <Typography
                v-if="!!discountAmountText"
                variant="caption"
                color="grey"
                class="financial-details__discount-hint"
              >
                {{ discountAmountText || 'مبلغ به تومان' }}
              </Typography>
              <div class="financial-details__discount-actions">
                <Button
                  text="ثبت"
                  :is-loading="isDiscountSubmitting"
                  :is-disabled="!isValidDiscount"
                  @click="submitDiscount"
                />
                <Button
                  variant="flat"
                  text="انصراف"
                  :is-disabled="isDiscountSubmitting"
                  @click="closeDiscountEdit"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        v-if="!isEditingDiscount"
        text="افزودن تخفیف"
        :left-icon="IconPlus"
        @click="openDiscountEdit"
      />
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, ref } from 'vue'
import { QSeparator } from 'quasar'
import { useQueryClient } from '@tanstack/vue-query'
import { IconX, IconBeta, IconPlus } from '@tabler/icons-vue'
import BaseModal from '@/base/Modal'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import Badge from '@/base/Badge'
import CurrencyField from '@/components/Form/CurrencyField'
import { generatePriceFormat } from '@/utils/formatter'
import { convertRialToTomanText } from '@/utils/persian-number-to-text'
import { useIsMobile } from '@/composables/use-is-mobile'
import { useCreateFinancialDiscountMutation } from '@/modules/TreatmentPlan/query'
import { Notif } from '@/data/services/notification-service'
import { handleError } from '@/utils/error-handler'

defineEmits(['update:visible'])

const isMobile = useIsMobile()

const props = defineProps({
  visible: Boolean,
  creditData: { type: Object, default: () => ({}) },
  treatmentPlan: { type: Object, default: () => ({}) },
  totalCost: { type: Number, default: 0 },
  treatmentPlanId: { type: [Number, String], default: null },
})
const totalBalanceAmount = computed(() =>
  props.creditData?.credit < 0
    ? generatePriceFormat(Math.abs(props.creditData?.credit), '-')
    : generatePriceFormat(props.creditData.credit)
)
const debtAmount = computed(() =>
  props.creditData?.balance < 0 ? Math.abs(props.creditData.balance) : 0
)
const treatmentPlanDiscountLabel = computed(() =>
  generatePriceFormat(
    props.creditData?.treatmentPlanDiscount?.total ??
      props.creditData?.treatmentplanDiscount?.total ??
      0
  )
)
const discountLabel = computed(() => {
  const discount = props.creditData?.discount
  if (discount?.total) return generatePriceFormat(discount.total)
  return generatePriceFormat(discount?.fixed ?? 0)
})

const queryClient = useQueryClient()
const isEditingDiscount = ref(false)
const discountAmount = ref(null)
const { mutate: createDiscount, isPending: isDiscountSubmitting } =
  useCreateFinancialDiscountMutation()

const discountError = computed(() => {
  if (discountAmount.value === null || discountAmount.value === '') {
    return 'مبلغ تخفیف را وارد کنید'
  }
  if (discountAmount.value < 10_000) {
    return 'حداقل مبلغ تخفیف ۱۰,۰۰۰ ریال است'
  }
  return null
})

const isValidDiscount = computed(() => !discountError.value)

const discountAmountText = computed(() => convertRialToTomanText(discountAmount.value))

const openDiscountEdit = () => {
  discountAmount.value = null
  isEditingDiscount.value = true
}

const closeDiscountEdit = () => {
  isEditingDiscount.value = false
}

const submitDiscount = () => {
  if (!isValidDiscount.value) return
  createDiscount(
    { amount: Number(discountAmount.value), treatmentplanId: props.treatmentPlanId },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['treatment-plan', 'total-credit'] })
        Notif.success('تخفیف با موفقیت ثبت شد')
        closeDiscountEdit()
      },
      onError: (e) => handleError(e),
    }
  )
}
</script>

<style lang="scss" scoped>
.financial-details {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__summary {
    background: #fff;
    border-radius: $radius-md;
    padding: $spacing-lg;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
    border: 1px solid $grey-3;
    transition:
      background-color 0.3s,
      border-color 0.3s;

    &--debt {
      background: $red-1;
      border-color: #{$red-6};
    }
  }

  &__summary-badge {
    border-radius: $radius-2xl;
    background-color: rgba($dark-5, $opacity-light);
    color: $dark-5;
    padding: $spacing-xxs $spacing-sm;
    font-size: $spacing-sm + $spacing-xs;
    font-weight: 500;
    display: flex;
    align-items: center;
  }

  &__stats {
    display: flex;
    align-items: center;
    flex: 1;
    justify-content: start;
  }

  &__stat {
    padding: 0 $spacing-md;
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: $spacing-xs;
    white-space: nowrap;
  }

  &__stat-divider {
    width: 1px;
    height: $spacing-xl;
    background: $default-disabled-border;
  }

  &__divider {
    margin: 0 $spacing-md;
  }

  &__details {
    padding: $spacing-md 0;
  }

  &__details-title {
    margin-bottom: $spacing-md;
  }
  &__table {
    border: 1px solid #{$grey-2};
    border-radius: $radius-md;
  }
  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-sm $spacing-lg;

    @include media-breakpoint-down(sm) {
      padding: $spacing-sm $spacing-md;
    }
  }

  &__discount-edit {
    flex: 1 1 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-xs;
    margin-top: $spacing-sm;
    background: $grey-1;
    border: 1px solid $grey-3;
    border-radius: $radius-md;
    padding: $spacing-md;
  }

  &__discount-hint {
    color: $grey-6 !important;
  }

  &__discount-actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
    margin-top: $spacing-xs;
    padding-top: $spacing-sm;
    border-top: 1px solid $grey-3;
  }
}

@include media-breakpoint-down(sm) {
  .financial-details {
    &__summary {
      flex-direction: column;
      align-items: flex-start;
      padding: $spacing-md;
    }

    &__stats {
      flex-wrap: wrap;
      row-gap: $spacing-sm;
    }

    &__stat {
      padding: 0;
      flex: 1 1 45%;
      white-space: normal;
    }

    &__stat-divider {
      display: none;
    }
  }
}
.title {
  color: $grey-8 !important;
}

.divider {
  border: 1px solid #{$grey-3};
}
</style>
