import { request } from '@/data/services'

export const apiGetCalendar = (filters) => request.get('v1/work-time', { params: filters })
