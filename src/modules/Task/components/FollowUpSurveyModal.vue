<template>
  <BaseModal
    :model-value="visible"
    backdrop-filter="blur(1px)"
    :title="questionTitle"
    width="1000px"
    height="100dvh"
    transition-show="slide-left"
    transition-hide="slide-right"
    transition-duration="700"
    @close="closeModal"
  >
    <QInnerLoading v-if="isQuestionsLoading" :showing="isQuestionsLoading">
      <QSpinnerTail color="primary" size="40" />
    </QInnerLoading>

    <QForm v-if="!isQuestionsLoading" class="follow-up-survey">
      <div v-for="question in questions" :key="question.key" class="follow-up-survey__question">
        <Typography variant="body" size="2">
          {{ question.title }}
        </Typography>
        <div v-if="errors?.[question.key]" class="text-caption text-red">
          {{ errors?.[question.key] }}
        </div>

        <div v-if="getQuestionType(question) === 'choice'">
          <Radio
            v-for="option in question.options"
            :key="getOptionValue(option)"
            v-model="answers[question.key]"
            :val="getOptionValue(option)"
            :label="getOptionLabel(option)"
            class="q-mr-md"
          />
        </div>

        <div v-else-if="getQuestionType(question) === 'number'">
          <QRating
            v-model="answers[question.key]"
            :max="question.max ?? 10"
            icon="star_border"
            icon-selected="star"
            icon-half="star_half"
            color="primary"
            size="3em"
          />
        </div>

        <div v-else>
          <TextField
            variant="outline"
            type="textarea"
            :rows="2"
            :model-value="answers[question.key]"
            @update:model-value="(e) => (answers[question.key] = e)"
          />
        </div>

        <div
          v-if="question.showAverage && numericAverage !== null"
          class="q-mt-sm text-caption text-primary"
        >
          میانگین امتیازها: {{ numericAverage }}
        </div>
      </div>

      <div class="row justify-end q-gutter-sm q-mt-md">
        <Button
          variant="outline"
          color="red"
          text="جواب نداد"
          type="button"
          :is-loading="isSubmitPending || isSubmitCallStatus"
          @click="onSelectCallRejected"
        />
        <Button
          variant="outline"
          color="light-blue"
          type="button"
          text="ثبت نظرسنجی"
          :is-loading="isSubmitPending || isSubmitCallStatus"
          @click="submitSurvey"
        />
      </div>
    </QForm>
  </BaseModal>
</template>

<script setup>
import { computed, reactive, toRefs, watch } from 'vue'
import { lazy, number as yupNumber, object, string as yupString } from 'yup'
import { useQueryClient } from '@tanstack/vue-query'
import {
  useSubmitFollowUpAnswers,
  useGetFollowUpsSurvey,
  useSetCallStatusMutation,
} from '@/modules/Task/query'
import useYup from '@/composables/use-yup'
import { camelCase } from '@/utils/lodash-utils'
import { confirmDialog, Notif } from '@/data/services/notification-service'
import BaseModal from '@/base/Modal'
import Button from '@/base/Button'
import Radio from '@/base/Radio'
import TextField from '@/base/TextField'
import Typography from '@/base/Typography'

const emits = defineEmits(['close', 'submitted'])
const props = defineProps({
  visible: { type: Boolean, default: false },
  task: { type: Object, default: null },
})

const { visible, task } = toRefs(props)
const queryClient = useQueryClient()

const taskId = computed(() => task.value?.id ?? undefined)

const { data: questionsData, isLoading: isQuestionsLoading } = useGetFollowUpsSurvey(taskId, {
  enabled: () => visible.value && !!taskId.value,
})

const questionTitle = computed(() => questionsData.value?.kindTitle || 'نظر سنجی بیمار')

const questions = computed(() => {
  const data = questionsData.value
  const items = Array.isArray(data) ? data : (data?.items ?? data?.questions ?? [])
  return items.map((question, index) => ({
    ...question,
    key: question.key ?? question.id ?? `question-${index}`,
  }))
})

const savedAnswers = computed(() => {
  const data = questionsData.value
  return data && !Array.isArray(data) && typeof data.answers === 'object' && data.answers !== null
    ? data.answers
    : null
})

const answers = reactive({})

const getQuestionType = (question) => {
  const type = question.type?.slug ?? question.type ?? question.questionType
  if (type === 'choice') return 'choice'
  if (type === 'number' || type === 'score' || type === 'rating') return 'number'
  return 'text'
}

const getOptionValue = (option) =>
  typeof option === 'object' ? (option.value ?? option.id) : option
const getOptionLabel = (option) =>
  typeof option === 'object' ? (option.label ?? option.title) : option

const numericQuestions = computed(() =>
  questions.value.filter((q) => q.showAverage && getQuestionType(q) === 'number')
)
const numericAverage = computed(() => {
  const answered = numericQuestions.value
    .map((q) => Number(answers[q.key]))
    .filter((v) => !Number.isNaN(v))
  if (answered.length === 0) return null
  return Math.round((answered.reduce((a, b) => a + b, 0) / answered.length) * 100) / 100
})

const surveySchema = lazy(() => {
  const shape = {}
  questions.value.forEach((question) => {
    const type = getQuestionType(question)
    if (type === 'number') {
      shape[question.key] = yupNumber()
        .typeError('امتیاز باید عدد باشد')
        .integer('امتیاز باید عدد صحیح باشد')
        .min(question.min ?? 1, `امتیاز باید حداقل ${question.min ?? 1} باشد`)
        .max(question.max ?? 10, `امتیاز حداکثر ${question.max ?? 10} است`)
        .nullable()
        .notRequired()
    } else if (type === 'choice') {
      const values = (question.options ?? []).map((option) => getOptionValue(option))
      shape[question.key] = yupString()
        .typeError('گزینه انتخابی معتبر نیست')
        .oneOf(values, 'گزینه انتخابی معتبر نیست')
        .nullable()
        .notRequired()
    } else {
      shape[question.key] = yupString().nullable().notRequired()
    }
  })
  return object().shape(shape)
})

const { validate, errors, resetErrors } = useYup(surveySchema)

const resetAnswers = () => {
  Object.keys(answers).forEach((key) => delete answers[key])
  resetErrors()
}

watch(visible, (value) => {
  if (value) {
    resetAnswers()
  }
})

watch(
  [questions, savedAnswers],
  () => {
    const saved = savedAnswers.value
    if (!saved) return
    questions.value.forEach((question) => {
      const value = saved[question.key] ?? saved[camelCase(question.key)]
      if (value === undefined || value === null || value === '') return
      answers[question.key] =
        getQuestionType(question) === 'number' && !Number.isNaN(Number(value))
          ? Number(value)
          : value
    })
  },
  { immediate: true }
)

const closeModal = () => {
  emits('close', false)
}

const validateQuery = async () => {
  await queryClient.invalidateQueries({ queryKey: ['task', 'all-tasks'] })
}

const { mutate: submitAnswers, isPending: isSubmitPending } = useSubmitFollowUpAnswers()
const { mutate: setCallStatus, isPending: isSubmitCallStatus } = useSetCallStatusMutation()

const onSelectCallRejected = () => {
  confirmDialog(
    'ثبت تماس ناموفق',
    'از ثبت تماس ناموفق/جواب نداد برای این کاربر اطمینان دارید؟',
    () =>
      setCallStatus(
        {
          taskId: taskId.value,
          data: { answered: false },
        },
        {
          onSuccess: (response) => {
            validateQuery()
            Notif.success(response.message)
            closeModal()
          },
        }
      )
  )
}

const submitSurvey = async () => {
  const { isValid } = await validate({ ...answers })
  if (!isValid) return

  const answersPayload = {}
  questions.value.forEach((question) => {
    const value = answers[question.key]
    if (value !== undefined && value !== null && value !== '') {
      answersPayload[question.key] = value
    }
  })

  const payload = { answers: answersPayload }

  submitAnswers(
    { taskId: taskId.value, payload },
    {
      onSuccess: (response) => {
        validateQuery()
        Notif.success(response?.message || 'نظرسنجی با موفقیت ثبت شد')
        emits('submitted')
        closeModal()
      },
    }
  )
}
</script>

<style scoped lang="scss">
.follow-up-survey {
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  &__question {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    border-bottom: 1px solid $default-border;
    padding-bottom: $spacing-sm;
  }
}
</style>
