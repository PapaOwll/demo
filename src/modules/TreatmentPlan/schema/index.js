import { object, array, lazy, boolean, string, number } from 'yup'

export const filesValidationSchema = object().shape({
  files: array()
    .min(1)
    .of(
      object().shape({
        id: number().required('آپلود فایل اجباری است'),
        amount: number()
          .typeError('باید مقدار عددی باشد')
          .nullable()
          .transform((_, value) => {
            return value === '' ? null : Number(value)
          }),
        date: string().nullable(),
        confirmation: boolean(),
        isCheque: boolean().required(),
        number: lazy((value) => (value === '' ? string() : number()).nullable()),
        bankId: number().nullable(),
      })
    ),
})
export const confirmationValidationSchema = object().shape({
  financialConfirmation: boolean().nullable(),
  financialConfirmationDescription: string().nullable(),
})
