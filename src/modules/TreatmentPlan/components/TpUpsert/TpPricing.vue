<template>
  <div>
    <div class="tpp">
      <TpuCreditBalance
        v-if="hasFinancialPerms()"
        :item-list="itemList"
        :final-price-with-benefit="finalPriceWithBenefit"
      />
      <div v-if="mode === TREATMENT_PLAN_MODE.CREATE">
        <TpVisitType />
      </div>
      <TpuBookingsList
        v-if="
          currentStepNumber === TREATMENT_PLAN_STEP.PERFORMED &&
          mode !== TREATMENT_PLAN_MODE.DRAFT &&
          isBranchHasTpPerform
        "
      />
      <TpuServicesListEdit
        :item-list="itemList"
        :calculate-item-price="calculateItemPrice"
        :is-edit="
          currentStepNumber === TREATMENT_PLAN_STEP.PERFORMED &&
          mode !== TREATMENT_PLAN_MODE.DRAFT &&
          mode !== TREATMENT_PLAN_MODE.CREATE &&
          isBranchHasTpPerform
        "
        :show-price="
          mode !== TREATMENT_PLAN_MODE.CREATE &&
          mode !== TREATMENT_PLAN_MODE.DRAFT &&
          hasFinancialPerms()
        "
        :is-expandable="false"
      />

      <div v-if="mode !== TREATMENT_PLAN_MODE.DRAFT">
        <TpuPrepay :is-edit-mode="props.isEditMode" />
      </div>
      <div v-if="mode !== TREATMENT_PLAN_MODE.DRAFT">
        <TpuDiscount :is-edit-mode="props.isEditMode" :item-list="itemList" />
      </div>
      <div>
        <TpPublicDescription />
      </div>
      <div>
        <TpVoiceRecord v-if="mode !== TREATMENT_PLAN_MODE.CREATE" />
      </div>
      <TpdDisease
        v-if="mode === TREATMENT_PLAN_MODE.CREATE || mode === TREATMENT_PLAN_MODE.DRAFT"
        :is-edit-mode="props.isEditMode"
      />
      <QCard
        v-if="
          mode !== TREATMENT_PLAN_MODE.CREATE &&
          mode !== TREATMENT_PLAN_MODE.DRAFT &&
          hasFinancialPerms()
        "
        flat
        bordered
        class="tpp__pricing"
      >
        <QCardSection class="tpp__pricing">
          <div class="tpp__pricing-total">
            <span>مجموع هزینه‌ها</span>
            <div>
              <AnimatedNumber :number="totalPrice" />

              تومان
            </div>
          </div>
          <div v-if="discountPrice" class="tpp__pricing-discount">
            <div>
              <span>تخفیف</span>
            </div>
            <div>
              <AnimatedNumber :number="discountPrice" />
              تومان
            </div>
          </div>
          <div v-if="couponPrice" class="tpp__pricing-discount">
            <div>
              <span>کد تخفیف</span>
            </div>
            <div>
              <AnimatedNumber :number="couponPrice" />
              تومان
            </div>
          </div>
          <div class="tpp__pricing-final">
            <span>مبلغ نهایی</span>

            <div>
              <AnimatedNumber :number="isNewDate ? newFinalPrice : finalPriceWithBenefit" />

              تومان
            </div>
          </div>
        </QCardSection>
      </QCard>
      <TpuActions
        v-if="
          mode !== TREATMENT_PLAN_MODE.DRAFT &&
          mode !== TREATMENT_PLAN_MODE.CREATE &&
          canEditTreatmentPlan(treatmentData)
        "
        :item-list="itemList"
        :is-edit-mode="props.isEditMode"
      />
      <TpuPerformBtn
        v-if="
          currentStepNumber === TREATMENT_PLAN_STEP.PERFORMED &&
          canPerformTreatmentPlan() &&
          isActive
        "
        :item-list="itemList"
      />
      <TpuActivation
        v-if="showActivation && mode !== TREATMENT_PLAN_MODE.DRAFT"
        :is-edit-mode="props.isEditMode"
      />
    </div>
  </div>
</template>

<script setup>
import TpuPrepay from './TpuPrepay'
import { computed, watch } from 'vue'
import AnimatedNumber from '@/components/AnimatedNumber'
import TpuActions from './TpuActions'
import TpuPerformBtn from './TpuPerformBtn'
import TpuDiscount from './TpuDiscount'
import TpuCreditBalance from './TpuCreditBalance'
import { getSelectedTeethAndServices } from '../../utils/teeth'
import TpuActivation from './TpuActivation'
import { useTpProvider } from '../../composables/use-tp-provider'

import TpdDisease from './TpdDisease'
import TpuServicesListEdit from './TpuServicesListEdit'
import TpuBookingsList from './TpuBookingsList'
import TpPublicDescription from './TpPublicDescription'
import TpVoiceRecord from './TpVoiceRecord'
import { useTpPricing } from '@/modules/TreatmentPlan/composables/use-tp-pricing'
import { calculateItemPrice } from '../../utils/pricing'
import { useTpPermissions } from '../../composables/use-tp-permissions'
import { useBranchTpPerform } from '../../composables/use-branch-tp-perform'
import { useTpStatus } from '../../composables/use-tp-status'
import { TREATMENT_PLAN_STEP, TREATMENT_PLAN_MODE } from '../../constants/enums'
import TpVisitType from './TpVisitType'

const props = defineProps({
  isEditMode: {
    type: Boolean,
    default: true,
  },
  canEditServices: {
    type: Boolean,
    default: false,
  },
})

const {
  treatmentData,
  serveData: serveItems,
  updateFinalPrice,
  updateNewFinalPrice,
  isNewCalculationDate: isNewDate,
} = useTpProvider([
  'treatmentData',
  'serveData',
  'updateFinalPrice',
  'updateNewFinalPrice',
  'isNewCalculationDate',
])
const { isBranchHasTpPerform } = useBranchTpPerform()
const { hasFinancialPerms, canPerformTreatmentPlan, canEditTreatmentPlan } = useTpPermissions()

const { mode, currentStepNumber, backendStepNumber } = useTpStatus(treatmentData)

const showActivation = computed(() => mode?.value === 'edit')
const isActive = computed(() => treatmentData?.value?.isActive)

// TODO: merge teeth and items
const itemList = computed(() =>
  getSelectedTeethAndServices(treatmentData, serveItems, backendStepNumber.value)
)

const { totalPrice, discountPrice, couponPrice, finalPrice, finalPriceWithBenefit, newFinalPrice } =
  useTpPricing(itemList, treatmentData)

watch(
  () => finalPrice.value,
  (value) => {
    typeof updateFinalPrice === 'function' && updateFinalPrice(value)
  },
  { immediate: true }
)
watch(
  () => totalPrice.value,
  (value) => {
    typeof updateNewFinalPrice === 'function' && updateNewFinalPrice(value)
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.tpp {
  display: flex;
  flex-direction: column;
  gap: map-get($space-sm, x);
  background-color: $white;
  border-radius: 16px;
  padding: map-get($space-lg, x);
  margin-bottom: 140px;

  > div {
    border-radius: 0.5rem;
  }

  &__pricing {
    margin-top: 10px;
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
    display: flex;
    flex-direction: column;
    border-color: $grey-4;

    > div {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
    }
  }

  &__pricing-final {
    font-weight: bold;
    background: $grey-2;
    border-radius: 0.5rem;
    padding: 0.5rem 1rem !important;
  }
}
</style>
