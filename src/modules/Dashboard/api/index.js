import { request } from '@/data/services'

export const apiGetReports = (filters = {}, config = {}) =>
  request.get('v1/report', { ...config, params: filters })

export const apiGetAdvisorStatistics = (filters = {}, config = {}) =>
  request.get('v1/report/advisor/statistics', { ...config, params: filters })
