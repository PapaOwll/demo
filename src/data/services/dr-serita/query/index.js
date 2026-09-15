import { useMutation, useQuery } from '@tanstack/vue-query'
import { apiGetSitakCall, apiGetDiseases, apiSummarizeUserChats } from '../api'
import { handleError } from '@/utils/error-handler'

export const useGetSitakCallQuery = (options = {}) =>
  useQuery({
    queryKey: ['sitak-call'],
    queryFn: ({ signal }) => apiGetSitakCall({ signal }),
    select: (data) => {
      return data?.data ?? data
    },
    ...options,
  })

export const useGetDiseasesQuery = (options = {}) =>
  useQuery({
    queryKey: ['user', 'diseases'],
    queryFn: () => apiGetDiseases(),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useSummarizeUserChatsMutation = () =>
  useMutation({
    mutationFn: (userId) => apiSummarizeUserChats(userId),
    onError: (err) => handleError(err || 'خطا در به‌روزرسانی خلاصه'),
  })
