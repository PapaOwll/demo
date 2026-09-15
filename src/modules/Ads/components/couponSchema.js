import { object, string, number, boolean, mixed, array } from 'yup'
import { ALL_OPTION } from './couponHelpers'

export const validServeItemSchema = object().shape({
  serveIndustryQuestionId: mixed().nullable(),
  serveIndustryItemId: mixed().nullable(),
  discountType: string().nullable(),
  discountValue: number()
    .typeError('مقدار تخفیف باید عدد باشد')
    .min(0, 'مقدار تخفیف نمی‌تواند منفی باشد')
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .when('discountType', {
      is: 'percent',
      // eslint-disable-next-line unicorn/no-thenable
      then: (schema) => schema.max(100, 'درصد تخفیف نمی‌تواند بیشتر از 100 باشد'),
      otherwise: (schema) => schema.max(999_999_999, 'مقدار تخفیف بیش از حد مجاز است'),
    })
    .when('serveIndustryQuestionId', {
      is: (val) => val && val !== ALL_OPTION,
      // eslint-disable-next-line unicorn/no-thenable
      then: (schema) => schema.required('مقدار تخفیف الزامی است'),
      otherwise: (schema) => schema.nullable(),
    }),
})

export const validServeSchema = object().shape({
  serveIndustryId: number()
    .typeError('خدمت مورد نظر را انتخاب کنید')
    .required('خدمت مورد نظر را انتخاب کنید')
    .test('not-all-or-valid', 'خدمت را انتخاب کنید', (value) => {
      return value !== null && value !== undefined
    }),
  items: array()
    .of(validServeItemSchema)
    .min(1, 'حداقل یک آیتم باید وجود داشته باشد')
    .test('has-valid-items', 'حداقل یک آیتم باید انتخاب شود', (items) => {
      if (!items || items.length === 0) return false
      return items.some(
        (item) =>
          item?.serveIndustryQuestionId !== null &&
          item?.serveIndustryQuestionId !== undefined &&
          item?.serveIndustryQuestionId !== ALL_OPTION
      )
    })
    .test(
      'discount-required-for-all',
      'هنگام انتخاب «همه» خدمات، درصد تخفیف الزامی است',
      function (items) {
        const { parent } = this
        const serveIndustryId = parent?.serveIndustryId

        // If "all" is selected at serve level, require discount for first item
        if (serveIndustryId === ALL_OPTION) {
          if (!items || items.length === 0) return false
          const firstItem = items[0]
          return (
            firstItem?.discountValue !== null &&
            firstItem?.discountValue !== undefined &&
            firstItem?.discountValue !== ''
          )
        }

        return true
      }
    ),
})

export const couponValidationSchema = object().shape({
  name: string().required('عنوان کد تخفیف را وارد کنید'),
  code: string().required('کد تخفیف الزامی است').min(3, 'کد تخفیف حداقل ۳ کاراکتر'),
  branchId: number()
    .required('شعبه مورد نظر را انتخاب کنید')
    .typeError('شعبه مورد نظر را انتخاب کنید'),
  conditions: array()
    .of(validServeSchema)
    .min(1, 'حداقل یک خدمت باید انتخاب شود')
    .required('خدمات الزامی است'),
  hasExpire: boolean(),
  startsAt: mixed().when('hasExpire', {
    is: true,
    // eslint-disable-next-line unicorn/no-thenable -- Yup conditional schema, not a Promise
    then: (schema) => schema.required('تاریخ شروع الزامی است'),
    otherwise: (schema) => schema.nullable(),
  }),
  expiresAt: mixed().when('hasExpire', {
    is: true,
    // eslint-disable-next-line unicorn/no-thenable -- Yup conditional schema, not a Promise
    then: (schema) => schema.required('تاریخ پایان الزامی است'),
    otherwise: (schema) => schema.nullable(),
  }),
  hasUnLimit: boolean(),
  limit: number().when('hasUnLimit', {
    is: false,
    // eslint-disable-next-line unicorn/no-thenable -- Yup conditional schema, not a Promise
    then: (schema) => schema.required('تعداد استفاده الزامی است').typeError('تعداد باید عدد باشد'),
    otherwise: (schema) => schema.nullable(),
  }),
  description: string().required('توضیحات تخفیف را وارد کنید'),
  discountType: string().required('نوع تخفیف را مشخص نمایید'),
})
