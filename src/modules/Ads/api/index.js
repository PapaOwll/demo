import { request } from '@/data/services'
import { computed } from 'vue'
import { getIndustrySlug } from '@/utils/get-industry-slug'

const industrySlug = computed(() => getIndustrySlug())
export const apiGetCampaigns = (filters) =>
  request.get(`v1/${industrySlug.value}/campaigns`, { params: { per_page: 10, ...filters } })
export const apiCreateCampaign = (data) => {
  return request.post(`v1/${industrySlug.value}/campaigns`, data, { hadSnakize: true })
}
export const apiUpdateCampaign = (campaignId, data) => {
  return request.put(`v1/${industrySlug.value}/campaigns/${campaignId}`, data, { hadSnakize: true })
}
export const checkImports = (data) => {
  return request.post(`v1/user/check-user-import`, data, { hadSnakize: true })
}
export const importUsers = (data) => {
  return request.post('v1/user/user-import', data, { hadSnakize: true })
}
export const imports = (filters) => {
  return request.get('v1/user/import', { params: filters })
}
export const apiGetTotalCampaignCount = (filters) =>
  request.get(`v1/${industrySlug.value}/campaigns?return_count=1`, { params: filters })
export const apiGetTotalImportCount = (filters) =>
  request.get('v1/user/import?return_count=1', { params: filters })
export const apiGetCoupon = (params) => request.get('v1/coupon', { params })

export const apiCreateCoupon = (data) => {
  return request.post('v1/coupon', data, { hadSnakize: true })
}

export const apiUpdateCoupon = (couponId, data) => {
  return request.put(`v1/coupon/${couponId}`, data, { hadSnakize: true })
}

export const apiDeleteCoupon = (couponId) => {
  return request.delete(`v1/coupon/${couponId}`)
}

export const apiGetCouponById = (couponId) => {
  return request.get(`v1/coupon/${couponId}`)
}

export const apiGenerateCouponCode = () => request.get('v1/coupon/generate-code')

export const apiValidateCouponCode = (code) => request.get(`v1/coupon/validate/${code}`)

export const apiToggleActiveCoupon = (id) => request.put(`v1/coupon/${id}/toggle-active`)
