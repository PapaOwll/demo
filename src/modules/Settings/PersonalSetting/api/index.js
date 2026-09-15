import { request } from '@/data/services'

export const getPersonalSetting = (key) => request.get(`v1/setting/personal/${key}`)
export const setPersonalSetting = (key, data) =>
  request.post(`v1/setting/personal/${key}`, data, { hadSnakize: true })
