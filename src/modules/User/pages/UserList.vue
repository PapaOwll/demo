<template>
  <QCard flat class="q-pa-md">
    <QCardSection class="row q-col-gutter-sm items-center justify-between q-pa-none">
      <div class="col-8 flex q-gutter-xs items-center">
        <QChip square color="white" text-color="black" class="text-h6">لیست کاربران</QChip>
        <Button
          variant="flat"
          is-icon-only
          is-rounded
          color="grey"
          :left-icon="IconDownload"
          :is-loading="exportExcelPending"
          @click="exportToExcel"
        >
          <QTooltip>
            دانلود فایل اکسل
            {{ selectedUser.length > 0 ? selectedUser.length : (totalUsers ?? listCount) }}
            کاربر
          </QTooltip>
        </Button>
        <Button
          is-rounded
          is-icon-only
          :left-icon="IconRefresh"
          variant="flat"
          color="grey"
          :is-loading="isFetching"
          @click="updateTable"
        />

        <div class="flex">
          <QChip
            v-for="_f in userSuggestFilters"
            :key="_f.key"
            clickable
            :color="_f.type"
            outline
            @click="onSelectSuggestFilter(_f)"
          >
            {{ _f.faTitle }}
          </QChip>
        </div>
      </div>
      <div class="col-md-4 col-12 flex justify-end q-gutter-sm">
        <Button
          v-if="getPerms('user', 'mass-update', false, undefined)"
          variant="flat"
          color="blue"
          text="ادغام کاربران"
          :right-icon="IconUsersGroup"
          @click="openMergeModal"
        />
        <Button
          v-if="getPerms('user', 'mass-update', false, undefined) && selectedUser.length > 0"
          variant="outline"
          color="blue"
          :right-icon="IconUserEdit"
          text="ویرایش گروهی"
          @click="openModal"
        />
        <Button
          v-if="getPerms('user', 'add', false, undefined) && selectedUser.length === 0"
          variant="outline"
          color="green"
          :right-icon="IconPlus"
          text="افزودن کاربر جدید"
          @click="openUserFormDialog"
        />
      </div>
      <div class="col-12">
        <FilterBuilder
          :items="tableFilters"
          :form-values="formValues"
          :has-active-filters="hasActiveFilters"
          :handle-input="handleInput"
          :apply-filters="applyFilters"
          :reset-filters="resetFilters"
          :total-count="totalUsers"
          total-label="کاربر"
          :is-total-count-loading="isTotalCountLoading"
          :load-total-count="onLoadTotalCount"
          @apply="onFilterApply"
          @reset="onFilterReset"
        />
      </div>
    </QCardSection>

    <QTable
      v-model:selected="selectedUser"
      v-model:pagination="pagination"
      :sort-method="sortMethod"
      :rows="userListItems"
      :columns="tableColumns"
      :loading="listLoading"
      selection="multiple"
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
      <template v-if="userListItems?.length === 0" #no-data>
        <div v-if="isError" class="flex column justify-center items-center q-mx-auto q-pa-lg">
          <QIcon name="error_outline" size="80px" color="negative" class="q-mb-md" />
          <Typography variant="heading" size="h6" color="blue-grey" class="q-mb-sm">
            خطا در دریافت اطلاعات
          </Typography>
          <Typography variant="body" size="1" color="blue-grey" class="q-mb-md text-center">
            {{ getErrorMessage(error) }}
          </Typography>
          <div class="q-gutter-sm">
            <Button
              text="تلاش مجدد"
              variant="filled"
              :right-icon="IconRefresh"
              @click="retryFetch"
            />
            <Button variant="flat" color="red" text="بازگشت" @click="$router.back()" />
          </div>
        </div>
        <div v-else-if="!isLoading" class="flex column justify-center items-center q-mx-auto">
          <img src="@/assets/images/noData.svg" alt="no-data" />
          <Typography variant="heading" size="h6" color="blue-grey">اطلاعاتی یافت نشد</Typography>
        </div>
      </template>

      <template #body-cell-name="scope">
        <QTd :props="scope">
          <UserMenu :user="scope.row" @update-table="updateTable" />
        </QTd>
      </template>
      <template #body-cell-lastStatus="scope">
        <QTd :props="scope">
          <UserLastStatus :user-last-status="scope.row?.lastStatus" />
        </QTd>
      </template>
      <template #body-cell-lastContactAt="scope">
        <QTd :props="scope">
          <UserLastContact :contact-status="scope.row.lastContact" />
        </QTd>
      </template>
      <template #body-cell-createdAt="scope">
        <QTd :props="scope">
          <QChip outline color="primary" square class="ucd">
            {{ convertToJalaliWithTime(scope.row?.creationDate, 'jYYYY/jMM/jDD | HH:mm') }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-userStats="scope">
        <QTd :props="scope">
          <UserStatusInformation :user="scope.row" />
        </QTd>
      </template>
      <template #body-cell-introductionMethod="scope">
        <QTd :props="scope">
          <div class="flex items-center">
            <template v-if="scope.row?.introductionIconComponent">
              <component
                :is="scope.row.introductionIconComponent"
                v-if="typeof scope.row.introductionIconComponent !== 'string'"
                :size="'28px'"
                class="text-blue-grey-8"
              />
              <img
                v-else
                :src="scope.row.introductionIconComponent"
                :alt="scope.row?.introductionIconTooltip || 'icon'"
                width="28px"
                height="28px"
                class="introduction-icon"
              />
            </template>
            <QIcon v-else name="help_outline" size="28px" class="text-grey-6" />
            <QTooltip
              v-if="scope.row?.introductionIconTooltip"
              class="text-caption bg-black text-white"
              anchor="bottom right"
              self="top middle"
              :offset="[-10, 0]"
            >
              {{ scope.row?.introductionIconTooltip }}
            </QTooltip>
          </div>
        </QTd>
      </template>

      <template #bottom>
        <div class="full-width flex justify-center items-center">
          <QBtn
            color="primary"
            outline
            unelevated
            :label="hasNextPage ? 'مشاهده موارد بیشتر...' : 'مورد بیشتری وجود ندارد'"
            :disable="!hasNextPage"
            :loading="isFetchingNextPage"
            @click="loadNextPage"
          />
        </div>
      </template>
    </QTable>
  </QCard>
  <UserForm
    :visible="userFormVisible"
    :editing="userFormVisible"
    @after-submit="afterSubmitUserForm"
    @close="closeUserFormDialog"
  />
  <UserAdvisorEdit :visible="isShowAdvisorEditModal" :data="selectedUser" @close="closeModal" />
  <UserMergeModal
    :visible="isShowMergeModal"
    @close="closeMergeModal"
    @on-submit="onSubmitMergeUser"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import { Notif } from '@/data/services/notification-service'
import { getPerms } from '@/utils/get-perms'
import UserMenu from '@/components/UserMenu'
import UserForm from '../components/UserForm'
import {
  useExportExcelMutation,
  useGetUserInfinityQuery,
  useGetUsersTotalCountMutation,
} from '../query'
import { useQueryClient } from '@tanstack/vue-query'
import { handleError } from '@/utils/error-handler'
import {
  IconPlus,
  IconDownload,
  IconRefresh,
  IconUserEdit,
  IconUsersGroup,
} from '@tabler/icons-vue'
import { useRoute } from 'vue-router'
import { getTableColumns, createTableFilters } from '@/modules/User/constants'
import UserLastStatus from '@/modules/User/components/UserLastStatus'
import UserLastContact from '@/modules/User/components/UserLastContact'
import UserStatusInformation from '@/components/UserStatusInformation'
import FilterBuilder from '@/components/FilterBuilder/FilterBuilder'
import { useHandleFilters } from '@/composables/use-handle-filters'
import { useTableSort } from '@/composables/use-table-sort'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import { createAsyncIconComponent } from '@/utils/icon-loader'
import UserAdvisorEdit from '@/modules/User/components/UserAdvisorEdit'
import useDisclosure from '@/composables/use-disclosure'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import UserMergeModal from '@/modules/User/components/UserMergeModal'
import { getErrorMessage } from '@/utils/get-error-message'

const queryClient = useQueryClient()
const route = useRoute()

const userFormVisible = ref(false)
const loading = ref(false)
const totalUsers = ref(null)
const lastVisited = ref(null)
const selectedUser = ref([])

const [isShowAdvisorEditModal, { open: openModal, close: closeModal }] = useDisclosure()
const [isShowMergeModal, { open: openMergeModal, close: closeMergeModal }] = useDisclosure()

const tableFilters = computed(() => createTableFilters())
const {
  formValues,
  apiFilters,
  applyFilters,
  resetFilters,
  handleInput,
  hasActiveFilters,
  handleSuggestFilter,
  setSort,
} = useHandleFilters(route.query, {}, tableFilters.value)

const { pagination, sortMethod } = useTableSort(['user', 'all-users'], setSort)

const {
  data: userListData,
  isLoading,
  isFetching,
  isError,
  error,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
  refetch,
} = useGetUserInfinityQuery(apiFilters)
const loadNextPage = () => {
  if (!hasNextPage.value) return
  fetchNextPage()
}
const userListItems = computed(() => {
  return (
    userListData.value?.pages?.flatMap((pageData) => {
      lastVisited.value = pageData.data?.time
      return pageData.data?.items.map((item) => ({
        ...item,
        introductionIcon: item?.methodOfIntroduction?.icon,
        introductionIconTooltip: item?.methodOfIntroduction?.faTitle || 'نامشخص',
        // Create async component for each icon, ensuring it's not null
        introductionIconComponent: item?.methodOfIntroduction
          ? createAsyncIconComponent(item.methodOfIntroduction)
          : null,
      }))
    }) || []
  )
})

const listCount = computed(() => userListItems.value?.length)
const userSuggestFilters = computed(
  () =>
    userListData.value?.pages?.[0]?.data?.suggestFilters?.filter(
      (item) => item.type !== 'danger'
    ) || []
)

const tableColumns = computed(() => getTableColumns())

const { mutate: totalCount, isPending: isTotalCountLoading } = useGetUsersTotalCountMutation()
const { mutate: exportExcelFile, isPending: exportExcelPending } = useExportExcelMutation()

const listLoading = computed(() => {
  const hasData = userListItems.value?.length > 0
  const showInitialLoading = isLoading.value && !hasData
  return loading.value || isFetchingNextPage.value || showInitialLoading
})
const triggerDownloadFile = (response, filename) => {
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const exportToExcel = () => {
  const filename = 'user-list-export.xlsx'
  if (selectedUser.value.length > 0) {
    const userIds = selectedUser.value.map((el) => el?.id)
    const filter = { 'filter[idsFilter]': userIds.toString() }
    exportExcelFile(
      { ...filter },
      {
        onSuccess: (response) => {
          triggerDownloadFile(response, filename)
        },
        onError: (err) => {
          handleError(err)
        },
      }
    )
  } else if (apiFilters.value) {
    exportExcelFile(
      { ...apiFilters.value },
      {
        onSuccess: (response) => {
          triggerDownloadFile(response, filename)
        },
        onError: (err) => {
          handleError(err)
        },
      }
    )
  }
}

const onLoadTotalCount = () => {
  totalUsers.value = null
  isTotalCountLoading.value = true
  totalCount(apiFilters, {
    onSuccess: (data) => {
      totalUsers.value = data?.data?.count
      isTotalCountLoading.value = false
    },
    onError: (e) => {
      handleError(e?.errors?.message || e?.message)
      isTotalCountLoading.value = false
    },
  })
}

const updateTable = async () => {
  await queryClient.invalidateQueries({
    queryKey: ['user', 'all-users'],
  })
  totalUsers.value = null
  Notif.success('لیست بروزرسانی شد')
}

const onFilterApply = (filteredValues) => {
  selectedUser.value = []
  totalUsers.value = null
  applyFilters(filteredValues)
  queryClient.invalidateQueries({ queryKey: ['user', 'all-users'] })
}

const onFilterReset = () => {
  selectedUser.value = []
  pagination.value = { sortBy: null, descending: false }
  totalUsers.value = null
  resetFilters()
  queryClient.invalidateQueries({ queryKey: ['user', 'all-users'] })
}

const onSelectSuggestFilter = (suggestFilter) => {
  totalUsers.value = null
  handleSuggestFilter(suggestFilter)
}

const openUserFormDialog = () => {
  userFormVisible.value = true
}

const closeUserFormDialog = () => {
  userFormVisible.value = false
}

const afterSubmitUserForm = () => {
  userFormVisible.value = false
  totalUsers.value = null
}

const onSubmitMergeUser = () => {
  closeMergeModal()
  totalUsers.value = null
  updateTable()
}

const retryFetch = () => {
  refetch()
}
</script>
<style scoped lang="scss">
.no-data {
  width: 100%;
  height: 70dvh;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
.ucd {
  padding: 5px;
  min-width: 120px;
  margin: 0 auto;
}
.introduction-icon {
  display: inline-block;
  object-fit: contain;
}
</style>
