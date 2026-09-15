import { request } from '@/data/services'
import { getIndustrySlug } from '@/utils/get-industry-slug'

const entityName = getIndustrySlug()

export const apiGetIndustrySetting = () => request.get(`v1/user/${entityName}/current`)

export const apiIndustryBranches = (params) => request.get(`v1/${entityName}/branches`, { params })

export const apiSetClinicSetting = (data) =>
  request.post(`v1/${entityName}/info`, data, { hadSnakize: true })

export const apiCreateBranch = (data) =>
  request.post(`v1/${entityName}/branches`, data, { hadSnakize: true })

export const apiUpdateBranch = (data, branchId) =>
  request.put(`v1/${entityName}/branches/${branchId}`, data, { hadSnakize: true })

export const apiDeleteBranch = (branchId) => request.delete(`v1/${entityName}/branches/${branchId}`)

export const apiGetWeekday = () => request.get(`v1/setting/general/workTime`)

export const apiSetWorkTimeWeekday = (data) =>
  request.post(`v1/setting/general/workTime`, data, { hadSnakize: true })

export const apiGetWorkTimeCalendar = (params) => request.get(`v1/work-time`, { params })

export const apiSetWorkTimeCalendar = (data) =>
  request.post(`v1/work-time`, data, { hadSnakize: true })
export const apiGetRooms = (params) => request.get(`v1/user/rooms`, { params })
export const apiCreateRoom = (data) => request.post(`v1/user/rooms`, data, { hadSnakize: true })
export const apiUpdateRoom = (roomId, data) =>
  request.put(`v1/user/rooms/${roomId}`, data, { hadSnakize: true })
export const apiDeleteRoom = (roomId) => request.delete(`v1/user/rooms/${roomId}`)

export const apiGetBranchDoctorList = (params) => request.get('v1/doctor-working-hours', { params })

export const apiSetDoctorWorkingHours = (data) =>
  request.post('v1/doctor-working-hours', data, { hadSnakize: true })

export const apiSetBranchDoctor = (data) =>
  request.post('v1/setting/branch-doctors/add', data, { hadSnakize: true })

export const apiDeleteBranchDoctor = (data) =>
  request.post('v1/setting/branch-doctors/remove', data, { hadSnakize: true })

export const apiGetAnnouncements = (params) => request.get('v1/announcement', { params })

export const apiCreateAnnouncement = (data) =>
  request.post('v1/announcement', data, { hadSnakize: true })

export const apiUpdateAnnouncement = (announcementId, data) =>
  request.put(`v1/announcement/${announcementId}`, data, { hadSnakize: true })

export const apiDeleteAnnouncement = (announcementId) =>
  request.delete(`v1/announcement/${announcementId}`)

export const apiGetBranchStatusHistory = (branchId) =>
  request.get(`v1/${entityName}/branches/${branchId}/history`)

export const apiUpdateBranchStatus = (data, branchId) =>
  request.put(`v1/${entityName}/branches/${branchId}/status`, data, { hadSnakize: true })

export const apiGetBranchDeactivationImpact = (branchId) =>
  request.get(`v1/${entityName}/branches/${branchId}/deactivation-impact`)
