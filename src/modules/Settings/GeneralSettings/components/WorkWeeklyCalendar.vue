<template>
  <QForm class="relative-position" @submit.prevent="saveData">
    <QBanner class="bg-grey-1 rounded-borders q-pa-md">
      <template #avatar>
        <QIcon name="info" color="info" size="sm" />
      </template>
      لطفا ساعات کاری کلینیک و تعداد نوبت مجاز هر روز را مشخص کنید.
      <br />
      <QIcon name="info" class="q-my-sm" color="info" />
      کاربر گرامی، با انتخاب روزهای هفته، ساعات کاری را مشخص کنید و با خاموش کردن دکمه، کلینیک تعطیل
      می‌شود.
    </QBanner>
    <div v-for="(item, index) in workTimesData" :key="index" class="q-my-md">
      <div class="row items-center q-col-gutter-md">
        <div class="col-md-1">
          <QChip color="white">{{ weekDays[0]?.[item.weekday] }}</QChip>
        </div>

        <div class="col-md-1">
          <QToggle
            :model-value="item.isActive"
            checked-icon="check"
            unchecked-icon="close"
            color="positive"
            @update:model-value="(e) => handleChange(index, 'isActive', e)"
          />
        </div>

        <div class="col-md-3">
          <QInput
            :model-value="item.visitCountPerSession"
            label="تعداد مجاز نوبت"
            type="number"
            :disable="!item.isActive"
            outlined
            :error="!!errors?.[`workTimes[${item.weekday}].visitCountPerSession`] || null"
            :error-message="errors?.[`workTimes[${item.weekday}].visitCountPerSession`]"
            @update:model-value="(e) => handleChange(index, 'visitCountPerSession', e)"
          />
        </div>

        <div class="col-md-7 row items-center q-gutter-sm">
          <QInput
            outlined
            class="col"
            :model-value="item.start"
            :disable="!item.isActive"
            :error="!!errors?.[`workTimes[${item.weekday}].start`] || null"
            :error-message="errors?.[`workTimes[${item.weekday}].start`]"
            @update:model-value="(e) => handleChange(index, 'start', e)"
          >
            <template #append>
              <QIcon name="access_time" class="cursor-pointer">
                <QPopupProxy cover transition-show="scale" transition-hide="scale">
                  <QTime
                    v-model="item.start"
                    format="24h"
                    label="شروع"
                    :disable="!item.isActive"
                    mask="HH:mm"
                    @update:model-value="(e) => handleChange(index, 'start', e)"
                  />
                </QPopupProxy>
              </QIcon>
            </template>
          </QInput>
          <span class="q-mx-sm q-mt-">الی</span>
          <QInput
            outlined
            :model-value="item.end"
            class="col"
            :disable="!item.isActive"
            :error="!!errors?.[`workTimes[${item.weekday}].end`] || null"
            :error-message="errors?.[`workTimes[${item.weekday}].end`]"
            @update:model-value="(e) => handleChange(index, 'end', e)"
          >
            <template #append>
              <QIcon name="access_time" class="cursor-pointer">
                <QPopupProxy cover transition-show="scale" transition-hide="scale">
                  <QTime
                    v-model="item.end"
                    format="24h"
                    label="شروع"
                    :disable="!item.isActive"
                    mask="HH:mm"
                    @update:model-value="(e) => handleChange(index, 'end', e)"
                  />
                </QPopupProxy>
              </QIcon>
            </template>
          </QInput>
        </div>
      </div>
      <QSeparator spaced color="primary" />
    </div>

    <QInnerLoading :showing="isLoading || isPending">
      <QSpinnerTail color="primary" size="2em" />
    </QInnerLoading>
  </QForm>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useApiGetSettings, useApiSaveSetting } from '@/modules/Settings'
import { weekDays } from '@/modules/Settings/GeneralSettings/enums/enums'
import { object, string, array, boolean, mixed } from 'yup'
import useYup from '@/composables/use-yup'
import { useQueryClient } from '@tanstack/vue-query'
import { Notif } from '@/data/services/notification-service'

const props = defineProps({
  submit: {
    type: Object,
    default: () => ({}),
  },
  refresh: {
    type: Object,
    default: () => ({}),
  },
  branchId: {
    type: [Number, String],
    default: null,
  },
})

const emits = defineEmits(['afterSubmit', 'afterRefresh'])

const queryClient = useQueryClient()

const updatedWorkTimesData = ref(null)

const queryParams = computed(() => (props.branchId ? { branch_id: props.branchId } : undefined))
const { data: clinicWorkTime, isLoading } = useApiGetSettings('workTime', queryParams)
const workTimesComputed = computed(() => clinicWorkTime.value?.workTimes || [])
const workTimesData = computed(() => updatedWorkTimesData.value || workTimesComputed.value || [])

const validationSchema = object({
  workTimes: array().of(
    object({
      weekday: string().required(),
      isActive: boolean().default(false),
      visitCountPerSession: mixed().test('is-valid', 'حداقل یک نوبت الزامیست', (val) => {
        return Number(val) && Number(val) > 0
      }),
      start: string().test('is-required', 'ساعت شروع الزامی است', (val) => {
        return !!val
      }),
      end: string()
        .test('is-required', 'ساعت پایان الزامی است', (val) => {
          return !!val
        })
        .test(
          'is-after-start',
          'ساعت پایان باید بعد از ساعت شروع باشد',
          function validateEndTime(val) {
            const { start } = this.parent
            if (!start || !val) return true
            return val > start
          }
        ),
    })
  ),
})

const { errors, validateAt, validate } = useYup(validationSchema)
const handleChange = (index, field, value) => {
  updatedWorkTimesData.value = {
    ...workTimesData.value,
    [index]: {
      ...workTimesData.value[index],
      [field]: value,
      index,
    },
  }

  validateAt(`workTimes[${index}].${field}`, value)
}
const refreshData = () => {
  updatedWorkTimesData.value = null
  queryClient.invalidateQueries({ queryKey: ['setting', 'workTime', queryParams.value] })
  Notif.success('لیست بروزرسانی شد')
}

const { mutate, isPending } = useApiSaveSetting()
const saveData = async () => {
  const workTimesArray = Object.values(workTimesData.value).map((item) => ({
    ...item,
    start: item.start?.length === 5 ? `${item.start}:00` : item.start,
    end: item.end?.length === 5 ? `${item.end}:00` : item.end,
  }))
  const { isValid } = await validate({ workTimes: workTimesArray })
  if (!isValid) return

  const workTimes = workTimesArray.reduce((acc, item) => {
    acc[item.weekday] = {
      start: item.start,
      end: item.end,
      weekday: item.weekday,
      visit_count_per_session: item.visitCountPerSession,
      is_active: item.isActive,
    }
    return acc
  }, {})

  const requestBody = {
    workTimes,
    ...(props.branchId && { branch_id: props.branchId }),
  }

  mutate(
    { body: requestBody, key: 'workTime' },
    {
      onSuccess: (res) => {
        Notif.success(res.message)
        refreshData()
      },
    }
  )
}
watch(
  () => props.submit?.value,
  (val) => {
    if (val) saveData()
  }
)
watch(
  () => props.refresh,
  (value) => {
    if (value) {
      refreshData()
      emits('afterRefresh')
    }
  }
)

defineExpose({
  submit: saveData,
  refresh: refreshData,
})
</script>

<style scoped lang="scss">
.q-form {
  max-width: 900px;
  margin: auto;
}
</style>
