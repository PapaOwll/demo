<template>
  <div>
    <FinanceSummaryBar
      :user-info="userInfo"
      :wallet-tab="walletTab"
      @update:wallet-tab="$emit('update:walletTab', $event)"
    />

    <Transition name="tab-fade" mode="out-in">
      <UserAccountingList v-if="walletTab === 'wallet'" :key="'wallet'" :user-info="userInfo" />
      <UserObligationsList v-else :key="'obligations'" :user-info="userInfo" />
    </Transition>
  </div>
</template>

<script setup>
import FinanceSummaryBar from './FinanceSummaryBar'
import UserAccountingList from './UserAccountingList'
import UserObligationsList from './UserObligationsList'

defineProps({
  userInfo: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  walletTab: {
    type: String,
    default: 'wallet',
  },
})

defineEmits(['update:walletTab'])
</script>

<style lang="scss" scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.2s ease;
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}
</style>
