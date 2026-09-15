<template>
  <QCard flat class="setting-calendar">
    <QCardSection class="setting-calendar__header q-pa-none">
      <div class="setting-calendar__header-left">
        <QChip square color="white" text-color="black" class="setting-calendar__title">
          تقویم کاری
        </QChip>
        <QBtn fab-mini flat unelevated :loading="listLoading" @click="updateTable">
          <IconRefresh class="text-grey" />
        </QBtn>
        <div class="setting-calendar__suggest-filters">
          <QChip
            v-for="_f in calendarSuggestFilters"
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
      <div class="setting-calendar__filters">
        <FilterBuilder
          :items="tableFilters"
          :form-values="formValues"
          :has-active-filters="hasActiveFilters"
          :handle-input="handleInput"
          :apply-filters="applyFilters"
          :reset-filters="resetFilters"
          :total-count="totalItems"
          total-label="روز کاری"
          @apply="onFilterApply"
          @reset="onFilterReset"
        />
      </div>
    </QCardSection>
    <QTable
      v-model:pagination="pagination"
      :sort-method="sortMethod"
      :rows="scheduleData"
      :columns="tableColumns"
      :loading="listLoading"
      row-key="date"
      class="quasar-table setting-calendar__table"
      :rows-per-page-options="[0]"
      :no-data-label="null"
      flat
    >
      <template #loading>
        <QInnerLoading size="40px" color="primary" />
        <div class="setting-calendar__loading">
          <QSpinnerTail color="primary" size="lg" />
        </div>
      </template>
      <template #no-data>
        <div v-if="scheduleData?.length === 0 && !listLoading" class="setting-calendar__no-data">
          <img
            src="@/assets/images/noData.svg"
            alt="no-data"
            class="setting-calendar__no-data-image"
          />
          <span class="setting-calendar__no-data-text">اطلاعاتی یافت نشد</span>
        </div>
      </template>

      <template #body-cell-date="scope">
        <QTd :props="scope">
          <QChip
            :color="scope.row?.holiday ? 'negative' : 'primary'"
            :text-color="scope.row?.holiday ? 'white' : 'white'"
            square
            outline
            class="setting-calendar__date-chip"
          >
            {{ convertToJalaliWithTime(scope.row?.date, 'jYYYY/jMM/jDD') }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-start="scope">
        <QTd :props="scope">
          <QChip color="positive" text-color="white" square>
            {{ scope.row?.start || 'تعیین نشده' }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-end="scope">
        <QTd :props="scope">
          <QChip color="warning" text-color="white" square>
            {{ scope.row?.end || 'تعیین نشده' }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-holiday="scope">
        <QTd :props="scope">
          <QChip
            v-if="scope.row?.holiday"
            color="negative"
            text-color="white"
            square
            class="setting-calendar__holiday-chip"
          >
            تعطیل
          </QChip>
          <QChip
            v-else
            color="positive"
            text-color="white"
            square
            class="setting-calendar__holiday-chip"
          >
            کاری
          </QChip>
        </QTd>
      </template>

      <template #bottom>
        <div class="setting-calendar__load-more">
          <QBtn
            color="primary"
            outline
            unelevated
            :label="hasNextPage ? 'مشاهده موارد بیشتر...' : 'مورد بیشتری وجود ندارد'"
            :disable="!hasNextPage"
            :loading="isFetchingNextPage"
            class="setting-calendar__load-more-btn"
            @click="loadNextPage"
          />
        </div>
      </template>
    </QTable>
  </QCard>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCalendarInfinityQuery } from '../query'
import { useQueryClient } from '@tanstack/vue-query'
import { IconRefresh } from '@tabler/icons-vue'
import { useRoute } from 'vue-router'
import FilterBuilder from '@/components/FilterBuilder/FilterBuilder'
import { useHandleFilters } from '@/composables/use-handle-filters'
import { useTableSort } from '@/composables/use-table-sort'
import { convertToJalaliWithTime, formatDate } from '@/utils/date-utils'
import { tableFilters, tableColumns } from '@/modules/Settings/Calendar/constant/index'
import { Notif } from '@/data/services/notification-service'

const queryClient = useQueryClient()
const route = useRoute()

const defaultValues = ref({
  fromDate: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
})
const {
  formValues,
  apiFilters,
  applyFilters,
  resetFilters,
  handleInput,
  hasActiveFilters,
  handleSuggestFilter,
  setSort,
} = useHandleFilters(route.query, defaultValues.value, tableFilters)

const { pagination, sortMethod } = useTableSort(['calendar', 'all-calendar'], setSort)

const {
  data: calendarData,
  isLoading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useCalendarInfinityQuery(apiFilters)

const scheduleData = computed(
  () =>
    calendarData.value?.pages?.flatMap((pageData) => {
      return pageData.data.items
    }) || []
)

const calendarSuggestFilters = computed(
  () => calendarData.value?.pages?.[0]?.data?.suggestFilters || []
)

const totalItems = computed(() => scheduleData.value?.length)

const listLoading = computed(() => isLoading.value || isFetchingNextPage.value)

const loadNextPage = () => {
  if (!hasNextPage.value) return
  fetchNextPage()
}

const updateTable = () => {
  queryClient.invalidateQueries({ queryKey: ['calendar', 'all-calendar'] })
  Notif.success('لیست بروزرسانی شد')
}

const onFilterApply = (filteredValues) => {
  applyFilters(filteredValues)
  queryClient.invalidateQueries({ queryKey: ['calendar', 'all-calendar'] })
}

const onFilterReset = () => {
  pagination.value = { sortBy: null, descending: false }
  resetFilters()
  queryClient.invalidateQueries({ queryKey: ['calendar', 'all-calendar'] })
}

const onSelectSuggestFilter = (suggestFilter) => {
  handleSuggestFilter(suggestFilter)
}
</script>

<style scoped lang="scss">
.setting-calendar {
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

  &__date-chip {
    font-weight: 600;
    min-width: 8rem;
    text-align: center;
    margin: 0 auto;
  }

  &__holiday-chip {
    font-weight: 500;
    min-width: 4rem;
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
  .setting-calendar {
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

    &__date-chip {
      min-width: 6rem;
    }
  }
}

@media (max-width: 480px) {
  .setting-calendar {
    &__header-left {
      gap: 0.125rem;
    }

    &__title {
      font-size: 0.875rem;
    }

    &__date-chip {
      min-width: 5rem;
      font-size: 0.75rem;
    }
  }
}
</style>
