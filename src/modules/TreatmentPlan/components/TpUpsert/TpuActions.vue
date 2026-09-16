<template>
  <div v-if="cashPrice && (userId || mode === 'edit')" class="tpa">
    <QBtn
      :disable="!installment || isCompletedTp || !props.isEditMode"
      color="primary"
      outline
      @click="() => onOpenModal(PAYMENT_METHOD_ENUMS.installment)"
    >
      پرداخت اقساطی
    </QBtn>
    <QBtn
      color="primary"
      unelevated
      :disable="!props.isEditMode || isCompletedTp"
      @click="() => onOpenModal(PAYMENT_METHOD_ENUMS.cash)"
    >
      پرداخت نقدی
    </QBtn>
    <QDialog v-model="isShowModal" persistent @before-hide="closeModal">
      <QCard style="min-width: 350px; max-width: 700px; width: 90vw">
        <QCardSection class="tpa__header">
          <h5>ثبت طرح درمان</h5>
          <QBtn v-close-popup flat round dense icon="close" @click="closeModal" />
        </QCardSection>

        <QCardSection class="tpa__content">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-5 tpa__left">
              <template v-for="item in props.itemList" :key="item.id">
                <div v-if="item.teeth?.length" class="tpa__teeth">
                  <template v-for="section in item.convertedTeeth" :key="section.key">
                    <div v-if="section.teeth.length > 0" class="tpa__teeth-item">
                      <div class="tpa__teeth-item-title">{{ section.title }}</div>
                      <div class="tpa__teeth-item-teeth">
                        <span v-for="tooth in section.teeth" :key="tooth">{{ tooth }}</span>
                      </div>
                    </div>
                  </template>
                </div>
              </template>
            </div>
            <div class="col-12 col-md-7">
              <div>
                <span>شیوه پرداخت:</span>
                <strong class="tpa__payment-method">
                  {{
                    paymentMethod === PAYMENT_METHOD_ENUMS.cash
                      ? 'نقدی'
                      : `اقساط ${installment?.month} ماهه`
                  }}
                </strong>
              </div>

              <div class="tpa__factor">
                <template v-if="paymentMethod === PAYMENT_METHOD_ENUMS.installment && installment">
                  <div class="tpa__factor-item">
                    <div>پیش پرداخت (درصد)</div>
                    <div>
                      {{ `${modifiedPrepaymentPercentage} %` }}
                    </div>
                  </div>
                  <div class="tpa__factor-item">
                    <div>پیش پرداخت (تومان)</div>
                    <div>
                      {{ `${numberSeparator(prePayAmount)} تومان` }}
                    </div>
                  </div>
                  <div class="tpa__factor-item">
                    <div>قسط هر ماه</div>
                    <div>
                      {{ `${numberSeparator(monthInstallment)} تومان` }}
                    </div>
                  </div>
                </template>
                <div v-if="discountData?.value" class="tpa__factor-item">
                  <div>تخفیف</div>
                  <div>
                    {{
                      discountData.type === 'percentage'
                        ? `${discountData.value} %`
                        : `${numberSeparator(discountData.value)} تومان`
                    }}
                  </div>
                </div>
                <div v-if="calculatedCouponPrice" class="tpa__factor-item">
                  <div>کد تخفیف</div>
                  <div>
                    {{ `${numberSeparator(calculatedCouponPrice)} تومان` }}
                  </div>
                </div>

                <div class="tpa__factor-item">
                  <div>مبلغ نهایی</div>
                  <div>
                    {{ finalCost + ' تومان' }}
                  </div>
                </div>
              </div>

              <div class="tpa__action">
                <!--            <QBtn-->
                <!--              :loading="isPending"-->
                <!--              color="warning"-->
                <!--              :plain="mode === 'edit'"-->
                <!--              @click="() => onSubmit(true)"-->
                <!--            >-->
                <!--              ذخیره طرح درمان جدید-->
                <!--            </QBtn>-->
                <QBtn
                  v-if="mode === 'edit'"
                  :loading="isPending"
                  color="primary"
                  unelevated
                  class="full-width"
                  @click="() => onSubmit(false)"
                >
                  اعمال تغییرات طرح درمان
                </QBtn>
              </div>
            </div>
          </div>
        </QCardSection>
      </QCard>
    </QDialog>
  </div>
</template>

<script setup>
import { formatDate } from '@/utils/date-utils'
import { roundBy } from '@/utils/round'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Notif } from '@/data/services/notification-service'
import { buildServeIndustries, buildServeIndustryItems } from '../../utils/question-items-builder'
import {
  BASE_COUNT_REQUIRED_MESSAGE,
  getBaseCountAnswers,
  hasUnsetBaseCount,
} from '../../constants/service-question-types'
import { numberSeparator } from '@/utils/formatter'
import { useQueryClient } from '@tanstack/vue-query'
import useDisclosure from '@/composables/use-disclosure'
import { useUpsertTreatmentPlanMutation } from '../../query'
import { calculatePrePayAmount, calculatePriceWithBenefit } from '../../utils/installment'
import { QUESTION_TYPE } from '../../constants/enums'
import { useTpProvider } from '../../composables/use-tp-provider'
import { useTpStatus } from '../../composables/use-tp-status'
import { useUserStore } from '@/store/user'
import {
  useTpPricing,
  ROUNDING_PRECISION,
} from '@/modules/TreatmentPlan/composables/use-tp-pricing'

const props = defineProps({
  itemList: { type: Array, default: () => [] },
  isEditMode: {
    type: Boolean,
    default: true,
  },
})

const router = useRouter()
const { userId: currentUserId } = useUserStore()

const {
  finalPrice: cashPrice,
  treatmentData,
  updateTreatment,
  resetLocalState,
  isNewCalculationDate: isNewDate,
  newFinalPrice,
} = useTpProvider([
  'finalPrice',
  'treatmentData',
  'updateTreatment',
  'resetLocalState',
  'isNewCalculationDate',
  'newFinalPrice',
])
const { mode, isCompletedTp, backendStepNumber } = useTpStatus(treatmentData)

const selectedInstallment = computed(() => treatmentData?.value?.installment)

const route = useRoute()
const queryClient = useQueryClient()

const userId = computed(() => route?.query?.['user-id'] || treatmentData?.value?.user?.id)

const PAYMENT_METHOD_ENUMS = { cash: 'CASH', installment: 'INSTALLMENT' }

const { mutate, isPending } = useUpsertTreatmentPlanMutation()

const installment = computed(() => treatmentData?.value?.installment)
const discountData = computed(() => treatmentData?.value?.discountData)

const paymentMethod = ref(PAYMENT_METHOD_ENUMS.cash)

const [isShowModal, { open: openModal, close: closeModal }] = useDisclosure()

const modifiedPrepaymentPercentage = computed(
  () => treatmentData?.value?.prepaymentPercent ?? installment.value?.percentage
)

const { discountPrice: calculatedDiscountPrice, couponPrice: calculatedCouponPrice } = useTpPricing(
  computed(() => props.itemList || []),
  treatmentData
)

const priceWithBenefit = computed(() =>
  isNewDate.value
    ? calculatePriceWithBenefit(installment.value?.profit, newFinalPrice.value) -
      (calculatedDiscountPrice.value + calculatedCouponPrice.value || 0)
    : calculatePriceWithBenefit(installment.value?.profit, cashPrice.value)
)
const prePayAmount = computed(() =>
  calculatePrePayAmount(
    priceWithBenefit.value,
    modifiedPrepaymentPercentage.value,
    selectedInstallment.value?.month
  )
)

const monthInstallment = computed(() =>
  roundBy(
    (priceWithBenefit.value - prePayAmount.value) / (selectedInstallment.value?.month ?? 0),
    ROUNDING_PRECISION
  )
)

const finalCost = computed(() => {
  const value =
    paymentMethod.value === PAYMENT_METHOD_ENUMS.cash ? cashPrice.value : priceWithBenefit.value
  return numberSeparator(Number(value) || 0)
})

const onOpenModal = (_paymentMethod) => {
  paymentMethod.value = _paymentMethod
  openModal()
}

const validateServices = () => {
  const servicesWithoutTeeth = props.itemList
    .filter((item) => {
      const needsTeeth = item.questions.some(
        (question) => question.type === QUESTION_TYPE.MULTIPLE && !question.coefficient
      )
      return needsTeeth ? !item.teeth || item.teeth.length === 0 : false
    })
    .map((item) => item?.title || 'انتخابی')

  if (servicesWithoutTeeth.length > 0) {
    let message

    if (servicesWithoutTeeth.length === 1) {
      message = `برای سرویس <strong>"${servicesWithoutTeeth[0]}"</strong> حداقل یک دندان انتخاب کنید`
    } else if (servicesWithoutTeeth.length === 2) {
      message = `برای سرویس‌های <strong>"${servicesWithoutTeeth[0]}"</strong> و <strong>"${servicesWithoutTeeth[1]}"</strong> حداقل یک دندان انتخاب کنید`
    } else {
      const lastService = servicesWithoutTeeth.pop()
      const quotedServices = servicesWithoutTeeth.map((service) => `<strong>"${service}"</strong>`)
      message = `برای سرویس‌های ${quotedServices.join('، ')} و <strong>"${lastService}"</strong> حداقل یک دندان انتخاب کنید`
    }

    Notif.error(message, { html: true, timeout: 10_000 })

    return false
  }

  return true
}

const buildTreatmentPlanData = (includeId = false) => {
  return {
    ...(includeId && { id: route.params?.id }),
    ...(includeId && { currentStepNumber: backendStepNumber.value }),
    user_id: userId.value,
    proposed_by: currentUserId?.value ?? undefined,
    public_description: treatmentData?.value?.publicDescription || undefined,
    start_date: treatmentData?.value?.startDate?.replace(/\//g, '-') || undefined,
    prepay: treatmentData?.value?.prepay || undefined,
    // TODO: it's unbelievable
    prepay_at: treatmentData?.value?.prepay
      ? formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
      : undefined,
    discount:
      treatmentData?.value?.discountData?.type === 'amount'
        ? Number(treatmentData?.value?.discountData?.value || 0)
        : 0,
    discount_percent:
      treatmentData?.value?.discountData?.type === 'amount'
        ? 0
        : Number(treatmentData?.value?.discountData?.value || 0),
    installment_id:
      paymentMethod.value === PAYMENT_METHOD_ENUMS.installment
        ? treatmentData?.value?.installment?.id
        : null,
    installment_price:
      paymentMethod.value === PAYMENT_METHOD_ENUMS.installment &&
      treatmentData?.value?.installment?.id
        ? monthInstallment.value
        : null,
    prepayment:
      paymentMethod.value === PAYMENT_METHOD_ENUMS.installment ? prePayAmount.value : null,
    prepayment_percent:
      paymentMethod.value === PAYMENT_METHOD_ENUMS.installment
        ? modifiedPrepaymentPercentage.value
        : null,
    coupon_code: treatmentData.value?.couponData?.code || undefined,
    description: treatmentData?.value?.description || undefined,
    total_cost: Number(finalCost.value.replace(/,/g, '')),
    serve_industries: buildServeIndustries(treatmentData?.value?.teeth),
    serve_industry_items: props.itemList.flatMap((item) =>
      item.questions.flatMap((question) => buildServeIndustryItems(question)).filter(Boolean)
    ),
    cheques: treatmentData?.value?.cheques?.map((cheque) => ({
      ...cheque,
      time: cheque.time ? formatDate(cheque.time, 'YYYY-MM-DD') : undefined,
    })),
  }
}

const handleSuccess = async (res, isNew = false) => {
  if (isNew) {
    updateTreatment({
      prepay: res?.data?.prepay,
      prepayAt: res?.data?.prepayAt,
    })
  }

  resetLocalState()

  await queryClient.invalidateQueries({
    queryKey: ['new-treatment-plan', 'treatment', route.params?.id],
  })

  res.message && Notif.success(res.message)

  closeModal()

  if (isNew) {
    updateTreatment({ isActive: false })
    router.push(
      `/treatment-plan/edit/${res.data.id}${mode.value === 'create' ? '?show-activate-modal=true' : ''}`
    )
  }
}

const handleError = (e) => {
  Notif.error(e?.response?.data?.message || e?.response?.message || e?.message || 'خطای ناشناخته', {
    timeout: 10_000,
  })
}

const onSubmit = (isNew = true) => {
  if (!validateServices()) return

  // Base counts must be picked manually at every stage — block the save while
  // any MULTIPLE + coefficient answer has no unit, otherwise the backend would
  // default it on its own.
  const questions = props.itemList.flatMap((item) => item.questions || [])
  if (hasUnsetBaseCount(questions, getBaseCountAnswers(questions))) {
    Notif.error(BASE_COUNT_REQUIRED_MESSAGE, {
      caption: 'لطفاً تعداد پایه را انتخاب کنید',
    })
    return
  }

  const data = buildTreatmentPlanData(!isNew)

  mutate(data, {
    onSuccess: (res) => handleSuccess(res, isNew),
    onError: handleError,
  })
}
</script>

<style lang="scss" scoped>
.tpa {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;

  & > button {
    width: 100%;
    margin: 0;
  }

  &__header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    h5 {
      margin: 0;
    }
  }

  &__content {
    overflow-x: hidden;
    max-width: 100%;
  }

  &__left {
    @media (min-width: $breakpoint-md-min) {
      border-left: 1px solid $grey-4;
      padding-left: 1rem;
    }
  }

  &__teeth-item {
    font-size: 0.75rem;
    color: $blue-gray;
    display: flex;
    margin: 0.5rem 0;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  &__teeth-item-title {
    min-width: 100px;
    flex-shrink: 0;
  }

  &__teeth-item-teeth {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;

    & > span {
      display: inline-block;
      background-color: $grey-3;
      width: 1.5rem;
      text-align: center;
    }
  }

  &__payment-method {
    color: $grey-9;
    display: inline-block;
    margin-right: 0.25rem;
  }

  &__factor {
    margin: 1rem 0;
    border: 1px solid $grey-4;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    overflow: hidden;
  }

  &__factor-item {
    display: flex;
    padding: 0.5rem;
    border-bottom: 1px solid $grey-4;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;

    & > div {
      overflow-wrap: break-word;
      word-break: break-word;
    }

    &:last-child {
      background: $grey-2;
    }
  }

  &__action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;

    & > button {
      width: 100%;
      margin: 0;
    }
  }
}
</style>
