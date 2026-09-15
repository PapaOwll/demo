<template>
  <div class="attendance-toolbar">
    <Button
      variant="flat"
      color="light-blue"
      type="button"
      text="تازه سازی لیست"
      @click="refetch"
    />
  </div>

  <div v-if="isError" class="attendance-state attendance-state--error">
    <Typography variant="body" size="2" color="red">خطا در بارگذاری اطلاعات</Typography>
    <Button
      variant="outline"
      color="light-blue"
      type="button"
      text="تلاش مجدد"
      class="attendance-retry-btn"
      :is-loading="isLoading"
      @click="refetch"
    />
  </div>

  <div v-else-if="groupedAttendance.length > 0" ref="scrollTargetRef" class="attendance-timeline">
    <QInfiniteScroll :offset="0" :scroll-target="scrollTargetRef" @load="loadNextPage">
      <template #loading>
        <div class="attendance-loading">
          <QSpinnerDots v-if="isFetchingNextPage" color="primary" size="lg" />
        </div>
      </template>

      <div class="attendance-list">
        <div v-for="group in groupedAttendance" :key="group.dateKey" class="attendance-day-group">
          <div class="attendance-day-header">
            <span class="attendance-day-dot" />
            <Typography variant="body" size="4" color="grey">
              {{ group.dayName }} ، {{ group.dateLabel }}
            </Typography>
          </div>

          <div class="attendance-day-items">
            <AttendanceRow
              v-for="attendance in group.items"
              :key="attendance.id"
              :attendance="attendance"
              :location-options="locationOptions"
              :can-delete="canDeleteAttendance"
              :can-edit="canEditAttendance"
              @delete="onDeleteAttendance"
              @updated="updateTable"
            />
          </div>
        </div>
      </div>
    </QInfiniteScroll>
  </div>

  <div v-else class="attendance-state attendance-state--empty">
    <QInnerLoading :showing="isLoading" class="attendance-spinner">
      <QSpinnerTail color="primary" size="50px" />
    </QInnerLoading>
    <template v-if="!isLoading">
      <div class="attendance-empty-icon-circle">
        <IconDoorEnter :size="26" class="attendance-empty-icon" />
      </div>
      <Typography variant="body" size="2" weight="bold" color="dark">تردد ثبت نشده!</Typography>
      <Typography variant="caption" color="grey">ترددها رو می‌تونی از اینجا ببینی</Typography>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useQueryClient } from '@tanstack/vue-query'
import { IconDoorEnter } from '@tabler/icons-vue'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import AttendanceRow from './AttendanceRow'
import { useUserStore } from '@/store/user'
import { useApiGetRooms } from '@/modules/Settings/ClinicSetting/query'
import { useAttendanceInfinityQuery } from '@/modules/Attendance/query'
import { convertToJalali } from '@/utils/date-utils'
import { getPerms } from '@/utils/get-perms'

const props = defineProps({
  propData: { type: Number, default: null },
  tabId: { type: [Number, String], default: null },
})

const queryClient = useQueryClient()
const userStore = useUserStore()
const { userData } = storeToRefs(userStore)
const scrollTargetRef = ref(null)

const userBranchId = computed(() => userData.value?.branch?.id)
const canDeleteAttendance = computed(() => getPerms('attendance', 'delete'))
const canEditAttendance = computed(() => getPerms('attendance', 'update'))

const filters = computed(() => ({ 'filter[user_id]': props.propData }))
const enabled = computed(() => !!props.propData)

const {
  data: attendanceData,
  isLoading,
  isError,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
  refetch,
} = useAttendanceInfinityQuery(filters, { enabled })

const userAttendanceData = computed(() => {
  const pages = attendanceData.value?.pages || []
  return pages.flatMap((pageData) => pageData.data.items.map((item) => ({ ...item })))
})

const groupedAttendance = computed(() => {
  const groups = []
  const indexByKey = new Map()

  userAttendanceData.value.forEach((attendance) => {
    const dateKey = convertToJalali(attendance.checkedInAt, 'jYYYY/jMM/jDD')
    if (!indexByKey.has(dateKey)) {
      indexByKey.set(dateKey, groups.length)
      groups.push({
        dateKey,
        dateLabel: dateKey,
        dayName: convertToJalali(attendance.checkedInAt, 'jdddd'),
        items: [],
      })
    }
    groups[indexByKey.get(dateKey)].items.push(attendance)
  })

  return groups
})

const loadNextPage = async (_, done) => {
  if (!hasNextPage.value) {
    done(false)
    return
  }
  await fetchNextPage()
  done()
}

const updateTable = async () => {
  await queryClient.invalidateQueries({ queryKey: ['attendance', 'all-attendance'] })
}

const { data: roomsData } = useApiGetRooms({
  branchId: userBranchId.value,
  enabled: () => !!userBranchId.value,
})

const locationOptions = computed(() => {
  const items = roomsData.value?.items || []
  return items.map((room) => ({ label: room.title, value: room.id }))
})

const deleteDialog = reactive({ show: false, item: null })

const onDeleteAttendance = (attendance) => {
  deleteDialog.item = attendance
  deleteDialog.show = true
}
</script>

<style scoped lang="scss">
.attendance-toolbar {
  display: flex;
  justify-content: flex-end;
}

.attendance-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: 70vh;

  &--error {
    gap: 16px;
    padding-top: 48px;
  }

  &--empty {
    justify-content: center;
  }
}

.attendance-retry-btn {
  margin-top: 16px;
}

.attendance-loading {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.attendance-spinner {
  margin: auto;
}

.attendance-timeline {
  position: relative;
  width: 100%;
  padding-inline-end: 10px;
}

.attendance-list {
  display: flex;
  flex-direction: column;
}

.attendance-day-group {
  position: relative;
  margin-bottom: 16px;
}

.attendance-day-header {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  margin-left: -16px;
}

.attendance-day-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: $blue-grey-3;
  position: relative;
  margin-right: -12px;

  &::after {
    content: '';
    position: absolute;
    top: 6px;
    right: 2px;
    width: 1px;
    height: 68px;
    background-color: $blue-grey-3;
  }
}

.attendance-day-group:last-child .attendance-day-dot::after {
  display: none;
}

.attendance-day-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// ---- Empty state ----
.attendance-empty-icon-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background-color: rgba($primary, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 8px;
    border-radius: 50%;
    background-color: $primary;
  }
}

.attendance-empty-icon {
  position: relative;
  z-index: 1;
  color: $white;
}
</style>
