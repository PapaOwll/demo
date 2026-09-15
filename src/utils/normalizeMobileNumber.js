import { convertToEnNumber } from '@/utils/convert-check-digits'

export const normalizeMobile = (input) => {
  if (!input) return ''
  const enNumber = convertToEnNumber(input).replace(/\D/g, '')
  return enNumber.replace(/^(\+98|0098|098|98|0)/, '').slice(0, 10)
}
