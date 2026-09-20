<template>
  <div class="tpv">
    <QCardActions class="tpv__top" @click.self="expanded = !expanded">
      <Typography variant="body" size="4" @click="expanded = !expanded">یادداشت متخصصان</Typography>
      <QSpace />
      <Button
        variant="flat"
        color="grey"
        size="sm"
        is-icon-only
        is-rounded
        :is-link="false"
        :left-icon="expanded ? IconChevronUp : IconChevronDown"
        aria-label="باز و بسته کردن بخش یادداشت متخصصان"
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
          ref="audioRecorderRef"
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
import { IconChevronDown, IconChevronUp } from '@tabler/icons-vue'
import AudioRecorder from '@/components/AudioRecorder'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import { useTpProvider } from '../../composables/use-tp-provider'
import { request } from '@/data/services'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { handleError } from '@/utils/error-handler'
import { Notif } from '@/data/services/notification-service'
import { getRecordingRecovery, clearRecordingRecovery } from '@/utils/recording-recovery'
import { useUploadTpVoiceMutation } from '@/modules/TreatmentPlan/query'
import { useTpVoice } from '../../composables/use-tp-voice'
import { useTpStatus } from '@/modules/TreatmentPlan/composables/use-tp-status'
import { useRecordingReminders } from '../../composables/use-recording-reminders'
import { autoSaveRecoveredEntry, VOICE_KINDS } from '../../composables/use-voice-auto-save'
import { useVoiceLeaveSave } from '../../composables/use-voice-leave-save'
import { TREATMENT_PLAN_MODE } from '@/modules/TreatmentPlan/constants/enums'

const { treatmentData, updateTreatment } = useTpProvider(['treatmentData', 'updateTreatment'])
const recordingReminders = useRecordingReminders()
const { mode } = useTpStatus()

const expanded = ref(true)
const queryClient = useQueryClient()

const uploadProgress = ref(0)
const isUploading = ref(false)
const uploadCompleted = ref(false)
const isRecording = ref(false)

const onRecordingChange = (recording) => {
  isRecording.value = recording
}

const tpVoiceRecovery = computed(() => {
  const tpId = treatmentData?.value?.id
  if (!tpId) return null
  return { key: `tp-voice-${tpId}`, context: { kind: VOICE_KINDS.TP, tpId } }
})

const shouldBlockClose = computed(() => isUploading.value || isRecording.value)

function handleBeforeUnload(e) {
  if (shouldBlockClose.value) {
    const message = isRecording.value
      ? 'در حال ضبط صدا هستید. آیا مطمئن هستید که می‌خواهید صفحه را ببندید؟'
      : 'لطفا برای بستن صفحه، تا زمان تکمیل بارگذاری صدای ضبط شده صبر کنید.'
    e.preventDefault()
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
      clearRecordingRecovery(`tp-voice-${treatmentPlanId}`)
    }

    if (treatmentPlanKey) {
      queryClient.invalidateQueries({
        queryKey: ['new-treatment-plan', 'treatment', treatmentPlanKey],
      })
    }
  },
})

// Save the in-progress recording BEFORE leaving the page (route change):
// finalize + upload + attach happen while this page is still alive.
const audioRecorderRef = ref(null)
useVoiceLeaveSave({
  recorderRef: audioRecorderRef,
  getRecoveryKey: () => tpVoiceRecovery.value?.key ?? null,
  // Own upload/attach in flight? It completes on its own and clears the
  // entry on success — the leave guard must not retry it (duplicate voice).
  isUploadPending: () => isUploading.value || isPending.value || uploadVoicePending.value,
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

const recoverInterruptedRecording = async () => {
  const tpId = treatmentData?.value?.id
  if (!tpId) return

  const key = `tp-voice-${tpId}`
  const recovered = await getRecordingRecovery(key)
  if (!recovered?.blob || recovered.blob.size === 0) {
    await clearRecordingRecovery(key)
    return
  }

  await autoSaveRecoveredEntry(key, recovered)
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
