<template>
  <div class="individual-player individual-player--recorded">
    <!-- Hidden audio element -->
    <audio
      ref="audioRef"
      :src="audioFile.path"
      @loadedmetadata="onAudioLoaded"
      @timeupdate="onTimeUpdate"
      @ended="onAudioEnded"
    />

    <div class="individual-player__controls">
      <div class="individual-player__right">
        <QBtn round fab-mini flat>
          <IconDotsVertical />
          <QMenu transition-show="jump-down" transition-hide="jump-up">
            <QList padding class="player__opt">
              <QItem clickable class="player__opt-download" @click="handleDownload">
                <IconDownload />
                <span class="q-mr-sm">دانلود</span>
              </QItem>
              <QItem
                clickable
                :disable="isDeleting"
                class="player__opt-delete"
                @click="handleDelete"
              >
                <IconTrash />
                <span class="q-mr-sm">حذف</span>
              </QItem>
            </QList>
          </QMenu>
        </QBtn>
        <div class="individual-player__speed">
          <QBtn fab-mini round flat color="primary">
            <component :is="speedIcon" />
            <QMenu transition-show="jump-down" transition-hide="jump-up" fit>
              <QList padding class="individual-player__speed-menu">
                <QItem
                  v-for="item in playbackRatesOptions"
                  :key="item.value"
                  clickable
                  @click="changePlaybackSpeed(item.value)"
                >
                  <QItemSection>{{ item.label }}</QItemSection>
                </QItem>
              </QList>
            </QMenu>
          </QBtn>
        </div>
        <div class="individual-player__time">
          {{ formatTime(currentTime) }} /
          {{ formatTime(duration) }}
        </div>
      </div>
      <div class="individual-player__left">
        <div class="individual-player__date">
          {{
            audioFile.created_at || audioFile.createdAt
              ? convertToJalaliWithTime(
                  audioFile.created_at || audioFile.createdAt,
                  'HH:mm - jYYYY٫jMM٫jDD'
                )
              : convertToJalaliWithTime(new Date(), 'HH:mm - jYYYY٫jMM٫jDD')
          }}
        </div>
        <QBtn fab-mini flat round color="primary" @click="togglePlay">
          <IconPlayerPauseFilled v-if="isPlaying" />
          <IconPlayerPlayFilled v-else />
        </QBtn>
      </div>
    </div>

    <!-- Timeline -->
    <div class="individual-player__timeline">
      <div class="individual-player__timeline-track" @click="seekAudio">
        <div class="individual-player__timeline-progress" :style="{ width: `${progress}%` }" />
        <div class="individual-player__timeline-handle" :style="{ left: `${progress}%` }" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import {
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconDotsVertical,
  IconDownload,
  IconTrash,
  IconMultiplier1x,
  IconMultiplier15x,
  IconMultiplier2x,
} from '@tabler/icons-vue'
import { convertToJalaliWithTime } from '@/utils/date-utils'

const props = defineProps({
  audioFile: {
    type: Object,
    required: true,
  },
  isDeleting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['download', 'delete', 'play', 'pause'])

const audioRef = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const playbackSpeed = ref(1)

const playbackRates = [
  { label: 'معمولی', value: 1 },
  { label: 'سریع', value: 1.5 },
  { label: 'خیلی سریع', value: 2 },
]

const playbackRatesOptions = computed(() =>
  playbackRates.map((r) => ({ label: `${r.value}x  ${r.label}`, value: r.value }))
)

const speedIcon = computed(() => {
  if (playbackSpeed.value === 1.5) return IconMultiplier15x
  if (playbackSpeed.value === 2) return IconMultiplier2x
  return IconMultiplier1x
})

const formatTime = (seconds) => {
  if (!seconds || Number.isNaN(seconds) || !Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const onAudioLoaded = () => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration
  }
}

const onTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime
    progress.value = (currentTime.value / duration.value) * 100 || 0
  }
}

const onAudioEnded = () => {
  isPlaying.value = false
  currentTime.value = 0
  progress.value = 0
}

const togglePlay = () => {
  if (!audioRef.value) return

  if (audioRef.value.paused) {
    audioRef.value.play()
    isPlaying.value = true
    emit('play', props.audioFile)
  } else {
    audioRef.value.pause()
    isPlaying.value = false
    emit('pause', props.audioFile)
  }
}

const pause = () => {
  if (audioRef.value) {
    audioRef.value.pause()
    isPlaying.value = false
  }
}

const seekAudio = (event) => {
  if (!audioRef.value) return

  const rect = event.currentTarget.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = clickX / rect.width
  audioRef.value.currentTime = percentage * duration.value
}

const changePlaybackSpeed = (newRate) => {
  playbackSpeed.value = newRate
  if (audioRef.value) {
    audioRef.value.playbackRate = newRate
  }
}

const handleDownload = () => {
  emit('download', props.audioFile)
}

const handleDelete = () => {
  emit('delete', props.audioFile)
}

const cleanup = () => {
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.src = ''
  }
}

onBeforeUnmount(cleanup)

defineExpose({
  pause,
  cleanup,
})
</script>

<style lang="scss" scoped>
.individual-player {
  width: 100%;
  border: 1px solid $grey-4;
  border-radius: 8px;
  overflow: hidden;
  background: $white;
  transition: all 0.2s ease;
  margin-bottom: 1.5rem;

  audio {
    display: none;
  }

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &--recorded {
    border-left: 4px solid $green-6;
  }

  &__controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    background: $white;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__right {
    display: flex;
    align-items: center;
    text-align: right;
  }

  &__time {
    font-size: 0.875rem;
    color: $grey-7;
    white-space: nowrap;
  }

  &__date {
    font-size: 0.75rem;
    color: $grey-8;
    margin-left: 4px;
    white-space: nowrap;
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

  &__timeline {
    position: relative;
    padding: 0;
    margin: 0;
    background: $grey-2;

    &-track {
      position: relative;
      height: 0.25rem;
      background-color: $grey-3;
      cursor: pointer;
      transition: height 0.2s ease;

      &:hover {
        height: 0.375rem;

        .individual-player__timeline-handle {
          opacity: 1;
        }
      }
    }

    &-progress {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background-color: $primary;
      transition: all 0.1s ease;
    }

    &-handle {
      position: absolute;
      top: 50%;
      width: 0.875rem;
      height: 0.875rem;
      background-color: $primary;
      border-radius: 50%;
      transform: translateY(-50%) translateX(-50%);
      cursor: grab;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 2;

      &:active {
        cursor: grabbing;
      }
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
</style>
