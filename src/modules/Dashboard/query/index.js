import { useQuery } from '@tanstack/vue-query'
import { apiGetAdvisorStatistics, apiGetReports } from '../api'

export const useGetWidgetQuery = (filters) => {
  return useQuery({
    queryKey: ['dashboard', filters],
    queryFn: ({ signal }) => apiGetReports(filters.value, { signal }),
    select: (data) => {
      return data?.data
    },
  })
}

export const useStatisticsQuery = (filters) => {
  return useQuery({
    queryKey: ['advisor-statistics', filters],
    queryFn: ({ signal }) => apiGetAdvisorStatistics(filters.value, { signal }),
    select: (data) => {
      return data?.data ?? data
    },
  })
}
