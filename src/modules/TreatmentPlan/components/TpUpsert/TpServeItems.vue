<template>
  <QCard
    v-if="
      currentStepNumber !== TREATMENT_PLAN_STEP.PERFORMED ||
      !isBranchHasTpPerform ||
      mode === TREATMENT_PLAN_STEP.DRAFT
    "
    flat
    class="tpsi"
  >
    <div>
      <template v-if="!isErrorServeItems && isLoadingServeItems">
        <div class="tpsi__skeleton">
          <QSkeleton
            v-for="n in 12"
            :key="n"
            class="tpsi__skeleton-tab"
            animation="pulse"
            type="rect"
          />
        </div>
      </template>
      <template v-else-if="serveItems && serveItems.length > 0">
        <div ref="tabsContainerRef" class="tpsi__tabs-container">
          <QTabs
            v-model="selectedTab"
            align="left"
            class="tpsi__tabs"
            indicator-color="primary"
            active-color="primary"
            dense
            :mobile-arrows="false"
          >
            <QTab
              v-for="(serve, index) in showableServeList"
              v-show="index < visibleCount"
              :key="serve.id"
              :name="serve.id"
              :class="['tpsi__tab', { 'tpsi__tab--selected': selectedServe?.id === serve.id }]"
              @click="onSelectServe(serve)"
            >
              <div class="tpsi__tab-content">
                <Badge
                  v-if="teeth?.find((el) => el.serve.serveId === serve?.serveId)?.total"
                  color="primary"
                  floating
                  is-rounded
                  class="tpsi__badge"
                >
                  {{ teeth?.find((el) => el.serve.serveId === serve?.serveId)?.total }}
                </Badge>
                <Typography variant="body" size="4" weight="medium">{{ serve.title }}</Typography>
              </div>
            </QTab>
          </QTabs>
          <QBtnDropdown
            v-if="overflowServes.length > 0"
            flat
            dense
            class="tpsi__overflow"
            :class="{ 'tpsi__overflow--selected': isSelectionInOverflow }"
            auto-close
            menu-anchor="bottom right"
            menu-self="top right"
            dropdown-icon="none"
          >
            <template #label>
              <IconChevronsLeft class="tpsi__overflow-label" />
              <Badge
                v-if="overflowTeethTotal > 0"
                color="primary"
                is-rounded
                class="tpsi__badge tpsi__overflow-badge"
              >
                {{ overflowTeethTotal }}
              </Badge>
            </template>
            <QList>
              <QItem
                v-for="serve of overflowServes"
                :key="serve.id"
                clickable
                :active="selectedServe?.id === serve.id"
                active-class="tpsi__overflow-item--active"
                @click="onSelectServe(serve)"
              >
                <QItemSection>{{ serve.title }}</QItemSection>
                <QItemSection side>
                  <Badge
                    v-if="teeth?.find((el) => el.serve.serveId === serve?.serveId)?.total"
                    color="primary"
                    is-rounded
                  >
                    {{ teeth?.find((el) => el.serve.serveId === serve?.serveId)?.total }}
                  </Badge>
                </QItemSection>
              </QItem>
            </QList>
          </QBtnDropdown>
        </div>
      </template>
      <div v-if="isErrorServeItems" class="tpsi__error">
        <Button variant="outline" color="red" text="تلاش مجدد" @click="refetch" />
      </div>
    </div>
  </QCard>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { IconChevronsLeft } from '@tabler/icons-vue'
import Badge from '@/base/Badge'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import { useGetServeItemsQuery } from '../../query'
import { useTpProvider } from '../../composables/use-tp-provider'
import { useRoute } from 'vue-router'
import { TREATMENT_PLAN_STEP } from '@/modules/TreatmentPlan/constants/enums'
import { useTpStatus } from '@/modules/TreatmentPlan/composables/use-tp-status'
import { useBranchTpPerform } from '../../composables/use-branch-tp-perform'

const { treatmentData, selectedServe, onSelectServe } = useTpProvider([
  'treatmentData',
  'selectedServe',
  'onSelectServe',
])
const route = useRoute()
const teeth = computed(() => treatmentData?.value?.teeth)

const selectedTab = ref(null)

const { currentStepNumber, mode } = useTpStatus(treatmentData)
const { isBranchHasTpPerform } = useBranchTpPerform()

const {
  refetch,
  data: serveItems,
  isLoading: isLoadingServeItems,
  isError: isErrorServeItems,
} = useGetServeItemsQuery({ treatmentPlanId: route.params?.id })

const showableServeList = computed(
  () => serveItems?.value?.filter((serve) => serve?.questions && serve.questions.length > 0) || []
)

const tabsContainerRef = ref(null)
const visibleCount = ref(Infinity)

const OVERFLOW_BUTTON_RESERVE = 56 // reserved width of the «» overflow trigger button

const teethTotalFor = (serve) =>
  teeth?.value?.find((el) => el.serve.serveId === serve?.serveId)?.total || 0

const overflowServes = computed(() => showableServeList.value.slice(visibleCount.value))

const overflowTeethTotal = computed(() =>
  overflowServes.value.reduce((sum, serve) => sum + teethTotalFor(serve), 0)
)

const isSelectionInOverflow = computed(
  () =>
    !!selectedServe?.value &&
    overflowServes.value.some((serve) => serve.id === selectedServe.value.id)
)

const measureVisibleCount = () => {
  const container = tabsContainerRef.value
  if (!container) return
  if (container.clientWidth <= 0) {
    visibleCount.value = Infinity
    return
  }
  const tabEls = [...container.querySelectorAll('.tpsi__tab')]
  if (tabEls.length === 0) return
  const hiddenEls = tabEls.filter((el) => el.style.display === 'none')
  hiddenEls.forEach((el) => el.style.setProperty('display', ''))
  const widths = tabEls.map((el) => {
    const style = getComputedStyle(el)
    return (
      el.offsetWidth + Number.parseFloat(style.marginLeft) + Number.parseFloat(style.marginRight)
    )
  })
  hiddenEls.forEach((el) => el.style.setProperty('display', 'none'))
  const available = container.clientWidth - OVERFLOW_BUTTON_RESERVE
  let used = 0
  let count = 0
  while (count < widths.length && used + widths[count] <= available) {
    used += widths[count]
    count += 1
  }
  visibleCount.value = Math.max(1, count)
}

let resizeObserver = null
let resizeRafId = null

const observeContainer = () => {
  if (resizeObserver || typeof ResizeObserver === 'undefined' || !tabsContainerRef.value) return
  resizeObserver = new ResizeObserver(() => {
    if (resizeRafId !== null) return
    resizeRafId = requestAnimationFrame(() => {
      resizeRafId = null
      measureVisibleCount()
    })
  })
  resizeObserver.observe(tabsContainerRef.value)
}

onMounted(() => {
  observeContainer()
  measureVisibleCount()
  document.fonts?.ready?.then(() => measureVisibleCount())
})

watch(
  () => [tabsContainerRef.value, showableServeList.value.map((serve) => serve.title).join('|')],
  () => {
    observeContainer()
    measureVisibleCount()
  },
  { flush: 'post' }
)

onBeforeUnmount(() => {
  if (resizeRafId !== null) cancelAnimationFrame(resizeRafId)
  resizeObserver?.disconnect?.()
  resizeObserver = null
})

watch(
  selectedServe,
  (newValue) => {
    if (newValue) {
      selectedTab.value = newValue.id
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.tpsi {
  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__tabs-container {
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  &__tabs {
    flex: 1 1 auto;
    min-width: 0;

    :deep(.q-tab) {
      padding: 0.25rem 1rem;
      margin: 0 0.25rem;
    }

    :deep(.q-tabs__arrow) {
      display: none;
    }
  }

  &__tab {
    width: 100%;
    &--selected {
      color: $blue !important;
      font-weight: bold;
      //background-color: $blue-1 !important;
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

  &__badge {
    top: -8px;
    right: -20px;
    opacity: 80%;
  }

  &__overflow {
    flex: 0 0 auto;

    &--selected {
      :deep(.q-btn__content) {
        color: $blue;
        font-weight: bold;
      }
    }
  }

  &__overflow-label {
    font-size: 1rem;
    line-height: 1;
  }

  &__overflow-badge {
    position: static;
    top: auto;
    right: auto;
  }

  &__skeleton {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: $spacing-md;
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
}
</style>
