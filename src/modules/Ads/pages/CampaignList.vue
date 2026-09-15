<template>
  <QCard flat class="campaign-list">
    <QCardSection class="campaign-list__header q-pa-none">
      <div class="campaign-list__header-left">
        <QChip square color="white" text-color="black" class="campaign-list__title">کمپین ها</QChip>
        <QBtn fab-mini flat unelevated :loading="isFetching" @click="updateTable">
          <IconRefresh class="text-grey" />
        </QBtn>
        <div class="campaign-list__suggest-filters">
          <QChip
            v-for="_f in campaignSuggestFilters"
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
      <div class="campaign-list__header-right">
        <QBtn
          v-if="getPerms('ads', 'add', true, 'campaign')"
          outline
          text-color="green-6"
          color="green-1"
          unelevated
          class="campaign-list__create-btn"
          @click="openCampaignFormDialog"
        >
          <IconPlus />
          افزودن کمپین
        </QBtn>
      </div>
      <div class="campaign-list__filters">
        <FilterBuilder
          :items="tableFilters"
          :form-values="formValues"
          :has-active-filters="hasActiveFilters"
          :handle-input="handleInput"
          :apply-filters="applyFilters"
          :reset-filters="resetFilters"
          :total-count="totalCampaigns"
          total-label="کمپین"
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
      :rows="campaignListItems"
      :columns="tableColumns"
      :loading="listLoading"
      row-key="id"
      class="quasar-table campaign-list__table"
      :rows-per-page-options="[0]"
      :no-data-label="null"
      flat
    >
      <template #loading>
        <QInnerLoading size="40px" color="primary" />
        <div class="campaign-list__loading">
          <QSpinnerTail color="primary" size="lg" />
        </div>
      </template>

      <template v-if="campaignListItems?.length === 0" #no-data>
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
          <QChip outline color="primary" square class="campaign-list__id-chip">
            {{ scope.row?.id }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-title="scope">
        <QTd :props="scope" class="campaign-list__title-cell">
          {{ scope.row?.title }}
          <QTooltip v-if="scope.row?.title" class="campaign-list__title-tooltip">
            {{ scope.row?.title }}
          </QTooltip>
        </QTd>
      </template>
      <template #body-cell-description="scope">
        <QTd :props="scope" class="campaign-list__description-cell">
          {{ scope.row?.description }}
          <QTooltip v-if="scope.row?.description" class="text-subtitle2 text-white bg-black">
            {{ scope.row?.description }}
          </QTooltip>
        </QTd>
      </template>
      <template #body-cell-startedAt="scope">
        <QTd :props="scope">
          <QChip
            v-if="scope.row.startedAt"
            outline
            color="primary"
            square
            class="campaign-list__date-chip"
          >
            {{ convertToJalaliWithTime(scope.row?.startedAt, 'jYYYY/jMM/jDD | HH:mm') }}
          </QChip>
          <QChip v-else color="primary" outline square class="campaign-list__date-chip">
            ثبت نشده
          </QChip>
        </QTd>
      </template>
      <template #body-cell-endedAt="scope">
        <QTd :props="scope">
          <QChip
            v-if="scope.row.endedAt"
            outline
            color="secondary"
            square
            class="campaign-list__date-chip"
          >
            {{ convertToJalaliWithTime(scope.row?.endedAt, 'jYYYY/jMM/jDD | HH:mm') }}
          </QChip>
          <QChip v-else color="red-6" square outline class="campaign-list__date-chip">
            ثبت نشده
          </QChip>
        </QTd>
      </template>
      <template #body-cell-actions="scope">
        <QTd :props="scope">
          <QBtn flat round color="primary" @click="openCampaignFormDialog(scope.row)">
            <IconPencil class="text-primary" />
          </QBtn>
        </QTd>
      </template>

      <template #bottom>
        <div class="campaign-list__load-more">
          <QBtn
            color="primary"
            outline
            unelevated
            :label="hasNextPage ? 'مشاهده موارد بیشتر...' : 'مورد بیشتری وجود ندارد'"
            :disable="!hasNextPage"
            :loading="isFetchingNextPage"
            class="campaign-list__load-more-btn"
            @click="loadNextPage"
          />
        </div>
      </template>
    </QTable>
  </QCard>
  <CampaignForm
    :visible="campaignFormVisible"
    :edit-value="campaignFromData"
    @after-submit="afterSubmitForm"
    @close="closeCampaignForm"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import { Notif } from '@/data/services/notification-service'
import { getPerms } from '@/utils/get-perms'
import CampaignForm from '../components/CampaignForm'
import { useGetCampaignInfinityQuery, useGetTotalCampaignCountMutation } from '../query'
import { useQueryClient } from '@tanstack/vue-query'
import { handleError } from '@/utils/error-handler'
import { IconPlus, IconRefresh, IconPencil } from '@tabler/icons-vue'
import { useRoute } from 'vue-router'
import FilterBuilder from '@/components/FilterBuilder/FilterBuilder'
import { useHandleFilters } from '@/composables/use-handle-filters'
import { useTableSort } from '@/composables/use-table-sort'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import { tableFilters, tableColumns } from '../constant/campaign-list'
import { getErrorMessage } from '@/utils/get-error-message'
import Typography from '@/base/Typography'
import Button from '@/base/Button'

const queryClient = useQueryClient()
const route = useRoute()

const campaignFormVisible = ref(false)
const campaignFromData = ref(null)
const totalCampaigns = ref(null)

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

const { pagination, sortMethod } = useTableSort(['campaign', 'all-campaigns'], setSort)

const {
  data: campaignListData,
  isLoading,
  isFetching,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
  isError,
  refetch,
  error,
} = useGetCampaignInfinityQuery(apiFilters)

const openCampaignFormDialog = (data) => {
  campaignFormVisible.value = true
  campaignFromData.value = data
}

const loadNextPage = () => {
  if (!hasNextPage.value) return
  fetchNextPage()
}

const campaignListItems = computed(() => {
  return (
    campaignListData.value?.pages?.flatMap((pageData) => {
      return pageData?.items.map((item) => ({
        ...item,
        startedAt: item?.startedAt,
        endedAt: item?.endedAt,
      }))
    }) || []
  )
})
const campaignSuggestFilters = computed(
  () => campaignListData.value?.pages?.[0]?.data?.suggestFilters || []
)

const { mutate: totalCount, isPending: isTotalCountLoading } = useGetTotalCampaignCountMutation()

const onLoadTotalCount = () => {
  totalCampaigns.value = null
  totalCount(apiFilters, {
    onSuccess: (data) => {
      totalCampaigns.value = data?.data?.count
    },
    onError: (e) => {
      handleError(e)
    },
  })
}

// Only show loading when there's no cached data
const listLoading = computed(() => {
  const hasData = campaignListItems.value?.length > 0
  return isFetchingNextPage.value || (isLoading.value && !hasData)
})

const updateTable = () => {
  queryClient.invalidateQueries({ queryKey: ['campaign', 'all-campaigns'] })
  Notif.success('لیست بروزرسانی شد')
}

const onFilterApply = (filteredValues) => {
  totalCampaigns.value = null
  applyFilters(filteredValues)
  queryClient.invalidateQueries({ queryKey: ['campaign', 'all-campaigns'] })
}

const onFilterReset = () => {
  pagination.value = { sortBy: null, descending: false }
  totalCampaigns.value = null
  resetFilters()
  queryClient.invalidateQueries({ queryKey: ['campaign', 'all-campaigns'] })
}

const onSelectSuggestFilter = (suggestFilter) => {
  handleSuggestFilter(suggestFilter)
}

const closeCampaignForm = () => {
  campaignFormVisible.value = false
  campaignFromData.value = null
}

const afterSubmitForm = () => {
  campaignFormVisible.value = false
  campaignFromData.value = null
  updateTable()
}
</script>

<style scoped lang="scss">
.campaign-list {
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
    min-width: 3rem;
  }

  &__title-cell,
  &__description-cell {
    max-width: 12.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &__date-chip {
    padding: 0.3125rem !important;
    min-width: 7.5rem !important;
    margin: 0 auto !important;
    text-align: center !important;
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
  .campaign-list {
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

    &__title-cell,
    &__description-cell {
      max-width: 8rem;
    }
  }
}

@media (max-width: 480px) {
  .campaign-list {
    &__header-left {
      gap: 0.125rem;
    }

    &__title {
      font-size: 0.875rem;
    }

    &__title-cell,
    &__description-cell {
      max-width: 6rem;
    }
  }
}
</style>
