<template>
  <QCard flat class="q-pa-md">
    <QCardSection class="row q-col-gutter-sm items-center justify-between q-pa-none">
      <div class="col-10 flex q-gutter-xs items-center">
        <QChip square color="white" text-color="black" class="text-h6">نوبت مشاوره</QChip>
        <QBtn fab-mini flat unelevated :loading="isFetching" @click="updateTable">
          <IconRefresh class="text-grey" />
        </QBtn>
        <div class="flex">
          <QChip
            v-for="_f in bookingVisitSuggestFilters"
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
        <QBtnDropdown
          v-if="getPerms('booking', 'add', false, undefined)"
          outline
          auto-close
          text-color="green-6"
          color="green-1"
          unelevated
        >
          <template #label>
            <IconPlus />
            افزودن نوبت
          </template>
          <template #default>
            <QList>
              <QItem clickable @click="openBookingFormDialog({ type: 1, visitType: { id: 1 } })">
                <QItemSection>حضوری</QItemSection>
              </QItem>
              <QItem clickable @click="openBookingFormDialog({ type: 1, visitType: { id: 2 } })">
                <QItemSection>آنلاین</QItemSection>
              </QItem>
            </QList>
          </template>
        </QBtnDropdown>
      </div>

      <div class="col-12">
        <FilterBuilder
          :reset-filters="resetFilters"
          :apply-filters="applyFilters"
          :handle-input="handleInput"
          :form-values="formValues"
          :has-active-filters="hasActiveFilters"
          :items="tableFilters"
          :total-count="totalBookingVisit"
          total-label="نوبت"
          :is-total-count-loading="listLoading"
          :load-total-count="onLoadTotalCount"
          @apply="onFilterApply"
          @reset="onFilterReset"
        />
      </div>
    </QCardSection>

    <QTable
      v-model:pagination="pagination"
      :sort-method="sortMethod"
      :rows="bookingVisitListItems"
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
        <div class="no-data">
          <QSpinnerTail color="primary" size="lg" />
        </div>
      </template>
      <template v-if="bookingVisitListItems?.length === 0" #no-data>
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
          <UserMenu :user="scope.row" />
        </QTd>
      </template>
      <template #body-cell-status="scope">
        <QTd :props="scope">
          <BookingStatusInformation :booking="scope.row" />
        </QTd>
      </template>
      <template #body-cell-serves="scope">
        <QTd :props="scope">
          <div v-if="scope.row.serves.length > 0" class="visit-serves">
            <QBadge class="q-pa-xs" color="blue-grey-8" outline>
              {{ scope.row.serves[0]?.title }}
              <span v-if="scope.row.serves.length > 1">و...</span>
            </QBadge>
            <QTooltip v-if="scope.row.serves.length > 1" class="bg-grey-3 q-pa-sm">
              <QBadge
                v-for="serve in scope.row.serves"
                :key="serve.id"
                :label="serve.title"
                class="q-pa-xs q-mx-sm"
                color="blue-grey-9"
                outline
              />
            </QTooltip>
          </div>
        </QTd>
      </template>
      <template #body-cell-bookingAt="scope">
        <QTd :props="scope">
          <QChip
            :label="convertToJalaliWithTime(scope?.row?.bookingAt)"
            outline
            square
            color="blue-grey-8"
          />
        </QTd>
      </template>
      <template #body-cell-visitBtn="scope">
        <QTd :props="scope">
          <VisitFormButton :booking="scope.row" />
        </QTd>
      </template>
      <template #body-cell-actions="scope">
        <QTd :props="scope">
          <div class="flex q-gutter-sm">
            <QBtn
              v-if="getPerms('booking', 'view')"
              round
              size="sm"
              color="grey-6"
              outline
              @click="openBookingDetailDialog(scope.row)"
            >
              <IconEye size="18" />
              <QTooltip>مشاهده جزییات</QTooltip>
            </QBtn>
            <QBtn
              v-if="getPerms('booking', 'update')"
              round
              size="sm"
              outline
              color="primary"
              @click="editUserBooking(scope.row)"
            >
              <IconEdit size="18" />
            </QBtn>
            <QBtn
              v-if="getPerms('booking', 'delete')"
              round
              size="sm"
              outline
              color="negative"
              @click="deleteUserBooking(scope.row)"
            >
              <IconTrash size="18" />
            </QBtn>
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
  <BookingForm
    v-if="bookingFormVisible"
    :visible="bookingFormVisible"
    :edit-value="bookingFormData"
    @close="closeBookingFormDialog"
    @after-submit="onBookingFormSubmit"
  />
  <BookingDetail
    :booking-data="bookingDetailData"
    :visible="bookingDataVisible"
    @close="closeBookingDetailDialog"
    @submit="afterEditCancel"
  />
</template>

<script setup>
import { computed, ref } from 'vue'

import BookingStatusInformation from '../../../components/BookingStatusInformation'
import VisitFormButton from '../../../components/VisitFormButton'
import BookingDetail from '../components/BookingDetail'
import { useQueryClient } from '@tanstack/vue-query'
import BookingForm from '../components/BookingForm'
import { handleError } from '@/utils/error-handler'
import { getPerms } from '@/utils/get-perms'
import {
  useBookingVisitInfinityQuery,
  useDeleteBookingMutation,
  useGetVisitTotalCountMutation,
} from '@/modules/Booking/query'
import { IconRefresh, IconEdit, IconEye, IconTrash, IconPlus } from '@tabler/icons-vue'
import { useHandleFilters } from '@/composables/use-handle-filters'
import { useTableSort } from '@/composables/use-table-sort'
import { useRoute } from 'vue-router'
import { tableColumns, tableFilters } from '@/modules/Booking/constant/visit-list'
import UserMenu from '@/components/UserMenu'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import FilterBuilder from '@/components/FilterBuilder/FilterBuilder'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import { getErrorMessage } from '@/utils/get-error-message'

const route = useRoute()

const bookingFormVisible = ref(false)
const bookingDataVisible = ref(false)
const queryClient = useQueryClient()
const totalBookingVisit = ref(null)
const bookingDetailData = ref(null)
const bookingFormData = ref(false)
const defautFilters = ref({
  type: 1,
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
} = useHandleFilters(route.query, defautFilters.value, tableFilters)

const { pagination, sortMethod } = useTableSort(['booking', 'all-booking-visit'], setSort)

const {
  data: bookingVisitListData,
  isLoading,
  isFetching,
  isError,
  error,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
  refetch,
} = useBookingVisitInfinityQuery(apiFilters)

const bookingVisitListItems = computed(() => {
  const pages = bookingVisitListData.value?.pages || []
  return pages.flatMap((pageData) => {
    return (pageData.data?.items || []).map((item) => ({
      ...item,
      branchName: item?.branch?.name,
      advisorName: `${item?.user?.advisor?.firstName ?? ' '} ${item?.user?.advisor?.name ?? ' '}`,
      bookingCreator: item?.creator?.name || 'ندارد',
      bookingAdvisor: `${item?.advisor?.firstName ?? ' '} ${item?.advisor?.name ?? ' '}`,
      docNumber: item?.visit?.docNumber ?? item?.docNumber,
    }))
  })
})

const bookingVisitSuggestFilters = computed(
  () => bookingVisitListData.value?.pages?.[0]?.data?.suggestFilters || []
)

const { mutate: totalCount, isPending: isTotalCountLoading } = useGetVisitTotalCountMutation()
const { mutate: deleteBooking } = useDeleteBookingMutation()

// Only show loading when there's no cached data
const listLoading = computed(() => {
  const hasData = bookingVisitListItems.value?.length > 0
  return isFetchingNextPage.value || (isLoading.value && !hasData) || isTotalCountLoading.value
})
const onLoadTotalCount = () => {
  totalBookingVisit.value = null
  totalCount(apiFilters, {
    onSuccess: (data) => {
      totalBookingVisit.value = data?.data?.count
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
  totalBookingVisit.value = null
  queryClient.invalidateQueries({ queryKey: ['booking', 'all-booking-visit'] })
  Notif.success('لیست بروزرسانی شد')
}
const onBookingFormSubmit = () => {
  totalBookingVisit.value = null
}
const openBookingFormDialog = (data) => {
  const body = {
    ...data,
    visitType: data.visitType.id,
  }
  bookingFormVisible.value = true
  bookingFormData.value = body
}
const closeBookingFormDialog = () => {
  bookingFormVisible.value = false
  bookingFormData.value = null
}
const openBookingDetailDialog = (data) => {
  bookingDetailData.value = data
  bookingDataVisible.value = true
}
const closeBookingDetailDialog = () => {
  bookingDataVisible.value = false
}
const afterEditCancel = () => {
  updateTable()
  openBookingDetailDialog(bookingDetailData.value)
}
const editUserBooking = (booking) => {
  if (booking.canceledAt) {
    Notif.error('برای ویرایش نوبت مشاورهِ، ابتدا نوبت را فعال کنید')
  } else if (booking.visit) {
    Notif.error('امکان ویرایش برای نوبت مشاوره های دارای مراجعه نمی باشد')
  } else {
    openBookingFormDialog(booking)
  }
}
const deleteUserBooking = (booking) => {
  if (booking.canceledAt) {
    Notif.error('برای حذف نوبت مشاورهِ، ابتدا نوبت را فعال کنید')
  } else
    confirmDialog(
      'حذف نوبت مشاوره',
      'از حذف نوبت مشاوره اطمینان دارید؟',
      () => {
        deleteBooking(booking?.id, {
          onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['booking', 'all-booking-visit'] })
            Notif.success(data?.message)
          },
        })
      },
      {
        ok: {
          label: 'تایید',
          color: 'primary',
          flat: true,
        },
        cancel: {
          label: 'انصراف',
          color: 'negative',
          flat: true,
        },
        persistent: true,
      }
    )
}
const onSelectSuggestFilter = (suggestFilter) => {
  handleSuggestFilter(suggestFilter)
}
const onFilterApply = (filteredValues) => {
  totalBookingVisit.value = null
  applyFilters(filteredValues)
  queryClient.invalidateQueries({ queryKey: ['booking', 'all-booking-visit'] })
}
const onFilterReset = () => {
  pagination.value = { sortBy: null, descending: false }
  totalBookingVisit.value = null
  resetFilters()
  queryClient.invalidateQueries({ queryKey: ['booking', 'all-booking-visit'] })
}

const retryFetch = () => {
  refetch()
}
</script>
<style lang="scss">
.btn-success {
  background: #f0f9eb;
  border: none !important;
  height: 32px;
}

.dropdown-btn-item {
  width: 120px;
}
.no-data {
  width: 100%;
  height: 70dvh;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
.visit-serves {
  max-width: 120px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
</style>
