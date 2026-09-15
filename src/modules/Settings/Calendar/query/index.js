import { useInfiniteQuery } from '@tanstack/vue-query'
import { apiGetCalendar } from '../api'

export const useCalendarInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['calendar', 'all-calendar'],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => apiGetCalendar({ ...filters.value, ...pageParam }),
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
