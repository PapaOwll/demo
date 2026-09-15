import { boolean, number, object } from 'yup'

export const installmentValidationSchema = object().shape({
  month: number().required().default(0),
  maxPrepay: number().nullable().required().default(0),
  minPrice: number().nullable().required().default(0),
  order: number().required().default(0),
  percentage: number().required().default(0),
  profit: number().required().default(0),
  isActive: boolean().default(false),
})
