<template>
  <div class="flex justify-end">
    <Button variant="outline" color="light-blue" text="ثبت درخواست" @click="openOpgDialog" />
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
              <div class="row items-end q-gutter-md q-pa-md">
                <QAvatar
                  color="white"
                  :class="checkExpDate(req.expireDate).color"
                  class="avatar-frame no-border"
                >
                  <component :is="prescriptionIcon(firstService(req))" size="24" />
                </QAvatar>
                <div class="title-section">
                  <Typography variant="body" size="4" weight="bold">
                    {{ prescriptionType(firstService(req)) }}
                  </Typography>
                  <Typography variant="caption" color="grey">
                    {{ formatDate(req?.registrationDate, 'HH:mm') }}
                  </Typography>
                </div>
                <div v-if="!isImaging(req)" class="title-section">
                  <Typography variant="body" size="4" color="body">کد تامین اجتماعی</Typography>
                  <Typography variant="caption" color="dark">
                    {{ req?.prescriptionId }}
                  </Typography>
                </div>
                <div class="title-section">
                  <Typography variant="body" size="4" color="body">تاریخ انقضا</Typography>
                  <Typography variant="caption" color="dark">
                    {{ convertToJalali(req?.expireDate) }}
                  </Typography>
                </div>
              </div>
            </template>
            <template #actions>
              <div class="q-ml-md">
                <Chip
                  v-if="checkExpDate(req.expireDate).isExpired"
                  variant="outline"
                  color="red"
                  :removable="false"
                  text="منقضی شده"
                />
              </div>
            </template>
            <template #full-width>
              <div v-if="isImaging(req)" class="req-details q-col-gutter-md">
                <div class="column col-grow">
                  <Typography variant="body" size="4" color="body">خدمت</Typography>
                  <Typography variant="caption" color="dark">
                    {{ firstService(req)?.service_name }}
                  </Typography>
                </div>
                <div class="column col-grow">
                  <Typography variant="body" size="4" color="body">شناسه درخواست</Typography>
                  <Typography variant="caption" color="dark">
                    {{ req?.prescriptionId }}
                  </Typography>
                </div>
                <div class="column col-grow">
                  <Typography variant="body" size="4" color="body">کد رهگیری</Typography>
                  <Typography variant="caption" color="dark">
                    {{ req?.trackingCode }}
                  </Typography>
                </div>
              </div>
              <div
                v-if="parseServices(req.services).length > 0 && !isImaging(req)"
                class="services-table"
              >
                <div class="services-table__row services-table__row--header row">
                  <Typography variant="caption" color="grey" class="col-12 col-md-5">
                    نام دارو
                  </Typography>
                  <Typography variant="caption" color="grey" class="col-12 col-md-2">
                    زمان مصرف
                  </Typography>
                  <Typography variant="caption" color="grey" class="col-12 col-md-2">
                    کد تامین
                  </Typography>
                  <Typography variant="caption" color="grey" class="col-12 col-md-2">
                    تعداد
                  </Typography>
                </div>
                <div
                  v-for="service in parseServices(req.services)"
                  :key="service.detail_id"
                  class="services-table__row row"
                >
                  <Badge class="col-12 col-md-5" variant="light" color="dark">
                    <span class="services-table__drug-name">{{ service?.service_name }}</span>
                    <QTooltip
                      anchor="bottom right"
                      self="top right"
                      class="bg-black text-white text-body1"
                    >
                      {{ service?.service_name }}
                    </QTooltip>
                  </Badge>
                  <Typography variant="body" size="4" class="col-12 col-md-2">
                    {{ service?.usage_time || '-' }}
                  </Typography>
                  <Typography variant="body" size="4" class="col-12 col-md-2">
                    {{ service?.service_code }}
                  </Typography>
                  <Typography variant="body" size="4" class="col-12 col-md-2">
                    {{ service?.quantity }}
                  </Typography>
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
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import { mockGetOpgRequests } from '@/mocks/user-details/medical'
import { computed, ref } from 'vue'
import { convertToJalali, formatDate } from '@/utils/date-utils'
import { IconPhoto, IconPill } from '@tabler/icons-vue'
import ActivityCard from '../../UserActivity/components/ActivityCard'
import useDisclosure from '@/composables/use-disclosure'
import UserPrescription from '@/modules/User/components/UserDetails/UserPrescription'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import Chip from '@/base/Chip'
import Badge from '@/base/Badge'

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
  ...(ENABLE_USER_DETAIL_MOCKS ? { queryFn: () => mockGetOpgRequests(userId.value) } : {}),
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

const parseServices = (services) => {
  try {
    return JSON.parse(services) || []
  } catch {
    return []
  }
}

const isImagingPrescription = (service) => {
  const name = service?.service_name?.toLowerCase() ?? ''
  return name.includes('opg') || name.includes('cbct')
}

const firstService = (req) => parseServices(req.services)[0]

const isImaging = (req) => isImagingPrescription(firstService(req))

const prescriptionType = (service) =>
  isImagingPrescription(service) ? 'نسخه تصویربرداری' : 'نسخه دارو'

const prescriptionIcon = (service) => (isImagingPrescription(service) ? IconPhoto : IconPill)

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
.title-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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
.services-table {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  background-color: $white;
  border-radius: $radius-md;
  padding: $spacing-md $spacing-xl;
  margin: $spacing-md 4px 0;

  &__row {
    margin: $spacing-sm 0;
  }
  &__row > .badge {
    max-width: 100%;
    :deep(.badge__content) {
      min-width: 0;
      max-width: 100%;
      text-align: start !important;
    }
  }

  &__drug-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: start;
  }

  &__row--header {
    text-align: start;
    padding-bottom: $spacing-xs;
  }
}
</style>
