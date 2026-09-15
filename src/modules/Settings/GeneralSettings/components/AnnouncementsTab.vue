<template>
  <div class="at">
    <div class="at__header">
      <Typography variant="heading" size="h6">اطلاعیه‌ها</Typography>
      <Button
        variant="filled"
        color="blue"
        :left-icon="IconPlus"
        text="افزودن اطلاعیه"
        @click="openCreateModal"
      />
    </div>

    <div v-if="announcements.length > 0" class="at__list">
      <!-- Existing Announcements -->
      <QExpansionItem
        v-for="announcement in announcements"
        :key="announcement.id"
        class="at__list-card"
      >
        <template #header>
          <div class="at__list-card__header">
            <div class="at__list-card__header-section">
              <QAvatar class="rounded-borders" color="white" text-color="grey">
                <IconBell />
              </QAvatar>
              <div class="at__list-card__title">
                <Typography variant="body" size="3" weight="semibold">
                  {{ announcement.title }}
                </Typography>
              </div>
              <div class="at__list-card__title at__list-card__metadata-item">
                <IconBuilding v-if="announcement.branches?.length" size="16px" />
                <Typography variant="caption" color="grey">
                  {{ branchNames(announcement.branches) }}
                </Typography>
              </div>
              <div class="at__list-card__title at__list-card__metadata-item">
                <IconCalendar v-if="dateRange(announcement)" size="16px" />
                <Typography variant="caption" color="grey">
                  {{ dateRange(announcement) }}
                </Typography>
              </div>
            </div>

            <div class="at__list-card__header-actions" @click.stop>
              <QToggle
                :model-value="announcement.isActive"
                color="green"
                @update:model-value="() => toggleActiveStatus(announcement)"
              />
              <Button variant="flat" color="grey" @click="startEdit(announcement)">
                <IconPencil />
              </Button>
              <Button variant="flat" color="red" @click="confirmDelete(announcement)">
                <IconTrash />
              </Button>
            </div>
          </div>
        </template>

        <template #default>
          <!-- View Mode -->
          <div v-if="editingAnnouncement?.id !== announcement.id" class="at__list-card__content">
            <div class="at__list-card__message">
              <Typography variant="body" size="3">{{ announcement.text }}</Typography>
            </div>
            <div class="at__list-card__metadata">
              <div class="at__list-card__metadata-item">
                <IconClock size="16px" />
                <Typography variant="caption" color="grey">
                  تاریخ ایجاد: {{ formatPersianDate(announcement.createdAt) }}
                </Typography>
              </div>
              <div class="at__list-card__metadata-item">
                <Typography variant="caption" :color="announcement.isActive ? 'green' : 'red'">
                  وضعیت: {{ announcement.isActive ? 'فعال' : 'غیرفعال' }}
                </Typography>
              </div>
            </div>
          </div>

          <!-- Edit Mode - Opens Modal -->
          <div v-else class="at__list-card__content at__list-card__content--editing">
            <Typography variant="body" size="3" color="grey">
              برای ویرایش، پنجره ویرایش باز شده است
            </Typography>
          </div>
        </template>
      </QExpansionItem>
    </div>
    <div v-else-if="!isLoading" class="at__no-data">
      <QImg width="200px" :src="NoData" />
      <Typography variant="heading" size="h6">اطلاعیه‌ای ثبت نشده</Typography>
      <Typography variant="body" size="3" color="grey">هنوز اطلاعیه‌ای ثبت نشده است.</Typography>
      <Button variant="filled" color="blue" text="افزودن اطلاعیه" @click="openCreateModal" />
    </div>

    <QInnerLoading :showing="isLoading">
      <QSpinnerTail color="primary" size="lg" />
    </QInnerLoading>
  </div>

  <!-- Announcement Form Modal -->
  <AnnouncementFormModal
    v-model:show="isModalOpen"
    :announcement="editingAnnouncement"
    @success="handleModalSuccess"
  />
</template>

<script setup>
import { ref, computed, watch, toRefs } from 'vue'
import NoData from '@/assets/images/noData.svg'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import AnnouncementFormModal from './AnnouncementFormModal'
import {
  IconPlus,
  IconBell,
  IconTrash,
  IconPencil,
  IconCalendar,
  IconClock,
  IconBuilding,
} from '@tabler/icons-vue'
import {
  useApiGetAnnouncements,
  useApiDeleteAnnouncement,
  useApiUpdateAnnouncement,
} from '../query'
import { convertToJalali, formatDateRange } from '@/utils/date-utils'
import { useQueryClient } from '@tanstack/vue-query'
import { Notif, confirmDialog } from '@/data/services/notification-service'

const props = defineProps({
  branchId: {
    type: [String, Number],
    default: undefined,
  },
  submit: {
    type: Boolean,
    default: false,
  },
  refresh: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['afterSubmit', 'afterRefresh'])
const { refresh } = toRefs(props)

const queryClient = useQueryClient()

const {
  data: announcementsData,
  isLoading,
  refetch,
  isPaused,
} = useApiGetAnnouncements({ branchId: props.branchId })

const announcements = computed(
  () => announcementsData.value?.items || announcementsData.value || []
)

const isModalOpen = ref(false)
const editingAnnouncement = ref(null)

const formatPersianDate = (date) => {
  if (!date) return 'نامشخص'
  try {
    return convertToJalali(new Date(date), 'jDD jMMMM jYYYY')
  } catch {
    return 'نامشخص'
  }
}

const dateRange = (announcement) => {
  return formatDateRange(announcement.startsAt, announcement.expiresAt)
}

const branchNames = (branches) => {
  if (!branches || branches.length === 0) return ''
  const names = branches.map((b) => b.name)
  const maxVisible = 3
  const visible = names.slice(0, maxVisible)
  const hidden = names.slice(maxVisible)

  if (hidden.length > 0) {
    return `${visible.join('، ')} و ${hidden.length} شعبه دیگر`
  }
  return visible.join('، ')
}

const openCreateModal = () => {
  editingAnnouncement.value = null
  isModalOpen.value = true
}

const startEdit = (announcement) => {
  editingAnnouncement.value = announcement
  isModalOpen.value = true
}

const handleModalSuccess = () => {
  refetch()
  emit('afterSubmit')
}

const toggleAnnouncementMutation = useApiUpdateAnnouncement({
  onSuccess: () => {
    refetch()
    emit('afterSubmit')
  },
  onError: (error) => {
    refetch()
    Notif.error(error.response?.data?.message || 'خطا در تغییر وضعیت اطلاعیه', { position: 'top' })
  },
})

const toggleActiveStatus = (announcement) => {
  const newStatus = !announcement.isActive
  toggleAnnouncementMutation.mutate({
    id: announcement.id,
    isActive: newStatus,
  })
}

const { mutate: removeAnnouncementMutation, isPending: isDeleting } = useApiDeleteAnnouncement({
  onSuccess: () => {
    refetch()
    emit('afterSubmit')
    Notif.success('اطلاعیه با موفقیت حذف شد', { position: 'top' })
  },
  onError: (error) => {
    Notif.error(error.response?.data?.message || 'خطا در حذف اطلاعیه', { position: 'top' })
  },
})

const confirmDelete = (announcement) => {
  confirmDialog(
    'تایید حذف',
    `آیا از حذف اطلاعیه «${announcement.title}» اطمینان دارید؟`,
    () => {
      if (!isDeleting.value) {
        removeAnnouncementMutation(announcement.id)
      }
    },
    {
      ok: { label: 'تایید', color: 'negative', flat: true },
      cancel: { label: 'انصراف', color: 'grey', flat: true },
      persistent: true,
    }
  )
}

const refreshData = async () => {
  await queryClient.invalidateQueries({ queryKey: ['announcements', props.branchId] })
  if (isPaused) {
    Notif.error('خطا در دریافت اطلاعات', {
      caption: 'لطفا مجدد تلاش کنید',
    })
  } else {
    Notif.success('لیست بروزرسانی شد')
  }
}

watch(
  () => refresh.value,
  (value) => {
    if (value) {
      refreshData()
      emit('afterRefresh')
    }
  }
)
</script>

<style scoped lang="scss">
.at {
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
      background-color: $grey-1;
      border: 1px solid $grey-2;
      border-radius: $radius-sm;
      overflow: hidden;

      &--editing {
        padding: $spacing-lg $spacing-md;
      }

      &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: $spacing-md;
        gap: 10px;
      }

      &__header-section {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
      }

      &__title {
        flex: 1;
      }

      &__header-actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      &__content {
        padding: $spacing-md;
        border-top: 1px solid $grey-3;

        &--editing {
          padding: $spacing-md;
        }
      }

      &__message {
        margin-bottom: $spacing-md;
      }

      &__metadata {
        display: flex;
        flex-direction: column;
        gap: 8px;

        &-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
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
