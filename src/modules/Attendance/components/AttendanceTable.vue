<template>
  <Transition name="table-fade" mode="out-in">
    <QTable
      :key="String(rows.length)"
      v-model:pagination="internalPagination"
      :rows="rows"
      :columns="columns"
      :loading="loading"
      row-key="id"
      class="quasar-table"
      :rows-per-page-options="[0]"
      :no-data-label="null"
      flat
    >
      <template #loading>
        <QInnerLoading size="40px" color="primary" />
        <div class="no-data">
          <QSpinnerTail color="primary" size="lg" />
        </div>
      </template>

      <template v-if="rows && rows.length === 0" #no-data>
        <div v-if="!loading" class="flex column justify-center items-center q-mx-auto">
          <img src="@/assets/images/noData.svg" alt="no-data" />
          <span class="text-h6 text-grey-7">اطلاعاتی یافت نشد</span>
        </div>
      </template>

      <template #body-cell-userFullName="scope">
        <QTd :props="scope">
          <UserMenu :user="scope.row.user" @update-table="$emit('refresh')" />
        </QTd>
      </template>

      <template #body-cell-day="scope">
        <QTd :props="scope">
          <div v-if="scope.row?.checkedInAt" class="attendance-table__day">
            <span class="attendance-table__day-name">
              {{ formatDayName(scope.row.checkedInAt) }}
            </span>
            <span class="attendance-table__day-date">
              {{ formatDate(scope.row.checkedInAt) }}
            </span>
          </div>
          <span v-else class="text-grey-6">-</span>
        </QTd>
      </template>

      <template #body-cell-adminName="scope">
        <QTd :props="scope">
          <span v-if="scope.row?.admin">{{ scope.row.admin.name }}</span>
          <span v-else class="text-grey-6">-</span>
        </QTd>
      </template>

      <template #body-cell-room="scope">
        <QTd :props="scope">
          <RoomPopupSelect
            v-if="getPerms('attendance', 'update')"
            :model-value="scope.row?.room?.id"
            :branch-id="branchId"
            :room-name="scope.row?.room?.name"
            @update:model-value="(value) => $emit('room-update', { row: scope.row, roomId: value })"
          />
          <span v-else class="text-grey-6">{{ scope.row?.room?.name || '-' }}</span>
        </QTd>
      </template>

      <template #body-cell-checkedInAt="scope">
        <QTd :props="scope">
          <div
            v-if="scope?.row?.checkedInAt"
            class="attendance-table__status-tag attendance-table__status-tag--success"
          >
            ثبت شده | {{ formatTime(scope.row.checkedInAt) }}
          </div>
          <span v-else class="text-grey-6">-</span>
        </QTd>
      </template>

      <template #body-cell-checkedOutAt="scope">
        <QTd :props="scope">
          <div
            v-if="scope?.row?.checkedOutAt"
            class="attendance-table__status-tag attendance-table__status-tag--success"
          >
            ثبت شده | {{ formatTime(scope.row.checkedOutAt) }}
          </div>
          <div v-else class="attendance-table__status-tag attendance-table__status-tag--pending">
            بدون وضعیت
          </div>
        </QTd>
      </template>

      <template #body-cell-checkoutAction="scope">
        <QTd :props="scope">
          <QBtn
            v-if="getPerms('attendance', 'update') && !scope.row.checkedOutAt"
            flat
            no-caps
            color="primary"
            label="ثبت خروج"
            class="attendance-table__checkout-btn"
            @click="$emit('checkout', scope.row)"
          />
          <span v-else class="text-grey-5">-</span>
        </QTd>
      </template>

      <template #body-cell-actions="scope">
        <QTd :props="scope">
          <QBtn
            v-if="getPerms('attendance', 'update')"
            square
            size="sm"
            outline
            color="primary"
            padding="6px"
            @click="$emit('edit', scope.row)"
          >
            <IconEdit :size="20" />
            <QTooltip>ویرایش</QTooltip>
          </QBtn>
        </QTd>
      </template>

      <template #bottom>
        <div class="full-width flex justify-center items-center">
          <QBtn
            color="primary"
            outline
            unelevated
            :label="hasNextPage ? 'مشاهده موارد بیشتر...' : 'مورد بیشتری وجود ندارد'"
            :loading="isFetchingNextPage"
            @click="$emit('load-more')"
          />
        </div>
      </template>
    </QTable>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'
import { getPerms } from '@/utils/get-perms'
import UserMenu from '@/components/UserMenu'
import RoomPopupSelect from './RoomPopupSelect'
import { IconEdit } from '@tabler/icons-vue'
import { convertToJalali } from '@/utils/date-utils'

defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  columns: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  hasNextPage: {
    type: Boolean,
    default: false,
  },
  isFetchingNextPage: {
    type: Boolean,
    default: false,
  },
  branchId: {
    type: [Number, String],
    default: null,
  },
})

defineEmits(['checkout', 'edit', 'load-more', 'refresh', 'room-update'])

const internalPagination = ref({
  sortBy: null,
  descending: false,
})

const formatDate = (date) => {
  if (!date) return '-'
  return convertToJalali(date, 'jYYYY/jMM/jDD')
}

const formatDayName = (date) => {
  if (!date) return '-'
  return convertToJalali(date, 'jdddd')
}

const formatTime = (date) => {
  if (!date) return '-'
  return convertToJalali(date, 'HH:mm')
}
</script>

<style lang="scss" scoped>
.table-fade-enter-active,
.table-fade-leave-active {
  transition: opacity 0.25s ease;
}

.table-fade-enter-from,
.table-fade-leave-to {
  opacity: 0;
}

.attendance-table {
  &__day {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  &__day-date {
    font-weight: 600;
    font-size: 14px;
    color: $grey-6;
  }

  &__day-name {
    font-weight: 500;
    font-size: 12px;
    color: $primary;
    padding: 2px 8px;
    border-radius: 4px;
  }

  &__status-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 10px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 12px;
    line-height: 1.5625em;

    &--success {
      background-color: #e8f5e9;
      border: 1px solid #a5d6a7;
      color: #4caf50;
    }

    &--pending {
      background-color: #f5f5f5;
      border: 1px solid #e0e0e0;
      color: $grey-7;
    }
  }

  &__checkout-btn {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
}

.no-data {
  width: 100%;
  height: 70dvh;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.flex {
  &.column {
    flex-direction: column;
  }
}
</style>
