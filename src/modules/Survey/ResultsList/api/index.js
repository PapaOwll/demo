import { request } from '@/data/services'

export const apiGetResultsList = (filters) => request.get('v1/survey/results', { params: filters })
export const apiGetTotalSurveyResultCount = (filters) =>
  request.get('v1/survey/results?return_count=1', { params: filters })
