import { array, mixed, number, object, string } from 'yup'

export const announcementSchema = object({
  title: string().required('عنوان الزامی است'),
  text: string().required('متن اطلاعیه الزامی است'),
  branch_ids: array()
    .required('انتخاب شعبه الزامی است')
    .of(number().typeError('شناسه شعبه نامعتبر است'))
    .min(1, 'حداقل یک شعبه باید انتخاب شود'),
  startsAt: mixed()
    .nullable()
    .test('is-valid-date', 'تاریخ شروع نامعتبر است', (value) => {
      if (value === null || value === undefined || value === '') return true
      const dateValue = new Date(value)
      return !Number.isNaN(dateValue.getTime())
    }),
  expiresAt: mixed()
    .nullable()
    .test('is-valid-date', 'تاریخ انقضا نامعتبر است', (value) => {
      if (value === null || value === undefined || value === '') return true
      const dateValue = new Date(value)
      return !Number.isNaN(dateValue.getTime())
    })
    .test(
      'is-after-start',
      'تاریخ انقضا باید بعد از تاریخ شروع باشد',
      function validateExpiresAt(value) {
        const { startsAt } = this.parent
        if (!value || !startsAt) return true
        return new Date(value) >= new Date(startsAt)
      }
    ),
})
