import { useQuery } from '@tanstack/vue-query'
import { apiGetReports } from '@/modules/Dashboard/api'
import { apiGetCrmAnnouncements } from '@/layout/api'

export const useGetHeaderWidgetsQuery = (filters, options = {}) =>
  useQuery({
    queryKey: ['layout', 'header', 'widget'],
    queryFn: ({ signal }) => apiGetReports(filters.value, { signal }),
    select: (data) => {
      return data?.data ?? data
    },
    ...options,
  })

export const useCrmAnnouncementsQuery = (options = {}) =>
  useQuery({
    queryKey: ['crm', 'announcements'],
    queryFn: ({ signal }) => apiGetCrmAnnouncements({}, { signal }),
    select: (data) => data?.data ?? data,
    ...options,
  })
