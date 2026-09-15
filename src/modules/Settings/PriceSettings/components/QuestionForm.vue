<template>
  <Modal
    :model-value="visible"
    :title="questionData?.id ? 'ویرایش عنوان جدید' : 'افزودن عنوان جدید'"
    transition-show="jump-down"
    transition-hide="jump-up"
    width="500px"
    @close="closeForm"
  >
    <QForm @submit.prevent="submitForm">
      <div class="row q-col-gutter-md q-my-md">
        <div class="col-md-6 col-12">
          <TextField
            :model-value="questionData?.title"
            variant="outline"
            clearable
            label="عنوان"
            :error="!!errors?.title"
            :error-message="errors?.title"
            @update:model-value="(e) => handleChange('title', e)"
          />
        </div>
        <div class="col-md-6 col-12">
          <SelectField
            :model-value="questionData?.type"
            map-options
            variant="outline"
            :options="questionTypeEnumsList"
            clearable
            label="نوع"
            option-label="title"
            option-value="id"
            :error="!!errors?.type"
            :error-message="errors?.type"
            @update:model-value="(e) => handleTypeChange(e?.id)"
          />
        </div>
        <div
          v-if="
            questionData.type === QUESTION_TYPE.MULTIPLE ||
            questionData.type === QUESTION_TYPE.PER_UNIT
          "
          class="col-md-6 col-12"
        >
          <Checkbox
            :model-value="questionData.coefficient"
            label="ضریب پایه"
            flip
            @update:model-value="(e) => handleChange('coefficient', e)"
          />
          <div v-if="errors?.coefficient">
            <Typography variant="caption" color="red">
              {{ errors?.coefficient }}
            </Typography>
          </div>
        </div>
        <div v-if="questionData.type === QUESTION_TYPE.SIMPLE_MULTIPLE" class="col-12">
          <Banner
            type="neutral"
            title='نوع "چندگانه ساده" بدون گزینه ضریب پایه است. برای ضریب پایه، از نوع "چند گزینه به ازای دندان" استفاده کنید.'
          />
        </div>
      </div>

      <!-- Preview of default items that will be created -->
      <div v-if="questionData?.type && !questionData?.id" class="q-my-md">
        <QSeparator />
        <div class="q-mt-md">
          <Typography variant="heading" size="h6">آیتم‌های پیش‌فرض که ایجاد خواهند شد:</Typography>
          <div class="row q-col-gutter-sm">
            <div v-for="(item, index) in previewItems" :key="index" class="col-12">
              <QCard flat bordered class="q-pa-sm">
                <div class="row q-col-gutter-sm items-center">
                  <div v-if="currentConfig?.fields?.includes('title')" class="col">
                    <TextField
                      :model-value="item.title"
                      variant="outline"
                      size="sm"
                      label="عنوان"
                      readonly
                    />
                  </div>
                  <div v-if="currentConfig?.fields?.includes('price')" class="col">
                    <TextField
                      :model-value="item.price"
                      variant="outline"
                      size="sm"
                      label="قیمت"
                      type="number"
                      readonly
                    />
                  </div>
                </div>
              </QCard>
            </div>
          </div>
        </div>
      </div>

      <div class="row justify-center items-center q-gutter-md">
        <Button
          variant="outline"
          color="amber"
          text="انصراف"
          type="button"
          :is-loading="loadingState"
          @click="closeForm"
        />
        <Button color="primary" text="ثبت" type="submit" :is-loading="loadingState" />
      </div>
    </QForm>
  </Modal>
</template>

<script setup>
import { computed, ref, toRefs } from 'vue'
import { object, string, number, boolean } from 'yup'
import { useCreateQuestionMutation, useUpdateQuestionMutation } from '@/modules/Settings/query'
import { useQueryClient } from '@tanstack/vue-query'
import { useGetEnumsQuery } from '@/modules/User/query'
import useYup from '@/composables/use-yup'
import { useQuestionTypes } from '@/composables/use-question-types'
import { QUESTION_TYPE } from '@/modules/TreatmentPlan/constants/enums'
import Modal from '@/base/Modal'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import TextField from '@/base/TextField'
import SelectField from '@/base/SelectField'
import Checkbox from '@/base/Checkbox'
import Banner from '@/base/Banner'
import { Notif } from '@/data/services/notification-service'

const queryClient = useQueryClient()
const props = defineProps({
  visible: Boolean,
  editValue: Object,
})
const { visible } = toRefs(props)
const emits = defineEmits(['close', 'updateTable', 'submit'])
const questionEnum = ref('ServeIndustryQuestionTypeEnum')
const updatedQuestionData = ref(null)

const { initializeItems, getTypeConfig } = useQuestionTypes()

const initialData = computed(() => props.editValue?.question || {})
const questionData = computed(() => updatedQuestionData.value || initialData.value || {})
const enabled = computed(() => !!visible.value)
const { data: questionTypeEnums } = useGetEnumsQuery(questionEnum, { enabled })

const currentConfig = computed(() => getTypeConfig(questionData.value?.type))

const previewItems = computed(() => {
  if (!questionData.value?.type || questionData.value?.id) return []

  const tempQuestion = {
    ...questionData.value,
    serveIndustryId: props.editValue?.serve?.id,
    items: [],
  }

  return initializeItems(tempQuestion)
})

const validationSchema = object().shape({
  title: string().required('لطفا عنوان سوال را وارد کنید'),
  type: number().required('لطفا نوع عنوان را انتخاب کنید'),
  templateId: number(),
  serveIndustryId: number(),
  coefficient: boolean().default(false),
})
const { validate, validateAt, errors } = useYup(validationSchema)

const handleChange = (field, value) => {
  updatedQuestionData.value = { ...questionData.value, [field]: value }
  validateAt(field, value)
}

const handleTypeChange = (typeId) => {
  handleChange('type', typeId)
}

const closeForm = () => {
  emits('close')
  updatedQuestionData.value = null
}

const questionTypeEnumsList = computed(() =>
  questionTypeEnums.value
    ? Object.keys(questionTypeEnums.value).map((it) => ({
        title: questionTypeEnums.value[it]?.faTitle,
        id: questionTypeEnums.value[it]?.id,
      }))
    : []
)

const { mutate: createQuestion, isPending: createQuestionPending } = useCreateQuestionMutation()
const { mutate: updateQuestion, isPending: updateQuestionPending } = useUpdateQuestionMutation()
const loadingState = computed(() => createQuestionPending.value || updateQuestionPending.value)

const submitForm = async () => {
  const { isValid, payload } = await validate(questionData.value)
  const data = { ...payload, serveIndustryId: props.editValue?.serve?.id }
  if (!isValid) return

  if (questionData.value?.id) {
    updateQuestion(
      {
        id: questionData.value?.id,
        ...data,
      },
      {
        onSuccess: (response) => {
          queryClient.invalidateQueries({ queryKey: ['serves'] })
          Notif.success(response.message)
          closeForm()
        },
      }
    )
  } else {
    const perTeeth = []
    props.editValue?.serve?.question?.forEach((q) => {
      if (q?.type === QUESTION_TYPE.PER_TEETH) perTeeth.push(q)
    })
    if (perTeeth.length > 1 && payload.type === QUESTION_TYPE.PER_TEETH) {
      Notif.error('در هر خدمت فقط یک "به ازای هر دندان" می تواند وجود داشته باشد!')
    } else {
      handleChange('templateId', null)

      const questionWithItems = {
        ...data,
        items: initializeItems({
          ...data,
          id: null,
          items: [],
        }),
      }

      createQuestion(questionWithItems, {
        onSuccess: (response) => {
          queryClient.invalidateQueries({ queryKey: ['serves'] })
          Notif.success(response.message)
          closeForm()
        },
      })
    }
  }
}
</script>
