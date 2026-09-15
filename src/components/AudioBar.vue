<template>
  <div v-if="totalDuration > 0" class="audio-player">
    <audio ref="audioRef" />

    <div class="controls">
      <button class="icon" aria-label="۱۰ ثانیه به عقب" @click="rewind">
        <IconRewindBackward10 />
      </button>
      <button v-if="loadingAudio" class="icon" disabled>
        <QSpinnerTail color="primary" size="20px" />
      </button>
      <button v-else-if="playing" class="icon" @click="togglePlay">
        <IconPlayerPauseFilled />
      </button>
      <button v-else class="icon" @click="togglePlay">
        <IconPlayerPlayFilled />
      </button>
      <button class="icon" aria-label="۱۰ ثانیه به جلو" @click="forward">
        <IconRewindForward10 />
      </button>
      <button v-if="props.src" class="icon" :disabled="loading" @click="downloadVoice">
        <QInnerLoading :showing="loading" class="q-mx-auto q-my-auto">
          <QSpinnerTail color="primary" size="20px" />
        </QInnerLoading>
        <QTooltip class="bg-black text-white text-caption">دانلود فایل صوتی</QTooltip>
        <IconDownload v-if="props.src" class="icon" />
      </button>
    </div>
    <div class="time-display">{{ formattedCurrentTime }} / {{ formattedDuration }}</div>

    <div class="progress-container">
      <input
        type="range"
        min="0"
        :max="totalDuration"
        step="0.1"
        :value="currentTime"
        aria-label="Seek"
        @input="onSeek"
      />
      <div class="speed-settings">
        <QBtn fab-mini flat round color="primary">
          <component :is="getPlayerSpeedIcon" />
          <QMenu transition-show="jump-down" transition-hide="jump-up" fit>
            <QList padding class="speed-menu">
              <QItem
                v-for="item in playbackRatesOptions"
                :key="item.value"
                clickable
                @click="changeSpeed(item.value)"
              >
                <QItemSection>{{ item.label }}</QItemSection>
              </QItem>
            </QList>
          </QMenu>
        </QBtn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, unref } from 'vue'
import {
  IconPlayerPlayFilled,
  IconRewindForward10,
  IconRewindBackward10,
  IconPlayerPauseFilled,
  IconDownload,
  IconMultiplier1x,
  IconMultiplier15x,
  IconMultiplier2x,
} from '@tabler/icons-vue'
import { handleError } from '@/utils/error-handler'
import { Notif } from '@/data/services/notification-service'
import { useAudioManager } from '@/composables/use-audio-manager'

const props = defineProps({
  src: { type: String, required: true },
  totalDuration: { type: Number, required: true },
})

const loading = ref(false)
const loadingAudio = ref(false)
const audioRef = ref(null)
const playing = ref(false)
const hasUserInteracted = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const audioBlob = ref(null)
const audioBlobUrl = ref(null)
const playbackRate = ref(1)
const { registerAsPlaying, unregisterAsPlaying } = useAudioManager()

const stopPlaying = () => {
  playing.value = false
}

const playbackRates = [
  { label: 'معمولی', value: 1 },
  { label: 'سریع', value: 1.5 },
  { label: 'خیلی سریع', value: 2 },
]

const playbackRatesOptions = computed(() =>
  playbackRates.map((r) => ({ label: `${r.value}x  ${r.label}`, value: r.value }))
)

const getPlayerSpeedIcon = computed(() => {
  if (playbackRate.value === 1.5) return IconMultiplier15x
  if (playbackRate.value === 2) return IconMultiplier2x
  return IconMultiplier1x
})

const formatTime = (seconds) => {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  const paddedMin = String(min).padStart(2, '0')
  const paddedSec = String(sec).padStart(2, '0')
  return `${paddedMin}:${paddedSec}`
}
const formattedDuration = computed(() => formatTime(props.totalDuration))
const formattedCurrentTime = computed(() => formatTime(currentTime.value))

const fetchAudioBlob = async () => {
  if (audioBlob.value) return audioBlob.value
  const response = await fetch(`/mocks/sample-voice.wav?file=${props.src}`)
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`)
  }
  audioBlob.value = await response.blob()
  return audioBlob.value
}

const togglePlay = async () => {
  if (!audioRef.value || loadingAudio.value) return
  hasUserInteracted.value = true
  if (playing.value) {
    audioRef.value.pause()
    playing.value = false
    unregisterAsPlaying(audioRef.value)
  } else {
    const audio = unref(audioRef)
    registerAsPlaying(audio, stopPlaying)
    if (duration.value > 0) {
      playing.value = true
      audio.play()
    } else {
      try {
        loadingAudio.value = true
        const blob = await fetchAudioBlob()

        if (audioBlobUrl.value) {
          URL.revokeObjectURL(audioBlobUrl.value)
        }

        audioBlobUrl.value = URL.createObjectURL(blob)
        audio.src = audioBlobUrl.value
        playing.value = true
        audio.play()
      } catch (error) {
        playing.value = false
        unregisterAsPlaying(audio)
        handleError(error)
        Notif.error('خطا در دریافت فایل صوتی. مجددا تلاش کنید.')
      } finally {
        loadingAudio.value = false
      }
    }
  }
}

const rewind = () => {
  if (!audioRef.value) return
  audioRef.value.currentTime = Math.max(audioRef.value.currentTime - 10, 0)
}

const forward = () => {
  if (!audioRef.value) return
  audioRef.value.currentTime = Math.min(audioRef.value.currentTime + 10, props.totalDuration)
}

const updateTime = () => {
  if (!audioRef.value) return
  currentTime.value = audioRef.value.currentTime
}

const onEnded = () => {
  playing.value = false
  if (audioRef.value) {
    audioRef.value.currentTime = 0
    unregisterAsPlaying(audioRef.value)
  }
}

const onSeek = (event) => {
  if (!audioRef.value) return
  const newTime = Number(event.target.value)
  audioRef.value.currentTime = newTime
  currentTime.value = newTime
}

const changeSpeed = (newRate) => {
  playbackRate.value = newRate
  if (audioRef.value) {
    audioRef.value.playbackRate = newRate
  }
}

const downloadVoice = async () => {
  try {
    loading.value = true
    const blob = await fetchAudioBlob()

    // Force WAV file type
    const wavBlob = new Blob([blob], { type: 'audio/wav' })
    const url = URL.createObjectURL(wavBlob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${(props.src.split('/').pop() || 'audio-file').replace(/\.[^./]+$/, '')}.wav`
    document.body.append(a)
    a.click()
    a.remove()

    URL.revokeObjectURL(url)
  } catch {
    loading.value = false
    Notif.error('خطا در دریافت فایل. ')
  } finally {
    loading.value = false
  }
}

function handleLoadedMetadata() {
  if (!audioRef.value) return
  duration.value = audioRef.value.duration
}

function handleAudioError() {
  if (!hasUserInteracted.value) return
  playing.value = false
  loadingAudio.value = false
  if (audioRef.value) {
    unregisterAsPlaying(audioRef.value)
  }
  Notif.error('خطا در پخش فایل صوتی ')
}

onMounted(() => {
  if (!audioRef.value) return
  audioRef.value.addEventListener('timeupdate', updateTime)
  audioRef.value.addEventListener('ended', onEnded)
  audioRef.value.addEventListener('loadedmetadata', handleLoadedMetadata)
  audioRef.value.addEventListener('error', handleAudioError)
})

onBeforeUnmount(() => {
  if (audioRef.value) {
    audioRef.value.pause()
    unregisterAsPlaying(audioRef.value)
  }
  if (audioBlobUrl.value) {
    URL.revokeObjectURL(audioBlobUrl.value)
    audioBlobUrl.value = null
  }
})
</script>

<style scoped lang="scss">
.audio-player {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 0 auto;
  direction: ltr;
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.controls button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.controls button:focus {
  outline: 2px solid $primary;
}

.progress-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.progress-container input[type='range'] {
  flex: 1;
  margin: 0 0.5rem;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 10px;
  background: #cce6ff;
  outline: none;
}

.time-display {
  font-weight: 700;
  color: $primary;
  min-width: 100px;
  text-align: center;
  font-size: 0.9rem;
}

.audio-player {
  padding: 10px;
  border-top: 1px solid #eee;
}

.controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon {
  background: none;
  border: none;
  color: $primary;
  font-size: 16px;
  cursor: pointer;
}

.time {
  color: $primary;
  font-size: 14px;
  min-width: 40px;
}

.progress {
  -webkit-appearance: none;
  appearance: none;
  flex-grow: 1;
  height: 4px;
  border-radius: 10px;
  background: $primary;
  outline: none;
}

.progress::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: $primary;
  border-radius: 50%;
  cursor: pointer;
  margin-top: -4px;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
}

.progress::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: $primary;
  border-radius: 50%;
  cursor: pointer;
}

.speed-settings {
  display: flex;
  align-items: center;
  margin-left: 10px;
}

.speed-menu {
  padding: 0.5rem;
  min-width: 9rem;

  .q-item {
    border-radius: 0.5rem;
    transition: all 0.2s ease;

    &:hover {
      background-color: $blue-1;
      color: $blue-6;
    }
  }
}
</style>
