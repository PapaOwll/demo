<template>
  <QCard flat class="q-pa-md">
    <QCardSection class="row q-col-gutter-sm items-center justify-between q-pa-none">
      <div class="col-10 flex q-gutter-xs items-center">
        <QChip square color="white" text-color="black" class="text-h6">لیست طرح درمان</QChip>
        <QBtn fab-mini flat unelevated :loading="isFetching" @click="updateTable">
          <IconRefresh class="text-grey" />
        </QBtn>
        <div class="flex">
          <QChip
            v-for="_f in treatmentPlanSuggestFilters"
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
      <div class="col-md-2 col-12 flex justify-end">
        <QBtn
          v-if="canCreateTreatmentPlan()"
          outline
          text-color="green-6"
          color="green-1"
          unelevated
          @click="openCreateTreatmentPlan"
        >
          <IconPlus />
          ساخت طرح درمان
        </QBtn>
      </div>
      <div class="col-12">
        <FilterBuilder
          :items="tableFilters"
          :form-values="formValues"
          :has-active-filters="hasActiveFilters"
          :handle-input="handleInput"
          :apply-filters="applyFilters"
          :reset-filters="resetFilters"
          :total-count="totalTreatmentPlan"
          total-label="طرح درمان"
          :is-total-count-loading="isTotalCountLoading"
          :load-total-count="onLoadTotalCount"
          @apply="onFilterApply"
          @reset="onFilterReset"
        />
      </div>
    </QCardSection>
    <QTable
      v-model:pagination="pagination"
      :sort-method="sortMethod"
      :rows="treatmentPlanList"
      :columns="tableColumns"
      :loading="listLoading"
      row-key="id"
      class="quasar-table"
      :rows-per-page-options="[0]"
      flat
    >
      <template #loading>
        <QInnerLoading size="40px" color="primary" />
        <div class="no-data">
          <QSpinnerTail color="primary" size="lg" />
        </div>
      </template>

      <template v-if="treatmentPlanList?.length === 0" #no-data>
        <div v-if="isError" class="flex column justify-center items-center q-mx-auto q-pa-lg">
          <QIcon name="error_outline" size="80px" color="negative" class="q-mb-md" />
          <Typography variant="heading" size="h6" color="blue-grey" class="q-mb-sm">
            خطا در دریافت اطلاعات
          </Typography>
          <Typography variant="body" size="1" color="blue-grey" class="q-mb-md text-center">
            {{ getErrorMessage(error) }}
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

      <template #body-cell-userFullName="scope">
        <QTd :props="scope">
          <UserMenu :user="scope.row" @update-table="updateTable" />
        </QTd>
      </template>
      <template #body-cell-status="scope">
        <QTd :props="scope">
          <TreatmentPlanStatusInformation :treatment-plan="scope.row" />
        </QTd>
      </template>
      <template #body-cell-createdAt="scope">
        <QTd :props="scope">
          <QChip outline color="primary" square class="ucd">
            {{ convertToJalaliWithTime(scope.row?.createdAt, 'jYYYY/jMM/jDD | HH:mm') }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-description="scope">
        <QTd :props="scope" class="description-cell">
          {{ scope.row?.description }}
          <QTooltip v-if="scope.row?.description" class="text-subtitle1 bg-black text-white">
            {{ scope.row?.description }}
          </QTooltip>
        </QTd>
      </template>
      <template #body-cell-prepayment="scope">
        <QTd :props="scope">
          <Typography variant="body" size="4">
            {{ generatePriceFormat(scope.row?.prepayment) }}
          </Typography>
        </QTd>
      </template>
      <template #body-cell-installmentCount="scope">
        <QTd :props="scope">
          <Typography variant="body" size="4">
            {{ scope.row?.installmentCount }}
          </Typography>
        </QTd>
      </template>
      <template #body-cell-installmentPrice="scope">
        <QTd :props="scope">
          <Typography variant="body" size="4">
            {{
              scope.row.installment?.id ? generatePriceFormat(scope.row?.installmentPrice) : 'نقد'
            }}
          </Typography>
        </QTd>
      </template>
      <template #body-cell-totalCost="scope">
        <QTd :props="scope">
          <Typography variant="body" size="4">
            {{ generatePriceFormat(scope.row?.totalCost) }}
          </Typography>
        </QTd>
      </template>
      <template #body-cell-actions="scope">
        <QTd :props="scope">
          <QBtn flat round size="md" color="primary">
            <IconDotsVertical />
            <QMenu>
              <QList>
                <QItem
                  v-if="canEditTreatmentPlan(scope.row)"
                  v-close-popup
                  clickable
                  @click="editTreatmentPlan(scope.row)"
                >
                  <QItemSection avatar>
                    <IconPencil class="text-primary" />
                  </QItemSection>
                  <QItemSection>ویرایش</QItemSection>
                </QItem>
                <QItem
                  v-if="getPerms('treatment-plan', 'view') && !!scope.row.isProposed"
                  v-close-popup
                  clickable
                  @click="handleViewTreatmentPlan(scope.row)"
                >
                  <QItemSection avatar>
                    <IconEye class="text-primary" />
                  </QItemSection>
                  <QItemSection>مشاهده طرح درمان</QItemSection>
                </QItem>
                <QItem
                  v-if="getPerms('treatment-plan', 'view')"
                  v-close-popup
                  clickable
                  @click="viewDraftTreatmentPlan(scope.row)"
                >
                  <QItemSection avatar>
                    <IconEye class="text-primary" />
                  </QItemSection>
                  <QItemSection>پیش نویس</QItemSection>
                </QItem>

                <QItem
                  v-if="scope.row.installment?.id && scope.row.isActive && hasFinancialPerms()"
                  v-close-popup
                  clickable
                  @click="openAttachFile(scope.row)"
                >
                  <QItemSection avatar>
                    <IconFileDiff class="text-primary" />
                  </QItemSection>
                  <QItemSection>اسناد مالی</QItemSection>
                </QItem>
                <QItem
                  v-if="scope.row.installment?.id && scope.row.isActive && hasFinancialPerms()"
                  v-close-popup
                  clickable
                  @click="openValidationForm(scope.row)"
                >
                  <QItemSection avatar>
                    <IconCheck class="text-primary" />
                  </QItemSection>
                  <QItemSection>اعتبار سنجی</QItemSection>
                </QItem>
                <QItem
                  v-if="getPerms('treatment-plan', 'delete')"
                  v-close-popup
                  clickable
                  @click="deleteTreatmentPlanDialog(scope.row)"
                >
                  <QItemSection avatar>
                    <IconTrash class="text-negative" />
                  </QItemSection>
                  <QItemSection>حذف</QItemSection>
                </QItem>
              </QList>
            </QMenu>
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
            :disable="!hasNextPage"
            :loading="isFetchingNextPage"
            @click="loadNextPage"
          />
        </div>
      </template>
    </QTable>
  </QCard>

  <AttachFileModal
    :visible="attachFileVisible"
    :edit-values="attachFileData"
    @update:visible="closeAttachFile"
    @after-submit="afterSubmitAttachFile"
  />

  <TpCreditLevel
    v-if="userCreditLevelVisible"
    :visible="userCreditLevelVisible"
    :edit-value="userCreditLevelData"
    @update:visible="closeValidationForm"
    @submitted="afterSubmitValidationForm"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import { getPerms } from '@/utils/get-perms'
import UserMenu from '@/components/UserMenu'
import TreatmentPlanStatusInformation from '@/components/TreatmentPlanStatusInformation'
import {
  useTreatmentPlanInfinityQuery,
  useGetTreatmentPlanTotalCountMutation,
  useDeleteTreatmentPlanMutation,
} from '../query/index'
import { useQueryClient } from '@tanstack/vue-query'
import { handleError } from '@/utils/error-handler'
import {
  IconPlus,
  IconRefresh,
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconFileDiff,
  IconCheck,
  IconTrash,
} from '@tabler/icons-vue'
import { useRoute } from 'vue-router'
import { tableColumns, tableFilters } from '../constants'
import FilterBuilder from '@/components/FilterBuilder/FilterBuilder'
import { useHandleFilters } from '@/composables/use-handle-filters'
import { useTableSort } from '@/composables/use-table-sort'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import AttachFileModal from '../components/TpList/AttachFileModal'
import TpCreditLevel from '../components/TpList/TpCreditLevel'
import { generatePriceFormat } from '@/utils/formatter'
import { useTpPermissions } from '../composables/use-tp-permissions'
import { useTpLink } from '../composables/use-tp-link'
import { getErrorMessage } from '@/utils/get-error-message'
import Typography from '@/base/Typography'
import Button from '@/base/Button'

const queryClient = useQueryClient()
const route = useRoute()

const { viewTreatmentPlan } = useTpLink()

const { mutate: deleteTreatmentPlan } = useDeleteTreatmentPlanMutation()

const attachFileVisible = ref(false)
const userCreditLevelVisible = ref(false)
const attachFileData = ref(null)
const totalTreatmentPlan = ref(null)
const userCreditLevelData = ref(null)
const { canCreateTreatmentPlan, hasFinancialPerms, canEditTreatmentPlan } = useTpPermissions()
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

const { pagination, sortMethod } = useTableSort(['treatment-plan', 'all-treatment-plans'], setSort)

const {
  data: treatmentPlanData,
  isLoading,
  isFetching,
  fetchNextPage,
  isFetchingNextPage,
  refetch,
  error,
  isError,
  hasNextPage,
} = useTreatmentPlanInfinityQuery(apiFilters)

const treatmentPlanList = computed(() => {
  const pages = treatmentPlanData.value?.pages || []
  return pages.flatMap((pageData) => {
    return (pageData.data?.items || []).map((item) => ({
      ...item,
      creator: item?.createdBy?.name,
      first_name: item?.user?.first_name,
      name: item?.user?.name,
      userId: item?.user?.id,
      mobile: item?.user?.mobile,
      installmentCount: item.installment ? `${item?.installment?.month} ماه` : null,
      treatmentId: item?.id,
      created_at: item?.createdAt,
    }))
  })
})

const treatmentPlanSuggestFilters = computed(
  () =>
    treatmentPlanData.value?.pages?.[0]?.data?.suggestFilters?.filter(
      (item) => item.type !== 'danger'
    ) || []
)
const { mutate: totalCount, isPending: isTotalCountLoading } =
  useGetTreatmentPlanTotalCountMutation()

// Only show loading when there's no cached data
const listLoading = computed(() => {
  const hasData = treatmentPlanList.value?.length > 0
  return isFetchingNextPage.value || (isLoading.value && !hasData)
})
const onLoadTotalCount = () => {
  totalTreatmentPlan.value = null
  totalCount(apiFilters, {
    onSuccess: (data) => {
      totalTreatmentPlan.value = data?.data?.count
    },
    onError: (e) => {
      handleError(e)
    },
  })
}

const loadNextPage = () => {
  if (!hasNextPage.value) return
  fetchNextPage()
}

const onFilterApply = (filteredValues) => {
  totalTreatmentPlan.value = null
  applyFilters(filteredValues)
  queryClient.invalidateQueries({ queryKey: ['treatment-plan', 'all-treatment-plans'] })
}

const onFilterReset = () => {
  pagination.value = { sortBy: null, descending: false }
  totalTreatmentPlan.value = null
  resetFilters()
  queryClient.invalidateQueries({ queryKey: ['treatment-plan', 'all-treatment-plans'] })
}

const onSelectSuggestFilter = (suggestFilter) => {
  handleSuggestFilter(suggestFilter)
}

const updateTable = () => {
  queryClient.invalidateQueries({ queryKey: ['treatment-plan', 'all-treatment-plans'] })
  Notif.success('لیست بروزرسانی شد')
}

const openCreateTreatmentPlan = () => {
  window.open('/treatment-plan/draft/create', '_blank')
}

const handleViewTreatmentPlan = (row) => {
  const result = viewTreatmentPlan(row)

  if (!result.success) {
    const messages = {
      'no-data': 'اطلاعات طرح درمان یافت نشد',
      'missing-link': 'لینک مشاهده طرح درمان موجود نیست',
      'missing-hash-key': 'کلید عمومی طرح درمان یافت نشد',
      'popup-blocked': 'لطفاً اجازه باز شدن پنجره پاپ‌آپ را بدهید',
    }

    Notif.error(messages[result.reason] || 'خطا در باز کردن طرح درمان')
  }
}

const viewDraftTreatmentPlan = (row) => {
  window.open(`/treatment-plan/draft/view/${row.id}`, '_blank')
}

const editTreatmentPlan = (row) => {
  if (row?.id) window.open(`/treatment-plan/edit/${row.id}`, '_blank')
}

const openAttachFile = (data) => {
  attachFileVisible.value = true
  attachFileData.value = data
}

const afterSubmitAttachFile = () => {
  attachFileVisible.value = false
  updateTable()
}

const closeAttachFile = () => {
  attachFileVisible.value = false
}

const openValidationForm = (data) => {
  userCreditLevelVisible.value = true
  userCreditLevelData.value = data
}

const closeValidationForm = () => {
  userCreditLevelVisible.value = false
}

const afterSubmitValidationForm = () => {
  userCreditLevelVisible.value = false
  updateTable()
}

const deleteTreatmentPlanDialog = (row) => {
  confirmDialog(
    'حذف طرح درمان',
    'آیا از حذف این طرح درمان اطمینان دارید؟',
    () => {
      deleteTreatmentPlan(row?.id, {
        onSuccess: (response) => {
          // Invalidate all treatment plan queries across the application
          queryClient.invalidateQueries({ queryKey: ['treatment-plan'] })
          queryClient.invalidateQueries({ queryKey: ['new-treatment-plan'] })

          // Invalidate user query if treatment plan belongs to a user
          if (row?.userId) {
            queryClient.invalidateQueries({ queryKey: ['user', row.userId] })
          }

          Notif.success(response.message)
        },
      })
    },
    {
      ok: { label: 'حذف', color: 'negative', flat: true },
      persistent: true,
    }
  )
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
.description-cell {
  width: 100px !important;
  max-width: 100px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
</style>
