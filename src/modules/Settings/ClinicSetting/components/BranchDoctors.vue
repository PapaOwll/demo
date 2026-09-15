<template>
  <div class="bd">
    <QInnerLoading :showing="isLoading || isPending">
      <QSpinnerTail color="primary" size="lg" />
    </QInnerLoading>

    <template v-if="doctorsList?.length > 0">
      <div class="bd__header">
        <Typography variant="heading" size="h6">ساعت کاری پزشکان</Typography>
        <Button
          variant="filled"
          color="blue"
          :left-icon="IconPlus"
          text="افزودن پزشک"
          @click="openAddDialog"
        />
      </div>

      <div class="bd__list">
        <QExpansionItem
          v-for="item in doctorsList"
          :key="item.doctor?.id"
          class="bd__card"
          dense-toggle
          header-class="bd__card-header"
        >
          <template #header>
            <div class="bd__card-header__right">
              <QAvatar class="bd__card-header__right__avatar" size="36px" rounded>
                <IconStethoscope :size="20" color="#9e9e9e" />
              </QAvatar>
              <div class="bd__card-header__right__text">
                <Typography variant="body" size="2" weight="bold">
                  {{ item.doctor?.firstName || '' }} {{ item.doctor?.name || '' }}
                </Typography>
                <Typography v-if="item.doctor?.isDefault" variant="body" size="4" color="grey">
                  پزشک نسخه
                </Typography>
              </div>
            </div>
            <div class="bd__card-header__left" @click.stop>
              <Button variant="flat" color="dark" size="sm" @click="openEditDialog(item)">
                <IconPencil :size="24" />
              </Button>
              <Button variant="flat" color="red" size="sm" @click="confirmDeleteDoctor(item)">
                <IconTrash :size="24" />
              </Button>
            </div>
          </template>

          <div class="bd__card-body">
            <template v-if="item.workingHours?.length > 0">
              <div
                v-for="group in groupScheduleByTimeSlots(item.workingHours)"
                :key="group.key"
                class="bd__card-body__row"
              >
                <Typography variant="body" size="3" color="grey" weight="medium">
                  {{ group.days.join('، ') }}
                </Typography>
                <div class="bd__card-body__row__slots">
                  <template v-for="(slot, idx) in group.slots" :key="slot.start + slot.end">
                    <div class="bd__time-slot">
                      <span class="bd__time-slot__label">از</span>
                      <span>{{ slot.start }}</span>
                      <span class="bd__time-slot__sep">تا</span>
                      <span>{{ slot.end }}</span>
                    </div>
                    <span v-if="idx < group.slots.length - 1" class="bd__time-sep">،</span>
                  </template>
                </div>
              </div>
            </template>
            <Typography v-else variant="body" size="2" color="grey">ساعت کاری ثبت نشده</Typography>
          </div>
        </QExpansionItem>
      </div>
    </template>

    <div v-else class="bd__no-data">
      <QImg width="200px" :src="NoData" />
      <Typography variant="heading" size="h6">پزشکی ثبت نشده</Typography>
      <Typography variant="body" size="3" color="grey">
        هنوز پزشکی به این شعبه اختصاص داده نشده است.
      </Typography>
      <Button variant="filled" color="blue" text="افزودن پزشک" @click="openAddDialog" />
    </div>
  </div>

  <DoctorFormDialog
    v-model:show="doctorDialogVisible"
    :branch-id="branchId"
    :edit-data="editDoctorData"
    @success="handleDoctorSuccess"
  />

  <DoctorWorkingHoursDialog
    v-model:show="workingHoursDialogVisible"
    :branch-id="branchId"
    :doctor-id="selectedDoctorId"
    :doctor-name="selectedDoctorName"
    :working-hours="selectedWorkingHours"
    :is-default="selectedDoctorIsDefault"
    @success="handleDoctorSuccess"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import NoData from '@/assets/images/noData.svg'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import { IconStethoscope, IconPencil, IconTrash, IconPlus } from '@tabler/icons-vue'
import DoctorFormDialog from './DoctorFormDialog'
import DoctorWorkingHoursDialog from './DoctorWorkingHoursDialog'
import { useApiGetBranchDoctorsList, useApiRemoveBranchDoctorMutation } from '../query'
import { Notif, confirmDialog } from '@/data/services/notification-service'

const props = defineProps({
  branchId: {
    type: [Number, String],
    required: true,
  },
})

const dayLabels = {
  0: 'شنبه',
  1: 'یکشنبه',
  2: 'دوشنبه',
  3: 'سه‌شنبه',
  4: 'چهارشنبه',
  5: 'پنجشنبه',
  6: 'جمعه',
}

const doctorDialogVisible = ref(false)
const editDoctorData = ref(null)
const workingHoursDialogVisible = ref(false)
const selectedDoctorId = ref(null)
const selectedDoctorName = ref('')
const selectedWorkingHours = ref([])
const selectedDoctorIsDefault = ref(false)

const {
  data: doctors,
  isLoading,
  refetch,
} = useApiGetBranchDoctorsList({
  branchId: computed(() => props.branchId),
  enabled: computed(() => !!props.branchId),
})

const { mutate: removeDoctorMutation, isPending } = useApiRemoveBranchDoctorMutation()

const doctorsList = computed(() => {
  return doctors.value ?? []
})

const groupScheduleByTimeSlots = (workingHours) => {
  const groups = {}

  workingHours.forEach((wh) => {
    const slots = (wh.hours || [])
      .map((h) => `${h.startTime}-${h.endTime}`)
      .sort()
      .join('|')

    if (!groups[slots]) {
      groups[slots] = {
        key: slots,
        slots: (wh.hours || []).map((h) => ({ start: h.startTime, end: h.endTime })),
        dayIndices: [],
      }
    }
    groups[slots].dayIndices.push(wh.dayOfWeek)
  })

  return Object.values(groups).map((g) => ({
    ...g,
    days: g.dayIndices.sort().map((d) => dayLabels[d] || ''),
  }))
}

const deleteDoctor = (item) => {
  if (!item) return
  if (isPending.value) return

  const payload = {
    branchId: props.branchId,
    doctorId: item.doctor?.id,
  }

  removeDoctorMutation(
    { ...payload },
    {
      onSuccess: () => {
        Notif.success('پزشک با موفقیت حذف شد', { position: 'top' })
        refetch()
      },
    }
  )
}

const confirmDeleteDoctor = (item) => {
  if (!item) return

  const doctorName =
    `${item.doctor?.firstName || ''} ${item.doctor?.name || ''}`.trim() || 'این پزشک'

  confirmDialog(
    'تایید حذف',
    `آیا از حذف پزشک «${doctorName}» اطمینان دارید؟`,
    () => {
      deleteDoctor(item)
    },
    {
      ok: { label: 'تایید', color: 'negative', flat: true },
      cancel: { label: 'انصراف', color: 'grey', flat: true },
      persistent: true,
    }
  )
}

const openAddDialog = () => {
  editDoctorData.value = null
  doctorDialogVisible.value = true
}

const openEditDialog = (item) => {
  if (item) {
    selectedDoctorId.value = item.doctor?.id
    selectedDoctorName.value = `${item.doctor?.firstName || ''} ${item.doctor?.name || ''}`
    selectedWorkingHours.value = item.workingHours || []
    selectedDoctorIsDefault.value = !!item.doctor?.isDefault
    workingHoursDialogVisible.value = true
  }
}

const handleDoctorSuccess = () => {
  refetch()
}
</script>

<style scoped lang="scss">
.bd {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
  }

  &__card-body {
    background-color: white;
    margin: $spacing-md;
    border-radius: $spacing-sm;
    padding: $spacing-sm !important;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__card {
    background-color: $grey-2;
    border: 1px solid #eeeeee;
    border-radius: $spacing-sm;
    overflow: hidden;

    :deep(.q-expansion-item__toggle-icon) {
      display: none;
    }
    :deep(.q-item__section--side) {
      padding: 0;
    }

    &-header {
      &__right {
        display: flex;
        align-items: center;
        gap: 8px;

        &__text {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        &__avatar {
          width: 48px;
          height: 48px;
          background: #ffffff;
          border-radius: 8px;
        }
      }

      &__left {
        display: flex;
        align-items: center;
        margin-right: auto;
      }
    }

    &-body {
      padding: 0 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      &__row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $spacing-xs $spacing-md;

        &__slots {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          flex-direction: row-reverse;
        }
      }
    }
  }

  &__time-sep {
    color: #9e9e9e;
    font-size: 12px;
  }

  &__time-slot {
    display: flex;
    align-items: flex-end;
    gap: 8px;

    &__label {
      font-size: 12px;
      color: #9e9e9e;
    }

    &__sep {
      font-size: 12px;
      color: #9e9e9e;
    }
  }

  &__no-data {
    padding: 1.5rem 1rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }
}
</style>
