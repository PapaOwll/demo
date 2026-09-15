<template>
  <div class="flex justify-end">
    <QBtn flat color="primary" label="تازه سازی لیست" @click="refetch" />
  </div>
  <div v-if="userBookingData?.length > 0" ref="scrollTargetRef" class="activity-card-container">
    <QInfiniteScroll :offset="0" :scroll-target="scrollTargetRef" @load="loadNextPage">
      <template #loading>
        <div class="row justify-center q-my-md">
          <template v-if="isFetchingNextPage">
            <QSpinnerDots color="primary" size="lg" />
          </template>
        </div>
      </template>
      <QTimeline color="blue-grey-3 q-pl-none">
        <QTimelineEntry
          v-for="(booking, index) in bookingDetails"
          :key="index"
          :subtitle="booking.bookingTimes"
        >
          <div>
            <ActivityCard>
              <template #title>
                <div class="row items-end q-gutter-xs q-pa-sm">
                  <QAvatar
                    square
                    class="rounded-borders"
                    :color="booking.bookingStatus[index].iconColor"
                    :text-color="booking.bookingStatus[index].iconTextColor"
                  >
                    <IconDental size="24" />
                  </QAvatar>

                  <div class="flex column">
                    <span class="text-bold">{{ booking.bookingStatus[index].title }}</span>
                    <span class="text-secondary text-body2">{{ booking.time }}</span>
                  </div>
                </div>
              </template>
              <template #actions>
                <div class="full-height flex justify-center items-end q-gutter-xs">
                  <QBtn
                    v-if="!booking?.visit && !booking?.canceledAt"
                    rounded
                    color="positive"
                    @click="() => handleOpenVisitForm(booking)"
                  >
                    ثبت مراجعه
                  </QBtn>
                  <QBtn
                    v-if="!booking.visit && !booking?.canceledAt"
                    outline
                    color="negative"
                    rounded
                    @click="() => showCancelModal(booking)"
                  >
                    {{ booking.type === 2 ? 'لغو نوبت' : 'لغو ویزیت' }}
                  </QBtn>
                  <QChip v-if="booking?.canceledAt" outline square class="chips-error">
                    نوبت لغو شد
                  </QChip>
                  <QChip v-if="booking?.visit" outline square class="chips-success">
                    مراجعه شد
                  </QChip>

                  <QBtn
                    round
                    flat
                    @click="
                      () =>
                        !!booking?.canceledAt
                          ? showCancelModal(booking)
                          : booking?.visit
                            ? handleOpenVisitForm(booking)
                            : openBookingModal(booking)
                    "
                  >
                    <IconPencil stroke="{1}" />
                  </QBtn>
                </div>
              </template>

              <!-- Custom Content -->
              <template #right-content>
                <QCard flat class="details-box">
                  <div class="row justify-between text-body1">
                    <div class="col-md-6 col-auto flex column">
                      <span class="text-grey">تاریخ و زمان نوبت</span>
                      <span class="text-body1">{{ booking.bookingTimes }}</span>
                    </div>
                    <div class="col-md-6 col-auto flex column">
                      <span class="text-grey">مشاور</span>
                      <span class="text-body1">{{ booking.advisorName }}</span>
                    </div>
                  </div>
                  <QSeparator spaced color="grey" />
                  <div class="col-auto flex column">
                    <span class="text-grey text-bold">خدمات</span>
                    <div>
                      <QChip
                        v-for="serve in booking?.serves || []"
                        :key="serve.id"
                        outline
                        square
                        dense
                        :label="serve.title"
                      />
                    </div>
                  </div>
                </QCard>
              </template>

              <template #left-content>
                <QCard flat class="details-box">
                  <p
                    v-if="!booking.visit ? booking.description : booking.visit?.description"
                    class="text-body2 text-bold text-grey"
                  >
                    توضیحات
                  </p>
                  <div
                    v-if="!booking.visit ? booking.description : booking.visit?.description"
                    class="q-pa-xs text-body2 text-grey-9"
                  >
                    {{ !booking.visit ? booking.description : booking.visit.description }}
                  </div>
                  <div v-else class="row column justify-center items-center">
                    <IconInfoCircle
                      stroke="{1}"
                      class="exclamation-mark"
                      color="silver"
                      size="48"
                    />
                    <span class="text-body2">
                      توضیحی برای این {{ booking.bookingStatus[index].title }} ننوشتی
                    </span>
                    <QBtn
                      class="q-mt-sm"
                      rounded
                      outline
                      color="primary"
                      @click="openBookingModal(booking)"
                    >
                      افزودن توضیحات
                    </QBtn>
                  </div>
                </QCard>
              </template>
            </ActivityCard>
          </div>
        </QTimelineEntry>
      </QTimeline>
      <div v-if="!hasNextPage" class="row justify-center text-caption text-grey">
        اطلاعات دیگری جهت نمایش وجود ندارد
      </div>
    </QInfiniteScroll>
    <QDialog
      v-model="cancelModalVisible"
      persistent
      transition-show="scale"
      transition-hide="scale"
    >
      <QCard>
        <QCardSection class="row items-baseline">
          <QAvatar icon="info" color="negative" text-color="white" />
          <span class="q-ml-sm">
            {{ cancelBookingContent }}
          </span>
        </QCardSection>
        <QCardActions align="right">
          <QBtn v-close-popup on flat label="انصراف" color="negative" />
          <QBtn :loading="isPending" flat label="تایید" color="primary" @click="cancelBooking" />
        </QCardActions>
      </QCard>
    </QDialog>
  </div>
  <div v-else class="row column items-center q-mt-xl full-width full-height text-h5">
    <QInnerLoading :showing="isLoading || isPending" class="q-mx-auto q-my-auto">
      <QSpinnerTail color="primary" size="50px" />
    </QInnerLoading>
    <img src="@/assets/images/noData.svg" alt="noData" class="q-mt-xl" />
    <span>اطلاعاتی وجود ندارد</span>
  </div>
  <BookingForm
    v-if="bookingModalVisible"
    :visible="bookingModalVisible"
    :edit-value="formData"
    @close="closeBookingModal"
  />
  <VisitForm
    v-if="visitModalVisible"
    :visible="visitModalVisible"
    :edit-value="formData"
    @close="closeVisitModal"
  />
</template>

<script setup>
import { computed, ref, defineAsyncComponent, watchEffect } from 'vue'
import { useBookingInfinityQuery } from '@/modules/Booking'
import { IconPencil, IconDental, IconInfoCircle } from '@tabler/icons-vue'
import useDisclosure from '@/composables/use-disclosure'
import BookingForm from '@/modules/Booking/components/BookingForm'
import { convertToJalaliWithTime, formatDate } from '@/utils/date-utils'
import { handleError } from '@/utils/error-handler'
import { useCancellationMutation } from '@/modules/Booking/query'
import { useQueryClient } from '@tanstack/vue-query'
import { Notif } from '@/data/services/notification-service'
import VisitForm from '@/modules/Booking/components/VisitForm'

const ActivityCard = defineAsyncComponent(
  () =>
    import('@/modules/User/components/UserDetails/UserDetailsComponents/UserActivity/components/ActivityCard')
)

const props = defineProps({
  // eslint-disable-next-line vue/require-default-prop
  propData: Number,
})
const queryClient = useQueryClient()
const scrollTargetRef = ref(null)
const cancelModalVisible = ref(false)
const cancelBookingData = ref(null)
const filters = ref({
  'filter[user_id]': props.propData,
})
const formData = ref(null)
const enabled = computed(() => !!props.propData)
const {
  data: bookingsData,
  isLoading,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
  refetch,
} = useBookingInfinityQuery(filters, { enabled })
const { mutate: bookingCancellation, isPending } = useCancellationMutation()

const userBookingData = computed(() => {
  const pages = bookingsData.value?.pages || []
  return pages?.flatMap((pageData) => {
    return pageData.data.items.map((item) => ({
      ...item,
      advisorName: item?.advisor?.first_name || item?.advisor?.name || '',
      price: item?.visit?.price,
      branchName: item?.branch?.name,
    }))
  })
})

const bookingStatus = computed(() =>
  userBookingData.value?.map((booking) => ({
    title: booking.typeTitle,
    status: booking.canceledAt ? 'canceled' : booking.visit ? 'referred' : 'unknown',
    iconColor: booking?.canceledAt ? 'red-1' : booking.visit ? 'green-1' : 'white',
    iconTextColor: booking?.canceledAt ? 'negative' : booking.visit ? 'positive' : 'secondary',
  }))
)
const bookingDetails = computed(() =>
  userBookingData.value?.map((booking) => ({
    ...booking,
    id: booking?.id,
    bookingTimes: convertToJalaliWithTime(booking?.bookingAt),
    time: formatDate(booking?.bookingAt, 'HH:mm'),
    bookingStatus: bookingStatus.value,
  }))
)

const [bookingModalVisible, { toggle: toggleBookingModal }] = useDisclosure()
const [visitModalVisible, { toggle: toggleVisitModal }] = useDisclosure()
const openBookingModal = (data) => {
  formData.value = {
    ...data,
    visitType: 2,
  }
  toggleBookingModal()
}
const handleOpenVisitForm = (data) => {
  formData.value = data
  toggleVisitModal()
}
const closeBookingModal = () => {
  toggleBookingModal()
  formData.value = null
}
const closeVisitModal = () => {
  toggleVisitModal()
  formData.value = null
}
const showCancelModal = (data) => {
  cancelModalVisible.value = true
  cancelBookingData.value = data
}
const cancelBookingContent = computed(() => {
  return cancelBookingData.value.canceledAt && cancelBookingData.value.type === 1
    ? 'آیا از فعال کردن ویزیت اطمینان دارید؟'
    : cancelBookingData.value.canceledAt && cancelBookingData.value.type === 2
      ? 'آیا از فعال کردن نوبت اطمینان دارید؟'
      : !cancelBookingData.value.canceledAt && cancelBookingData.value.type === 1
        ? 'آیا از کنسل کردن ویزیت اطمینان دارید؟'
        : 'آیا از کنسل کردن نوبت اطمیان دارید؟'
})
const cancelBooking = () => {
  const cancelObj = {
    canceled_at: cancelBookingData.value.canceledAt
      ? null
      : formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
  }
  bookingCancellation(
    { id: cancelBookingData.value?.id, ...cancelObj },
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ['booking'] })
        Notif.success(response.message)
        cancelModalVisible.value = false
      },
      onError: (error) => {
        handleError(error)
        cancelModalVisible.value = false
      },
    }
  )
}
const loadNextPage = async (index, done) => {
  if (!hasNextPage.value || isFetchingNextPage.value) {
    done(false)
    return
  }
  await fetchNextPage()
  done()
}

watchEffect(() => props.propData, refetch())
</script>

<style lang="scss">
.serve-chips {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  height: 25px;
  width: 200px;
  text-align: center;
}
</style>
