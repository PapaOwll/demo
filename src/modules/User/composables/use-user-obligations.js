import { computed, reactive, watch } from 'vue'
import { useGetUserPaymentObligationsQuery } from '@/modules/User/query'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import { mockGetPaymentObligations } from '@/mocks/user-details/financial'

export const useUserObligations = (userId, statusIds) => {
  const filters = { 'filter[user_id]': userId }
  if (statusIds?.length) {
    filters['filter[status_id]'] = statusIds
  }
  const state = reactive({
    items: [],
  })

  const { data, isFetchingNextPage, fetchNextPage, hasNextPage, isLoading } =
    useGetUserPaymentObligationsQuery(filters, {
      ...(ENABLE_USER_DETAIL_MOCKS
        ? { queryFn: ({ pageParam }) => mockGetPaymentObligations(pageParam) }
        : {}),
    })

  watch(
    () => data.value,
    (val) => {
      if (!val?.pages) return
      state.items = val.pages.flatMap((p) => p?.data?.items || [])
    },
    { immediate: true }
  )

  const obligationsTotal = computed(() => {
    return state.items
      .filter((item) => item.status?.id === 144)
      .reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0)
  })

  return {
    state,
    obligationsTotal,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isLoading,
  }
}
