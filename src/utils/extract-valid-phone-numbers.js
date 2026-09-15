import { convertToEnNumber } from '@/utils/convert-check-digits'

export function extractValidPhoneNumbers(numbers) {
  const text = convertToEnNumber(numbers)
  const numberArray = text.split('\n')

  const validNumbers = numberArray.filter(
    (number) =>
      (/^(0|98|\+98)/.test(number) && /^\d{10}$/.test(number.replace(/^(0|98|\+98)/, ''))) ||
      /^9\d{9}$/.test(number)
  )
  const alreadyFormatted = validNumbers.length === numberArray.length

  if (alreadyFormatted) {
    return { formatted: text, alreadyFormatted: true }
  }
  return {
    formatted: [...new Set(validNumbers.map((number) => number.replace(/^(0|98|\+98)/, '')))].join(
      '\n'
    ),
    alreadyFormatted: false,
  }
}
