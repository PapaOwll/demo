<template>
  <div class="tpv">
    <QCardActions class="tpv__top" @click.self="expanded = !expanded">
      <span @click="expanded = !expanded">یادداشت متخصصان</span>
      <QSpace />
      <QBtn
        color="grey"
        round
        flat
        dense
        :icon="expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
        @click="expanded = !expanded"
      />
    </QCardActions>
    <QSlideTransition>
      <div v-if="expanded">
        <QInput
          class="tpv__input"
          :rows="4"
          type="textarea"
          placeholder="توضیحات"
          outlined
          dense
          :model-value="treatmentData?.description"
          @change="(e) => updateTreatment({ description: e })"
        />

        <AudioRecorder
          v-show="mode !== TREATMENT_PLAN_MODE.DRAFT"
          :voices="allVoices || []"
          :external-loading="isPending || uploadVoicePending"
          :recording-reminders="recordingReminders"
          :recovery="tpVoiceRecovery"
          @save="onSaveFile"
          @recording-change="onRecordingChange"
        >
          <template #upload-status>
            <!-- Upload Status -->
            <div v-if="isUploading" class="tpv__upload-status">
              <div class="tpv__upload-status-text">
                <QSpinner color="primary" size="1.2em" />
                <Typography variant="body" size="4" color="grey">
                  در حال بارگذاری صدای ضبط شده...
                </Typography>
              </div>
              <QLinearProgress
                :value="uploadProgress / 100"
                color="primary"
                class="tpv__upload-progress"
              />
              <Typography variant="caption" color="grey">{{ uploadProgress }}%</Typography>
            </div>

            <div v-if="uploadCompleted" class="tpv__upload-status tpv__upload-status--success">
              <QIcon name="check_circle" color="positive" size="1.2em" />
              <Typography variant="body" size="4" color="green">
                بارگذاری با موفقیت انجام شد
              </Typography>
            </div>
          </template>
        </AudioRecorder>
      </div>
    </QSlideTransition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import AudioRecorder from '@/components/AudioRecorder'
import Typography from '@/base/Typography'
import { useTpProvider } from '../../composables/use-tp-provider'
import { request } from '@/data/services'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { handleError } from '@/utils/error-handler'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import {
  getRecordingRecovery,
  clearRecordingRecovery,
  buildRecoveredFilePayload,
} from '@/utils/recording-recovery'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import { useUploadTpVoiceMutation } from '@/modules/TreatmentPlan/query'
import { useTpVoice } from '../../composables/use-tp-voice'
import { useTpStatus } from '@/modules/TreatmentPlan/composables/use-tp-status'
import { useRecordingReminders } from '../../composables/use-recording-reminders'
import { TREATMENT_PLAN_MODE } from '@/modules/TreatmentPlan/constants/enums'

const { treatmentData, updateTreatment } = useTpProvider(['treatmentData', 'updateTreatment'])
const recordingReminders = useRecordingReminders()
const { mode } = useTpStatus()

const expanded = ref(true)
const queryClient = useQueryClient()

// Upload progress state
const uploadProgress = ref(0)
const isUploading = ref(false)
const uploadCompleted = ref(false)
const isRecording = ref(false)

// Handle recording state change from AudioRecorder
const onRecordingChange = (recording) => {
  isRecording.value = recording
}

// Crash-recovery key for treatment-plan voice recordings. Only enabled when
// the treatment plan already exists server-side — a recovered recording must
// have an entity to be attached to. (For not-yet-created TPs the pending-
// voice flow applies and recovery is not possible.)
const tpVoiceRecovery = computed(() => {
  const tpId = treatmentData?.value?.id
  if (!tpId) return null
  return { key: `tp-voice-${tpId}`, context: { tpId } }
})

// Check if we should block page close
const shouldBlockClose = computed(() => isUploading.value || isRecording.value)

function handleBeforeUnload(e) {
  if (shouldBlockClose.value) {
    const message = isRecording.value
      ? 'در حال ضبط صدا هستید. آیا مطمئن هستید که می‌خواهید صفحه را ببندید؟'
      : 'لطفا برای بستن صفحه، تا زمان تکمیل بارگذاری صدای ضبط شده صبر کنید.'
    e.preventDefault()
    // Note: Modern browsers ignore custom messages and show their own generic message
    // The Persian message is set but browsers will show their default message
    e.returnValue = message
  }
}

watch(shouldBlockClose, (newValue) => {
  if (newValue) {
    window.addEventListener('beforeunload', handleBeforeUnload)
  } else {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
})

// Cleanup on unmount
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

const savedVoices = computed(() => treatmentData?.value?.voices || [])
const { addVoiceRecording, getCombinedVoiceRecordings } = useTpVoice()
const allVoices = getCombinedVoiceRecordings(savedVoices, { markPending: true })

const apiUploadFile = (formData, onUploadProgress) =>
  request.post('v1/file/upload', formData, {
    timeout: 120_000,
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onUploadProgress(percentCompleted)
      }
    },
  })
const useFileUploadMutation = () =>
  useMutation({
    mutationFn: ({ formData, onUploadProgress }) => apiUploadFile(formData, onUploadProgress),
    onError: (err) => {
      handleError(err)
      isUploading.value = false
      uploadProgress.value = 0
    },
  })
const { mutate, isPending } = useFileUploadMutation()
const { mutate: uploadVoice, isPending: uploadVoicePending } = useUploadTpVoiceMutation({
  onSuccess: (res) => {
    Notif.success(res?.message || 'ذخیره سازی صدا با موفقیت انجام شد.')

    const treatmentPlanId = treatmentData?.value?.id
    const treatmentPlanKey = treatmentData?.value?.key

    if (treatmentPlanId) {
      queryClient.invalidateQueries({
        queryKey: ['new-treatment-plan', 'treatment', treatmentPlanId],
      })
    }

    if (treatmentPlanKey) {
      queryClient.invalidateQueries({
        queryKey: ['new-treatment-plan', 'treatment', treatmentPlanKey],
      })
    }
  },
})
const uploadTpVoice = (uploadData, fileData) => {
  if (!uploadData || !uploadData[0]?.id) return
  uploadVoice({
    id: treatmentData?.value?.id,
    voices: [
      {
        id: uploadData[0]?.id,
        type: fileData?.uploadType,
      },
    ],
  })
}
const onSaveFile = (fileData) => {
  if (!fileData || !fileData.file) return

  // Reset states
  uploadProgress.value = 0
  isUploading.value = true
  uploadCompleted.value = false

  const formData = new FormData()
  formData.append('files[0][file]', fileData.file)
  formData.append('files[0][type]', 'treatment-plan.voice')

  mutate(
    {
      formData,
      onUploadProgress: (percent) => {
        uploadProgress.value = percent
      },
    },
    {
      onSuccess: (res) => {
        isUploading.value = false
        uploadCompleted.value = true

        // Hide the success message after 3 seconds
        setTimeout(() => {
          uploadCompleted.value = false
        }, 3000)

        const voiceData = {
          id: res.data[0]?.id,
          type: fileData?.uploadType,
        }
        Notif.success('فایل صوتی با موفقیت آپلود شد.')

        if (treatmentData?.value?.id) {
          uploadTpVoice(res.data, fileData)
        } else {
          addVoiceRecording(voiceData)
          Notif.info('فایل آپلود شد و پس از ثبت طرح درمان ذخیره می‌شود.')
        }
      },
      onError: () => {
        isUploading.value = false
        uploadProgress.value = 0
      },
    }
  )
}

// On load, offer to upload a recording interrupted by tab close / crash /
// connection loss (persisted in IndexedDB by AudioRecorder). The entry is
// cleared immediately after reading, so the next recording starts clean.
const recoverInterruptedRecording = async () => {
  const tpId = treatmentData?.value?.id
  if (!tpId) return

  const key = `tp-voice-${tpId}`
  const recovered = await getRecordingRecovery(key)
  await clearRecordingRecovery(key)
  if (!recovered?.blob || recovered.blob.size === 0) return

  const savedAtJalali = convertToJalaliWithTime(new Date(recovered.savedAt || Date.now()))
  confirmDialog(
    'ذخیره ضبط ناتمام',
    `ضبط صوتی ناتمامی برای این طرح درمان پیدا شد (${savedAtJalali}). ذخیره شود؟`,
    () => {
      onSaveFile(buildRecoveredFilePayload(recovered))
    }
  )
}

watch(
  () => treatmentData?.value?.id,
  (tpId) => {
    if (tpId) recoverInterruptedRecording()
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.tpv {
  background-color: $grey-1;
  border: 1px solid $grey-3;
  padding: map-get($space-sm, x);
  border-radius: 8px !important;

  &__top {
    cursor: pointer;
    padding: 0 !important;
  }

  &__input {
    margin: 0.5rem auto !important;
    border-radius: 16px !important;
    background-color: white !important;
  }
}
</style>

<style lang="scss">
.tpv__upload-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  margin-bottom: 8px;
  background-color: $grey-1;
  border-radius: 8px;
  border: 1px solid $grey-3;
}

.tpv__upload-status-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tpv__upload-status--success {
  flex-direction: row;
  border-color: $positive;
  background-color: rgba($positive, 0.05);
}

.tpv__upload-progress {
  border-radius: 4px;
}
</style>
