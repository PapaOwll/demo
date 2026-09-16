<template>
  <QCard class="wallet-header">
    <QCardSection class="wallet-header__row">
      <Button
        variant="outline"
        color="blue-grey"
        :right-icon="IconCashBanknoteMove"
        class="wallet-header__refund"
        @click="showRefundDialog = true"
      >
        عودت وجه
      </Button>
      <div class="add-money">
        <QBtnDropdown
          unelevated
          color="primary"
          class="wallet-header__add"
          content-class="wallet-header__menu"
        >
          <template #label>
            <div class="row items-center no-wrap">
              <span class="q-ml-sm">افزودن</span>
            </div>
          </template>

          <QList>
            <QItem v-close-popup clickable @click="showPaymentDialog = true">
              <QItemSection>افزایش موجودی</QItemSection>
            </QItem>

            <QItem v-close-popup clickable @click="showObligationDialog = true">
              <QItemSection>تعهد پرداخت</QItemSection>
            </QItem>
          </QList>
        </QBtnDropdown>
      </div>
    </QCardSection>
  </QCard>

  <UserPaymentDialog
    v-model="showPaymentDialog"
    :user-id="props.userId"
    @submit="handlePaymentSubmit"
  />

  <UserObligationDialog
    v-model="showObligationDialog"
    :user-id="props.userId"
    @submit="handleObligationSubmit"
  />
  <!--  Refund Dialog -->
  <UserRefundDialog
    v-model="showRefundDialog"
    :user-id="props.userId"
    @submit="handleRefundSubmit"
  />
</template>

<script setup>
import { IconCashBanknoteMove } from '@tabler/icons-vue'
import { useGetUserAccountingQuery } from '@/modules/User/query'
import { reactive, ref, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import UserPaymentDialog from './UserPaymentDialog'
import UserObligationDialog from './UserObligationDialog'
import Button from '@/base/Button'

import UserRefundDialog from './UserRefundDialog'

const queryClient = useQueryClient()
const showPaymentDialog = ref(false)
const showObligationDialog = ref(false)
const showRefundDialog = ref(false)
const innerTab = ref('wallet')

defineEmits(['update:tab'])

const props = defineProps({
  userId: {
    type: Number,
    default: 0,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

watch(
  () => props.disabled,
  (disabled) => {
    if (!disabled) {
      innerTab.value = 'wallet'
    }
  }
)

const state = reactive({
  accountingFilters: { 'filter[user_id]': props.userId },
  accountingItems: [],
})

const { data: accountingData } = useGetUserAccountingQuery(state.accountingFilters)

watch(
  () => accountingData.value,
  (val) => {
    if (!val?.pages) return
    state.accountingItems = val.pages.flatMap((p) => p?.data?.items?.data || [])
  },
  { immediate: true }
)

const handleObligationSubmit = async () => {
  await queryClient.invalidateQueries({ queryKey: ['user', 'payment-obligations'] })
}

const handlePaymentSubmit = async (paymentData) => {
  if (paymentData) {
    await queryClient.invalidateQueries({
      queryKey: ['user', 'accounting', state.accountingFilters],
    })
  }
}

const handleRefundSubmit = async () => {
  await queryClient.invalidateQueries({ queryKey: ['refund-requests', props.userId] })
  await queryClient.invalidateQueries({ queryKey: ['user', 'accounting'] })
}
</script>

<style scoped lang="scss">
.wallet-header {
  box-shadow: none;
  border-radius: 12px;
  background-color: $white;

  &__row {
    display: flex;
    align-items: center;
    padding: $spacing-sm $spacing-sm $spacing-sm $spacing-lg;
    justify-content: space-between;
    gap: 8px;
  }

  /* add button */
  &__add {
    border-radius: 8px;
    width: 108px;
    height: 40px;
    padding: 4px 12px;
    font-size: 16px;
    font-weight: 500;
  }

  &__menu {
    border-radius: 10px;
    min-width: 170px;
  }

  &__refund {
    color: $dark-6 !important;
    border-color: $gray-200 !important;
  }

  /* balance */
  &__balance {
    display: flex;
    align-items: center;
  }

  &__balance-box {
    border: none;
    border-radius: 10px;
    padding: 0;
    min-width: 90px;
    text-align: start;
  }

  &__currency {
    font-size: 14px;
    color: $dark;
    font-weight: 600;
  }

  &__amount {
    font-size: 12px;
    color: $grey-8;
    font-weight: 500;
  }

  /* tabs */
  &__tabs {
    background: transparent;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__tab {
    min-height: 32px;
    padding: 8px 12px;
    border-radius: 8px;
    color: #344054;
  }

  &__tab--active {
    background: $white;
    color: $light-blue-text;
    border: 1px solid $light-blue-3;
    border-radius: $radius-sm;
  }

  &__tab--disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}
.add-money {
  display: flex;
  align-items: center;
  gap: $spacing-md;

  &__icon {
    cursor: pointer;
    color: $dark;
    transition: color 0.2s ease;

    &:hover {
      color: $primary;
    }
  }
}
</style>
