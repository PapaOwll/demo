import { request } from '@/data/services'
import { getIndustrySlug } from '@/utils/get-industry-slug'

const entityName = getIndustrySlug()

export const apiGetContacts = (filters) => request.get('v1/contact', { params: filters })
export const apiGetContact = (contactId) => request.get(`v1/contact/${contactId}`)

export const apiGetContactsTotalCount = (filters) =>
  request.get('v1/contact?return_count=1', { params: filters })

export const apiCreateContact = (data) => request.post('v1/contact', data, { hadSnakize: true })

export const apiUpdateContact = (contactId, data) =>
  request.put(`v1/contact/${contactId}`, data, { hadSnakize: true })

export const apiDeleteContact = (contactId) => request.delete(`v1/contact/${contactId}`)

export const getBranches = () => request.get(`v1/${entityName}/branches`)

export const contactResults = () => request.get('v1/contact/results')

export const apiGetContactTypes = () =>
  request.get('v1/client/enums', { params: { enums: 'ContactTypeEnum' } })

export const apiGetAudioFile = (file) =>
  request.get(`v1/contact/recordings/${file}`, {
    responseType: 'blob',
    timeout: 120_000,
  })
