<template>
  <QCard flat class="survey-list">
    <QCardSection class="survey-list__header q-pa-none">
      <div class="survey-list__header-left">
        <QChip square color="white" text-color="black" class="survey-list__title">
          لیست نظر سنجی ها
        </QChip>
        <QBtn fab-mini flat unelevated :loading="isFetching" @click="updateTable">
          <IconRefresh class="text-grey" />
        </QBtn>
        <div class="survey-list__suggest-filters">
          <QChip
            v-for="_f in surveySuggestFilters"
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
      <div class="survey-list__filters">
        <FilterBuilder
          :items="tableFilters"
          :form-values="formValues"
          :has-active-filters="hasActiveFilters"
          :handle-input="handleInput"
          :apply-filters="applyFilters"
          :reset-filters="resetFilters"
          :total-count="totalSurveys"
          total-label="نظر سنجی"
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
      :rows="surveyListData"
      :columns="tableColumns"
      :loading="listLoading"
      row-key="id"
      class="quasar-table"
      :rows-per-page-options="[0]"
      :no-data-label="null"
      flat
    >
      <template #loading>
        <QInnerLoading size="40px" color="primary" />
        <div class="survey-list__loading">
          <QSpinnerTail color="primary" size="lg" />
        </div>
      </template>
      <template v-if="surveyListData?.length === 0" #no-data>
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

      <template #body-cell-surveyId="scope">
        <QTd :props="scope">
          <QChip outline color="primary" square class="survey-list__id-chip">
            {{ scope.row?.surveyId }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-title="scope">
        <QTd :props="scope" class="survey-list__title-cell">
          {{ scope.row?.title }}
          <QTooltip v-if="scope.row?.title" class="survey-list__title-tooltip">
            {{ scope.row?.title }}
          </QTooltip>
        </QTd>
      </template>
      <template #body-cell-status="scope">
        <QTd :props="scope">
          <QChip
            :class="scope.row?.status?.color === 'success' ? 'chips-success' : 'chips-error'"
            square
            class="survey-list__status-chip"
          >
            {{ scope.row?.status?.title }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-createdDate="scope">
        <QTd :props="scope">
          <QChip outline color="primary" square class="survey-list__date-chip">
            {{ convertToJalaliWithTime(scope.row?.createdDate, 'jYYYY/jMM/jDD | HH:mm') }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-responses="scope">
        <QTd :props="scope">
          <QChip color="blue-5" text-color="white" square>
            {{ scope.row?.responses || 0 }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-viewCount="scope">
        <QTd :props="scope">
          <QChip color="warning" text-color="white" square>
            {{ scope.row?.viewCount || 0 }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-actions="scope">
        <QTd :props="scope">
          <QBtn flat round color="primary">
            <IconDotsVertical />
            <QMenu>
              <QList>
                <QItem
                  v-if="getPerms('survey', 'view', true, 'survey-lists')"
                  v-close-popup
                  clickable
                  @click="openSurveyReport(scope.row)"
                >
                  <QItemSection avatar>
                    <IconChartBar class="text-warning" />
                  </QItemSection>
                  <QItemSection>آمار نظر سنجی</QItemSection>
                </QItem>
                <QItem
                  v-if="getPerms('survey', 'view', true, 'survey-lists')"
                  v-close-popup
                  clickable
                  @click="openSurveyQuestions(scope.row)"
                >
                  <QItemSection avatar>
                    <IconFileText class="text-primary" />
                  </QItemSection>
                  <QItemSection>سوالات</QItemSection>
                </QItem>
                <QItem
                  v-if="getPerms('survey', 'view', true, 'survey-lists')"
                  v-close-popup
                  clickable
                  @click="openSurveyPreview(scope.row)"
                >
                  <QItemSection avatar>
                    <IconEye class="text-positive" />
                  </QItemSection>
                  <QItemSection>پیش نمایش</QItemSection>
                </QItem>
              </QList>
            </QMenu>
          </QBtn>
        </QTd>
      </template>

      <template #bottom>
        <div class="survey-list__load-more">
          <QBtn
            color="primary"
            outline
            unelevated
            :label="hasNextPage ? 'مشاهده موارد بیشتر...' : 'مورد بیشتری وجود ندارد'"
            :disable="!hasNextPage"
            :loading="isFetchingNextPage"
            class="survey-list__load-more-btn"
            @click="loadNextPage"
          />
        </div>
      </template>
    </QTable>
  </QCard>
  <SurveyQuestions
    :visible="showSurveyQuestions"
    :edit-value="surveyQuestionsData"
    @close="closeSurveyQuestion"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import { Notif } from '@/data/services/notification-service'
import { getPerms } from '@/utils/get-perms'
import SurveyQuestions from '@/modules/Survey/SurveyList/components/SurveyQuestions'
import { useGetTotalSurveyCountMutation, useSurveyListInfinityQuery } from '../query'
import { useQueryClient } from '@tanstack/vue-query'
import { handleError } from '@/utils/error-handler'
import {
  IconRefresh,
  IconDotsVertical,
  IconChartBar,
  IconFileText,
  IconEye,
} from '@tabler/icons-vue'
import { useRoute } from 'vue-router'
import FilterBuilder from '@/components/FilterBuilder/FilterBuilder'
import { useHandleFilters } from '@/composables/use-handle-filters'
import { useTableSort } from '@/composables/use-table-sort'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import { tableFilters, tableColumns } from '@/modules/Survey/SurveyList/constant/index'
import { getErrorMessage } from '@/utils/get-error-message'
import Typography from '@/base/Typography'
import Button from '@/base/Button'

const queryClient = useQueryClient()
const route = useRoute()

const surveyQuestionsData = ref(null)
const totalSurveys = ref(null)
const showSurveyQuestions = ref(false)

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

const { pagination, sortMethod } = useTableSort(['survey', 'all-surveys'], setSort)

const {
  data: surveyData,
  isLoading,
  isFetching,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
  isError,
  refetch,
  error,
} = useSurveyListInfinityQuery(apiFilters)

const surveyListData = computed(() => {
  return (
    surveyData.value?.pages?.flatMap((pageData) => {
      return pageData.data.items.map((item) => ({
        ...item,
        status: item.isActive
          ? { title: 'فعال', color: 'success' }
          : { title: 'غیرفعال', color: 'danger' },
        createdDate: item.createdDate,
      }))
    }) || []
  )
})

const surveySuggestFilters = computed(
  () => surveyData.value?.pages?.[0]?.data?.suggestFilters || []
)

const { mutate: totalCount, isPending: isTotalCountLoading } = useGetTotalSurveyCountMutation()

// Only show loading when there's no cached data
const listLoading = computed(() => {
  const hasData = surveyListData.value?.length > 0
  return isFetchingNextPage.value || (isLoading.value && !hasData)
})

const onLoadTotalCount = () => {
  totalSurveys.value = null
  totalCount(apiFilters, {
    onSuccess: (data) => {
      totalSurveys.value = data?.data?.count
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
  queryClient.invalidateQueries({ queryKey: ['survey', 'all-surveys'] })
  Notif.success('لیست بروزرسانی شد')
}

const closeSurveyQuestion = () => {
  showSurveyQuestions.value = false
  surveyQuestionsData.value = null
}

const onFilterApply = (filteredValues) => {
  totalSurveys.value = null
  applyFilters(filteredValues)
  queryClient.invalidateQueries({ queryKey: ['survey', 'all-surveys'] })
}

const onFilterReset = () => {
  pagination.value = { sortBy: null, descending: false }
  totalSurveys.value = null
  resetFilters()
  queryClient.invalidateQueries({ queryKey: ['survey', 'all-surveys'] })
}

const onSelectSuggestFilter = (suggestFilter) => {
  handleSuggestFilter(suggestFilter)
}

const openSurveyReport = (row) => {
  window.open(row?.report, '_blank')
}

const openSurveyQuestions = (row) => {
  surveyQuestionsData.value = row.questions
  showSurveyQuestions.value = true
}

const openSurveyPreview = (row) => {
  window.open(row?.preview, '_blank')
}
</script>

<style scoped lang="scss">
.survey-list {
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

  &__header-right {
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
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

  &__create-btn {
    white-space: nowrap;
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
    min-width: 4rem;
  }

  &__title-cell {
    max-width: 12.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__title-tooltip {
    font-size: 0.875rem;
    background-color: #000;
    color: #fff;
  }

  &__status-chip {
    font-weight: 500;
    min-width: 4rem;
  }

  &__date-chip {
    padding: 0.3125rem;
    min-width: 7.5rem;
    margin: 0 auto;
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

@media (max-width: 768px) {
  .survey-list {
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

    &__header-right {
      justify-content: center;
    }

    &__title {
      font-size: 1rem;
    }

    &__create-btn {
      width: 100%;
      max-width: 20rem;
    }

    &__title-cell {
      max-width: 8rem;
    }
  }
}

@media (max-width: 480px) {
  .survey-list {
    &__header-left {
      gap: 0.125rem;
    }

    &__title {
      font-size: 0.875rem;
    }

    &__title-cell {
      max-width: 6rem;
    }
  }
}
</style>
