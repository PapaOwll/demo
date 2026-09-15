<template>
  <div class="tpp">
    <QCard flat bordered>
      <QCardSection>
        <QInput
          :model-value="publicDescription"
          type="textarea"
          outlined
          readonly
          :rows="3"
          placeholder="توضیحات"
        />
      </QCardSection>
    </QCard>

    <TpuServicesListEdit
      :item-list="itemList"
      :calculate-item-price="calculateItemPrice"
      :is-edit="false"
      :show-price="true"
      :is-expandable="false"
    />
    <QCard flat bordered class="tpp__pricing">
      <QCardSection class="tpp__pricing">
        <div class="tpp__pricing-total">
          <span>مجموع هزینه‌ها</span>
          <div>
            <AnimatedNumber :number="totalPrice" />

            تومان
          </div>
        </div>
        <div v-if="discountPrice" class="tpp__pricing-discount">
          <div>
            <span class="q-mx-xs">
              <IconCirclePercentage stroke="1.6" size="20" />
            </span>
            <span>با احتساب تخفیف</span>
          </div>
          <div>
            <AnimatedNumber :number="isNewDate ? newFinalPrice : finalPrice" />
            تومان
          </div>
        </div>
        <div class="tpp__pricing-final">
          <span>مبلغ نهایی</span>

          <div>
            <AnimatedNumber :number="isNewDate ? newFinalPrice : treatmentData.totalCost" />

            تومان
          </div>
        </div>
      </QCardSection>
    </QCard>
    <TppPrepay />

    <div v-if="treatmentData.isActive" class="tpp__is-active">
      این طرح درمان برای این کاربر فعال است و در نوبت دهی انجام کار و گزارشها استفاده می شود. ممکن
      است. ویرایش بخش هایی از طرح درمان در زمان انجام خدمات امکان پذیر نباشد
    </div>
    <div v-else-if="isCompletedTp">
      <QChip class="tpp__is-complete" color="negative" outline>
        طرح درمان جاری پایان یافته است
      </QChip>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { IconCirclePercentage } from '@tabler/icons-vue'
import { useGetServeItemsByKeyQuery } from '../../query'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import { mockGetServeItemsByKey } from '@/mocks/user-details/treatment-plan'
import TppPrepay from './TppPrepay'
import AnimatedNumber from '@/components/AnimatedNumber'
import { convertTeethToShowableTeeth, deduplicateTeeth } from '../../utils/teeth'
import { useTpProvider } from '../../composables/use-tp-provider'
import { useRoute } from 'vue-router'
import { useTpPricing } from '@/modules/TreatmentPlan/composables/use-tp-pricing'
import { useTpStatus } from '../../composables/use-tp-status'
import { calculateItemPrice } from '../../utils/pricing'
import TpuServicesListEdit from '@/modules/TreatmentPlan/components/TpUpsert/TpuServicesListEdit'

const {
  treatmentData,
  updateFinalPrice,
  updateNewFinalPrice,
  isNewCalculationDate: isNewDate,
} = useTpProvider([
  'treatmentData',
  'updateFinalPrice',
  'updateNewFinalPrice',
  'isNewCalculationDate',
])

const route = useRoute()

const { data: serveItems } = useGetServeItemsByKeyQuery(route.params?.key, {
  ...(ENABLE_USER_DETAIL_MOCKS ? { queryFn: () => mockGetServeItemsByKey(route.params?.key) } : {}),
})

const publicDescription = computed(() => treatmentData?.value?.publicDescription)
const { isCompletedTp } = useTpStatus(treatmentData)

// TODO: merge teeth and items
const hasProposedItems = (question) => {
  if (!question?.items?.length) return true

  return question.items?.some((item) => {
    if (
      item.pivot?.isDraft === undefined &&
      item.pivot?.isProposed === undefined &&
      item.pivot?.isPerformed === undefined
    ) {
      return true
    }

    return item.pivot?.isProposed === true
  })
}

const itemList = computed(() => {
  const teethServeIds = treatmentData?.value?.teeth?.map((t) => t?.serve?.serveId) || []

  const itemServeIds = treatmentData?.value?.items?.map((i) => i?.serveId) || []

  const teethWithoutItem = treatmentData?.value?.teeth?.filter(
    (t) => !itemServeIds.includes(t?.serve?.serveId)
  )

  const items =
    treatmentData?.value?.items?.map((_item) => {
      if (teethServeIds?.includes(_item?.serveId)) {
        const serve = serveItems.value?.find((_serve) => _serve.serveId === _item?.serveId)
        if (!serve) return _item
        const teethItem = treatmentData?.value?.teeth?.find(
          (t) => t.serve.serveId === _item?.serveId
        )

        if (!teethItem) return _item

        const deduplicatedTeeth = deduplicateTeeth(teethItem.teeth)

        const typeFourQuestions = serve?.questions
          ?.filter((_q) => _q.type === 4)
          .filter((question) => hasProposedItems(question))
          ?.map((q) => ({ ...q, teeth: deduplicatedTeeth }))

        const filteredNonTypeFourQuestions = _item.questions
          .filter((_q) => _q.type !== 4)
          .filter((question) => hasProposedItems(question))

        return {
          ..._item,
          teeth: deduplicatedTeeth,
          convertedTeeth: convertTeethToShowableTeeth(deduplicatedTeeth),
          questions: [...filteredNonTypeFourQuestions, ...typeFourQuestions],
        }
      }

      return _item
    }) || []

  const remainItems =
    teethWithoutItem?.flatMap((t) => {
      const serve = serveItems.value?.find((_serve) => _serve.serveId === t?.serve?.serveId)

      if (!serve) return []

      const deduplicatedTeeth = deduplicateTeeth(t.teeth)

      return {
        ...serve,
        teeth: deduplicatedTeeth,
        convertedTeeth: convertTeethToShowableTeeth(deduplicatedTeeth),
        questions: serve.questions
          .filter((_q) => _q.type === 4)
          .map((q) => ({ ...q, teeth: deduplicatedTeeth })),
      }
    }) || []

  return [...items, ...remainItems]
})

const { totalPrice, discountPrice, finalPrice, newFinalPrice } = useTpPricing(
  itemList,
  treatmentData
)

watch(
  () => finalPrice.value,
  (value) => updateFinalPrice(value),
  { immediate: true }
)
watch(
  () => totalPrice.value,
  (value) => {
    updateNewFinalPrice(value)
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.tpp {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  > div {
    border-radius: 0.5rem;
  }

  &__pricing-title {
    margin-bottom: 0.5rem;
    font-weight: bold;
  }

  &__teeth-item {
    font-size: 0.75rem;
    color: $blue-gray;
    display: flex;
    margin: 0.5rem 0;
    align-items: center;
    gap: 1rem;
  }

  &__teeth-item-teeth {
    display: flex;
    gap: 0.5rem;

    & > span {
      display: inline-block;
      background-color: $gray-200;
      width: 1.5rem;
      text-align: center;
    }
  }

  &__items {
    color: $gray-900;
    margin-top: 1rem;

    & > div {
      border-bottom: 1px solid $gray-200;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
    }
  }

  &__item-header {
    font-size: 0.875rem;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__item-question {
    color: $blue-gray;
    font-size: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.25rem;
  }

  &__item-question-removed {
    color: $danger;
  }

  &__pricing {
    margin-top: 10px;
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
    display: flex;
    flex-direction: column;
    border-color: $grey-4;

    > div {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
    }
  }

  &__pricing-final {
    font-weight: bold;
    background: $grey-2;
    border-radius: 0.5rem;
    padding: 0.5rem 1rem !important;
  }

  &__is-complete {
    width: 100%;
    padding: 1.5rem;
    margin-top: 1rem;
  }

  &__is-active {
    width: 100%;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    text-align: justify;
  }
}
</style>
