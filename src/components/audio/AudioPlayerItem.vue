<template>
  <div class="audio-players__item">
    <div class="audio-players__header">
      <div class="audio-players__user-info">
        <QChip class="audio-players__user-avatar">
          <IconUser class="q-mx-auto" />
        </QChip>
        <div class="audio-players__user-details">
          <span class="audio-players__user-name">
            {{ audioFile?.originalVoice?.user?.firstName }}
            {{ audioFile?.originalVoice?.user?.name }}
          </span>
          <QChip
            square
            class="text-caption user-role"
            :class="creatorRoleColor(audioFile?.originalVoice?.userRole)"
          >
            <span class="q-mx-auto">{{ audioFile?.originalVoice?.userRole?.faTitle }}</span>
          </QChip>
        </div>
      </div>
      <div class="audio-players__file-number">
        {{ index + 1 }}
      </div>
    </div>

    <!-- Audio Player -->
    <div
      class="individual-player"
      :class="{
        'individual-player--voice': audioFile.uploadType === 'voice',
        'individual-player--recorded': audioFile.uploadType === 'recorded',
        'individual-player--uploaded': audioFile.uploadType === 'uploaded',
      }"
    >
      <div class="individual-player__controls">
        <div class="individual-player__right">
          <QBtn round fab-mini flat dense>
            <IconDotsVertical />
            <QMenu transition-show="jump-down" transition-hide="jump-up">
              <QList padding class="player__opt">
                <QItem clickable class="player__opt-download" @click="handleDownload">
                  <IconDownload />
                  <span class="q-mr-sm">دانلود</span>
                </QItem>
              </QList>
            </QMenu>
          </QBtn>
          <div class="individual-player__speed">
            <QBtn fab-mini round flat color="primary" dense>
              <component :is="speedIcon" />
              <QMenu transition-show="jump-down" transition-hide="jump-up" fit>
                <QList padding class="individual-player__speed-menu">
                  <QItem
                    v-for="item in playbackRatesOptions"
                    :key="item.value"
                    clickable
                    @click="handleSpeedChange(item.value)"
                  >
                    <QItemSection>{{ item.label }}</QItemSection>
                  </QItem>
                </QList>
              </QMenu>
            </QBtn>
          </div>
          <div class="individual-player__time">
            {{ formatMs(currentTimeMs) }} /
            <template v-if="isCalculatingDuration">
              <QSpinner color="primary" size="0.5em" />
            </template>
            <template v-else>
              {{ formatMs(durationMs) }}
            </template>
          </div>
        </div>
        <div class="individual-player__left">
          <div class="individual-player__date">
            {{
              audioFile?.originalVoice?.createdAt
                ? convertToJalaliWithTime(
                    audioFile?.originalVoice?.createdAt,
                    !recordable ? 'HH:mm - jYYYY٫jMM٫jDD - jdddd' : 'HH:mm - jYYYY٫jMM٫jDD'
                  )
                : currentJalaliDateTime
            }}
          </div>
          <QBtn
            fab-mini
            flat
            round
            color="primary"
            :loading="isLoading"
            :disable="isLoading"
            @click="handleTogglePlay"
          >
            <IconPlayerPauseFilled v-if="isPlaying" />
            <IconPlayerPlayFilled v-else />
          </QBtn>
        </div>
      </div>

      <!-- Timeline -->
      <AudioTimeline
        :progress="progressPercent"
        :duration="durationMs"
        :current-time="currentTimeMs"
        :use-ms-format="true"
        @seek="handleSeek"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import {
  IconUser,
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconMultiplier1x,
  IconMultiplier15x,
  IconMultiplier2x,
  IconDotsVertical,
  IconDownload,
} from '@tabler/icons-vue'
import { formatJalali, convertToJalaliWithTime } from '@/utils/date-utils'
import AudioTimeline from './AudioTimeline'

const props = defineProps({
  audioFile: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    default: 0,
  },
  recordable: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['play', 'pause', 'download', 'speed-change', 'seek', 'time-update'])

const isPlaying = ref(false)
const isLoading = ref(false)
const isCalculatingDuration = ref(false)
const currentTimeMs = ref(0)
const durationMs = ref(0)
const playbackRate = ref(1)
const currentJalaliDateTime = ref('')

let audioElement = null
let progressRafId = null
let dateUpdateInterval = null

const playbackRates = [
  { label: 'معمولی', value: 1 },
  { label: 'سریع', value: 1.5 },
  { label: 'خیلی سریع', value: 2 },
]

const playbackRatesOptions = computed(() =>
  playbackRates.map((r) => ({ label: `${r.value}x  ${r.label}`, value: r.value }))
)

const speedIcon = computed(() => {
  if (playbackRate.value === 1.5) return IconMultiplier15x
  if (playbackRate.value === 2) return IconMultiplier2x
  return IconMultiplier1x
})

const progressPercent = computed(() => {
  if (!durationMs.value || durationMs.value === 0) {
    // Show progress as indeterminate when duration is unknown but audio is playing
    return isPlaying.value ? 0 : 0
  }
  return Math.min(100, Math.max(0, (currentTimeMs.value / durationMs.value) * 100))
})

const formatMs = (ms) => {
  if (Number.isNaN(ms) || ms === null || ms === undefined || !Number.isFinite(ms)) {
    return '0:00'
  }
  const totalMs = Math.max(0, Math.floor(ms))
  const totalSeconds = Math.floor(totalMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const creatorRoleColor = (role) => {
  return role?.id === 1 || role?.id === 2
    ? 'user-role__admin'
    : role?.id === 3 || role?.id === 10
      ? 'user-role__advisor'
      : 'user-role__other'
}

const updateJalaliDateTime = () => {
  currentJalaliDateTime.value = formatJalali(new Date(), 'HH:mm - jYYYY٫jMM٫jDD')
}

const startProgressListener = () => {
  if (progressRafId) {
    cancelAnimationFrame(progressRafId)
  }

  const loop = () => {
    if (audioElement && !audioElement.paused) {
      currentTimeMs.value = Math.floor(audioElement.currentTime * 1000)
      emit('time-update', currentTimeMs.value)
      progressRafId = requestAnimationFrame(loop)
    }
  }
  loop()
}

const stopProgressListener = () => {
  if (progressRafId) {
    cancelAnimationFrame(progressRafId)
    progressRafId = null
  }
}

const calculateDurationFromBlob = async (blob) => {
  try {
    const arrayBuffer = await blob.arrayBuffer()
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const buffer = await ctx.decodeAudioData(arrayBuffer.slice())

    const { duration } = buffer
    const calculatedDuration =
      Number.isNaN(duration) || !Number.isFinite(duration) || duration < 0
        ? 0
        : Math.floor(duration * 1000)

    ctx.close().catch(() => {})
    return calculatedDuration
  } catch (error) {
    console.warn('Failed to decode audio for duration calculation:', error)
    return 0
  }
}

const fetchAndCalculateDuration = async (url) => {
  try {
    const response = await fetch(url)
    if (!response.ok) return 0

    const blob = await response.blob()
    if (!blob.type.startsWith('audio/')) return 0

    return await calculateDurationFromBlob(blob)
  } catch (error) {
    console.warn('Failed to fetch audio for duration calculation:', error)
    return 0
  }
}

const initAudioElement = async () => {
  if (!props.audioFile?.url) return

  audioElement = new Audio()
  audioElement.src = props.audioFile.url
  audioElement.playbackRate = playbackRate.value

  audioElement.addEventListener('play', () => {
    isPlaying.value = true
    startProgressListener()
  })

  audioElement.addEventListener('pause', () => {
    isPlaying.value = false
    stopProgressListener()
  })

  audioElement.addEventListener('ended', () => {
    isPlaying.value = false
    stopProgressListener()
  })

  audioElement.addEventListener('timeupdate', () => {
    if (audioElement && !Number.isNaN(audioElement.currentTime)) {
      currentTimeMs.value = Math.floor(audioElement.currentTime * 1000)
    }
  })

  audioElement.addEventListener('loadedmetadata', async () => {
    if (
      audioElement &&
      !Number.isNaN(audioElement.duration) &&
      Number.isFinite(audioElement.duration) &&
      audioElement.duration > 0
    ) {
      durationMs.value = Math.floor(audioElement.duration * 1000)
    } else if (!durationMs.value || durationMs.value === 0) {
      // If browser couldn't get duration from metadata, try to calculate
      isCalculatingDuration.value = true
      try {
        if (props.audioFile?.blob) {
          const calculatedDuration = await calculateDurationFromBlob(props.audioFile.blob)
          if (calculatedDuration > 0) {
            durationMs.value = calculatedDuration
          }
        } else if (props.audioFile?.url) {
          const fetchedDuration = await fetchAndCalculateDuration(props.audioFile.url)
          if (fetchedDuration > 0) {
            durationMs.value = fetchedDuration
          }
        }
      } finally {
        isCalculatingDuration.value = false
      }
    }
  })

  // Initialize with provided duration or try to calculate from blob/url
  if (props.audioFile.durationMs && props.audioFile.durationMs > 0) {
    durationMs.value = props.audioFile.durationMs
  } else if (props.audioFile?.blob) {
    // Pre-calculate duration from blob if available
    isCalculatingDuration.value = true
    try {
      const calculatedDuration = await calculateDurationFromBlob(props.audioFile.blob)
      if (calculatedDuration > 0) {
        durationMs.value = calculatedDuration
      }
    } finally {
      isCalculatingDuration.value = false
    }
  }
}

const handleTogglePlay = async () => {
  if (!audioElement) {
    initAudioElement()
  }

  if (!audioElement) return

  isLoading.value = true
  try {
    if (audioElement.paused) {
      if (audioElement.readyState < 2) {
        audioElement.load()
        await new Promise((resolve, reject) => {
          const handlers = {
            canplay: null,
            error: null,
          }

          const removeListeners = () => {
            audioElement.removeEventListener('canplay', handlers.canplay)
            audioElement.removeEventListener('error', handlers.error)
          }

          handlers.canplay = () => {
            removeListeners()
            resolve()
          }

          handlers.error = (err) => {
            removeListeners()
            reject(err)
          }

          audioElement.addEventListener('canplay', handlers.canplay)
          audioElement.addEventListener('error', handlers.error)
        })
      }
      await audioElement.play()
      emit('play', props.audioFile)
    } else {
      audioElement.pause()
      emit('pause', props.audioFile)
    }
  } finally {
    isLoading.value = false
  }
}

const handleSpeedChange = (newRate) => {
  playbackRate.value = newRate
  if (audioElement) {
    audioElement.playbackRate = newRate
  }
  emit('speed-change', newRate)
}

const handleSeek = (newTimeMs) => {
  if (!audioElement || durationMs.value <= 0) return

  const newTime = newTimeMs / 1000
  audioElement.currentTime = newTime
  currentTimeMs.value = newTimeMs
  emit('seek', newTimeMs)
}

const handleDownload = () => {
  emit('download', props.audioFile)
}

const pause = () => {
  if (audioElement) {
    audioElement.pause()
  }
}

const cleanup = () => {
  stopProgressListener()

  if (audioElement) {
    audioElement.pause()
    audioElement.src = ''
    audioElement = null
  }

  if (dateUpdateInterval) {
    clearInterval(dateUpdateInterval)
    dateUpdateInterval = null
  }
}

watch(
  () => props.audioFile?.isPlaying,
  (newVal) => {
    if (newVal === false && isPlaying.value) {
      pause()
    }
  }
)

onMounted(() => {
  updateJalaliDateTime()
  dateUpdateInterval = setInterval(updateJalaliDateTime, 60_000)

  if (props.audioFile?.durationMs) {
    durationMs.value = props.audioFile.durationMs
  }
})

onBeforeUnmount(cleanup)

defineExpose({
  pause,
  cleanup,
})
</script>

<style lang="scss" scoped>
.audio-players {
  &__item {
    margin-bottom: 0.75rem;
    background: $grey-1;
    border-radius: 12px;
    padding: 0.4rem;
    transition: all 0.2s ease;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    gap: 0.75rem;
  }

  &__user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    min-width: 0;
  }

  &__user-avatar {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    background-color: $white;
    color: $grey-7;
    border: 1px solid $grey-3;
    border-radius: 8px;
    padding: 0.5rem;
  }

  &__user-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    flex: 1;
  }

  &__user-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: $grey-8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  &__file-number {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    background-color: $blue-1;
    color: $blue-6;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    padding: 0 0.5rem;
  }
}

.individual-player {
  width: 100%;
  border: 1px solid $grey-4;
  border-radius: 8px;
  overflow: hidden;
  background: $white;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &--recorded {
    border-left: 4px solid $green-6;
  }

  &--uploaded {
    border-left: 4px solid $orange-6;
  }

  &__controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    background: $white;
    flex-wrap: wrap;

    @media (max-width: 600px) {
      flex-direction: column;
      align-items: stretch;
    }
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;

    @media (max-width: 600px) {
      justify-content: space-between;
      width: 100%;
    }
  }

  &__right {
    display: flex;
    align-items: center;
    text-align: right;
    gap: 4px;
    flex-wrap: wrap;

    @media (max-width: 600px) {
      justify-content: space-between;
      width: 100%;
    }
  }

  &__speed-menu {
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

  &__time {
    font-size: 0.7rem;
    color: $grey-7;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    padding-top: 0.4rem;
  }

  &__date {
    font-size: 0.75rem;
    color: $grey-8;
    margin-left: 4px;
    white-space: nowrap;

    @media (max-width: 600px) {
      font-size: 0.6875rem;
      margin-left: 0;
    }
  }
}

.player__opt {
  padding: 0.5rem;
  min-width: 9.375rem;

  .q-item {
    display: flex;
    align-items: center;
    border-radius: 0.5rem;
    transition: all 0.2s ease;

    &:hover {
      border-radius: 0.5rem;
    }
  }

  &-download:hover {
    background-color: $blue-1;
    color: $blue-6;
  }

  &-delete:hover {
    background-color: $red-1;
    color: $red-6;
  }
}

.user-role {
  font-weight: 500 !important;
  width: fit-content;

  &__admin {
    color: $pink-6;
    background-color: $pink-1;
    border: 1px solid $pink-2;
  }

  &__advisor {
    color: $green-6;
    background-color: $green-1;
    border: 1px solid $green-2;
  }

  &__other {
    color: $blue-6;
    background-color: $blue-1;
    border: 1px solid $blue-2;
  }
}
</style>
