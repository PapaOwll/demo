<template>
  <QCard class="q-pa-md">
    <Typography variant="heading" size="h6" weight="bold">لیست نظر سنجی کاربر</Typography>
    <QBtn
      :disable="isLoading"
      :loading="isUserSurveyLoading"
      round
      outline
      size="sm"
      @click="updateTable"
    >
      <IconReload size="18" />
    </QBtn>
    <QTable
      :rows="userSurvey"
      :columns="tableColumns"
      :no-data-label="null"
      row-key="id"
      class="quasar-table"
      :rows-per-page-options="[0]"
    >
      <template #no-data>
        <QSpinnerTail v-if="isLoading" class="no-data" color="primary" size="lg" />
        <div v-else class="column justify-center items-center q-mx-auto">
          <img src="@/assets/images/noData.svg" alt="no-data" />
          <span class="text-h6 text-grey-7">اطلاعاتی یافت نشد</span>
        </div>
      </template>

      <template #body-cell-action="scope">
        <QTd :props="scope">
          <div class="flex justify-end items-center q-gutter-xs">
            <QBtn
              color="teal"
              outline
              icon="question_mark"
              size="sm"
              round
              @click="showQuestions(scope.row)"
            >
              <QTooltip>سوالات</QTooltip>
            </QBtn>
            <QBtn
              color="primary"
              outline
              icon="preview"
              size="sm"
              round
              @click="openSurvey(scope.row)"
            >
              <QTooltip>پیش نمایش</QTooltip>
            </QBtn>
            <QBtn
              color="warning"
              outline
              icon="check"
              size="sm"
              round
              @click="showAnswers(scope.row)"
            >
              <QTooltip>جواب نظر سنجی</QTooltip>
            </QBtn>
          </div>
        </QTd>
      </template>
    </QTable>
    <QBtn
      v-if="!isLoading"
      square
      outline
      color="primary"
      class="q-mx-auto flex"
      :loading="isUserSurveyFetchingNextPage"
      :disable="!isUserSurveyFetchingNextPage"
      :label="isUserSurveyHasNextPage ? 'مشاهده بیشتر' : 'مورد دیگری وجود ندارد'"
      @click="loadNextPage"
    />
  </QCard>
  <SurveyQuestions
    :visible="surveyQuestionVisible"
    :edit-value="questions"
    @close="toggleQuestionModalModal"
  />
  <QDialog v-model="surveyResultVisible" @close="toggleResultModalModal">
    <QCard class="result-dialog">
      <div class="form-header">
        <h5>جواب های نظرسنجی</h5>
        <QBtn round flat @click="toggleResultModalModal">
          <IconSquareRoundedLetterX />
        </QBtn>
      </div>
      <QSeparator spaced="md" color="secondary" />
      <div class="row q-pa-md">
        <ul>
          <li v-for="item in results" :key="item.id" class="q-my-sm full-width">
            {{ JSON.stringify(item.response) }}
          </li>
        </ul>
      </div>
    </QCard>
  </QDialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import Typography from '@/base/Typography'
import { useSurveyListInfinityQuery } from '@/modules/Survey/SurveyList/query'
import { useQueryClient } from '@tanstack/vue-query'
import { IconReload, IconSquareRoundedLetterX } from '@tabler/icons-vue'
import { useSurveyResultsInfinityQuery } from '@/modules/Survey/ResultsList/query'
import useDisclosure from '@/composables/use-disclosure'
import SurveyQuestions from '@/modules/Survey/SurveyList/components/SurveyQuestions'
import { useQuasar } from 'quasar'
import { Notif } from '@/data/services/notification-service'

const $q = useQuasar()
const props = defineProps({
  propData: Number,
  tabId: Number,
})
const queryClient = useQueryClient()
const userSurveysFilter = ref({
  'filter[results.user_id]': props.propData,
})
const questions = ref(null)
const userSurveyResultFilter = ref({})
const tableColumns = [
  {
    align: 'left',
    label: '#',
    name: '#',
    field: 'id',
    type: 'text',
  },
  {
    align: 'left',
    label: 'کدیکتا',
    name: 'surveyId',
    field: 'surveyId',
    type: 'text',
  },
  {
    align: 'left',
    label: 'عنوان',
    name: 'title',
    field: 'title',
    type: 'text',
  },
  {
    align: 'left',
    name: 'action',
    field: '',
  },
]

const isUserSurveyEnabled = computed(() => !!props.propData)
const {
  data: userSurveyData,
  isLoading: isUserSurveyLoading,
  fetchNextPage: userSurveyFetchNextPage,
  isFetchingNextPage: isUserSurveyFetchingNextPage,
  hasNextPage: isUserSurveyHasNextPage,
} = useSurveyListInfinityQuery(userSurveysFilter, { enabled: isUserSurveyEnabled })

const userSurvey = computed(
  () =>
    userSurveyData.value?.pages?.flatMap((pageData) => {
      return pageData?.data?.items
    }) || []
)

const {
  data: surveyResult,
  refetch,
  isLoading: getResultsLoading,
} = useSurveyResultsInfinityQuery(userSurveyResultFilter)

const results = computed(() => {
  const items = surveyResult.value?.pages?.flatMap((pageData) => pageData?.data?.items) || []

  return items.map((item) => {
    try {
      return typeof item === 'string' ? JSON.parse(item) : item
    } catch {
      return item
    }
  })
})

const isLoading = computed(
  () => isUserSurveyLoading.value || isUserSurveyFetchingNextPage.value || getResultsLoading.value
)

const [surveyQuestionVisible, { toggle: toggleQuestionModalModal }] = useDisclosure()
const [surveyResultVisible, { toggle: toggleResultModalModal }] = useDisclosure()

const loadNextPage = () => {
  if (!isUserSurveyHasNextPage.value) return
  userSurveyFetchNextPage()
}

const updateTable = async () => {
  await queryClient.invalidateQueries({ queryKey: ['survey', 'all-surveys', userSurveysFilter] })
  Notif.success('لیست بروزرسانی شد')
}

const openSurvey = (survey) => {
  window.open(survey.preview, '_blank')
}
const showQuestions = (survey) => {
  questions.value = survey.questions
  toggleQuestionModalModal()
}

const showAnswers = async (survey) => {
  userSurveyResultFilter.value = {
    'filter[user_id]': props.propData,
    'filter[survey_id]': survey?.id,
  }

  $q.loading.show({
    message: 'در حال بارگذاری نتایج نظرسنجی...',
  })

  try {
    await refetch()
    toggleResultModalModal()
  } catch {
    Notif.error('خطا در بارگذاری نتایج نظرسنجی')
  } finally {
    $q.loading.hide()
  }
}
</script>
<style scoped lang="scss">
.no-data {
  width: 100%;
  height: 100px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
.result-dialog {
  min-width: 550px;
  padding: 24px;
}
</style>
