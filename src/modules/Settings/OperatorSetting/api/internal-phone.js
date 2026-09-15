import { request } from '@/data/services'

const entityName = JSON.parse(localStorage.getItem('slug-name'))

const internalPhone = (filters) => {
  return request.get(`v1/${entityName}/internal-phones`, { params: filters })
}
const createInternalPhone = (data) => {
  return request.post(`v1/${entityName}/internal-phones`, data, {
    hadSnakize: true,
  })
}
const updateInternalPhone = (phoneNumber, data) => {
  return request.put(`v1/${entityName}/internal-phones/${phoneNumber}`, data, {
    hadSnakize: true,
  })
}
const deleteInternalPhone = (phone) => {
  return request.delete(`v1/${entityName}/internal-phones/${phone}`)
}
export const apiGetTotalInternalPhoneCount = (filters = {}) =>
  request.get(`v1/${entityName}/internal-phones?return_count=1`, { params: filters })
export { internalPhone, createInternalPhone, updateInternalPhone, deleteInternalPhone }
