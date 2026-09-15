<template>
  <QCard flat class="q-pa-md">
    <QCardSection class="row q-col-gutter-sm items-center justify-between q-pa-none">
      <div class="col-10 flex q-gutter-xs items-center">
        <QChip square color="white" text-color="black" class="text-h6">نوبت انجام کار</QChip>
        <Button
          variant="flat"
          :is-loading="isFetching"
          :left-icon="IconRefresh"
          is-icon-only
          color="grey"
          @click="updateTable"
        />
        <div class="flex">
          <QChip
            v-for="_f in bookingSuggestFilters"
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
          :total-count="totalBooking"
          total-label="نوبت"
          :is-total-count-loading="isTotalCountLoading"
          :load-total-count="onLoadTotalCount"
          @apply="onFilterApply"
          @reset="onFilterReset"
        />
      </div>
      <div class="col-12 q-mt-sm flex justify-end q-my-md">
        <QBtnDropdown outline color="primary" label="دریافت خروجی">
          <QList>
            <QItem v-close-popup clickable @click="onDailyDoctorReport">
              <QItemSection>شرح درمان روزانه پزشک</QItemSection>
            </QItem>
            <QItem v-close-popup disable clickable @click="onPatientFile">
              <QItemSection>پرونده بیمار</QItemSection>
            </QItem>
          </QList>
        </QBtnDropdown>
      </div>
    </QCardSection>

    <div class="booking-table__container">
      <ResponsiveTable
        v-model:selected="selectedBooking"
        v-model:pagination="pagination"
        :sort-method="sortMethod"
        :rows="bookingListItems"
        :columns="tableColumns"
        :loading="loadingList"
        selection="multiple"
        row-key="id"
        class="quasar-table"
        :rows-per-page-options="[0]"
        :no-data-label="null"
        flat
        virtual-scroll
        is-expandable
        :primary-columns="['bookingStatus', 'bookingAt']"
      >
        <template #loading>
          <QInnerLoading size="40px" color="primary" />
          <div class="no-data">
            <QSpinnerTail color="primary" size="lg" />
          </div>
        </template>
        <template v-if="bookingListItems?.length === 0" #no-data>
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
            <Typography variant="heading" size="h6" color="blue-grey">اطلاعاتی یافت نشد</Typography>
          </div>
        </template>

        <template #header-cell="scope">
          <QTh :props="scope">
            <div
              v-if="!isFixedColumn(scope.col.name)"
              class="draggable-header"
              @mousedown="startDrag($event)"
            >
              {{ scope.col.label }}
            </div>
            <template v-else>{{ scope.col.label }}</template>
          </QTh>
        </template>
        <template #cell-userFullName="{ row }">
          <UserMenu :user="row">
            <template v-if="row?.performedAt" #extra-icons>
              <span class="treatment-description-indicator">
                <IconNotes class="text-blue" />
                <QTooltip>دارای شرح درمان</QTooltip>
              </span>
            </template>
          </UserMenu>
        </template>
        <template #cell-status="{ row }">
          <BookingStatusInformation :booking="row" />
        </template>
        <template #cell-bookingStatus="{ row }">
          <Badge
            variant="light"
            :color="row?.canceledAt ? 'red' : 'green'"
            :label="row?.canceledAt ? 'کنسل شده' : 'فعال'"
          />
        </template>
        <template #cell-serves="{ row }">
          <div v-if="row.serves && row.serves.length > 0" class="serves-container">
            <QBadge class="q-pa-xs" color="blue-grey-8" outline>
              {{ row.serves?.[0]?.title }}
              <span v-if="row.serves?.length > 1">و...</span>
            </QBadge>
            <QTooltip v-if="row.serves?.length > 1" class="bg-grey-3 q-pa-sm">
              <QBadge
                v-for="serve in row.serves || []"
                :key="serve.id"
                :label="serve.title"
                class="q-pa-xs q-mx-sm"
                color="blue-grey-9"
                outline
              />
            </QTooltip>
          </div>
        </template>
        <template #cell-bookingAt="{ row }">
          <Typography variant="body" size="3">
            {{ convertToJalaliWithTime(row?.bookingAt) }}
          </Typography>
        </template>
        <template #cell-actions="{ row }">
          <div class="fixed-column--tp-container">
            <TpDescriptionButton v-if="canAddDescriptionRoles" :data="row" />

            <QBtn v-if="actionButtonRoles" flat color="blue">
              <IconDotsVertical />
              <QMenu auto-close>
                <QList style="min-width: 100px">
                  <QItem
                    v-if="getPerms('booking', 'view')"
                    clickable
                    @click="openBookingDetailDialog(row)"
                  >
                    <QItemSection avatar class="q-pa-none">
                      <IconEye size="18" class="text-grey-6" />
                    </QItemSection>
                    <QItemSection>جزئیات نوبت</QItemSection>
                  </QItem>
                  <QItem
                    v-if="getPerms('booking', 'update')"
                    clickable
                    @click="editUserBooking(row)"
                  >
                    <QItemSection avatar class="q-pa-none">
                      <IconEdit size="18" class="text-primary" />
                    </QItemSection>
                    <QItemSection>ویرایش</QItemSection>
                  </QItem>
                  <QItem
                    v-if="getPerms('booking', 'delete') && !!row.isProposed"
                    clickable
                    :disable="!!row.visit"
                    @click="toggleBookingStatus(row)"
                  >
                    <QItemSection avatar class="q-pa-none">
                      <IconCancel v-if="!row.canceledAt" size="18" class="text-negative" />
                      <IconCircleDashedCheck v-else size="18" class="text-positive" />
                    </QItemSection>
                    <QItemSection>
                      {{ row.canceledAt ? 'فعال کردن نوبت' : 'کنسل کردن نوبت' }}
                    </QItemSection>
                  </QItem>
                  <div v-if="getPerms('booking', 'delete')">
                    <QItem
                      clickable
                      :disable="!!row.hasTreatmentDescription"
                      @click="deleteUserBooking(row)"
                    >
                      <QItemSection avatar class="q-pa-none">
                        <IconTrash size="18" class="text-negative" />
                      </QItemSection>
                      <QItemSection>حذف</QItemSection>
                    </QItem>
                    <QTooltip v-if="row.hasTreatmentDescription">
                      به دلیل ثبت شرح درمان برای این نوبت، امکان حذف آن وجود ندارد.
                    </QTooltip>
                  </div>
                  <QSeparator />
                  <QItem
                    v-if="getPerms('treatment-plan', 'view')"
                    clickable
                    @click="goToTreatmentPlan(row)"
                  >
                    <QItemSection avatar class="q-pa-none">
                      <IconDental size="18" class="text-primary" />
                    </QItemSection>
                    <QItemSection>مشاهده طرح درمان</QItemSection>
                  </QItem>
                </QList>
              </QMenu>
            </QBtn>
          </div>
        </template>

        <template #bottom>
          <div class="full-width flex justify-center items-center">
            <Button
              variant="outline"
              :is-disabled="!hasNextPage"
              :is-loading="isFetchingNextPage"
              @click="loadNextPage"
            >
              {{ hasNextPage ? 'مشاهده موارد بیشتر...' : 'مورد بیشتری وجود ندارد' }}
            </Button>
          </div>
        </template>
      </ResponsiveTable>
    </div>
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
  <DoctorDailyReportDialog :visible="doctorDialogVisibility" @close="closeDoctorDialog" />
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from '@/base/Button'
import Badge from '@/base/Badge'
import Typography from '@/base/Typography'
import UserMenu from '../../../components/UserMenu'
import BookingStatusInformation from '../../../components/BookingStatusInformation'
// import VisitFormButton from '../../../components/VisitFormButton'
import BookingForm from '../components/BookingForm'
import BookingDetail from '../components/BookingDetail'
import { getPerms } from '@/utils/get-perms'
import {
  useBookingInfinityQuery,
  useDeleteBookingMutation,
  useGetVisitTotalCountMutation,
  useCancellationMutation,
} from '@/modules/Booking/query'
import { useQueryClient } from '@tanstack/vue-query'
import { handleError } from '@/utils/error-handler'
import { formatDate, convertToJalaliWithTime } from '@/utils/date-utils'
import { useHandleFilters } from '@/composables/use-handle-filters'
import { useTableSort } from '@/composables/use-table-sort'
import {
  IconRefresh,
  IconEdit,
  IconEye,
  IconTrash,
  IconDotsVertical,
  IconDental,
  IconCancel,
  IconCircleDashedCheck,
  IconNotes,
} from '@tabler/icons-vue'
import FilterBuilder from '@/components/FilterBuilder/FilterBuilder'
import ResponsiveTable from '@/components/TableView/ResponsiveTable'
import { tableFilters, getTableColumns } from '../constant/booking-list'
import TpDescriptionButton from '@/components/TpDescriptionButton'
import { getErrorMessage } from '@/utils/get-error-message'
import { useRoleManager } from '@/composables/use-role-manager'
import { useNavigationStore } from '@/store/navigation'
import DoctorDailyReportDialog from '@/modules/Booking/components/DoctorDailyReportDialog'
import { Notif, confirmDialog } from '@/data/services/notification-service'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const navigationStore = useNavigationStore()

const selectedBooking = ref([])
const tableContainer = ref(null)
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)
const isCancelling = ref(false)
const cancellingId = ref(null)

const { hasAnyRole } = useRoleManager()

const fixedColumns = new Set(['userFullName', 'actions'])
const actionButtonRoles = computed(() => !hasAnyRole(['doctor']))
const canAddDescriptionRoles = computed(() =>
  getPerms('treatment-plan', 'add', true, 'perform-treatment-plan')
)
const isFixedColumn = (colName) => fixedColumns.has(colName)

const bookingFormVisible = ref(false)
const bookingFormData = ref(null)
const bookingDetailData = ref(null)
const totalBooking = ref(null)
const bookingDataVisible = ref(false)
const doctorDialogVisibility = ref(false)

const defaultFilters = ref({
  type: 2,
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

const { pagination, sortMethod } = useTableSort(['booking', 'all-booking'], setSort)

const {
  data: bookingListData,
  isLoading,
  isFetching,
  isError,
  refetch,
  error,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
} = useBookingInfinityQuery(apiFilters)

const bookingListItems = computed(() => {
  const pages = bookingListData.value?.pages || []
  return pages.flatMap((pageData) => {
    return (pageData.data?.items || []).map((item) => ({
      ...item,
      branchName: item?.branch?.name,
      coordinator: item?.userOwner?.name,
    }))
  })
})
const tableColumns = computed(() => getTableColumns())

const bookingSuggestFilters = computed(
  () => bookingListData.value?.pages?.[0]?.data?.suggestFilters || []
)

const { mutate: totalCount, isPending: isTotalCountLoading } = useGetVisitTotalCountMutation()
const { mutate: deleteBooking } = useDeleteBookingMutation()
const { mutate: bookingCancellation } = useCancellationMutation()

const loadingList = computed(() => {
  const hasData = bookingListItems.value?.length > 0
  return isFetchingNextPage.value || (isLoading.value && !hasData)
})

const onLoadTotalCount = () => {
  totalBooking.value = null
  isTotalCountLoading.value = true
  totalCount(apiFilters, {
    onSuccess: (data) => {
      totalBooking.value = data?.data?.count
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

const invalidateQueries = async () => {
  await queryClient.invalidateQueries({ queryKey: ['booking', 'all-booking'] })
}

const onFilterApply = (filteredValues) => {
  selectedBooking.value = []
  totalBooking.value = null
  applyFilters(filteredValues)
  invalidateQueries()
}

const onFilterReset = () => {
  selectedBooking.value = []
  pagination.value = { sortBy: null, descending: false }
  totalBooking.value = null
  resetFilters()
  invalidateQueries()
}

const updateTable = () => {
  totalBooking.value = null
  invalidateQueries()
  Notif.success('لیست بروزرسانی شد', {
    caption: 'لیست به اخرین وضعیت بروز رسانی شد',
  })
}

const onBookingFormSubmit = () => {
  totalBooking.value = null
}

const openBookingFormDialog = (data = {}) => {
  bookingFormData.value = {
    ...data,
    type: 2,
  }
  bookingFormVisible.value = true
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
    Notif.warning('برای ویرایش ، ابتدا نوبت را فعال نمایید')
  } else if (booking.visit) {
    Notif.error('امکان ویرایش برای نوبت های دارای مراجعه نمی باشد')
  } else {
    openBookingFormDialog(booking)
  }
}

const deleteUserBooking = (booking) => {
  if (booking.canceledAt) {
    Notif.warning('برای حذف ، ابتدا نوبت را فعال نمایید')
  } else {
    confirmDialog(
      'حذف نوبت',
      'این مورد حذف شود؟',
      () =>
        deleteBooking(booking?.id, {
          onSuccess: (data) => {
            invalidateQueries()
            Notif.success(data.message)
          },
          onError: (e) => {
            handleError(e)
          },
        }),
      {
        ok: {
          label: 'حذف',
          color: 'negative',
          flat: true,
        },
        persistent: true,
      }
    )
  }
}

const toggleBookingStatus = (booking) => {
  if (booking.visit) {
    Notif.warning('امکان تغییر وضعیت برای نوبت های دارای مراجعه نمی باشد')
    return
  }

  const isCanceling = !booking.canceledAt
  const title = isCanceling ? 'کنسل کردن نوبت' : 'فعال کردن نوبت'
  const message = isCanceling
    ? 'آیا از کنسل کردن این نوبت اطمینان دارید؟'
    : 'آیا از فعال کردن این نوبت اطمینان دارید؟'
  const okLabel = isCanceling ? 'کنسل' : 'فعال'

  confirmDialog(
    title,
    message,
    () => {
      const cancelObj = {
        canceled_at: booking.canceledAt ? null : formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
      }

      cancellingId.value = booking.id
      isCancelling.value = true

      bookingCancellation(
        { id: booking.id, ...cancelObj },
        {
          onSuccess: (response) => {
            invalidateQueries()
            Notif.success(response.message)
          },
          onError: (e) => {
            handleError(e)
          },
          onSettled: () => {
            isCancelling.value = false
            cancellingId.value = null
          },
        }
      )
    },
    {
      ok: {
        label: okLabel,
        color: isCanceling ? 'negative' : 'positive',
        flat: true,
      },
      persistent: true,
    }
  )
}

const goToTreatmentPlan = (booking) => {
  if (!booking.treatmentPlan?.publicLink) return
  window.open(
    `/tp/${booking?.treatmentPlan?.public_hash_key || booking?.treatmentPlan?.publicHashKey}`,
    '_blank'
  )
}

const onDailyDoctorReport = () => {
  doctorDialogVisibility.value = true
}

const closeDoctorDialog = () => {
  doctorDialogVisibility.value = false
}

const onPatientFile = () => {
  const target = selectedBooking.value

  if (target.length !== 1) {
    Notif.warning('لطفاً دقیقاً یک نوبت معتبر را انتخاب کنید')
    return
  }

  const booking = target[0]
  const userId = booking?.user?.id
  const treatmentPlanId = booking?.treatmentPlan?.id
  const bookingId = booking?.id

  if (!userId || !treatmentPlanId || !bookingId) {
    Notif.error('اطلاعات نوبت برای چاپ پرونده ناقص است')
    return
  }

  const stored = navigationStore.setTpDescriptionData(booking)
  if (!stored) {
    Notif.error('ذخیره داده نوبت برای چاپ پرونده انجام نشد')
    return
  }

  router.push({ name: 'patient-file' })
}

const startDrag = (e) => {
  isDragging.value = true
  startX.value = e.pageX - tableContainer.value.offsetLeft
  scrollLeft.value = tableContainer.value.scrollLeft
}

const stopDrag = () => {
  isDragging.value = false
}

const doDrag = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  const x = e.pageX - tableContainer.value.offsetLeft
  const walk = (x - startX.value) * 2
  tableContainer.value.scrollLeft = scrollLeft.value - walk
}

onMounted(() => {
  tableContainer.value = document.querySelector('.booking-table__container .q-table__container')
  if (tableContainer.value) {
    tableContainer.value.addEventListener('mousedown', startDrag)
    tableContainer.value.addEventListener('mouseleave', stopDrag)
    tableContainer.value.addEventListener('mouseup', stopDrag)
    tableContainer.value.addEventListener('mousemove', doDrag)
  }
})

onUnmounted(() => {
  if (tableContainer.value) {
    tableContainer.value.removeEventListener('mousedown', startDrag)
    tableContainer.value.removeEventListener('mouseleave', stopDrag)
    tableContainer.value.removeEventListener('mouseup', stopDrag)
    tableContainer.value.removeEventListener('mousemove', doDrag)
  }
})
</script>

<style lang="scss">
.booking-table__container {
  .q-table__container {
    overflow-x: auto;
    cursor: grab;
    user-select: none;

    &:active {
      cursor: grabbing;
    }
  }

  thead {
    position: sticky;
    top: 0;
    z-index: 2;
    background: $grey-2;

    tr {
      background: $grey-2;
    }

    th {
      position: sticky;
      top: 0;
      background: $grey-2;
      z-index: 2;
    }

    .fixed-header--user {
      right: 0;
      z-index: 3;
    }

    .fixed-header--actions {
      left: 0;
      z-index: 3;
    }
  }

  .draggable-header {
    cursor: grab;
    display: inline-block;

    &:active {
      cursor: grabbing;
    }
  }

  .fixed-column--user {
    position: sticky;
    right: 0;
    z-index: 1;
    background: white;
    border-left: 1px solid $grey-3;
  }

  .fixed-column--tp {
    position: sticky;
    left: 0;
    z-index: 1;
    background: white;
    border-right: 1px solid $grey-3;
    &-container {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: $spacing-sm;
    }
  }

  .fixed-column--visit {
    border-right: 1px solid $grey-3;
  }
}

.treatment-description-indicator {
  display: inline-flex;
  align-items: center;
}
.no-data {
  width: 100%;
  height: 70dvh;
  margin: 0 auto;
  padding: $spacing-2xl;
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
