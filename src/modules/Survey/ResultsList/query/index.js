import { useInfiniteQuery, useMutation } from '@tanstack/vue-query'
import { apiGetTotalSurveyResultCount, apiGetResultsList } from '../api'

export const useSurveyResultsInfinityQuery = (filters, options = {}) => {
  return useInfiniteQuery({
    queryKey: ['survey', 'all-results', filters],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => apiGetResultsList({ ...filters.value, ...pageParam }),
    select: ({ pages, pageParams }) => ({
      pages,
      pageParams,
    }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.data.items.length === 0) return null

      return { page: pages.length + 1 }
    },
    placeholderData: (previousData) => previousData,
    ...options,
  })
}

export const useGetTotalSurveyResultsCountMutation = () =>
  useMutation({
    mutationFn: (filters) => apiGetTotalSurveyResultCount(filters.value),
  })
