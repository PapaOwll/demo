import { snakize } from '@/utils/convert-to-camel-snake'
import { getIndustrySlug } from '@/utils/get-industry-slug'
import { request } from '@/data/services'

const entityName = getIndustrySlug()
export const apiGetUsers = (filters) => {
  return request.get('v1/user/index', { params: filters })
}

export const apiGetAdvisor = (filters) => request.get('v1/user/advisors', { params: filters })

export const apiGetUsersByPhoneNumber = (phoneNumber) =>
  request.get(`v1/user/${phoneNumber}/search`)

export const apiGetCurrentUser = (slug) => request.get(`v1/user/${slug}/current`)

export const apiUserDocumentFile = (userId) => request.get(`v1/user/${userId}/files`)

export const apiUserDocumentFilesByType = (userId, type) =>
  request.get(`v1/user/${userId}/files/${type}`)

export const apiVerifiedDocs = (id, data) =>
  request.put(`v1/file/${id}/verification`, data, { hadSnakize: true })

export const apiAutoVerifiedConsent = (id, data) =>
  request.post(`v2/treatment-plan/${id}/consent`, data, { hadSnakize: true })

export const apiVerifiedConsent = (data) =>
  request.put('v2/consent-file/status', data, { hadSnakize: true })

export const apiGetUserById = (userId) => request.get(`v1/user/${userId}/show`)

export const apiGetUserMiniById = (userId) => request.get(`v1/user/${userId}/show`)

export const apiGetUsersTotalCount = (filters) =>
  request.get('v1/user/index?return_count=1', { params: filters })

export const apiGetAllRoles = () => request.get('v1/user/roles')

export const apiCreateUser = (payload) => request.post('v1/user', payload, { hadSnakize: true })

export const apiUpdateUser = (userId, payload) =>
  request.put(`v1/user/${userId}`, payload, { hadSnakize: true })

export const apiGetMethodOfIntroductions = (filters) =>
  request.get('v1/user/introduction-methods', { params: filters })

export const apiGetServes = () => request.get(`v1/${entityName}/serves`)

export const apiGetAllProvinces = () => request.get(`v1/client/provinces`)

export const apiGetCitiesOfProvince = (provinceId) => request.get(`v1/client/cities/${provinceId}`)

export const apiGetAreasOfCity = (cityId) => request.get(`v1/client/areas/${cityId}`)

export const apiGetUserStatus = () => request.get('v1/user/status')

export const apiGetBanks = () => request.get('v1/financial/banks')

export const apiImpersonate = (userId) => request.post(`v1/user/${userId}/impersonate`)

export const apiImpersonateMyTooth = (mobile) => request.post('v1/user/my-tooth', { mobile })

export const apiGetEnums = (params) => request.get('v1/client/enums', { params })

export const apiGetEnumBySlug = (slug) => request.get(`v1/client/enums/${slug}`)

export const apiGetUserHistory = (filters) => request.get('v1/user/history', { params: filters })

export const apiGetRegisterMedicalInfo = (userId) => request.get(`v1/user/${userId}/medical-info`)

export const apiRecreateUser = (userId) => request.post(`v1/user/${userId}/recreate`)

export const apiUpdateMedicalInfo = (userId, payload) =>
  request.put(`v1/user/${userId}/medical-info`, payload, { hadSnakize: true })
export const apiGetQuickMessage = (userId) => request.get(`/v1/user/${userId}/quick-messages`)

export const apiSendSmsToMobile = (mobile, message) => {
  return request.post('v1/user/send-sms', { mobile, message })
}
export const apiUpdateUserRole = (userId, data) =>
  request.put(`v1/user/${userId}/role`, data, { hadSnakize: true })

export const apiSendClinicInformation = (body) =>
  request.post(`v1/user/${entityName}/send-contact`, body)
export const apiCheckUserExist = (mobile) => request.get('v1/user/exist', { params: { mobile } })
export const apiUserBatchUpdate = (data) =>
  request.post('v1/user/mass-update', data, { hadSnakize: true })
export const apiExportExcel = (filters) =>
  request.get('v1/user/export', { params: filters, responseType: 'blob' })
export const apiChangeLevel = (userId, isVip) => request.get(`v1/user/${userId}/vip/${isVip}`)

export const apiGetUserTransactions = (params) => {
  return request.get('v1/transaction', { params }).then((response) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(response)
      }, 1000)
    })
  })
}

export const apiPostTransaction = (data) => request.post('v1/transaction', data)
export const apiUpdateTransaction = (id, data) => request.put(`v1/transaction/${id}`, snakize(data))

export const apiPostPosPayment = (data, signal) =>
  request.post(`v1/financial/payment/pos/pay`, data, { signal, timeout: 150_000 })

export const apiGetPosDevices = () => request.get(`v1/financial/payment/pos/devices`)

export const apiPostPosInquiry = (data, signal) =>
  request.post(`v1/financial/payment/pos/inquiry`, data, { signal })

// NEW POS/BACKEND PAYMENT API
export const apiCreatePayment = (data) => request.post('v1/financial/payment/create', data)

// MANUAL OUT-OF-SYSTEM PAYMENT (per-branch)
export const apiGetManualPaymentConfig = () =>
  request.get('v1/financial/payment/manual/config', { skipGlobalErrorHandling: true })

export const apiCreateManualPayment = (data) =>
  request.post('v1/financial/payment/manual', data, { skipGlobalErrorHandling: true })

// NEW USER-BASED PAYMENT LINK API
export const apiCreatePaymentLink = (userId, data) =>
  request.post(`v1/user/${userId}/payment/link`, data)

// LEGACY TREATMENT-PLAN BASED API (DEPRECATED)
export const apiCreatePaymentLinkLegacy = (treatmentPlanId, data) =>
  request.post(`v1/treatment-plan/financial/${treatmentPlanId}/payment/link`, data)

export const apiGetFileStatus = () => request.get(`v1/file/status`)

export const apiGetUserTags = ({ userId, tagIds }) =>
  request.post(`v1/user/${userId}/tags/sync`, { tagIds }, { hadSnakize: true })

export const apiSendOpgRequest = (user, data) =>
  request.post(`v1/user/${user}/prescription`, data, { hadSnakize: true })

export const apiGetOpgRequest = (userId) => request.get(`v1/user/${userId}/prescription`)

export const apiGetConversationChannels = () => request.get('v1/user/conversations/channels')

export const apiGetUserConversations = (userId, params) =>
  request.get(`v1/user/${userId}/conversations`, { params })

export const apiGetUserChatsSummary = (userId) => request.get(`v1/user/${userId}/chat-summary`)

export const apiGetUserCallsSummary = (userId) => request.get(`v1/user/${userId}/call-summary`)

export const apiGetDoctorReview = (params) => request.get('v1/doctor-reviews', { params })

export const apiUserMerge = (data) => request.post('v1/user/merge', data, { hadSnakize: true })

export const apiGetUserCheques = (userId) => request.get(`v1/user/${userId}/cheques`)

export const apiCreateUserCheques = (userId, data) =>
  request.post(`v1/user/${userId}/cheques`, data, { hadSnakize: true })

export const apiDeleteUserCheque = (userId, chequeId) =>
  request.delete(`v1/user/${userId}/cheques/${chequeId}`)

export const apiCreateBetaInstallments = (userId, data) =>
  request.post(`v1/user/${userId}/beta-installments`, data, { hadSnakize: true })

export const apiGetUserAccounting = (params) => request.get('v2/accounting', { params })

export const apiGetPaymentObligations = (userId, params) =>
  request.get(`v1/user/${userId}/payment-obligations`, { params })

export const apiDeleteBetaInstallments = (ids) =>
  request.delete('v1/beta-installments', { data: { ids } })

export const apiUpdateInstallmentStatus = (id, statusId) =>
  request.put(`v1/user-installment/${id}/status`, { status_id: statusId })

export const apiDeleteAccountingItem = (autoid) => request.delete(`v1/accounting/${autoid}`)

export const apiCreateUserBarter = (data) =>
  request.post('v1/financial/barter', data, { hadSnakize: true })

export const apiConfirmUserBarter = (barterId, code) =>
  request.post(`v1/financial/barter/${barterId}/confirm`, { code })

export const apiResendUserBarterOtp = (barterId) =>
  request.post(`v1/financial/barter/${barterId}/resend-otp`)

export const apiGetRefundRequests = (userId, params = {}) =>
  request.get(`v1/refund-requests/user/${userId}`, { params })

export const apiCreateRefundRequest = (data) =>
  request.post('v1/refund-requests', data, { hadSnakize: true })

export const apiApproveRefundRequest = (id, data) =>
  request.post(`v1/refund-requests/${id}/approve`, data, { hadSnakize: true })

export const apiRejectRefundRequest = (id, data) =>
  request.post(`v1/refund-requests/${id}/reject`, data, { hadSnakize: true })

export const apiGetUserFinancialSummary = (userId) =>
  request.get(`v1/user-installments/${userId}/financial-summary`)

export const apiGetUserWarranties = (userId) => request.get(`v2/user/${userId}/warranties`)

export const apiUpdateUserWarrantyStatus = (data) =>
  request.post(`v2/warranty/toggle`, data, { hadSnakize: true })
