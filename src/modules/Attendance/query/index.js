import { useInfiniteQuery, useMutation } from '@tanstack/vue-query'
import {
  apiCheckIn,
  apiCheckOut,
  apiDeleteAttendance,
  apiGetAttendance,
  apiGetAttendanceTotalCount,
  apiUpdateAttendance,
} from '../api'

import { handleError } from '@/utils/error-handler'

export const useAttendanceInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['attendance', 'all-attendance', filters],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => apiGetAttendance({ ...filters.value, ...pageParam }),
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

export const useApiCheckIn = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiCheckIn(data),
    onError: (err) => handleError(err),
    ...options,
  })

export const useApiCheckOut = (options = {}) =>
  useMutation({
    mutationFn: (id) => apiCheckOut(id),
    onError: (err) => handleError(err),
    ...options,
  })

export const useApiUpdateAttendance = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiUpdateAttendance(id, data),
    onError: (err) => handleError(err),
    ...options,
  })

export const useGetAttendanceTotalCountMutation = () =>
  useMutation({
    mutationFn: (filters) => apiGetAttendanceTotalCount(filters.value),
  })

export const useApiDeleteAttendance = (options = {}) =>
  useMutation({
    mutationFn: (id) => apiDeleteAttendance(id),
    onError: (err) => handleError(err),
    ...options,
  })
