<template>
  <div>
    <div v-if="isLoading" class="ufa__loading">
      <QInnerLoading :showing="isLoading" class="q-mx-auto q-my-auto">
        <QSpinnerTail color="primary" size="100px" />
      </QInnerLoading>
    </div>

    <div v-else-if="accountingItems.length > 0" class="ufa__content">
      <QInfiniteScroll
        class="ufa__scroll"
        scroll-target=".ufa__content"
        :offset="120"
        @load="handleLoadMore"
      >
        <template v-for="(item, index) in accountingItems" :key="item.autoid">
          <div v-if="isFirstInDay(item, index)" class="ufa__day-header">
            <div class="ufa__day-header-line" />
            <span class="ufa__day-header-text">
              {{ getDayLabel(item.eventAt) }}
            </span>
            <div class="ufa__day-header-line" />
          </div>

          <div
            class="ufa__row"
            :class="{
              'ufa__row--in': Number(item.inAmount) > 0 && item.type === 'payment',
              'ufa__row--out': Number(item.outAmount) > 0 && item.type === 'payment',
              'ufa__row--service': Number(item.outAmount) > 0 && item.type === 'service',

              'ufa__row--first-in-day': isFirstInDay(item, index),
              'ufa__row--last-in-day': isLastInDay(item, index),
            }"
          >
            <div class="ufa__row-rail">
              <div v-if="!isFirstInDay(item, index)" class="ufa__row-line ufa__row-line--top" />
              <div class="ufa__row-dot" />
              <div v-if="!isLastInDay(item, index)" class="ufa__row-line ufa__row-line--bottom" />
            </div>

            <QCard class="ufa__row-card" flat>
              <QCardSection class="ufa__row-card-section">
                <div class="ufa__row-top">
                  <div class="ufa__row-top-right">
                    <span class="ufa__row-title">
                      {{ item.enumeration_slug === 'beta' ? 'بتا' : item.mtGroupNameFa }}
                    </span>
                    <span class="ufa__row-time">
                      {{ convertToJalali(item.eventAt, 'HH:mm') }}
                    </span>
                  </div>
                  <div class="ufa__row-amounts">
                    <QBtn
                      v-if="
                        item.enumerationSlug === 'cheque' &&
                        Number(item.inAmount) > 0 &&
                        canDeleteCheque
                      "
                      flat
                      round
                      dense
                      color="negative"
                      size="sm"
                      class="ufa__delete-btn"
                      @click.stop="showDeleteDialog(item)"
                    >
                      <IconTrash :size="16" />
                    </QBtn>
                    <Typography
                      v-if="Number(item.inAmount) > 0"
                      variant="body"
                      size="4"
                      weight="semibold"
                      class="ufa__row-amount ufa__row-amount--in"
                    >
                      {{ generatePriceFormat(item.inAmount, '+') }}
                    </Typography>
                    <span
                      v-if="Number(item.outAmount) > 0"
                      class="ufa__row-amount"
                      :class="{
                        'ufa__row-amount--out':
                          Number(item.outAmount) > 0 && item.type === 'payment',
                        'ufa__row-amount--service':
                          Number(item.outAmount) > 0 && item.type === 'service',
                      }"
                    >
                      {{ generatePriceFormat(item.outAmount, '-') }}
                    </span>
                  </div>
                </div>

                <QSeparator class="ufa__row-separator" />

                <div v-if="item.description" class="ufa__row-description">
                  {{ item.description }}
                </div>

                <div class="ufa__row-bottom">
                  <div class="ufa__row-balance">
                    <span class="ufa__row-balance-label">مانده:</span>
                    <span class="ufa__row-balance-value">
                      {{ generatePriceFormat(item.userBalanceCum) }}
                    </span>
                    <span class="ufa__row-balance-unit">تومان</span>
                  </div>
                  <div class="ufa__row-badges">
                    <QBadge
                      v-if="item.userBalanceTypeCum"
                      outline
                      rounded
                      :color="getBalanceTypeColor(item.userBalanceTypeCum)"
                      :label="getBalanceTypeLabel(item.userBalanceTypeCum)"
                      class="ufa__badge"
                    />
                  </div>
                </div>
              </QCardSection>
            </QCard>
          </div>
        </template>

        <template #loading>
          <div v-if="isFetchingNextPage" class="ufa__loading-more">
            <QSpinnerDots color="primary" size="lg" />
          </div>
        </template>
      </QInfiniteScroll>
    </div>

    <QCard v-else class="ufa__no-data">
      <QImg :src="TransactionNoData" alt="TransactionNoData" width="188px" />
      <QCardSection class="ufa__no-data-content">
        <p>هنوز تراکنشی اتفاق نیفتاده!</p>
        <p>کیف پول بیمار بعد از اولین تراکنش اینجا قابل مشاهده‌ست.</p>
        <div class="row q-gutter-sm">
          <QBtn fab-mini flat unelevated :loading="isLoading" @click="refreshAccounting">
            <IconRefresh class="text-grey" />
          </QBtn>
          <QBtn
            color="primary"
            label="ایجاد تراکنش جدید"
            unelevated
            @click="showPaymentDialog = true"
          />
        </div>
      </QCardSection>
    </QCard>
    <UserPaymentDialog
      v-model="showPaymentDialog"
      :user-id="userInfo?.id"
      @submit="refreshAccounting"
    />

    <BaseModal
      v-model="deleteDialog.show"
      title="حذف تراکنش"
      :loading="deleteMutation.isPending.value"
      width="32rem"
      @close="deleteDialog.show = false"
    >
      <Typography variant="body" size="3" color="dark">آیا از حذف این چک مطمئن هستید؟</Typography>
      <template #footer>
        <Button variant="flat" color="grey" text="انصراف" @click="deleteDialog.show = false" />
        <Button variant="filled" color="red" text=" حذف" @click="confirmDelete" />
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { IconRefresh, IconTrash } from '@tabler/icons-vue'
import TransactionNoData from '@/assets/images/transactionNoData.svg'
import { useGetUserAccountingQuery, useDeleteAccountingItemMutation } from '@/modules/User/query'
import { convertToJalali } from '@/utils/date-utils'
import { computed, reactive, ref, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { Notif } from '@/data/services/notification-service'
import UserPaymentDialog from './UserPaymentDialog'
import { generatePriceFormat } from '@/utils/formatter'
import Typography from '@/base/Typography'
import BaseModal from '@/base/Modal'
import Button from '@/base/Button'
import { getPerms } from '@/utils/get-perms'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import { mockGetUserAccounting, mockDeleteAccountingItem } from '@/mocks/user-details/financial'

const queryClient = useQueryClient()
const showPaymentDialog = ref(false)
const deleteDialog = reactive({ show: false, item: null })

const canDeleteCheque = getPerms('treatment-plan', 'delete', true, 'treatmentPlanFinancial')

const props = defineProps({
  userInfo: {
    type: Object,
    required: false,
    default: () => ({}),
  },
})

const state = reactive({
  items: [],
  filters: { 'filter[user_id]': props.userInfo?.id },
})

const {
  data: accountingData,
  isFetchingNextPage,
  fetchNextPage,
  hasNextPage,
  isLoading,
} = useGetUserAccountingQuery(state.filters, {
  staleTime: 0,
  gcTime: 0,
  refetchOnMount: 'always',
  ...(ENABLE_USER_DETAIL_MOCKS
    ? { queryFn: ({ pageParam }) => mockGetUserAccounting(props.userInfo?.id, pageParam) }
    : {}),
})

const accountingItems = computed(() => state.items)

watch(
  () => accountingData.value,
  (val) => {
    if (!val?.pages) return
    state.items = val.pages.flatMap((p) => p?.data?.items?.data || [])
  },
  { immediate: true }
)

const handleLoadMore = async (index, done) => {
  if (!hasNextPage?.value || isFetchingNextPage?.value) {
    done(false)
    return
  }
  await fetchNextPage()
  done()
}

const refreshAccounting = () => {
  queryClient.resetQueries({ queryKey: ['user', 'accounting'] })
  queryClient.invalidateQueries({
    queryKey: ['user', props.userInfo?.id, 'financial-summary'],
  })
}

const deleteMutation = useDeleteAccountingItemMutation({
  ...(ENABLE_USER_DETAIL_MOCKS ? { mutationFn: mockDeleteAccountingItem } : {}),
  onSuccess: () => {
    deleteDialog.show = false
    queryClient.resetQueries({ queryKey: ['user', 'accounting'] })
    Notif.success('تراکنش با موفقیت حذف شد')
  },
})

const showDeleteDialog = (item) => {
  deleteDialog.item = item
  deleteDialog.show = true
}

const confirmDelete = () => {
  if (!deleteDialog.item) return
  deleteMutation.mutate(deleteDialog.item.autoid)
}

const getBalanceTypeLabel = (type) => {
  const map = { credit: 'بستانکار', debit: 'بدهکار', settled: 'تسویه' }
  return map[type] || ''
}

const getBalanceTypeColor = (type) => {
  const map = { credit: 'positive', debit: 'negative', settled: 'grey' }
  return map[type] || 'grey'
}

const getDayKey = (dateStr) => {
  if (!dateStr) return ''
  return convertToJalali(dateStr, 'jYYYY/jMM/jDD')
}

const isFirstInDay = (item, index) => {
  if (index === 0) return true
  return getDayKey(accountingItems.value[index - 1].eventAt) !== getDayKey(item.eventAt)
}

const isLastInDay = (item, index) => {
  if (index === accountingItems.value.length - 1) return true
  return getDayKey(accountingItems.value[index + 1].eventAt) !== getDayKey(item.eventAt)
}

const getDayLabel = (dateStr) => {
  if (!dateStr) return ''
  return convertToJalali(dateStr, 'jdddd jYYYY/jMM/jDD')
}
</script>

<style lang="scss" scoped>
.ufa {
  &__loading {
    height: 500px;
    width: 100%;
  }

  &__content {
    height: 60vh;
    overflow: auto;
  }

  &__scroll {
    padding: 0 4px 120px 0;
    height: 100%;
  }

  &__loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px 0;
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
    background: transparent;
    border-radius: 100px;
  }

  &__row {
    display: flex;
    align-items: stretch;
    gap: 0;
    position: relative;

    &--first-in-day {
      padding-top: 0;
    }
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

    .ufa__row--in & {
      background-color: $green-6;
      box-shadow:
        0 0 0 1.5px $green-6,
        0 2px 6px rgba($green-6, 0.3);
    }

    .ufa__row--out & {
      background-color: $red-6;
      box-shadow:
        0 0 0 1.5px $red-6,
        0 2px 6px rgba($red-6, 0.3);
    }

    .ufa__row--service & {
      background-color: $orange-6;
      box-shadow:
        0 0 0 1.5px $orange-6,
        0 2px 6px rgba($orange-6, 0.3);
    }

    .ufa__row--prepaid & {
      background-color: $light-blue-6;
      box-shadow:
        0 0 0 1.5px $light-blue-6,
        0 2px 6px rgba($light-blue-6, 0.3);
    }
  }

  &__row-line {
    width: 1.5px;
    background: $grey-3;
    flex: 0 0 auto;

    &--top {
      flex: 1;
      margin-bottom: 0;
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

    .ufa__row--prepaid & {
      border-right: 3px solid $light-blue-6;
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
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  &__row-top-right {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__row-title {
    font-size: 14px;
    font-weight: 600;
    color: $grey-10;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
  }

  &__row-time {
    font-size: 12px;
    color: $grey-6;
    direction: ltr;
    text-align: right;
  }

  &__row-amounts {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    flex-shrink: 0;
  }

  &__row-amount {
    font-size: 15px;
    font-weight: 700;
    white-space: nowrap;
    letter-spacing: -0.2px;
    direction: rtl;
    padding: 2px 8px;
    border-radius: 6px;

    &--in {
      color: $green-9;
      background-color: $green-1;
    }

    &--out {
      color: $red-9;
      background-color: $red-1;
    }

    &--service {
      color: $orange-9;
      background-color: $orange-1;
    }
  }

  &__row-separator {
    opacity: 0.5;
  }

  &__row-description {
    font-size: 13px;
    font-weight: 400;
    color: $grey-7;
    line-height: 1.6;
    padding: 8px 10px;
    background: $grey-1;
    border-radius: $radius-sm;
    word-break: break-word;
    white-space: pre-wrap;
    direction: rtl;
  }

  &__row-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  &__row-balance {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__row-balance-label {
    font-size: 12px;
    color: $grey-5;
  }

  &__row-balance-value {
    font-size: 13px;
    font-weight: 600;
    color: $grey-8;
    direction: ltr;
  }

  &__row-balance-unit {
    font-size: 11px;
    color: $grey-5;
  }

  &__row-badges {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__badge {
    font-size: 14px;
    padding: 4px 10px;
  }

  &__obligation-card {
    margin-bottom: 12px;
    border: 1px solid #f0f0f0;
    border-radius: 12px;
    background: #f8f9fa;
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }
  }

  &__obligation-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    gap: 6px;
  }

  &__obligation-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 200px;
  }

  &__brand-icon {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    border: 1px solid $default-disabled-border;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #616161;
    background-color: $white;
  }

  &__brand-info {
    text-align: right;
  }

  &__brand-amount {
    font-size: 16px;
    font-weight: 700;
    color: $dark;

    .unit {
      margin-right: 4px;
    }
  }

  &__brand-subtitle {
    font-size: 14px;
    color: $grey-8;
    margin-top: 1px;
    font-weight: 500;
  }

  &__obligation-meta-box {
    display: flex;
    background: $white;
    border-radius: 10px;
    padding: 5px 16px;
    gap: 24px;
    justify-content: space-between;
    align-items: center;
    width: 400px;
  }

  &__meta-col {
    display: flex;
    flex-direction: column;
    align-items: start;

    .label {
      font-size: 12px;
      color: $grey-8;
      font-weight: 600;
    }
    .value {
      font-size: 12px;
      font-weight: 500;
      color: $dark;
    }
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
