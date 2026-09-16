<template>
  <div class="financial-documents">
    <QInnerLoading :showing="isLoadingAll">
      <QSpinnerTail color="primary" size="50px" />
    </QInnerLoading>

    <!-- Documents List -->
    <div class="financial-documents__content">
      <div class="financial-documents__header">
        <QBtn
          outline
          color="primary"
          class="financial-documents__add-btn"
          @click="openUploadDialog"
        >
          <IconPlus :size="18" />
          <span>بارگذاری مدرک جدید</span>
        </QBtn>
        <QBtn flat round @click="refreshList">
          <IconRefresh class="cursor-pointer" />
        </QBtn>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoadingAll && allDocuments.length === 0" class="financial-documents__empty">
        <img
          src="@/assets/images/noFile.svg"
          alt="no-file"
          class="financial-documents__empty-image"
        />
        <span class="financial-documents__empty-title">هنوز مدرکی بارگذاری نشده!</span>
        <span class="financial-documents__empty-desc">
          فایلی برای این بیمار در سیستم ثبت نشده است
        </span>
      </div>

      <!-- Documents Grid -->
      <div v-else-if="!isLoadingAll && allDocuments.length > 0" class="financial-documents__grid">
        <div v-for="document in allDocuments" :key="document.id" class="financial-documents__card">
          <div class="financial-documents__card-image" @click="openDocument(document)">
            <img v-if="!isPdfFile(document)" :src="document.path" :alt="document.type" />
            <div v-else class="financial-documents__card-pdf">
              <QIcon name="picture_as_pdf" size="3rem" color="grey-7" />
            </div>
          </div>
          <div class="financial-documents__card-info">
            <div class="financial-documents__card-title">
              <span class="financial-documents__card-name">{{ getFileName(document.path) }}</span>
              <span class="financial-documents__card-date">
                {{ formatFileDate(document.createdAt) }}
              </span>
            </div>
            <div class="financial-documents__card-status">
              <QChip
                :class="getStatusClass(document.status)"
                :label="document.status?.title ?? 'بدون وضعیت'"
                square
                dense
              />
              <QBtn
                flat
                round
                dense
                size="sm"
                class="financial-documents__edit-btn"
                @click="openStatusEditDialog(document)"
              >
                <IconPencil class="text-secondary" :size="24" />
              </QBtn>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Dialog -->
    <QDialog v-model="showUploadModal" persistent>
      <QCard class="financial-documents__upload-dialog">
        <div class="financial-documents__upload-header">
          <span class="text-h6">بارگذاری مدرک جدید</span>
          <QBtn flat round dense @click="closeUploadDialog">
            <IconX :size="20" />
          </QBtn>
        </div>
        <QSeparator />
        <div class="financial-documents__upload-content">
          <BaseUploader
            ref="baseUploaderRef"
            :max-file-size="1048576 * 10"
            accept=".pdf, .jpg, .jpeg, .png, image/*, application/pdf"
            enum-type="user.financial-docs"
            :extra-params="{ entity_id: userId, entity_type: ENTITIES_TYPE.USER }"
            :auto-upload="false"
            multiple
            @upload-success="handleFileUpload"
            @upload-complete="handleUploadComplete"
          />
        </div>
        <QSeparator />
        <div class="financial-documents__upload-actions">
          <QBtn outline color="negative" label="انصراف" @click="closeUploadDialog" />
          <QBtn
            unelevated
            color="primary"
            label="ذخیره"
            :loading="isUploading"
            @click="saveUploadedFile"
          />
        </div>
      </QCard>
    </QDialog>

    <!-- Status Edit Dialog -->
    <QDialog v-model="showStatusEditModal" persistent>
      <QCard class="financial-documents__status-dialog">
        <div class="financial-documents__status-header">
          <span class="text-h6">تعیین وضعیت</span>
          <QBtn flat round dense @click="closeStatusEditDialog">
            <IconX :size="20" />
          </QBtn>
        </div>
        <QSeparator />
        <div class="financial-documents__status-content">
          <!-- File Preview -->
          <div v-if="selectedFile" class="financial-documents__status-preview">
            <img
              v-if="!isPdfFile(selectedFile)"
              :src="selectedFile.path"
              :alt="selectedFile.type"
            />
            <div v-else class="financial-documents__status-pdf">
              <QIcon name="picture_as_pdf" size="4rem" color="grey-7" />
            </div>
          </div>

          <!-- Status Select -->
          <QSelect
            v-model="statusEditForm.statusId"
            outlined
            :options="statusList"
            option-value="id"
            option-label="title"
            emit-value
            map-options
            label="وضعیت *"
            class="q-mb-md"
            :loading="isLoadingStatus"
            value="1"
          />
        </div>
        <QSeparator />
        <div class="financial-documents__status-actions">
          <QBtn outline color="negative" label="انصراف" @click="closeStatusEditDialog" />
          <QBtn
            unelevated
            color="primary"
            label="ذخیره"
            :loading="isUpdatingStatus"
            @click="saveStatusEdit"
          />
        </div>
      </QCard>
    </QDialog>

    <!-- Image Lightbox -->
    <ImageCarouselLightBox
      :imgs="lightboxImages"
      :index="lightboxIndex"
      :visible="showLightbox"
      @close="showLightbox = false"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { IconPencil, IconPlus, IconRefresh, IconX } from '@tabler/icons-vue'
import {
  useGetFilesByType,
  useGetFileStatusQuery,
  useVerifiedDocumentFileMutation,
} from '@/modules/User/query'
import { convertToJalali, formatDate } from '@/utils/date-utils'
import BaseUploader from '@/components/Form/BaseUploader/BaseUploader'
import ImageCarouselLightBox from '@/components/ImageCarousel'
import useDisclosure from '@/composables/use-disclosure'
import { Notif } from '@/data/services/notification-service'
import { useQueryClient } from '@tanstack/vue-query'
import { ENTITIES_TYPE } from '@/components/Form/BaseUploader'

const props = defineProps({
  userInfo: {
    type: Object,
    default: null,
  },
})

const queryClient = useQueryClient()

const [showUploadModal, { open: openUploadModal, close: closeUploadModal }] = useDisclosure()
const baseUploaderRef = ref(null)

const userId = computed(() => props.userInfo?.id)

const DOCUMENT_TYPE = 'financial-docs'

const { data: userDocuments, isLoading } = useGetFilesByType(userId, DOCUMENT_TYPE)
const { data: userCheques, isLoading: isLoadingCheques } = useGetFilesByType(userId, 'cheques')
const { data: statuses, isLoading: isLoadingStatus } = useGetFileStatusQuery()
const isUploading = computed(() => baseUploaderRef.value?.isUploading || false)
const { mutate: verifyDocument, isPending: isUpdatingStatus } = useVerifiedDocumentFileMutation()

const statusList = computed(() => statuses.value || [])

const isLoadingAll = computed(() => isLoading.value || isLoadingCheques.value)

// Combine financial-docs and cheques — the files endpoint wraps rows in an
// {items} envelope, so unwrap (tolerating either shape) before spreading.
const toFileRows = (value) =>
  Array.isArray(value?.items) ? value.items : Array.isArray(value) ? value : []
const allDocuments = computed(() => {
  const docs = toFileRows(userDocuments.value)
  const cheques = toFileRows(userCheques.value)
  const all = [...docs, ...cheques]
  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const refreshList = async () => {
  await queryClient.invalidateQueries({
    queryKey: ['user', 'files', DOCUMENT_TYPE, userId.value],
  })
  await queryClient.invalidateQueries({
    queryKey: ['user', 'files', 'cheques', userId.value],
  })
  Notif.success('لیست با موفقیت بروزرسانی شد')
}

const openUploadDialog = () => {
  openUploadModal()
}

const closeUploadDialog = () => {
  closeUploadModal()
}

const handleFileUpload = () => {
  // File upload handled by uploader component
}

const handleUploadComplete = ({ succeeded }) => {
  if (succeeded.length > 0) {
    Notif.success('فایل با موفقیت بارگذاری شد')
    closeUploadDialog()
    refreshList()
  }
}

const saveUploadedFile = async () => {
  if (isUploading.value) return

  if (!userId.value) {
    Notif.error('شناسه کاربر یافت نشد')
    return
  }

  if (!baseUploaderRef.value) {
    Notif.error('خطا در اتصال به آپلودر فایل')
    return
  }

  const pendingFiles = baseUploaderRef.value.getPendingFiles()
  if (!pendingFiles?.length) {
    Notif.warning('فایلی برای آپلود انتخاب نشده است')
    return
  }

  await baseUploaderRef.value.upload()
}

const [showStatusEditModal, { open: openStatusEditModal, close: closeStatusEditModal }] =
  useDisclosure()
const selectedFile = ref(null)
const statusEditForm = ref({
  statusId: null,
})

const openStatusEditDialog = (document) => {
  selectedFile.value = document
  statusEditForm.value = {
    statusId: document.status?.id || null,
  }
  openStatusEditModal()
}

const closeStatusEditDialog = () => {
  selectedFile.value = null
  statusEditForm.value = {
    statusId: null,
  }
  closeStatusEditModal()
}

const saveStatusEdit = () => {
  if (!selectedFile.value?.id || !statusEditForm.value.statusId) {
    Notif.warning('لطفا وضعیت را انتخاب کنید')
    return
  }

  const payload = {
    id: selectedFile.value.id,
    statusId: statusEditForm.value.statusId,
  }

  verifyDocument(payload, {
    onSuccess: (response) => {
      Notif.success(response?.message || 'وضعیت با موفقیت ذخیره شد')
      refreshList()
      closeStatusEditDialog()
    },
  })
}

const getFileName = (path) => {
  if (!path) return 'فایل'
  const parts = path.split('/')
  return parts.at(-1)
}

const formatFileDate = (date) => {
  if (!date) return ''
  return `${convertToJalali(date, 'jYYYY/jMM/jDD')} - ${formatDate(date, 'HH:mm')}`
}

const getStatusClass = (status) => {
  if (!status) return 'chips-secondary'
  if (status.id === 15) return 'chips-success'
  if (status.id === 14) return 'chips-secondary'
  return 'chips-error'
}

// Lightbox
const showLightbox = ref(false)
const lightboxIndex = ref(0)

const isPdfFile = (file) =>
  !!file &&
  (file.format === 'pdf' ||
    String(file.path || '')
      .toLowerCase()
      .endsWith('.pdf'))

const imageDocuments = computed(() => allDocuments.value.filter((doc) => !isPdfFile(doc)))

const lightboxImages = computed(() => imageDocuments.value.map((doc) => ({ src: doc.path })))

const openDocument = (document) => {
  if (isPdfFile(document)) {
    window.open(document.path, '_blank')
    return
  }
  const index = imageDocuments.value.findIndex((doc) => doc.id === document.id)
  if (index === -1) return
  lightboxIndex.value = index
  showLightbox.value = true
}
</script>

<style scoped lang="scss">
.financial-documents {
  padding: 16px;
  min-height: 400px;
  position: relative;

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
  }

  &__empty-image {
    width: 146px;
    height: auto;
    margin-bottom: 24px;
  }

  &__empty-title {
    font-size: 18px;
    font-weight: 600;
    color: $grey-8;
    margin-bottom: 8px;
  }

  &__empty-desc {
    font-size: 14px;
    color: $grey-6;
    margin-bottom: 24px;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__header {
    display: flex;
    justify-content: flex-end;
  }

  &__add-btn {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(45%, 1fr));
    gap: 16px;
  }

  &__card {
    background-color: $grey-1;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex: 2;
    align-items: center;
    padding: 12px;
    gap: 12px;
  }

  &__card-image {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &:hover {
      opacity: 0.8;
    }
  }

  &__card-pdf {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $grey-2;
  }

  &__card-info {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  &__card-title {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__card-name {
    font-size: 14px;
    font-weight: 600;
    color: $grey-9;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
  }

  &__card-date {
    font-size: 12px;
    color: $grey-6;
  }

  &__card-status {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__edit-btn {
    color: $grey-7;

    &:hover {
      color: $primary;
    }
  }

  &__upload-dialog {
    width: 400px;
    max-width: 90vw;
    padding: 16px;
    border-radius: 12px;
  }

  &__upload-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  &__upload-content {
    padding: 16px 0;
  }

  &__upload-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 12px;
  }

  &__status-dialog {
    width: 450px;
    max-width: 90vw;
    padding: 16px;
    border-radius: 12px;
  }

  &__status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  &__status-content {
    padding: 16px 0;
  }

  &__status-preview {
    margin-bottom: 16px;
    border-radius: 8px;
    overflow: hidden;
    background-color: $grey-2;

    img {
      width: 100%;
      max-height: 250px;
      object-fit: contain;
    }
  }

  &__status-pdf {
    min-height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__status-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 12px;
  }
}
</style>
