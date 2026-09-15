<template>
  <div class="flex justify-end">
    <QBtn flat color="primary" label="تازه سازی لیست" @click="refetch" />
  </div>
  <div v-if="userHistoryData?.length > 0" ref="scrollTargetRef" class="booking-container">
    <QInfiniteScroll :offset="0" :scroll-target="scrollTargetRef" @load="loadNextPage">
      <template #loading>
        <div class="row justify-center q-my-md">
          <template v-if="isFetchingNextPage">
            <QSpinnerDots color="primary" size="lg" />
          </template>
          <template v-else-if="!hasNextPage">
            <div class="text-caption text-grey">اطلاعات دیگری جهت نمایش وجود ندارد</div>
          </template>
        </div>
      </template>
      <QTimeline color="blue-grey-3">
        <QTimelineEntry
          v-for="dayGroup in groupedHistoryData"
          :key="dayGroup.jalaliDate"
          :subtitle="dayGroup.jalaliDate"
        >
          <div class="flex column q-gutter-sm">
            <ActivityCard v-for="(history, index) in dayGroup.events" :key="index">
              <template #title>
                <div class="row items-end q-gutter-sm">
                  <QAvatar color="white" text-color="grey-5" class="avatar-frame">
                    <IconHistory size="24" />
                  </QAvatar>
                  <div class="flex column">
                    <span class="text-bold">{{ history.message }}</span>
                    <span class="text-secondary text-body2">
                      {{ formatDate(history.createdAt, 'HH:mm') }}
                    </span>
                  </div>
                </div>
              </template>
            </ActivityCard>
          </div>
        </QTimelineEntry>
      </QTimeline>
    </QInfiniteScroll>
  </div>
  <div v-else class="row column items-center q-mt-xl full-width full-height text-h5">
    <QInnerLoading :showing="isLoading">
      <QSpinnerTail color="primary" size="50px" />
    </QInnerLoading>
    <img src="@/assets/images/noData.svg" alt="noData" class="q-mt-xl" />
    <span>اطلاعاتی وجود ندارد</span>
  </div>
</template>

<script setup>
import { computed, ref, defineAsyncComponent, watchEffect } from 'vue'
import { useGetUserHistoryInfinityQuery } from '@/modules/User/query'
import { IconHistory } from '@tabler/icons-vue'
import { convertToJalali, formatDate } from '@/utils/date-utils'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import { mockGetUserHistory } from '@/mocks/user-details/history'

const ActivityCard = defineAsyncComponent(
  () =>
    import('@/modules/User/components/UserDetails/UserDetailsComponents/UserActivity/components/ActivityCard')
)

const props = defineProps({
  propData: {
    type: Number,
    default: null,
  },
  tabId: {
    type: Number,
    default: null,
  },
})

const filters = ref({
  'filter[user_id]': props.propData,
})
const scrollTargetRef = ref(null)

const enabled = computed(() => !!props.propData)
const {
  data: historyData,
  isLoading,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
  refetch,
} = useGetUserHistoryInfinityQuery(filters, {
  enabled,
  ...(ENABLE_USER_DETAIL_MOCKS
    ? { queryFn: ({ pageParam }) => mockGetUserHistory({ ...filters.value, ...pageParam }) }
    : {}),
})
const userHistoryData = computed(() => {
  const pages = historyData.value?.pages || []
  return pages?.flatMap((pageData) => {
    return pageData.data.items.map((item) => ({
      ...item,
      advisor: item?.advisor?.firstName
        ? `${item?.advisor?.firstName} ${item?.advisor?.name}`
        : item?.advisor?.name,
      branchName: item?.branch?.name,
    }))
  })
})

const groupedHistoryData = computed(() => {
  const grouped = new Map()
  userHistoryData.value?.forEach((history) => {
    const dateKey = formatDate(history.createdAt, 'YYYY-MM-DD')
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, {
        jalaliDate: convertToJalali(history.createdAt),
        events: [],
      })
    }
    grouped.get(dateKey).events.push(history)
  })
  return [...grouped.values()]
})
const loadNextPage = async (index, done) => {
  if (!hasNextPage.value) {
    done(false)
    return
  }
  await fetchNextPage()
  done()
}
watchEffect(() => props.propData, refetch())
</script>

<style scoped>
.avatar-frame {
  border-radius: 8px;
}
</style>
