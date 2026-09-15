<template>
  <QDialog v-model="internalShow" @before-hide="handleCancel">
    <QCard class="dwhd">
      <div class="dwhd__header">
        <Typography variant="heading" size="h6">ویرایش ساعت کاری {{ doctorName }}</Typography>

        <Button
          variant="flat"
          color="light-blue"
          size="sm"
          :is-disabled="isSubmitting"
          @click="handleCancel"
        >
          <IconX :size="20" color="#424242" />
        </Button>
      </div>

      <div class="dwhd__body">
        <div v-for="(block, blockIdx) in scheduleBlocks" :key="blockIdx" class="dwhd__block">
          <div class="dwhd__block__day-col">
            <div class="dwhd__block__day-row">
              <span class="dwhd__block__day-label">روز</span>
              <SelectField
                v-model="block.selectedDays"
                :options="getAvailableDayOptions(blockIdx)"
                multiple
                outlined
                dense
                emit-value
                map-options
                class="dwhd__block__day-select"
              >
                <template #selected-item="scope">
                  <Typography v-if="scope.index === 0" class="dwhd__block__day-selected">
                    {{ block.selectedDays.length }} روز انتخاب شده
                  </Typography>
                </template>
              </SelectField>
            </div>
            <Typography
              v-if="block.selectedDays.length > 0"
              variant="caption"
              color="grey"
              class="dwhd__block__day-list"
            >
              {{
                block.selectedDays
                  .map((d) => dayOptions.find((o) => o.value === d)?.label)
                  .join('، ')
              }}
            </Typography>
          </div>
          <div class="dwhd__block__v-sep" />
          <div class="dwhd__block__time-col">
            <div
              v-for="(hour, hourIdx) in block.hours"
              :key="hourIdx"
              class="dwhd__block__time-row"
            >
              <TimeField
                :model-value="hour.start"
                label="از"
                @update:model-value="(val) => updateHour(blockIdx, hourIdx, 'start', val)"
              />
              <TimeField
                :model-value="hour.end"
                label="تا"
                @update:model-value="(val) => updateHour(blockIdx, hourIdx, 'end', val)"
              />
              <div class="dwhd__block__remove-btn" @click="removeHour(blockIdx, hourIdx)">
                <IconTrash :size="18" color="#2e2e2e" />
              </div>
            </div>

            <div class="dwhd__block__add-time" @click="addHour(blockIdx)">
              <IconPlus :size="18" color="#0055ff" />
            </div>
          </div>
        </div>

        <div class="dwhd__add-day" @click="addBlock">
          <IconPlus :size="16" color="#0055ff" />
          <span>افزودن روز کاری</span>
        </div>

        <div class="dwhd__toggle-row">
          <Typography variant="body" size="2" weight="medium">
            به عنوان پزشک نسخه انتخاب شود
          </Typography>
          <QToggle v-model="isDefaultRef" color="primary" />
        </div>
      </div>

      <div class="dwhd__footer">
        <Button
          variant="filled"
          color="blue"
          :is-loading="isSubmitting"
          text="ثبت"
          @click="handleSubmit"
        />
        <Button
          variant="outline"
          color="red"
          :is-disabled="isSubmitting"
          text="انصراف"
          @click="handleCancel"
        />
      </div>
    </QCard>
  </QDialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import SelectField from '@/base/SelectField'
import TimeField from '@/base/TimeField'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import { IconX, IconTrash, IconPlus } from '@tabler/icons-vue'
import { useApiSetDoctorWorkingHours } from '../query'
import { handleError } from '@/utils/error-handler'
import { Notif } from '@/data/services/notification-service'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  branchId: {
    type: [Number, String],
    required: true,
  },
  doctorId: {
    type: [Number, String],
    default: null,
  },
  doctorName: {
    type: String,
    default: '',
  },
  workingHours: {
    type: Array,
    default: () => [],
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:show', 'success'])

const dayLabels = {
  0: 'شنبه',
  1: 'یکشنبه',
  2: 'دوشنبه',
  3: 'سه‌شنبه',
  4: 'چهارشنبه',
  5: 'پنجشنبه',
  6: 'جمعه',
}

const dayOptions = Object.entries(dayLabels).map(([value, label]) => ({
  label,
  value: Number(value),
}))

const internalShow = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const isDefaultRef = ref(false)

const buildBlocks = (workingHours = []) => {
  const groups = {}

  workingHours.forEach((wh) => {
    const key = (wh.hours || [])
      .map((h) => `${h.startTime}-${h.endTime}`)
      .sort()
      .join('|')

    if (!groups[key]) {
      groups[key] = {
        hours: wh.hours?.length
          ? wh.hours.map((h) => ({ start: h.startTime, end: h.endTime }))
          : [{ start: '', end: '' }],
        selectedDays: [],
      }
    }
    groups[key].selectedDays.push(wh.dayOfWeek)
  })

  const values = Object.values(groups)
  return values.length > 0 ? values : [{ hours: [{ start: '', end: '' }], selectedDays: [] }]
}

const scheduleBlocks = ref(buildBlocks())

const getAvailableDayOptions = (blockIdx) => {
  const takenDays = new Set(
    scheduleBlocks.value.flatMap((b, i) => (i === blockIdx ? [] : b.selectedDays))
  )
  return dayOptions.filter((d) => !takenDays.has(d.value))
}

const setDoctorWorkingHoursMutation = useApiSetDoctorWorkingHours({
  onSuccess: () => {
    Notif.success('ساعت کاری با موفقیت ذخیره شد', { position: 'top' })
    internalShow.value = false
    emit('success')
  },
})

const isSubmitting = computed(() => setDoctorWorkingHoursMutation.isPending.value)

const updateHour = (blockIdx, hourIdx, field, value) => {
  scheduleBlocks.value[blockIdx].hours[hourIdx][field] = value
}

const addHour = (blockIdx) => {
  scheduleBlocks.value[blockIdx].hours.push({ start: '', end: '' })
}

const removeHour = (blockIdx, hourIdx) => {
  scheduleBlocks.value[blockIdx].hours.splice(hourIdx, 1)
  if (scheduleBlocks.value[blockIdx].hours.length === 0) {
    scheduleBlocks.value.splice(blockIdx, 1)
  }
}

const addBlock = () => {
  scheduleBlocks.value.push({ hours: [{ start: '', end: '' }], selectedDays: [] })
}

const handleCancel = () => {
  if (!isSubmitting.value) {
    internalShow.value = false
  }
}

const handleSubmit = async () => {
  const workingHours = Array.from({ length: 7 }, () => [])

  scheduleBlocks.value.forEach((block) => {
    const validHours = block.hours.filter((h) => h.start && h.end)
    if (validHours.length === 0) return

    block.selectedDays.forEach((dayIdx) => {
      workingHours[dayIdx] = validHours.map((h) => ({
        start: h.start,
        end: h.end,
      }))
    })
  })

  const hasAny = workingHours.some((arr) => arr.length > 0)
  if (!hasAny) {
    Notif.warning(
      scheduleBlocks.value.some((b) => b.selectedDays.length === 0)
        ? 'لطفا حداقل یک روز را انتخاب کنید'
        : 'لطفا حداقل یک بازه ساعت کاری وارد کنید',
      { position: 'top' }
    )
    return
  }

  try {
    await setDoctorWorkingHoursMutation.mutateAsync({
      doctorId: props.doctorId,
      branchId: props.branchId,
      workingHours,
    })
  } catch (error) {
    handleError(error)
  }
}

watch(
  () => props.show,
  (val) => {
    if (val) {
      scheduleBlocks.value = buildBlocks(props.workingHours)
      isDefaultRef.value = props.isDefault
    }
  }
)
</script>

<style scoped lang="scss">
.dwhd {
  width: 800px;
  border-radius: 12px;
  overflow: hidden;
  min-width: 600px;
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 24px 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 24px 24px 12px;
    max-height: 60vh;
    overflow-y: auto;
  }

  &__field {
    &-label {
      display: flex;
      align-items: center;
      gap: 3px;
      margin-bottom: 4px;
    }
  }

  &__req {
    color: #f44336;
    font-size: 14px;
  }

  &__block {
    display: flex;
    align-items: flex-start;
    gap: 0;
    background: rgba(158, 158, 158, 0.1);
    border-radius: 8px;
    padding: 12px;

    &__day-selected {
      font-size: 12px;
      font-weight: 500;
      color: #1d1d1d;
      padding: 0 $spacing-md;
    }

    &__day-list {
      padding: 0 $spacing-md;
    }

    &__time-col {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }

    &__time-row {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 40px;

      :deep(.timefield) {
        flex: 1;
        min-width: 0;

        .textfield {
          &__qinput {
            :deep(.q-field__control) {
              height: 40px;
            }
          }
        }
      }
    }

    &__remove-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.15s;

      &:hover {
        background: #ffeaea;
      }
    }

    &__add-time {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      border: 1px solid #98bdf1;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;

      &:hover {
        background: rgba(0, 85, 255, 0.04);
      }
    }

    &__v-sep {
      width: 1px;
      background: #eee;
      align-self: stretch;
      margin: 0 8px;
      flex-shrink: 0;
    }

    &__day-col {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex-shrink: 0;
      width: 188px;
    }

    &__day-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &__day-label {
      font-size: 14px;
      font-weight: 500;
      color: #2e2e2e;
      flex-shrink: 0;
    }
  }

  &__add-day {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 500;
    color: #0055ff;
    cursor: pointer;
    padding: 6px 0;
    opacity: 0.75;
    transition: opacity 0.15s;

    &:hover {
      opacity: 1;
    }
  }

  &__toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border: 1px solid #eee;
    border-radius: 12px;
  }

  &__footer {
    display: flex;
    align-items: center;
    padding: 16px 24px;
    border-top: 1px solid #eee;
    gap: 8px;
  }
}
</style>
