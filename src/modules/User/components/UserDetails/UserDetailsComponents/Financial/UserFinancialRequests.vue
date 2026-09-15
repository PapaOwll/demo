<template>
  <div>
    <div v-if="isLoading" class="ufr__loading">
      <QInnerLoading :showing="isLoading" class="q-mx-auto q-my-auto">
        <QSpinnerTail color="primary" size="100px" />
      </QInnerLoading>
    </div>

    <div v-else-if="items.length > 0" class="ufr__content">
      <div ref="scrollContainerRef" class="ufr__scroll">
        <template v-for="(item, index) in items" :key="item.id ?? index">
          <div v-if="isFirstInDay(item, index)" class="ufr__day-header">
            <div class="ufr__day-header-line" />
            <span class="ufr__day-header-text">
              {{ getDayLabel(item.createdAt) }}
            </span>
            <div class="ufr__day-header-line" />
          </div>

          <div
            class="ufr__row"
            :class="{
              'ufr__row--pending': getStatusKey(item.status?.slug) === 'pending',
              'ufr__row--approved': getStatusKey(item.status?.slug) === 'approved',
              'ufr__row--rejected': getStatusKey(item.status?.slug) === 'rejected',
              'ufr__row--first-in-day': isFirstInDay(item, index),
              'ufr__row--last-in-day': isLastInDay(item, index),
            }"
          >
            <div class="ufr__row-rail">
              <div v-if="!isFirstInDay(item, index)" class="ufr__row-line ufr__row-line--top" />
              <div class="ufr__row-dot" />
              <div v-if="!isLastInDay(item, index)" class="ufr__row-line ufr__row-line--bottom" />
            </div>

            <QCard class="ufr__row-card" flat>
              <QCardSection class="ufr__row-card-section">
                <div class="ufr__row-top">
                  <div
                    class="ufr__row-icon"
                    :class="`ufr__row-icon--${getStatusKey(item.status?.slug)}`"
                  >
                    <IconCashBanknoteMove
                      size="22px"
                      :class="{
                        'text-orange-7': getStatusKey(item.status?.slug) === 'pending',
                        'text-green-7': getStatusKey(item.status?.slug) === 'approved',
                        'text-red-7': getStatusKey(item.status?.slug) === 'rejected',
                      }"
                    />
                  </div>

                  <div class="ufr__row-info">
                    <span class="ufr__row-title">{{ formatAmount(item.amount) }} تومان</span>
                    <span class="ufr__row-meta-inline">
                      {{ convertToJalali(item.createdAt, 'jYYYYY/jMM/jDD HH:mm') }}
                      <span class="ufr__sep">-</span>
                      {{ getTypeLabel(item) }}
                      <span class="ufr__sep">-</span>
                      {{ getReferenceLabel(item.referenceType) }}
                    </span>
                  </div>

                  <div class="ufr__row-actions-top">
                    <Button
                      v-if="item.description"
                      :is-icon-only="true"
                      :left-icon="isDescriptionExpanded(item) ? IconEye : IconEyeClosed"
                      variant="flat"
                      color="grey"
                      size="sm"
                      :class="{ 'ufr__view-description--active': isDescriptionExpanded(item) }"
                      :aria-label="isDescriptionExpanded(item) ? 'بستن توضیحات' : 'مشاهده توضیحات'"
                      class="ufr__view-description"
                      @click="toggleDescription(item)"
                    >
                      <QTooltip anchor="top middle" self="bottom middle">
                        {{ isDescriptionExpanded(item) ? 'بستن توضیحات' : 'مشاهده توضیحات' }}
                      </QTooltip>
                    </Button>
                    <span
                      class="ufr__badge-refund"
                      :class="`ufr__badge-refund--${getStatusKey(item.status.slug)}`"
                    >
                      {{ getStatusLabel(item.status.slug) }}
                    </span>
                  </div>
                </div>

                <QSeparator class="ufr__row-separator" />

                <div class="ufr__row-bottom">
                  <template v-if="!isChequeRefund(item)">
                    <div class="ufr__row-sheba">
                      <span class="ufr__row-sheba-label">شماره شبا</span>
                      <span class="ufr__row-sheba-value">
                        <span class="ufr__row-sheba-badge">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                          >
                            <path
                              d="M3.75 8.75V0.75H6.75C7.28043 0.75 7.78914 0.960714 8.16421 1.33579C8.53929 1.71086 8.75 2.21957 8.75 2.75V3.75C8.75 4.28043 8.53929 4.78914 8.16421 5.16421C7.78914 5.53929 7.28043 5.75 6.75 5.75M6.75 5.75H5.25H3.75M6.75 5.75L8.75 8.75R0.75 0.75V8.75"
                              stroke="#424242"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </span>
                        {{ item.sheba ?? '-- ---- ---- ---- ---- --' }}
                      </span>
                    </div>
                  </template>

                  <div v-else class="ufr__row-cheque">
                    <div class="ufr__row-cheque-item">
                      <span class="ufr__row-sheba-label">شناسه صیادی</span>
                      <span class="ufr__row-cheque-value">{{ getChequeSayadi(item) }}</span>
                    </div>
                    <span class="ufr__row-cheque-sep" />
                    <div class="ufr__row-cheque-item">
                      <span class="ufr__row-sheba-label">تاریخ سررسید</span>
                      <span class="ufr__row-cheque-value">{{ getChequeDueDate(item) }}</span>
                    </div>
                    <span class="ufr__row-cheque-sep" />
                    <div class="ufr__row-cheque-item">
                      <span class="ufr__row-sheba-label">بانک صادرکننده</span>
                      <span class="ufr__row-cheque-value">{{ getChequeBankTitle(item) }}</span>
                    </div>
                  </div>

                  <Button
                    v-if="canReviewRefund && getStatusKey(item.status.slug) === 'pending'"
                    variant="flat"
                    class="ufr__review-link"
                    :left-icon="IconArrowNarrowLeft"
                    size="15px"
                    text="بررسی عودت"
                    @click="handleView(item)"
                  />
                </div>

                <div
                  v-if="item.description && isDescriptionExpanded(item)"
                  class="ufr__row-description"
                >
                  <span class="ufr__row-description-label">توضیحات</span>
                  <p class="ufr__row-description-text">{{ item.description }}</p>
                </div>
              </QCardSection>
            </QCard>
          </div>
        </template>

        <div ref="sentinelRef" class="ufr__sentinel" />
        <div v-if="isFetchingNextPage" class="ufr__loading-more">
          <QSpinnerDots color="primary" size="lg" />
        </div>
      </div>
    </div>

    <QCard v-else class="ufr__no-data">
      <QImg :src="TransactionNoData" alt="TransactionNoData" width="188px" />
      <QCardSection class="ufr__no-data-content">
        <p>هنوز درخواستی ثبت نشده!</p>
        <p>درخواست‌های مالی بعد از ثبت اینجا قابل مشاهده‌ست.</p>
      </QCardSection>
    </QCard>

    <component
      :is="activeReviewModal"
      :key="reviewModalKey"
      v-model="reviewDialog.show"
      v-bind="activeReviewModalProps"
      :loading="reviewLoading"
      @submit="handleStatusSubmit"
      @close="reviewDialog.show = false"
    />
  </div>
</template>

<script setup>
import { computed, onUnmounted, reactive, ref, watch, nextTick } from 'vue'
import TransactionNoData from '@/assets/images/transactionNoData.svg'
import {
  useGetRefundRequestsQuery,
  useApproveRefundRequestMutation,
  useRejectRefundRequestMutation,
  useGetBatchEnumsQuery,
} from '@/modules/User/query'
import { convertToJalali } from '@/utils/date-utils'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import {
  mockGetRefundRequests,
  mockRefundEnums,
  mockApproveRefundRequest,
  mockRejectRefundRequest,
} from '@/mocks/user-details/financial'
import { useQueryClient } from '@tanstack/vue-query'
import { Notif } from '@/data/services/notification-service'
import Button from '@/base/Button'
import RefundStatusModal from './RefundStatusModal'
import CheckRefundStatusModal from './CheckRefundStatusModal'
import {
  IconArrowNarrowLeft,
  IconCashBanknoteMove,
  IconEye,
  IconEyeClosed,
} from '@tabler/icons-vue'
import { getPerms } from '@/utils/get-perms'
import { useRoleManager } from '@/composables/use-role-manager'

const queryClient = useQueryClient()
const reviewDialog = reactive({ show: false, item: null })

const expandedDescriptionIds = ref(new Set())

const isDescriptionExpanded = (item) => {
  return expandedDescriptionIds.value.has(item?.id)
}

const toggleDescription = (item) => {
  if (!item?.id) return
  const next = new Set(expandedDescriptionIds.value)
  if (next.has(item.id)) {
    next.delete(item.id)
  } else {
    next.add(item.id)
  }
  expandedDescriptionIds.value = next
}

const { hasAnyRole } = useRoleManager()

const canReviewRefund = computed(
  () =>
    hasAnyRole(['superAdmin', 'financialManager']) ||
    getPerms('treatment-plan', 'update', true, 'treatmentPlanFinancial')
)

const props = defineProps({
  userInfo: {
    type: Object,
    required: false,
    default: () => ({}),
  },
})

const userId = computed(() => props.userInfo?.id)

const {
  data: refundData,
  isLoading,
  isFetchingNextPage,
  fetchNextPage,
  hasNextPage,
} = useGetRefundRequestsQuery(userId, {
  ...(ENABLE_USER_DETAIL_MOCKS
    ? { queryFn: ({ pageParam }) => mockGetRefundRequests(userId.value, pageParam) }
    : {}),
})

const state = reactive({ items: [] })

watch(
  () => refundData.value,
  (val) => {
    if (!val?.pages) return
    state.items = val.pages.flatMap((p) => {
      const data = p?.data
      return data?.items?.data ?? data?.items ?? data ?? []
    })
  },
  { immediate: true }
)

const items = computed(() => state.items)

const scrollContainerRef = ref(null)
const sentinelRef = ref(null)
let observer = null

const setupObserver = () => {
  if (observer) observer.disconnect()
  if (!sentinelRef.value || !scrollContainerRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage?.value && !isFetchingNextPage?.value) {
        fetchNextPage()
      }
    },
    { root: scrollContainerRef.value, rootMargin: '0px 0px 120px 0px' }
  )
  observer.observe(sentinelRef.value)
}

watch(items, () => nextTick(setupObserver))

onUnmounted(() => {
  if (observer) observer.disconnect()
})

const { data: refundEnums } = useGetBatchEnumsQuery(
  'RefundRequestTypeEnum,RefundReferenceTypeEnum,RefundRequestStatusEnum',
  {
    ...(ENABLE_USER_DETAIL_MOCKS
      ? {
          queryFn: () => ({
            data: {
              RefundRequestTypeEnum: Object.values(mockRefundEnums.RefundRequestTypeEnum),
              RefundReferenceTypeEnum: Object.values(mockRefundEnums.RefundReferenceTypeEnum),
              RefundRequestStatusEnum: Object.values(mockRefundEnums.RefundRequestStatusEnum),
            },
          }),
        }
      : {}),
  }
)

const refundReferenceTypes = computed(() => refundEnums.value?.RefundReferenceTypeEnum || [])
const refundStatuses = computed(() => refundEnums.value?.RefundRequestStatusEnum || [])

const isChequeRefund = (item) => {
  return item?.type?.slug === 'cheque'
}

const getChequeRef = (item) => item?.reference || {}

const getChequeBankTitle = (item) => {
  const { bank } = getChequeRef(item)
  if (!bank) return '---'
  if (typeof bank === 'string') return bank
  return bank?.title || bank?.name || '---'
}

const getChequeSayadi = (item) => {
  const chequeRef = getChequeRef(item)
  return chequeRef.sayad_number || chequeRef.sayadNumber || chequeRef.sayyadi || '---'
}

const getChequeDueDate = (item) => {
  const chequeRef = getChequeRef(item)
  const date = chequeRef.due_date || chequeRef.dueDate
  if (!date) return '---'
  return convertToJalali(date, 'jYYYY/jMM/jDD') || '---'
}

const getTypeLabel = (item) => {
  return `عودت ${item?.type?.title}`
}

const getReferenceLabel = (referenceType) => {
  if (!refundReferenceTypes.value || !referenceType) return 'سفارشی'
  return referenceType?.title
}

const formatAmount = (val) => {
  if (!val) return '-'
  return Number(val).toLocaleString('fa-IR')
}

const getStatusKey = (status) => {
  const id = status?.id ?? status
  if (refundStatuses.value) {
    const found = refundStatuses.value.find?.((s) => s.id === id || s.value === id)
    const slug = found?.slug || found?.value || ''
    if (slug === 'approved' || slug === 'refunded') return 'approved'
    if (slug === 'rejected' || slug === 'canceled') return 'rejected'
  }
  if (id === 1 || id === 'approved' || id === 'refunded') return 'approved'
  if (id === 2 || id === 'rejected' || id === 'canceled') return 'rejected'
  return 'pending'
}

const getStatusLabel = (status) => {
  const key = getStatusKey(status)
  const labels = {
    pending: 'درخواست عودت',
    approved: 'تایید شده',
    rejected: 'رد شده',
  }
  return labels[key] || 'درخواست عودت'
}

const getDayKey = (dateStr) => {
  if (!dateStr) return ''
  return convertToJalali(dateStr, 'jYYYY/jMM/jDD')
}

const isFirstInDay = (item, index) => {
  if (index === 0) return true
  return getDayKey(items.value[index - 1].createdAt) !== getDayKey(item.createdAt)
}

const isLastInDay = (item, index) => {
  if (index === items.value.length - 1) return true
  return getDayKey(items.value[index + 1].createdAt) !== getDayKey(item.createdAt)
}

const getDayLabel = (dateStr) => {
  if (!dateStr) return ''
  return convertToJalali(dateStr, 'jYYYY/jMM/jDD')
}

const handleView = (item) => {
  reviewDialog.item = item
  reviewDialog.show = true
}

const isCashRefund = (item) => {
  const slug = item?.type?.slug
  return slug !== 'check' && slug !== 'cheque'
}

const activeReviewModal = computed(() => {
  if (!reviewDialog.item) return null
  return isCashRefund(reviewDialog.item) ? RefundStatusModal : CheckRefundStatusModal
})

const reviewModalKey = computed(() => {
  const { item } = reviewDialog
  if (!item) return 'empty'
  return `${item.id}-${isCashRefund(item)}`
})

const activeReviewModalProps = computed(() => {
  const { item } = reviewDialog
  if (!item) return {}

  if (isCashRefund(item)) {
    return {
      sheba: item.sheba ?? '',
      returnType: getTypeLabel(item),
      amount: item.amount ?? 0,
    }
  }

  const chequeRef = getChequeRef(item)

  return {
    amount: item.amount ?? chequeRef.amount ?? 0,
    bank: chequeRef.bank ?? '',
    sayyadi: chequeRef.sayad_number ?? chequeRef.sayadNumber ?? '',
    checkNumber: chequeRef.cheque_number ?? chequeRef.checkNumber ?? '',
    dueDate: chequeRef.due_date ? convertToJalali(chequeRef.due_date, 'jYYYY/jMM/jDD') : '',
  }
})

const refreshList = () => {
  queryClient.invalidateQueries({ queryKey: ['refund-requests', userId.value] })
}

const approveMutation = useApproveRefundRequestMutation({
  ...(ENABLE_USER_DETAIL_MOCKS ? { mutationFn: mockApproveRefundRequest } : {}),
  onSuccess: () => {
    Notif.success('درخواست با موفقیت تایید شد')
    reviewDialog.show = false
    refreshList()
  },
  onError: (error) => {
    Notif.error(error?.response?.data?.message || 'خطا در تایید درخواست')
  },
})

const rejectMutation = useRejectRefundRequestMutation({
  ...(ENABLE_USER_DETAIL_MOCKS ? { mutationFn: mockRejectRefundRequest } : {}),
  onSuccess: () => {
    Notif.success('درخواست با موفقیت رد شد')
    reviewDialog.show = false
    refreshList()
  },
  onError: (error) => {
    Notif.error(error?.response?.data?.message || 'خطا در رد درخواست')
  },
})

const reviewLoading = computed(
  () => approveMutation.isPending.value || rejectMutation.isPending.value
)

const handleStatusSubmit = ({ status, description, fileIds }) => {
  if (!reviewDialog.item) return
  const payload = {
    id: reviewDialog.item.id,
    description: description || undefined,
  }

  if (status === 'approved' || status === 'refunded') {
    approveMutation.mutate({ ...payload, file_ids: fileIds ?? null })
  } else if (status === 'rejected' || status === 'canceled') {
    rejectMutation.mutate({ ...payload })
  }
}
</script>

<style lang="scss" scoped>
.ufr {
  &__loading {
    height: 500px;
    width: 100%;
  }

  &__content {
    height: 100%;
  }

  &__scroll {
    padding: 0 4px 120px 0;
    height: 68vh;
    overflow: auto;
  }

  &__day-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
  }

  &__day-header-line {
    flex: 1;
    height: 1px;
    background: $grey-3;
  }

  &__day-header-text {
    font-size: 12px;
    font-weight: 600;
    color: $grey-8;
    padding: 3px 0;
    border-radius: 100px;
  }

  &__row {
    display: flex;
    align-items: stretch;
    position: relative;
  }

  &__row-rail {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 28px;
    flex-shrink: 0;
    padding-top: 18px;
  }

  &__row-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: $grey-4;
    border: 2.5px solid $white;
    box-shadow: 0 0 0 1.5px $grey-4;
    flex-shrink: 0;
    z-index: 1;
    transition: all 0.2s ease;

    .ufr__row--pending & {
      background-color: $orange-6;
      box-shadow:
        0 0 0 1.5px $orange-6,
        0 2px 6px rgba($orange-6, 0.3);
    }
    .ufr__row--approved & {
      background-color: $green-6;
      box-shadow:
        0 0 0 1.5px $green-6,
        0 2px 6px rgba($green-6, 0.3);
    }
    .ufr__row--rejected & {
      background-color: $red-6;
      box-shadow:
        0 0 0 1.5px $red-6,
        0 2px 6px rgba($red-6, 0.3);
    }
  }

  &__row-line {
    width: 1.5px;
    background: $grey-3;
    flex: 0 0 auto;

    &--top {
      flex: 1;
    }
    &--bottom {
      flex: 1;
      margin-top: 4px;
    }
  }

  &__row-card {
    flex: 1;
    min-width: 0;
    margin: 8px 0;
    margin-right: 4px;
    border-radius: $radius-sm;
    background-color: $white;
    border: 1px solid $grey-3;
    transition: all 0.2s ease;

    &:hover {
      border-color: $grey-4;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .ufr__row--pending & {
      border-right: 3px solid $orange-6;
    }
    .ufr__row--approved & {
      border-right: 3px solid $green-6;
    }
    .ufr__row--rejected & {
      border-right: 3px solid $red-6;
    }
  }

  &__row-card-section {
    padding: 14px 16px !important;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__row-top {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__row-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--pending {
      background: #fff3e0;
    }

    &--approved {
      background: #e8f5e9;
    }

    &--rejected {
      background: #ffebee;
    }
  }

  &__row-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  &__row-title {
    font-size: 15px;
    font-weight: 700;
    color: $grey-10;
    line-height: 1.3;
    direction: rtl;
  }

  &__row-meta-inline {
    font-size: 12px;
    color: $grey-6;
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
    direction: rtl;
  }

  &__sep {
    color: $grey-4;
  }

  &__row-actions-top {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    margin-right: auto;
  }

  &__badge-refund {
    display: inline-flex;
    align-items: center;
    font-size: 12px;
    font-weight: 500;
    border-radius: 100px;
    padding: 3px 10px;
    white-space: nowrap;
    line-height: 1.5;

    &--pending {
      color: $orange-8;
      background: rgba($orange-6, 0.1);
      border: 1px solid rgba($orange-6, 0.35);
    }

    &--approved {
      color: $green-8;
      background: rgba($green-6, 0.1);
      border: 1px solid rgba($green-6, 0.35);
    }

    &--rejected {
      color: $red-8;
      background: rgba($red-6, 0.1);
      border: 1px solid rgba($red-6, 0.35);
    }
  }

  &__row-separator {
    opacity: 0.5;
  }

  &__row-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  &__row-sheba {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__row-sheba-label {
    font-size: 11px;
    color: $grey-5;
    text-align: right;
  }

  &__row-sheba-value {
    font-size: 13px;
    font-weight: 600;
    color: $grey-8;
    direction: ltr;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: $spacing-xxs;
  }

  &__row-sheba-badge {
    width: 24px !important;
    height: 24px !important;
    border: 1px solid #eeeeee;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__row-cheque {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  &__row-cheque-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__row-cheque-value {
    font-size: 13px;
    font-weight: 600;
    color: $grey-8;
  }

  &__row-cheque-sep {
    width: 1px;
    height: 28px;
    background: $grey-3;
  }

  &__view-description {
    &--active {
      color: $blue-7 !important;
      background-color: rgba($blue-6, 0.12);
    }
  }

  &__row-description {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: $grey-1;
    border-radius: $radius-sm;
    padding: 10px 12px;
  }

  &__row-description-label {
    font-size: 11px;
    color: $grey-5;
  }

  &__row-description-text {
    margin: 0;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.7;
    color: $grey-8;
    white-space: pre-wrap;
    word-break: break-word;
    direction: rtl;
    text-align: right;
  }

  &__review-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: $blue-7;
    font-family: inherit;
    padding: 0;
    transition: color 0.15s;

    &:hover {
      color: $blue-9;
    }
  }

  &__sentinel {
    height: 1px;
    width: 100%;
  }

  &__loading-more {
    display: flex;
    justify-content: center;
    padding: 16px 0 120px 0;
  }

  &__no-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 500px;
    box-shadow: none;
  }

  &__no-data-content {
    text-align: center;

    p:first-of-type {
      font-weight: 700;
      font-size: 16px;
      margin-bottom: 4px;
    }
    p:last-of-type {
      color: $grey-6;
      margin-bottom: 16px;
    }
  }
}
</style>
