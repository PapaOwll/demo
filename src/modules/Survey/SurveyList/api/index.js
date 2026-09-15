import { request } from '@/data/services'

export const apiGetSurveyList = (filters) => request.get('v1/survey/list', { params: filters })

export const apiGetTotalSurveyCount = (filters) =>
  request.get('v1/survey/list?return_count=1', { params: filters })
