import { computed, reactive, unref, watch } from 'vue'
import { useGetUserFinancialSummaryQuery, useGetUserAccountingQuery } from '@/modules/User/query'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import { mockGetFinancialSummary, mockGetUserAccounting } from '@/mocks/user-details/financial'

const METRIC_TOOLTIPS = {
  totalCosts: 'جمع کل خدمات انجام شده بدون کسر تخفیفات',
  totalDiscounts: 'جمع کل تخفیف‌ها (نقد و کوپن)',
  totalPayable: 'مجموع خدمات − مجموع تخفیف',
  totalRefunds: 'جمع مبالغ عودت‌داده‌شده به بیمار (چک‌ + نقد)',
  balance: 'اعتبار بیمار (مجموع مبالغ پرداختی - عودت - خدمات گرفته شده + تخفیفات)',
  obligationsTotal: 'جمع هزینه‌ی بتاهای موجود (حذف‌شده‌ها و پرداخت شده ها جزوش نیست)',
  totalPaid: 'کل پرداختی‌های بیمار بدون کسر عودت و خدمات دریافتی',
}

export const useUserFinancialSummary = (userId) => {
  const resolvedUserId = computed(() => unref(userId))

  const {
    data: summaryData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetUserFinancialSummaryQuery(resolvedUserId, {
    ...(ENABLE_USER_DETAIL_MOCKS
      ? { queryFn: () => mockGetFinancialSummary(unref(resolvedUserId)) }
      : {}),
  })

  const accountingFilters = { 'filter[user_id]': resolvedUserId.value }
  const accountingState = reactive({ items: [] })
  const { data: accountingData, isLoading: isAccountingLoading } = useGetUserAccountingQuery(
    accountingFilters,
    {
      ...(ENABLE_USER_DETAIL_MOCKS
        ? { queryFn: ({ pageParam }) => mockGetUserAccounting(resolvedUserId.value, pageParam) }
        : {}),
    }
  )

  watch(
    () => accountingData.value,
    (val) => {
      if (!val?.pages) return
      accountingState.items = val.pages.flatMap((p) => p?.data?.items?.data || [])
    },
    { immediate: true }
  )

  const totalCosts = computed(() => summaryData.value?.totalCost ?? 0)
  const totalDiscounts = computed(() => summaryData.value?.totalDiscount ?? 0)
  const totalPayable = computed(() => summaryData.value?.totalPayable ?? 0)
  const totalRefunds = computed(() => summaryData.value?.totalRefund ?? 0)
  const totalPaid = computed(() => summaryData.value?.totalPayment ?? 0)
  const obligationsTotal = computed(() => summaryData.value?.unpaidCommitmentIrt ?? 0)

  const balance = computed(() => {
    return summaryData.value?.totalBalance ?? 0
  })

  const isSummaryLoading = computed(() => isLoading.value || isAccountingLoading.value)

  const summaryMetrics = computed(() => [
    {
      key: 'totalCosts',
      label: 'مجموع هزینه‌ها',
      value: totalCosts.value,
      tooltip: METRIC_TOOLTIPS.totalCosts,
    },
    {
      key: 'totalDiscounts',
      label: 'تخفیف',
      value: totalDiscounts.value,
      tooltip: METRIC_TOOLTIPS.totalDiscounts,
    },
    {
      key: 'totalPayable',
      label: 'قابل پرداخت',
      value: totalPayable.value,
      tooltip: METRIC_TOOLTIPS.totalPayable,
      bold: true,
    },
    {
      key: 'totalPaid',
      label: ' پرداخت شده',
      value: totalPaid.value,
      tooltip: METRIC_TOOLTIPS.totalPaid,
    },
    {
      key: 'totalRefunds',
      label: '  عودت شده ',
      value: totalRefunds.value,
      tooltip: METRIC_TOOLTIPS.totalRefunds,
    },
  ])

  const walletMetrics = computed(() => [
    {
      key: 'balance',
      label: 'موجودی',
      value: balance.value,
      tooltip: METRIC_TOOLTIPS.balance,
      tab: 'wallet',
    },
    {
      key: 'obligationsTotal',
      label: 'تعهد پرداخت',
      value: obligationsTotal.value,
      tooltip: METRIC_TOOLTIPS.obligationsTotal,
      tab: 'commitment',
    },
  ])

  return {
    summaryData,
    summaryMetrics,
    walletMetrics,
    totalCosts,
    totalDiscounts,
    totalPayable,
    totalRefunds,
    balance,
    obligationsTotal,
    totalPaid,
    isSummaryLoading,
    isError,
    error,
    refetch,
  }
}
