<template>
  <QCard flat class="q-pa-none">
    <QCardSection v-if="getPerms('attendance', 'add')" class="q-pa-none q-mb-md">
      <AttendanceCheckInBanner @submitted="afterSubmit" />
    </QCardSection>

    <QCardSection class="attendance-list__header q-pa-none q-mb-md">
      <div class="attendance-list__header-row">
        <QBtn
          outline
          color="primary"
          no-caps
          class="attendance-list__filter-btn"
          @click="showFilters = !showFilters"
        >
          <IconEyeClosed v-if="showFilters" :size="20" class="q-mr-sm" />
          <IconEye v-else :size="20" class="q-mr-sm" />
          {{ showFilters ? 'پنهان کردن فیلتر' : 'نمایش فیلتر' }}
        </QBtn>

        <div class="attendance-list__actions">
          <QBtn fab-mini flat unelevated :loading="isFetching" @click="refreshTable">
            <IconRefresh class="text-grey" />
          </QBtn>

          <Transition name="tab-switch" mode="out-in">
            <QBtnToggle
              :key="activeTab"
              v-model="activeTab"
              no-caps
              unelevated
              class="attendance-list__tab-toggle"
              :options="[
                { label: 'افراد حاضر', value: 'present' },
                { label: 'تاریخچه', value: 'history' },
              ]"
            />
          </Transition>
        </div>
      </div>

      <Transition name="filters-slide">
        <div v-if="showFilters" class="attendance-list__filters">
          <UserSelectField
            v-model="filterUserId"
            label="کاربر"
            placeholder="جستجوی کاربر..."
            dense
            class="attendance-list__filter-input"
            @update:model-value="onFilterChange"
          />
          <RoomSelectField
            v-model="filterRoomId"
            label="اتاق"
            placeholder="انتخاب اتاق..."
            :branch-id="userBranchId"
            dense
            class="attendance-list__filter-input"
            @update:model-value="onFilterChange"
          />
          <Transition name="date-filters">
            <PersianDateRange
              v-if="activeTab === 'history'"
              v-model="filterDateRange"
              label="تاربخ ورود"
              max-today
              class="attendance-list__filter-input"
              @update:model-value="onFilterChange"
            />
          </Transition>
        </div>
      </Transition>
    </QCardSection>

    <!-- Present Tab with Today/Old Lists -->
    <template v-if="activeTab === 'present'">
      <!-- Empty State -->
      <div v-if="!hasPresentPeople && !loadingPresent" class="empty-state">
        <img src="@/assets/images/noData.svg" alt="no-data" class="empty-state__image" />
        <span class="empty-state__text">هیچ ترددی وجود نداره</span>
      </div>

      <!-- Old Records (filter[today]=0) - Collapsible with Orange Wrapper -->
      <div v-if="oldAttendanceData.length > 0" class="attendance-list__old-wrapper q-mb-md">
        <QCard flat bordered class="attendance-list__section">
          <div
            class="attendance-list__section-header cursor-pointer"
            @click="showOldList = !showOldList"
          >
            <div class="attendance-list__section-header-content">
              <QIcon
                :name="showOldList ? 'expand_less' : 'expand_more'"
                size="sm"
                color="warning"
              />

              <div class="attendance-list__section-title">
                <Typography variant="body" size="2" weight="bold" color="warning">
                  ترردهای قدیمی بدون خروج ({{ oldAttendanceData.length }} مورد)
                </Typography>
              </div>
            </div>
          </div>

          <QSlideTransition>
            <div v-show="showOldList">
              <AttendanceTable
                :rows="oldAttendanceData"
                :columns="tableColumns"
                :loading="loadingOld"
                :has-next-page="hasNextPageOld"
                :is-fetching-next-page="isFetchingNextPageOld"
                :branch-id="userBranchId"
                @checkout="handleCheckOut"
                @edit="openEditDialog"
                @room-update="handleRoomUpdate"
                @load-more="loadNextPageOld"
              />
            </div>
          </QSlideTransition>
        </QCard>
      </div>

      <!-- Today's Records (filter[today]=1) -->
      <div v-if="todayAttendanceData.length > 0 || loadingToday">
        <AttendanceTable
          :rows="todayAttendanceData"
          :columns="tableColumns"
          :loading="loadingToday"
          :has-next-page="hasNextPageToday"
          :is-fetching-next-page="isFetchingNextPageToday"
          :branch-id="userBranchId"
          @checkout="handleCheckOut"
          @edit="openEditDialog"
          @room-update="handleRoomUpdate"
          @load-more="loadNextPageToday"
        />
      </div>
    </template>

    <!-- History Tab - Normal Table -->
    <template v-else>
      <AttendanceTable
        :rows="attendanceData"
        :columns="tableColumns"
        :loading="loadingHistory"
        :has-next-page="hasNextPage"
        :is-fetching-next-page="isFetchingNextPage"
        :branch-id="userBranchId"
        @checkout="handleCheckOut"
        @edit="openEditDialog"
        @room-update="handleRoomUpdate"
        @load-more="loadNextPage"
      />
    </template>
  </QCard>

  <AttendanceEditDialog
    :visible="editDialogVisible"
    :edit-value="selectedAttendanceData"
    @close="closeEditDialog"
    @submitted="afterSubmit"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { Notif } from '@/data/services/notification-service'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/user'
import { getPerms } from '@/utils/get-perms'
import Typography from '@/base/Typography'
import AttendanceCheckInBanner from '../components/AttendanceCheckInBanner'
import AttendanceEditDialog from '../components/AttendanceEditDialog'
import AttendanceTable from '../components/AttendanceTable'
import { useApiCheckOut, useApiUpdateAttendance, useAttendanceInfinityQuery } from '../query'
import { useQueryClient } from '@tanstack/vue-query'
import { handleError } from '@/utils/error-handler'
import { tableColumns } from '../constants/index'
import { IconRefresh, IconEyeClosed, IconEye } from '@tabler/icons-vue'
import UserSelectField from '@/components/Form/UserSelectField'
import PersianDateRange from '@/components/Form/PersianDateRange'
import RoomSelectField from '@/components/Form/RoomSelectField'

const queryClient = useQueryClient()
const userStore = useUserStore()
const { userData } = storeToRefs(userStore)

const userBranchId = computed(() => userData.value?.branch?.id)

const editDialogVisible = ref(false)
const selectedAttendanceData = ref(null)
const showFilters = ref(false)
const activeTab = ref('present')
const filterUserId = ref(null)
const filterRoomId = ref(null)
const filterDateRange = ref(null)
const showOldList = ref(false)

// Base API filters
const apiFilters = computed(() => {
  const filters = {}
  if (filterUserId.value) {
    filters['filter[user_id]'] = filterUserId.value?.value || filterUserId.value
  }
  if (filterRoomId.value) {
    filters['filter[room_id]'] = filterRoomId.value?.value || filterRoomId.value
  }
  if (activeTab.value === 'present') {
    filters['filter[is_checked_out]'] = 0
  } else {
    if (filterDateRange.value?.from) {
      filters['filter[checked_in_at_from]'] = `${filterDateRange.value.from} 00:00:00`
    }
    if (filterDateRange.value?.to) {
      filters['filter[checked_in_at_to]'] = `${filterDateRange.value.to} 23:59:59`
    }
  }
  if (userBranchId.value) {
    filters['filter[branch_id]'] = userBranchId.value
  }
  return filters
})

// Today's records (filter[today]=1) - Only for present tab
const apiFiltersToday = computed(() => ({
  ...apiFilters.value,
  'filter[today]': 1,
}))

const {
  data: todayAttendanceDataPages,
  isLoading: isLoadingToday,
  fetchNextPage: fetchNextPageToday,
  isFetchingNextPage: isFetchingNextPageToday,
  hasNextPage: hasNextPageToday,
} = useAttendanceInfinityQuery(apiFiltersToday)

const todayAttendanceData = computed(() => {
  return (
    todayAttendanceDataPages.value?.pages?.flatMap((pageData) => {
      return pageData.data.items.map((item) => ({
        ...item,
      }))
    }) || []
  )
})

// Old records (filter[today]=0) - Only for present tab
const apiFiltersOld = computed(() => ({
  ...apiFilters.value,
  'filter[today]': 0,
}))

const {
  data: oldAttendanceDataPages,
  isLoading: isLoadingOld,
  fetchNextPage: fetchNextPageOld,
  isFetchingNextPage: isFetchingNextPageOld,
  hasNextPage: hasNextPageOld,
} = useAttendanceInfinityQuery(apiFiltersOld)

const oldAttendanceData = computed(() => {
  return (
    oldAttendanceDataPages.value?.pages?.flatMap((pageData) => {
      return pageData.data.items.map((item) => ({
        ...item,
      }))
    }) || []
  )
})

// History records (no today filter) - Only for history tab
const {
  data: attendanceDataPages,
  isLoading: isLoadingHistory,
  isFetching,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
} = useAttendanceInfinityQuery(apiFilters)

const attendanceData = computed(() => {
  return (
    attendanceDataPages.value?.pages?.flatMap((pageData) => {
      return pageData.data.items.map((item) => ({
        ...item,
      }))
    }) || []
  )
})

// Loading states
const hasPresentPeople = computed(() => {
  return todayAttendanceData.value.length > 0 || oldAttendanceData.value.length > 0
})

const loadingToday = computed(() => {
  return (
    isFetchingNextPageToday.value ||
    (isLoadingToday.value && todayAttendanceData.value.length === 0)
  )
})

const loadingOld = computed(() => {
  return isFetchingNextPageOld.value || (isLoadingOld.value && oldAttendanceData.value.length === 0)
})

const loadingPresent = computed(() => {
  return loadingToday.value || loadingOld.value
})

const loadingHistory = computed(() => {
  return isFetchingNextPage.value || (isLoadingHistory.value && attendanceData.value.length === 0)
})

// Pagination handlers
const loadNextPageToday = () => {
  if (!hasNextPageToday.value) return
  fetchNextPageToday()
}

const loadNextPageOld = () => {
  if (!hasNextPageOld.value) return
  fetchNextPageOld()
}

const loadNextPage = () => {
  if (!hasNextPage.value) return
  fetchNextPage()
}

// Table actions
const updateTable = async () => {
  await queryClient.invalidateQueries({ queryKey: ['attendance', 'all-attendance'] })
}

const refreshTable = async () => {
  await updateTable()
  Notif.success('لیست بروزرسانی شد')
}

const onFilterChange = () => {
  queryClient.invalidateQueries({ queryKey: ['attendance', 'all-attendance'] })
}

const openEditDialog = (data) => {
  selectedAttendanceData.value = data
  editDialogVisible.value = true
}

const closeEditDialog = () => {
  editDialogVisible.value = false
  selectedAttendanceData.value = null
}

const { mutate: checkOut } = useApiCheckOut()
const { mutate: updateAttendanceRoom } = useApiUpdateAttendance()

const handleRoomUpdate = ({ row, roomId }) => {
  const data = {
    id: row.id,
    checkedInAt: row.checkedInAt,
    checkedOutAt: row.checkedOutAt,
  }

  if (roomId) {
    data.roomId = roomId?.value || roomId
  }

  updateAttendanceRoom(data, {
    onSuccess: (response) => {
      updateTable()
      Notif.success(response.message || 'اتاق با موفقیت تغییر کرد')
    },
    onError: (error) => {
      handleError(error)
    },
  })
}

const afterSubmit = () => {
  editDialogVisible.value = false
  selectedAttendanceData.value = null
  updateTable()
}

const handleCheckOut = (row) => {
  checkOut(row?.id, {
    onSuccess: (response) => {
      updateTable()
      Notif.success(response.message || 'خروج با موفقیت ثبت شد')
    },
    onError: (error) => {
      handleError(error)
    },
  })
}
</script>

<style lang="scss" scoped>
.attendance-list {
  &__header {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__header-row {
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  &__filter-btn {
    border-radius: 8px;
    padding: 8px 20px 8px 35px;
    min-height: 44px;
  }

  &__actions {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    gap: 8px;
  }

  &__tab-toggle {
    border-radius: 4px;
    overflow: hidden;

    :deep(.q-btn-group) {
      border-radius: 4px;
      overflow: hidden;
    }

    :deep(.q-btn) {
      padding: 8px 40px;
      min-height: 44px;
      border-radius: 0 !important;
    }

    :deep(.q-btn--active) {
      background-color: $primary;
      color: white;
    }

    :deep(.q-btn:not(.q-btn--active)) {
      background-color: $grey-2;
      color: $grey-8;
    }
  }

  .tab-switch-enter-active,
  .tab-switch-leave-active {
    transition: opacity 0.2s ease;
  }

  .tab-switch-enter-from,
  .tab-switch-leave-to {
    opacity: 0;
  }

  &__filters {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 14px;
  }

  &__old-wrapper {
    background-color: $amber-1;
    border-radius: 8px !important;
    border: 2px solid $amber-5 !important;
    padding: 24px;
    color: $amber-8;
  }

  &__section-header {
    padding: 12px 16px;
    transition: background-color 0.2s ease;
    background-color: $amber-1;
    border: none !important;

    &:hover {
      opacity: 0.9;
    }
  }

  &__section-header-content {
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    align-items: center;
  }

  &__section-title {
    display: flex;
    align-items: center;
  }
}

.filters-slide-enter-active,
.filters-slide-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease,
    max-height 0.3s ease;
  max-height: 100px;
}

.filters-slide-enter-from,
.filters-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.date-filters-enter-active,
.date-filters-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.date-filters-enter-from,
.date-filters-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.attendance-list__filter-input {
  flex: 0 0 calc(33.333% - 10px);
  max-width: calc(33.333% - 10px);

  :deep(.q-field) {
    margin-bottom: 0;
    padding-bottom: 0;
  }

  :deep(.q-field__control) {
    height: 56px;
    min-height: 56px;
  }

  :deep(.q-field__bottom) {
    display: none;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
  margin-top: 80px;

  &__image {
    width: 200px;
    margin-bottom: 16px;
  }

  &__text {
    font-size: 18px;
    color: $grey-7;
    text-align: center;
  }
}
</style>
