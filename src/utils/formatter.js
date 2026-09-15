export function numberSeparator(x) {
  if (x === null || x === undefined) return ''
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
export const generatePriceFormat = (amount, additionalMark = '') => {
  if (amount == null || amount === '') return 'نامشخص'
  const numericAmount = Number(String(amount).replace(/,/g, ''))
  if (Number.isNaN(numericAmount)) return 'نامشخص'
  return numericAmount === 0
    ? `${String(numericAmount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    : `${String(numericAmount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ${additionalMark}  تومان`
}
