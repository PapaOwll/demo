import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/vue-query'
import { unref } from 'vue'
import { apiGetTotalSurveyCount, apiGetSurveyList } from '../api'

export const useSurveyListInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['survey', 'all-surveys', filters],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => apiGetSurveyList({ ...unref(filters), ...pageParam }),
    select: ({ pages, pageParams }) => ({
      pages,
      pageParams,
    }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.data?.items.length === 0) return null

      return { page: pages.length + 1 }
    },
    placeholderData: (previousData) => previousData,
    ...options,
  })

export const useSurveyListQuery = (filters, options = {}) =>
  useQuery({
    queryKey: ['survey', 'survey-list', filters],
    queryFn: () => apiGetSurveyList(unref(filters)),
    select: ({ data }) => data.data ?? data,
    ...options,
  })
export const useGetTotalSurveyCountMutation = () =>
  useMutation({
    mutationFn: (filters) => apiGetTotalSurveyCount(filters.value),
  })
