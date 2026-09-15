<template>
  <QCard flat class="import-list">
    <QCardSection class="import-list__header q-pa-none">
      <div class="import-list__header-left">
        <QChip square color="white" text-color="black" class="import-list__title">
          لیست های ورودی
        </QChip>
        <QBtn fab-mini flat unelevated :loading="isFetching" @click="updateTable">
          <IconRefresh class="text-grey" />
        </QBtn>
        <div class="import-list__suggest-filters">
          <QChip
            v-for="_f in importsSuggestFilters"
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
      <div class="import-list__filters">
        <FilterBuilder
          :items="tableFilters"
          :form-values="formValues"
          :has-active-filters="hasActiveFilters"
          :handle-input="handleInput"
          :apply-filters="applyFilters"
          :reset-filters="resetFilters"
          :total-count="totalImports"
          total-label="لیست ورودی"
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
      :rows="importsList"
      :columns="tableColumns"
      :loading="listLoading"
      row-key="id"
      class="quasar-table import-list__table"
      :rows-per-page-options="[0]"
      :no-data-label="null"
      flat
    >
      <template #loading>
        <QInnerLoading size="40px" color="primary" />
        <div class="import-list__loading">
          <QSpinnerTail color="primary" size="lg" />
        </div>
      </template>
      <template v-if="importsList?.length === 0" #no-data>
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
          <QChip outline color="primary" square class="import-list__id-chip">
            {{ scope.row?.id }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-campaign="scope">
        <QTd :props="scope">
          <QChip color="primary" text-color="white" square class="import-list__campaign-chip">
            {{ scope.row?.campaign || 'نامشخص' }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-createdAt="scope">
        <QTd :props="scope">
          <QChip outline color="primary" square class="import-list__date-chip">
            {{ convertToJalaliWithTime(scope.row?.createdAt, 'jYYYY/jMM/jDD | HH:mm') }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-allNumbers="scope">
        <QTd :props="scope">
          <QChip outline color="info" text-color="white" square>
            {{ scope.row?.allNumbers || 0 }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-incorrectNumbers="scope">
        <QTd :props="scope">
          <QChip color="negative" text-color="white" square>
            {{ scope.row?.incorrectNumbers || 0 }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-importedNumbers="scope">
        <QTd :props="scope">
          <QChip color="positive" text-color="white" square>
            {{ scope.row?.importedNumbers || 0 }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-user="scope">
        <QTd :props="scope">
          <QChip v-if="scope.row?.user" color="secondary" text-color="white" square>
            {{ scope.row?.user || 'نامشخص' }}
          </QChip>
        </QTd>
      </template>

      <template #bottom>
        <div class="import-list__load-more">
          <QBtn
            color="primary"
            outline
            unelevated
            :label="hasNextPage ? 'مشاهده موارد بیشتر...' : 'مورد بیشتری وجود ندارد'"
            :disable="!hasNextPage"
            :loading="isFetchingNextPage"
            class="import-list__load-more-btn"
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
import { useQueryClient } from '@tanstack/vue-query'
import { useGetTotalImportCountMutation, useImportsInfinityQuery } from '../query'
import { handleError } from '@/utils/error-handler'
import { IconRefresh } from '@tabler/icons-vue'
import { useRoute } from 'vue-router'
import FilterBuilder from '@/components/FilterBuilder/FilterBuilder'
import { useHandleFilters } from '@/composables/use-handle-filters'
import { useTableSort } from '@/composables/use-table-sort'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import { tableFilters, tableColumns } from '../constant/import-list'
import { getErrorMessage } from '@/utils/get-error-message'
import Typography from '@/base/Typography'
import Button from '@/base/Button'

const queryClient = useQueryClient()
const route = useRoute()

const totalImports = ref(null)

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

const { pagination, sortMethod } = useTableSort(['import', 'all-imports'], setSort)

const {
  data: importsData,
  isLoading,
  isFetching,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
  isError,
  refetch,
  error,
} = useImportsInfinityQuery(apiFilters)

const importsList = computed(() => {
  return (
    importsData.value?.pages?.flatMap((pageData) => {
      return pageData.data.items.map((item) => ({
        ...item,
        createdAt: item.createdAt,
        campaign: item.campaign?.title || item.campaign,
        user: item.user?.name || item.user,
      }))
    }) || []
  )
})

const importsSuggestFilters = computed(
  () => importsData.value?.pages?.[0]?.data?.suggestFilters || []
)

const { mutate: totalCount, isPending: isTotalCountLoading } = useGetTotalImportCountMutation()

const onLoadTotalCount = () => {
  totalImports.value = null
  totalCount(apiFilters, {
    onSuccess: (data) => {
      totalImports.value = data?.data?.count
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

// Only show loading when there's no cached data
const listLoading = computed(() => {
  const hasData = importsList.value?.length > 0
  return isFetchingNextPage.value || (isLoading.value && !hasData)
})

const updateTable = () => {
  queryClient.invalidateQueries({ queryKey: ['import', 'all-imports'] })
  Notif.success('لیست بروزرسانی شد')
}

const onFilterApply = (filteredValues) => {
  totalImports.value = null
  applyFilters(filteredValues)
  queryClient.invalidateQueries({ queryKey: ['import', 'all-imports'] })
}

const onFilterReset = () => {
  pagination.value = { sortBy: null, descending: false }
  totalImports.value = null
  resetFilters()
  queryClient.invalidateQueries({ queryKey: ['import', 'all-imports'] })
}

const onSelectSuggestFilter = (suggestFilter) => {
  handleSuggestFilter(suggestFilter)
}
</script>

<style scoped lang="scss">
.import-list {
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
  }

  &__campaign-chip {
    font-weight: 500;
    min-width: 6rem;
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

// Responsive design
@media (max-width: 768px) {
  .import-list {
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
  }
}

@media (max-width: 480px) {
  .import-list {
    &__header-left {
      gap: 0.125rem;
    }

    &__title {
      font-size: 0.875rem;
    }
  }
}
</style>
