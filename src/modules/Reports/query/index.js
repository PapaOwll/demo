import { useQuery } from '@tanstack/vue-query'
import { apiGetReports } from '@/modules/Dashboard/api'
import { advisorReports, introductionMethodReports } from '@/modules/Reports/api'

export const useReportsQuery = (filters) => {
  return useQuery({
    queryKey: ['reports', 'entry', filters],
    queryFn: ({ signal }) => apiGetReports(filters.value, { signal }),
    select: (data) => {
      return data?.data
    },
  })
}
export const useGetIntroductionMethodReports = (filters, options = {}) => {
  return useQuery({
    queryKey: ['reports', 'introduction', filters],
    queryFn: ({ signal }) => introductionMethodReports(filters.value, { signal }),
    select: (data) => {
      return data?.data
    },
    ...options,
  })
}
export const useGetAdvisorReports = (filters, options = {}) => {
  return useQuery({
    queryKey: ['reports', 'advisor', filters],
    queryFn: ({ signal }) => advisorReports(filters.value, { signal }),
    select: (data) => {
      return data?.data
    },
    ...options,
  })
}
