import { array, lazy, number, object, string } from 'yup'

export const bookingFormSchema = (visitType, onlineVisit, bookingType) =>
  object().shape({
    bookingAt: string().required('تاریخ نوبت الزامیست'),
    bookingAtTime: string()
      .required('زمان نوبت را انتخاب کنید')
      .typeError('زمان نوبت را انتخاب کنید'),
    user: object()
      .shape({
        id: number().required(),
      })
      .required('انتخاب کاربر الزامیست'),
    assignTo: lazy(() =>
      object()
        .shape({
          id: number().nullable(),
        })
        .nullable()
    ),
    advisorId: lazy(() => {
      const isOnlineVisit = visitType.value === onlineVisit.value
      return isOnlineVisit ? number().nullable() : number().required('انتخاب مشاور الزامیست')
    }),
    type: lazy(() =>
      bookingType.value === 2
        ? string().nullable()
        : visitType.value === 2
          ? string().required('نوع ویزیت الزامیست')
          : string().nullable()
    ),
    visitType: lazy(() =>
      bookingType.value === 1 && visitType !== onlineVisit.value
        ? string().required('نوع ویزیت الزامیست')
        : string().nullable()
    ),
    branch: object()
      .shape({
        id: string().required(),
      })
      .required('انتخاب شعبه الزامیست'),
    files: array().of(
      object().shape({
        id: number(),
      })
    ),
    description: string().nullable(),
    serves: array().nullable(),
    treatmentPlanId: lazy(() => {
      const isPerformType = Number(bookingType.value) === 2

      if (isPerformType) {
        return string().required('طرح درمان فعال برای کاربر وجود ندارد')
      }

      return string().nullable()
    }),
  })
