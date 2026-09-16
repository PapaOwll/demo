<template>
  <QCard flat class="q-pa-md">
    <QCardSection class="row q-col-gutter-sm items-center justify-between q-pa-none">
      <div class="col-10 flex q-gutter-xs items-center">
        <Typography variant="heading" size="h5">لیست وظایف</Typography>
        <Button variant="flat" is-rounded :is-loading="isFetching" @click="updateTable">
          <IconRefresh class="text-grey" />
        </Button>
        <div class="flex q-gutter-xs">
          <Chip
            v-for="_f in taskSuggestFilters"
            :key="_f.key"
            variant="outline"
            :color="getFilterChipColor(_f.type)"
            :text="_f.faTitle"
            :removable="false"
            @click="onSelectSuggestFilter(_f)"
          />
        </div>
      </div>
      <div class="col-md-2 col-12 flex justify-end">
        <Button
          v-if="getPerms('task', 'add')"
          variant="outline"
          :right-icon="IconPlus"
          color="green"
          @click="openTaskFormDialog"
        >
          افزودن وظیفه
        </Button>
      </div>

      <div class="col-12">
        <FilterBuilder
          :items="tableFilters"
          :form-values="formValues"
          :has-active-filters="hasActiveFilters"
          :handle-input="handleInput"
          :apply-filters="applyFilters"
          :reset-filters="resetFilters"
          :total-count="totalTasks"
          total-label="وظیفه"
          :is-total-count-loading="loadingList"
          :load-total-count="onLoadTotalCount"
          @apply="onFilterApply"
          @reset="onFilterReset"
        />
      </div>
    </QCardSection>

    <ResponsiveTable
      v-model:pagination="pagination"
      :sort-method="sortMethod"
      :rows="tasksData"
      :columns="tableColumns"
      :loading="loadingList"
      row-key="id"
      class="quasar-table"
      :rows-per-page-options="[0]"
      :no-data-label="null"
      is-expandable
      :primary-columns="['statusTitle', 'actions']"
      flat
    >
      <template #loading>
        <QInnerLoading size="40px" color="primary" />
        <div class="no-data">
          <QSpinnerTail color="primary" size="lg" />
        </div>
      </template>

      <template v-if="tasksData?.length === 0" #no-data>
        <div v-if="isError" class="flex column justify-center items-center q-mx-auto q-pa-lg">
          <QIcon name="error_outline" size="80px" color="negative" class="q-mb-md" />
          <Typography variant="heading" size="h6" color="blue-grey" class="q-mb-sm">
            خطا در دریافت اطلاعات
          </Typography>
          <Typography variant="body" size="1" color="blue-grey" class="q-mb-md text-center">
            {{ getErrorMessage(queryError) }}
          </Typography>
          <div class="q-gutter-sm">
            <Button text="تلاش مجدد" variant="filled" :right-icon="IconRefresh" @click="refetch" />
            <Button variant="flat" color="red" text="بازگشت" @click="$router.back()" />
          </div>
        </div>
        <div v-else-if="!isLoading" class="flex column justify-center items-center q-mx-auto">
          <img src="@/assets/images/noData.svg" alt="no-data" />
          <Typography variant="heading" size="h6" color="blue-grey">اطلاعاتی یافت نشد</Typography>
        </div>
      </template>

      <template #cell-userFullName="{ row }">
        <UserMenu :user="row.user" @update-table="updateTable" />
      </template>

      <template #cell-statusTitle="{ row }">
        <Badge :label="row?.statusTitle" :color="getStatusColor(row?.status)" variant="light" />
      </template>

      <template #cell-dueDate="{ row }">
        <Badge :label="convertToJalaliWithTime(row?.dueDate)" variant="outline" color="blue-grey" />
      </template>

      <template #cell-doneAt="{ row }">
        <Badge
          v-if="row?.doneAt"
          :label="convertToJalaliWithTime(row?.doneAt)"
          variant="outline"
          color="green"
        />
        <Typography v-else variant="body" size="4" color="grey">انجام نشده</Typography>
      </template>

      <template #cell-type="{ row }">
        <Typography variant="body" size="4">{{ row.type?.title }}</Typography>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex q-gutter-sm justify-end">
          <Button
            v-if="hasToFollow(row.type?.slug)"
            is-icon-only
            is-rounded
            type="button"
            size="sm"
            variant="outline"
            color="primary"
            :left-icon="IconClipboardCheck"
            aria-label="نظرسنجی"
            @click="openFollowUpSurvey(row)"
          >
            <QTooltip>نظرسنجی</QTooltip>
          </Button>
          <Button
            v-if="getPerms('task', 'update')"
            is-icon-only
            is-rounded
            type="button"
            size="sm"
            variant="outline"
            color="grey"
            :left-icon="IconEdit"
            aria-label="ویرایش"
            @click="openTaskFormDialog(row)"
          >
            <QTooltip>ویرایش</QTooltip>
          </Button>
          <Button
            v-if="getPerms('task', 'delete')"
            is-icon-only
            is-rounded
            type="button"
            size="sm"
            variant="outline"
            color="red"
            :left-icon="IconTrash"
            aria-label="حذف"
            @click="deleteTaskDialog(row)"
          >
            <QTooltip>حذف</QTooltip>
          </Button>
        </div>
      </template>

      <template #bottom>
        <div class="full-width flex justify-center items-center">
          <Button
            variant="outline"
            color="primary"
            type="button"
            :text="hasNextPage ? 'مشاهده موارد بیشتر...' : 'مورد بیشتری وجود ندارد'"
            :is-disabled="!hasNextPage"
            :is-loading="isFetchingNextPage"
            @click="loadNextPage"
          />
        </div>
      </template>
    </ResponsiveTable>
  </QCard>

  <TaskForm
    :visible="taskFormVisible"
    :edit-value="selectedUserData"
    @close="closeTaskFormDialog"
    @submitted="afterSubmit"
  />

  <FollowUpSurveyModal
    :visible="followUpSurveyVisible"
    :task="selectedFollowUpTask"
    @close="closeFollowUpSurvey"
    @submitted="afterSubmit"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import { getPerms } from '@/utils/get-perms'
import UserMenu from '@/components/UserMenu'
import TaskForm from '../components/TaskForm'
import FollowUpSurveyModal from '../components/FollowUpSurveyModal'
import { useApiDeleteTask, useGetTaskTotalCountMutation, useTaskInfinityQuery } from '../query'
import { useQueryClient } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'
import { handleError } from '@/utils/error-handler'
import { tableColumns, tableFilters } from '../constants/index'
import FilterBuilder from '@/components/FilterBuilder/FilterBuilder'
import { useHandleFilters } from '@/composables/use-handle-filters'
import { useTableSort } from '@/composables/use-table-sort'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import { IconRefresh, IconPlus, IconEdit, IconTrash, IconClipboardCheck } from '@tabler/icons-vue'
import { getErrorMessage } from '@/utils/get-error-message'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import Badge from '@/base/Badge'
import Chip from '@/base/Chip'
import ResponsiveTable from '@/components/TableView/ResponsiveTable'
import { surveyFollowUpEnums } from '../constants/enums'

const queryClient = useQueryClient()
const route = useRoute()

const taskFormVisible = ref(false)
const selectedUserData = ref(null)
const totalTasks = ref(null)

const followUpSurveyVisible = ref(false)
const selectedFollowUpTask = ref(null)

const openFollowUpSurvey = (row) => {
  selectedFollowUpTask.value = row
  followUpSurveyVisible.value = true
}

const closeFollowUpSurvey = () => {
  followUpSurveyVisible.value = false
  selectedFollowUpTask.value = null
}

const {
  formValues,
  apiFilters,
  applyFilters,
  resetFilters,
  handleInput,
  hasActiveFilters,
  handleSuggestFilter,
  setSort,
} = useHandleFilters(route.query, {}, tableFilters)

const { pagination, sortMethod } = useTableSort(['task', 'all-tasks'], setSort)

const {
  data: taskData,
  isLoading,
  isFetching,
  fetchNextPage,
  isFetchingNextPage,
  refetch,
  error: queryError,
  isError,
  hasNextPage,
} = useTaskInfinityQuery(apiFilters)
const tasksData = computed(() => {
  return (
    taskData.value?.pages?.flatMap((pageData) => {
      return pageData.data.items.map((item) => ({
        ...item,
      }))
    }) || []
  )
})

const taskSuggestFilters = computed(
  () =>
    taskData.value?.pages?.[0]?.data?.suggestFilters?.filter((item) => item.type !== 'danger') || []
)
const { mutate: totalCount, isPending: isTotalCountLoading } = useGetTaskTotalCountMutation()

const loadingList = computed(() => {
  const hasData = tasksData.value?.length > 0
  return isFetchingNextPage.value || (isLoading.value && !hasData) || isTotalCountLoading.value
})

const hasToFollow = (slug) =>
  slug === surveyFollowUpEnums.FIRST_VISIT || slug === surveyFollowUpEnums.TREATMENT_FOLLOW_UP

const onLoadTotalCount = () => {
  totalTasks.value = null
  isTotalCountLoading.value = true
  totalCount(apiFilters, {
    onSuccess: (data) => {
      totalTasks.value = data?.data?.count
      isTotalCountLoading.value = false
    },
    onError: (e) => {
      handleError(e)
      isTotalCountLoading.value = false
    },
  })
}

const loadNextPage = () => {
  if (!hasNextPage.value) return
  fetchNextPage()
}

const updateTable = () => {
  totalTasks.value = null
  queryClient.invalidateQueries({ queryKey: ['task', 'all-tasks'] })
  Notif.success('لیست بروزرسانی شد')
}

const onFilterApply = (filteredValues) => {
  totalTasks.value = null
  applyFilters(filteredValues)
  queryClient.invalidateQueries({ queryKey: ['task', 'all-tasks'] })
}

const onFilterReset = () => {
  pagination.value = { sortBy: null, descending: false }
  totalTasks.value = null
  resetFilters()
  queryClient.invalidateQueries({ queryKey: ['task', 'all-tasks'] })
}

const onSelectSuggestFilter = (suggestFilter) => {
  handleSuggestFilter(suggestFilter)
}

const openTaskFormDialog = (data = {}) => {
  selectedUserData.value = data
  taskFormVisible.value = true
}

const closeTaskFormDialog = () => {
  taskFormVisible.value = false
  selectedUserData.value = null
}

const { mutate: deleteTask } = useApiDeleteTask()

const afterSubmit = () => {
  taskFormVisible.value = false
  totalTasks.value = null
}

const deleteTaskDialog = (row) => {
  confirmDialog(
    'حذف وظیفه',
    'این مورد حذف شود؟',
    () => {
      deleteTask(row?.id, {
        onSuccess: (response) => {
          updateTable()
          Notif.success(response.message)
        },
        onError: (error) => {
          handleError(error)
        },
      })
    },
    {
      ok: {
        label: 'حذف',
        color: 'negative',
        flat: true,
      },
      persistent: true,
    }
  )
}

const getStatusColor = (status) => {
  return status === 1 ? 'green' : 'red'
}

const CHIP_PALETTE = new Set(['light-blue', 'amber', 'red', 'green', 'blue-grey', 'dark'])
const getFilterChipColor = (type) => {
  return CHIP_PALETTE.has(type) ? type : 'blue-grey'
}
</script>

<style lang="scss" scoped>
.no-data {
  width: 100%;
  height: 70dvh;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
