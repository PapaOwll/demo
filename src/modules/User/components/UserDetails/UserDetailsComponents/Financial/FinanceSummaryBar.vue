<template>
  <div class="finance-summary-bar">
    <template v-if="isSummaryLoading">
      <div class="finance-summary-box finance-summary-box--group finance-summary-box--skeleton">
        <QSkeleton type="text" width="90px" height="12px" />
        <QSkeleton type="text" width="70px" height="18px" />
      </div>
      <div
        v-for="i in SKELETON_SINGLES"
        :key="`skeleton-${i}`"
        class="finance-summary-box finance-summary-box--skeleton"
      >
        <QSkeleton type="text" width="72px" height="12px" />
        <QSkeleton type="text" width="56px" height="18px" />
      </div>
    </template>

    <div v-else-if="isError" class="finance-summary-bar__error">
      <IconExclamationCircle :size="16" />
      <span class="finance-summary-bar__error-text">دریافت اطلاعات مالی ناموفق بود</span>
      <QBtn
        flat
        dense
        no-caps
        color="primary"
        :loading="isRetrying"
        label="تلاش مجدد"
        @click="handleRetry"
      />
    </div>

    <template v-else>
      <div class="finance-summary-box--group">
        <template v-for="item in walletMetrics" :key="item.key">
          <div
            class="finance-summary-box__item finance-summary-box__item--clickable"
            :class="{ 'finance-summary-box--highlighted': walletTab === item.tab }"
            @click="selectWalletTab(item.tab)"
          >
            <div class="finance-summary-box__label-row">
              <span class="finance-summary-box__label">{{ item.label }}</span>
              <span v-if="item.tooltip" class="finance-summary-box__info-icon">
                <IconInfoCircle :size="14" />
                <QTooltip
                  anchor="top middle"
                  self="bottom middle"
                  class="finance-summary-box__tooltip"
                >
                  {{ item.tooltip }}
                </QTooltip>
              </span>
            </div>

            <div class="finance-summary-box__value-row">
              <span class="finance-summary-box__value">{{ formatCurrency(item.value) }}</span>
              <span class="finance-summary-box__unit">تومان</span>
            </div>
          </div>
        </template>
      </div>

      <section class="finance-summary-bar__metrics">
        <div v-for="metric in summaryMetrics" :key="metric.key" class="finance-summary-box">
          <div class="finance-summary-box__item">
            <div class="finance-summary-box__label-row">
              <span class="finance-summary-box__label">{{ metric.label }}</span>
              <span v-if="metric.tooltip" class="finance-summary-box__info-icon">
                <IconInfoCircle :size="14" />
                <QTooltip
                  anchor="top middle"
                  self="bottom middle"
                  class="finance-summary-box__tooltip"
                >
                  {{ metric.tooltip }}
                </QTooltip>
              </span>
            </div>

            <div class="finance-summary-box__value-row">
              <span class="finance-summary-box__value">{{ formatCurrency(metric.value) }}</span>
              <span class="finance-summary-box__unit">تومان</span>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { QBtn, QSkeleton, QTooltip } from 'quasar'
import { IconExclamationCircle, IconInfoCircle } from '@tabler/icons-vue'
import { useUserFinancialSummary } from '@/modules/User/composables/use-user-financial-summary'

const SKELETON_SINGLES = 5

const props = defineProps({
  userInfo: {
    type: Object,
    default: () => ({}),
  },
  walletTab: {
    type: String,
    default: 'wallet',
  },
})

const emit = defineEmits(['update:walletTab'])

const userId = computed(() => props.userInfo?.id)
const { summaryMetrics, walletMetrics, isSummaryLoading, isError, refetch } =
  useUserFinancialSummary(userId)

const isRetrying = ref(false)

const selectWalletTab = (tab) => emit('update:walletTab', tab)

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return new Intl.NumberFormat('en-US').format(value)
}

const handleRetry = async () => {
  isRetrying.value = true
  try {
    await refetch()
  } finally {
    isRetrying.value = false
  }
}
</script>

<style scoped lang="scss">
.finance-summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 17px;
  width: 100%;
  overflow-x: auto;
  margin-bottom: $spacing-md;

  &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 8px 0;
    color: $grey-7;
  }

  &__error-text {
    font-size: 13px;
    color: $grey-8;
  }

  &__metrics {
    display: flex;
    align-items: center;
    gap: 2px;
    width: 63%;
  }
}

.finance-summary-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex: 130 1 130px;
  min-width: 110px;
  height: 58px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid $grey-3;
  background-color: $white;
  white-space: nowrap;
  background-color: rgba($gray-500, 10%);

  &--skeleton {
    gap: 8px;
  }

  &--highlighted {
    border-color: $grey-3;
    background-color: $white;
    padding: $spacing-xs $spacing-sm;
  }

  &--group {
    flex: 277 1 277px;
    min-width: 220px;
    height: 60px;
    max-width: 350px;
    display: flex;
    align-items: center;
    padding: 4px;
    border-radius: $radius-sm;
    border: 1px solid $blue-3;
    background-color: $blue-1;
    gap: $spacing-sm;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex: 1 1 0;
    min-width: 0;

    &--clickable {
      cursor: pointer;
      border-radius: $radius-sm;
      transition: opacity 0.15s ease;

      &:hover {
        opacity: 0.75;
      }
    }

    &--active {
      .finance-summary-box__value {
        color: $primary;
      }
    }
  }

  &__divider {
    width: 1px;
    align-self: stretch;
    background-color: $grey-3;
    flex: 0 0 auto;
  }

  &__label-row {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    justify-content: space-between;
  }

  &__info-icon {
    display: inline-flex;
    color: $grey-6;
    cursor: default;
  }

  &__label {
    font-size: 12px;
    color: $grey-7;
  }

  &__value-row {
    display: flex;
    align-items: baseline;
    gap: 4px;
    width: 100%;
    justify-content: space-between;
  }

  &__value {
    font-size: 15px;
    font-weight: 600;
    color: $grey-9;
  }

  &__unit {
    font-size: 11px;
    color: $grey-6;
  }

  &__tooltip {
    font-size: 12px;
    white-space: nowrap !important;
    max-width: none !important;
    width: max-content;
  }
}
</style>
