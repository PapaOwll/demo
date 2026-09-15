// export const calculatePriceWithBenefit = (profitPercentage, price, prepayPercentage = 0) => {
//   const prepay = (price * Number(prepayPercentage)) / 100
//   return roundBy(((price - prepay) * (100 + Number(profitPercentage))) / 100 + prepay, 1000)
// }
import { roundBy } from '@/utils/round'

export const roundTo = (value, base) => Math.round(value / base) * base

/**
 * Calculate price with profit/benefit markup for installment plans
 *
 * This function applies a profit percentage markup to the entire base price.
 * The prepayment amount is calculated separately via calculatePrePayAmount().
 *
 * IMPORTANT: This is a refactored implementation (Jan 2025) that simplified
 * the calculation logic. The previous implementation applied profit only to
 * the non-prepayment portion, but the current approach applies it to the full
 * amount, with prepayment handled separately.
 *
 * @param {number} profitPercentage - Profit markup percentage (e.g., 20 for 20%)
 * @param {number} price - Base price before profit markup
 * @returns {number} Price with profit markup, rounded to nearest 1000 tomans
 *
 * @example
 * calculatePriceWithBenefit(20, 1000000) // Returns 1200000
 * calculatePriceWithBenefit(15, 500000)  // Returns 575000
 */
export const calculatePriceWithBenefit = (profitPercentage, price) => {
  return roundBy((price * (100 + Number(profitPercentage))) / 100, 1000)
}
/**
 * Calculate prepayment amount for installment plans
 *
 * This function calculates the initial prepayment amount and applies an
 * adjustment to ensure the remaining amount divides evenly by the number
 * of cheques (months).
 *
 * @param {number} withBenefitPrice - Total price including profit markup
 * @param {number} percentage - Prepayment percentage (e.g., 30 for 30%)
 * @param {number} chequeCount - Number of cheques/months in the installment plan
 * @returns {number} Prepayment amount adjusted for even distribution
 *
 * @example
 * calculatePrePayAmount(1200000, 30, 10) // Returns ~360000
 */
export const calculatePrePayAmount = (withBenefitPrice, percentage, chequeCount) => {
  const basePrepay = roundTo((withBenefitPrice * percentage) / 100, 1000)
  const remain = withBenefitPrice - basePrepay
  const adjustment = remain % (chequeCount * 100_000)
  return basePrepay + adjustment
}
