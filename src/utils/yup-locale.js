import { setLocale } from 'yup'

const persianValidation = {
  required: 'فیلد {field} ضروری است',
  min: 'فیلد {field} باید حداقل {min} کاراکتر باشد',
  max: 'فیلد {field} باید حداکثر {max} کاراکتر باشد',
  arrayMin: 'فیلد {field} باید حداقل {min} آیتم داشته باشد',
  arrayMax: 'فیلد {field} باید حداکثر {max} آیتم داشته باشد',
  email: 'فیلد {field} باید یک ایمیل معتبر باشد',
  url: 'فیلد {field} باید یک URL معتبر باشد',
  'fields.name': 'نام',
  'fields.email': 'ایمیل',
  'fields.serves': 'خدمات',
  'fields.userId': 'شناسه کاربر',
  'fields.advisor': 'مشاور',
  'fields.prepay': 'بیعانه',
  'fields.assignTo': 'مسئول',
  'fields.dueTime': 'ساعت سررسید',
  'fields.bookingId': 'شناسه نوبت',
  'fields.description': 'توضیحات',
  'fields.fileIds': 'شناسه فایل‌ها',
  'fields.extradition': 'عودت داده شده',
  'fields.branchId': 'شناسه شعبه',
  'fields.title': 'عنوان',
  'fields.status': 'وضعیت',
  'fields.priority': 'اولویت',
  'fields.startedAtObj': 'تاریخ شروع',
  'fields.createdAtObj': 'تاریخ ایجاد',
  'fields.advisors': 'مشاوران',
  'fields.code': 'کد',
  'fields.password': 'رمز عبور',
  'fields.passwordConfirmation': 'تأیید رمز عبور',
  'fields.bookingAt': 'تاریخ نوبت',
  'fields.bookingAtTime': 'زمان نوبت',
  'fields.bookingAtObj': 'تاریخ و زمان نوبت',
  'fields.advisorId': 'شناسه مشاور',
  'fields.serveIndustryIds': 'خدمات',
  'fields.type': 'نوع',
  'fields.treatmentPlanId': 'شناسه طرح درمان',
  'fields.price': 'قیمت',
  'fields.national_code': 'کد ملی',
  'fields.nationalCode': 'کد ملی',
  'fields.docNumber': 'شماره پرونده',
  'fields.files': 'فایل ها',
  'fields.month': 'ماه',
  'fields.percentage': 'پیش پرداخت',
  'fields.order': 'اولویت نمایش',
  'fields.profit': 'سود',
  'fields.typeId': 'نوع پیگیری',
  'fields.maxPrepay': 'حداکثر مبلغ',
  'fields.minPrice': 'حداقل مبلغ',
  'fields.isActive': 'وضعیت نمایش',
  'validation.email': 'ایمیل',
  'validation.url': 'URL',
}

setLocale({
  mixed: {
    required: ({ path }) =>
      persianValidation.required.replace('{field}', persianValidation[`fields.${path}`]),
  },
  string: {
    min: ({ path, min }) =>
      persianValidation.min
        .replace('{field}', persianValidation[`fields.${path}`])
        .replace('{min}', min),
    max: ({ path, max }) =>
      persianValidation.max
        .replace('{field}', persianValidation[`fields.${path}`])
        .replace('{max}', max),
    email: ({ path }) =>
      persianValidation.email.replace('{field}', persianValidation[`validation.${path}`]),
    url: ({ path }) =>
      persianValidation.url.replace('{field}', persianValidation[`validation.${path}`]),
  },
  array: {
    min: ({ path, min }) =>
      persianValidation.arrayMin
        .replace('{field}', persianValidation[`fields.${path}`])
        .replace('{min}', min),
    max: ({ path, max }) =>
      persianValidation.arrayMax
        .replace('{field}', persianValidation[`fields.${path}`])
        .replace('{max}', max),
  },
})
