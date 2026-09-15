<template>
  <QCard flat class="feedback-list">
    <!-- Tabs -->
    <QTabs
      v-model="activeTab"
      class="feedback-list__tabs"
      active-color="primary"
      indicator-color="primary"
      align="left"
    >
      <QTab name="feedbacks" label="بازخوردها" />
      <QTab name="subtitles" label="زیرنویس‌ها" />
    </QTabs>

    <QSeparator />

    <!-- Tab Panels -->
    <QTabPanels v-model="activeTab" animated>
      <!-- Feedbacks Tab -->
      <QTabPanel name="feedbacks" class="feedback-list__tab-panel">
        <QCardSection class="feedback-list__header q-pa-none">
          <div class="feedback-list__header-left">
            <QChip square color="white" text-color="black" class="feedback-list__title">
              لیست بازخوردها
            </QChip>
            <QBtn fab-mini flat unelevated :loading="isFetching" @click="updateTable">
              <IconRefresh class="text-grey" />
            </QBtn>
            <div class="feedback-list__suggest-filters">
              <QChip
                v-for="_f in feedbackSuggestFilters"
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
          <div class="feedback-list__filters">
            <FilterBuilder
              :items="tableFilters"
              :form-values="formValues"
              :has-active-filters="hasActiveFilters"
              :handle-input="handleInput"
              :apply-filters="applyFilters"
              :reset-filters="resetFilters"
              :total-count="totalFeedbacks"
              total-label="بازخورد"
              :is-total-count-loading="isTotalCountLoading"
              :load-total-count="onLoadTotalCount"
              @apply="onFilterApply"
              @reset="onFilterReset"
            >
              <template #actions="{}">
                <div v-if="selectedFeedbacks.length > 0" class="feedback-list__batch-actions">
                  <Button
                    :right-icon="IconX"
                    variant="outline"
                    color="red"
                    size="md"
                    text="عدم انتشار"
                    :is-loading="batchRejectPending"
                    @click="handleBatchReject"
                  />
                  <Button
                    class="feedback-list__publish-btn"
                    variant="filled"
                    size="md"
                    color="blue"
                    text="انتشار"
                    :is-loading="batchAcceptPending"
                    @click="handleBatchAccept"
                  />
                </div>
              </template>
            </FilterBuilder>
          </div>
        </QCardSection>
        <QTable
          v-model:pagination="pagination"
          :sort-method="sortMethod"
          :rows="feedbackListData"
          :columns="tableColumns"
          :loading="listLoading"
          row-key="id"
          class="quasar-table q-ma-lg"
          :rows-per-page-options="[0]"
          flat
          :no-data-label="null"
          @row-click="handleRowClick"
        >
          <template #loading>
            <QInnerLoading size="40px" color="primary" />
            <div class="feedback-list__loading">
              <QSpinnerTail color="primary" size="lg" />
            </div>
          </template>

          <template v-if="feedbackListData?.length === 0" #no-data>
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
                  @click="refetch"
                />
                <Button variant="flat" color="red" text="بازگشت" @click="$router.back()" />
              </div>
            </div>
            <div v-else-if="!isLoading" class="flex column justify-center items-center q-mx-auto">
              <img src="@/assets/images/noData.svg" alt="no-data" />
              <Typography variant="heading" size="h6" color="blue-grey">
                اطلاعاتی یافت نشد
              </Typography>
            </div>
          </template>

          <template #header="scope">
            <QTr>
              <QTh auto-width>
                <Checkbox
                  size="md"
                  :model-value="allRowsSelected"
                  :indeterminate="someRowsSelected"
                  @update:model-value="toggleAllRows"
                />
              </QTh>
              <QTh
                v-for="col in scope.cols"
                :key="col.name"
                :props="scope"
                :class="{ 'text-right': col.align === 'left' }"
              >
                {{ col.label }}
              </QTh>
            </QTr>
          </template>

          <template #body="scope">
            <QTr :props="scope" :class="{ selected: isRowSelected(scope.row) }">
              <QTd auto-width>
                <Checkbox
                  size="md"
                  :model-value="isRowSelected(scope.row)"
                  @update:model-value="(val) => toggleRow(scope.row, val)"
                />
              </QTd>
              <template v-for="col in scope.cols" :key="col.name">
                <QTd :props="scope">
                  <template v-if="col.name === 'id'">
                    <span class="feedback-list__id-chip text-subtitle1">
                      {{ scope.row?.id }}
                    </span>
                  </template>
                  <template v-else-if="col.name === 'comment'">
                    <div class="feedback-list__comment-content">
                      <span class="feedback-list__comment-text">
                        {{ scope.row?.comment }}
                      </span>
                      <QTooltip v-if="scope.row?.comment" class="feedback-list__comment-tooltip">
                        {{ scope.row?.comment }}
                      </QTooltip>
                    </div>
                  </template>
                  <template v-else-if="col.name === 'user'">
                    <strong class="feedback-list__user-chip text-subtitle1">
                      {{ scope.row?.user?.name }}
                    </strong>
                  </template>
                  <template v-else-if="col.name === 'feedbackType'">
                    <QChip outline color="info" square class="feedback-list__type-chip">
                      {{ scope.row?.feedbackType?.name }}
                    </QChip>
                  </template>
                  <template v-else-if="col.name === 'rating'">
                    <div v-if="scope.row?.rating" class="feedback-list__rating">
                      <span v-for="i in 5" :key="i" class="feedback-list__rating-star">
                        <IconStarFilled
                          v-if="i <= Number(scope.row.rating)"
                          class="text-orange-5"
                          size="16"
                        />
                        <IconStar v-else class="text-grey-5" size="16" />
                      </span>
                    </div>
                    <span v-else class="text-grey-5">-</span>
                  </template>
                  <template v-else-if="col.name === 'contentType'">
                    <QChip outline color="primary" square class="feedback-list__content-type-chip">
                      {{ getContentTypes(scope.row) }}
                    </QChip>
                  </template>
                  <template v-else-if="col.name === 'isApproved'">
                    <QChip
                      :class="`feedback-list__status-chip feedback-list__status-chip--${FEEDBACK_STATUS_COLORS[scope.row?.isApproved]}`"
                      square
                      flat
                    >
                      {{ FEEDBACK_STATUS_LABELS[scope.row?.isApproved] }}
                    </QChip>
                  </template>
                  <template v-else-if="col.name === 'createdDate'">
                    <QChip outline color="primary" square class="feedback-list__date-chip">
                      {{ convertToJalaliWithTime(scope.row?.createdAt, 'jYYYY/jMM/jDD | HH:mm') }}
                    </QChip>
                  </template>
                  <template v-else-if="col.name === 'actions'">
                    <Button
                      variant="outline"
                      color="light-blue"
                      size="sm"
                      text="مشاهده"
                      @click.stop="handleViewDetails(scope.row)"
                    />
                  </template>
                </QTd>
              </template>
            </QTr>
          </template>

          <template #bottom>
            <div class="feedback-list__load-more">
              <QBtn
                color="primary"
                outline
                unelevated
                :label="hasNextPage ? 'مشاهده موارد بیشتر...' : 'مورد بیشتری وجود ندارد'"
                :disable="!hasNextPage"
                :loading="isFetchingNextPage"
                class="feedback-list__load-more-btn"
                @click="loadNextPage"
              />
            </div>
          </template>
        </QTable>

        <!-- Feedback Detail Modal -->
        <FeedbackDetailModal v-model="showDetailModal" :feedback-id="selectedFeedbackId" />
      </QTabPanel>

      <!-- Subtitles Tab -->
      <QTabPanel name="subtitles" class="feedback-list__tab-panel">
        <SubtitleList />
      </QTabPanel>
    </QTabPanels>
  </QCard>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import {
  useFeedbackList,
  useGetTotalFeedbackCountMutation,
  useBatchAcceptFeedbacks,
  useBatchRejectFeedbacks,
} from '../query'
import { useQueryClient } from '@tanstack/vue-query'
import { handleError } from '@/utils/error-handler'
import { IconRefresh, IconStarFilled, IconStar, IconX } from '@tabler/icons-vue'
import { useRoute } from 'vue-router'
import FilterBuilder from '@/components/FilterBuilder/FilterBuilder'
import { useHandleFilters } from '@/composables/use-handle-filters'
import { useTableSort } from '@/composables/use-table-sort'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import {
  FEEDBACK_STATUS_OPTIONS,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_STATUS_COLORS,
} from '../constant'
import FeedbackDetailModal from '../components/FeedbackDetailModal'
import SubtitleList from '../components/SubtitleList'
import UserSelectField from '@/components/Form/UserSelectField'
import PersianDateRange from '@/components/Form/PersianDateRange'
import Button from '@/base/Button'
import Checkbox from '@/base/Checkbox'
import { getErrorMessage } from '@/utils/get-error-message'
import Typography from '@/base/Typography'

const queryClient = useQueryClient()
const route = useRoute()

const activeTab = ref('feedbacks')
const totalFeedbacks = ref(null)
const showDetailModal = ref(false)
const selectedFeedbackId = ref(null)
const selectedFeedbacks = ref([])

const tableColumns = [
  { name: 'id', label: '#', field: 'id', align: 'center' },
  { name: 'user', label: 'نام', field: 'user.name', sortable: false, align: 'center' },
  {
    name: 'createdDate',
    label: 'تاریخ بارگذاری',
    field: 'createdAt',
    align: 'center',
  },
  { name: 'isApproved', label: 'وضعیت', field: 'isApproved', align: 'center' },

  { name: 'rating', label: 'امتیاز', field: 'rating', sortable: false, align: 'center' },
  {
    name: 'contentType',
    label: 'نوع محتوا',
    field: 'contentType',
    sortable: false,
    align: 'center',
  },
  {
    name: 'comment',
    label: 'محتوای بازخورد',
    field: 'comment',
    sortable: false,
    align: 'left',
    style: 'width: 1%',
    classes: 'feedback-list__comment-cell',
  },

  { name: 'actions', label: '', sortable: false, align: 'center' },
]

const tableFilters = [
  {
    type: 'component',
    component: UserSelectField,
    name: 'user_id',
    title: 'کاربر',
    placeholder: 'جستجوی کاربر...',
  },
  // {
  //   type: 'text',
  //   name: 'comment',
  //   title: 'نظر',
  //   placeholder: 'جستجوی نظر...',
  // },
  {
    type: 'select',
    name: 'is_approved',
    title: 'وضعیت',
    placeholder: 'انتخاب وضعیت...',
    options: FEEDBACK_STATUS_OPTIONS,
  },
  {
    type: 'component',
    component: PersianDateRange,
    name: 'created_at',
    title: 'تاریخ بارگذاری',
  },
  // {
  //   type: 'select',
  //   name: 'feedback_type_id',
  //   title: 'نوع بازخورد',
  //   placeholder: 'انتخاب نوع...',
  //   options: FEEDBACK_TYPE_OPTIONS,
  // },
  // {
  //   type: 'select',
  //   name: 'rating',
  //   title: 'امتیاز',
  //   placeholder: 'انتخاب امتیاز...',
  //   options: RATING_OPTIONS,
  // },
]

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

const { pagination, sortMethod } = useTableSort(['feedback-list'], setSort, { exactRemove: true })

const {
  data: feedbackData,
  isLoading,
  isFetching,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
  isError,
  refetch,
  error,
} = useFeedbackList(apiFilters)

const feedbackListData = computed(() => {
  return (
    feedbackData.value?.pages?.flatMap((pageData) => {
      return pageData.data.items.map((item) => ({
        ...item,
      }))
    }) || []
  )
})

const feedbackSuggestFilters = computed(
  () => feedbackData.value?.pages?.[0]?.data?.suggestFilters || []
)

const allRowsSelected = computed(
  () =>
    feedbackListData.value.length > 0 &&
    selectedFeedbacks.value.length === feedbackListData.value.length
)

const someRowsSelected = computed(
  () => selectedFeedbacks.value.length > 0 && !allRowsSelected.value
)

const isRowSelected = (row) => selectedFeedbacks.value.some((r) => r.id === row.id)

const toggleRow = (row, val) => {
  selectedFeedbacks.value = val
    ? [...selectedFeedbacks.value, row]
    : selectedFeedbacks.value.filter((r) => r.id !== row.id)
}

const toggleAllRows = (val) => {
  selectedFeedbacks.value = val ? [...feedbackListData.value] : []
}

const { mutate: totalCount, isPending: isTotalCountLoading } = useGetTotalFeedbackCountMutation()

// Only show loading when there's no cached data
const listLoading = computed(() => {
  const hasData = feedbackListData.value?.length > 0
  return isFetchingNextPage.value || (isLoading.value && !hasData)
})

const getContentTypes = (feedback) => {
  const types = []

  // Check for text content
  if (feedback?.comment && feedback.comment.trim()) {
    types.push('متن')
  }

  // Check files for different media types
  if (feedback?.files && feedback.files.length > 0) {
    const hasImage = feedback.files.some((file) => file.mimeType?.startsWith('image/'))
    const hasVideo = feedback.files.some((file) => file.mimeType?.startsWith('video/'))
    const hasAudio = feedback.files.some((file) => file.mimeType?.startsWith('audio/'))

    if (hasImage) types.push('تصویر')
    if (hasVideo) types.push('فیلم')
    if (hasAudio) types.push('صوتی')
  }

  return types.length > 0 ? types.join('، ') : '-'
}

const handleViewDetails = (row) => {
  selectedFeedbackId.value = row.id
  showDetailModal.value = true
}

const handleRowClick = (evt, row) => {
  if (evt?.target?.closest('.feedback-list__actions-cell')) {
    return
  }
  if (evt?.target?.closest('.checkbox')) {
    return
  }
  handleViewDetails(row)
}

const updateTable = () => {
  queryClient.invalidateQueries({ queryKey: ['feedback-list'] })
  Notif.success('لیست بروزرسانی شد')
}

const onLoadTotalCount = () => {
  totalFeedbacks.value = null
  totalCount(apiFilters, {
    onSuccess: (data) => {
      totalFeedbacks.value = data?.data?.count
    },
    onError: (err) => {
      handleError(err)
    },
  })
}

const onFilterApply = (filteredValues) => {
  totalFeedbacks.value = null
  applyFilters(filteredValues)
  queryClient.invalidateQueries({ queryKey: ['feedback-list'] })
}

const onFilterReset = () => {
  pagination.value = { sortBy: null, descending: false }
  totalFeedbacks.value = null
  resetFilters()
  queryClient.invalidateQueries({ queryKey: ['feedback-list'] })
}

const onSelectSuggestFilter = (suggestFilter) => {
  handleSuggestFilter(suggestFilter)
}

const { mutate: batchAcceptMutate, isPending: batchAcceptPending } = useBatchAcceptFeedbacks()
const { mutate: batchRejectMutate, isPending: batchRejectPending } = useBatchRejectFeedbacks()

const handleBatchAccept = () => {
  confirmDialog(
    null,
    'بازخورد‌های انتخاب شده به وضعیت انتشار تغییر می‌دی؟',
    () => {
      const ids = selectedFeedbacks.value.map((row) => row.id)
      batchAcceptMutate(ids, {
        onSuccess: () => {
          selectedFeedbacks.value = []
          Notif.success('بازخوردها با موفقیت منتشر شدند')
        },
        onError: (err) => {
          handleError(err)
        },
      })
    },
    {
      ok: {
        label: 'انتشار بازخوردها',
        color: 'primary',
      },
      cancel: {
        label: 'انصراف',
        flat: true,
        color: 'red',
      },
      persistent: true,
    }
  )
}

const handleBatchReject = () => {
  confirmDialog(
    null,
    'بازخورد‌های انتخاب شده به وضعیت عدم انتشار تغییر می‌دی؟',
    () => {
      const ids = selectedFeedbacks.value.map((row) => row.id)
      batchRejectMutate(ids, {
        onSuccess: () => {
          selectedFeedbacks.value = []
          Notif.success('بازخوردها از انتشار خارج شدند')
        },
        onError: (err) => {
          handleError(err)
        },
      })
    },
    {
      ok: {
        label: 'عدم انتشار بازخوردها',
        color: 'primary',
      },
      cancel: {
        label: 'انصراف',
        flat: true,
        color: 'red',
      },
      persistent: true,
    }
  )
}

const loadNextPage = () => {
  if (!hasNextPage.value) return
  fetchNextPage()
}
</script>

<style scoped lang="scss">
.feedback-list {
  padding: 0;

  &__tabs {
    padding: 0 1rem;
    background: white;
  }

  &__tab-panel {
    padding: 0;
  }

  &__header {
    padding: 1rem;
    padding-bottom: 0;
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

    :deep(.q-table tbody tr) {
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: rgba($primary, 0.04);
      }
    }

    :deep(.q-table tbody tr.selected) {
      background-color: rgba($primary, 0.08);
    }
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
    color: #606266;
  }

  &__comment-cell {
    white-space: nowrap;
    max-width: 20rem;
  }

  &__comment-content {
    white-space: nowrap;
  }

  &__comment-text {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__comment-tooltip {
    font-size: 0.875rem;
    background-color: #000;
    color: #fff;
    max-width: 20rem;
    white-space: pre-line;
    word-wrap: break-word;
  }

  &__user-chip {
    min-width: 6rem;
  }

  &__type-chip {
    min-width: 5rem;
  }

  &__rating {
    display: flex;
    gap: 0.125rem;
    justify-content: center;
  }

  &__rating-star {
    font-size: 1rem;
  }

  &__content-type-chip {
    min-width: 6rem;
    font-weight: 500;
  }

  &__status-chip {
    font-weight: 500;
    min-width: 5rem;
    border: 1px solid;
    &--green {
      background-color: rgba($green, 0.1);
      color: $green;
      border-color: $green;
    }

    &--red {
      background-color: rgba($red, 0.1);
      color: $red;
      border-color: $red;
    }

    &--gray {
      background-color: rgba($grey-6, 0.1);
      color: #808080;
      border-color: #808080;
    }
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

  &__batch-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  :deep(.feedback-list__publish-btn) {
    padding-inline: 3.375rem;
  }
}

@media (max-width: 768px) {
  .feedback-list {
    padding: 0.5rem;

    &__batch-actions {
      padding-inline: 1rem;
    }

    :deep(.feedback-list__publish-btn) {
      padding-inline: 1rem;
    }

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

    &__comment-cell {
      min-width: 8rem;
      max-width: 12rem;
    }
  }
}

@media (max-width: 480px) {
  .feedback-list {
    &__batch-actions {
      padding-inline: 0.5rem;
    }

    :deep(.feedback-list__publish-btn) {
      padding-inline: 0.5rem;
    }

    &__header-left {
      gap: 0.125rem;
    }

    &__title {
      font-size: 0.875rem;
    }

    &__comment-cell {
      min-width: 6rem;
      max-width: 10rem;
    }
  }
}
</style>
