import { request } from '@/data/services'
import { entityName } from '@/utils/get-industry-slug'

export const apiGetServes = (params) =>
  request.get(`v1/${entityName}/serves`, { params, hadSnakize: true })

export const apiGetServesWithQuestions = (params) =>
  request.get(`v1/${entityName}/serves/with-questions`, { params, hadSnakize: true })

export const apiGetServesByKey = (key) =>
  request.get(`v1/treatment-plan/view/serves`, { params: { key } })

export const apiGetUserById = (id) => request.get(`v1/user/${id}`)

export const apiGetInstallments = () => request.get('v1/financial/installment')

export const apiGetTreatmentPlanById = (id) => request.get(`v1/treatment-plan/${id}`)

export const apiGetTreatmentPlanByKey = (key) =>
  request.get(`v1/treatment-plan/view`, { params: { key } })

export const apiCreateTreatmentPlan = (data) => request.post('v2/treatment-plan', data)

export const apiUpdateTreatmentPlan = (data, treatmentPlanId) =>
  request.put(`v2/treatment-plan/${treatmentPlanId}`, data)

export const apiFromDraftTreatmentPlan = (data, treatmentPlanId) => {
  return request.post(`v2/treatment-plan/from-draft/${treatmentPlanId}`, data)
}

export const apiActivateTreatmentPlan = (treatmentId) =>
  request.post(`v1/treatment-plan/${treatmentId}/activate`)

export const apiGetTreatmentPlanHistory = (treatmentPlanId, { pageParam }) =>
  request.get(`v1/treatment-plan/${treatmentPlanId}/history`, { params: pageParam })

export const apiGetUserActivateTreatmentPlan = (userId) =>
  request.get(`v1/user/${userId}/treatment-plan/active`)

export const apiExtraditePrepay = (id, data) =>
  request.post(`v1/treatment-plan/financial/${id}/extradition`, data, { hadSnakize: true })

export const apiCompleteTreatmentPlan = (treatmentId) =>
  request.post(`v1/treatment-plan/${treatmentId}/complete`)

export const apiGetPreTreatmentPlan = (params) => request.get('v2/treatment-plan/draft', { params })

export const apiCreatePreTreatmentPlan = (data) =>
  request.post('v2/treatment-plan/draft', data, { hadSnakize: true })

export const apiPerformTreatmentPlan = (treatmentPlanId, data) =>
  request.post(`v2/treatment-plan/${treatmentPlanId}/perform`, data, { hadSnakize: true })

export const apiUpdateTpDescription = (treatmentPlanId, itemId, data) =>
  request.put(`v2/treatment-plan/${treatmentPlanId}/perform/items/${itemId}`, data, {
    hadSnakize: true,
  })

export const apiGetTreatmentPlanDescription = (tpId, filters) =>
  request.get(`v2/treatment-plan/${tpId}/performed-serves`, { params: filters })

export const apiDeleteTpDescription = (tpdId, itemId) =>
  request.delete(`v2/treatment-plan/${tpdId}/perform/items/${itemId}`)

export const apiUploadTpVoice = (id, data) =>
  request.post(`v1/treatment-plan/${id}/voice`, data, { hadSnakize: true })

export const apiGetTreatmentPlanCredit = (treatmentPlanId, data) =>
  request.post(`v2/treatment-plan/${treatmentPlanId}/credit`, data, { hadSnakize: true })

export const apiGetTreatmentPlanTotalCredit = (treatmentPlanId) =>
  request.get(`v2/treatment-plan/${treatmentPlanId}/credit-total`, { hadSnakize: true })

export const apiGetTreatmentPlan = (filters) =>
  request.get('v1/treatment-plan', { params: filters })

export const apiGetTotalTreatmentPlanCount = (filters) =>
  request.get('v1/treatment-plan?return_count=1', { params: filters })

export const apiTreatmentPlanCreditLevel = (treatmentPlanId, body) =>
  request.put(`v1/treatment-plan/${treatmentPlanId}/credit-level`, body, { hadSnakize: true })

export const financialConfirmation = (treatmentId, data) =>
  request.post(`v1/treatment-plan/financial/${treatmentId}/confirmation`, data, {
    hadSnakize: true,
  })

export const attachFinancialFile = (treatmentId, data) =>
  request.post(`v1/treatment-plan/${treatmentId}/file`, data, { hadSnakize: true })

export const apiExportPreTreatmentPlanExcel = (filters) =>
  request.get('v2/treatment-plan/draft/export', { params: filters, responseType: 'blob' })

export const apiTransmissionPrepay = ({ originId, destinationId }) =>
  request.post(`v1/treatment-plan/transfer/${originId}/${destinationId}`)

export const apiExtraditionTreatmentPlan = (treatmentId, data) =>
  request.post(`v1/treatment-plan/financial/${treatmentId}/extradition`, data, { hadSnakize: true })

export const sendTreatmentPlanLink = (treatmentId) =>
  request.get(`v1/treatment-plan/${treatmentId}/send-link`)

export const apiDeleteTreatmentPlan = (treatmentPlanId) =>
  request.delete(`v1/treatment-plan/${treatmentPlanId}`)

export const apiGetDoctorReviewsList = (params) => request.get('v1/doctor-reviews', { params })

export const apiCalculateCheques = (data) =>
  request.post('v1/treatment-plan/cheques/calculate', data, { hadSnakize: true })

export const apiGetDoctorDailyReport = (date, docId) =>
  request.get(`v2/treatment-plan/${date}/${docId}/print`)

export const apiGetUserTpWarranty = (tpId) => request.get(`v2/treatment-plan/${tpId}/warranties`)

export const apiUpdateUserTpWarrantyStatus = (data) =>
  request.post(`v2/treatment-plan/warranty/toggle`, data, { hadSnakize: true })

export const apiCalculateCouponCode = (data) =>
  request.post('v1/coupon/calculate', data, { hadSnakize: true })

export const apiGetTreatmentPlanBookings = (params) => request.get('v1/booking', { params })

export const apiAttachBookingVoice = (bookingId, data) =>
  request.post(`v2/booking/${bookingId}/voice`, data, { hadSnakize: true })

export const apiGetBookingServes = (bookingId) => request.get(`v2/booking/${bookingId}/serves`)
