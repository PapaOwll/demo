<template>
  <QCard flat class="survey-results-list">
    <QCardSection class="survey-results-list__header q-pa-none">
      <div class="survey-results-list__header-left">
        <QChip square color="white" text-color="black" class="survey-results-list__title">
          لیست نتایج نظرسنجی
        </QChip>
        <QBtn fab-mini flat unelevated :loading="isFetching" @click="updateTable">
          <IconRefresh class="text-grey" />
        </QBtn>
        <div class="survey-results-list__suggest-filters">
          <QChip
            v-for="_f in resultsSuggestFilters"
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
      <div class="survey-results-list__filters">
        <FilterBuilder
          :items="tableFilters"
          :form-values="formValues"
          :has-active-filters="hasActiveFilters"
          :handle-input="handleInput"
          :apply-filters="applyFilters"
          :reset-filters="resetFilters"
          :total-count="totalSurveyResults"
          total-label="نتیجه نظرسنجی"
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
      :rows="resultsDataItems"
      :columns="tableColumns"
      :loading="listLoading"
      row-key="id"
      class="quasar-table survey-results-list__table"
      :rows-per-page-options="[0]"
      :no-data-label="null"
      flat
    >
      <template #loading>
        <QInnerLoading size="40px" color="primary" />
        <div class="survey-results-list__loading">
          <QSpinnerTail color="primary" size="lg" />
        </div>
      </template>

      <template v-if="resultsDataItems?.length === 0" #no-data>
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

      <template #body-cell-id="scope">
        <QTd :props="scope">
          <QChip outline color="primary" square class="survey-results-list__id-chip">
            {{ scope.row?.id }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-user="scope">
        <QTd :props="scope">
          <QChip color="primary" text-color="white" square class="survey-results-list__user-chip">
            {{ scope.row?.user || 'نامشخص' }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-advisor="scope">
        <QTd :props="scope">
          <QChip
            outline
            color="secondary"
            text-color="white"
            square
            class="survey-results-list__advisor-chip"
          >
            {{ scope.row?.advisor || 'نامشخص' }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-question="scope">
        <QTd :props="scope" class="survey-results-list__question-cell">
          {{ scope.row?.question }}
          <QTooltip v-if="scope.row?.question" class="survey-results-list__question-tooltip">
            {{ scope.row?.question }}
          </QTooltip>
        </QTd>
      </template>
      <template #body-cell-response="scope">
        <QTd :props="scope" class="survey-results-list__response-cell">
          {{ scope.row?.response }}
          <QTooltip v-if="scope.row?.response" class="survey-results-list__response-tooltip">
            {{ scope.row?.response }}
          </QTooltip>
        </QTd>
      </template>

      <template #bottom>
        <div class="survey-results-list__load-more">
          <QBtn
            color="primary"
            outline
            unelevated
            :label="hasNextPage ? 'مشاهده موارد بیشتر...' : 'مورد بیشتری وجود ندارد'"
            :disable="!hasNextPage"
            :loading="isFetchingNextPage"
            class="survey-results-list__load-more-btn"
            @click="loadNextPage"
          />
        </div>
      </template>
    </QTable>
  </QCard>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Notif } from '@/data/services/notification-service'
import { useGetTotalSurveyResultsCountMutation, useSurveyResultsInfinityQuery } from '../query'
import { useQueryClient } from '@tanstack/vue-query'
import { handleError } from '@/utils/error-handler'
import { IconRefresh } from '@tabler/icons-vue'
import { useRoute } from 'vue-router'
import FilterBuilder from '@/components/FilterBuilder/FilterBuilder'
import { useHandleFilters } from '@/composables/use-handle-filters'
import { useTableSort } from '@/composables/use-table-sort'
import { tableColumns, createTableFilters } from '@/modules/Survey/ResultsList/constant/index'
import { getErrorMessage } from '@/utils/get-error-message'
import Typography from '@/base/Typography'
import Button from '@/base/Button'

const queryClient = useQueryClient()
const route = useRoute()

const totalSurveyResults = ref(null)

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

const { pagination, sortMethod } = useTableSort(['survey', 'all-results'], setSort)

const {
  data: resultsListData,
  isLoading,
  isFetching,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
  isError,
  refetch,
  error,
} = useSurveyResultsInfinityQuery(apiFilters)

const resultsDataItems = computed(() => {
  return (
    resultsListData.value?.pages?.flatMap((pageData) => {
      return pageData.data.items.map((item) => ({
        ...item,
        user: item?.userId?.firstName
          ? `${item?.userId?.firstName} ${item?.userId?.name}`
          : item?.userId?.name,
        advisor: item?.advisorId?.firstName
          ? `${item?.advisorId?.firstName} ${item?.advisorId?.name}`
          : item?.advisorId?.name,
        question: item?.question,
        response: item?.response,
      }))
    }) || []
  )
})

const resultsSuggestFilters = computed(
  () => resultsListData.value?.pages?.[0]?.data?.suggestFilters || []
)

const { mutate: totalCount, isPending: isTotalCountLoading } =
  useGetTotalSurveyResultsCountMutation()

// Only show loading when there's no cached data
const listLoading = computed(() => {
  const hasData = resultsDataItems.value?.length > 0
  return isFetchingNextPage.value || (isLoading.value && !hasData)
})

const onLoadTotalCount = () => {
  totalSurveyResults.value = null
  totalCount(apiFilters, {
    onSuccess: (data) => {
      totalSurveyResults.value = data?.data?.count
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

const updateTable = () => {
  queryClient.invalidateQueries({ queryKey: ['survey', 'all-results'] })
  Notif.success('لیست بروزرسانی شد')
}

const onFilterApply = (filteredValues) => {
  totalSurveyResults.value = null
  applyFilters(filteredValues)
  queryClient.invalidateQueries({ queryKey: ['survey', 'all-results'] })
}

const onFilterReset = () => {
  pagination.value = { sortBy: null, descending: false }
  totalSurveyResults.value = null
  resetFilters()
  queryClient.invalidateQueries({ queryKey: ['survey', 'all-results'] })
}

const onSelectSuggestFilter = (suggestFilter) => {
  handleSuggestFilter(suggestFilter)
}
</script>

<style scoped lang="scss">
.survey-results-list {
  padding: 1rem;

  &__header {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  &__header-left {
    display: flex;
    flex: 1;
    gap: 0.25rem;
    align-items: center;
    min-width: 0;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
  }

  &__suggest-filters {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  &__filters {
    width: 100%;
  }

  &__total-count {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__count-chip {
    font-weight: 500;
  }

  &__table {
    border-radius: 0.5rem;
  }

  &__loading {
    width: 100%;
    height: 70dvh;
    margin: 0 auto;
    padding: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__no-data {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 0 auto;
    padding: 2rem;
  }

  &__no-data-image {
    max-width: 200px;
    margin-bottom: 1rem;
  }

  &__no-data-text {
    font-size: 1.25rem;
    color: #9e9e9e;
    font-weight: 500;
  }

  &__id-chip {
    font-weight: 600;
    min-width: 3rem;
    margin: 0 auto;
    text-align: center !important;
  }

  &__user-chip,
  &__advisor-chip {
    font-weight: 500;
    min-width: 6rem;
  }

  &__question-cell,
  &__response-cell {
    max-width: 15rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__question-tooltip,
  &__response-tooltip {
    font-size: 0.875rem;
    background-color: #000;
    color: #fff;
    max-width: 20rem;
    white-space: normal;
  }

  &__load-more {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem 0;
  }

  &__load-more-btn {
    min-width: 12rem;
  }
}

// Responsive design
@media (max-width: 768px) {
  .survey-results-list {
    padding: 0.5rem;

    &__header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    &__header-left {
      justify-content: center;
      flex-wrap: wrap;
    }

    &__title {
      font-size: 1rem;
    }

    &__question-cell,
    &__response-cell {
      max-width: 8rem;
    }
  }
}

@media (max-width: 480px) {
  .survey-results-list {
    &__header-left {
      gap: 0.125rem;
    }

    &__title {
      font-size: 0.875rem;
    }

    &__question-cell,
    &__response-cell {
      max-width: 6rem;
    }
  }
}
</style>
