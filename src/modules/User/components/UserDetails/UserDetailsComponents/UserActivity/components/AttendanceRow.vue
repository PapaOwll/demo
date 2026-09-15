<template>
  <div class="attendance-row">
    <QAvatar square class="attendance-entry-icon">
      <IconDoorEnter :size="18" />
    </QAvatar>

    <TimeField
      v-if="isEditing"
      class="attendance-edit-input"
      size="sm"
      stack-label
      hide-picker
      label="ورود"
      :model-value="editForm.checkedInTime"
      @update:model-value="(val) => (editForm.checkedInTime = val)"
    />
    <div v-else class="attendance-time-cell">
      <span class="attendance-time-value direction-ltr">
        {{ formatEntryTime(attendance.checkedInAt) }}
      </span>
      <span class="attendance-time-label">ورود</span>
    </div>

    <div v-if="!isEditing" class="attendance-duration-cell">
      <span class="attendance-duration-label">
        {{ formatDuration(attendance.checkedInAt, attendance.checkedOutAt) }}
      </span>
      <div class="attendance-duration-line">
        <span class="attendance-duration-dot" />
        <span class="attendance-dotted-line" />
        <span class="attendance-duration-dot" />
      </div>
    </div>

    <TimeField
      v-if="isEditing"
      class="attendance-edit-input"
      size="sm"
      stack-label
      hide-picker
      label="خروج"
      :model-value="editForm.checkedOutTime"
      @update:model-value="(val) => (editForm.checkedOutTime = val)"
    />
    <div v-else class="attendance-time-cell">
      <span class="attendance-time-value direction-ltr">
        {{ formatEntryTime(attendance.checkedOutAt) }}
      </span>
      <span class="attendance-time-label">خروج</span>
    </div>

    <SelectField
      v-if="isEditing"
      class="attendance-edit-input"
      size="sm"
      variant="outline"
      label="مکان"
      emit-value
      map-options
      option-label="label"
      option-value="value"
      :model-value="editForm.location"
      :options="locationOptions"
      @update:model-value="(val) => (editForm.location = val)"
    />
    <div v-else class="attendance-location-cell">مکان : {{ getLocation(attendance) }}</div>

    <!-- Actions -->
    <div class="attendance-row-actions">
      <Button
        v-if="isEditing"
        variant="flat"
        color="grey"
        size="sm"
        type="button"
        is-icon-only
        :left-icon="IconX"
        @click="cancelEdit"
      />
      <Button
        v-if="isEditing"
        variant="filled"
        color="green"
        size="sm"
        type="button"
        is-icon-only
        :is-loading="isUpdating"
        :left-icon="IconCheck"
        @click="confirmEdit"
      />
      <Button
        v-if="!isEditing && canEdit"
        variant="flat"
        color="grey"
        size="sm"
        type="button"
        is-icon-only
        :left-icon="IconPencil"
        @click="startEdit"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Notif } from '@/data/services/notification-service'
import { IconPencil, IconDoorEnter, IconCheck, IconX } from '@tabler/icons-vue'
import Button from '@/base/Button'
import TimeField from '@/base/TimeField'
import SelectField from '@/base/SelectField'
import { useApiUpdateAttendance } from '@/modules/Attendance/query'
import { convertToJalali, formatDate } from '@/utils/date-utils'
import { handleError } from '@/utils/error-handler'

const props = defineProps({
  attendance: { type: Object, required: true },
  locationOptions: { type: Array, default: () => [] },
  canDelete: { type: Boolean, default: false },
  canEdit: { type: Boolean, default: false },
})

const emit = defineEmits(['delete', 'updated'])

const isEditing = ref(false)
const editForm = reactive({ checkedInTime: '', checkedOutTime: '', location: null })

const formatEntryTime = (time) => (time ? convertToJalali(time, 'HH:mm') : '-')

const getLocation = (attendance) => attendance?.room?.title || 'نامشخص'

const formatDuration = (checkedInAt, checkedOutAt) => {
  if (!checkedOutAt) return 'در حال حضور'
  const diffMs = new Date(checkedOutAt) - new Date(checkedInAt)
  if (Number.isNaN(diffMs) || diffMs < 0) return '-'
  const totalMinutes = Math.floor(diffMs / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0 && minutes > 0) return `${hours}:${String(minutes).padStart(2, '0')} ساعت`
  if (hours > 0) return `${hours} ساعت`
  return `${minutes} دقیقه`
}

const buildDateTime = (originalIso, time) => {
  if (!time) return null
  const baseDate = originalIso ? new Date(originalIso) : new Date()
  if (Number.isNaN(baseDate.getTime())) return null
  return `${formatDate(baseDate, 'YYYY-MM-DD')} ${time}:00`
}

const startEdit = () => {
  isEditing.value = true
  editForm.checkedInTime = formatEntryTime(props.attendance.checkedInAt)
  editForm.checkedOutTime = formatEntryTime(props.attendance.checkedOutAt)
  editForm.location = props.attendance?.room?.id || null
}

const cancelEdit = () => {
  isEditing.value = false
}

const { mutate: updateAttendance, isPending: isUpdating } = useApiUpdateAttendance()

const confirmEdit = () => {
  const checkedInAt = buildDateTime(props.attendance.checkedInAt, editForm.checkedInTime)
  const checkedOutAt = buildDateTime(
    props.attendance.checkedOutAt || props.attendance.checkedInAt,
    editForm.checkedOutTime
  )

  if (checkedInAt && checkedOutAt && new Date(checkedOutAt) <= new Date(checkedInAt)) {
    Notif.error('زمان خروج باید بعد از زمان ورود باشد')
    return
  }

  updateAttendance(
    {
      id: props.attendance.id,
      checkedInAt,
      checkedOutAt,
      roomId: editForm.location,
    },
    {
      onSuccess: (response) => {
        isEditing.value = false
        emit('updated')
        Notif.success(response?.message || 'تردد با موفقیت ویرایش شد')
      },
      onError: (error) => handleError(error),
    }
  )
}
</script>

<style scoped lang="scss">
.attendance-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: #f5f5f5;
}

.attendance-entry-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid $grey-4;
  background-color: $white;
  color: $grey-8;
}

.attendance-time-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.attendance-time-value {
  font-size: 13px;
  font-weight: 600;
  color: $grey-9;
}

.attendance-time-label {
  font-size: 13px;
  color: $grey-7;
}

.attendance-duration-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
  margin-top: -16px;
}

.attendance-duration-label {
  font-size: 11px;
  color: $grey-6;
}

.attendance-duration-line {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 4px;
}

.attendance-dotted-line {
  flex: 1;
  border-top: 1px dashed $grey-5;
}

.attendance-duration-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: $grey-6;
  flex-shrink: 0;
}

.attendance-location-cell {
  flex: 1;
  font-size: 13px;
  color: $grey-8;
  text-align: center;
}

.attendance-row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.delete-attendance-btn {
  border-radius: 6px;
}

.attendance-edit-input {
  width: 100%;
  max-width: 11rem;
  flex-shrink: 0;
}

.direction-ltr {
  direction: ltr;
}
</style>
