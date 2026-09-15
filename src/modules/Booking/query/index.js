import { computed } from 'vue'
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/vue-query'
import {
  apiBookingCancellation,
  apiCreateBooking,
  apiCreateVisit,
  apiDeleteBooking,
  apiDeleteCoordinator,
  apiGetBooking,
  apiGetBookingCalendar,
  apiGetBookingUsers,
  apiGetCoordinateTotalCount,
  apiGetOnlineSessions,
  apiGetPresentVisitSessionTimes,
  apiGetVisit,
  apiGetVisitTotalCount,
  apiGetVisitUsers,
  apiSetCoordinator,
  apiUpdateBooking,
  apiUpdateVisit,
} from '@/modules/Booking/api'
import { handleError } from '@/utils/error-handler'

export const useGetBookingCoordinateInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['booking', 'all-booking-coordinate', filters],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => apiGetBookingUsers({ ...filters.value, ...pageParam }),
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

export const useBookingInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['booking', 'all-booking', filters],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => apiGetVisitUsers({ ...filters.value, ...pageParam }),
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

export const useBookingVisitInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['booking', 'all-booking-visit', filters],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => apiGetVisitUsers({ ...filters.value, ...pageParam }),
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

export const useGetVisitTotalCountMutation = (options = {}) =>
  useMutation({
    mutationFn: (filters) => apiGetVisitTotalCount(filters.value),
    onError: (err) => handleError(err),
    ...options,
  })
export const useGetCoordinateTotalCountMutation = (options = {}) =>
  useMutation({
    mutationFn: (filters) => apiGetCoordinateTotalCount(filters.value),
    onError: (err) => handleError(err),
    ...options,
  })

export const useSetCoordinator = () =>
  useMutation({
    mutationKey: ['booking', 'booking-users', 'create-edit'],
    mutationFn: ({ ownerId, ...userIds }) => apiSetCoordinator(ownerId, userIds),
    onError: (err) => handleError(err),
  })
export const useDeleteCoordinator = () =>
  useMutation({
    mutationKey: ['booking', 'booking-users', 'delete'],
    mutationFn: ({ ownerId, userId }) => apiDeleteCoordinator(ownerId, userId),
    onError: (err) => handleError(err),
  })

export const useApiGetOnlineSessionTimes = (date, branchId, options = {}) =>
  useQuery({
    queryKey: ['session', date, branchId],
    queryFn: () => apiGetOnlineSessions(date.value, branchId.value),
    select: (data) => data?.data ?? data,
    ...options,
  })
export const useGetPresentSessionTimes = (options = {}) =>
  useMutation({
    mutationFn: ({ date, branchId }) => apiGetPresentVisitSessionTimes(date, branchId),
    onError: (err) => handleError(err),
    ...options,
  })
export const useCreateBookingMutation = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiCreateBooking(data),
    onError: (err) => handleError(err),
    ...options,
  })
export const useUpdateBookingMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiUpdateBooking(id, data),
    onError: (err) => handleError(err),
    ...options,
  })
export const useDeleteBookingMutation = (options = {}) =>
  useMutation({
    mutationFn: (id) => apiDeleteBooking(id),
    onError: (err) => handleError(err),
    ...options,
  })
export const useCreateVisitMutation = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiCreateVisit(data),
    onError: (err) => handleError(err),
    ...options,
  })
export const useUpdateVisitMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiUpdateVisit(id, data),
    onError: (err) => handleError(err),
    ...options,
  })
export const useCancellationMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...date }) => apiBookingCancellation(id, date),
    onError: (err) => handleError(err),
    ...options,
  })

export const useBookingCalendarQuery = (filters, options = {}) =>
  useQuery({
    queryKey: ['booking', 'calendar', filters],
    queryFn: () =>
      apiGetBookingCalendar({
        filter: {
          from: filters.value?.from,
          to: filters.value?.to,
          type: filters.value?.type,
        },
      }),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useBookingCalendarListQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['booking', 'calendar-list', filters],
    queryFn: ({ pageParam }) => {
      const params = filters.value
      if (!params?.['filter[assign_to]']) return { data: { items: [] } }
      return apiGetVisitUsers({ ...params, ...pageParam, per_page: 100 })
    },
    select: ({ pages }) => pages.flatMap((page) => page?.data?.items ?? []),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, allPages) => {
      const items = lastPage?.data?.items
      if (!items?.length || items.length < 25) return false
      return { page: allPages.length + 1 }
    },
    ...options,
  })

export const useBookingDayBookingsQuery = (filters, options = {}) =>
  useQuery({
    queryKey: ['booking', 'day-list', filters],
    queryFn: () => apiGetVisitUsers({ ...filters.value, per_page: 200 }),
    select: (data) => data?.data?.items ?? [],
    enabled: computed(() => !!filters?.value?.['filter[assign_to]']),
    ...options,
  })

export const useBookingQuery = (bookingId, placeholder, options = {}) =>
  useQuery({
    queryKey: ['booking', 'detail', bookingId],
    queryFn: () => apiGetBooking(bookingId.value),
    select: (data) => data?.data ?? data,
    enabled: computed(() => !!bookingId.value),
    placeholderData: () => placeholder?.value ?? undefined,
    ...options,
  })

export const useVisitQuery = (visitId, placeholder, options = {}) =>
  useQuery({
    queryKey: ['visit', 'detail', visitId],
    queryFn: () => apiGetVisit(visitId.value),
    select: (data) => data?.data ?? data,
    enabled: computed(() => !!visitId.value),
    placeholderData: () => placeholder?.value ?? undefined,
    ...options,
  })
