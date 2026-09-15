<template>
  <QCard flat bordered class="tpsi">
    <template v-if="!isErrorServeItems && isLoadingServeItems">
      <div class="tpsi__skeleton">
        <QSkeleton class="tpsi__skeleton-arrow" animation="pulse" type="rect" />
        <QSkeleton
          v-for="n in 12"
          :key="n"
          class="tpsi__skeleton-tab"
          animation="pulse"
          type="rect"
        />
        <QSkeleton class="tpsi__skeleton-arrow" animation="pulse" type="rect" />
      </div>
    </template>
    <template v-else-if="serveItems && serveItems.length > 0">
      <QTabs
        v-model="selectedTab"
        align="left"
        class="tpsi__tabs"
        indicator-color="primary"
        active-color="primary"
        dense
        :mobile-arrows="false"
        outside-arrows
        scrollable
      >
        <QTab
          v-for="serve of serveItems"
          :key="serve.id"
          :name="serve.id"
          :class="['tpsi__tab', { 'tpsi__tab--selected': selectedServe?.id === serve.id }]"
          @click="onSelectServe(serve)"
        >
          <div class="tpsi__tab-content">
            <QBadge
              v-if="teeth?.find((el) => el.serve.serveId === serve?.serveId)?.total"
              color="primary"
              text-color="white"
              floating
              rounded
              class="tpsi__badge"
            >
              {{ teeth?.find((el) => el.serve.serveId === serve?.serveId)?.total }}
            </QBadge>
            <span class="tpsi__tab-label">{{ serve.title }}</span>
          </div>
        </QTab>
      </QTabs>
    </template>
    <div v-if="isErrorServeItems" class="tpsi__error">
      <QBtn color="negative" outline @click="refetch">تلاش مجدد</QBtn>
    </div>
  </QCard>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed, watch, ref } from 'vue'
import { QTabs, QTab, QBadge, QSkeleton, QBtn, QCard } from 'quasar'
import { useGetServeItemsByKeyQuery } from '../../query'
import { useTpProvider } from '../../composables/use-tp-provider'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import { mockGetServeItemsByKey } from '@/mocks/user-details/treatment-plan'

const selectedTab = ref(null)
const { treatmentData, selectedServe, onSelectServe } = useTpProvider([
  'treatmentData',
  'selectedServe',
  'onSelectServe',
])

const route = useRoute()

const teeth = computed(() => treatmentData?.value?.teeth)

const {
  refetch,
  data: serveItems,
  isSuccess: isSuccessServeItems,
  isLoading: isLoadingServeItems,
  isError: isErrorServeItems,
} = useGetServeItemsByKeyQuery(route.params?.key, {
  ...(ENABLE_USER_DETAIL_MOCKS ? { queryFn: () => mockGetServeItemsByKey(route.params?.key) } : {}),
})

watch(
  () => isSuccessServeItems.value,
  (_isSuccessServeList) => {
    if (_isSuccessServeList && serveItems.value?.[0]) {
      const [firstItem] = serveItems.value
      selectedTab.value = firstItem.id
      onSelectServe(firstItem)
    }
  }
)
watch(
  () => selectedServe?.value,
  (newServe) => {
    if (newServe) {
      selectedTab.value = newServe.id
    }
  }
)
</script>

<style lang="scss" scoped>
.tpsi {
  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__tabs {
    :deep(.q-tab) {
      padding: 0.25rem 2rem;
      margin: 0 0.25rem;
    }

    :deep(.q-tabs__arrow) {
      color: $primary;
    }
  }

  &__tab {
    &--selected {
      color: $blue !important;
      font-weight: bold;
    }
  }

  &__tab-content {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    min-width: 60px;
  }

  &__tab-label {
    font-size: 0.875rem;
    font-weight: 500;
  }

  &__badge {
    top: -8px;
    right: -20px;
    opacity: 80%;
  }

  &__skeleton {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem;
    overflow-x: auto;

    &-tab {
      flex-shrink: 0;
      width: 80px;
      height: 32px;
      border-radius: 4px;
    }

    &-arrow {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border-radius: 4px;
    }
  }

  &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 11px 0;
  }
}
</style>
