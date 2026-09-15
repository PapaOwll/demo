import { request } from '@/data/services'

export const apiGetGroupAdviser = () => {
  return request.get(`v1/setting/general/provinceBasedAdvisorAssignment`)
}
export const apiGetProvinces = () => {
  return request.get(`v1/client/iran/provinces`)
}
export const apiGetAdvisor = () => {
  return request.get('v1/user/advisors', {
    params: {
      'filter[rolesFilter]': [3, 12, 78, 7].join(','),
    },
  })
}
export const apiPostGroupAdviser = (data) => {
  return request.post(`v1/setting/general/provinceBasedAdvisorAssignment`, data)
}
