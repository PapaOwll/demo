<template>
  <QInnerLoading :showing="isLoading">
    <QSpinnerTail color="primary" size="lg" />
  </QInnerLoading>

  <div v-if="locations.length > 0 || isEditing" class="lt">
    <div class="lt__header">
      <Typography variant="heading" size="h6">مکان‌ها</Typography>
      <Button
        variant="filled"
        color="blue"
        :left-icon="IconPlus"
        text="افزودن مکان"
        @click="addNewLocation"
      />
    </div>

    <div class="lt__list">
      <!-- New Location Form -->
      <div v-if="isNewLocationAdded" class="lt__list-card">
        <div class="lt__list-card__title">
          <QAvatar class="rounded-borders" color="white" text-color="grey">
            <IconBuilding />
          </QAvatar>
          <QInput
            ref="newLocationInputRef"
            v-model="newLocationName"
            outlined
            stack-label
            label="نام مکان"
            class="full-width"
            placeholder="نام مکان را وارد کنید *"
            @keyup.enter="saveNewLocation"
          />
        </div>
        <div class="lt__list-card__actions">
          <Button
            variant="flat"
            color="green"
            :disable="!newLocationName.trim() || isSaving"
            :is-loading="isSaving"
            @click="saveNewLocation"
          >
            <IconCheck />
          </Button>
          <Button variant="flat" color="grey" :disable="isSaving" @click="cancelNewLocation">
            <IconX />
          </Button>
        </div>
      </div>

      <!-- Existing Locations -->
      <div
        v-for="location in locations"
        :key="location.id"
        class="lt__list-card"
        :class="{ 'lt__list-card--editing': editingLocationId === location.id }"
      >
        <!-- View Mode -->
        <template v-if="editingLocationId !== location.id">
          <div class="lt__list-card__title">
            <QAvatar class="rounded-borders" color="white" text-color="grey">
              <IconBuilding />
            </QAvatar>
            <Typography variant="body" size="1" weight="semibold">
              {{ location.title || 'نام مکان' }}
            </Typography>
          </div>
          <div class="lt__list-card__actions">
            <Button variant="flat" color="grey" @click="startEdit(location)">
              <IconPencil />
            </Button>
            <Button variant="flat" color="red" @click="confirmDelete(location)">
              <IconTrash />
            </Button>
          </div>
        </template>

        <!-- Edit Mode -->
        <template v-else>
          <div class="lt__list-card__title">
            <QAvatar class="rounded-borders" color="white" text-color="grey">
              <IconBuilding />
            </QAvatar>
            <QInput
              ref="editInputRef"
              v-model="editingLocationName"
              outlined
              dense
              class="full-width"
              placeholder="نام مکان را وارد کنید *"
              @keyup.enter="saveEdit"
            />
          </div>
          <div class="lt__list-card__actions">
            <Button
              variant="flat"
              color="green"
              :disable="!editingLocationName.trim() || isSaving"
              :is-loading="isSaving"
              @click="saveEdit"
            >
              <IconCheck />
            </Button>
            <Button variant="flat" color="grey" :disable="isSaving" @click="cancelEdit">
              <IconX />
            </Button>
          </div>
        </template>
      </div>
    </div>
  </div>

  <div v-else class="lt__no-data">
    <QImg width="200px" :src="NoData" />
    <Typography variant="heading" size="h6">مکانی ثبت نشده</Typography>
    <Typography variant="body" size="3" color="grey">
      هنوز مکانی به این شعبه اختصاص داده نشده است.
    </Typography>
    <Button variant="filled" color="blue" text="افزودن مکان" @click="addNewLocation" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import NoData from '@/assets/images/noData.svg'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import { IconPlus, IconBuilding, IconTrash, IconPencil, IconCheck, IconX } from '@tabler/icons-vue'
import { useApiGetRooms, useApiCreateRoom, useApiUpdateRoom, useApiDeleteRoom } from '../query'
import { Notif, confirmDialog } from '@/data/services/notification-service'

const props = defineProps({
  branchId: {
    type: [String, Number],
    required: true,
  },
})

const emit = defineEmits(['afterSubmit'])

// API
const { data: roomsData, isLoading, refetch } = useApiGetRooms({ branchId: props.branchId })

// Data
const locations = computed(
  () => roomsData.value?.items?.filter((room) => room?.branchId === props.branchId) || []
)

// State
const isNewLocationAdded = ref(false)
const newLocationName = ref('')
const newLocationInputRef = ref(null)

const editingLocationId = ref(null)
const editingLocationName = ref('')
const editInputRef = ref(null)

const isEditing = computed(() => isNewLocationAdded.value || editingLocationId.value !== null)

// Helper functions
const cancelNewLocation = () => {
  isNewLocationAdded.value = false
  newLocationName.value = ''
}

const cancelEdit = () => {
  editingLocationId.value = null
  editingLocationName.value = ''
}

// Mutations
const { mutate: removeLocationMutation, isPending } = useApiDeleteRoom({
  onSuccess: () => {
    refetch()
    emit('afterSubmit')
    Notif.success('مکان با موفقیت حذف شد', { position: 'top' })
  },
})

const createRoomMutation = useApiCreateRoom({
  onSuccess: () => {
    refetch()
    emit('afterSubmit')
    cancelNewLocation()
    Notif.success('مکان با موفقیت اضافه شد', { position: 'top' })
  },
  onError: (error) => {
    Notif.error(error.response?.data?.message || 'خطا در ذخیره مکان', { position: 'top' })
  },
})

const updateRoomMutation = useApiUpdateRoom({
  onSuccess: () => {
    refetch()
    emit('afterSubmit')
    cancelEdit()
    Notif.success('مکان با موفقیت ویرایش شد', { position: 'top' })
  },
  onError: (error) => {
    Notif.error(error.response?.data?.message || 'خطا در بروزرسانی مکان', { position: 'top' })
  },
})

// Computed loading state
const isSaving = computed(
  () => createRoomMutation.isPending.value || updateRoomMutation.isPending.value
)

// Methods
const addNewLocation = () => {
  if (isNewLocationAdded.value) {
    nextTick(() => newLocationInputRef.value?.focus())
    return
  }
  isNewLocationAdded.value = true
  newLocationName.value = ''
  nextTick(() => newLocationInputRef.value?.focus())
}

const saveNewLocation = () => {
  if (!newLocationName.value.trim()) {
    Notif.warning('نام مکان الزامی است', { position: 'top' })
    return
  }
  createRoomMutation.mutate({
    title: newLocationName.value.trim(),
    branchId: props.branchId,
  })
}

const startEdit = (location) => {
  editingLocationId.value = location.id
  editingLocationName.value = location.title
  nextTick(() => editInputRef.value?.focus())
}

const saveEdit = () => {
  if (!editingLocationName.value.trim()) {
    Notif.warning('نام مکان الزامی است', { position: 'top' })
    return
  }
  updateRoomMutation.mutate({
    id: editingLocationId.value,
    title: editingLocationName.value.trim(),
  })
}

const confirmDelete = (location) => {
  confirmDialog(
    'تایید حذف',
    `آیا از حذف مکان «${location.title || 'این مکان'}» اطمینان دارید؟`,
    () => {
      if (!isPending.value) {
        removeLocationMutation(location.id)
      }
    },
    {
      ok: { label: 'تایید', color: 'negative', flat: true },
      cancel: { label: 'انصراف', color: 'grey', flat: true },
      persistent: true,
    }
  )
}

const submit = () => {
  if (isNewLocationAdded.value && newLocationName.value.trim()) {
    saveNewLocation()
  } else if (editingLocationId.value && editingLocationName.value.trim()) {
    saveEdit()
  }
}

defineExpose({ submit })
</script>

<style scoped lang="scss">
.lt {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    &-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-md;
      background-color: $grey-1;
      border: 1px solid $grey-2;
      border-radius: $radius-sm;

      &--editing {
        padding: $spacing-lg $spacing-md;
      }

      &__title {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
      }

      &__actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  &__no-data {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }
}
</style>
