<template>
  <div class="rest-time">
    <div class="rest-time__header">
      <p>زمان استراحت کارمندان</p>
      <Transition name="slide-fade" mode="out-in">
        <div v-if="state.type === 'normal'" key="normal" class="rest-time__header-tools">
          <Transition name="slide-fade">
            <QBtn
              v-if="state.data.length > 0"
              class="rest-time__header-tools-edit"
              color="primary"
              :disable="isPending"
              round
              icon="edit"
              @click="state.type = 'edit'"
            />
          </Transition>
          <Transition name="slide-fade">
            <QBtn
              v-if="state.data.length > 0"
              class="chips chips-primary"
              :loading="isPending"
              color="primary"
              outline
              icon="add"
              @click="handleCreateRestTime"
            >
              افزودن زمان استراحت
            </QBtn>
          </Transition>
        </div>
        <div v-else key="edit" class="rest-time__header-tools">
          <QBtn
            :loading="isPending"
            class="rest-time__header-tools-cancel"
            color="negative"
            outline
            @click="handleCancel"
          >
            انصراف
          </QBtn>
          <QBtn
            :loading="isPending"
            class="rest-time__header-tools-save"
            color="positive"
            outline
            @click="handleAccept"
          >
            ذخیره تغییرات
          </QBtn>
        </div>
      </Transition>
    </div>
    <Transition name="slide-fade" mode="out-in">
      <div v-if="state.data.length > 0" key="hasData" class="rest-time__content">
        <div class="rest-time__content-header">
          <p>نقش</p>
          <p>زمان شروع</p>
          <p>زمان پایان</p>
        </div>
        <div v-for="(data, index) in state.data" :key="data.id" class="rest-time__content-item">
          <div class="rest-time__content-item-right">
            <div>
              <Transition name="slide-fade" mode="out-in">
                <p v-if="state.type === 'normal'" key="normal">
                  {{ roleList.find((item) => item.id === data.roleId)?.name }}
                </p>
                <QSelect
                  v-else
                  key="edit"
                  :model-value="data.roleId"
                  class="rest-time__content-input-role"
                  placeholder="انتخاب نقش"
                  use-input
                  input-debounce="0"
                  :options="roleList"
                  option-value="id"
                  option-label="name"
                  emit-value
                  map-options
                  outlined
                  dense
                  @update:model-value="handleSelectedRole($event, index)"
                />
              </Transition>
            </div>
            <div>
              <Transition name="slide-fade" mode="out-in">
                <p v-if="state.type === 'normal'" key="normal">
                  {{ data.startHourstime }}:{{ data.startMinutetime }}
                </p>
                <div v-else key="edit" class="rest-time__content-box-time">
                  <input
                    v-model="data.startMinutetime"
                    class="rest-time__content-box-time-input"
                    placeholder="_"
                    maxlength="2"
                    type="text"
                    dir="ltr"
                    @input="handleFilterMinuteTime(index, 'start')"
                  />
                  :
                  <input
                    v-model="data.startHourstime"
                    class="rest-time__content-box-time-input"
                    placeholder="_"
                    type="text"
                    @input="handleFilterHoursTime(index, 'start')"
                  />
                </div>
              </Transition>
            </div>
            <div>
              <Transition name="slide-fade" mode="out-in">
                <p v-if="state.type === 'normal'" key="normal">
                  {{ data.endHourstime }}:{{ data.endMinutetime }}
                </p>
                <div v-else key="edit" class="rest-time__content-box-time">
                  <input
                    v-model="data.endMinutetime"
                    class="rest-time__content-box-time-input"
                    placeholder="_"
                    type="text"
                    dir="ltr"
                    @input="handleFilterMinuteTime(index, 'end')"
                  />
                  :
                  <input
                    v-model="data.endHourstime"
                    class="rest-time__content-box-time-input"
                    placeholder="_"
                    type="text"
                    @input="handleFilterHoursTime(index, 'end')"
                  />
                </div>
              </Transition>
            </div>
          </div>
          <Transition name="slide-fade" mode="out-in">
            <QBtn
              v-if="data.roleId && state.type !== 'edit'"
              class="rest-time__content-item-trash"
              color="negative"
              outline
              round
              icon="delete"
              :disable="isPending"
              @click="handleShowRemoveDialog(index)"
            />
          </Transition>
        </div>
      </div>
      <div v-else key="noData" class="rest-time__no-data">
        <img src="@/assets/images/noData.svg" width="188" height="140" alt="noData" />
        <p class="text-h6 text-grey-7">هنوز زمانی برای استراحت تعریف نشده!</p>
        <p>برای مدیریت بهتر زمان کاری، لطفاً بازه‌های استراحت را مشخص کنید.</p>
        <QBtn
          :loading="isPending"
          class="chips chips-primary"
          outline
          icon="add"
          @click="handleCreateRestTime"
        >
          افزودن زمان استراحت
        </QBtn>
      </div>
    </Transition>
  </div>
</template>
<script setup>
import { useGetRestTime, usePostRestTime } from '../query'
import { reactive, watch, onMounted, computed } from 'vue'
import useRoles from '@/composables/use-roles'
import useYup from '@/composables/use-yup'
import { object, array, number, string } from 'yup'
import { Notif, confirmDialog } from '@/data/services/notification-service'

const state = reactive({
  type: 'normal',
  selectedRestTime: null,
  data: [],
})
const { allRoles } = useRoles(['advisor', 'support', 'advisor_and_online_visit'])
const roleList = computed(() => {
  return allRoles.value.items
    .filter((item) => item.id !== 6)
    .map((item) => {
      return {
        id: item.id,
        name: item.faTitle,
      }
    })
})

const timeRegex = /^(6|[7-9]|1\d|2[0-3])$/
const minuteRegex = /^([0-5]?\d)$/

const restTimeItemSchema = array().of(
  object()
    .shape({
      roleId: number().required('انتخاب نقش الزامی است').typeError('نقش باید عدد باشد'),

      startHourstime: string()
        .transform((v) => (v === '' ? undefined : v))
        .required('ساعت شروع الزامی است')
        .test('startHourstime-valid', 'ساعت باید بین ۶ تا ۲۳ باشد', (value) => {
          if (value === undefined) return true
          return timeRegex.test(value)
        }),

      startMinutetime: string()
        .transform((v) => (v === '' ? undefined : v))
        .required('دقیقه شروع الزامی است')
        .matches(minuteRegex, 'دقیقه شروع باید بین ۰ تا ۵۹ باشد'),

      endHourstime: string()
        .transform((v) => (v === '' ? undefined : v))
        .required('ساعت پایان الزامی است')
        .test('endHourstime-valid', 'ساعت باید بین ۶ تا ۲۳ باشد', (value) => {
          if (value === undefined) return true
          return timeRegex.test(value)
        }),

      endMinutetime: string()
        .transform((v) => (v === '' ? undefined : v))
        .required('دقیقه پایان الزامی است')
        .matches(minuteRegex, 'دقیقه پایان باید بین ۰ تا ۵۹ باشد'),
    })
    .test('start-before-end', 'زمان شروع باید قبل از زمان پایان باشد', function (value) {
      if (!value) return true

      const { startHourstime, startMinutetime, endHourstime, endMinutetime } = value

      if (!startHourstime || !startMinutetime || !endHourstime || !endMinutetime) return true

      const start = Number(startHourstime) * 60 + Number(startMinutetime)
      const end = Number(endHourstime) * 60 + Number(endMinutetime)

      return start < end
    })
)

const { mutate, isPending } = usePostRestTime()
const { data: restTimeData } = useGetRestTime()

const handleTransformData = (data, direction = 'toLocal') => {
  if (direction === 'toLocal') {
    state.data = data?.map((item) => {
      const [startHour, startMinute] = item.startTime.split(':')
      const [endHour, endMinute] = item.endTime.split(':')
      return {
        roleId: item.roleId,
        startHourstime: startHour,
        startMinutetime: startMinute,
        endHourstime: endHour,
        endMinutetime: endMinute,
      }
    })
  }
  return data?.map((item) => {
    return {
      role_id: item.roleId,
      start_time: `${item.startHourstime}:${item.startMinutetime}`,
      end_time: `${item.endHourstime}:${item.endMinutetime}`,
    }
  })
}

onMounted(() => handleTransformData(restTimeData?.value?.setting ?? []))

watch(restTimeData, (value) => handleTransformData(value?.setting, 'toLocal'))

const handleSelectedRole = (data, index) => {
  state.data[index].roleId = data
}

const handleFilterHoursTime = (index, type) => {
  if (type === 'start') {
    let value = state.data[index].startHourstime.replace(/\D/g, '')
    if (Number.parseInt(value, 10) > 23) value = ''
    state.data[index].startHourstime = value
  } else {
    let value = state.data[index].endHourstime.replace(/\D/g, '')
    if (Number.parseInt(value, 10) > 23) value = ''
    state.data[index].endHourstime = value
  }
}

const handleFilterMinuteTime = (index, type) => {
  if (type === 'start') {
    let value = state.data[index].startMinutetime.replace(/\D/g, '')
    if (Number.parseInt(value, 10) > 59) value = '00'
    state.data[index].startMinutetime = value
  } else {
    let value = state.data[index].endMinutetime.replace(/\D/g, '')
    if (Number.parseInt(value, 10) > 59) value = '00'
    state.data[index].endMinutetime = value
  }
}

const handleCreateRestTime = () => {
  state.type = 'edit'
  state.data.push({
    roleId: null,
    startHourstime: '',
    startMinutetime: '',
    endHourstime: '',
    endMinutetime: '',
  })
}

const handleAccept = async () => {
  const { validate, errors } = useYup(restTimeItemSchema)

  const { isValid } = await validate(state.data)

  if (isValid) {
    mutate(handleTransformData(state.data, 'toServer'), {
      onSuccess: () => {
        state.type = 'normal'
        Notif.success('تغییرات با موفقیت ذخیره شد', { position: 'top' })
      },
      onError: () => {
        Notif.error('خطا در ذخیره تغییرات', { position: 'top' })
      },
    })
  } else {
    const firstError = Object.values(errors.value).flatMap((err) =>
      typeof err === 'string'
        ? [err]
        : typeof err === 'object' && err !== null
          ? Object.values(err)
          : []
    )[0]

    if (firstError) {
      Notif.error(firstError, { position: 'top' })
    }
  }
}

const handleCancel = () => {
  handleTransformData(restTimeData.value?.setting, 'toLocal')
  state.type = 'normal'
}

const handleAcceptRemoveRestTime = (indexToRemove) => {
  const data = state.data.filter((item, index) => index !== indexToRemove)

  mutate(handleTransformData(data, 'toServer'), {
    onSuccess: () => {
      Notif.success('زمان استراحت با موفقیت حذف شد', { position: 'top' })
    },
    onError: () => {
      Notif.error('خطا در حذف زمان استراحت', { position: 'top' })
    },
  })
}
const handleShowRemoveDialog = (index) => {
  confirmDialog(
    'تأیید حذف',
    'آیا از حذف این زمان استراحت اطمینان دارید؟',
    () => {
      handleAcceptRemoveRestTime(index)
    },
    {
      cancel: {
        label: 'خیر',
        flat: true,
        color: 'grey-7',
      },
      ok: {
        label: 'بله',
        color: 'primary',
      },
      persistent: true,
    }
  )
}
</script>

<style lang="scss" scoped>
.rest-time {
  flex-direction: column;
  justify-content: start;
  align-items: start;
  margin-top: 13px;
  display: flex;
  width: 100%;
  gap: 16px;

  &__header {
    justify-content: space-between;
    align-items: center;
    display: flex;
    width: 100%;

    > p {
      margin: 0;
      color: $grey-7;
      font-size: 1.25rem;
      font-weight: 500;
    }

    &-tools {
      align-items: center;
      display: flex;
      gap: 7px;

      &-edit {
        height: 32px;
        width: 32px;
      }

      &-save {
        height: 32px;
        width: fit-content;
        margin: 0;
      }

      &-cancel {
        height: 32px;
        width: 95px;
        margin: 0;
      }
    }
  }
  &__content {
    justify-content: center;
    flex-direction: column;
    align-items: center;
    display: flex;
    width: 100%;

    &-header {
      border-top-right-radius: 8px;
      border-top-left-radius: 8px;
      background-color: $blue-1;
      align-items: center;
      padding: 16px;
      display: flex;
      height: 40px;
      width: 100%;

      p {
        color: $primary;
        font-weight: 700;
        font-size: 14px;
        width: 128px;
        margin: 0;
      }
    }
    &-item {
      border-bottom: 1px solid $grey-3;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      display: flex;
      height: 56px;
      width: 100%;

      &-right {
        align-items: center;
        display: flex;

        > div {
          width: 128px;

          p {
            font-weight: 500;
            font-size: 16px;
            margin: 0;
            color: $grey-8;
          }
        }
      }

      &-trash {
        height: 32px;
        width: 32px;
      }

      &:last-of-type {
        border: none;
      }
    }
    &-input-role {
      width: 116px;
    }

    &-box-time {
      border: 1.5px solid $grey-4;
      justify-content: center;
      align-items: center;
      border-radius: 4px;
      display: flex;
      width: 120px;
      height: 40px;

      &-input {
        width: 25px;
        border: none;
        outline: none;
        text-align: center;
        color: $grey-8;
      }
    }
  }
  &__no-data {
    justify-content: center;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
    display: flex;
    width: 100%;

    :nth-child(3) {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: $grey-6;
      width: 332px;
      text-align: center;
      margin-bottom: 20px;
      margin-top: 3px;
    }
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.slide-fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.slide-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
