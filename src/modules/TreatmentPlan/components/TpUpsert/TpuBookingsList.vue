<template>
  <div class="tpb">
    <QCardActions class="tpb__top" @click.self="expanded = !expanded">
      <span @click="expanded = !expanded">نوبت های انجام کار</span>
      <QSpace />
      <QBtn
        color="grey"
        round
        flat
        dense
        :icon="expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
        @click="expanded = !expanded"
      />
    </QCardActions>

    <QSlideTransition>
      <div v-show="expanded" class="tpb__items-content">
        <template v-if="loading || bookingListData === undefined">
          <div class="tpb__skeleton">
            <QList bordered class="tpb__list">
              <QItem v-for="n in 3" :key="n" class="tpb__list-item">
                <QItemSection>
                  <QItemLabel class="tpb__item-header">
                    <div class="tpb__content-section">
                      <div class="tpb__date-info">
                        <QSkeleton type="text" width="60px" height="16px" class="q-mr-sm" />
                        <QSkeleton type="text" width="120px" height="16px" />
                      </div>

                      <div class="tpb__action-section">
                        <QSkeleton type="text" width="80px" height="24px" />
                      </div>
                    </div>
                  </QItemLabel>
                </QItemSection>
              </QItem>
            </QList>
          </div>
        </template>

        <template v-else>
          <div v-if="bookingItems?.length" class="tpb__items">
            <QCard
              v-if="isFetched && !loading && todayBookings.length === 0"
              flat
              bordered
              class="tpb__alert"
            >
              <QCardSection class="tpb__alert-content">
                <div class="tpb__alert-icon">
                  <IconCalendarOff stroke="1.5" size="24" />
                </div>
                <div class="tpb__alert-text">
                  <span>امروز نوبت انجام کار ندارید</span>
                </div>
              </QCardSection>
            </QCard>

            <QList bordered class="tpb__list">
              <QItem v-for="booking in bookingItems" :key="booking.id" flat class="tpb__list-item">
                <QItemSection>
                  <QItemLabel class="tpb__item-header">
                    <div class="tpb__content-section">
                      <div class="tpb__date-info">
                        <span class="tpb__day-name">{{ booking.dayName }}</span>
                        <span class="tpb__booking-date">{{ booking.formattedDate }}</span>
                      </div>

                      <div class="tpb__action-section">
                        <div v-if="booking.isToday" class="tpb__booking-time">
                          {{ booking.formattedTime }}
                        </div>
                        <QBtn
                          v-else
                          flat
                          dense
                          color="primary"
                          class="tpb__view-details-btn"
                          label="مشاهده جزئیات"
                          @click="handleViewBookingDetail(booking)"
                        />
                      </div>
                    </div>
                  </QItemLabel>
                </QItemSection>
              </QItem>
            </QList>
          </div>
          <div v-else-if="isFetched && !loading">
            <QCard flat bordered>
              <QCardSection>
                <div class="tpb__no-items">
                  <div>
                    <IconCalendarOff stroke="1.5" size="32" class="tpb__no-items-icon" />
                  </div>
                  <div class="tpb__no-items-text">
                    <span>نوبت انجام کاری یافت نشد</span>
                    <span>برای ادامه ابتدا نوبت انجام کار ایجاد کنید</span>
                  </div>
                </div>
              </QCardSection>
            </QCard>
          </div>
        </template>
      </div>
    </QSlideTransition>
  </div>
  <BookingDetail
    :booking-data="bookingDetailData"
    :visible="bookingDataVisible"
    @close="closeBookingDetailDialog"
  />
</template>

<script setup>
import { watch, ref, computed } from 'vue'
import {
  QList,
  QItem,
  QItemSection,
  QItemLabel,
  QCardActions,
  QSlideTransition,
  QBtn,
  QSpace,
  QSkeleton,
  QCard,
  QCardSection,
} from 'quasar'
import { useBookingInfinityQuery } from '@/modules/Booking'
import { formatJalali } from '@/utils/date-utils'
import { IconCalendarOff } from '@tabler/icons-vue'
import BookingDetail from '@/modules/Booking/components/BookingDetail'
import { useTpProvider } from '../../composables/use-tp-provider'

const treatmentData = useTpProvider('treatmentData')
const loading = ref(true)
const expanded = ref(true)
const bookingDetailData = ref(null)
const bookingDataVisible = ref(false)
const today = new Date()

const filters = ref({
  'filter[type]': 2,
  'filter[user_id]': computed(() => treatmentData?.value?.user?.id),
  'filter[treatment_plan]': computed(() => treatmentData?.value?.id),
})

const {
  data: bookingListData,
  isLoading,
  isFetched,
} = useBookingInfinityQuery(filters, {
  enabled: computed(() => !!treatmentData?.value?.user?.id),
})

const bookingItems = computed(() => {
  if (!bookingListData.value?.pages?.length) return []

  return bookingListData.value.pages
    .flatMap(
      (pageData) =>
        pageData.data?.items?.map((item) => {
          const bookingDate = new Date(item.bookingAt)
          const isToday = bookingDate.toDateString() === today.toDateString()

          return {
            ...item,
            isToday,
            dayName: formatJalali(bookingDate, 'jdddd'),
            formattedDate: formatJalali(bookingDate, 'jDD jMMMM jYYYY'),
            formattedTime: bookingDate.toLocaleTimeString('fa-IR', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
            branchName: item?.branch?.name,
            coordinator: item?.userOwner?.name,
          }
        }) || []
    )
    .filter(Boolean)
})

const todayBookings = computed(() => {
  return bookingItems.value.filter((booking) => booking.isToday)
})

watch(
  isLoading,
  (val) => {
    loading.value = val
  },
  { immediate: true }
)

const openBookingDetailDialog = (data) => {
  bookingDetailData.value = data
  bookingDataVisible.value = true
}

const closeBookingDetailDialog = () => {
  bookingDataVisible.value = false
}

const handleViewBookingDetail = (booking) => {
  openBookingDetailDialog(booking)
}
</script>

<style lang="scss" scoped>
.tpb {
  border: 1px solid $grey-3;
  border-radius: 0.5rem;
  background-color: $grey-1 !important;

  &__items-content {
    padding: 1rem;
  }

  &__top {
    cursor: pointer;
  }

  &__alert {
    background: $yellow-9;
    border-radius: 0.5rem;
    margin-bottom: 1rem;

    &-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
    }

    &-icon {
      color: white;
    }

    &-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.875rem;
      color: white;
    }
  }

  &__items {
    margin-top: 0.5rem;
  }

  &__list {
    border-radius: 0.5rem;
    overflow: hidden;
    border: none;
    background: transparent;

    .q-item {
      &:hover {
        background-color: $grey-1;
      }
    }
  }

  &__list-item {
    border: 1px solid $grey-4;
    border-radius: 12px;
    margin-bottom: 0.75rem;
    padding: 0;
    background: white;
    transition: all 0.2s ease;

    &:hover {
      border-color: $grey-5;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__item-header {
    font-size: 0.875rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    min-height: 3rem;
  }

  &__content-section {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  &__date-info {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    flex: 1;
    align-items: center;
  }

  &__day-name {
    font-size: 0.875rem;
    color: $blue-grey-6;
    font-weight: normal;
    line-height: 1.3;
  }

  &__booking-date {
    font-size: 0.875rem;
    color: $grey-8;
    font-weight: 600;
    line-height: 1.3;
  }

  &__action-section {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  &__view-details-btn {
    text-decoration: underline;
  }

  &__booking-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-left: 0.5rem;
  }

  &__booking-time {
    color: $primary;
    font-weight: bold;
    font-size: 0.875rem;
    direction: ltr;
    text-align: right;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    min-width: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__item-content {
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__services {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &-label {
      font-size: 0.75rem;
      color: $blue-grey-6;
      font-weight: 600;
    }

    &-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }
  }

  &__service-chip {
    font-size: 0.75rem;
    height: 1.5rem;
  }

  &__branch,
  &__coordinator {
    color: $blue-grey-6;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  &__no-items {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    text-align: center;

    &-icon {
      color: $blue-grey-4;
    }

    &-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      color: $blue-grey-6;
      font-size: 0.875rem;

      span:first-child {
        font-weight: 600;
      }
    }
  }

  &__skeleton {
    .q-item {
      pointer-events: none;
    }
  }
}
</style>
