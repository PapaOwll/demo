const numberMappings = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
}

export const convertToEnNumber = (str) => {
  if (str == null) return ''
  if (typeof str !== 'string') return str

  return str.replace(/[٠-٩۰-۹]/g, (digit) => numberMappings[digit])
}

export const extractNumbers = (str) => {
  if (typeof str !== 'string') return str

  // First convert any Persian/Arabic numbers to English
  const convertedStr = convertToEnNumber(str)

  // Then extract only numbers, replacing everything else with empty string
  return convertedStr.replace(/\D/g, '')
}
