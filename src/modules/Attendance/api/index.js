import { request } from '@/data/services'

export const apiGetAttendance = (filters) => request.get('v1/attendance', { params: filters })

export const apiCheckIn = (data) =>
  request.post('v1/attendance/check-in', data, { hadSnakize: true })

export const apiCheckOut = (attendanceId) =>
  request.post(`v1/attendance/${attendanceId}/check-out`, {}, { hadSnakize: true })

export const apiUpdateAttendance = (attendanceId, data) =>
  request.put(`v1/attendance/${attendanceId}`, data, { hadSnakize: true })

export const apiGetAttendanceTotalCount = (filters) =>
  request.get('v1/attendance?return_count=1', { params: filters })

export const apiDeleteAttendance = (attendanceId) => request.delete(`v1/attendance/${attendanceId}`)
