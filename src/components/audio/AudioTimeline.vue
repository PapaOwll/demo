<template>
  <div class="audio-timeline" @click="handleClick">
    <div
      ref="trackRef"
      class="audio-timeline__track"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @mousemove="handleHover"
    >
      <div class="audio-timeline__progress" :style="{ width: progressPercent + '%' }" />
      <div
        class="audio-timeline__handle"
        :style="{ left: progressPercent + '%' }"
        @mousedown="handleDragStart"
      />
    </div>

    <!-- Time Tooltip -->
    <div
      v-if="showTooltip"
      class="audio-timeline__tooltip"
      :style="{ left: tooltipPosition + 'px' }"
    >
      {{ formatTimeDisplay(tooltipTime) }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

const props = defineProps({
  progress: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number,
    default: 0,
  },
  currentTime: {
    type: Number,
    default: 0,
  },
  useMsFormat: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['seek', 'drag-start', 'drag-end'])

const trackRef = ref(null)
const showTooltip = ref(false)
const tooltipPosition = ref(0)
const tooltipTime = ref(0)
const isDragging = ref(false)

let mouseHandlers = null

const formatSeconds = (seconds) => {
  if (!seconds || Number.isNaN(seconds) || !Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

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

const progressPercent = computed(() => {
  return Math.min(100, Math.max(0, props.progress))
})

const formatTimeDisplay = (time) => {
  if (props.useMsFormat) {
    return formatMs(time)
  }
  return formatSeconds(time)
}

const calculatePosition = (event) => {
  if (!trackRef.value) return { x: 0, percentage: 0 }

  const rect = trackRef.value.getBoundingClientRect()
  if (rect.width <= 0) return { x: 0, percentage: 0 }

  const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
  const percentage = (x / rect.width) * 100

  return { x, percentage }
}

const handleClick = (event) => {
  if (props.duration <= 0) return

  const { percentage } = calculatePosition(event)
  const newTime = (percentage / 100) * props.duration

  emit('seek', newTime, percentage)
}

const handleHover = (event) => {
  if (props.duration <= 0) return

  const { x, percentage } = calculatePosition(event)

  tooltipPosition.value = x
  tooltipTime.value = (percentage / 100) * props.duration
}

const handleMouseEnter = () => {
  showTooltip.value = true
}

const handleMouseLeave = () => {
  if (!isDragging.value) {
    showTooltip.value = false
  }
}

const cleanupMouseListeners = () => {
  if (mouseHandlers) {
    document.removeEventListener('mousemove', mouseHandlers.handleMouseMove)
    document.removeEventListener('mouseup', mouseHandlers.handleMouseUp)
    mouseHandlers = null
  }
}

const handleDragStart = (event) => {
  if (props.duration <= 0) return

  event.preventDefault()
  event.stopPropagation()
  isDragging.value = true

  emit('drag-start')

  cleanupMouseListeners()

  const handleMouseMove = (e) => {
    if (!isDragging.value) return

    const { percentage } = calculatePosition(e)
    const newTime = (percentage / 100) * props.duration

    emit('seek', newTime, percentage)
  }

  const handleMouseUp = () => {
    isDragging.value = false
    showTooltip.value = false
    cleanupMouseListeners()

    emit('drag-end')
  }

  mouseHandlers = { handleMouseMove, handleMouseUp }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

onBeforeUnmount(() => {
  cleanupMouseListeners()
})
</script>

<style lang="scss" scoped>
.audio-timeline {
  position: relative;
  padding: 0;
  margin: 0;
  background: $grey-2;

  &__track {
    position: relative;
    height: 0.25rem;
    background-color: $grey-3;
    cursor: pointer;
    transition: height 0.2s ease;

    &:hover {
      height: 0.375rem;

      .audio-timeline__handle {
        opacity: 1;
      }
    }
  }

  &__progress {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background-color: $primary;
    transition: all 0.1s ease;
  }

  &__handle {
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

  &__tooltip {
    position: absolute;
    bottom: 100%;
    transform: translateX(-50%);
    margin-bottom: 0.5rem;
    padding: 0.25rem 0.5rem;
    background-color: rgba($grey-9, 0.9);
    color: $white;
    font-size: 0.75rem;
    border-radius: 0.25rem;
    white-space: nowrap;
    pointer-events: none;
    z-index: 3;
    font-variant-numeric: tabular-nums;

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 0.25rem solid transparent;
      border-top-color: rgba($grey-9, 0.9);
    }
  }
}
</style>
