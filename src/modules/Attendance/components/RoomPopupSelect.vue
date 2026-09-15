<template>
  <div class="room-popup-select">
    <QBtn flat no-caps dense :ripple="false" class="room-popup-select__trigger">
      <div class="room-popup-select__content">
        <span v-if="selectedRoomName" class="room-popup-select__text">
          {{ selectedRoomName }}
        </span>
        <span v-else class="room-popup-select__placeholder">انتخاب اتاق...</span>
        <IconChevronDown :size="16" class="room-popup-select__icon" />
      </div>

      <QPopupProxy transition-show="scale" transition-hide="scale">
        <QList dense class="room-popup-select__list">
          <QItem v-if="isLoading" class="room-popup-select__loading">
            <QItemSection class="text-center text-grey-6">
              <QSpinnerTail size="20px" color="primary" />
              <span class="q-ml-sm">لطفا صبر کنید...</span>
            </QItemSection>
          </QItem>

          <QItem v-else-if="roomOptions.length === 0" class="room-popup-select__empty" clickable>
            <QItemSection class="text-center text-grey-6">هیچ اتاقی یافت نشد</QItemSection>
          </QItem>

          <template v-else>
            <QItem
              v-for="option in roomOptions"
              :key="option.value"
              v-close-popup
              :active="modelValue === option.value"
              active-class="room-popup-select__item--active"
              class="room-popup-select__item"
              clickable
              @click="handleSelect(option.value)"
            >
              <QItemSection>
                <QItemLabel>{{ option.label }}</QItemLabel>
              </QItemSection>
            </QItem>
          </template>
        </QList>
      </QPopupProxy>
    </QBtn>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IconChevronDown } from '@tabler/icons-vue'
import { useApiGetRooms } from '@/modules/Settings/ClinicSetting/query'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null,
  },
  branchId: {
    type: [Number, String],
    required: true,
  },
  roomName: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const { data: roomsData, isLoading } = useApiGetRooms({ branchId: Number(props.branchId) })

const roomOptions = computed(() => {
  if (!roomsData.value?.items) return []

  return roomsData.value.items
    .filter((room) => room?.branchId === props.branchId)
    .map((item) => ({
      label: item.title,
      value: item.id,
      rawData: item,
    }))
})

const selectedRoomName = computed(() => {
  if (!props.modelValue) return null
  return props.roomName || roomOptions.value.find((opt) => opt.value === props.modelValue)?.label
})

const handleSelect = (value) => {
  emit('update:modelValue', value)
}
</script>

<style lang="scss" scoped>
.room-popup-select {
  &__trigger {
    padding: 0;
    cursor: pointer;
  }

  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    width: 150px;
    padding: 6px 10px;
    border-radius: 4px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: $grey-3;
    }
  }

  &__text {
    font-size: 14px;
    color: $grey-9;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__placeholder {
    font-size: 14px;
    color: $grey-6;
  }

  &__icon {
    color: $grey-7;
    flex-shrink: 0;
    margin-right: auto;
  }

  &__list {
    min-width: 180px;
    max-height: 350px;
    border-radius: 4px;
    overflow-y: auto;
  }

  &__item {
    padding: 12px 8px;
    margin: 5px 10px;
    border-radius: 10px;
    &--active {
      background-color: $light-blue-1;
      color: $primary;
      font-weight: 600;
    }
  }

  &__loading,
  &__empty {
    min-height: 48px;
    padding: 12px 16px;
  }
}
</style>
