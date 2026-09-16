import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/vue-query'
import { unref, computed } from 'vue'
import {
  apiChangeLevel,
  apiCheckUserExist,
  apiCreateUser,
  apiExportExcel,
  apiGetAdvisor,
  apiGetAllProvinces,
  apiGetAllRoles,
  apiGetAreasOfCity,
  apiGetBanks,
  apiGetCitiesOfProvince,
  apiGetCurrentUser,
  apiGetEnums,
  apiGetMethodOfIntroductions,
  apiGetQuickMessage,
  apiGetRegisterMedicalInfo,
  apiGetServes,
  apiGetUserById,
  apiGetUserFinancialSummary,
  apiGetUserHistory,
  apiGetUserMiniById,
  apiGetUsers,
  apiGetUsersByPhoneNumber,
  apiGetUserStatus,
  apiGetUsersTotalCount,
  apiImpersonate,
  apiImpersonateMyTooth,
  apiRecreateUser,
  apiSendClinicInformation,
  apiUpdateMedicalInfo,
  apiSendSmsToMobile,
  apiUpdateUser,
  apiUpdateUserRole,
  apiUserBatchUpdate,
  apiUserDocumentFile,
  apiGetUserTransactions,
  apiUpdateTransaction,
  apiPostPosPayment,
  apiGetPosDevices,
  apiPostPosInquiry,
  apiCreatePayment,
  apiGetManualPaymentConfig,
  apiCreateManualPayment,
  apiCreatePaymentLink,
  apiCreatePaymentLinkLegacy,
  apiVerifiedDocs,
  apiGetFileStatus,
  apiGetUserTags,
  apiSendOpgRequest,
  apiGetOpgRequest,
  apiSendDrugPrescription,
  apiGetUserChatsSummary,
  apiGetUserCallsSummary,
  apiGetUserConversations,
  apiGetConversationChannels,
  apiGetDoctorReview,
  apiGetEnumBySlug,
  apiUserDocumentFilesByType,
  apiUserMerge,
  apiCreateUserCheques,
  apiDeleteUserCheque,
  apiCreateBetaInstallments,
  apiVerifiedConsent,
  apiAutoVerifiedConsent,
  apiGetUserAccounting,
  apiGetPaymentObligations,
  apiDeleteBetaInstallments,
  apiUpdateInstallmentStatus,
  apiDeleteAccountingItem,
  apiCreateUserBarter,
  apiConfirmUserBarter,
  apiResendUserBarterOtp,
  apiGetRefundRequests,
  apiCreateRefundRequest,
  apiApproveRefundRequest,
  apiRejectRefundRequest,
  apiGetUserWarranties,
  apiUpdateUserWarrantyStatus,
} from '../api'

import { formatDate } from '@/utils/date-utils'
import { handleError } from '@/utils/error-handler'

export const useGetUserInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['user', 'all-users', filters],
    initialPageParam: { page: 1, list_visited_at: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss') },
    queryFn: ({
      pageParam = { page: 1, list_visited_at: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss') },
    }) => {
      return apiGetUsers({ ...filters.value, ...pageParam })
    },
    select: ({ pages, pageParams }) => ({
      pages,
      pageParams,
    }),
    getNextPageParam: (lastPage, pages) => {
      const items = lastPage?.data?.items
      if (!Array.isArray(items) || items.length === 0) return null

      const safePages = Array.isArray(pages) ? pages : []

      return {
        page: safePages.length + 1,
        list_visited_at: lastPage?.data?.time || formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
      }
    },
    placeholderData: (previousData) => previousData,
    retry: (failureCount, error) => {
      if (
        error?.response?.status &&
        error.response.status >= 400 &&
        error.response.status < 500 &&
        error.response.status !== 408
      ) {
        return false
      }
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000), // Exponential backoff
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    gcTime: 10 * 60 * 1000,
    ...options,
  })

export const useGetUserHistoryInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['user', 'all-history', filters],
    queryFn: ({ pageParam }) => apiGetUserHistory({ ...filters.value, ...pageParam }),
    select: ({ pages, pageParams }) => ({
      pages,
      pageParams,
    }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      const items = lastPage?.data?.items
      if (!Array.isArray(items) || items.length === 0) return null

      return { page: (Array.isArray(pages) ? pages.length : 0) + 1 }
    },
    placeholderData: (previousData) => previousData,
    ...options,
  })

export const useGetUserOpgRequestInfinityQuery = (userId, options = {}) =>
  useInfiniteQuery({
    queryKey: ['user', 'opg-list', userId],
    queryFn: () => apiGetOpgRequest(userId),
    select: ({ pages, pageParams }) => ({
      pages,
      pageParams,
    }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      const items = lastPage?.data?.items
      if (!Array.isArray(items) || items.length === 0) return null

      return { page: (Array.isArray(pages) ? pages.length : 0) + 1 }
    },
    placeholderData: (previousData) => previousData,
    ...options,
  })

export const useGetUserConversationInfinityQuery = (userId, filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['user', 'conversation', filters, userId],
    queryFn: ({ pageParam = { page: 1 } }) =>
      apiGetUserConversations(userId.value, { ...filters.value, ...pageParam }),
    select: ({ pages, pageParams }) => ({
      pages,
      pageParams,
    }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      const items = lastPage?.data?.items?.data
      if (!Array.isArray(items) || items.length === 0) return null
      return { page: pages.length + 1 }
    },
    placeholderData: (previousData) => previousData,
    ...options,
  })

export const useDeleteBetaInstallmentsMutation = (options = {}) =>
  useMutation({
    mutationFn: (ids) => apiDeleteBetaInstallments(ids),
    onError: (error) => handleError(error),
    ...options,
  })

export const useUpdateInstallmentStatusMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, statusId }) => apiUpdateInstallmentStatus(id, statusId),
    onError: (error) => handleError(error),
    ...options,
  })

export const useDeleteAccountingItemMutation = (options = {}) =>
  useMutation({
    mutationFn: (autoid) => apiDeleteAccountingItem(autoid),
    onError: (error) => handleError(error),
    ...options,
  })

export const useGetConversationChannels = (options = {}) =>
  useQuery({
    queryKey: ['user', 'channels'],
    queryFn: () => apiGetConversationChannels(),
    select: (data) => data?.data ?? data,
    ...options,
  })
export const useGetUsersQuery = (filters, options = {}) =>
  useQuery({
    queryKey: ['user', 'user', filters],
    queryFn: () => apiGetUsers(filters.value),
    select: (data) => {
      return data?.data ?? data
    },
    ...options,
  })
export const useGetUsersTotalCountMutation = () =>
  useMutation({
    mutationFn: (filters) => apiGetUsersTotalCount(filters.value),
  })
export const useGetAdvisorsQuery = (filters, options = {}) =>
  useQuery({
    queryKey: ['advisors', filters],
    queryFn: () => apiGetAdvisor(filters.value),
    select: (data) => {
      return data?.data ?? data
    },
    ...options,
  })
export const useGetUsersByPhoneNumberQuery = (phoneNumber, options = {}) =>
  useQuery({
    queryKey: ['user', 'by-phone-number', phoneNumber],
    queryFn: () => apiGetUsersByPhoneNumber(phoneNumber.value),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useGetMedicalInfoQuery = (userId, options = {}) =>
  useQuery({
    queryKey: ['user', 'medical-info', userId],
    queryFn: () => apiGetRegisterMedicalInfo(unref(userId)),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useGetCurrentUser = (slug, options = {}) =>
  useQuery({
    queryKey: ['user', 'get-user', slug],
    queryFn: () => apiGetCurrentUser(slug?.value ?? ''),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useGetUserDocumentFile = (userId) =>
  useQuery({
    queryKey: ['user', 'user-document', userId],
    enabled: !!userId,
    queryFn: () => apiUserDocumentFile(userId),
    select: (data) => {
      return data?.data ?? data
    },
  })

export const useGetFilesByType = (userId, type, options = {}) =>
  useQuery({
    queryKey: ['user', 'files', type, userId.value],
    queryFn: () => apiUserDocumentFilesByType(userId.value, type),
    select: (data) => data?.data ?? data,
    staleTime: 0,
    ...options,
  })

export const useVerifiedDocumentFileMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...verified }) => apiVerifiedDocs(id, verified),
    onError: (error) => handleError(error),
    ...options,
  })

export const useVerifyUserConsentMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ ...data }) => apiVerifiedConsent(data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useAutoVerifyConsentMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiAutoVerifiedConsent(id, data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useGetUserByIdQuery = (userId, visible) =>
  useQuery({
    queryKey: ['user', userId],
    enabled: !!unref(userId) && visible,
    queryFn: () => apiGetUserById(unref(userId)),
    select: ({ data }) => data,
  })

export const useGetUserMiniByIdQuery = (userId, options = {}) =>
  useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiGetUserMiniById(unref(userId)),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useGetMethodOfIntroductionsQuery = (options = {}) =>
  useQuery({
    queryKey: ['user', 'method-of-introduction'],
    queryFn: () => apiGetMethodOfIntroductions(),
    select: (data) => {
      return data?.data ?? data
    },
    ...options,
  })

export const useGetServesQuery = (options = {}) =>
  useQuery({
    queryKey: ['user', 'serves'],
    queryFn: () => apiGetServes(),
    select: (data) => {
      return data?.data ?? data
    },
    ...options,
  })

export const useGetUserByRoleQuery = (options = {}) =>
  useQuery({
    queryKey: ['user', 'roles'],
    queryFn: () => apiGetAllRoles(),
    select: (data) => {
      return data?.data ?? data
    },
    ...options,
  })

export const useGetProvincesQuery = (options = {}) =>
  useQuery({
    queryKey: ['provinces'],
    queryFn: () => apiGetAllProvinces(),
    select: (data) => {
      return data?.data ?? data
    },
    ...options,
  })

export const useGetUserStatusQuery = (options = {}) =>
  useQuery({
    queryKey: ['user', 'status'],
    queryFn: () => apiGetUserStatus(),
    select: (response) => {
      const data = response?.data ?? response
      if (!data || typeof data !== 'object') return []

      const results = []

      function flattenObject(obj) {
        Object.keys(obj).forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const item = obj[key]
            if (!item || typeof item !== 'object') return

            const keys = Object.keys(item)
            if (keys.includes('id')) {
              results.push({
                title: item.title,
                value: item.id,
                id: item.id,
                slug: item.slug ?? item.id,
                color: item.color,
              })
            } else if (['cancel', 'problem', 'credit', 'service'].includes(key)) {
              flattenObject(item)
            }
          }
        })
      }

      flattenObject(data)
      return results
    },
    ...options,
  })

export const useGetCitiesOfProvinceQuery = (selectedProvince, options) =>
  useQuery({
    queryKey: ['city', selectedProvince],
    queryFn: () => apiGetCitiesOfProvince(selectedProvince.value),
    select: ({ data }) => ({
      ...data,
      items: data.items.map((city) => ({
        ...city,
        hasArea: city.id === 373,
      })),
    }),
    ...options,
  })

export const useGetAreasOfCityQuery = (selectedCity, options) =>
  useQuery({
    queryKey: ['area', selectedCity],
    queryFn: () => apiGetAreasOfCity(selectedCity.value),
    select: ({ data }) => data,
    ...options,
  })

export const useGetEnumsQuery = (filters, options) =>
  useQuery({
    queryKey: ['enums', filters],
    queryFn: () => apiGetEnums({ enums: filters.value }),
    select: (data) => {
      return data.data[Object.keys(data.data)]
    },
    ...options,
  })

export const useGetBatchEnumsQuery = (enumKeys, options = {}) =>
  useQuery({
    queryKey: ['enums', 'batch', enumKeys],
    queryFn: () => apiGetEnums({ enums: unref(enumKeys) }),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useGetBanksQuery = (options) =>
  useQuery({
    queryKey: ['banks'],
    queryFn: () => apiGetBanks(),
    select: ({ data }) => data,
    ...options,
  })

export const useGetUserTransactionsQuery = (filters) =>
  useInfiniteQuery({
    queryKey: ['user', 'transactions', filters],
    queryFn: ({ pageParam = { page: 1 } }) => apiGetUserTransactions({ ...filters, ...pageParam }),
    select: ({ pages, pageParams }) => ({
      pages,
      pageParams,
    }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      const currentLength = lastPage.data.items.length
      const expectedLength = pages[0]?.data.items.length || 10

      if (currentLength < expectedLength) return null
      return { page: pages.length + 1 }
    },
    placeholderData: (previousData) => previousData,
  })

export const useUpdateTransaction = () => {
  return useMutation({
    mutationFn: ({ id, data }) => apiUpdateTransaction(id, data),
  })
}

export const useGetUserByIdMutation = () =>
  useMutation({
    mutationFn: (userId) => apiGetUserById(userId),
  })

export const useCreateUserMutation = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiCreateUser(data),
    onError: (err) => handleError(err),
    ...options,
  })

export const useUpdateUserMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiUpdateUser(id, data),
    onError: (err) => handleError(err),
    ...options,
  })

export const useLoginImpersonate = () =>
  useMutation({
    mutationFn: ({ userId }) => apiImpersonate(userId),
  })

export const useImpersonateMyTooth = () =>
  useMutation({
    mutationFn: ({ mobile }) => apiImpersonateMyTooth(mobile),
  })

export const useUpdateMedicalInfo = () =>
  useMutation({
    mutationFn: ({ userId, ...payload }) => apiUpdateMedicalInfo(userId, payload),
    onError: (err) => handleError(err || 'خطا در ثبت اطلاعات پزشکی'),
  })

export const useRecreateMutation = () =>
  useMutation({
    mutationFn: ({ id }) => apiRecreateUser(id),
  })

export const useApiGetUserQuickMessages = (userId, options) =>
  useQuery({
    queryKey: ['setting', 'quickMessages', userId],
    queryFn: () => apiGetQuickMessage(unref(userId)),
    select: (data) => data.data ?? data,
    ...options,
  })

export const useSendSmsToMobileMutation = () =>
  useMutation({
    mutationFn: ({ mobile, message }) => apiSendSmsToMobile(mobile, message),
  })

export const useUpdateUserRoleMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiUpdateUserRole(id, data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useApiSendClinicInfo = () =>
  useMutation({
    mutationFn: ({ ...data }) => apiSendClinicInformation(data),
  })

export const useUserExistMutation = () =>
  useMutation({
    mutationFn: ({ mobile }) => apiCheckUserExist(mobile),
  })

export const useBatchUpdateMutation = () =>
  useMutation({
    mutationFn: ({ ...data }) => apiUserBatchUpdate(data),
    onError: (error) => handleError(error),
  })

export const useExportExcelMutation = () =>
  useMutation({
    mutationFn: (data) => apiExportExcel(data),
  })

export const useChangeUserLevelMutation = () =>
  useMutation({
    mutationFn: ({ id, isVip }) => apiChangeLevel(id, isVip),
  })

export const usePostPosPaymentMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ data, signal }) => apiPostPosPayment(data, signal),
    ...options,
  })

export const useGetPosDevicesQuery = (options = {}) =>
  useQuery({
    queryKey: ['pos', 'devices'],
    queryFn: () => apiGetPosDevices(),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const usePostPosInquiryMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ data, signal }) => apiPostPosInquiry(data, signal),
    ...options,
  })

export const useCreatePaymentMutation = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiCreatePayment(data),
    ...options,
  })

export const useGetManualPaymentConfigQuery = (options = {}) =>
  useQuery({
    queryKey: ['manual-payment', 'config'],
    queryFn: () => apiGetManualPaymentConfig(),
    select: (data) => data?.data ?? data,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: false,
    ...options,
  })

export const useCreateManualPaymentMutation = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiCreateManualPayment(data),
    ...options,
  })

export const useGetFileStatusQuery = (options = {}) =>
  useQuery({
    queryKey: ['fileStatus'],
    queryFn: () => apiGetFileStatus(),
    select: (data) => data.data ?? data,
    ...options,
  })

export const useCreatePaymentLinkMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ userId, data }) => apiCreatePaymentLink(userId, data),
    ...options,
  })

export const useCreatePaymentLinkLegacyMutation = () =>
  useMutation({
    mutationFn: ({ treatmentPlanId, data }) => apiCreatePaymentLinkLegacy(treatmentPlanId, data),
  })

export const useApiSaveUserTags = (options = {}) =>
  useMutation({
    mutationFn: ({ userId, tagIds }) => apiGetUserTags({ userId, tagIds }),
    onError: (error) => handleError(error),
    ...options,
  })

export const useApiSendOpgRequest = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiSendOpgRequest(id, data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useApiSendDrugPrescription = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiSendDrugPrescription(id, data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useGetUserChatsSummaryQuery = (userId, options = {}) =>
  useQuery({
    queryKey: computed(() => ['user', unref(userId), 'chats-summary']),
    queryFn: () => apiGetUserChatsSummary(unref(userId)),
    select: (data) => data?.data ?? data,
    staleTime: 0,
    ...options,
  })

export const useGetUserCallsSummaryQuery = (userId, options = {}) =>
  useQuery({
    queryKey: computed(() => ['user', unref(userId), 'calls-summary']),
    queryFn: () => apiGetUserCallsSummary(unref(userId)),
    select: (data) => data?.data ?? data,
    staleTime: 0,
    ...options,
  })

export const useGetUserFinancialSummaryQuery = (userId, options = {}) =>
  useQuery({
    queryKey: computed(() => ['user', unref(userId), 'financial-summary']),
    queryFn: () => apiGetUserFinancialSummary(unref(userId)),
    select: (data) => data?.data ?? data,
    enabled: computed(() => !!unref(userId)),
    ...options,
  })

export const useGetDoctorReviewQuery = (filters, options = {}) =>
  useQuery({
    queryKey: ['user', 'treatment-plan', 'doctor-review', filters],
    queryFn: () => apiGetDoctorReview({ ...filters.value }),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useGetEnumsBySlug = (slug, options = {}) =>
  useQuery({
    queryKey: ['enums', slug],
    queryFn: () => apiGetEnumBySlug(unref(slug)),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useUserMergeMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ ...data }) => {
      return apiUserMerge(data)
    },
    onError: (error) => handleError(error),
    ...options,
  })

export const useCreateUserChequesMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ userId, cheques }) => apiCreateUserCheques(userId, { cheques }),
    onError: (error) => handleError(error),
    ...options,
  })

export const useDeleteUserChequeMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ userId, chequeId }) => apiDeleteUserCheque(userId, chequeId),
    onError: (error) => handleError(error),
    ...options,
  })

export const useCreateBetaInstallmentsMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ userId, betaUserId, installments, betaContractTypeId }) =>
      apiCreateBetaInstallments(userId, { betaUserId, installments, betaContractTypeId }),
    onError: (error) => handleError(error),
    ...options,
  })

export const useGetUserAccountingQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['user', 'accounting', filters],
    queryFn: ({ pageParam = { page: 1 } }) => apiGetUserAccounting({ ...filters, ...pageParam }),
    select: ({ pages, pageParams }) => ({ pages, pageParams }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      const items = lastPage?.data?.items?.data
      if (!Array.isArray(items) || items.length === 0) return null
      return { page: pages.length + 1 }
    },
    placeholderData: (previousData) => previousData,
    ...options,
  })

export const useGetUserPaymentObligationsQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['user', 'payment-obligations', filters],
    queryFn: ({ pageParam = { page: 1 } }) =>
      apiGetPaymentObligations(filters['filter[user_id]'], { ...filters, ...pageParam }),
    select: ({ pages, pageParams }) => ({ pages, pageParams }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      const items = lastPage?.data?.items?.data
      if (!Array.isArray(items) || items.length === 0) return null
      return { page: pages.length + 1 }
    },
    ...options,
  })

export const useUserBarterMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ ...data }) => apiCreateUserBarter(data),
    ...options,
  })

export const useConfirmUserBarterMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ barterId, code }) => apiConfirmUserBarter(barterId, code),
    ...options,
  })

export const useResendUserBarterOtpMutation = (options = {}) =>
  useMutation({
    mutationFn: (barterId) => apiResendUserBarterOtp(barterId),
    ...options,
  })

export const useGetRefundRequestsQuery = (userId, options = {}) =>
  useInfiniteQuery({
    queryKey: ['refund-requests', userId],
    queryFn: ({ pageParam = { page: 1 } }) => apiGetRefundRequests(unref(userId), pageParam),
    select: ({ pages, pageParams }) => ({ pages, pageParams }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      const data = lastPage?.data
      const items = data?.items?.data ?? data?.items ?? data
      if (!Array.isArray(items) || items.length === 0) return null
      return { page: pages.length + 1 }
    },
    enabled: computed(() => !!unref(userId)),
    placeholderData: (previousData) => previousData,
    ...options,
  })

export const useCreateRefundRequestMutation = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiCreateRefundRequest(data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useApproveRefundRequestMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiApproveRefundRequest(id, data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useRejectRefundRequestMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiRejectRefundRequest(id, data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useGetUserWarrantiesQuery = (userId, options = {}) =>
  useQuery({
    queryKey: ['user-warranty', userId],
    queryFn: () => apiGetUserWarranties(unref(userId)),
    enabled: computed(() => !!unref(userId)),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useUpdateUserWarrantyMutation = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiUpdateUserWarrantyStatus(data),
    onError: (error) => handleError(error || 'خطا در تغییر وضعیت ضمانتنامه'),
    ...options,
  })
