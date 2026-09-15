<template>
  <div class="sidebar" :class="{ 'sidebar--collapsed': isCollapsed }">
    <div class="sidebar__content">
      <Transition name="sidebar-slide" mode="out-in">
        <div v-if="isLoading" key="loading" class="sidebar__loading">
          <QSpinner color="primary" size="32px" />
        </div>

        <div v-else-if="!showDetail" key="list" class="sidebar__scroll">
          <Button
            variant="filled"
            color="light-blue"
            is-full-width
            class="sidebar__add-btn"
            :left-icon="IconPlus"
            text="افزودن نوبت جدید"
            @click="emit('add', $event)"
          />

          <div class="sidebar__date-bar">
            <Typography variant="body" size="4" color="grey" class="sidebar__date-text">
              {{ displayDate }}
            </Typography>
            <div class="sidebar__date-collapse" @click="isCollapsed = true">
              <IconChevronRight :size="16" />
            </div>
          </div>

          <div class="sidebar__list">
            <div
              v-for="(booking, idx) in sortedBookings"
              :key="booking.id"
              class="sidebar__card"
              :style="{ animationDelay: `${idx * 0.04}s` }"
              @click="selectBooking(booking)"
            >
              <div class="sidebar__card-name">{{ getCustomerName(booking) }}</div>
              <div class="sidebar__card-time">{{ bookingTimeRange(booking) }}</div>
            </div>

            <div v-if="sortedBookings.length === 0" class="sidebar__empty">
              <Typography variant="body" size="3" color="grey">
                نوبتی برای این روز ثبت نشده
              </Typography>
            </div>
          </div>
        </div>

        <div v-else-if="!selectedBooking" key="detail-loading" class="sidebar__loading">
          <div class="sidebar__skeleton">
            <div class="sidebar__skeleton-header">
              <QSkeleton type="text" width="60%" />
              <QSkeleton type="text" width="40%" />
            </div>
            <QSkeleton height="80px" />
            <QSkeleton height="60px" />
            <QSkeleton height="40px" />
          </div>
        </div>

        <div v-else key="edit" class="sidebar__scroll">
          <BookingEditSidebar
            :edit-value="selectedBooking"
            :doctors="doctors"
            @close="onDetailClose"
            @after-submit="onEditSubmit"
          />
        </div>
      </Transition>
    </div>

    <div class="sidebar__strip">
      <Button
        variant="filled"
        color="light-blue"
        :is-icon-only="true"
        :left-icon="IconPlus"
        @click="emit('add', $event)"
      />
      <Button
        variant="outline"
        color="grey"
        size="sm"
        :is-icon-only="true"
        :left-icon="IconChevronLeft"
        @click="isCollapsed = !isCollapsed"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { formatJalali } from '@/utils/date-utils'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import BookingEditSidebar from './BookingEditSidebar'
import { getCustomerName, getBookingTimeRange } from '../../utils/bookingDisplay'
import { IconPlus, IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'

const props = defineProps({
  bookings: { type: Array, default: () => [] },
  displayDate: { type: String, default: '' },
  selectedBooking: { type: Object, default: null },
  isLoading: { type: Boolean, default: false },
  isDetailLoading: { type: Boolean, default: false },
  doctors: { type: Array, default: () => [] },
})

const emit = defineEmits(['add', 'select-booking'])

const isCollapsed = ref(false)
const showDetail = ref(false)

watch(
  () => props.selectedBooking,
  (booking) => {
    if (booking) {
      showDetail.value = true
      isCollapsed.value = false
    } else {
      showDetail.value = false
    }
  }
)

watch(
  () => props.displayDate,
  () => {
    showDetail.value = false
  }
)

const sortedBookings = computed(() => {
  if (!props.bookings?.length) return []
  const seen = new Set()
  const unique = props.bookings.filter((b) => {
    if (!b.id || seen.has(b.id)) return false
    seen.add(b.id)
    return true
  })
  return [...unique].sort((a, b) => {
    const da = new Date(a.bookingAt)
    const db = new Date(b.bookingAt)
    if (Number.isNaN(da.getTime())) return 1
    if (Number.isNaN(db.getTime())) return -1
    return da.getTime() - db.getTime()
  })
})

function bookingTimeRange(booking) {
  const d = new Date(booking?.bookingAt)
  if (Number.isNaN(d.getTime())) return ''
  const dayName = formatJalali(d, 'jdddd')
  const { time, endTime } = getBookingTimeRange(booking)
  return `${dayName}، ${time} تا ${endTime}`
}

function selectBooking(booking) {
  emit('select-booking', booking)
}

function onEditSubmit() {
  showDetail.value = false
  emit('select-booking', null)
}

function onDetailClose() {
  showDetail.value = false
  emit('select-booking', null)
}
</script>

<style scoped lang="scss">
.sidebar {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  direction: rtl;
  overflow: hidden;
  transition: width 0.38s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  width: 340px;
  padding: $spacing-sm;

  &--collapsed {
    width: 70px;

    .sidebar__content {
      opacity: 0;
      pointer-events: none;
    }

    .sidebar__strip {
      display: flex;
    }
  }

  &__loading {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border: 1px solid $grey-4;
    border-radius: $radius-lg;
  }

  &__skeleton {
    width: 100%;
    padding: 14px $spacing-lg;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__skeleton-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 4px;
  }

  &__content {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    opacity: 1;
    transition: opacity 0.18s ease;
  }

  &__scroll {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: 6px $spacing-md 2px;
    overflow-y: auto;
    overflow-x: hidden;
    background: #fff;
    border: 1px solid $grey-4;
    border-radius: $radius-lg;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: $grey-5;
      border-radius: $radius-xs;
    }
  }

  &__strip {
    display: none;
    flex-shrink: 0;
    width: 100%;
    flex-direction: column;
    align-items: center;
    padding: 14px 0 0;
    gap: 10px;
    background: #fff;
    border: 1px solid $grey-4;
    border-radius: $radius-lg;
    height: 100%;
    box-sizing: border-box;
  }

  &__date-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    border-radius: 14px;
    padding: 10px 14px;
    flex-shrink: 0;
  }

  &__date-text {
    color: $grey-6;
    font-size: 13px;
    white-space: nowrap;
  }

  &__date-collapse {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $grey-1;
    border-radius: $radius-sm;
    color: $grey-7;
    cursor: pointer;
    border: 1px solid $grey-3;
    transition: background 0.15s;
    flex-shrink: 0;

    &:hover {
      background: $blue-2;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    flex: 1;
  }

  &__card {
    background: #fff;
    padding: 13px $spacing-lg;
    border-bottom: 1px solid $grey-3;
    display: flex;
    flex-direction: column;
    gap: 3px;
    cursor: pointer;
    transition:
      box-shadow 0.18s,
      transform 0.12s;
    animation: sidebar__fade-up 0.3s both;

    &:hover {
      border-radius: 14px;
      padding: 13px $spacing-lg;
      border: 1px solid $grey-2;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.1);
      transform: translateY(-1px);
    }
  }

  &__card-name {
    font-size: 14.5px;
    font-weight: 700;
    color: #111827;
    line-height: 1.4;
  }

  &__card-time {
    font-size: 12px;
    color: $grey-6;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-3xl 0;
  }

  &__detail-back {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    justify-content: flex-end;
    font-size: 13px;
    color: $blue-7;
    cursor: pointer;
    flex-shrink: 0;
  }

  &__add-btn {
    min-height: 44px;
    flex-shrink: 0;
  }
}

@keyframes sidebar__fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: all 0.25s ease;
}

.sidebar-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.sidebar-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
