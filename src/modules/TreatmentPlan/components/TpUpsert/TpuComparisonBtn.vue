<template>
  <div class="tp-differences">
    <QDialog v-model="showDialog">
      <QCard class="bg-grey-1 tp-differences__dialog-card">
        <QCardSection class="row items-center q-pb-none">
          <div class="text-h6">مقایسه مراحل درمان</div>
          <QSpace />
          <QBtn v-close-popup icon="close" flat round dense />
        </QCardSection>

        <QCardSection class="col q-pt-none">
          <div class="tp-compare">
            <!-- Three columns: Draft - Proposed - Performed -->
            <template v-for="step in tpSteps" :key="step.value">
              <div>
                <div class="tp-compare__pricing-title">{{ step.title }}</div>

                <QCard flat bordered class="tp-compare__column">
                  <QCardSection>
                    <div v-if="itemList?.length" class="tp-compare__items">
                      <div v-for="item in itemList" :key="item.id">
                        <QCard
                          v-if="
                            hasStepItem(item, step.value) || hasStepItemQuestion(item, step.value)
                          "
                          flat
                          bordered
                          class="tp-compare__service-card"
                        >
                          <QCardSection>
                            <!-- Service Title -->
                            <div class="tp-compare__item-header">
                              <div>{{ item.serveTitle || item.title }}</div>
                            </div>

                            <!-- TpTeeth -->
                            <div
                              v-if="item.teeth?.length && hasStepItem(item, step.value)"
                              class="tp-compare__teeth"
                            >
                              <template v-for="section in item.convertedTeeth" :key="section.key">
                                <div
                                  v-if="
                                    section.teeth.length > 0 &&
                                    hasStepSection(item, section, step.value)
                                  "
                                  class="tp-compare__teeth-item"
                                >
                                  <div>{{ section.title }}</div>
                                  <div class="tp-compare__teeth-item-teeth">
                                    <template v-for="tooth in section.teeth" :key="tooth">
                                      <span
                                        v-if="
                                          hasStepTooth(
                                            item.teethData,
                                            section.key,
                                            tooth,
                                            step.value
                                          )
                                        "
                                        :class="{
                                          'tp-compare__tooth--draft-only': isToothDraftOnly(
                                            item.teethData,
                                            section.key,
                                            tooth
                                          ),
                                        }"
                                      >
                                        {{ tooth }}
                                      </span>
                                    </template>
                                  </div>
                                </div>
                              </template>
                            </div>

                            <!-- Questions -->
                            <template
                              v-if="item.questions?.length && hasStepItemQuestion(item, step.value)"
                            >
                              <QSeparator class="q-mb-sm" color="grey-6" />
                              <template v-for="question in item.questions" :key="question.id">
                                <div v-if="hasStepQuestion(question, step.value)">
                                  <div class="tp-compare__item-question">
                                    <div class="tp-compare__question-label">
                                      {{ question.title }}
                                    </div>

                                    <div class="tp-compare__question-chips">
                                      <template
                                        v-for="questionItem in question.items"
                                        :key="questionItem.id"
                                      >
                                        <span
                                          v-if="
                                            hasStepQuestionItem(questionItem, step.value) &&
                                            questionItem.title
                                          "
                                          class="tp-chip tp-chip--accent"
                                        >
                                          {{ calculateServeTitle(question, questionItem, false) }}
                                        </span>
                                      </template>
                                    </div>
                                  </div>
                                </div>
                              </template>
                            </template>
                          </QCardSection>
                        </QCard>
                      </div>
                    </div>

                    <!-- Empty State -->
                    <div v-else>
                      <QCard flat bordered>
                        <QCardSection>
                          <div class="tp-compare__no-items">
                            <IconDentalOff
                              stroke="1.5"
                              size="32"
                              class="tp-compare__no-items-icon"
                            />
                            <div class="tp-compare__no-items-text">
                              <span>هنوز خدمتی انتخاب نشده</span>
                              <span>خدمات انتخاب شده اینجا نمایش داده می‌شوند</span>
                            </div>
                          </div>
                        </QCardSection>
                      </QCard>
                    </div>
                  </QCardSection>
                </QCard>
              </div>
            </template>
          </div>
        </QCardSection>
      </QCard>
    </QDialog>

    <QBtn class="tp-differences__btn" outline rounded color="grey" @click="showDialog = true">
      <div>
        <IconDental stroke="1.5" />
        <span>مقایسه</span>
      </div>
    </QBtn>
  </div>
</template>

<script setup>
import { QBtn } from 'quasar'
import { IconDental, IconDentalOff } from '@tabler/icons-vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { calculateServeTitle, getSelectedTeethAndServices } from '../../utils/teeth'
import { useGetServeItemsQuery } from '../../query'
import { useTpProvider } from '../../composables/use-tp-provider'
import { useTpStatus } from '../../composables/use-tp-status'

const route = useRoute()
const showDialog = ref(false)

const tpSteps = [
  { title: 'پیش نویس', value: 'isDraft' },
  { title: 'طرح درمان', value: 'isProposed' },
]

const treatmentData = useTpProvider('treatmentData')
const { data: serveItems } = useGetServeItemsQuery({
  treatmentPlanId: route.params?.id,
})

const { backendStepNumber } = useTpStatus(treatmentData)
const itemList = computed(() =>
  getSelectedTeethAndServices(treatmentData, serveItems, backendStepNumber.value)
)

const hasStepTooth = (teethData, toothKey, toothId, stepKey) => {
  const tooth = teethData?.find((t) => t.position === toothKey && t.toothNumber === toothId)
  return !!tooth?.[stepKey]
}

const hasStepSection = (item, section, stepKey) => {
  return section.teeth.some((tooth) => hasStepTooth(item.teethData, section.key, tooth, stepKey))
}

const hasStepItem = (item, stepKey) => {
  return item.convertedTeeth?.some((section) => hasStepSection(item, section, stepKey)) || false
}

const hasStepQuestionItem = (questionItem, stepKey) => {
  return !!questionItem?.pivot?.[stepKey]
}

const hasStepQuestion = (question, stepKey) => {
  return question.items?.some((item) => hasStepQuestionItem(item, stepKey))
}

const hasStepItemQuestion = (item, stepKey) => {
  return item.questions?.some((question) => hasStepQuestion(question, stepKey))
}

const isToothDraftOnly = (teethData, toothKey, toothId) => {
  const tooth = teethData?.find((t) => t.position === toothKey && t.toothNumber === toothId)
  return !!tooth?.isDraft && !tooth?.isProposed
}
</script>

<style scoped lang="scss">
.tp-differences {
  position: absolute;
  left: 15px;
  bottom: 10px;

  &__dialog-card {
    min-width: 1024px;
    min-height: 700px;
    max-height: 90vh;
  }

  &__btn div {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
  }
}

.tp-compare {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: map-get($space-sm, x);
  border-radius: 16px;
  padding: map-get($space-lg, x);

  @media (max-width: $breakpoint-sm) {
    grid-template-columns: 1fr;
  }

  &__column {
    position: relative;
    height: 100%;

    &::before {
      content: '';
      position: absolute;
      right: 0;
      top: 5%;
      height: 90%;
      width: 6px;
      border-radius: 8px 0 0 8px;
    }
  }

  > div:nth-child(1) .tp-compare__column::before {
    background: $blue-1;
  }
  > div:nth-child(2) .tp-compare__column::before {
    background: $blue-2;
  }

  &__no-items {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: map-get($space-md, x);
  }

  &__no-items-icon {
    color: $grey-8;
  }

  &__no-items-text {
    display: flex;
    flex-direction: column;

    & > span:first-child {
      font-size: map-get($subtitle1, size);
      font-weight: map-get($subtitle1, weight);
      color: $grey-8;
    }

    & > span:nth-child(2) {
      color: $grey-6;
    }
  }

  &__pricing-title {
    font-weight: bold;
    color: $grey-8;
    margin-bottom: 0.5rem;
  }

  &__teeth-item {
    font-size: 0.75rem;
    color: $blue-gray;
    display: flex;
    margin: 0.5rem 0;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  &__teeth-item-teeth {
    display: flex;
    gap: map-get($space-xs, x);

    & > span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: $blue-grey-1;
      width: 25px;
      height: 25px;
      border-radius: 2px;
    }
  }

  &__items {
    color: $gray-900;
    margin-top: 1rem;

    & > div {
      margin-bottom: 1rem;
    }
  }

  &__item-header {
    font-size: 0.875rem;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: $grey-9;
    margin-bottom: 0.5rem;
  }

  &__item-question {
    color: $blue-gray;
    font-size: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.25rem;
  }

  &__question-title {
    font-size: 0.875rem;
    font-weight: bold;
    color: $gray-900;
    margin-top: 0.5rem;
    margin-bottom: 0.25rem;
    padding-top: 0.5rem;
    border-top: 1px solid $grey-3;
    margin-inline-start: auto;
  }

  &__question-label {
    color: $grey-7;
    font-size: 0.75rem;
  }

  &__service-card {
    position: relative;
    overflow: hidden;
  }

  &__question-chips {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  &__tooth--draft-only {
    background-color: $red-2 !important;
    color: $red-8 !important;
  }
}

.tp-chip {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 6px;
  border-radius: 6px;
  background: $blue-1;
  color: $blue-7;
  font-size: 0.75rem;
}

.tp-chip--muted {
  background: $grey-2;
  color: $grey-7;
}
</style>
