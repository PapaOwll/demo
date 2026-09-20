import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref } from 'vue'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import {
  mockGetServeItemsByKey,
  mockGetTreatmentPlanDetail,
} from '@/mocks/user-details/treatment-plan'
import {
  apiGetServes,
  apiGetUserById,
  apiGetServesByKey,
  apiGetInstallments,
  apiUpdateTreatmentPlan,
  apiCreateTreatmentPlan,
  apiGetTreatmentPlanById,
  apiGetTreatmentPlanByKey,
  apiActivateTreatmentPlan,
  apiGetUserActivateTreatmentPlan,
  apiExtraditePrepay,
  apiCompleteTreatmentPlan,
  apiCreatePreTreatmentPlan,
  apiFromDraftTreatmentPlan,
  apiPerformTreatmentPlan,
  apiGetTreatmentPlanDescription,
  apiUploadTpVoice,
  apiGetTreatmentPlanCredit,
  apiGetTotalTreatmentPlanCount,
  apiGetTreatmentPlan,
  apiTreatmentPlanCreditLevel,
  attachFinancialFile,
  financialConfirmation,
  apiExportPreTreatmentPlanExcel,
  apiTransmissionPrepay,
  apiExtraditionTreatmentPlan,
  apiGetPreTreatmentPlan,
  apiDeleteTreatmentPlan,
  apiGetDoctorReviewsList,
  apiGetServesWithQuestions,
  apiCalculateCheques,
  apiDeleteTpDescription,
  apiUpdateTpDescription,
  apiGetDoctorDailyReport,
  apiGetTreatmentPlanTotalCredit,
  apiGetUserTpWarranty,
  apiUpdateUserTpWarrantyStatus,
  apiCalculateCouponCode,
  apiGetTreatmentPlanBookings,
  apiAttachBookingVoice,
  apiGetBookingServes,
} from '../api'
import { camelize } from '@/utils/convert-to-camel-snake'
import { convertShowableTeethToTeeth, findTeethFromTeethData } from '../utils/teeth'
import { handleError } from '@/utils/error-handler'

const calculateTeeth = (serves, teethData) => {
  return (
    serves?.map((serve) => {
      const teeth = serve.teeth
        ? convertShowableTeethToTeeth(serve.teeth)
        : teethData?.teethData
          ? findTeethFromTeethData(serve, teethData.teethData)
          : []
      return {
        serve,
        teeth,
        total: teeth.length,
      }
    }) || []
  )
}

const transformTreatmentPlanData = (res) => {
  if (!res?.id) {
    console.error('Treatment plan data missing id field:', res)
  }

  let teethData = null
  if (res?.teethData) {
    try {
      teethData = camelize(JSON.parse(res.teethData))
    } catch (error) {
      console.error('Failed to parse teethData JSON:', error)
      teethData = null
    }
  }

  const calculatedTeeth = calculateTeeth(res?.serves, teethData)

  return {
    ...res,
    id: res.id,
    user: res.user,
    items: res.items,
    cheques: res.cheques,
    isActive: res.isActive,
    isDraft: res.isDraft,
    isPerformed: res.isPerformed,
    isProposed: res.isProposed,
    createdAt: res.createdAt,
    createdBy: res.createdBy,
    startDate: res.startDate,
    installment: res.installment,
    status: res.status,
    prepay: res.prepay,
    prepayAt: res.prepayAt,
    extraditionAt: res.extraditionAt,
    publicDescription: res.publicDescription,
    prepaymentPercent: res.prepaymentPercent,
    description: res.description,
    totalCost: res.totalCost,
    couponId: res.coupon?.id || null,
    couponData: res.coupon
      ? {
          id: res.coupon.id,
          code: res.coupon.code,
          value: res.couponDiscount || res.coupon_discount || 0,
        }
      : {},
    discountData: {
      type: !!res.discountPercent && res.discountPercent !== '0' ? 'percentage' : 'amount',
      value:
        !!res.discountPercent && res.discountPercent !== '0' ? res.discountPercent : res?.discount,
    },
    voices: res.voices,
    teeth: calculatedTeeth,
    visitType: res.visitType,
    branch: res.branch,
  }
}

export const useGetServeItemsQuery = (params, options = {}) =>
  useQuery({
    queryKey: ['new-treatment-plan', 'serve-items', params],
    queryFn: () => apiGetServes({ ...unref(params) }),
    select: (data) => camelize(data?.data?.items),
    ...options,
  })

export const useGetServeItemsByKeyQuery = (key, options = {}) =>
  useQuery({
    enabled: !!unref(key),
    queryKey: ['new-treatment-plan', 'serve-items', key],
    queryFn: ENABLE_USER_DETAIL_MOCKS
      ? () => mockGetServeItemsByKey(unref(key))
      : () => apiGetServesByKey(unref(key)),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useUpsertTreatmentPlanMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, currentStepNumber, ...data }) => {
      if (id && currentStepNumber > 1) {
        return apiUpdateTreatmentPlan(data, id)
      }
      if (id) {
        return apiFromDraftTreatmentPlan(data, id)
      }
      return apiCreateTreatmentPlan(data)
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['booking', 'patients-without-cheque-count'] }),
  })
}

export const useGetUserByIdQuery = (userId, options = {}) =>
  useQuery({
    enabled: !!unref(userId),
    queryKey: ['user', userId],
    queryFn: () => apiGetUserById(unref(userId)),
    select: (data) => data?.data,
    ...options,
  })

export const useGetUserById = useGetUserByIdQuery

export const useGetInstallmentQuery = (enabled, options = {}) =>
  useQuery({
    enabled: !!unref(enabled),
    queryKey: ['new-treatment-plan', 'installment'],
    queryFn: () => apiGetInstallments(),
    select: (data) => data?.data,
    ...options,
  })

export const useGetTreatmentPlanByIdQuery = (id, options = {}) =>
  useQuery({
    enabled: !!unref(id),
    queryKey: ['new-treatment-plan', 'treatment', id],
    queryFn: ENABLE_USER_DETAIL_MOCKS
      ? () => mockGetTreatmentPlanDetail(unref(id))
      : () => apiGetTreatmentPlanById(unref(id)),
    select: (data) => transformTreatmentPlanData(data?.data ?? data),
    ...options,
  })

export const useGetTreatmentPlanByKeyQuery = (key, options = {}) =>
  useQuery({
    enabled: !!unref(key),
    queryKey: ['new-treatment-plan', 'treatment', key],
    queryFn: ENABLE_USER_DETAIL_MOCKS
      ? () => mockGetTreatmentPlanDetail(unref(key))
      : () => apiGetTreatmentPlanByKey(unref(key)),
    select: (data) => transformTreatmentPlanData(data?.data ?? data),
    ...options,
  })

export const useActivateTreatmentPlanMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => apiActivateTreatmentPlan(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['booking', 'patients-without-cheque-count'] }),
  })
}

export const useGetUserActivateTreatmentPlanQuery = (id, options = {}) =>
  useQuery({
    enabled: !!unref(id),
    queryKey: ['new-treatment-plan', 'active-treatment-plan', id],
    queryFn: () => apiGetUserActivateTreatmentPlan(unref(id)),
    select: (data) => data?.data,
    ...options,
  })

export const useExtraditePrepayMutation = () =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiExtraditePrepay(id, data),
  })

export const useCompleteTreatmentPlanMutation = () =>
  useMutation({
    mutationFn: (id) => apiCompleteTreatmentPlan(id),
  })

export const useCreatePreTpMutation = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiCreatePreTreatmentPlan(data),
    onError: (err) => {
      handleError(err)
    },
    ...options,
  })

export const usePerformTreatmentPlanMutation = () =>
  useMutation({
    mutationFn: ({ treatmentPlanId, data }) => apiPerformTreatmentPlan(treatmentPlanId, data),
  })

export const useTpDescriptionInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['tpd', 'all-tpd', filters],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => apiGetTreatmentPlan({ ...filters.value, ...pageParam }),
    select: ({ pages, pageParams }) => ({
      pages,
      pageParams,
    }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.data.items.length === 0) return null

      return { page: pages.length + 1 }
    },
    placeholderData: (previousData) => previousData,
    ...options,
  })

export const useUploadTpVoiceMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiUploadTpVoice(id, data),
    onError: (err) => handleError(err),
    ...options,
  })
// TODO: Remove later carefully with new implementation
export const useGetTreatmentPlanCreditQuery = (treatmentPlanId, params, options = {}) =>
  useQuery({
    queryKey: ['new-treatment-plan', 'credit', treatmentPlanId, params],
    queryFn: () => apiGetTreatmentPlanCredit(unref(treatmentPlanId), unref(params)),
    enabled: !!unref(treatmentPlanId) && !!unref(params)?.serveIndustryId,
    ...options,
  })

export const useGetTreatmentPlanTotalCreditQuery = (treatmentPlanId, options = {}) =>
  useQuery({
    queryKey: ['treatment-plan', 'total-credit', treatmentPlanId],
    queryFn: () => apiGetTreatmentPlanTotalCredit(unref(treatmentPlanId)),
    select: (data) => data?.data ?? data,
    enabled: !!unref(treatmentPlanId),
    ...options,
  })

export const useGetTreatmentPlanTotalCountMutation = () =>
  useMutation({
    mutationFn: (filters) => apiGetTotalTreatmentPlanCount(filters.value),
  })

export const useGetInstallment = (enabled) =>
  useQuery({
    enabled: () => !!unref(enabled),
    queryKey: ['treatment-plan', 'installment'],
    queryFn: () => apiGetInstallments(),
    select: (data) => data?.data ?? data,
  })

export const usePreTreatmentPlanInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['treatment-plan', 'all-pre-treatment-plans', filters],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => apiGetPreTreatmentPlan({ ...filters.value, ...pageParam }),
    select: ({ pages, pageParams }) => ({
      pages,
      pageParams,
    }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.data.items.length === 0) return null

      return { page: pages.length + 1 }
    },
    placeholderData: (previousData) => previousData,
    ...options,
  })

export const useTreatmentPlanInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['treatment-plan', 'all-treatment-plans', filters],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => apiGetTreatmentPlan({ ...filters.value, ...pageParam }),
    select: ({ pages, pageParams }) => ({
      pages,
      pageParams,
    }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.data.items.length === 0) return null

      return { page: pages.length + 1 }
    },
    placeholderData: (previousData) => previousData,
    ...options,
  })
export const useGetDoctorReviewsListQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['treatment-plan', 'doctor-review'],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => apiGetDoctorReviewsList({ ...filters.value, ...pageParam }),
    select: ({ pages, pageParams }) => ({
      pages,
      pageParams,
    }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.data.items.length === 0) return null
      return { page: pages.length + 1 }
    },
    placeholderData: (previousData) => previousData,
    ...options,
  })

export const useUpdateCreditLevelMutation = () =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiTreatmentPlanCreditLevel(id, data),
  })

export const useUpdateConfirmationFinancialMutation = () =>
  useMutation({
    mutationFn: ({ id, ...data }) => financialConfirmation(id, data),
  })

export const useUpdateFinancialFileMutation = () =>
  useMutation({
    mutationFn: ({ id, ...data }) => attachFinancialFile(id, data),
  })

export const useExportPreTreatmentPlanExcelMutation = () =>
  useMutation({
    mutationFn: (filters) => apiExportPreTreatmentPlanExcel(filters),
  })

export const useUserActivateTreatmentPlanMutation = () =>
  useMutation({
    mutationFn: (id) => apiGetUserActivateTreatmentPlan(id),
  })

export const useTransmissionTreatmentPlanPrepayMutation = () =>
  useMutation({
    mutationFn: ({ originId, destinationId }) => apiTransmissionPrepay({ originId, destinationId }),
  })

export const useExtraditionTreatmentPlanMutation = () =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiExtraditionTreatmentPlan(id, data),
  })

export const useDeleteTreatmentPlanMutation = (options = {}) =>
  useMutation({
    mutationFn: (id) => apiDeleteTreatmentPlan(id),
    onError: (err) => handleError(err),
    ...options,
  })

export const useServesWithQuestionsQuery = (filterText, enabled, options = {}) => {
  const { treatmentPlanId } = options
  return useQuery({
    queryKey: ['serves-with-questions', filterText, treatmentPlanId],
    queryFn: () => {
      const params = filterText.value ? { 'filter[title]': filterText.value } : {}
      if (treatmentPlanId?.value ?? treatmentPlanId) {
        params.treatment_plan_id = unref(treatmentPlanId) ?? treatmentPlanId
      }
      return apiGetServesWithQuestions(params)
    },
    enabled,
    ...options,
  })
}

export const useTpDescriptionQuery = (tpId, bookingId, options = {}) =>
  useQuery({
    queryKey: ['tp-description', tpId, bookingId],
    queryFn: () => {
      const filters = unref(bookingId) ? { booking_id: unref(bookingId) } : undefined
      return apiGetTreatmentPlanDescription(unref(tpId), filters)
    },
    enabled: !!unref(tpId),
    select: (data) => data?.data?.data ?? data?.data ?? data,
    ...options,
  })

export const useDeleteTpDescriptionMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ tpdId, itemId }) => apiDeleteTpDescription(tpdId, itemId),
    onError: (err) => handleError(err),
    ...options,
  })

export const useUpdateTpDescriptionMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ tpId, itemId, ...data }) => apiUpdateTpDescription(tpId, itemId, data),
    onError: (err) => handleError(err),
    ...options,
  })

export const useCalculateChequesQuery = (params, options = {}) => {
  return useQuery({
    queryKey: computed(() => {
      const p = unref(params)
      return [
        'calculate-cheques',
        p?.installmentId,
        p?.amount,
        p?.startDate,
        p?.prepaymentPercent,
        p?.totalAmount,
        p?.discount,
        p.couponDiscount,
        p?.discountType,
        p?.prepay,
        p?.treatmentplanId,
      ]
    }),
    queryFn: async () => {
      const p = unref(params)
      return apiCalculateCheques({
        installment_id: p.installmentId,
        amount: p.amount,
        start_date: p.startDate.replace(/\//g, '-'),
        prepayment_percent: p.prepaymentPercent,
        total_amounts: p.totalAmount,
        discount: p.discount,
        discount_type: p.discountType,
        couponDiscount: p.couponDiscount,
        prepay: p.prepay,
        treatmentplan_id: Number(p.treatmentplanId),
      })
    },
    enabled: computed(() => {
      const p = unref(params)
      return Boolean(
        p?.isTreatmentPlanLoaded &&
        p?.installmentId &&
        p?.amount > 0 &&
        p?.startDate &&
        p?.prepaymentPercent != null
      )
    }),
    select: (data) => data?.data,
    ...options,
  })
}

export const useGetDoctorDailyReportQuery = (date, doctorId, options = {}) =>
  useQuery({
    queryKey: ['treatment-plan', 'doctor-report', date, doctorId],
    queryFn: () => apiGetDoctorDailyReport(date, doctorId),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useGetUserTpWarrantyQuery = (tpId, options = {}) =>
  useQuery({
    queryKey: ['user-warranty', tpId.value],
    queryFn: () => apiGetUserTpWarranty(tpId.value),
    enabled: !!tpId.value,
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useUpdateUserTpWarrantyMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ ...data }) => apiUpdateUserTpWarrantyStatus(data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useCalculateCouponCodeMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ ...data }) => apiCalculateCouponCode(data),
    ...options,
  })

export const useTreatmentPlanBookingsQuery = (filters, options = {}) =>
  useQuery({
    queryKey: ['treatment-plan-bookings', filters],
    queryFn: () => apiGetTreatmentPlanBookings(unref(filters)),
    select: (data) => data?.data?.data ?? data?.data ?? data,
    ...options,
  })

export const useAttachBookingVoiceMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ bookingId, ...data }) => apiAttachBookingVoice(bookingId, data),
    onError: (err) => handleError(err),
    ...options,
  })

export const useBookingVoicesQuery = (bookingId, options = {}) =>
  useQuery({
    enabled: !!unref(bookingId),
    queryKey: ['booking-voices', bookingId],
    queryFn: () => apiGetBookingServes(unref(bookingId)),
    select: (data) => data?.data?.voices ?? [],
    ...options,
  })
