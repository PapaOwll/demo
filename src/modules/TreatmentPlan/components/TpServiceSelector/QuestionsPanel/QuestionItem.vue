<template>
  <div class="question-item">
    <!-- <Typography
      v-if="questionDisplayType === QUESTION_DISPLAY_TYPES.DROPDOWN"
      variant="body"
      size="3"
      weight="medium"
      class="question-label"
    >
      {{ question.title }}
    </Typography> -->

    <DropdownQuestion
      v-if="questionDisplayType === QUESTION_DISPLAY_TYPES.DROPDOWN"
      :options="question.items || []"
      :label="question.title"
      :multiple="multipleItems"
      :model-value="answer"
      :disabled="disabled"
      @update:model-value="handleSetAnswer"
    />

    <div v-if="needsBaseCount" class="base-count-section">
      <SelectField
        :model-value="baseUnitValue"
        :options="baseRange"
        variant="outline"
        label="تعداد پایه"
        placeholder="انتخاب تعداد پایه"
        :disable="disabled"
        @update:model-value="handleSetBaseUnit"
      >
        <template #no-option>
          <QItem dense>
            <QItemSection class="text-grey-6 text-caption">
              برای مشاهده تعداد پایه ابتدا دندان‌ها یا نواحی را انتخاب کنید
            </QItemSection>
          </QItem>
        </template>
      </SelectField>
    </div>

    <CheckboxQuestion
      v-else-if="questionDisplayType === QUESTION_DISPLAY_TYPES.CHECKBOX"
      :question="question"
      :model-value="answer"
      :disabled="disabled"
      @update:model-value="handleSetAnswer"
    />
  </div>
</template>
<script setup>
import { computed, watch } from 'vue'
import SelectField from '@/base/SelectField'
import {
  getQuestionDisplayType,
  QUESTION_DISPLAY_TYPES,
} from '@/modules/TreatmentPlan/constants/service-question-types'
import { QUESTION_TYPE } from '@/modules/TreatmentPlan/constants/enums'
import { range } from '@/utils/lodash-utils'
import { calculateBaseNumber } from '@/modules/TreatmentPlan/utils/teeth'
import DropdownQuestion from './QuestionTypes/DropdownQuestion'
import CheckboxQuestion from './QuestionTypes/CheckboxQuestion'

const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
  answer: {
    type: [String, Boolean, Number, Object, Array],
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  selectedTeeth: {
    type: Array,
    default: () => [],
  },
  selectedRegions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['set-answer'])

const questionDisplayType = computed(() => {
  return getQuestionDisplayType(props.question.type)
})

const multipleItems = computed(() =>
  [QUESTION_TYPE.SIMPLE_MULTIPLE, QUESTION_TYPE.PER_QUADRANT].includes(props.question.type)
)

const needsBaseCount = computed(() => {
  return (
    props.question.type === QUESTION_TYPE.MULTIPLE && props.question.coefficient && props.answer
  )
})

const baseRange = computed(() => {
  let teethOrRegions

  if (props.selectedTeeth.length > 0) {
    teethOrRegions = props.selectedTeeth.map(Number)
  } else if (props.selectedRegions.length > 0) {
    teethOrRegions = props.selectedRegions.flatMap((region) => region.numbers || [])
  } else {
    return []
  }

  if (!teethOrRegions || teethOrRegions.length === 0) return []

  return range(calculateBaseNumber(teethOrRegions), teethOrRegions.length + 1)
})

const baseUnitValue = computed(() => {
  if (!props.answer || typeof props.answer !== 'object') return null
  return props.answer.unit || baseRange.value?.[0] || null
})

const handleSetAnswer = (value) => {
  if (
    props.question.type === QUESTION_TYPE.SIMPLE_MULTIPLE ||
    props.question.type === QUESTION_TYPE.PER_QUADRANT
  ) {
    const arrayValue = Array.isArray(value) ? value : []
    const validatedValue = arrayValue.length > 0 ? arrayValue : null
    emit('set-answer', props.question.id, validatedValue)
    return
  }

  const resolvedItem =
    typeof value === 'object' && value !== null
      ? value
      : props.question.items?.find((item) => item.id === value)

  if (resolvedItem) {
    if (props.question.type === QUESTION_TYPE.MULTIPLE && props.question.coefficient) {
      emit('set-answer', props.question.id, {
        id: resolvedItem.id,
        price: resolvedItem.price || 0,
      })
    } else {
      emit('set-answer', props.question.id, resolvedItem)
    }
  } else {
    emit('set-answer', props.question.id, value)
  }
}

const handleSetBaseUnit = (unit) => {
  if (!props.answer) return
  const updatedAnswer = {
    ...props.answer,
    unit,
  }
  emit('set-answer', props.question.id, updatedAnswer)
}

watch([baseRange, () => props.answer], ([newRange, answer]) => {
  if (!needsBaseCount.value) return
  if (!newRange?.length) return
  if (!answer) return
  if (!answer.unit) {
    handleSetBaseUnit(newRange[0])
  } else if (!newRange.includes(answer.unit)) {
    handleSetBaseUnit(newRange[0])
  }
})
</script>

<style lang="scss" scoped>
.question-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.base-count-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-top: $spacing-sm;
  padding: $spacing-md;
  border-radius: $radius-sm;
}
</style>
