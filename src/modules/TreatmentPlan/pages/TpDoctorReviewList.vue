<template>
  <QCard flat class="q-pa-md">
    <QCardSection class="row q-col-gutter-sm items-center justify-between q-pa-none">
      <div class="col-10 flex q-gutter-xs items-center">
        <QChip square color="white" text-color="black" class="text-h6">بررسی پزشکی</QChip>
        <QBtn fab-mini flat unelevated :loading="isFetching" @click="updateTable">
          <IconRefresh class="text-grey" />
        </QBtn>
      </div>
      <div class="col-12">
        <FilterBuilder
          :items="reviewTableFilters"
          :form-values="formValues"
          :has-active-filters="hasActiveFilters"
          :handle-input="handleInput"
          :apply-filters="applyFilters"
          :reset-filters="resetFilters"
          :total-count="totalReviews"
          total-label="نتیجه"
          :is-total-count-loading="isFetching"
          :load-total-count="onLoadTotalCount"
          @apply="onFilterApply"
          @reset="onFilterReset"
        />
      </div>
    </QCardSection>

    <QTable
      v-model:pagination="pagination"
      :sort-method="sortMethod"
      :rows="doctorReviewList"
      :columns="reviewTableColumns"
      :loading="isLoading && !doctorReviewList?.length"
      row-key="id"
      class="quasar-table"
      hide-no-data
      :rows-per-page-options="[0]"
      flat
    >
      <template #body-cell-row="scope">
        <QTd :props="scope" class="text-secondary">
          {{ scope?.key }}
        </QTd>
      </template>
      <template #body-cell-createdAt="scope">
        <QTd :props="scope" class="text-secondary">
          {{ convertToJalaliWithTime(scope.row?.createdAt, 'jYYYY/jMM/jDD | HH:mm') }}
        </QTd>
      </template>
      <template #body-cell-status="scope">
        <QTd :props="scope" class="text-secondary">
          <QChip
            :label="scope.row.status?.faTitle"
            :class="statusColor(scope.row?.status)"
            square
            outline
          />
        </QTd>
      </template>
      <template #body-cell-review="scope">
        <QTd :props="scope" auto-width class="text-grey-9">
          <QExpansionItem class="full-width">
            <template #header>
              <div class="flex justify-between full-width items-center">
                <span class="review-title">
                  {{ scope.row?.review }}
                </span>
              </div>
            </template>
            <template #default>
              <p class="review-desc">{{ scope?.row?.review }}</p>
            </template>
          </QExpansionItem>
        </QTd>
      </template>
      <template #body-cell-actions="scope">
        <QTd :props="scope">
          <QBtn
            flat
            color="primary"
            label="مشاهده طرح درمان"
            @click="handleViewTreatmentPlan(scope.row?.treatmentPlan)"
          />
        </QTd>
      </template>
      <template #bottom>
        <QBtn
          v-if="!isLoading"
          square
          outline
          color="primary"
          class="q-mx-auto flex"
          :loading="isFetchingNextPage"
          :disable="!hasNextPage"
          :label="hasNextPage ? 'مشاهده بیشتر' : 'مورد دیگری وجود ندارد'"
          @click="loadNextPage"
        />
      </template>
    </QTable>
  </QCard>
</template>

<script setup>
import { Notif } from '@/data/services/notification-service'
import { useGetDoctorReviewsListQuery } from '@/modules/TreatmentPlan/query/index'
import { useRoute } from 'vue-router'
import { useHandleFilters } from '@/composables/use-handle-filters'
import { useTableSort } from '@/composables/use-table-sort'
import { computed, ref } from 'vue'
import { IconRefresh } from '@tabler/icons-vue'
import FilterBuilder from '@/components/FilterBuilder/FilterBuilder'
import { useQueryClient } from '@tanstack/vue-query'
import { reviewTableFilters, reviewTableColumns } from '../constants/index'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import { useTpLink } from '@/modules/TreatmentPlan/composables/use-tp-link'

const route = useRoute()
const queryClient = useQueryClient()
const { viewTreatmentPlan } = useTpLink()
const totalReviews = ref(null)

const {
  formValues,
  apiFilters,
  applyFilters,
  resetFilters,
  handleInput,
  hasActiveFilters,
  setSort,
} = useHandleFilters(route.query, {}, reviewTableFilters)

const { pagination, sortMethod } = useTableSort(['treatment-plan', 'doctor-reviews'], setSort, {
  exactRemove: true,
})

const {
  data: reviews,
  isLoading,
  isFetching,
  isFetchingNextPage,
  fetchNextPage,
  hasNextPage,
} = useGetDoctorReviewsListQuery(apiFilters)
const doctorReviewList = computed(() => {
  const pages = reviews.value?.pages || []
  return pages.flatMap((pageData) => pageData?.data?.items || [])
})

const updateTable = () => {
  queryClient.invalidateQueries({ queryKey: ['treatment-plan', 'doctor-review'] })
  Notif.success('لیست بروزرسانی شد')
}

const onFilterApply = (filteredValues) => {
  totalReviews.value = null
  applyFilters(filteredValues)
  queryClient.invalidateQueries({ queryKey: ['treatment-plan', 'doctor-review'] })
}

const onFilterReset = () => {
  pagination.value = { sortBy: null, descending: false }
  totalReviews.value = null
  resetFilters()
  queryClient.invalidateQueries({ queryKey: ['treatment-plan', 'doctor-review'] })
}

const onLoadTotalCount = async () => {
  totalReviews.value = null
  await queryClient.invalidateQueries({
    queryKey: ['treatment-plan', 'doctor-review'],
  })
  totalReviews.value = reviews.value?.pages?.[0]?.data?.sum || doctorReviewList.value?.length
}

const loadNextPage = () => {
  if (!hasNextPage.value) return
  fetchNextPage()
}

const handleViewTreatmentPlan = (tp) => {
  const result = viewTreatmentPlan(tp)

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

const statusColor = (status) => {
  return status.slug === 'approve'
    ? 'chips-success'
    : status.slug === 'reject'
      ? 'chips-error'
      : 'chips-info'
}
</script>

<style scoped lang="scss">
.review-title {
  min-width: 450px;
  max-width: 500px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.review-desc {
  width: 100%;
  text-wrap: wrap;
  text-align: justify;
  padding: 0.75rem;
}
</style>
