<template>
  <div class="row justify-start items-start q-col-gutter-xs">
    <span class="q-item__label text-subtitle1">شماره موبایل های جدید قابل درج</span>
    <span class="q-item__label text-subtitle2">({{ props.numbers?.success?.total }} شماره)</span>
    <div class="col-md-12 col-12">
      <QScrollArea :thumb-style="thumbStyle" class="numbers-card">
        <QChip
          v-for="(number, index) in props.numbers?.success?.items"
          :key="index"
          class="q-mx-xs"
          color="secondary"
          outline
          rounded
        >
          {{ number.mobile }}
        </QChip>
      </QScrollArea>
    </div>
  </div>
  <div class="row justify-start items-start q-my-md">
    <span class="q-item__label text-subtitle1">شماره موبایل های تکراری</span>
    <span class="q-item__label text-subtitle2">({{ props.numbers?.duplicates?.total }} شماره)</span>
    <div class="col-md-12 col-12">
      <QScrollArea :thumb-style="thumbStyle" class="numbers-card">
        <QChip
          v-for="(number, index) in props.numbers?.duplicates?.items"
          :key="index"
          class="q-mx-xs"
          color="secondary"
          outline
          rounded
        >
          {{ number.mobile }}
        </QChip>
      </QScrollArea>
    </div>
  </div>
  <QForm @submit.prevent="submit">
    <div class="row q-col-gutter-md">
      <div class="col-md-6 col-12">
        <QSelect
          outlined
          clearable
          label="شیوه آشنایی *"
          map-options
          option-label="faTitle"
          option-value="id"
          :options="introductionMethods?.items"
          :model-value="batchImportForm?.methodOfIntroduction"
          :error="errors?.methodOfIntroduction ? !!errors?.methodOfIntroduction : null"
          :error-message="errors?.methodOfIntroduction"
          @update:model-value="(e) => handleChange('methodOfIntroduction', e)"
        />
      </div>
      <div class="col-md-6 col-12">
        <PersianDate
          :model-value="batchImportForm?.createdAt"
          :disable="loading"
          label="تاریخ ثبت نام"
          @update:model-value="(e) => handleChange('createdAt', e)"
        />
      </div>
      <div class="col-md-12 col-12">
        <QSelect
          :model-value="batchImportForm?.campaign"
          label="کمپین"
          clearable
          outlined
          map-options
          :options="campaigns?.items"
          option-label="title"
          option-value="id"
          @update:model-value="(e) => handleChange('campaign', e?.id)"
        />
      </div>
      <div class="col-md-12 col-12 flex justify-end">
        <QBtn
          outline
          type="secondary"
          class="q-ml-md"
          :loading="loading || isPending"
          @click="back"
        >
          مرحله قبل
        </QBtn>
        <QBtn color="primary" type="submit" :loading="loading || isPending">ثبت اطلاعات</QBtn>
      </div>
    </div>
  </QForm>
</template>

<script setup>
import { ref } from 'vue'
import { object, string, number } from 'yup'
import useYup from '@/composables/use-yup'
import { useGetMethodOfIntroductionsQuery } from '@/modules/User/query'
import { useGetCampaignListQuery, useImportUsersMutation } from '@/modules/Ads/query'
import PersianDate from '@/components/Form/PersianDate'
import { Notif } from '@/data/services/notification-service'

const props = defineProps(['numbers', 'fileId'])
const emits = defineEmits(['next', 'result', 'back'])
const thumbStyle = {
  width: '0px',
}
const loading = ref(false)
const batchImportForm = ref(null)
const { data: introductionMethods } = useGetMethodOfIntroductionsQuery()
const { data: campaigns } = useGetCampaignListQuery()

const validationSchema = object().shape({
  fileId: string(),
  numbers: string(),
  methodOfIntroduction: object()
    .shape({
      id: number(),
    })
    .required('شیوه آشنایی الزامیست')
    .typeError('شیوه آشنایی الزامیست')
    .test('is-valid-id', 'شیوه آشنایی الزامیست', (value) => {
      return value && value.id
    }),
  createdAt: string(),
  campaign: string(),
})

const { validate, validateAt, errors } = useYup(validationSchema)
const handleChange = (field, value) => {
  batchImportForm.value = { ...batchImportForm.value, [field]: value }
  validateAt(field, value)
}
const concatNumbers = () => {
  const successItems = props.numbers?.success?.items ?? []
  const duplicateItems = props.numbers?.duplicates?.items ?? []
  return [...successItems.map((it) => it.mobile), ...duplicateItems.map((it) => it.mobile)]
}

const back = () => {
  emits('back', true)
}
const { mutate: importUsers, isPending } = useImportUsersMutation()
const submit = async () => {
  const { isValid, payload } = await validate(batchImportForm.value)
  if (!isValid) return
  const data = {
    ...payload,
    fileId: props.fileId ?? undefined,
    campaignId: payload?.campaign ?? null,
    methodOfIntroduction: payload?.methodOfIntroduction?.id ?? null,
  }

  if (!props.fileId) {
    data.numbers = concatNumbers()
  }

  importUsers(
    { ...data },
    {
      onSuccess: (response) => {
        Notif.success(response?.message)
        emits('next', true)
        emits('result', response.data)
      },
    }
  )
}
</script>
<style scoped lang="scss">
.numbers-card {
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  padding: 0.5rem;
  height: 150px;
}
</style>
