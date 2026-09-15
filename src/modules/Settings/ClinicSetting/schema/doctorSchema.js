import { mixed, boolean, object } from 'yup'

export const doctorSchema = object({
  doctorId: mixed().nullable().required('انتخاب پزشک الزامی است'),
  isDefault: boolean(),
})
