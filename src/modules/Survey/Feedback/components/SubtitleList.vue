<template>
  <div class="subtitle-list">
    <!-- Header -->
    <div class="subtitle-list__header">
      <div class="subtitle-list__header-left">
        <span class="subtitle-list__title">زیرنویس‌های تلویزیون</span>
      </div>
      <div class="subtitle-list__header-right">
        <QBtn
          unelevated
          color="primary"
          label="افزودن زیرنویس"
          icon="add"
          @click="openCreateModal"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="subtitle-list__loading">
      <QSpinnerTail color="primary" size="3rem" />
      <span>در حال بارگذاری...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="subtitle-list__error">
      <IconAlertCircle class="text-negative" size="3rem" />
      <span>{{ error?.message || 'خطا در بارگذاری داده' }}</span>
      <QBtn color="primary" label="تلاش مجدد" @click="refetch" />
    </div>

    <!-- Table -->
    <QTable
      v-else
      flat
      bordered
      :rows="subtitleRows"
      :columns="columns"
      row-key="id"
      :pagination="pagination"
      class="quasar-table"
      no-data-label="زیرنویسی یافت نشد"
      @request="onRequest"
    >
      <!-- Is Active Column -->
      <template #body-cell-isActive="scope">
        <QTd :props="scope">
          <QChip
            :color="scope.row?.isActive ? 'positive' : 'negative'"
            text-color="white"
            size="sm"
          >
            {{ scope.row?.isActive ? 'فعال' : 'غیرفعال' }}
          </QChip>
        </QTd>
      </template>

      <!-- Actions Column -->
      <template #body-cell-actions="scope">
        <QTd :props="scope" class="subtitle-list__actions-cell">
          <QBtn
            flat
            round
            dense
            color="primary"
            icon="visibility"
            @click="openShowModal(scope.row)"
          >
            <QTooltip>مشاهده</QTooltip>
          </QBtn>
          <QBtn flat round dense color="warning" icon="edit" @click="openEditModal(scope.row)">
            <QTooltip>ویرایش</QTooltip>
          </QBtn>
          <QBtn flat round dense color="negative" icon="delete" @click="handleDelete(scope.row)">
            <QTooltip>حذف</QTooltip>
          </QBtn>
        </QTd>
      </template>
    </QTable>

    <!-- Subtitle Form Modal -->
    <SubtitleFormModal
      v-model="showModal"
      :subtitle-id="selectedSubtitleId"
      :mode="modalMode"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import { IconAlertCircle } from '@tabler/icons-vue'
import { useTvSubtitleList, useDeleteTvSubtitle } from '../query/subtitle'
import SubtitleFormModal from './SubtitleFormModal'
import { handleError } from '@/utils/error-handler'

// Table columns
const columns = [
  {
    name: 'id',
    label: 'شناسه',
    field: 'id',
    align: 'center',
    sortable: true,
  },
  {
    name: 'text',
    label: 'متن زیرنویس',
    field: 'text',
    align: 'right',
    sortable: false,
  },
  {
    name: 'sortOrder',
    label: 'ترتیب نمایش',
    field: 'sortOrder',
    align: 'center',
    sortable: true,
  },
  {
    name: 'isActive',
    label: 'وضعیت',
    field: 'isActive',
    align: 'center',
    sortable: true,
  },
  {
    name: 'actions',
    label: 'عملیات',
    field: 'actions',
    align: 'center',
    sortable: false,
  },
]

// Pagination
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
})

// Query params
const queryParams = ref({})

// Fetch subtitles
const { data: subtitlesResponse, isLoading, error, refetch } = useTvSubtitleList(queryParams)

const subtitleRows = computed(() => {
  const items = subtitlesResponse.value?.data?.items || subtitlesResponse.value?.data || []
  return items.map((item) => ({
    id: item.id,
    text: item.text,
    sortOrder: item.sortOrder || item.sort_order || '-',
    isActive: item.isActive ?? item.is_active ?? false,
  }))
})

// Modal state
const showModal = ref(false)
const selectedSubtitleId = ref(null)
const modalMode = ref('create') // 'create', 'edit', 'show'

// Delete mutation
const { mutate: deleteSubtitle } = useDeleteTvSubtitle()

// Modal handlers
const openCreateModal = () => {
  modalMode.value = 'create'
  selectedSubtitleId.value = null
  showModal.value = true
}

const openShowModal = (row) => {
  modalMode.value = 'show'
  selectedSubtitleId.value = row.id
  showModal.value = true
}

const openEditModal = (row) => {
  modalMode.value = 'edit'
  selectedSubtitleId.value = row.id
  showModal.value = true
}

const handleDelete = (row) => {
  confirmDialog(
    'حذف زیرنویس',
    `آیا از حذف این زیرنویس اطمینان دارید؟`,
    () => {
      deleteSubtitle(row.id, {
        onSuccess: () => {
          Notif.success('زیرنویس با موفقیت حذف شد')
          refetch()
        },
        onError: (err) => {
          handleError(err)
        },
      })
    },
    { ok: { label: 'حذف', color: 'negative' } }
  )
}

const handleSuccess = () => {
  refetch()
}

const onRequest = (props) => {
  const { page, rowsPerPage } = props.pagination
  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
}
</script>

<style scoped lang="scss">
.subtitle-list {
  padding: 1rem;

  &__header {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  &__header-left {
    display: flex;
    flex: 1;
    gap: 0.25rem;
    align-items: center;
    min-width: 0;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
  }

  &__header-right {
    display: flex;
    gap: 0.5rem;
  }

  &__table {
    border-radius: 0.5rem;

    :deep(.q-table tbody tr) {
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: rgba($primary, 0.04);
      }
    }
  }

  &__loading,
  &__error {
    width: 100%;
    height: 50vh;
    margin: 0 auto;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1rem;
  }

  &__actions-cell {
    display: flex;
    gap: 0.25rem;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .subtitle-list {
    &__header {
      flex-direction: column;
      align-items: stretch;
    }
  }
}
</style>
