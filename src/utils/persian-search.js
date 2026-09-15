import { convertToEnNumber } from '@/utils/convert-check-digits'

const CONFUSABLE_MAP = {
  ي: 'ی',
  ك: 'ک',
  ة: 'ه',
  أ: 'ا',
  إ: 'ا',
  آ: 'ا',
}

export function normalizePersian(input) {
  if (input == null) return ''
  let str = String(input)
  str = str.replace(/[\u064B-\u065F\u0670\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
  str = convertToEnNumber(str)
  str = str.replace(/[آأإةكي]/g, (ch) => CONFUSABLE_MAP[ch] || ch)
  return str.toLowerCase()
}

export function matchPersian(haystack, needle) {
  return normalizePersian(haystack).includes(normalizePersian(needle))
}
