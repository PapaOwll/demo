<template>
  <QCardSection>
    <div class="discount-list__header">
      <div class="discount-list__header-title">
        <Typography variant="heading" size="h5" weight="bold">لیست تخفیف ها</Typography>
        <Button
          variant="outline"
          :is-loading="isFetching"
          size="sm"
          color="grey"
          :left-icon="IconRefresh"
          is-rounded
          is-icon-only
          @click="updateTable"
        />
      </div>
      <div class="discount-list__header-button">
        <Button
          v-if="getPerms('ads', 'add', true, 'coupon')"
          :right-icon="IconPlus"
          text="افزودن کد تخفیف"
          to="/ads/coupon/create"
        />
      </div>
    </div>
    <div class="discount-list__filters">
      <FilterBuilder
        :items="tableFilters"
        :form-values="formValues"
        :has-active-filters="hasActiveFilters"
        :handle-input="handleInput"
        :apply-filters="applyFilters"
        :reset-filters="resetFilters"
        :total-count="0"
        total-label="کمپین"
        :is-total-count-loading="false"
        @apply="onFilterApply"
        @reset="onFilterReset"
      />
    </div>

    <QTable
      v-model:pagination="pagination"
      :sort-method="sortMethod"
      :rows="couponListItems"
      :columns="tableColumns"
      :loading="loadingList"
      :loading-label="null"
      class="quasar-table discount-list__table"
      :rows-per-page-options="[0]"
      :no-data-label="null"
      flat
    >
      <template #loading>
        <QInnerLoading size="40px" color="primary" />
        <div class="discount-list__loading">
          <QSpinnerTail color="primary" size="lg" />
        </div>
      </template>

      <template v-if="couponListItems?.length === 0" #no-data>
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

      <template #body-cell-limit="scope">
        <QTd :props="scope">
          <Typography v-if="scope.row.limit > 0" variant="body" size="3" weight="semibold">
            {{ scope.row?.limit }} / {{ scope.row?.usageCount }}
          </Typography>
          <Typography v-else variant="body" size="3" weight="semibold">بدون محدودیت</Typography>
        </QTd>
      </template>

      <template #body-cell-expireDate="scope">
        <QTd :props="scope">
          <Typography variant="body" size="3">
            {{ scope.row?.expiresAt ? convertToJalali(scope.row.expiresAt) : 'بدون انقضا' }}
          </Typography>
        </QTd>
      </template>
      <template #body-cell-status="scope">
        <QTd :props="scope">
          <Badge
            v-if="scope.row?.status"
            variant="light"
            :color="
              scope.row.status?.slug === 'active'
                ? 'light-blue'
                : scope.row.status?.slug === 'inactive'
                  ? 'amber'
                  : 'red'
            "
            :label="scope.row?.status?.title"
          />
          <Typography v-else variant="body" size="4" weight="semibold">بدون وضعیت</Typography>
        </QTd>
      </template>
      <template #body-cell-actions="scope">
        <QTd :props="scope">
          <QBtn dropdown round flat color="dark">
            <IconDotsVertical />
            <QMenu transition-show="jump-down" transition-hide="jump-up">
              <QList>
                <QItem v-close-popup clickable :to="`/ads/coupon/view/${scope.row?.id}`">
                  <QItemSection>
                    <QItemLabel>مشاهده</QItemLabel>
                  </QItemSection>
                </QItem>
                <QItem
                  v-if="canActiveDeactive(scope.row?.status?.slug)"
                  v-close-popup
                  clickable
                  :disable="isToggling"
                  @click="toggleCouponStatus(scope.row)"
                >
                  <QItemSection>
                    <QItemLabel>
                      {{ scope.row.status?.slug === 'active' ? 'غیرفعال سازی' : 'فعال سازی' }}
                    </QItemLabel>
                  </QItemSection>
                </QItem>
                <QItem
                  v-if="canDelete(scope.row?.status?.slug)"
                  v-close-popup
                  clickable
                  @click="deleteCoupon(scope.row)"
                >
                  <QItemSection>
                    <QItemLabel class="text-negative">حذف</QItemLabel>
                  </QItemSection>
                </QItem>
              </QList>
            </QMenu>
          </QBtn>
        </QTd>
      </template>

      <template #bottom>
        <div class="discount-list__load-more">
          <Button
            color="light-blue"
            variant="outline"
            :text="hasNextPage ? 'مشاهده موارد بیشتر...' : 'مورد بیشتری وجود ندارد'"
            :is-disabled="!hasNextPage"
            :loading="isFetchingNextPage"
            class="discount-list__load-more-btn"
            @click="loadNextPage"
          />
        </div>
      </template>
    </QTable>

    <QDialog v-model="showDeleteDialog" persistent>
      <QCard>
        <QCardSection>
          <Typography variant="heading" size="h6">حذف کد تخفیف</Typography>
        </QCardSection>
        <QCardSection>
          <Typography variant="body" size="3">
            آیا از حذف کد تخفیف "{{ couponToDelete?.name }}" اطمینان دارید؟
          </Typography>
        </QCardSection>
        <QCardActions align="right">
          <Button variant="flat" color="grey" text="لغو" @click="showDeleteDialog = false" />
          <Button
            color="red"
            :text="isDeleting ? 'در حال حذف...' : 'حذف'"
            :is-loading="isDeleting"
            @click="confirmDelete"
          />
        </QCardActions>
      </QCard>
    </QDialog>
  </QCardSection>
</template>

<script setup>
import { getPerms } from '@/utils/get-perms'
import { IconPlus, IconRefresh, IconDotsVertical } from '@tabler/icons-vue'
import FilterBuilder from '@/components/FilterBuilder/FilterBuilder'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import Badge from '@/base/Badge'
import { useHandleFilters } from '@/composables/use-handle-filters'
import { useTableSort } from '@/composables/use-table-sort'
import { tableFilters, tableColumns } from '../constant/coupon-list'
import { useRoute } from 'vue-router'
import { computed, ref } from 'vue'
import {
  useGetCouponInfinityQuery,
  useDeleteCouponMutation,
  useCouponToggleActiveMutation,
} from '@/modules/Ads/query/index'
import { useQueryClient } from '@tanstack/vue-query'
import { convertToJalali } from '@/utils/date-utils'
import { QDialog, QCard, QCardActions, QCardSection } from 'quasar'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import { getErrorMessage } from '@/utils/get-error-message'

const route = useRoute()
const queryClient = useQueryClient()
const {
  formValues,
  apiFilters,
  applyFilters,
  resetFilters,
  handleInput,
  hasActiveFilters,
  setSort,
} = useHandleFilters(route.query, {}, tableFilters)
const { pagination, sortMethod } = useTableSort(['coupon', 'all-coupon'], setSort)
const {
  data: couponListData,
  isLoading,
  isFetching,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
} = useGetCouponInfinityQuery(apiFilters)

const couponListItems = computed(() => {
  return (
    couponListData.value?.pages?.flatMap((pageData) => {
      return pageData?.items.map((item) => ({
        ...item,
      }))
    }) || []
  )
})

const loadingList = computed(() => {
  const hasData = couponListData.value?.length > 0
  return isFetchingNextPage.value || (isLoading.value && !hasData)
})

const onFilterApply = (filteredValues) => {
  applyFilters(filteredValues)
  queryClient.invalidateQueries({ queryKey: ['coupon', 'all-coupon'] })
}

const onFilterReset = () => {
  pagination.value = { sortBy: null, descending: false }
  resetFilters()
  queryClient.invalidateQueries({ queryKey: ['coupon', 'all-coupon'] })
}

const loadNextPage = () => {
  if (!hasNextPage.value) return
  fetchNextPage()
}

const canActiveDeactive = (status) => {
  return status !== 'deleted' && getPerms('ads', 'update', true, 'coupon')
}

const canDelete = (status) => {
  return status !== 'deleted' && getPerms('ads', 'delete', true, 'coupon')
}

const updateTable = () => {
  queryClient.invalidateQueries({ queryKey: ['coupon', 'all-coupon'] })
  Notif.success('لیست بروزرسانی شد')
}

const showDeleteDialog = ref(false)
const couponToDelete = ref(null)
const { mutate: deleteCouponMutation, isPending: isDeleting } = useDeleteCouponMutation()

const deleteCoupon = (coupon) => {
  couponToDelete.value = coupon
  showDeleteDialog.value = true
}

const confirmDelete = () => {
  if (!couponToDelete.value) return

  deleteCouponMutation(couponToDelete.value.id, {
    onSuccess: () => {
      Notif.success('کد تخفیف با موفقیت حذف شد')
      showDeleteDialog.value = false
      couponToDelete.value = null
      queryClient.invalidateQueries({ queryKey: ['coupon', 'all-coupon'] })
    },
  })
}

const { mutate: toggleActiveMutation, isPending: isToggling } = useCouponToggleActiveMutation()

const toggleCouponStatus = (coupon) => {
  const isActive = coupon.status?.slug === 'active'
  const actionText = isActive ? 'غیرفعال' : 'فعال'

  confirmDialog(
    'تأیید',
    `آیا از ${actionText} سازی کد تخفیف "${coupon.name}" اطمینان دارید؟`,
    () => {
      toggleActiveMutation(
        { id: coupon.id },
        {
          onSuccess: () => {
            Notif.success(`کد تخفیف با موفقیت ${actionText} شد`)
            queryClient.invalidateQueries({ queryKey: ['coupon', 'all-coupon'] })
          },
          onError: (error) => {
            Notif.error(`خطا در ${actionText} سازی کد تخفیف`, {
              caption: getErrorMessage(error),
            })
          },
        }
      )
    },
    { persistent: true }
  )
}
</script>

<style scoped lang="scss">
.discount-list {
  padding: 1rem;

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-md;

    &-title {
      display: flex;
      gap: $spacing-sm;
    }
  }

  &__table {
    &:deep(.q-table) {
      thead tr:first-child th {
        background-color: $grey-2 !important;
        border: 1px solid $grey-3 !important;
        border-right: none !important;
        border-left: none !important;
        color: $dark-6 !important;
      }

      thead tr:first-child th:last-child {
        border-left: 1px solid $grey-3 !important;
      }

      thead tr:first-child th:first-child {
        border-right: 1px solid $grey-3 !important;
      }
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
</style>
