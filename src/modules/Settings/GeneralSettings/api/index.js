import { request } from '@/data/services/index'

export const saveSettings = (data, key, options = {}) =>
  request.post(`v1/setting/general/${key}`, data, { hadSnakize: true, ...options })

export const getSettings = (key, params) => request.get(`v1/setting/general/${key}`, { params })

export const surveyList = () => request.get('v1/survey/list')

export const getDoctorWorkTime = (doctorId) => request.get(`v1/user/${doctorId}/work-time`)

export const setDoctorWorkTime = (doctorId, body) =>
  request.put(`v1/user/${doctorId}/work-time`, body, { hadSnakize: true })

export const getTagsApi = () => request.get('v1/user/tags')

export const createTagApi = (data) => request.post(`v1/user/tags`, data, { hadSnakize: true })

export const updateTagApi = (id, data) =>
  request.put(`v1/user/tags/${id}`, data, { hadSnakize: true })

export const deleteTagApi = (id) => request.delete(`v1/user/tags/${id}`)

export const apiGetAnnouncements = (params) => request.get('v1/announcement', { params })

export const apiCreateAnnouncement = (data) =>
  request.post('v1/announcement', data, { hadSnakize: true })

export const apiUpdateAnnouncement = (announcementId, data) =>
  request.put(`v1/announcement/${announcementId}`, data, { hadSnakize: true })

export const apiDeleteAnnouncement = (announcementId) =>
  request.delete(`v1/announcement/${announcementId}`)

export const apiGetEligibleWarrantyServes = (params) =>
  request.get('v1/serve-warranty/eligible', { params })

export const apiGetWarrantyServeById = (id, params) =>
  request.get(`v1/serve-warranty/all/${id}`, { params })

export const apiSaveWarrantyServeData = (data) =>
  request.post('v1/serve-warranty/update-months', data, { hadSnakize: true })

export const getIntroductionMethodsApi = (params) =>
  request.get('v1/introduction-methods', { params: { per_page: 35, ...params } })

export const createIntroductionMethodApi = (data) =>
  request.post('v1/introduction-methods', data, { hadSnakize: true })

export const updateIntroductionMethodApi = (id, data) =>
  request.put(`v1/introduction-methods/${id}`, data, { hadSnakize: true })

export const deleteIntroductionMethodApi = (id) => request.delete(`v1/introduction-methods/${id}`)
