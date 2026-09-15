<template>
  <TransitionGroup class="uft" name="fade-slide" mode="out-in">
    <div v-if="walletTab === 'wallet'">
      <div v-if="isLoading" class="uft__loading">
        <QInnerLoading :showing="isLoading" class="q-mx-auto q-my-auto">
          <QSpinnerTail color="primary" size="100px" />
        </QInnerLoading>
      </div>
      <div v-else-if="timelineData?.result?.length" class="uft__content">
        <QInfiniteScroll
          class="uft__time-line"
          scroll-target=".uft__time-line"
          :offset="120"
          @load="handleGetNewPage"
        >
          <QTimeline color="secondary">
            <QTimelineEntry v-for="item in timelineData?.result || []" :key="item">
              <div>
                <div class="uft__time-line-content">
                  <p class="uft__time-line-text">
                    {{ convertToJalali(item.date, 'jYYYY/jMM/jDD - jdddd') }}
                  </p>
                </div>
                <Card
                  v-for="card in item?.items || []"
                  :key="card"
                  :data="card"
                  :user-id="props.userInfo.id"
                  @update-transaction="updateTransaction"
                />
              </div>
            </QTimelineEntry>
          </QTimeline>

          <template #loading>
            <QSpinnerDots v-if="isFetchingNextPage" class="text-center" color="primary" size="lg" />
          </template>
          <div v-if="!hasNextPage && state.hasScrolledToEnd" class="uft__last-data">
            <p>دیگه تموم شد! میتونی برگردی بالا</p>
            <IconHandFinger color="#9E9E9E" width="24" height="24" stroke="2" />
          </div>
        </QInfiniteScroll>
      </div>

      <QCard v-else class="uft__no-data">
        <QImg :src="TransactionNoData" alt="TransactionNoData" width="188px" />
        <QCardSection class="uft__no-data-content">
          <p>هنوز تراکنشی اتفاق نیفتاده!</p>
          <p>اطلاعات مالی بیمار بعد از اولین تراکنش اینجا قابل مشاهده‌ست.</p>
          <div class="row q-gutter-sm">
            <QBtn fab-mini flat unelevated :loading="isLoading" @click="refreshTransactions">
              <IconRefresh class="text-grey" />
            </QBtn>
            <QBtn
              color="primary"
              label="ایجاد تراکنش جدید"
              unelevated
              @click="showPaymentDialog = true"
            />
          </div>
        </QCardSection>
      </QCard>
    </div>

    <UserObligationsList v-esle :user-info="userInfo" />
  </TransitionGroup>

  <UserPaymentDialog
    v-model="showPaymentDialog"
    :user-id="props.userInfo.id"
    @submit="handlePaymentSubmit"
  />
</template>

<script setup>
import TransactionNoData from '@/assets/images/transactionNoData.svg'
import { IconHandFinger, IconRefresh } from '@tabler/icons-vue'
import { useGetUserTransactionsQuery } from '@/modules/User/query'
import { convertToJalali } from '@/utils/date-utils'
import Card from './UserFinancialTransactionsCard'
import UserPaymentDialog from './UserPaymentDialog'
import { computed, reactive, watch, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import UserObligationsList from './UserObligationsList'

const queryClient = useQueryClient()
const props = defineProps({
  userInfo: {
    type: Object,
    required: false,
    default: () => {},
  },
  walletTab: {
    type: String,
    default: 'wallet',
  },
})

const state = reactive({
  tabs: [
    { id: 1, title: 'اطلاعات مالی' },
    { id: 2, title: 'مدارک' },
  ],
  tabsSelected: 1,
  dialog: {
    status: false,
    data: false,
  },
  filters: { 'filter[user_id]': props.userInfo.id },
  hasScrolledToEnd: false,
  data: false,
})

const showPaymentDialog = ref(false)

const {
  data: transactionList,
  isFetchingNextPage,
  fetchNextPage,
  hasNextPage,
  isLoading,
} = useGetUserTransactionsQuery(state.filters)

const groupBy = (array, keyFn) => {
  if (!Array.isArray(array)) return {}
  return array.reduce((acc, item) => {
    const key = keyFn(item)
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(item)
    return acc
  }, {})
}

watch(
  () => transactionList.value,
  (val) => {
    if (!val?.pages) return
    const items = val.pages.flatMap((p) => p.data.items || [])
    state.data = items.map((item) => ({
      ...item,
      createdDateOnly: item.createdDt?.slice(0, 10),
    }))
  },
  { immediate: true }
)

const timelineData = computed(() => {
  const grouped = groupBy(state.data, (item) => item.createdDateOnly)

  const result = Object.entries(grouped).map(([date, items]) => ({
    date,
    items,
  }))

  const totalAmount = result.reduce((sum, group) => {
    return sum + group.items.reduce((s, item) => s + (item.amount || 0), 0)
  }, 0)

  return {
    result,
    totalAmount,
  }
})

const updateTransaction = (updatedItem) => {
  if (!updatedItem?.id) return

  const index = state.data.findIndex((item) => item.id === updatedItem.id)
  if (index === -1) return
  state.data[index] = updatedItem
}

const handleGetNewPage = async (index, done) => {
  state.hasScrolledToEnd = true
  if (!hasNextPage?.value || isFetchingNextPage?.value) {
    done(false)
    return
  }
  await fetchNextPage()
  done()
}
const handlePaymentSubmit = async (paymentData) => {
  if (paymentData) {
    await queryClient.invalidateQueries({ queryKey: ['user', 'transactions', state.filters] })
  }
}

const refreshTransactions = () => {
  const queryKey = ['user', 'transactions', state.filters]
  queryClient.invalidateQueries({
    queryKey,
    exact: true,
  })
}
</script>

<style lang="scss" scoped>
.uft {
  -webkit-user-select: none;
  -webkit-user-drag: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  &__content {
    height: 100%;
  }
  &__time-line {
    padding-bottom: 120px;
    overflow-y: auto;
    height: 100%;
  }
  &__time-line-text {
    margin: 0 map-get($space-sm, x) map-get($space-sm, x) 0;
    font-weight: map-get($subtitle2, weight);
    font-size: map-get($subtitle2, size);
    color: $grey-8;
  }
  &__time-content {
    align-items: baseline;
    display: flex;
  }
  &__loading {
    overflow: hidden;
    height: 500px;
    width: 100%;
  }
  &__content-header {
    margin-bottom: map-get($space-lg, x);
    justify-content: space-between;
    background-color: $grey-1;
    align-items: center;
    box-shadow: none;
    display: flex;
    padding: map-get($space-md, x);
  }
  &__content-header-section-one {
    align-items: center;
    display: flex;
    padding: 0;
    width: 100%;
  }
  &__content-header-section-one-avatar {
    margin-right: map-get($space-sm, x);
  }
  &__content-header-section-two {
    margin-right: map-get($space-md, x);
    flex-direction: column;
    display: flex;
    > p:first-of-type {
      font-weight: map-get($subtitle1, weight);
      font-size: map-get($subtitle1, size);
      color: $grey-7;
      margin: 0;
    }
    > p:last-of-type {
      font-weight: map-get($h6, weight);
      font-size: map-get($h6, size);
      margin: 0;
    }
  }

  &__no-data {
    justify-content: center;
    flex-direction: column;
    align-items: center;
    box-shadow: none;
    height: 500px;
    display: flex;
    width: 100%;
  }

  &__no-data-content {
    margin-top: map-get($space-md, x);
    justify-content: center;
    flex-direction: column;
    align-items: center;
    display: flex;
    padding: 0;
    width: 100%;
    > p:first-of-type {
      font-weight: map-get($h6, weight);
      font-size: map-get($h6, size);
      color: $grey-8;
      margin: 0;
    }
    > p:last-of-type {
      font-weight: map-get($subtitle1, weight);
      font-size: map-get($subtitle1, size);
      margin-top: map-get($space-sm, x);
      color: $grey-6;
    }
  }

  &__last-data {
    margin-top: map-get($space-sm, x);
    gap: map-get($space-sm, x);
    justify-content: center;
    align-items: center;
    display: flex;
    > p {
      font-weight: map-get($subtitle2, weight);
      font-size: map-get($subtitle2, size);
      margin: 0 !important;
      text-align: center;
      color: $grey;
    }
  }
}
:deep(.q-timeline__content) {
  padding: 0 !important;
}
:deep(.q-timeline--dense--right .q-timeline__entry) {
  padding-right: 15px !important;
}
:deep(.q-timeline--dense--right .q-timeline__entry) {
  padding-left: 15px !important;
}
:deep(.q-timeline__dot:before) {
  background-color: $grey-5;
  height: 9px;
  width: 9px;
  right: 3px;
}
:deep(.q-timeline__dot:after) {
  height: 100.3%;
  top: 12px;
}
:deep(.q-infinite-scroll__loading) {
  text-align: center;
}
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
