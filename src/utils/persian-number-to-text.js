/**
 * Persian Number to Text Converter
 * Converts numbers to Persian text format
 */

const ones = [
  '',
  'یک',
  'دو',
  'سه',
  'چهار',
  'پنج',
  'شش',
  'هفت',
  'هشت',
  'نه',
  'ده',
  'یازده',
  'دوازده',
  'سیزده',
  'چهارده',
  'پانزده',
  'شانزده',
  'هفده',
  'هجده',
  'نوزده',
]

const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود']

const hundreds = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد']

const scale = ['', 'هزار', 'میلیون', 'میلیارد', 'بیلیون', 'بیلیارد']

/**
 * Convert a three-digit number to Persian text
 * @param {number} num - Number between 0-999
 * @returns {string} - Persian text representation
 */
function convertThreeDigits(num) {
  let result = ''

  const hundred = Math.floor(num / 100)
  const remainder = num % 100

  if (hundred > 0) {
    result += hundreds[hundred]
    if (remainder > 0) {
      result += ' و '
    }
  }

  if (remainder < 20) {
    result += ones[remainder]
  } else {
    const ten = Math.floor(remainder / 10)
    const one = remainder % 10
    result += tens[ten]
    if (one > 0) {
      result += ` و ${ones[one]}`
    }
  }

  return result.trim()
}

/**
 * Convert number to Persian text
 * @param {number|string} number - The number to convert
 * @returns {string} - Persian text representation
 */
export function convertNumberToPersianText(number) {
  if (number === null || number === undefined || number === '') {
    return ''
  }

  // Convert to number and handle negative
  let num = Number(String(number).replace(/,/g, ''))

  if (Number.isNaN(num)) {
    return ''
  }

  if (num === 0) {
    return 'صفر'
  }

  let isNegative = false
  if (num < 0) {
    isNegative = true
    num = Math.abs(num)
  }

  const groups = []
  let scaleIndex = 0

  // Split number into groups of three digits
  while (num > 0) {
    const group = num % 1000
    if (group > 0) {
      let groupText = convertThreeDigits(group)
      if (scaleIndex > 0) {
        groupText += ` ${scale[scaleIndex]}`
      }
      groups.unshift(groupText)
    }
    num = Math.floor(num / 1000)
    scaleIndex += 1
  }

  let result = groups.join(' و ')

  if (isNegative) {
    result = `منفی ${result}`
  }

  return result
}

/**
 * Convert Rial amount to Toman text
 * @param {number|string} rialAmount - Amount in Rial
 * @returns {string} - Amount in Toman as Persian text
 */
export function convertRialToTomanText(rialAmount) {
  if (rialAmount === null || rialAmount === undefined || rialAmount === '') {
    return ''
  }

  const rial = Number(String(rialAmount).replace(/,/g, ''))

  if (Number.isNaN(rial) || rial === 0) {
    return ''
  }

  // Convert Rial to Toman (divide by 10)
  const toman = Math.floor(rial / 10)

  if (toman === 0) {
    return ''
  }

  const tomanText = convertNumberToPersianText(toman)

  return `${tomanText} تومان`
}

/**
 * Convert Toman amount to Rial text with "معادل" prefix
 * @param {number|string} tomanAmount - Amount in Toman
 * @returns {string} - Amount in Rial as Persian text with "معادل" prefix
 */
export function convertTomanToRialText(tomanAmount) {
  if (tomanAmount === null || tomanAmount === undefined || tomanAmount === '') {
    return ''
  }

  const toman = Number(String(tomanAmount).replace(/,/g, ''))

  if (Number.isNaN(toman) || toman === 0) {
    return ''
  }

  // Convert Toman to Rial (multiply by 10)
  const rial = toman * 10

  const rialText = convertNumberToPersianText(rial)

  return `معادل ${rialText} ریال`
}
