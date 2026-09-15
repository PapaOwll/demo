<template>
  <div>
    <div v-if="!isRecording" class="ar__controls-section ar__controls-section--fixed">
      <slot name="upload-status" />

      <div class="ar__rnu">
        <QBtn color="red" unelevated :loading="isLoading" :disable="isLoading" @click="startRecord">
          <div class="ar__rnu-btn">
            <IconMicrophone />
          </div>
        </QBtn>

        <slot name="upload" />
      </div>
    </div>

    <div v-else class="ar__recording-mode ar__recording-mode--fixed">
      <div class="ar__recording-container">
        <div class="ar__cancel-badge" @click="cancelRecord">لغو</div>

        <QBtn
          color="red-6"
          unelevated
          round
          fab
          :loading="isLoading"
          :disable="isLoading"
          size="lg"
          class="ar__stop-btn"
          @click="stopRecord"
        >
          <IconUpload />
          <QTooltip
            anchor="bottom middle"
            self="top middle"
            :offset="[0, 10]"
            class="ar__recording-tooltip"
          >
            زمان ضبط: {{ formattedElapsed }}
          </QTooltip>
        </QBtn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IconMicrophone, IconUpload } from '@tabler/icons-vue'

const props = defineProps({
  isRecording: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  elapsedMs: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['start-recording', 'stop-recording', 'cancel-recording'])

const formatMs = (ms) => {
  if (Number.isNaN(ms) || ms === null || ms === undefined || !Number.isFinite(ms)) {
    return '0:00'
  }

  const totalMs = Math.max(0, Math.floor(ms))
  const totalSeconds = Math.floor(totalMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const mm = String(minutes)
  const ss = String(seconds).padStart(2, '0')
  return `${mm}:${ss}`
}

const formattedElapsed = computed(() => formatMs(props.elapsedMs))

const startRecord = () => {
  emit('start-recording')
}

const stopRecord = () => {
  emit('stop-recording')
}

const cancelRecord = () => {
  emit('cancel-recording')
}
</script>

<style lang="scss" scoped>
.ar {
  &__controls-section {
    padding: 0.5rem;
    border-bottom: 1px solid $grey-2;

    &--fixed {
      position: fixed;
      bottom: 20px;
      left: 45px;
      z-index: 1000;
      max-width: 600px;
      width: auto;
      min-width: 400px;
      background-color: white;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      border: 1px solid $grey-3;
    }
  }

  &__recording-mode {
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;

    &--fixed {
      position: fixed;
      bottom: 20px;
      left: 45px;
      z-index: 1000;
      background-color: white;
      border-radius: 50%;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      border: 2px solid $red-6;
      animation: pulse-recording 2s infinite;
    }
  }

  &__recording-container {
    position: relative;
    display: inline-block;
  }

  &__cancel-badge {
    position: absolute;
    top: -22px;
    right: -18px;
    background-color: $grey-6;
    color: white;
    border-radius: 12px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    z-index: 1001;
    box-shadow: 0 2px 8px rgba($grey-6, 0.4);
    border: 2px solid white;
    transition: all 0.2s ease;

    &:hover {
      background-color: $grey-7;
      transform: scale(1.05);
      box-shadow: 0 3px 12px rgba($grey-7, 0.5);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  &__stop-btn {
    width: 60px !important;
    height: 60px !important;
    min-width: auto !important;
    max-width: none !important;
    position: relative !important;
    z-index: 1000 !important;

    .q-btn__content {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &:hover {
      transform: scale(1.1) !important;
      box-shadow: 0 8px 24px rgba($red-6, 0.4) !important;
    }

    &:active {
      transform: scale(0.95) !important;
    }
  }

  &__recording-tooltip {
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
    background-color: rgba($grey-9, 0.95);
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(8px);
    max-width: 200px;
    text-align: center;
  }

  &__rnu {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;

    .q-btn {
      min-width: auto !important;
      height: 48px !important;
      border-radius: 24px !important;
      font-weight: 600 !important;
      padding: 0 16px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

      &:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
      }

      &:active {
        transform: translateY(0) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
      }
    }

    &-btn {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
    }
  }
}

@keyframes pulse-recording {
  0% {
    box-shadow: 0 0 0 0 rgba($red-6, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba($red-6, 0.1);
  }
  100% {
    box-shadow: 0 0 0 16px rgba($red-6, 0);
  }
}
</style>
