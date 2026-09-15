<template>
  <QCard v-if="isShowComponent" flat bordered class="tpso">
    <QCardSection>
      <div class="tpso__header">
        <Typography variant="heading" size="h6" class="tpso__title">خدمات اختصاصی</Typography>
      </div>

      <QForm class="tpso__form">
        <div class="row q-col-gutter-md">
          <template v-for="question of questionsToShow" :key="question.id">
            <div
              v-if="question.type !== QUESTION_TYPE.PER_TEETH && !isDraft"
              :class="isMobileScreen ? 'col-12' : 'col-3'"
            >
              <div class="tpso__field">
                <label class="tpso__label">
                  {{ question.title }}
                  <span v-if="isShowRemovedItem(question)" class="tpso__warning">
                    <QTooltip anchor="top middle" self="bottom middle" max-width="300px">
                      <div class="text-body2">
                        <div class="q-mb-sm text-weight-medium">
                          {{ `قیمت ${question.title} تغییر پیدا کرده.` }}
                        </div>
                        <div class="q-mb-xs">
                          لطفا برای ویرایش این طرح درمان، بر اساس گزینه قدیمی یک گزینه جدید انتخاب
                          کنید.
                        </div>
                        <div class="text-weight-bold q-mt-sm">گزینه قدیمی:</div>
                        <div>{{ generateRemovedItemTitle(question) }}</div>
                        <div>{{ generateRemovedItemPrice(question) }}</div>
                      </div>
                    </QTooltip>
                    <IconAlertTriangle :size="20" />
                  </span>
                </label>
                <QSelect
                  :model-value="getItemValue(question)"
                  :placeholder="`انتخاب ${question.title}`"
                  :options="question?.items || []"
                  option-value="id"
                  option-label="title"
                  emit-value
                  map-options
                  clearable
                  outlined
                  dense
                  :multiple="
                    question.type === QUESTION_TYPE.SIMPLE_MULTIPLE ||
                    question.type === QUESTION_TYPE.PER_QUADRANT
                  "
                  :use-chips="
                    question.type === QUESTION_TYPE.SIMPLE_MULTIPLE ||
                    question.type === QUESTION_TYPE.PER_QUADRANT
                  "
                  @update:model-value="(value) => onChangeItem(value, question)"
                >
                  <template #option="{ itemProps, opt }">
                    <QItem v-bind="itemProps" dense>
                      <QItemSection>
                        <div class="tpso__option">
                          <span class="tpso__option-title">{{ opt.title }}</span>
                          <span v-if="opt.price" class="tpso__option-price">
                            {{ numberSeparator(opt.price) }}
                          </span>
                        </div>
                      </QItemSection>
                    </QItem>
                  </template>
                </QSelect>
              </div>
            </div>
            <div
              v-if="
                question.type === QUESTION_TYPE.MULTIPLE &&
                question.coefficient &&
                mode !== TREATMENT_PLAN_MODE.DRAFT
              "
              :class="isMobileScreen ? 'col-12' : 'col-3'"
            >
              <div class="tpso__field">
                <label class="tpso__label">تعداد پایه</label>
                <QSelect
                  :model-value="getBaseItemValue(question)"
                  placeholder="انتخاب تعداد پایه"
                  :options="baseRange"
                  outlined
                  dense
                  @update:model-value="(value) => onChangeBaseItem(value, question)"
                >
                  <template #no-option>
                    <QItem dense>
                      <QItemSection class="text-grey-6 text-caption">
                        برای مشاهده تعداد پایه ابتدا دندان‌ها را انتخاب کنید
                      </QItemSection>
                    </QItem>
                  </template>
                  <template #option="{ itemProps, opt }">
                    <QItem v-bind="itemProps" dense>
                      <QItemSection>{{ opt }}</QItemSection>
                    </QItem>
                  </template>
                </QSelect>
              </div>
            </div>
            <div
              v-if="question?.type === QUESTION_TYPE.PER_UNIT && isDraft"
              :class="isMobileScreen ? 'col-12' : 'col-3'"
            >
              <div class="tpso__field">
                <label class="tpso__label">
                  {{ question.title }}
                  <span v-if="isShowRemovedItem(question)" class="tpso__warning">
                    <QTooltip anchor="top middle" self="bottom middle" max-width="300px">
                      <div class="text-body2">
                        <div class="q-mb-sm text-weight-medium">
                          {{ `قیمت ${question.title} تغییر پیدا کرده.` }}
                        </div>
                        <div class="q-mb-xs">
                          لطفا برای ویرایش این طرح درمان، بر اساس گزینه قدیمی یک گزینه جدید انتخاب
                          کنید.
                        </div>
                        <div class="text-weight-bold q-mt-sm">گزینه قدیمی:</div>
                        <div>{{ generateRemovedItemTitle(question) }}</div>
                        <div>{{ generateRemovedItemPrice(question) }}</div>
                      </div>
                    </QTooltip>
                    <IconAlertTriangle :size="20" />
                  </span>
                </label>
                <QSelect
                  :model-value="getItemValue(question)"
                  :placeholder="`انتخاب ${question.title}`"
                  :options="question?.items || []"
                  option-value="id"
                  option-label="title"
                  emit-value
                  map-options
                  clearable
                  outlined
                  dense
                  :disable="mode === 'edit' && isDraft"
                  @update:model-value="(value) => onChangeItem(value, question)"
                >
                  <template #option="{ itemProps, opt }">
                    <QItem v-bind="itemProps" dense>
                      <QItemSection>
                        <div class="tpso__option">
                          <span class="tpso__option-title">{{ opt.title }}</span>
                          <span v-if="opt.price" class="tpso__option-price">
                            {{ numberSeparator(opt.price) }}
                          </span>
                        </div>
                      </QItemSection>
                    </QItem>
                  </template>
                </QSelect>
              </div>
            </div>
          </template>
        </div>
      </QForm>
    </QCardSection>
  </QCard>

  <TpRelatedServiceDialog
    v-model="showGtrDialog"
    title="ثبت GTR"
    :message="gtrDialogMessage"
    @confirm="handleGtrConfirm"
  />

  <TpRelatedServiceDialog
    v-model="showBioboostDialog"
    title="ثبت BIOBOOST"
    :message="bioboostDialogMessage"
    @confirm="handleBioboostConfirm"
  />
</template>

<script setup>
import { range } from '@/utils/lodash-utils'
import { IconAlertTriangle } from '@tabler/icons-vue'
import { Notif } from '@/data/services/notification-service'
import { computed, watch } from 'vue'
import { useIsMobile } from '@/composables/use-is-mobile'
import Typography from '@/base/Typography'
import { useGetServeItemsQuery } from '../../query'
import { numberSeparator } from '@/utils/formatter'
import { calculateBaseNumber } from '../../utils/teeth'
import { useRoute } from 'vue-router'
import { useTpStatus } from '../../composables/use-tp-status'
import { QUESTION_TYPE, TREATMENT_PLAN_STEP, TREATMENT_PLAN_MODE } from '../../constants/enums'
import { getServiceQuestions } from '../../constants/service-question-types'
import { useDetectService, BIOBOOST_MIN_BASE_VALUE } from '../../composables/use-detect-service'
import TpRelatedServiceDialog from './TpRelatedServiceDialog'
import { useTpProvider } from '@/modules/TreatmentPlan/composables/use-tp-provider'

const { updateItems, treatmentData, selectedServe } = useTpProvider([
  'updateItems',
  'treatmentData',
  'selectedServe',
])
const { isDraft, mode } = useTpStatus()
const { backendStepNumber } = useTpStatus(treatmentData)
const route = useRoute()

const isMobileScreen = useIsMobile()
const itemList = computed(() => treatmentData?.value?.items)
const { data: serveItems } = useGetServeItemsQuery({ treatmentPlanId: route.params?.id })

const branchId = computed(() => treatmentData?.value?.user?.branch?.id)

const selectedServeTeeth = computed(
  () =>
    treatmentData?.value?.teeth?.find(
      (item) => item?.serve.serveId === selectedServe?.value?.serveId
    ) || null
)

const baseRange = computed(() =>
  selectedServeTeeth.value?.teeth?.length
    ? range(
        calculateBaseNumber(selectedServeTeeth.value.teeth.map(Number)),
        selectedServeTeeth.value.teeth.length + 1
      )
    : []
)

/**
 * @param {Array} items - Array of question items
 * @returns {Object|null} The proposed item or first item as fallback
 */
const findProposedItem = (items) => {
  if (!items?.length) return null
  const proposedItems = items.filter((it) => it?.pivot?.isProposed)

  if (proposedItems.length > 1) {
    console.warn('[TpServeOptions] Multiple items have isProposed: true. Using first match.', {
      itemCount: items.length,
      proposedCount: proposedItems.length,
    })
  }

  return proposedItems[0] || items[0]
}

const questionsToShow = computed(() => {
  return getServiceQuestions(selectedServe?.value) || []
})

const isShowComponent = computed(() => {
  return questionsToShow.value.some((qs) => qs.type !== QUESTION_TYPE.PER_TEETH)
})

const getItemValue = (question) => {
  if (
    question.type === QUESTION_TYPE.SIMPLE_MULTIPLE ||
    question.type === QUESTION_TYPE.PER_QUADRANT
  ) {
    const items =
      itemList.value
        ?.find((i) => i.serveId === selectedServe.value.serveId)
        ?.questions?.find((_q) => _q.id === question.id)?.items || []
    return items.map((item) => item.id).filter(Boolean)
  }

  const questionItems =
    itemList.value
      ?.find((i) => i.serveId === selectedServe.value.serveId)
      ?.questions?.find((_q) => _q.id === question.id)?.items || []

  return findProposedItem(questionItems)?.id || null
}

const getBaseItemValue = (question) => {
  const questionItems =
    itemList.value
      ?.find((i) => i.serveId === selectedServe.value.serveId)
      ?.questions?.find((_q) => _q.id === question.id)?.items || []

  const proposedItem = findProposedItem(questionItems)
  return proposedItem?.pivot?.unit ?? null
}

const {
  showGtrDialog,
  gtrCount,
  checkGtrConditions,
  resetGtrDialog,
  findGtrQuestion,
  showBioboostDialog,
  checkBioboostConditions,
  resetBioboostDialog,
  findBioboostQuestion,
} = useDetectService(getBaseItemValue, getItemValue)

const gtrDialogMessage = computed(() => `برای این طرح درمان ${gtrCount.value} عدد GTR ثبت شود؟`)

const bioboostDialogMessage = `چون تعداد پایه ${BIOBOOST_MIN_BASE_VALUE} یا بیشتر است، BIOBOOST ثبت شود؟`

const onChangeItem = (itemId, question) => {
  const foundItem = itemList.value?.find((i) => i.serveId === selectedServe.value.serveId) || null

  const currentItem =
    foundItem || serveItems.value?.find((i) => i.serveId === selectedServe.value.serveId)

  const currentQuestion = foundItem && foundItem.questions.find((_q) => _q.id === question.id)

  if (
    question.type === QUESTION_TYPE.SIMPLE_MULTIPLE ||
    question.type === QUESTION_TYPE.PER_QUADRANT
  ) {
    const selectedItemIds = Array.isArray(itemId) ? itemId : []
    const selectedQuestionItems = question.items
      .filter((item) => selectedItemIds.includes(item.id))
      .map((item) => ({
        ...item,
        serveIndustryId: question.serveIndustryId,
        serveIndustryQuestionId: question.id,
      }))

    updateItems({
      ...currentItem,
      questions: currentQuestion
        ? foundItem?.questions?.map((_q) =>
            _q.id === question.id ? { ...question, items: selectedQuestionItems } : _q
          )
        : [...(foundItem?.questions || []), { ...question, items: selectedQuestionItems }],
    })
    return
  }

  let selectedQuestionItem = itemId ? question.items.find((i) => i.id === itemId) : null

  if (question.type === QUESTION_TYPE.MULTIPLE && question.coefficient && selectedQuestionItem) {
    const unit = getBaseItemValue(question) ?? baseRange.value?.[0] ?? null
    selectedQuestionItem = {
      ...selectedQuestionItem,
      pivot: {
        unit,
        isDraft: backendStepNumber.value === TREATMENT_PLAN_STEP.DRAFT,
        isProposed: backendStepNumber.value === TREATMENT_PLAN_STEP.PROPOSED,
        isPerformed: false,
      },
    }
  } else if (selectedQuestionItem) {
    selectedQuestionItem = {
      ...selectedQuestionItem,
      pivot: {
        isDraft: backendStepNumber.value === TREATMENT_PLAN_STEP.DRAFT,
        isProposed: backendStepNumber.value === TREATMENT_PLAN_STEP.PROPOSED,
        isPerformed: false,
      },
    }
  }

  updateItems({
    ...currentItem,
    questions: selectedQuestionItem
      ? currentQuestion
        ? foundItem?.questions?.map((_q) =>
            _q.id === question.id ? { ...question, items: [selectedQuestionItem] } : _q
          )
        : [...(foundItem?.questions || []), { ...question, items: [selectedQuestionItem] }]
      : foundItem?.questions?.filter((_q) => _q.id !== question.id),
  })
}

const onChangeBaseItem = (unit, question) => {
  const foundItem = itemList.value?.find((i) => i.serveId === selectedServe.value.serveId) || null
  const serveItem = serveItems.value?.find((i) => i.serveId === selectedServe.value.serveId)

  const currentQuestion =
    foundItem?.questions?.find((_q) => _q.id === question.id) ||
    serveItem?.questions?.find((_q) => _q.id === question.id)

  if (!currentQuestion?.items?.length) {
    Notif.error(`ابتدا ${question.title} را انتخاب کنید`)
    return
  }

  const baseItem = findProposedItem(currentQuestion.items)
  if (!baseItem) {
    Notif.error('خطا: آیتم مورد نظر یافت نشد')
    return
  }

  const updatedItem = {
    ...baseItem,
    pivot: {
      unit,
      isDraft: backendStepNumber.value === TREATMENT_PLAN_STEP.DRAFT,
      isProposed: backendStepNumber.value === TREATMENT_PLAN_STEP.PROPOSED,
      isPerformed: false,
    },
  }

  const itemToUpdate = foundItem || serveItem
  if (!itemToUpdate) {
    Notif.error('خطا: سرویس یافت نشد')
    return
  }

  if (foundItem) {
    updateItems({
      ...itemToUpdate,
      questions: itemToUpdate?.questions?.map((_q) =>
        _q.id === question.id ? { ..._q, items: [updatedItem] } : _q
      ),
    })
  } else {
    updateItems({
      ...itemToUpdate,
      questions: [{ ...question, items: [updatedItem] }],
    })
  }
}

const clearBaseItemValue = (question) => {
  const foundItem = itemList.value?.find((i) => i.serveId === selectedServe.value.serveId) || null
  const serveItem = serveItems.value?.find((i) => i.serveId === selectedServe.value.serveId)

  const currentQuestion =
    foundItem?.questions?.find((_q) => _q.id === question.id) ||
    serveItem?.questions?.find((_q) => _q.id === question.id)

  if (!currentQuestion?.items?.length) return

  const baseItem = findProposedItem(currentQuestion.items)
  if (!baseItem) return

  const updatedItem = {
    ...baseItem,
    pivot: {
      unit: null,
      isDraft: backendStepNumber.value === TREATMENT_PLAN_STEP.DRAFT,
      isProposed: backendStepNumber.value === TREATMENT_PLAN_STEP.PROPOSED,
      isPerformed: false,
    },
  }

  const itemToUpdate = foundItem || serveItem
  if (!itemToUpdate) return

  updateItems({
    ...itemToUpdate,
    questions: itemToUpdate?.questions?.map((_q) =>
      _q.id === question.id ? { ..._q, items: [updatedItem] } : _q
    ),
  })
}

watch(baseRange, (newRange) => {
  if (questionsToShow.value.length === 0) return

  questionsToShow.value.forEach((question) => {
    if (question.type !== QUESTION_TYPE.MULTIPLE || !question.coefficient) return

    const currentBaseValue = getBaseItemValue(question)

    if (!newRange?.length) {
      if (currentBaseValue !== null) {
        clearBaseItemValue(question)
      }
      return
    }

    if (currentBaseValue !== null && !newRange.includes(currentBaseValue)) {
      onChangeBaseItem(newRange[0], question)
    }
  })
})

const findFilledPrevQuestion = (q) => {
  const prevFilledItem = itemList.value?.find(
    (item) => item?.serveId === selectedServe?.value?.serveId
  )
  return prevFilledItem?.questions?.find((_q) => _q.id === q.id)
}

const isShowRemovedItem = (q) => {
  const filledPrevQuestion = findFilledPrevQuestion(q)

  if (!filledPrevQuestion?.items?.length || !q.items?.length) return false

  return !q.items.some((_item) => _item.id === filledPrevQuestion.items[0].id)
}

const generateRemovedItemTitle = (q) => {
  const filledPrevOption = findFilledPrevQuestion(q)?.items?.[0]

  if (!filledPrevOption) return `${q.title}: گزینه نامشخص`

  return `${q.title}: ${filledPrevOption.title}`
}

const generateRemovedItemPrice = (q) => {
  const filledPrevOption = findFilledPrevQuestion(q)?.items?.[0]

  if (!filledPrevOption?.price) return 'قیمت نامشخص'

  return `قیمت ${numberSeparator(filledPrevOption.price)}`
}

watch(
  [selectedServe, questionsToShow, branchId, () => itemList.value, isDraft, mode],
  ([serve, questions, branch, , isDraftVal, modeVal]) => {
    if (!branch || !serve || !questions?.length) return

    if (isDraftVal || modeVal === TREATMENT_PLAN_MODE.DRAFT) {
      resetGtrDialog()
      resetBioboostDialog()
      return
    }

    checkGtrConditions(branch, serve, questions)
    checkBioboostConditions(branch, serve, questions)
  },
  { immediate: true }
)

const handleGtrConfirm = () => {
  const gtrQuestion = findGtrQuestion(questionsToShow.value)

  if (!gtrQuestion || !gtrCount.value) {
    Notif.error('خطا در یافتن سوال GTR')
    return
  }

  const targetItem = gtrQuestion.items?.find((item) => item.title === String(gtrCount.value))

  if (!targetItem) {
    Notif.error(`آیتم GTR با تعداد ${gtrCount.value} یافت نشد`)
    return
  }

  onChangeItem(targetItem.id, gtrQuestion)
}

const handleBioboostConfirm = () => {
  const bioboostQuestion = findBioboostQuestion(questionsToShow.value)

  if (!bioboostQuestion) {
    Notif.error('خطا در یافتن سوال BIOBOOST')
    return
  }

  const currentItem = bioboostQuestion.items?.[0]
  if (!currentItem) {
    Notif.error('آیتم BIOBOOST یافت نشد')
    return
  }

  onChangeItem(currentItem.id, bioboostQuestion)
}
</script>

<style lang="scss" scoped>
@use 'sass:color';

.tpso {
  margin-bottom: 2rem;
  padding-bottom: 2rem;

  &__header {
    margin-bottom: 1.5rem;
    padding-bottom: 0.25rem;
    border-bottom: 2px solid $blue-2;
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 600;
    color: $grey-8;
    margin: 0;
  }

  &__form {
    margin-top: 1.5rem;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.875rem;
    font-weight: 500;
    color: $grey-7;
    margin-bottom: 0.25rem;
  }

  &__warning {
    display: inline-flex;
    align-items: center;
    color: $negative;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: color.adjust($negative, $lightness: -10%);
    }
  }

  &__option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 1rem;
  }

  &__option-title {
    flex: 1;
    color: $grey-8;
  }

  &__option-price {
    flex-shrink: 0;
    font-weight: 600;
    color: $primary;
    font-size: 0.875rem;
  }
}
</style>
