<template>
  <div class="radiology-images">
    <QInnerLoading :showing="isLoading">
      <QSpinnerTail color="primary" size="50px" />
    </QInnerLoading>

    <!-- Images Grid -->
    <div class="radiology-images__content">
      <div class="radiology-images__header">
        <QBtn outline color="primary" class="radiology-images__add-btn" @click="openUploadDialog">
          <IconPlus :size="18" />
          <span>بارگذاری مدرک</span>
        </QBtn>
        <QBtn flat round @click="refreshList">
          <IconRefresh class="cursor-pointer" />
        </QBtn>
      </div>
      <!-- Empty State -->
      <div v-if="!isLoading && radiologyImages.length === 0" class="radiology-images__empty">
        <img src="@/assets/images/noData.svg" alt="no-data" class="radiology-images__empty-image" />
        <span class="radiology-images__empty-title">هنوز چیزی بارگذاری نکردی!</span>
        <span class="radiology-images__empty-desc">عکس رادیولوژی برای این بیمار ثبت نشده</span>
      </div>
      <div v-else-if="!isLoading && radiologyImages.length > 0" class="radiology-images__grid">
        <div
          v-for="(image, index) in radiologyImages"
          :key="image.id"
          class="radiology-images__card"
        >
          <div class="radiology-images__card-image" @click="showImageLightBox(index)">
            <img :src="image.path" :alt="image.type" />
          </div>
          <div class="radiology-images__card-info">
            <div class="radiology-images__card-title">
              <span class="radiology-images__card-type">{{ getImageTypeLabel(image.type) }}</span>
              <span class="radiology-images__card-date">
                {{ formatImageDate(image.createdAt) }}
              </span>
            </div>
            <div class="radiology-images__card-status">
              <QChip
                :class="getStatusClass(image.status)"
                :label="image.status?.title ?? 'بدون وضعیت'"
                square
                dense
              />

              <QBtn
                v-if="canEdit(image.type)"
                flat
                round
                dense
                size="sm"
                class="radiology-images__edit-btn"
                @click="openStatusEditDialog(image)"
              >
                <IconPencil class="text-secondary" :size="24" />
              </QBtn>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Upload Dialog -->
    <UserRadiologyUploader
      ref="uploaderRef"
      :allowed-types="['user.opg', 'user.cbct', 'user.docs']"
      :user-id="userId"
      @upload-complete="refreshList"
    />

    <!-- OPG Request Dialog -->
    <UserPrescription :visible="showOpgModal" :user-data="userData" @close="closeOpgDialog" />

    <!-- Image Lightbox -->
    <ImageCarouselLightBox
      :imgs="lightboxImages"
      :index="lightboxIndex"
      :visible="showLightbox"
      @close="showLightbox = false"
    />

    <!-- Status Edit Dialog -->
    <QDialog v-model="showStatusEditModal" persistent>
      <QCard class="radiology-images__status-dialog">
        <div class="radiology-images__status-header">
          <span class="text-h6">تعیین وضعیت</span>
          <QBtn flat round dense @click="closeStatusEditDialog">
            <IconX :size="20" />
          </QBtn>
        </div>
        <QSeparator />
        <div class="radiology-images__status-content">
          <!-- Image Preview -->
          <div v-if="selectedImage" class="radiology-images__status-preview">
            <img :src="selectedImage.path" :alt="selectedImage.type" />
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
        <div class="radiology-images__status-actions">
          <QBtn outline color="negative" label="انصراف" @click="closeStatusEditDialog" />
          <QBtn
            unelevated
            color="primary"
            label="ذخیره"
            :loading="isUpdatingStatus || isUpdatingConsentStatus"
            @click="saveStatusEdit(selectedImage.type)"
          />
        </div>
      </QCard>
    </QDialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { IconPencil, IconPlus, IconRefresh, IconX } from '@tabler/icons-vue'
import {
  useGetFilesByType,
  useGetFileStatusQuery,
  useVerifiedDocumentFileMutation,
  useVerifyUserConsentMutation,
} from '@/modules/User/query'
import { convertToJalali, formatDate } from '@/utils/date-utils'
import ImageCarouselLightBox from '@/components/ImageCarousel'
import UserPrescription from '@/modules/User/components/UserDetails/UserPrescription'
import UserRadiologyUploader from '@/modules/User/components/UserDetails/UserDetailsComponents/UserMedicalDocs/components/UserRadiologyUploader'
import useDisclosure from '@/composables/use-disclosure'
import { Notif } from '@/data/services/notification-service'
import { useQueryClient } from '@tanstack/vue-query'
import { FILE_TYPE_ENUM } from '@/modules/User/enums/fileTypeEnums'
import { getPerms } from '@/utils/get-perms'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import { MOCK_FILE_STATUSES, mockGetMedicalFiles } from '@/mocks/user-details/medical'

const props = defineProps({
  propData: {
    type: Object,
    default: null,
  },
})

const queryClient = useQueryClient()

const uploaderRef = ref(null)

const userData = computed(() => props.propData)
const userId = computed(() => props.propData?.id)

const filters = ref({
  'filter[user_id]': props.propData,
})

const canEdit = (type) =>
  type === 'treatment-plan.consent'
    ? getPerms('treatment-plan', 'update', true, 'treatmentPlanFinancial')
    : true

const { data: userDocuments, isLoading } = useGetFilesByType(userId, FILE_TYPE_ENUM.MEDICAL, {
  ...(ENABLE_USER_DETAIL_MOCKS ? { queryFn: () => mockGetMedicalFiles() } : {}),
})
const { data: statuses, isLoading: isLoadingStatus } = useGetFileStatusQuery({
  ...(ENABLE_USER_DETAIL_MOCKS ? { queryFn: () => MOCK_FILE_STATUSES } : {}),
})
const { mutate: verifyDocument, isPending: isUpdatingStatus } = useVerifiedDocumentFileMutation()
const { mutate: updateConsentStatus, isPending: isUpdatingConsentStatus } =
  useVerifyUserConsentMutation()

const statusList = computed(() => statuses.value || [])

const radiologyImages = computed(() => {
  if (!userDocuments.value?.items) return []
  return [...userDocuments.value.items].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )
})

const refreshList = async () => {
  await queryClient.invalidateQueries({
    queryKey: ['user', 'files', FILE_TYPE_ENUM.MEDICAL, userId.value],
  })
  await queryClient.invalidateQueries({
    queryKey: ['treatment-plan', 'all-treatment-plans', filters],
  })
  Notif.success('لیست با موفقیت بروزرسانی شد')
}

const openUploadDialog = () => {
  uploaderRef.value?.openUploadDialog()
}

const [showOpgModal, { close: closeOpgModal }] = useDisclosure()

const closeOpgDialog = () => {
  closeOpgModal()
}

const [showStatusEditModal, { open: openStatusEditModal, close: closeStatusEditModal }] =
  useDisclosure()
const selectedImage = ref(null)
const statusEditForm = ref({
  statusId: null,
  rejectionReason: null,
})

const isRejectedStatus = computed(() => statusEditForm.value.statusId === 16)

const openStatusEditDialog = (image) => {
  selectedImage.value = image
  statusEditForm.value = {
    statusId: image.status?.id || null,
    rejectionReason: null,
  }
  openStatusEditModal()
}

const closeStatusEditDialog = () => {
  selectedImage.value = null
  statusEditForm.value = {
    statusId: null,
    rejectionReason: null,
  }
  closeStatusEditModal()
}

const saveStatusEdit = (type) => {
  if (!selectedImage.value?.id || !statusEditForm.value.statusId) {
    Notif.warning('لطفا وضعیت را انتخاب کنید')
    return
  }

  const payload =
    type === 'treatment-plan.consent'
      ? {
          fileId: selectedImage.value.id,
          statusId: statusEditForm.value.statusId,
        }
      : {
          id: selectedImage.value.id,
          statusId: statusEditForm.value.statusId,
        }

  if (isRejectedStatus.value && statusEditForm.value.rejectionReason) {
    payload.rejectionReason = statusEditForm.value.rejectionReason
  }
  type === 'treatment-plan.consent'
    ? updateConsentStatus(payload, {
        onSuccess: (res) => {
          Notif.success(res.message || 'وضعیت با موفقیت ذخیره شد')
          refreshList()
          closeStatusEditDialog()
        },
      })
    : verifyDocument(payload, {
        onSuccess: (response) => {
          Notif.success(response?.message || 'وضعیت با موفقیت ذخیره شد')
          refreshList()
          closeStatusEditDialog()
        },
      })
}

// Lightbox
const showLightbox = ref(false)
const lightboxIndex = ref(0)

const lightboxImages = computed(() => radiologyImages.value.map((img) => ({ src: img.path })))

const showImageLightBox = (index) => {
  lightboxIndex.value = index
  showLightbox.value = true
}

const getImageTypeLabel = (type) => {
  const labels = {
    'user.opg': 'عکس OPG',
    'user.cbct': 'عکس CBCT',
    'treatment-plan.consent': 'رضایتنامه',
    'user.docs': 'دیگر مدارک',
    'booking.perform': 'عکس پرونده پزشکی',
  }
  return labels[type] || type
}

const formatImageDate = (date) => {
  if (!date) return ''
  return `${convertToJalali(date, 'jYYYY/jMM/jDD')} - ${formatDate(date, 'HH:mm')}`
}

const getStatusClass = (status) => {
  if (!status) return 'chips-secondary'
  if (status.id === 15) return 'chips-success'
  if (status.id === 14) return 'chips-secondary'
  return 'chips-error'
}
</script>

<style scoped lang="scss">
.radiology-images {
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
    width: 180px;
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

  &__empty-actions {
    display: flex;
    gap: 12px;
  }

  &__btn {
    min-width: 140px;
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

  &__card-type {
    font-size: 14px;
    font-weight: 600;
    color: $grey-9;
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

  &__status-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 12px;
  }
}
</style>
