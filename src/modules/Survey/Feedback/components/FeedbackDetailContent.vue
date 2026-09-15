<template>
  <div class="feedback-detail-content">
    <!-- Header -->
    <div class="feedback-detail-content__header">
      <div class="feedback-detail-content__header-left">
        <span class="text-h6">بازخورد</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="feedback-detail-content__loading">
      <QSpinnerTail color="primary" size="3rem" />
      <span>در حال بارگذاری...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error || !feedbackData" class="feedback-detail-content__error">
      <IconAlertCircle class="text-negative" size="3rem" />
      <span>{{ error?.message || 'داده‌ای یافت نشد' }}</span>
      <QBtn color="primary" label="تلاش مجدد" @click="refreshData" />
    </div>

    <!-- Content -->
    <div v-else class="feedback-detail-content__content">
      <div class="feedback-detail-content__header-card">
        <FeedbackHeader
          :feedback-data="feedbackData"
          :is-edit-mode="isEditMode"
          :is-updating="isUpdating"
          :is-accepting="isAccepting"
          :is-rejecting="isRejecting"
          :expanded="expanded"
          @edit="enterEditMode"
          @save="saveEdit"
          @cancel="cancelEdit"
          @accept="handleAcceptFeedback"
          @reject="handleRejectFeedback"
          @toggle-expand="expanded = !expanded"
        />
      </div>

      <QSlideTransition>
        <div v-if="expanded">
          <div class="feedback-detail-content__main">
            <div class="feedback-detail-content__content-box">
              <!-- Edit Form -->
              <FeedbackEditForm
                v-if="isEditMode"
                v-model="editForm"
                :feedback-type-options="FEEDBACK_TYPE_OPTIONS"
                :rating-options="RATING_OPTIONS"
              />

              <!-- Comment Text (Display Mode) -->
              <div v-else class="feedback-detail-content__comment">
                {{ feedbackData.comment }}
              </div>

              <!-- Audio Players -->
              <FeedbackAudioPlayer
                v-for="audioFile in audioFiles"
                :key="audioFile.id"
                :ref="(el) => setAudioRef(el, audioFile.id)"
                :audio-file="audioFile"
                :is-deleting="isDeletingAttachment"
                @play="onAudioPlay(audioFile)"
                @download="downloadAudio"
                @delete="deleteAudio"
              />

              <!-- Media Gallery -->
              <FeedbackMediaGallery
                :media-files="mediaFiles"
                :is-deleting-attachment="isDeletingAttachment"
                @view="viewMedia"
                @delete="deleteMedia"
                @add-files="handleFileSelect"
              />
            </div>
          </div>
        </div>
      </QSlideTransition>
    </div>

    <!-- Media Viewer Modal -->
    <MediaViewerModal
      v-model="showMediaModal"
      :media="selectedMedia"
      :is-deleting="isDeletingAttachment"
      @download="downloadMedia"
      @delete="deleteMedia"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import { useMutation } from '@tanstack/vue-query'
import { request } from '@/data/services'
import {
  useFeedback,
  useAcceptFeedback,
  useRejectFeedback,
  useDeleteFeedbackAttachment,
  useUploadFeedbackFiles,
  useUpdateFeedback,
} from '../query'
import { handleError } from '@/utils/error-handler'
import { IconAlertCircle } from '@tabler/icons-vue'
import { FEEDBACK_TYPE_OPTIONS, RATING_OPTIONS } from '../constant'

import FeedbackHeader from './FeedbackHeader'
import FeedbackEditForm from './FeedbackEditForm'
import FeedbackAudioPlayer from './FeedbackAudioPlayer'
import FeedbackMediaGallery from './FeedbackMediaGallery'
import MediaViewerModal from '@/components/MediaViewerModal'

const props = defineProps({
  feedbackId: {
    type: [String, Number],
    required: true,
  },
})

const emit = defineEmits(['data-loaded'])

const expanded = ref(true)

// Edit mode state
const isEditMode = ref(false)
const editForm = ref({
  comment: '',
  feedbackTypeId: null,
  rating: null,
  shownName: '',
})

// Audio player refs
const audioRefs = ref({})

// Media viewer state
const showMediaModal = ref(false)
const selectedMedia = ref(null)

// Create a ref for the feedbackId
const feedbackIdRef = ref(props.feedbackId)

// Update the ref when props change
watch(
  () => props.feedbackId,
  (newId) => {
    feedbackIdRef.value = newId
  },
  { immediate: true }
)

const { data: feedbackResponse, isLoading, error, refetch } = useFeedback(feedbackIdRef)
const feedbackData = computed(() => feedbackResponse.value?.data || feedbackResponse.value || null)

// Separate audio files from other media
const audioFiles = computed(() => {
  if (!feedbackData.value?.files) return []
  return feedbackData.value.files.filter((file) => {
    const mimeType = file.mimeType || file.mime_type
    return mimeType?.startsWith('audio/')
  })
})

const mediaFiles = computed(() => {
  if (!feedbackData.value?.files) return []
  return feedbackData.value.files.filter((file) => {
    const mimeType = file.mimeType || file.mime_type
    return mimeType?.startsWith('image/') || mimeType?.startsWith('video/')
  })
})

const { mutate: acceptFeedback, isPending: isAccepting } = useAcceptFeedback()
const { mutate: rejectFeedback, isPending: isRejecting } = useRejectFeedback()
const { mutate: deleteAttachment, isPending: isDeletingAttachment } = useDeleteFeedbackAttachment()
const { mutate: uploadFeedbackFiles } = useUploadFeedbackFiles()
const { mutate: updateFeedbackData, isPending: isUpdating } = useUpdateFeedback()

// File upload mutation
const { mutate: uploadFileToServer } = useMutation({
  mutationFn: (formData) => request.post('v1/file/upload', formData, { timeout: 300_000 }),
  onError: (err) => {
    handleError(err)
  },
})

const refreshData = () => refetch()

const setAudioRef = (el, id) => {
  if (el) {
    audioRefs.value[id] = el
  } else {
    delete audioRefs.value[id]
  }
}

const onAudioPlay = (audioFile) => {
  // Pause all other audio players
  Object.entries(audioRefs.value).forEach(([id, player]) => {
    if (id !== audioFile.id.toString() && player?.pause) {
      player.pause()
    }
  })
}

// Edit mode functions
const enterEditMode = () => {
  if (!feedbackData.value) return

  const feedbackTypeId =
    feedbackData.value.feedbackTypeId ||
    feedbackData.value.feedback_type_id ||
    feedbackData.value.feedbackType?.id ||
    1

  editForm.value = {
    comment: feedbackData.value.comment || '',
    feedbackTypeId,
    rating: feedbackData.value.rating || null,
    shownName: feedbackData.value.shownName || feedbackData.value.shown_name || '',
  }
  isEditMode.value = true
}

const cancelEdit = () => {
  isEditMode.value = false
  editForm.value = {
    comment: '',
    feedbackTypeId: null,
    rating: null,
    shownName: '',
  }
}

const saveEdit = () => {
  if (!props.feedbackId) return

  const updateData = {
    comment: editForm.value.comment || null,
    feedback_type_id: editForm.value.feedbackTypeId,
    rating: editForm.value.rating || null,
    shown_name: editForm.value.shownName || null,
  }

  if (!updateData.feedback_type_id) {
    Notif.error('نوع بازخورد الزامی است')
    return
  }

  if (updateData.rating !== null && (updateData.rating < 1 || updateData.rating > 5)) {
    Notif.error('امتیاز باید بین ۱ تا ۵ باشد')
    return
  }

  updateFeedbackData(
    {
      feedbackId: props.feedbackId,
      data: updateData,
    },
    {
      onSuccess: () => {
        Notif.success('بازخورد با موفقیت ویرایش شد')
        isEditMode.value = false
        refetch()
      },
      onError: (err) => {
        handleError(err)
      },
    }
  )
}

// Audio functions
const downloadAudio = (audioFile) => {
  const link = document.createElement('a')
  link.href = audioFile.path
  link.download = audioFile.fileName || audioFile.file_name || 'audio.mp3'
  link.click()

  Notif.success('در حال دانلود فایل صوتی...')
}

const deleteAudio = (audioFile) => {
  const fileName = audioFile.fileName || audioFile.file_name || 'این فایل صوتی'
  confirmDialog(
    'حذف فایل صوتی',
    `آیا از حذف "${fileName}" اطمینان دارید؟`,
    () => {
      deleteAttachment(
        {
          feedbackId: props.feedbackId,
          fileId: audioFile.id,
        },
        {
          onSuccess: () => {
            Notif.success('فایل صوتی با موفقیت حذف شد')
          },
          onError: (err) => {
            handleError(err)
          },
        }
      )
    },
    { ok: { label: 'حذف', color: 'negative' } }
  )
}

// Media functions
const viewMedia = (file) => {
  selectedMedia.value = file
  showMediaModal.value = true
}

const downloadMedia = (file) => {
  if (!file) return

  const link = document.createElement('a')
  link.href = file.path
  link.download = file.fileName || file.file_name || 'media'
  link.click()

  Notif.success('در حال دانلود فایل...')
}

const deleteMedia = (file) => {
  if (!file) return

  const fileName = file.fileName || file.file_name || 'این فایل'
  confirmDialog(
    'حذف فایل',
    `آیا از حذف فایل "${fileName}" اطمینان دارید؟`,
    () => {
      deleteAttachment(
        {
          feedbackId: props.feedbackId,
          fileId: file.id,
        },
        {
          onSuccess: () => {
            Notif.success('فایل با موفقیت حذف شد')
            // Close modal if open
            if (showMediaModal.value) {
              showMediaModal.value = false
              selectedMedia.value = null
            }
          },
          onError: (err) => {
            handleError(err)
          },
        }
      )
    },
    { ok: { label: 'حذف', color: 'negative' } }
  )
}

const handleFileSelect = async (files) => {
  if (!files || files.length === 0) return

  const loadingNotification = Notif.info('در حال آپلود فایل‌ها...', { timeout: 0 })

  try {
    const uploadPromises = files.map((file) => {
      const formData = new FormData()
      formData.append(`files[0][file]`, file)
      formData.append(`files[0][type]`, 'user.feedback')

      return new Promise((resolve, reject) => {
        uploadFileToServer(formData, {
          onSuccess: (response) => {
            if (response?.data?.[0]?.id) {
              resolve(response.data[0].id)
            } else {
              reject(new Error(`فایل ${file.name} آپلود نشد`))
            }
          },
          onError: (err) => {
            reject(err)
          },
        })
      })
    })

    const newFileIds = await Promise.all(uploadPromises)
    const existingFileIds = feedbackData.value?.files?.map((file) => file.id) || []
    const allFileIds = [...existingFileIds, ...newFileIds]

    uploadFeedbackFiles(
      { feedbackId: props.feedbackId, fileIds: allFileIds },
      {
        onSuccess: () => {
          loadingNotification()
          Notif.success('فایل‌ها با موفقیت اضافه شدند')
        },
        onError: (err) => {
          loadingNotification()
          handleError(err)
        },
      }
    )
  } catch (error_) {
    loadingNotification()
    handleError(error_)
  }
}

const handleAcceptFeedback = () => {
  confirmDialog(
    'تایید بازخورد',
    'آیا از تایید این بازخورد اطمینان دارید؟',
    () => {
      acceptFeedback(props.feedbackId, {
        onSuccess: () => {
          Notif.success('بازخورد با موفقیت تایید شد')
          refetch()
        },
        onError: (err) => handleError(err),
      })
    },
    { ok: { label: 'تایید' } }
  )
}

const handleRejectFeedback = () => {
  confirmDialog(
    'رد بازخورد',
    'آیا از رد این بازخورد اطمینان دارید؟',
    () => {
      rejectFeedback(props.feedbackId, {
        onSuccess: () => {
          Notif.success('بازخورد با موفقیت رد شد')
          refetch()
        },
        onError: (err) => handleError(err),
      })
    },
    { ok: { label: 'رد' } }
  )
}

// Cleanup function
const cleanup = () => {
  // Pause and cleanup all audio elements
  Object.values(audioRefs.value).forEach((player) => {
    if (player?.cleanup) {
      player.cleanup()
    }
  })
  audioRefs.value = {}
}

// Emit event when data is loaded
watch(
  feedbackData,
  (newData) => {
    if (newData) {
      emit('data-loaded', newData)
    }
  },
  { immediate: true }
)

// Reset state and cleanup when feedbackId changes
watch(
  () => props.feedbackId,
  () => {
    cleanup()
    expanded.value = true
    isEditMode.value = false
  }
)

// Watch for errors
watch(
  error,
  (newError) => {
    if (newError) {
      // Error is handled by the query
    }
  },
  { immediate: true }
)

onBeforeUnmount(cleanup)
</script>

<style scoped lang="scss">
.feedback-detail-content {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: white;
    border-bottom: 1px solid $grey-3;
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__content {
    padding: 0;
    background: $grey-1;
  }

  &__header-card {
    background-color: $grey-1;
    padding: map-get($space-md, x);
  }

  &__loading,
  &__error {
    margin: 0 auto;
    background: white;
    border-radius: 16px;
    padding: 3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    min-height: 400px;
  }

  &__main {
    margin: 0 auto;
  }

  &__content-box {
    background: $grey-1;
    border-radius: 0 0 16px 16px;
    padding: 1.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  &__comment {
    color: #1f2937;
    font-size: 1rem;
    line-height: 1.8;
    margin-bottom: 1.5rem;
    white-space: pre-wrap;
    background: white;
    border-radius: 12px;
    padding: 1rem;
    word-break: break-word;
    overflow-x: auto;
    height: 180px;
  }
}
</style>
