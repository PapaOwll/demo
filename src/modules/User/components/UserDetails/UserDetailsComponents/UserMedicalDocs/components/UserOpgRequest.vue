<template>
  <div class="flex justify-end">
    <QBtn unelevated outline square color="primary" label="ثبت درخواست" @click="openOpgDialog" />
  </div>
  <div v-if="requests?.length > 0" ref="scrollTargetRef" class="booking-container">
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
          v-for="(req, index) in requests"
          :key="index"
          :subtitle="convertToJalali(req?.registrationDate, 'jYYYY/jMM/jDD ، jdddd')"
        >
          <ActivityCard>
            <template #title>
              <div class="row items-end q-gutter-sm q-pa-md">
                <QAvatar
                  color="white"
                  :class="checkExpDate(req.expireDate).color"
                  class="avatar-frame no-border"
                >
                  <IconPhoto size="24" />
                </QAvatar>
                <div class="flex column">
                  <span>نسخه OPG</span>
                  <span>{{ formatDate(req?.registrationDate, 'HH:mm') }}</span>
                </div>
              </div>
            </template>
            <template #actions>
              <div class="q-ml-md">
                <QChip
                  v-if="checkExpDate(req.expireDate).isExpired"
                  class="chips-error"
                  square
                  label="منقضی شده"
                />
              </div>
            </template>
            <template #full-width>
              <div class="req-details q-col-gutter-md">
                <div class="column col-grow">
                  <span class="text-secondary">شناسه درخواست</span>
                  <span>{{ req.id }}</span>
                </div>
                <div class="column col-grow">
                  <span class="text-secondary">کد رهگیری</span>
                  <span>{{ req?.trackingCode }}</span>
                </div>
                <div class="column col-grow">
                  <span class="text-secondary">نام پزشک</span>
                  <span>{{ req?.doctorName }}</span>
                </div>
                <div class="column col-grow">
                  <span class="text-secondary">تاریخ انقضا</span>
                  <span>{{ convertToJalali(req?.expireDate) }}</span>
                </div>
                <div class="column col-grow">
                  <span class="text-secondary">خدمت</span>
                  <span v-for="service in JSON.parse(req.services)" :key="service.detail_id">
                    {{ service?.service_name }}
                  </span>
                </div>
              </div>
            </template>
          </ActivityCard>
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

  <UserPrescription :visible="showOpgModal" :user-data="userInfo" @close="closeDialog" />
</template>

<script setup>
import { useGetUserOpgRequestInfinityQuery } from '@/modules/User/query/index'
import { computed, ref } from 'vue'
import { convertToJalali, formatDate } from '@/utils/date-utils'
import { IconPhoto } from '@tabler/icons-vue'
import ActivityCard from '../../UserActivity/components/ActivityCard'
import useDisclosure from '@/composables/use-disclosure'
import UserPrescription from '@/modules/User/components/UserDetails/UserPrescription'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import { mockGetOpgRequests } from '@/mocks/user-details/medical'

const props = defineProps({
  propData: {
    type: [Object, Array],
    default: () => {},
    required: true,
  },
})
const userInfo = ref(null)
const scrollTargetRef = ref(null)
const [showOpgModal, { open: openOpgModal, close: closeOpgModal }] = useDisclosure()

const userId = computed(() => props.propData?.id)
const enabled = computed(() => !!userId.value)
const {
  data: opgListData,
  isLoading,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
} = useGetUserOpgRequestInfinityQuery(userId.value, {
  enabled,
  ...(ENABLE_USER_DETAIL_MOCKS ? { queryFn: () => mockGetOpgRequests() } : {}),
})

const requests = computed(
  () =>
    opgListData.value?.pages?.flatMap((pageData) => {
      return pageData.data
    }) || []
)

const loadNextPage = async (index, done) => {
  if (!hasNextPage.value) {
    done(false)
    return
  }
  await fetchNextPage()
  done()
}

const checkExpDate = (date) => {
  const currentDate = formatDate(new Date())
  const expDate = formatDate(date)
  return currentDate > expDate
    ? {
        color: 'chips-error',
        isExpired: true,
      }
    : {
        color: 'grey-4',
        isExpired: false,
      }
}

const openOpgDialog = () => {
  userInfo.value = props.propData
  openOpgModal()
}
const closeDialog = () => {
  userInfo.value = null
  closeOpgModal()
}
</script>

<style scoped lang="scss">
.avatar-frame {
  border-radius: 8px;
}
.req-details {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: start;
  margin: 0 4px;
}
</style>
