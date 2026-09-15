import { getIndustrySlug } from '@/utils/get-industry-slug'
import { request } from '@/data/services'

const entityName = getIndustrySlug()

export const apiCreateQuestion = (data) =>
  request.post(`v1/${entityName}/serves/questions`, data, { hadSnakize: true })

export const apiUpdateQuestion = (data, questionId) =>
  request.put(`v1/${entityName}/serves/questions/${questionId}`, data, { hadSnakize: true })

export const apiDeleteQuestion = (questionId) =>
  request.delete(`v1/${entityName}/serves/questions/${questionId}`)

export const apiGetServes = () => request.get(`v1/${entityName}/serves`)

export const serveMini = (params) => request.get(`v1/${entityName}/serves/minimal`, { params })

export const apiUpdateServeItem = (serveIndustryId, items) =>
  request.post(`v1/${entityName}/serves/${serveIndustryId}/items`, items, { hadSnakize: true })

export const apiDeleteServeItem = (serveIndustryId, serveIndustryItemId) =>
  request.delete(`v1/${entityName}/serves/${serveIndustryId}/items/${serveIndustryItemId}`)

export const installmentSettingList = () => request.get('v1/financial/installment')

export const createInstallment = (data) =>
  request.post('v1/financial/installment', data, { hadSnakize: true })

export const updateInstallment = (data, id) =>
  request.put(`v1/financial/installment/${id}`, data, { hadSnakize: true })

export const deleteInstallment = (id) => request.delete(`v1/financial/installment/${id}`)
