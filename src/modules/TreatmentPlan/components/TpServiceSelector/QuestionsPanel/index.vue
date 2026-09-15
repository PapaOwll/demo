<template>
  <div class="questions-panel">
    <div v-if="checkboxQuestions.length > 0" class="col-12 question-group">
      <QuestionItem
        v-for="question in checkboxQuestions"
        :key="question.id"
        :question="question"
        :answer="answers[question.id]"
        :selected-teeth="selectedTeeth"
        :selected-regions="selectedRegions"
        :disabled="disabled"
        @set-answer="handleSetAnswer"
      />
    </div>

    <div class="row q-col-gutter-sm">
      <div v-for="question in dropdownQuestions" :key="question.id" class="col-md-6 col-12">
        <QuestionItem
          :question="question"
          :answer="answers[question.id]"
          :selected-teeth="selectedTeeth"
          :selected-regions="selectedRegions"
          :disabled="disabled"
          @set-answer="handleSetAnswer"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import QuestionItem from './QuestionItem'
import { QUESTION_TYPE } from '@/modules/TreatmentPlan/constants/enums'

const props = defineProps({
  questions: {
    type: Array,
    default: () => [],
  },
  answers: {
    type: Object,
    default: () => ({}),
  },
  selectedTeeth: {
    type: Array,
    default: () => [],
  },
  selectedRegions: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['set-answer'])

const dropdownQuestions = computed(() =>
  props.questions.filter((q) =>
    [
      QUESTION_TYPE.MULTIPLE,
      QUESTION_TYPE.PER_UNIT,
      QUESTION_TYPE.PER_JAW,
      QUESTION_TYPE.PER_QUADRANT,
      QUESTION_TYPE.SIMPLE_MULTIPLE,
      QUESTION_TYPE.UNIT_WITH_TEETH,
    ].includes(q.type)
  )
)

const checkboxQuestions = computed(() =>
  props.questions.filter((q) => q.type === QUESTION_TYPE.YES_NO)
)

const handleSetAnswer = (questionId, value) => {
  emit('set-answer', questionId, value)
}
</script>

<style lang="scss" scoped>
.questions-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.empty-state {
  padding: $spacing-2xl;
  text-align: center;
  background-color: $grey-1;
  border-radius: $radius-md;
}

.question-group {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  gap: $spacing-lg;

  &__title {
    margin-bottom: $spacing-sm;
  }
}
</style>
