import { request } from '@/data/services'

export const apiGetCrmAnnouncements = (params = {}, config = {}) =>
  request.get('v1/announcement/crm', { ...config, params })
