<template>
  <QCard flat class="q-pa-md">
    <QCardSection class="row q-col-gutter-sm items-center justify-between q-pa-none">
      <div class="col-10 flex q-gutter-xs items-center">
        <QChip square color="white" text-color="black" class="text-h6">منتظر انجام کار</QChip>
        <QBtn fab-mini flat unelevated :loading="isFetching" @click="updateTable">
          <IconRefresh class="text-grey" />
        </QBtn>
        <div class="flex">
          <QChip
            v-for="_f in bookingCoordinateSuggestFilters"
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

      <div class="col-12">
        <FilterBuilder
          :reset-filters="resetFilters"
          :apply-filters="applyFilters"
          :handle-input="handleInput"
          :form-values="formValues"
          :has-active-filters="hasActiveFilters"
          :items="tableFilters"
          :total-count="totalBookingCoordinate"
          total-label="کاربر"
          :is-total-count-loading="loadingList"
          :load-total-count="onLoadTotalCount"
          @apply="onFilterApply"
          @reset="onFilterReset"
        />
      </div>
    </QCardSection>

    <QTable
      v-model:pagination="pagination"
      :sort-method="sortMethod"
      :rows="bookingCoordinateListItems"
      :columns="tableColumns"
      :loading="loadingList"
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

      <template v-if="bookingCoordinateListItems?.length === 0" #no-data>
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

      <template #body-cell-name="scope">
        <QTd :props="scope">
          <UserMenu :user="scope.row" />
        </QTd>
      </template>
      <template #body-cell-status="scope">
        <QTd :props="scope">
          <BookingCoordinateStatusInformation :treatment-plan="scope.row" />
        </QTd>
      </template>
      <template #body-cell-serves="scope">
        <QTd :props="scope">
          <div class="serves-container">
            <QBadge
              v-if="scope.row.activeTreatmentPlanServes[0]"
              class="q-pa-xs"
              color="blue-grey-8"
              outline
            >
              {{ scope.row.activeTreatmentPlanServes[0]?.title }}
              <span v-if="scope.row.activeTreatmentPlanServes.length > 1">و...</span>
            </QBadge>
            <QTooltip
              v-if="scope.row.activeTreatmentPlanServes.length > 1"
              class="bg-grey-3 q-pa-sm"
            >
              <QBadge
                v-for="serve in scope.row.activeTreatmentPlanServes"
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
      <template #body-cell-bookingDate="scope">
        <QTd :props="scope">
          <QChip outline square color="blue-grey-8">
            {{
              scope?.row?.bookingDate
                ? convertToJalaliWithTime(scope?.row?.bookingDate)
                : 'ثبت نشده'
            }}
          </QChip>
        </QTd>
      </template>
      <template #body-cell-confirmedDate="scope">
        <QTd :props="scope">
          <QChip
            :label="
              scope?.row?.treatmentPlanFinancialConfirmationAt
                ? convertToJalaliWithTime(scope?.row?.treatmentPlanFinancialConfirmationAt)
                : 'ثبت نشده'
            "
            outline
            square
            color="blue-grey-8"
          />
        </QTd>
      </template>
      <template #body-cell-actions="scope">
        <QTd :props="scope">
          <div class="flex q-gutter-sm">
            <QBtn
              v-if="getPerms('booking', 'view')"
              round
              size="sm"
              color="info"
              outline
              @click="viewUserBookings(scope.row)"
            >
              <IconEye size="18" />
              <QTooltip>مشاهده نوبت های کاربر</QTooltip>
            </QBtn>
            <QBtn
              v-if="getPerms('booking', 'add')"
              round
              size="sm"
              outline
              color="primary"
              @click="openCoordinatorForm(scope.row)"
            >
              <IconCalendar size="18" />
              <QTooltip>افزودن/ویرایش کارشناس نوبت دهی</QTooltip>
            </QBtn>
            <QBtn
              v-if="getPerms('booking', 'add')"
              round
              size="sm"
              outline
              color="primary"
              @click="openBookingForm({ type: 2, userId: scope.row.id, user: scope.row })"
            >
              <IconUserPlus size="18" />
              <QTooltip>افزودن نوبت انجام کار</QTooltip>
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

  <CoordinatorForm
    :visible="coordinatorModalVisible"
    :edit-value="coordinatorModalData"
    @after-submit="afterSubmit"
    @close="onClose"
  />
  <BookingForm
    v-if="bookingFormVisible"
    :visible="bookingFormVisible"
    :edit-value="bookingFormData"
    @close="closeBookingFormDialog"
    @after-submit="onBookingFormSubmit"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import { Notif } from '@/data/services/notification-service'
import { getPerms } from '@/utils/get-perms'
import UserMenu from '@/components/UserMenu'
import {
  useGetBookingCoordinateInfinityQuery,
  useGetCoordinateTotalCountMutation,
} from '@/modules/Booking/query'
import router from '@/router'
import CoordinatorForm from '@/modules/Booking/components/CoordinatorForm'
import BookingForm from '@/modules/Booking/components/BookingForm'
import { useQueryClient } from '@tanstack/vue-query'
import { handleError } from '@/utils/error-handler'
import { useHandleFilters } from '@/composables/use-handle-filters'
import { useTableSort } from '@/composables/use-table-sort'
import { useRoute } from 'vue-router'
import { IconRefresh, IconEye, IconCalendar, IconUserPlus } from '@tabler/icons-vue'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import FilterBuilder from '@/components/FilterBuilder/FilterBuilder'
import { tableColumns, tableFilters } from '@/modules/Booking/constant/booking-coordinate-list'
import BookingCoordinateStatusInformation from '@/components/BookingCoordinateStatusInformation'
import { getErrorMessage } from '@/utils/get-error-message'
import Typography from '@/base/Typography'
import Button from '@/base/Button'

const route = useRoute()
const queryClient = useQueryClient()

const coordinatorModalVisible = ref(false)
const coordinatorModalData = ref(null)
const bookingFormVisible = ref(false)
const bookingFormData = ref(null)
const totalBookingCoordinate = ref(null)

const defaultFilters = ref({
  sort: '-confirmed_date',
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
} = useHandleFilters(route.query, defaultFilters.value, tableFilters)

const { pagination, sortMethod } = useTableSort(['booking', 'all-booking-coordinate'], setSort)

const {
  data: bookingCoordinateListData,
  isLoading,
  fetchNextPage,
  isFetchingNextPage,
  refetch,
  error,
  isError,
  isFetching,
  hasNextPage,
} = useGetBookingCoordinateInfinityQuery(apiFilters)

const openCoordinatorForm = (data) => {
  coordinatorModalData.value = data
  coordinatorModalVisible.value = true
}

const openBookingForm = (data) => {
  bookingFormData.value = data
  bookingFormVisible.value = true
}
const bookingCoordinateListItems = computed(() => {
  const pages = bookingCoordinateListData.value?.pages || []
  return pages.flatMap((pageData) => {
    return (pageData.data?.items || []).map((item) => ({
      ...item,
      coordinator: item?.userOwner?.name,
      treatmentPlanFinancialConfirmationAt:
        item?.activeTreatmentPlan?.treatmentPlanInfo?.financialConfirmationAt,
    }))
  })
})

const bookingCoordinateSuggestFilters = computed(
  () => bookingCoordinateListData.value?.pages?.[0]?.data?.suggestFilters || []
)

const { mutate: totalCount, isPending: isTotalCountLoading } = useGetCoordinateTotalCountMutation()

const loadingList = computed(
  () => isLoading.value || isFetchingNextPage.value || isTotalCountLoading.value
)

const onLoadTotalCount = () => {
  totalBookingCoordinate.value = null
  isTotalCountLoading.value = true
  totalCount(apiFilters, {
    onSuccess: (data) => {
      totalBookingCoordinate.value = data?.data?.count
      isTotalCountLoading.value = false
    },
    onError: (e) => {
      handleError(e)
      isTotalCountLoading.value = false
    },
  })
}

const loadNextPage = () => {
  if (!hasNextPage.value) return
  fetchNextPage()
}

const onSelectSuggestFilter = (suggestFilter) => {
  handleSuggestFilter(suggestFilter)
}

const onFilterApply = (filteredValues) => {
  totalBookingCoordinate.value = null
  applyFilters(filteredValues)
  queryClient.invalidateQueries({ queryKey: ['booking', 'all-booking-coordinate'] })
}
const onFilterReset = () => {
  pagination.value = { sortBy: null, descending: false }
  totalBookingCoordinate.value = null
  resetFilters()
  queryClient.invalidateQueries({ queryKey: ['booking', 'all-booking-coordinate'] })
}
const updateTable = () => {
  totalBookingCoordinate.value = null
  queryClient.invalidateQueries({ queryKey: ['booking', 'all-booking-coordinate'] })
  Notif.success('لیست بروزرسانی شد')
}

const viewUserBookings = (rowData) => {
  const data = {
    userFullName: rowData?.name,
    'user.mobile': rowData?.mobile,
  }
  const routeData = router.resolve({ path: '/booking', query: data })
  window.open(routeData.href, '_blank')
}

const onClose = () => {
  coordinatorModalVisible.value = false
}

const closeBookingFormDialog = () => {
  bookingFormVisible.value = false
}

const afterSubmit = () => {
  if (coordinatorModalVisible.value) coordinatorModalVisible.value = false
  coordinatorModalData.value = null
  updateTable()
}

const onBookingFormSubmit = () => {
  totalBookingCoordinate.value = null
}
</script>

<style lang="scss">
.no-data {
  width: 100%;
  height: 70dvh;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.serves-container {
  max-width: 120px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
</style>
