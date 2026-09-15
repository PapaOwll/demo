import { request } from '@/data/services'

export const apiGetRestTime = () => {
  return request.get(`v1/setting/general/employeeBreakTimeRange`)
}

export const apiPostRestTime = (data) => {
  return request.post(`v1/setting/general/employeeBreakTimeRange`, data)
}
