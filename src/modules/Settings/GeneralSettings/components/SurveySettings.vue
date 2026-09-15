<template>
  <div class="relative-position q-pa-md">
    <QForm>
      <!-- API Key Section -->
      <div class="q-mb-lg">
        <QInput
          v-model="form.apiKey"
          label="کد دسترسی پرس لاین (API Key)"
          type="textarea"
          autogrow
          outlined
          clearable
          :error="!!errors?.apiKey ?? null"
          :error-message="errors?.apiKey"
          @update:model-value="(e) => handleChange('apiKey', e)"
        />
      </div>

      <!-- Survey Settings Table -->
      <QTable
        flat
        bordered
        class="quasar-table q-mb-md"
        :rows="form?.statuses || []"
        :columns="columns"
        row-key="id"
        separator="vertical"
        :no-data-label="null"
        :pagination="pagination"
      >
        <template #body-cell-status="props">
          <QTd :props="props">
            <div class="text-center">{{ getStatusTitle(props.row.id) }}</div>
          </QTd>
        </template>

        <template #body-cell-survey="props">
          <QTd :props="props">
            <div class="q-pa-md">
              <QSelectField
                v-model="props.row.surveyId"
                :options="surveyOptions"
                map-options
                emit-value
                option-label="title"
                option-value="id"
                outlined
                @update:model-value="(e) => handleChange('surveyId', e, props.rowIndex)"
              />
            </div>
          </QTd>
        </template>

        <template #body-cell-auto="props">
          <QTd :props="props" class="text-center">
            <QToggle v-model="props.row.autoSendMsg" />
          </QTd>
        </template>

        <template #body-cell-actions="props">
          <QTd :props="props">
            <div>
              <QBtn icon="delete" color="negative" flat fab-mini @click="removeItem(props.row)" />
            </div>
          </QTd>
        </template>
      </QTable>

      <!-- Add Button -->
      <QBtnDropdown color="primary" label="+ افزودن" rounded>
        <QList>
          <QItem
            v-for="item in allFlattenedStatuses"
            :key="item.value"
            clickable
            :disable="!availableItems.some((a) => a.value === item.value)"
            @click="addItem(item)"
          >
            <QItemSection>{{ item.title }}</QItemSection>
          </QItem>
        </QList>
      </QBtnDropdown>
    </QForm>

    <QInnerLoading :showing="getSurveyLoading || isPending">
      <QSpinnerTail color="primary" size="2em" />
    </QInnerLoading>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeMount } from 'vue'
import { useApiGetSettings, useApiGetStatuses, useApiSaveSetting } from '@/modules/Settings'
import { findStatusObject } from '@/utils/find-user-status'
import { flattenStatusObject } from '@/utils/flatten-object'
import { useSurveyListQuery } from '@/modules/Survey/SurveyList/query'
import { array, boolean, number, object, string } from 'yup'
import useYup from '@/composables/use-yup'
import { cloneDeep } from '@/utils/lodash-utils'
import QSelectField from '@/components/Form/QSelectField'
import { useQueryClient } from '@tanstack/vue-query'
import { Notif } from '@/data/services/notification-service'

const queryClient = useQueryClient()
const props = defineProps(['submit', 'refresh'])
const emits = defineEmits(['afterSubmit', 'afterRefresh'])
const pagination = ref({
  rowsPerPage: 10,
})

const form = ref({
  apiKey: '',
  statuses: [],
})

const filters = ref({ per_page: 10 })

const { data: statusData, refetch: refetchStatuses } = useApiGetStatuses()
const {
  data: surveys,
  isLoading: getSurveyLoading,
  refetch: refetchSurveySettings,
} = useApiGetSettings('survey')

const { data: surveyList, refetch: refetchSurveyList } = useSurveyListQuery(filters.value)

const userStatuses = computed(() => statusData.value || {})
const surveyOptions = computed(() => surveyList.value?.items || [])
const allFlattenedStatuses = computed(() => flattenStatusObject(userStatuses.value))

const availableItems = computed(() => {
  return allFlattenedStatuses.value.filter(
    (item) => !form.value.statuses.some((s) => s.id === item.value)
  )
})
const validationSchema = object().shape({
  apiKey: string().required('فیلد Api Key ضروری می باشد'),
  statuses: array().of(
    object().shape({
      id: number().required(),
      surveyId: number().nullable(),
      autoSendMsg: boolean().default(false),
    })
  ),
})
const { validate, validateAt, errors } = useYup(validationSchema)

const handleChange = (field, value, index = null) => {
  if (index !== null && surveys.value.statuses[index]) {
    form.value.statuses[index][field] = value
    validateAt(`statuses[${index}].${field}`, value)
  } else {
    form.value[field] = value
    validateAt(field, value)
  }
}
// Helpers
const getStatusTitle = (id) => {
  return findStatusObject(id, userStatuses.value)?.title || '—'
}

const addItem = (item) => {
  if (form.value.statuses.some((s) => s.id === item.value)) return
  form.value.statuses.push({
    id: item.value,
    surveyId: null,
    autoSendMsg: false,
  })
}

const removeItem = (row) => {
  const index = form.value.statuses.findIndex((r) => r.id === row.id)
  if (index !== -1) form.value.statuses.splice(index, 1)
}
const columns = [
  {
    name: 'status',
    label: 'وضعیت',
    field: (row) => getStatusTitle(row.id),
    align: 'center',
    classes: 'text-center',
    style: 'min-width: 150px;',
  },
  {
    name: 'survey',
    label: 'نظرسنجی',
    field: 'surveyId',
    align: 'center',
    classes: 'text-center',
    style: 'min-width: 200px;',
  },
  {
    name: 'auto',
    label: 'ارسال خودکار',
    field: 'autoSendMsg',
    align: 'center',
    classes: 'text-center',
    style: 'min-width: 100px;',
  },
  {
    name: 'actions',
    label: 'عملیات',
    align: 'center',
    classes: 'text-center',
    style: 'min-width: 80px;',
  },
]
const refreshData = () => {
  form.value = { apiKey: '', statuses: [] }
  queryClient.invalidateQueries({ queryKey: ['setting', 'survey'] })
  Notif.success('لیست بروزرسانی شد')
}
const { mutate, isPending } = useApiSaveSetting('survey')
const saveData = async () => {
  const { isValid, payload } = await validate(form.value)
  if (!isValid) return
  mutate(
    {
      key: 'survey',
      body: payload,
    },
    {
      onSuccess: (res) => {
        Notif.success(res.message)
        refetchStatuses()
        refetchSurveySettings()
      },
    }
  )
  emits('afterSubmit')
}
watch(
  () => props.refresh,
  (val) => {
    if (val) {
      refreshData()
      refetchStatuses()
      refetchSurveyList()
      emits('afterRefresh')
    }
  }
)
watch(
  () => props.submit.value,
  (val) => {
    if (val) saveData()
  }
)
onBeforeMount(() => {
  form.value.apiKey = cloneDeep(surveys.value?.apiKey)
  form.value.statuses = cloneDeep(surveys.value?.statuses)
})
</script>
<style scoped lang="scss">
::v-deep(.q-table__tbody .q-tr) {
  vertical-align: middle;
  height: 60px;
}

::v-deep(.q-td) {
  vertical-align: middle;
  padding: 8px 12px;
}
</style>
