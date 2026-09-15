export const FEEDBACK_STATUS_OPTIONS = [
  { value: 1, label: 'منتشر شده', color: 'positive' },
  { value: 0, label: 'عدم نمایش', color: 'negative' },
  { value: null, label: 'نمایش همه', color: 'warning' },
]

export const RATING_OPTIONS = [
  { value: 5, label: '۵ ستاره' },
  { value: 4, label: '۴ ستاره' },
  { value: 3, label: '۳ ستاره' },
  { value: 2, label: '۲ ستاره' },
  { value: 1, label: '۱ ستاره' },
]

// Common feedback types based on API response
export const FEEDBACK_TYPE_OPTIONS = [{ value: 1, label: ' کاربران دندان من' }]

export const FEEDBACK_STATUS_LABELS = {
  true: 'منتشر شده',
  false: 'عدم نمایش',
  null: 'بدون وضعیت',
}

export const FEEDBACK_STATUS_COLORS = {
  true: 'green',
  false: 'red',
  null: 'gray',
}
