<template>
  <QForm class="relative-position" @submit.prevent="saveData">
    <div class="row">
      <div class="col-md-4 col-12">
        <AdvisorSelect
          :model-value="doctor"
          :user-role="['doctor']"
          label="انتخاب دکتر"
          :dense="false"
          @update:model-value="(e) => onSelectDoctor(e)"
        >
          <template #loading>
            <span class="text-caption">در حال دریافت اطلاعات</span>
          </template>
        </AdvisorSelect>
      </div>
    </div>
    <div v-if="doctorWorkTimes?.length === 0" class="row justify-center items-center column">
      <QImg :src="noDataImg" spinner-color="primary" width="200px" class="q-my-md" />
      <span class="text-body2 text-secondary">
        برای نمایش ساعات کاری ابتدا دکتر را انتخاب نمایید
      </span>
    </div>
    <div v-for="(item, index) in doctorWorkTimes" v-else :key="index" class="q-my-md">
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
        <div class="col-md-10 col row items-center q-gutter-sm">
          <QInput
            outlined
            class="col"
            :model-value="item.start"
            :disable="!item.isActive"
            :error="!!errors?.[`workTimes[${index}].start`] || null"
            :error-message="errors?.[`workTimes[${index}].start`]"
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
                    mask="HH:mm:ss"
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
            :error="!!errors?.[`workTimes[${index}].end`] || null"
            :error-message="errors?.[`workTimes[${index}].end`]"
            @update:model-value="(e) => handleChange(index, 'end', e)"
          >
            <template #append>
              <QIcon name="access_time" class="cursor-pointer">
                <QPopupProxy cover transition-show="scale" transition-hide="scale">
                  <QTime
                    v-model="item.end"
                    format="24h"
                    label="پایان"
                    :disable="!item.isActive"
                    mask="HH:mm:ss"
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
import { watch, ref, computed } from 'vue'
import { weekDays } from '@/modules/Settings/GeneralSettings/enums/enums'
import { useGetDoctorWorkTimes, useSetDoctorWorkTimes } from '@/modules/Settings'
import { object, string, boolean, array } from 'yup'
import useYup from '@/composables/use-yup'
import AdvisorSelect from '@/components/Form/AdvisorSelect'
import { useQueryClient } from '@tanstack/vue-query'
import noDataImg from '@/assets/images/noData.svg'
import { Notif } from '@/data/services/notification-service'

const props = defineProps(['submit', 'refresh'])

const emits = defineEmits(['afterSubmit', 'afterRefresh'])
const queryClient = useQueryClient()

const doctor = ref(null)
const updateDoctorWorkTimes = ref(null)

const { data: workTimes, isLoading, refetch: refetchWorkTimes } = useGetDoctorWorkTimes(doctor)

const doctorWorkTimes = computed(() => updateDoctorWorkTimes.value || workTimes.value || [])

const validationSchema = object().shape({
  workTimes: array().of(
    object({
      weekday: string().required(),
      isActive: boolean().default(false),
      start: string().test('is-required', 'ساعت شروع الزامی است', (val) => {
        return !!val
      }),
      end: string().test('is-required', 'ساعت پایان الزامی است', (val) => {
        return !!val
      }),
    })
  ),
})
const { validate, validateAt, errors } = useYup(validationSchema)
const handleChange = (index, field, value) => {
  updateDoctorWorkTimes.value = {
    ...doctorWorkTimes.value,
    [index]: {
      ...doctorWorkTimes.value[index],
      [field]: value,
      index,
    },
  }

  validateAt(`workTimes[${index}].${field}`, value)
}
const onSelectDoctor = (id) => {
  if (id) {
    doctor.value = id
    refetchWorkTimes()
  } else doctor.value = null
}

const { mutate, isPending } = useSetDoctorWorkTimes()

const saveData = async () => {
  const workTimesArray = Object.values(doctorWorkTimes.value)
  const { isValid, payload } = await validate({ workTimes: workTimesArray })
  if (!isValid) return
  mutate(
    { doctorId: doctor.value, workTimes: payload },
    {
      onSuccess: (res) => {
        Notif.success(res.message)
      },
    }
  )
}
const refreshData = () => {
  doctor.value = null
  queryClient.invalidateQueries({ queryKey: ['setting', 'doctor-work-times'] })
  Notif.success('لیست بروزرسانی شد')
}
watch(
  () => props.submit?.value,
  (val) => {
    if (val) saveData()
    emits('afterSubmit')
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
</script>
