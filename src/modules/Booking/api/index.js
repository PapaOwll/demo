import { request } from '@/data/services'

export const apiGetBookingUsers = (params) => request.get('v1/user/owner/user', { params })
export const apiGetBooking = (bookingId) => request.get(`v1/booking/${bookingId}`)
export const apiCreateBooking = (data) => request.post(`v1/booking`, data, { hadSnakize: true })
export const apiUpdateBooking = (bookingId, data) =>
  request.put(`v1/booking/${bookingId}`, data, { hadSnakize: true })
export const apiDeleteBooking = (bookingId) => request.delete(`v1/booking/${bookingId}`)
export const apiGetVisitUsers = (params) => request.get('v1/booking', { params })
export const apiCreateVisit = (data) => request.post('v1/visit', data, { hadSnakize: true })
export const apiUpdateVisit = (visitId, data) =>
  request.put(`v1/visit/${visitId}`, data, { hadSnakize: true })
export const apiGetVisit = (visitId) => request.get(`v1/visit/${visitId}`)
export const apiSetCoordinator = (ownerId, data) =>
  request.post(`v1/user/owner/${ownerId}/user`, data, { hadSnakize: true })

export const apiDeleteCoordinator = (ownerId, userId) =>
  request.delete(`v1/user/owner/${ownerId}/user/${userId}`)

// this endpoint is not used in the app currently

// export const apiGetOnlineVisitSessionsTimes = (advisorId, date, branchId) =>
//   request.get(`v1/booking/advisor/${advisorId}/online-visit-times/${date}`, {
//     params: {
//       ...(branchId !== undefined && { branch_id: branchId }),
//     },
//   })

export const apiGetOnlineSessions = (date, branchId) =>
  request.get(`v1/booking/advisor/online-visit-times/${date}`, {
    params: {
      ...(branchId !== undefined && { branch_id: branchId }),
    },
  })
export const apiGetPresentVisitSessionTimes = (date, branchId) =>
  request.post('v1/booking/sessions', { date, branch_id: branchId })
export const apiGetVisitTotalCount = (filters) =>
  request.get('v1/booking?return_count=1', { params: filters })
export const apiGetCoordinateTotalCount = (filters) =>
  request.get('v1/user/owner/user?return_count=1', { params: filters })

export const treatmentPlan = (filters) => request.get('v1/treatment-plan', { params: filters })
export const apiGetBookingCalendar = (params) => request.get('v1/booking/calendar', { params })
export const apiBookingCancellation = (bookingId, date) =>
  request.post(`v1/booking/${bookingId}/cancellation`, date)

export const apiGetPatientsWithoutChequeCount = (config = {}) =>
  request.get('v1/booking/patients-without-cheque-count', config)
