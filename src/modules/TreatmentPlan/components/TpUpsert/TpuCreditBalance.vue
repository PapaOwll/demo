<template>
  <QCard v-if="shouldShowCard" flat bordered class="tp-credit-card">
    <QCardSection class="tp-credit-card__content">
      <div class="tp-credit-card__amount">
        <template v-if="isLoadingCredit">
          <QSkeleton type="text" width="60px" />
        </template>
        <template v-else>
          <AnimatedNumber :number="creditData?.balance" />
          تومان
        </template>
      </div>
      <div class="tp-credit-card__label">اعتبار منفی</div>
    </QCardSection>
  </QCard>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AnimatedNumber from '@/components/AnimatedNumber'
import { useGetTreatmentPlanCreditQuery } from '../../query'
import { useTpProvider } from '../../composables/use-tp-provider'
import { useTpStatus } from '../../composables/use-tp-status'
import { TREATMENT_PLAN_STEP, TREATMENT_PLAN_MODE } from '../../constants/enums'

const props = defineProps({
  itemList: {
    type: Array,
    required: true,
  },
  finalPriceWithBenefit: {
    type: Number,
    default: 0,
  },
})

const route = useRoute()
const treatmentData = useTpProvider('treatmentData')
const { currentStepNumber, mode } = useTpStatus(treatmentData)

const formatItemToCreditParams = (item) => {
  if (!item) return null

  const params = {
    serveIndustryId: item.id,
  }

  if (item.convertedTeeth && item.convertedTeeth.length > 0) {
    params.teeth = item.convertedTeeth
      .filter((section) => section.teeth && section.teeth.length > 0)
      .map((section) => ({
        position: section.key,
        number: section.teeth,
      }))
  }

  if (item.questions && item.questions.length > 0) {
    params.serveIndustryItems = item.questions.flatMap((q) => {
      if (!q.items || q.items.length === 0) return []

      return q.items.map((itm) => ({
        id: itm.id,
        unit: itm.pivot?.unit || 1,
        price: itm.price || 0,
      }))
    })
  }

  return params
}

const currentParams = ref(null)
const previousItemList = ref([])
let debounceTimer = null

const updateParams = (newList, oldList) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    if (!newList || newList.length === 0) {
      currentParams.value = null
      return
    }

    let changedItem

    if (!oldList || oldList.length === 0) {
      ;[changedItem] = newList
    } else {
      changedItem = newList.find((newItem) => {
        const oldItem = oldList.find((o) => o.serveId === newItem.serveId)

        if (!oldItem) {
          return true
        }

        const teethChanged =
          JSON.stringify(newItem.convertedTeeth) !== JSON.stringify(oldItem.convertedTeeth)
        const questionsChanged =
          JSON.stringify(newItem.questions) !== JSON.stringify(oldItem.questions)

        return teethChanged || questionsChanged
      })

      if (!changedItem) {
        ;[changedItem] = newList
      }
    }

    if (changedItem) {
      currentParams.value = formatItemToCreditParams(changedItem)
    }

    previousItemList.value = newList
  }, 1000)
}

watch(() => props.itemList, updateParams, { deep: true, immediate: true })

const {
  data: creditDataRaw,
  isLoading,
  isFetching,
} = useGetTreatmentPlanCreditQuery(
  computed(() => route.params?.id),
  currentParams,
  {
    enabled: computed(
      () => mode.value !== TREATMENT_PLAN_MODE.DRAFT && !!route.params?.id && !!currentParams.value
    ),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  }
)

const creditData = computed(() => creditDataRaw.value)
const isLoadingCredit = computed(() => isLoading.value || isFetching.value)

const displayBalance = computed(() => {
  if (!creditData.value) return 0

  return creditData.value.balance || 0
})

const shouldShowCard = computed(
  () =>
    currentStepNumber.value === TREATMENT_PLAN_STEP.PERFORMED &&
    mode.value !== TREATMENT_PLAN_MODE.DRAFT &&
    displayBalance.value < 0
)
</script>

<style lang="scss" scoped>
.tp-credit-card {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 16px;
  overflow: hidden;

  &__content {
    padding: 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-sizing: border-box;
    direction: rtl;
  }

  &__amount {
    font-size: 1rem;
    font-weight: 700;
    color: #dc143c;
    display: flex;
    align-items: center;
    gap: 0.25rem;

    span {
      direction: ltr;
    }
  }

  &__label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #dc143c;
  }
}
</style>
