<template>
  <div class="ar">
    <!-- Recording Controls -->
    <AudioRecordButton
      v-if="recordable"
      :is-recording="isRecording"
      :is-loading="isLoading"
      :elapsed-ms="elapsedMs"
      @start-recording="startRecording"
      @stop-recording="stopRecording"
      @cancel-recording="cancelRecording"
    >
      <template #upload-status>
        <slot name="upload-status" />
      </template>
      <template #upload>
        <AudioFileUpload
          ref="fileUploadRef"
          :is-loading="isLoading"
          :accept="AUDIO_ACCEPT_ATTR"
          @files-selected="onUploadFromQFile"
        />
      </template>
    </AudioRecordButton>

    <!-- Individual Audio Players -->
    <div v-if="showPlayers" class="ar__players-section">
      <div class="ar__players-title">
        <Typography variant="heading" size="h5">فایل های صوتی جلسات</Typography>
      </div>

      <div v-if="isLoading && !hasFiles" class="ar__no-files">
        <span class="text-blue-6 text-weight-bold">در حال بارگذاری...</span>
      </div>

      <div v-else-if="!hasFiles" class="ar__no-files">
        <span class="text-red-6 text-weight-bold">شما هیچ فایلی ضبط نکرده‌اید</span>
      </div>

      <!-- Show files when available -->
      <div v-else class="audio-players">
        <QScrollArea style="height: 260px" :thumb-style="thumbStyle">
          <AudioPlayerItem
            v-for="(file, index) in audioFiles"
            :key="file.id"
            :ref="(el) => setPlayerRef(el, file.id)"
            :audio-file="file"
            :index="index"
            :recordable="recordable"
            @play="onPlayerPlay(file)"
            @download="downloadIndividualFile"
          />
        </QScrollArea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, toRefs } from 'vue'
import { handleError } from '@/utils/error-handler'
import { Notif } from '@/data/services/notification-service'
import { saveRecordingRecovery, clearRecordingRecovery } from '@/utils/recording-recovery'
import Typography from '@/base/Typography'
import AudioRecordButton from './audio/AudioRecordButton'
import AudioFileUpload from './audio/AudioFileUpload'
import AudioPlayerItem from './audio/AudioPlayerItem'

// Audio-only WebM uses the ".weba" extension (vs ".webm" which browsers treat as video).
// Recording always produces audio/webm, so it must be persisted as ".weba" to stay
// playable and re-uploadable (a ".webm" file gets sniffed as video/webm and is silently
// rejected by an `accept="audio/*"` file picker).
const ACCEPTED_AUDIO_EXTENSIONS = [
  '.weba',
  '.webm',
  '.ogg',
  '.mp3',
  '.m4a',
  '.mp4',
  '.wav',
  '.aac',
  '.flac',
  '.opus',
]

const AUDIO_ACCEPT_ATTR = `audio/*,video/webm,${ACCEPTED_AUDIO_EXTENSIONS.join(',')}`

const isAudioFile = (file) => {
  if (!file) return false
  const type = (file.type || '').toLowerCase()
  if (type.startsWith('audio/')) return true
  // webm is a container format; audio-only webm is frequently sniffed as video/webm
  if (type === 'video/webm') return true
  const name = (file.name || '').toLowerCase()
  return ACCEPTED_AUDIO_EXTENSIONS.some((ext) => name.endsWith(ext))
}

const props = defineProps({
  externalLoading: {
    type: Boolean,
    default: false,
  },
  recordable: {
    type: Boolean,
    default: true,
  },
  voices: {
    type: Array,
    default: () => [],
  },
  recordingReminders: {
    type: Object,
    default: null,
  },
  showPlayers: {
    type: Boolean,
    default: true,
  },
  // Opt-in crash-recovery mode: { key: String, context: Object }.
  // While recording, the partial audio is periodically persisted to IndexedDB
  // under `key` (survives tab close / browser crash / OS shutdown). The
  // consumer checks for a leftover recording on its next mount and re-uploads
  // it. The config is frozen at recording start.
  recovery: {
    type: Object,
    default: null,
  },
})

const { externalLoading } = toRefs(props)
const emit = defineEmits(['save', 'files-updated', 'recording-change'])

const thumbStyle = {
  borderRadius: '5px',
  backgroundColor: '#027be3',
  width: '5px',
  opacity: '0.75',
}

// Recording state
const isRecording = ref(false)
const isProcessing = ref(false)
const elapsedMs = ref(0)
const startTimestamp = ref(0)

// Media recording refs
const mediaRecorder = ref(null)
const mediaStream = ref(null)
const recordedChunks = ref([])
const audioContext = ref(null)
const analyserNode = ref(null)
const sourceNode = ref(null)

// Audio files state
const audioFiles = ref([])
const playerRefs = ref(new Map())
const fileUploadRef = ref(null)

// Recording flags
const shouldUploadAfterStop = ref(false)
const isCanceling = ref(false)

// Crash-recovery persistence state (frozen for the whole recording session)
const RECOVERY_INTERVAL_MS = 3000
let recoveryConfig = null
let recoveryTimer = null

// Animation frame IDs
let elapsedRafId = null
let pitchRafId = null

const isLoading = computed(() => isProcessing.value || externalLoading.value)
const hasFiles = computed(() => audioFiles.value.length > 0)

const setPlayerRef = (el, fileId) => {
  if (el) {
    playerRefs.value.set(fileId, el)
  } else {
    playerRefs.value.delete(fileId)
  }
}

const guessExtension = (mime) => {
  if (!mime) return '.weba'
  if (mime.includes('webm')) return '.weba'
  if (mime.includes('ogg')) return '.ogg'
  if (mime.includes('mp4') || mime.includes('mpeg')) return '.mp4'
  if (mime.includes('wav')) return '.wav'
  return '.weba'
}

const getBestMediaRecorderOptions = () => {
  const mimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    'audio/mp3',
    'audio/wav',
  ]

  const supportedType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type))

  if (supportedType) {
    if (supportedType.includes('opus')) {
      return {
        mimeType: supportedType,
        audioBitsPerSecond: 16_000,
      }
    }
    if (supportedType.includes('webm')) {
      return {
        mimeType: supportedType,
        audioBitsPerSecond: 64_000,
      }
    }
    return { mimeType: supportedType }
  }

  return {}
}

const emitFilesUpdated = () => {
  emit(
    'files-updated',
    audioFiles.value.map((file) => ({
      id: file.id,
      name: file.name,
      durationMs: file.durationMs,
      uploadType: file.uploadType,
      size: file.blob.size,
      type: file.blob.type,
      date: file.date,
    }))
  )
}

const addAudioFile = async (blob, meta = {}, shouldEmit = true) => {
  const fileId = Date.now() + Math.random().toString(36).slice(2, 11)
  const url = URL.createObjectURL(blob)
  const name = meta.providedName || `${meta.suggestedName || 'audio'}${guessExtension(blob.type)}`
  const date = new Date(meta.lastModified || Date.now())
  const uploadType = meta.uploadType || 'uploaded'

  let buffer = null
  let durationMs = 0

  try {
    if (blob.type.startsWith('audio/')) {
      const arrayBuffer = await blob.arrayBuffer()
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      buffer = await ctx.decodeAudioData(arrayBuffer.slice())

      const { duration } = buffer
      durationMs =
        Number.isNaN(duration) || !Number.isFinite(duration) || duration < 0
          ? 0
          : Math.floor(duration * 1000)

      ctx.close().catch(() => {})
    }
  } catch (error) {
    console.warn('Failed to decode audio:', error)
    buffer = null
    durationMs = 0
  }

  const audioFile = {
    id: fileId,
    blob,
    url,
    name,
    date,
    buffer,
    durationMs,
    currentTimeMs: 0,
    uploadType,
    isPlaying: false,
    isLoading: false,
    playbackRate: 1,
  }

  audioFiles.value.push(audioFile)

  if (shouldEmit) {
    emitFilesUpdated()
  }

  return audioFile
}

const addVoiceFile = async (voice) => {
  try {
    if (!voice || !voice.path) return null

    try {
      // eslint-disable-next-line no-new
      new URL(voice.path)
    } catch {
      return null
    }

    let response
    try {
      response = await fetch(voice.path)
    } catch {
      return null
    }

    if (!response.ok) return null

    let blob
    try {
      blob = await response.blob()
    } catch {
      return null
    }

    const fileId = `voice-${voice.id || Date.now() + Math.random()}`
    const url = URL.createObjectURL(blob)
    const name = voice.name || voice.fileName || `voice-${voice.id || 'file'}.mp3`
    const date = voice.createdAt ? new Date(voice.createdAt) : new Date()
    const uploadType = 'voice'

    let buffer = null
    let durationMs = voice.duration || 0

    if ((!durationMs || durationMs === 0) && blob.type.startsWith('audio/')) {
      try {
        const arrayBuffer = await blob.arrayBuffer()
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        buffer = await ctx.decodeAudioData(arrayBuffer.slice())

        const { duration } = buffer
        durationMs =
          Number.isNaN(duration) || !Number.isFinite(duration) || duration < 0
            ? voice.duration || 0
            : Math.floor(duration * 1000)

        ctx.close().catch(() => {})
      } catch (error) {
        console.warn('Failed to decode audio for voice:', error)
        buffer = null
        durationMs = voice.duration || 0
      }
    }

    const audioFile = {
      id: fileId,
      blob,
      url,
      name,
      date,
      buffer,
      durationMs,
      currentTimeMs: 0,
      uploadType,
      originalVoice: voice,
      isPlaying: false,
      isLoading: false,
      playbackRate: 1,
    }

    audioFiles.value.push(audioFile)
    return audioFile
  } catch (error) {
    handleError(error)
    return null
  }
}

const downloadIndividualFile = (file) => {
  try {
    if (!file.url || !file.blob) {
      return
    }

    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name || 'audio.wav'
    link.style.display = 'none'
    document.body.append(link)

    link.click()

    setTimeout(() => {
      link.remove()
    }, 100)
  } catch (error) {
    handleError(error)
  }
}

const onPlayerPlay = (file) => {
  // Pause all other players
  playerRefs.value.forEach((player, id) => {
    if (id !== file.id && player?.pause) {
      player.pause()
    }
  })
}

// Recording functions
const ensureAudioContext = async () => {
  if (!audioContext.value || audioContext.value.state === 'closed') {
    audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioContext.value.state === 'suspended') {
    await audioContext.value.resume()
  }
  return audioContext.value
}

const setupLiveAnalyser = async (stream) => {
  const ctx = await ensureAudioContext()
  analyserNode.value = ctx.createAnalyser()
  analyserNode.value.fftSize = 2048
  analyserNode.value.smoothingTimeConstant = 0.3
  const source = ctx.createMediaStreamSource(stream)
  sourceNode.value = source
  source.connect(analyserNode.value)
}

const cleanupStream = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach((track) => track.stop())
    mediaStream.value = null
  }
  if (sourceNode.value) {
    try {
      sourceNode.value.disconnect()
    } catch (error) {
      handleError(error)
    }
    sourceNode.value = null
  }
  if (analyserNode.value) {
    try {
      analyserNode.value.disconnect()
    } catch (error) {
      handleError(error)
    }
    analyserNode.value = null
  }
}

const stopElapsedTimer = () => {
  if (elapsedRafId) {
    cancelAnimationFrame(elapsedRafId)
    elapsedRafId = null
  }
}

const startElapsedTimer = () => {
  stopElapsedTimer()
  const tick = () => {
    elapsedMs.value = performance.now() - startTimestamp.value
    elapsedRafId = requestAnimationFrame(tick)
  }
  tick()
}

const stopPitchDetection = () => {
  if (pitchRafId) {
    cancelAnimationFrame(pitchRafId)
    pitchRafId = null
  }
}

// --- Crash-recovery persistence ---

const clearRecoveryTimer = () => {
  if (recoveryTimer) {
    clearInterval(recoveryTimer)
    recoveryTimer = null
  }
}

const persistRecoverySnapshot = () => {
  if (!recoveryConfig || !isRecording.value || recordedChunks.value.length === 0) return

  const mimeType = mediaRecorder.value?.mimeType || 'audio/webm'
  const blob = new Blob(recordedChunks.value, { type: mimeType })
  if (blob.size === 0) return

  saveRecordingRecovery(recoveryConfig.key, {
    blob,
    mimeType,
    context: recoveryConfig.context,
  }).catch(() => {})
}

// Internet dropped mid-recording: the upload paths are dead until reconnect,
// so make sure the partial audio is safely on disk right away — it will be
// offered for recovery (or uploaded on stop) once the connection is back.
const handleRecordingOffline = () => {
  if (!isRecording.value) return
  persistRecoverySnapshot()
  Notif.warning(
    'اینترنت قطع شد — ضبط ادامه دارد و تا این لحظه به‌صورت محلی نگهداری می‌شود و پس از اتصال مجدد قابل ذخیره است.'
  )
}

const startRecoveryPersistence = () => {
  if (!props.recovery?.key) return

  // Freeze the config for the whole session so a mid-recording context
  // change (e.g. selecting another booking) cannot corrupt the snapshot.
  recoveryConfig = { key: props.recovery.key, context: props.recovery.context }
  clearRecoveryTimer()
  recoveryTimer = setInterval(persistRecoverySnapshot, RECOVERY_INTERVAL_MS)
  window.addEventListener('pagehide', persistRecoverySnapshot)
  window.addEventListener('offline', handleRecordingOffline)
}

const stopRecoveryPersistence = (shouldClear) => {
  clearRecoveryTimer()
  window.removeEventListener('pagehide', persistRecoverySnapshot)
  window.removeEventListener('offline', handleRecordingOffline)
  const key = recoveryConfig?.key
  recoveryConfig = null
  if (shouldClear && key) {
    clearRecordingRecovery(key)
  }
}

const handleRecordingStop = async () => {
  try {
    if (isCanceling.value) {
      return
    }

    if (!recordedChunks.value || recordedChunks.value.length === 0) {
      return
    }

    const blob = new Blob(recordedChunks.value, {
      type: mediaRecorder.value?.mimeType || 'audio/webm',
    })

    if (blob.size === 0) {
      return
    }

    const recordingName = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`
    await addAudioFile(blob, { suggestedName: recordingName, uploadType: 'recorded' })
    await nextTick()

    if (shouldUploadAfterStop.value) {
      try {
        const newFile = audioFiles.value.at(-1)
        if (newFile) {
          downloadIndividualFile(newFile)

          const namedFile = new File([newFile.blob], newFile.name || 'audio.wav', {
            type: newFile.blob.type,
            lastModified: newFile.date ? newFile.date.getTime() : Date.now(),
          })

          emit('save', {
            file: namedFile,
            name: namedFile.name,
            size: namedFile.size,
            type: namedFile.type,
            uploadType: newFile.uploadType,
            lastModified: namedFile.lastModified,
            durationMs: newFile.durationMs,
          })
        }
      } catch (error) {
        handleError(error)
      }
      shouldUploadAfterStop.value = false
    }
  } catch (error) {
    handleError(error)
  } finally {
    // The recording ended in-page (saved or canceled) — the recovery
    // snapshot is no longer needed.
    stopRecoveryPersistence(true)
    cleanupStream()
    isProcessing.value = false
    isCanceling.value = false
  }
}

const startRecording = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    Notif.error('میکروفون در این مرورگر پشتیبانی نمی‌شود')
    return
  }

  isProcessing.value = true
  try {
    mediaStream.value = await navigator.mediaDevices.getUserMedia({ audio: true })
    recordedChunks.value = []

    const options = getBestMediaRecorderOptions()
    mediaRecorder.value = new MediaRecorder(mediaStream.value, options)

    mediaRecorder.value.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.value.push(e.data)
    }

    mediaRecorder.value.onstop = handleRecordingStop

    await setupLiveAnalyser(mediaStream.value)

    mediaRecorder.value.start(100)
    isRecording.value = true
    startTimestamp.value = performance.now()
    startElapsedTimer()
    startRecoveryPersistence()
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      Notif.error('لطفاً دسترسی به میکروفون را فعال کنید')
    } else if (error.name === 'NotFoundError') {
      Notif.error('هیچ میکروفونی یافت نشد. لطفاً میکروفون را وصل کنید')
    } else {
      Notif.error('خطا در دسترسی به میکروفون')
    }
    cleanupStream()
  } finally {
    isProcessing.value = false
  }
}

const stopRecording = async () => {
  if (!mediaRecorder.value) return

  isProcessing.value = true
  shouldUploadAfterStop.value = true

  try {
    if (mediaRecorder.value.state === 'recording') {
      mediaRecorder.value.stop()
    }
  } catch {
    isProcessing.value = false
  } finally {
    stopElapsedTimer()
    stopPitchDetection()
    isRecording.value = false
  }
}

const cancelRecording = () => {
  if (!mediaRecorder.value) return

  isCanceling.value = true
  shouldUploadAfterStop.value = false

  try {
    if (mediaRecorder.value.state === 'recording') {
      mediaRecorder.value.stop()
    }
  } catch (error) {
    handleError(error)
  } finally {
    cleanupStream()
    stopElapsedTimer()
    stopPitchDetection()
    isRecording.value = false
    isProcessing.value = false
    recordedChunks.value = []
  }
}

const onUploadFromQFile = async (files) => {
  const fileList = Array.isArray(files) ? files : [files]
  if (fileList.length === 0) return

  const validFiles = fileList.filter((file) => {
    if (!file) return false
    if (!isAudioFile(file)) {
      Notif.error(`فرمت فایل «${file.name}» پشتیبانی نمی‌شود. فقط فایل صوتی مجاز است.`)
      return false
    }
    return true
  })

  if (validFiles.length === 0) return

  isProcessing.value = true
  try {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      const isLast = i === validFiles.length - 1
      // eslint-disable-next-line no-await-in-loop
      const audioFile = await addAudioFile(
        file,
        {
          providedName: file.name,
          lastModified: file.lastModified,
          uploadType: 'uploaded',
        },
        isLast
      )

      const namedFile = new File([audioFile.blob], audioFile.name, {
        type: audioFile.blob.type,
        lastModified: audioFile.date ? audioFile.date.getTime() : Date.now(),
      })

      emit('save', {
        file: namedFile,
        name: namedFile.name,
        size: namedFile.size,
        type: namedFile.type,
        uploadType: audioFile.uploadType,
        lastModified: namedFile.lastModified,
        durationMs: audioFile.durationMs,
      })
    }

    await nextTick()
  } catch (error) {
    handleError(error)
  } finally {
    isProcessing.value = false
  }
}

const loadVoiceFiles = async () => {
  if (!props.voices || props.voices.length === 0) return

  isProcessing.value = true
  try {
    const voicePromises = props.voices.map((voice) => addVoiceFile(voice))
    await Promise.all(voicePromises)
    await nextTick()
    emitFilesUpdated()
  } catch (error) {
    handleError(error)
  } finally {
    isProcessing.value = false
  }
}

const cleanupAllAudio = () => {
  // Cleanup all player refs
  playerRefs.value.forEach((player) => {
    if (player?.cleanup) {
      player.cleanup()
    }
  })
  playerRefs.value.clear()

  // Revoke all blob URLs
  audioFiles.value.forEach((file) => {
    if (file.url) {
      URL.revokeObjectURL(file.url)
    }
  })

  audioFiles.value = []
}

const stopAllTimers = () => {
  stopElapsedTimer()
  stopPitchDetection()
}

onMounted(async () => {
  await loadVoiceFiles()
})

watch(
  () => props.voices,
  async (newVoices, oldVoices) => {
    if (JSON.stringify(newVoices) !== JSON.stringify(oldVoices)) {
      audioFiles.value = audioFiles.value.filter((file) => file.uploadType !== 'voice')
      await loadVoiceFiles()
    }
  },
  { deep: true }
)

if (props.recordingReminders && props.recordingReminders.setToggleRecordingCallback) {
  props.recordingReminders.setToggleRecordingCallback(async () => {
    await (isRecording.value ? stopRecording() : startRecording())
  })
}

watch(isRecording, (recording) => {
  emit('recording-change', recording)
  if (props.recordingReminders) {
    if (recording) {
      props.recordingReminders.startRecordingReminderTimer()
    } else {
      props.recordingReminders.clearRecordingReminderTimer()
    }
  }
})

onBeforeUnmount(() => {
  // Best-effort save of the partial recording if unmounted mid-recording
  // (route change / page teardown): upload whatever was captured so far.
  if (isRecording.value && recordedChunks.value.length > 0) {
    try {
      // Final snapshot BEFORE the emit: the interval snapshots plus this
      // one bound the data loss to ~RECOVERY_INTERVAL_MS. The snapshot is
      // cleared after the emit — a browser death during the subsequent
      // upload is guarded by the consumer's beforeunload warning.
      persistRecoverySnapshot()

      const blob = new Blob(recordedChunks.value, {
        type: mediaRecorder.value?.mimeType || 'audio/webm',
      })
      if (blob.size > 0) {
        const recordingName = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`
        const namedFile = new File([blob], `${recordingName}.weba`, {
          type: blob.type,
          lastModified: Date.now(),
        })
        emit('save', {
          file: namedFile,
          name: namedFile.name,
          size: namedFile.size,
          type: namedFile.type,
          uploadType: 'recorded',
          lastModified: namedFile.lastModified,
        })
        stopRecoveryPersistence(true)
      }
    } catch (error) {
      handleError(error)
    }
  }
  clearRecoveryTimer()
  stopAllTimers()
  cleanupStream()
  cleanupAllAudio()

  if (audioContext.value) {
    audioContext.value.close().catch(() => {})
  }
})
</script>

<style lang="scss" scoped>
.ar {
  max-width: 100%;
  width: 100%;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  padding: 0;
  position: relative;

  &__players-section {
    padding: 0.2rem;
  }

  &__players-title {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 2px solid $grey-3;
    margin-bottom: 0.2rem;
  }

  &__no-files {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100px;
    padding: 2rem;
    background-color: $grey-1;
    border-radius: 8px;
    border: 1px dashed $grey-3;
  }
}

.audio-players {
  width: 100%;

  .q-scrollarea {
    border-radius: 0 0 16px 16px;
  }
}
</style>
