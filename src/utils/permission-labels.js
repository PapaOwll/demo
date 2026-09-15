export const MODULE_LABELS = {
  user: 'کاربران',
  'treatment-plan': 'طرح درمان',
  booking: 'نوبت‌دهی',
  setting: 'تنظیمات',
  contact: 'تماس‌ها',
  task: 'وظایف',
  ads: 'تبلیغات',
  survey: 'نظرسنجی',
  attendance: 'حضور و غیاب',
  visit: 'ویزیت',
}

export const ACTION_LABELS = {
  view: 'مشاهده',
  add: 'افزودن',
  update: 'ویرایش',
  delete: 'حذف',
  'mass-update': 'به‌روزرسانی گروهی',
  manage: 'مدیریت',
  recreate: 'بازسازی',
}

export const SUBMODULE_LABELS = {
  impersonate: 'جعل هویت',
  create: 'ایجاد',
  'perform-treatment-plan': 'شرح درمان',
  treatmentPlanFinancial: 'مالی',
  manualPayment: 'پرداخت دستی',
  generalSetting: 'تنظیمات عمومی',
  pricing: 'قیمت‌گذاری',
  personalSetting: 'تنظیمات شخصی',
  clinicSetting: 'تنظیمات کلینیک',
  operatorSetting: 'تنظیمات اپراتور',
  coupon: 'کوپن',
  campaign: 'کمپین',
  'survey-lists': 'لیست نظرسنجی',
}

export function getPermissionLabel(permission) {
  const parts = []

  const moduleName = MODULE_LABELS[permission.module] || permission.module
  parts.push(moduleName)

  const actionName = ACTION_LABELS[permission.action] || permission.action
  parts.push(actionName)

  if (permission.inSubModule && permission.subModuleName) {
    const subModuleName = SUBMODULE_LABELS[permission.subModuleName] || permission.subModuleName
    parts.push(`(${subModuleName})`)
  }

  return parts.join(' - ')
}

export function getPermissionLabelWithCode(permission) {
  const label = getPermissionLabel(permission)

  let code = `${permission.module}.${permission.action}`
  if (permission.inSubModule && permission.subModuleName) {
    code += ` (${permission.subModuleName})`
  }

  return `${label}\n${code}`
}
