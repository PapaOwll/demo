<template>
  <BaseModal
    :model-value="visible"
    :title="
      (data?.type === 2 ? 'جزییات نوبت' : 'جزییات ویزیت') +
      ' - ' +
      (data?.user?.firstName ? data.user.firstName + ' ' + data.user.name : data?.user?.name)
    "
    width="720px"
    @close="closeForm"
  >
    <TabItem v-model="activeName" class="booking-detail__tabs" :group="tabItems" />
    <QTabPanels v-model="activeName">
      <QTabPanel name="booking">
        <QTable
          :rows="bookingRows"
          :columns="detailColumns"
          flat
          bordered
          class="quasar-table booking-detail__table"
          hide-pagination
          :rows-per-page-options="[0]"
          separator="cell"
          row-key="key"
        >
          <template #header>
            <QTr>
              <QTh>#</QTh>
              <QTh>{{ data?.id }}</QTh>
            </QTr>
          </template>
          <template #body-cell-value="scope">
            <QTd :props="scope">
              <template v-if="scope.row.key === 'serves'">
                <div class="booking-detail__serves">
                  <QChip
                    v-for="(serve, index) of data?.serves"
                    :key="index"
                    square
                    color="positive"
                    text-color="white"
                    class="booking-detail__serves-chip"
                    :label="serve?.title"
                  />
                </div>
              </template>
              <template v-else-if="scope.row.key === 'status'">
                <QChip
                  square
                  outline
                  :class="
                    data?.canceledAt
                      ? 'booking-detail__status--inactive'
                      : 'booking-detail__status--active'
                  "
                >
                  <span class="q-mx-auto">{{ data?.canceledAt ? 'غیر فعال' : 'فعال' }}</span>
                </QChip>
                <Button
                  v-if="!data?.visit && getPerms('visit', 'update', false, false)"
                  :is-loading="isPending"
                  :color="data?.canceledAt ? 'green' : 'red'"
                  size="sm"
                  class="q-mr-sm"
                  @click="cancelBooking"
                >
                  <span v-if="data?.type === 2">
                    {{ data?.canceledAt ? 'فعال کردن نوبت' : 'کنسل کردن نوبت' }}
                  </span>
                  <span v-if="data?.type === 1">
                    {{ data?.canceledAt ? 'فعال کردن ویزیت' : 'کنسل کردن ویزیت' }}
                  </span>
                </Button>
              </template>
              <template v-else-if="scope.row.key === 'onlineLink'">
                <div class="booking-detail__link-cell">
                  <a
                    v-if="data?.onlineLink"
                    :href="data?.onlineLink"
                    target="_blank"
                    class="booking-detail__link"
                  >
                    {{ data?.onlineLink }}
                  </a>
                  <QChip v-else square color="info">ثبت نشده</QChip>
                </div>
              </template>
              <template v-else-if="scope.row.key === 'description'">
                <div class="booking-detail__description">
                  {{ data?.description || data?.visit?.description }}
                </div>
              </template>
              <template v-else-if="scope.row.key === 'files'">
                <img
                  v-for="(file, index) of data?.files"
                  :key="index"
                  :src="file?.path"
                  width="40"
                  alt=""
                />
              </template>
              <template v-else>
                {{ scope.row.value }}
              </template>
            </QTd>
          </template>
        </QTable>
      </QTabPanel>
      <QTabPanel name="visit">
        <QTable
          :rows="visitRows"
          :columns="detailColumns"
          flat
          bordered
          class="quasar-table booking-detail__table"
          hide-pagination
          :rows-per-page-options="[0]"
          separator="cell"
          row-key="key"
        >
          <template #header>
            <QTr>
              <QTh>#</QTh>
              <QTh>{{ data?.visit?.id }}</QTh>
            </QTr>
          </template>
          <template #body-cell-value="scope">
            <QTd :props="scope">
              <template v-if="scope.row.key === 'serves'">
                <div class="booking-detail__serves">
                  <QChip
                    v-for="(serve, index) of data?.visit?.serves"
                    :key="index"
                    square
                    color="positive"
                    text-color="white"
                    class="booking-detail__serves-chip"
                    :label="serve?.title"
                  />
                </div>
              </template>
              <template v-else-if="scope.row.key === 'description'">
                <div class="booking-detail__description">{{ data?.visit?.description }}</div>
              </template>
              <template v-else-if="scope.row.key === 'files'">
                <img
                  v-for="(file, index) of data?.visit?.files"
                  :key="index"
                  :src="file?.path"
                  width="40"
                  alt=""
                />
              </template>
              <template v-else>
                {{ scope.row.value }}
              </template>
            </QTd>
          </template>
        </QTable>
      </QTabPanel>
    </QTabPanels>
  </BaseModal>
</template>

<script setup>
import { ref, toRefs, computed } from 'vue'
import { Notif } from '@/data/services/notification-service'
import Button from '@/base/Button'
import BaseModal from '@/base/Modal'
import TabItem from '@/base/TabItem'
import { useCancellationMutation, useBookingQuery } from '@/modules/Booking/query'
import { useQueryClient } from '@tanstack/vue-query'
import { handleError } from '@/utils/error-handler'
import { getPerms } from '@/utils/get-perms'
import { convertToJalaliWithTime, formatDate } from '@/utils/date-utils'

const props = defineProps({
  visible: Boolean,
  bookingData: {
    type: Object,
    default: () => ({}),
  },
})

const emits = defineEmits(['close', 'submit'])

const { visible, bookingData } = toRefs(props)

const activeName = ref('booking')
const queryClient = useQueryClient()

const bookingId = computed(() => bookingData.value?.id || null)
const bookingPlaceholder = computed(() => bookingData.value || undefined)
const { data: fetchedBooking } = useBookingQuery(bookingId, bookingPlaceholder)

const data = computed(() => {
  if (fetchedBooking.value) return { ...bookingData.value, ...fetchedBooking.value }
  return bookingData.value || null
})

const tabItems = computed(() => {
  const items = [{ label: data.value?.type === 2 ? 'نوبت' : 'ویزیت', value: 'booking' }]
  if (data.value?.visit) {
    items.push({ label: 'مراجعه', value: 'visit' })
  }
  return items
})

const detailColumns = [
  { name: 'label', field: 'label', align: 'center' },
  { name: 'value', field: 'value', align: 'center' },
]

const bookingRows = computed(() => {
  const d = data.value
  if (!d) return []
  return [
    {
      key: 'user',
      label: 'نام کاربر',
      value: `${d.user?.firstName || ''} ${d.user?.name || ''}`,
    },
    { key: 'mobile', label: 'شماره موبایل', value: d.mobile ?? d.user?.mobile },
    {
      key: 'bookingAt',
      label: d.type === 2 ? 'زمان نوبت' : 'زمان ویزیت',
      value: d.bookingAt ? convertToJalaliWithTime(d.bookingAt) : '',
    },
    {
      key: 'entity',
      label: 'کلینیک',
      value: `${d.entityName ?? ''}${d.branch?.name ? ` - ${d.branch.name}` : ''}`,
    },
    {
      key: 'type',
      label: 'نوع',
      value: `${d.typeTitle ?? ''} ${d.visitType?.title ?? ''}`,
    },
    { key: 'serves', label: 'خدمات', value: '' },
    { key: 'status', label: 'وضعیت', value: '' },
    {
      key: 'creator',
      label: d.type === 2 ? 'مشاور هنگام ثبت نوبت' : 'مشاور هنگام ثبت ویزیت',
      value: typeof d.creator === 'object' ? d.creator?.name : d.creator,
    },
    {
      key: 'advisor',
      label: 'مشاور',
      value: `${d.advisor?.firstName ?? ' '} ${d.advisor?.name ?? ' '}`,
    },
    ...(d.visitType?.id === 2 ? [{ key: 'onlineLink', label: 'لینک جلسه', value: '' }] : []),
    { key: 'description', label: 'توضیحات', value: '' },
    { key: 'files', label: 'فایل ها', value: '' },
  ]
})

const visitRows = computed(() => {
  const d = data.value
  if (!d?.visit) return []
  return [
    {
      key: 'user',
      label: 'نام کاربر',
      value: `${d.user?.firstName ?? ''} ${d.user?.name ?? ''}`,
    },
    { key: 'mobile', label: 'شماره موبایل', value: d.user?.mobile },
    {
      key: 'advisor',
      label: 'مشاور',
      value: `${d.advisor?.firstName ?? ' '} ${d.advisor?.name ?? ' '}`,
    },
    { key: 'serves', label: 'خدمات', value: '' },
    {
      key: 'entity',
      label: 'کلینیک',
      value: `${d.entityName ?? ''}${d.branch?.name ? ` - ${d.branch.name}` : ''}`,
    },
    { key: 'description', label: 'توضیحات', value: '' },
    { key: 'files', label: 'فایل ها', value: '' },
  ]
})

const closeForm = () => {
  emits('close', false)
  activeName.value = 'booking'
}

const { mutate: bookingCancellation, isPending } = useCancellationMutation()

const cancelBooking = () => {
  const cancelObj = {
    canceled_at: data.value.canceledAt ? null : formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
  }
  bookingCancellation(
    { id: data?.value?.id, ...cancelObj },
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ['booking'] })
        Notif.success(response.message)
      },
      onError: (error) => {
        handleError(error)
      },
    }
  )
}
</script>

<style scoped lang="scss">
.booking-detail {
  &__tabs {
    width: 100%;

    :deep(.q-tab) {
      flex: 1;
    }
  }

  &__table {
    :deep(td) {
      padding: $spacing-sm;
      word-wrap: break-word;

      &:first-child {
        white-space: nowrap;
        font-weight: 500;
      }
    }
  }

  &__description {
    min-height: 60px;
    max-height: 120px;
    word-break: break-word;
    white-space: pre-wrap;
    text-align: right !important;
    overflow-y: auto;
    overflow-x: hidden;
    padding: $spacing-md !important;
    background-color: $grey-1;
    border: 1px solid $grey-4;
    border-radius: $radius-xs;
    font-family: inherit;
    font-size: 0.875rem;
    line-height: 1.5;
    vertical-align: top;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: $grey-1;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: $grey-5;
      border-radius: 3px;

      &:hover {
        background: $grey-6;
      }
    }
  }

  &__link-cell {
    max-width: 200px !important;
  }

  &__link {
    word-break: break-all;
    color: $light-blue-6;
    text-decoration: underline;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__serves {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    align-items: center;
    justify-content: center;
  }

  &__serves-chip {
    margin: 2px;
    font-size: 0.75rem;
    padding: $spacing-xs $spacing-sm;
  }

  &__status--active {
    color: $green-6;
    border-color: $green-6;
  }

  &__status--inactive {
    color: $red-6;
    border-color: $red-6;
  }
}
</style>
