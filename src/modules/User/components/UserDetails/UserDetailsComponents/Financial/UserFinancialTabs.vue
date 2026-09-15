<template>
  <QCard class="user-financial">
    <div class="user-financial__header">
      <div>
        <h6 class="user-financial__header-title">اطلاعات مالی</h6>
        <QTabs
          v-model="state.tabSelected"
          active-class="active-tab"
          class="user-financial__tabs"
          dense
        >
          <QTab v-for="tab in state.tabs" :key="tab.id" :name="tab.id" class="tab-card">
            <template #default>
              <QItemLabel class="user-financial__tabs-label text-body2 text-bold">
                {{ tab.title }}
              </QItemLabel>
            </template>
          </QTab>
          <Button
            v-if="state.tabSelected === 1 && state.walletTab === 'wallet'"
            class="m-x-4"
            color="blue-grey"
            variant="flat"
            :left-icon="IconRefresh"
            @click="refreshListAccounting"
          />
        </QTabs>
      </div>
      <Wallet
        :user-id="userInfo?.id"
        :disabled="state.tabSelected === 2"
        @update:tab="state.walletTab = $event"
      />
    </div>

    <QTabPanels v-model="state.tabSelected" animated class="user-financial__tab-panels">
      <QTabPanel
        v-for="tab in state.tabs"
        :key="tab.id"
        :name="tab.id"
        class="user-financial__tab-panels-item"
      >
        <component
          :is="tab.component"
          :user-info="userInfo"
          :wallet-tab="state.walletTab"
          @update:wallet-tab="state.walletTab = $event"
        />
      </QTabPanel>
    </QTabPanels>
  </QCard>
</template>

<script setup>
import { useGetUserMiniByIdQuery } from '@/modules/User/query'
import { useQueryClient } from '@tanstack/vue-query'
import Wallet from './UserFinancialWallet'
import Document from './UserFinancialDocument'
import Accounting from './UserFinancialAccounting'
import { markRaw, reactive, watch } from 'vue'
import { IconRefresh } from '@tabler/icons-vue'
import Button from '@/base/Button'
import Requests from './UserFinancialRequests'

const props = defineProps({ propData: { type: Number, default: null } })

const queryClient = useQueryClient()

const state = reactive({
  tabs: [
    // { id: 1, title: 'اطلاعات مالی', component: markRaw(Transactions) },
    { id: 1, title: 'تراکنش ها', component: markRaw(Accounting) },
    { id: 2, title: 'مدارک  مالی', component: markRaw(Document) },
    { id: 3, title: 'درخواست‌ها', component: markRaw(Requests) },
  ],
  tabSelected: 1,
  walletTab: 'wallet',
})

const { data: userInfo } = useGetUserMiniByIdQuery(props.propData)

watch(
  () => state.tabSelected,
  (tabId) => {
    if (tabId === 1) {
      state.walletTab = 'wallet'
    }
  }
)

const refreshListAccounting = () => {
  queryClient.resetQueries({ queryKey: ['user', 'accounting'] })
}
</script>

<style lang="scss" scoped>
.user-financial {
  justify-content: start;
  flex-direction: column;
  align-items: start;
  overflow: hidden;
  box-shadow: none;
  height: 700px;
  display: flex;
  width: 100%;
  height: 100%;

  &__header {
    background-color: $white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    .user-financial__header-title {
      margin: 0;
      padding-bottom: $spacing-md;
      font-size: 20px;
      font-weight: 500;
    }
  }

  &__tabs {
    color: $dark;
    margin-bottom: map-get($space-md, x);
    min-height: 40px;
  }
  &__tabs-label {
    font-weight: map-get($body2, weight);
    font-size: map-get($body2, size);
  }
  &__tab-panels {
    height: 100%;
    padding: 0;
    width: 100%;
    overflow: auto;
  }
  &__tab-panels-item {
    overflow: auto;
  }
  &_header {
    font-size: map-get($h6, size);
    font-weight: map-get($h6, weight);
  }
}

.tab-card {
  background-color: $gray-050;
  color: $black;

  &:first-child {
    border: none;
    border-top-right-radius: $generic-border-radius;
    border-bottom-right-radius: $generic-border-radius;
  }

  &:last-child {
    border-top-left-radius: $generic-border-radius;
    border-bottom-left-radius: $generic-border-radius;
  }
}
.q-tab-panel {
  padding: 0px;
}
.active-tab {
  color: $white;
  background-color: $blue;
}
</style>
