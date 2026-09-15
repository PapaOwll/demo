import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { apiGetTotalInternalPhoneCount, internalPhone } from '../api/internal-phone'
import { apiGetRestTime, apiPostRestTime } from '../api/rest-time'
import {
  apiGetGroupAdviser,
  apiGetProvinces,
  apiGetAdvisor,
  apiPostGroupAdviser,
} from '../api/group-adviser'
import { handleError } from '@/utils/error-handler'
import { Notif } from '@/data/services/notification-service'

export const useInternalPhoneInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['internal-phone', 'all-internal-phones'],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => internalPhone({ ...filters.value, ...pageParam }),
    select: ({ pages, pageParams }) => ({
      pages: pages.map(({ data }) => data),
      pageParams,
    }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage?.data?.items.length === 0) return null

      return { page: pages.length + 1 }
    },
    placeholderData: (previousData) => previousData,
    ...options,
  })

export const useGetTotalInternalPhoneCountMutation = () =>
  useMutation({
    mutationFn: (filters) => apiGetTotalInternalPhoneCount(filters.value),
  })

export const useGetGroupAdvisor = () => {
  return useQuery({
    queryKey: ['operator-setting', 'group'],
    queryFn: apiGetGroupAdviser,
    select: (data) => data?.data ?? [],
    onError: () => {
      Notif.error('لیست گروه بندی کارمندان دریافت نشد')
    },
  })
}
export const useGetProvinces = () => {
  return useQuery({
    queryKey: ['operator-setting', 'provinces'],
    queryFn: apiGetProvinces,
    select: (data) => data?.data ?? [],
    onError: () => Notif.error('لیست استان ها دریافت نشد'),
  })
}

export const useGetAdvisor = () => {
  return useQuery({
    queryKey: ['operator-setting', 'advisor'],
    queryFn: apiGetAdvisor,
    select: (data) => data?.data ?? [],
    onError: () => Notif.error('لیست مشاوران دریافت نشد'),
  })
}

export const usePostGroupAdviserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiPostGroupAdviser,
    // TODO: Remove validate and notif from here
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator-setting', 'group'] })
      Notif.success('با موفقیت انجام شد')
    },
    onError: (e) => handleError(e),
  })
}

export const useGetRestTime = () => {
  return useQuery({
    queryKey: ['operator-setting', 'rest-time'],
    queryFn: apiGetRestTime,
    select: (data) => data?.data ?? [],
    onError: (e) => handleError(e),
  })
}

export const usePostRestTime = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiPostRestTime,
    // TODO: Remove validate and notif from here
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rest-time'] })
      Notif.success('با موفقیت انجام شد')
    },
    onError: (error) => {
      const firstKey = Object.keys(error.response.data.data)[0]
      const firstValue = error.response.data.data[firstKey]?.[0]
      Notif.error(firstValue)
    },
  })
}
