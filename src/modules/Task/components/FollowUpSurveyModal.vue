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

    <div v-else-if="isQuestionsError" class="follow-up-survey__state">
      <QImg :src="noData" loading="lazy" width="250px" />
      <Typography variant="body" size="3" :color="isSurveyNotFound ? 'grey' : 'red'">
        {{ surveyErrorMessage }}
      </Typography>
      <Button
        v-if="isRetryableSurveyError"
        variant="outline"
        color="light-blue"
        type="button"
        text="تلاش مجدد"
        :is-loading="isQuestionsFetching"
        @click="refetchQuestions"
      />
    </div>

    <div v-else-if="questions.length === 0" class="follow-up-survey__state">
      <Typography variant="body" size="3" color="grey">نظرسنجی برای این وظیفه یافت نشد.</Typography>
    </div>

    <QForm v-else class="follow-up-survey">
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

        <div v-else-if="getQuestionType(question) === 'time'" class="row">
          <div class="col-12 col-md-4">
            <NumberField
              :model-value="answers[question.key]"
              variant="outline"
              min="0"
              suffix="دقیقه"
              @update:model-value="(e) => onTimeAnswerInput(question, e)"
            />
          </div>
        </div>

        <div v-else-if="getQuestionType(question) === 'number' && !isRatingQuestion(question)">
          <TextField
            variant="outline"
            type="number"
            :model-value="answers[question.key]"
            @update:model-value="(e) => (answers[question.key] = e)"
          />
        </div>

        <div v-else-if="getQuestionType(question) === 'number'">
          <NumericScoreInput v-model="answers[question.key]" :max="question.max ?? 10" />
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
import NumericScoreInput from '@/components/Form/NumericScoreInput'
import noData from '@/assets/images/noData.svg'
import NumberField from '@/components/Form/NumberField'

const emits = defineEmits(['close', 'submitted'])
const props = defineProps({
  visible: { type: Boolean, default: false },
  task: { type: Object, default: null },
})

const { visible, task } = toRefs(props)
const queryClient = useQueryClient()

const taskId = computed(() => task.value?.id ?? undefined)

const {
  data: questionsData,
  isLoading: isQuestionsLoading,
  isFetching: isQuestionsFetching,
  isError: isQuestionsError,
  error: questionsError,
  refetch: refetchQuestions,
} = useGetFollowUpsSurvey(taskId, {
  enabled: () => visible.value && !!taskId.value,
  retry: (failureCount, error) => error?.response?.status !== 404 && failureCount < 1,
})

const isSurveyNotFound = computed(() => questionsError.value?.response?.status === 404)

const isRetryableSurveyError = computed(() => isQuestionsError && !isSurveyNotFound.value)

const surveyErrorMessage = computed(() => {
  if (isSurveyNotFound.value) {
    return 'نظرسنجی برای این وظیفه ثبت نشده است.'
  }
  if (questionsError.value?.code === 'ECONNABORTED') {
    return 'زمان دریافت اطلاعات نظرسنجی به پایان رسید. لطفاً دوباره تلاش کنید.'
  }
  return (
    questionsError.value?.response?.data?.message ||
    questionsError.value?.message ||
    'خطا در دریافت اطلاعات نظرسنجی. لطفاً دوباره تلاش کنید.'
  )
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
  if (type === 'time') return 'time'
  return 'text'
}

const onTimeAnswerInput = (question, value) => {
  answers[question.key] =
    typeof value === 'number' ? Math.max(0, value) : String(value ?? '').replace(/-/g, '')
}

const isRatingQuestion = (question) => {
  const max = question.max ?? 10
  return max <= 10 && !question.unit
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
    switch (type) {
      case 'time': {
        shape[question.key] = yupNumber()
          .typeError('زمان باید عدد باشد')
          .integer('زمان باید عدد صحیح باشد')
          .min(0, 'زمان نمی‌تواند منفی باشد')
          .nullable()
          .notRequired()
        break
      }
      case 'number': {
        shape[question.key] = isRatingQuestion(question)
          ? yupNumber()
              .typeError('امتیاز باید عدد باشد')
              .integer('امتیاز باید عدد صحیح باشد')
              .min(question.min ?? 1, `امتیاز باید حداقل ${question.min ?? 1} باشد`)
              .max(question.max ?? 10, `امتیاز حداکثر ${question.max ?? 10} است`)
              .nullable()
              .notRequired()
          : yupNumber()
              .typeError('زمان انتظار باید عدد باشد')
              .integer('عدد صحیح')
              .min(0)
              .nullable()
              .notRequired()
        break
      }
      case 'choice': {
        const values = (question.options ?? []).map((option) => getOptionValue(option))
        shape[question.key] = yupString()
          .typeError('گزینه انتخابی معتبر نیست')
          .oneOf(values, 'گزینه انتخابی معتبر نیست')
          .nullable()
          .notRequired()
        break
      }
      default: {
        shape[question.key] = yupString().nullable().notRequired()
      }
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
      const type = getQuestionType(question)
      answers[question.key] =
        (type === 'number' || type === 'time') && !Number.isNaN(Number(value))
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
  const answersPayload = {}
  questions.value.forEach((question) => {
    const value = answers[question.key]
    if (value !== undefined && value !== null && value !== '') {
      answersPayload[question.key] = value
    }
  })

  const { isValid } = await validate(answersPayload)
  if (!isValid) return

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

  &__state {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-md;
    padding: $spacing-xl $spacing-md;
    text-align: center;
  }
}
</style>
