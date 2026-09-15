import { computed } from 'vue'
import { calculatePriceWithBenefit } from '../utils/installment'
import { calculateItemPrice } from '../utils/pricing'
import { useTpProvider } from '@/modules/TreatmentPlan/composables/use-tp-provider'

export const ROUNDING_PRECISION = 1000

/**
 * @param {Ref<Array>} itemList - List of treatment items with pricing information
 * @param {Ref<Object>} treatmentData - Treatment plan data including discounts, coupons, and installment info
 * @returns {Object} Pricing calculations including totalPrice, discountPrice, couponPrice, finalPrice, finalPriceWithBenefit, newFinalPrice
 */
export function useTpPricing(itemList, treatmentData) {
  const isNewCalculationDate = useTpProvider('isNewCalculationDate')

  if (!itemList?.value && !treatmentData?.value) {
    const zeroPrice = computed(() => 0)
    return {
      totalPrice: zeroPrice,
      discountPrice: zeroPrice,
      couponPrice: zeroPrice,
      finalPrice: zeroPrice,
      finalPriceWithBenefit: zeroPrice,
      newFinalPrice: zeroPrice,
    }
  }
  const discountData = computed(() => treatmentData?.value?.discountData)
  const installment = computed(() => treatmentData?.value?.installment)

  const useNewDate = isNewCalculationDate

  const totalPrice = computed(
    () => itemList.value?.reduce((prev, item) => prev + calculateItemPrice(item), 0) || 0
  )

  const discountPrice = computed(() => {
    const basePrice =
      useNewDate.value && installment.value?.profit
        ? calculatePriceWithBenefit(installment.value.profit, totalPrice.value)
        : totalPrice.value
    return discountData.value?.value && basePrice
      ? discountData.value?.type === 'amount'
        ? Number(discountData.value.value)
        : (basePrice * Number(discountData.value.value)) / 100
      : 0
  })

  const couponPrice = computed(() => Number(treatmentData.value?.couponData?.value) || 0)

  const finalPrice = computed(() => {
    const discount = Number(discountPrice.value) || 0
    const coupon = Number(couponPrice.value) || 0
    const total = Number(totalPrice.value) || 0
    return Math.max(0, Math.round(total - (discount + coupon)))
  })
  const finalPriceWithBenefit = computed(() => {
    const basePrice = useNewDate.value ? totalPrice.value : finalPrice.value
    const price = installment.value?.profit
      ? calculatePriceWithBenefit(installment.value.profit, basePrice)
      : basePrice
    return Math.round(price ?? 0)
  })
  const newFinalPrice = computed(() => {
    const discount = Number(discountPrice.value) || 0
    const coupon = Number(couponPrice.value) || 0
    const benefitPrice = Number(finalPriceWithBenefit.value) || 0
    return Math.max(0, Math.round(benefitPrice - (discount + coupon)))
  })

  return {
    totalPrice,
    discountPrice,
    couponPrice,
    finalPrice,
    finalPriceWithBenefit,
    newFinalPrice,
  }
}
