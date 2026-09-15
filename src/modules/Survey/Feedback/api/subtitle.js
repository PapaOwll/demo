import { request } from '@/data/services'

export const getTvSubtitleList = (params) => request.get('v1/tv-subtitle', { params })

export const getTvSubtitle = (id) => request.get(`v1/tv-subtitle/${id}`)

export const createTvSubtitle = (data) => request.post('v1/tv-subtitle', data)

export const updateTvSubtitle = (id, data) => request.put(`v1/tv-subtitle/${id}`, data)

export const deleteTvSubtitle = (id) => request.delete(`v1/tv-subtitle/${id}`)
