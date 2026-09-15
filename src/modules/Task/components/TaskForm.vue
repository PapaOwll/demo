<template>
  <BaseModal
    :model-value="visible"
    backdrop-filter="blur(1px)"
    :title="isEditMode ? 'ویرایش وظیفه' : 'افزودن وظیفه'"
    width="720px"
    @close="closeForm"
    @before-show="onOpenForm"
  >
    <QForm class="task-form" @submit.prevent="submitForm">
      <div class="row q-col-gutter-sm">
        <div class="col-12 col-md-6">
          <UserSelectField
            :model-value="userTaskData.user?.id || props.prefilledUser?.id || userId"
            :display-label="
              userTaskData.user || props.prefilledUser
                ? `${(userTaskData.user || props.prefilledUser)?.firstName || ''} ${
                    (userTaskData.user || props.prefilledUser)?.name || ''
                  } / ${(userTaskData.user || props.prefilledUser)?.mobile || ''}`.trim()
                : null
            "
            :disable="isEditMode || isPrefilledMode"
            :error-message="errors?.user"
            :error="!!errors?.user"
            @update:model-value="(e) => handleChange('user', typeof e === 'object' ? e : { id: e })"
          />
        </div>
        <div class="col-12 col-md-6">
          <AdvisorSelect
            :model-value="typeof assignTo === 'object' ? assignTo?.id : assignTo"
            label="مسئول"
            :disable="isEditMode"
            :error-message="errors?.assignTo"
            :error="!!errors?.assignTo"
            show-role
            @update:model-value="(e) => handleChange('assignTo', e)"
          />
        </div>
        <div class="col-12 col-md-6">
          <TaskTypeSelect
            lazy
            :model-value="userTaskData.type?.id ?? userTaskData.type"
            :display-label="userTaskData.type?.title"
            label="نوع پیگیری"
            :disable="isEditMode"
            :error-message="errors?.typeId"
            :error="!!errors?.typeId"
            @update:model-value="(e) => handleChange('type', e ? { id: e } : null)"
          />
        </div>
        <div class="col-12 col-md-6">
          <QInnerLoading :showing="checkHolidayLoading">
            <QSpinnerTail color="primary" />
          </QInnerLoading>
          <div v-if="isClosed" />
          <PersianDate
            label="تاریخ سررسید"
            placeholder="YYYY/MM/DD"
            :model-value="userTaskData.dueDate"
            :loading="checkHolidayLoading"
            :disable="isEditMode || !assignTo"
            :error="errors?.dueDate ? !!errors?.dueDate : null"
            :error-message="errors?.dueDate"
            @update:model-value="(e) => handleChange('dueDate', e)"
          />
        </div>
        <div class="col-12 col-md-6">
          <TaskTimeRangeSelect
            :model-value="userTaskData.dueTime"
            :display-label="dueTimeDisplayLabel"
            label="زمان"
            :disable="isEditMode"
            :loading="checkHolidayLoading"
            :error-message="errors?.dueTime"
            :error="!!errors?.dueTime"
            @update:model-value="(e) => handleChange('dueTime', e)"
          >
            <template #option="scope">
              <QItem v-bind="scope.itemProps">
                <QItemSection>
                  <div class="row justify-between">
                    <p class="q-ml-auto" v-text="scope.opt.rawData?.faTitle" />
                    <p
                      class="task-form__count"
                      v-text="dueTimesCount[scope.opt.rawData?.start] ?? 0"
                    />
                  </div>
                </QItemSection>
              </QItem>
            </template>
          </TaskTimeRangeSelect>
        </div>
        <div class="col-12 col-md-6">
          <EnumSelect
            :model-value="userTaskData.priority?.id ?? userTaskData.priority"
            label="اولویت"
            enum-key="TaskPriorityEnum"
            clearable
            :error-message="errors?.priority"
            :error="!!errors?.priority"
            @update:model-value="(e) => handleChange('priority', e)"
          />
        </div>
        <div class="col-12">
          <TextField
            variant="outline"
            label="توضیحات"
            type="textarea"
            :rows="3"
            clearable
            :readonly="isEditMode"
            :model-value="userTaskData.description"
            @update:model-value="(e) => handleChange('description', e)"
          />
        </div>
        <div class="col-12 col-md-5">
          <Checkbox
            :model-value="userTaskData.status === 1"
            label="اتمام وظیفه"
            @update:model-value="(e) => handleChange('status', e ? 1 : 2)"
          />
        </div>
        <div class="col-12 col-md-7 task-form__actions">
          <Button
            variant="outline"
            color="red"
            text="انصراف"
            :is-loading="isTaskFetchLoading || isUpdateTaskPending || isCreateTaskPending"
            @click="closeForm"
          />
          <Button
            variant="outline"
            color="light-blue"
            text="ثبت"
            :is-loading="isTaskFetchLoading || isUpdateTaskPending || isCreateTaskPending"
          />
        </div>
      </div>
    </QForm>
  </BaseModal>
</template>

<script setup>
import { computed, ref, toRefs, watch } from 'vue'
import { number, object, string, mixed } from 'yup'
import { useQueryClient } from '@tanstack/vue-query'
import { useApiGetSettings } from '@/modules/Settings'
import {
  useApiCheckHoliday,
  useApiCreateTask,
  useApiUpdateTask,
  useGetDueTaskTimesMutation,
  useTaskQuery,
} from '@/modules/Task/query'
import { handleError } from '@/utils/error-handler'
import useYup from '@/composables/use-yup'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import PersianDate from '@/components/Form/PersianDate'
import BaseModal from '@/base/Modal'
import { formatDate, addToDate, diffDates, toHHMM } from '@/utils/date-utils'
import TextField from '@/base/TextField'
import Button from '@/base/Button'
import Checkbox from '@/base/Checkbox'
import AdvisorSelect from '@/components/Form/AdvisorSelect'
import TaskTypeSelect from '@/components/Form/TaskTypeSelect'
import TaskTimeRangeSelect from '@/components/Form/TaskTimeRangeSelect'
import EnumSelect from '@/components/Form/EnumSelect'
import UserSelectField from '@/components/Form/UserSelectField'

const emits = defineEmits(['close', 'submitted'])
const props = defineProps({
  visible: { type: Boolean, default: false },
  editValue: {
    type: Object,
    default: () => {},
  },
  userId: {
    type: [Number, String, Object],
    default: null,
  },
  prefilledUser: {
    type: Object,
    default: null,
  },
  prefilledDescription: {
    type: String,
    default: '',
  },
})

const queryClient = useQueryClient()
const { visible, editValue } = toRefs(props)

const dueTimesCount = ref({})
const tempCheckHolidayDate = ref(null)
const tempDueTime = ref('')
const updatedUserTaskData = ref(null)
const isEditMode = computed(() => !!editValue.value?.id)
const isPrefilledMode = computed(() => !!props.prefilledUser)

const editId = computed(() => editValue.value?.id || null)
const { data: fetchedTask, isLoading: isTaskFetchLoading } = useTaskQuery(editId, editValue)

const initialUserTaskData = computed(() => {
  if (isPrefilledMode.value) {
    return {
      user: props.prefilledUser,
      assignTo: props.prefilledUser?.advisor?.id,
      description: props.prefilledDescription || '',
    }
  }
  const data = fetchedTask.value || editValue.value || {}
  return {
    ...data,
    assignTo: data.assignTo || data.user?.advisor?.id,
  }
})
const userTaskData = computed(() => updatedUserTaskData.value || initialUserTaskData.value || {})

watch(fetchedTask, (newData) => {
  if (newData && updatedUserTaskData.value) {
    updatedUserTaskData.value = { ...newData, ...updatedUserTaskData.value }
  }
})
const assignTo = computed(
  () =>
    userTaskData.value?.assignTo ||
    initialUserTaskData.value?.assignTo ||
    initialUserTaskData.value?.user?.advisor?.id ||
    props.prefilledUser?.advisor?.id ||
    null
)
const taskFormSchema = object().shape({
  status: number().default(2).required('وضعیت الزامیست'),
  type: object()
    .shape({
      id: number(),
    })
    .required()
    .typeError('نوع پیگیری را مشخص کنید'),
  user: object()
    .shape({
      id: number().required('کاربر را انتخاب کنید'),
    })
    .required('کاربر را انتخاب کنید'),
  dueTime: string().required(),
  dueDate: string().required('تاربخ سررسید را مشخص کنید'),
  title: string().nullable(),
  priority: mixed()
    .nullable()
    .test('is-valid-priority', 'مقدار اولویت معتبر نیست', (val) => {
      if (!val) return true
      return typeof val === 'number' || typeof val?.id === 'number'
    })
    .transform((val) => (typeof val === 'object' ? val?.id : val)),
  assignTo: number().required().typeError('کاربر مسئول را انتخاب نمایید'),
  description: string().nullable(),
})
const { validate, validateAt, errors } = useYup(taskFormSchema)
const handleChange = (field, value, skipValidation = false) => {
  updatedUserTaskData.value = { ...userTaskData.value, [field]: value }
  if (!skipValidation) validateAt(field, value)
}

const tempDate = computed(() => ({
  date: isEditMode.value
    ? undefined
    : userTaskData.value?.dueDate
      ? formatDate(userTaskData.value.dueDate, 'YYYY-MM-DD')
      : undefined,
}))
const { data: taskTimeRanges } = useApiGetSettings('taskDueTimeRange', undefined, {
  enabled: () =>
    visible.value && (isEditMode.value || (!!assignTo.value && !!userTaskData.value?.dueDate)),
})
const { mutate: loadDueTimesTask } = useGetDueTaskTimesMutation()

const { data: isHoliday, isLoading: checkHolidayLoading } = useApiCheckHoliday(tempDate, null, {
  enabled: () => visible.value && tempDate.value?.date && !isEditMode.value,
})
const isClosed = computed(() =>
  isHoliday.value?.data ? Notif.error(isHoliday.value.message) : false
)
const { mutate: createTask, isPending: isCreateTaskPending } = useApiCreateTask()
const { mutate: updateTask, isPending: isUpdateTaskPending } = useApiUpdateTask()
const selectedDueTimeRange = computed(() => {
  const ranges = taskTimeRanges.value
  const dueTime = userTaskData.value?.dueTime
  if (!Array.isArray(ranges) || !dueTime) return null
  return ranges.find((r) => r.enTitle === dueTime || toHHMM(r.start) === toHHMM(dueTime)) ?? null
})
const dueTimeDisplayLabel = computed(() => selectedDueTimeRange.value?.faTitle ?? null)

const onOpenForm = () => {
  if (isPrefilledMode.value) {
    handleChange('user', initialUserTaskData.value.user, true)
  }
}
const closeForm = () => {
  emits('close', false)
  if (updatedUserTaskData.value) {
    updatedUserTaskData.value = null
  }
  tempDueTime.value = ''
  tempCheckHolidayDate.value = ''
}
const updateUserTask = (data, id) => {
  updateTask(
    { ...data, id },
    {
      onSuccess: async (response) => {
        await queryClient.invalidateQueries({
          queryKey: ['task'],
        })
        Notif.success(response.message)
        emits('submitted')
        closeForm()
      },
    }
  )
}
const createUserTask = (data) => {
  createTask(data, {
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ['task'],
      })
      Notif.success(response.message)
      emits('submitted')
      closeForm()
    },
  })
}
const submitForm = async () => {
  const { isValid, payload } = await validate(userTaskData.value)
  if (!isValid) return
  const data = {
    ...payload,
    typeId: payload.type?.id ?? null,
    userId: payload.user?.id ?? null,
    title: payload.title ?? '',
  }
  if (!isEditMode.value) {
    const dueTime = selectedDueTimeRange.value?.start ?? userTaskData.value?.dueTime
    const dueTimeWithSeconds = dueTime?.length === 5 ? `${dueTime}:00` : dueTime
    data.dueDate = `${userTaskData.value?.dueDate} ${dueTimeWithSeconds}`
  }
  if (tempDueTime.value === payload?.dueDate) {
    const submitDate = addToDate(data.dueDate, 1, 'seconds')
    data.dueDate = formatDate(submitDate, 'YYYY-MM-DD')
  }

  const diffDays = diffDates(new Date(data.dueDate), new Date(), 'days')

  if (diffDays >= 30) {
    confirmDialog(
      'توجه',
      `آیا از ثبت برای ${diffDays} روز آینده مطمئن هستید؟`,
      () => {
        isEditMode.value ? updateUserTask(data, userTaskData.value?.id) : createUserTask(data)
      },
      {
        ok: {
          label: 'تایید',
          color: 'positive',
          flat: true,
        },
        cancel: {
          label: 'انصراف',
          color: 'negative',
          flat: true,
        },
        persistent: true,
      }
    )
  } else {
    isEditMode.value ? updateUserTask(data, userTaskData.value?.id) : createUserTask(data)
  }
}

watch(
  () => userTaskData.value.dueDate,
  (value) => {
    if (value && assignTo.value && !isEditMode.value) {
      handleChange('dueTime', null, true)
      loadDueTimesTask(
        {
          assignTo: assignTo.value,
          dueDate: formatDate(value, 'YYYY-MM-DD'),
        },
        {
          onSuccess: ({ data }) => {
            const ranges = taskTimeRanges.value || []
            const dueDateStr = formatDate(value, 'YYYY-MM-DD')
            ranges.forEach((taskTime) => {
              dueTimesCount.value[taskTime.start] = 0
              const startTime = new Date(`${dueDateStr} ${taskTime.start}`).getTime()
              const endTime = new Date(`${dueDateStr} ${taskTime.end}`).getTime()
              data.forEach(({ dueTime, count }) => {
                const dueTimeMs = new Date(dueTime).getTime()
                if (startTime <= dueTimeMs && dueTimeMs <= endTime) {
                  dueTimesCount.value[taskTime.start] += count
                }
                const dueTimeStart = selectedDueTimeRange.value?.start ?? userTaskData.value.dueTime
                const dueTimeConverted = new Date(`${dueDateStr} ${dueTimeStart}`).getTime()
                if (startTime <= dueTimeConverted && dueTimeConverted <= endTime) {
                  tempDueTime.value = taskTime.start
                }
              })
            })
          },
          onError: (err) => handleError(err),
        }
      )
    }
    setTimeout(() => {
      if ((userTaskData.value || props.editValue?.id) && value)
        tempCheckHolidayDate.value = { date: value }
    }, 400)
  }
)
</script>

<style scoped lang="scss">
.task-form {
  &__option {
    min-width: 350px;
  }

  &__count {
    color: $red-6;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: $spacing-sm;
  }
}
</style>
