import { ref, onBeforeUnmount } from 'vue'

const calculatePositionFromEvent = (event, element) => {
  if (!element) return { x: 0, percentage: 0 }

  const rect = element.getBoundingClientRect()
  if (rect.width <= 0) return { x: 0, percentage: 0 }

  const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
  const percentage = (x / rect.width) * 100

  return { x, percentage }
}

export function useTimelineDrag(options = {}) {
  const { onSeek, onDragStart, onDragEnd } = options

  const isDragging = ref(false)
  const tooltipPosition = ref(0)
  const tooltipTime = ref(0)
  const showTooltip = ref(false)

  let mouseHandlers = null

  const cleanupMouseListeners = () => {
    if (mouseHandlers) {
      document.removeEventListener('mousemove', mouseHandlers.handleMouseMove)
      document.removeEventListener('mouseup', mouseHandlers.handleMouseUp)
      mouseHandlers = null
    }
  }

  const handleTimelineClick = (event, element, duration) => {
    if (!element || duration <= 0) return

    const { percentage } = calculatePositionFromEvent(event, element)
    const newTime = (percentage / 100) * duration

    if (onSeek) {
      onSeek(newTime, percentage)
    }
  }

  const handleTimelineHover = (event, element, duration) => {
    if (!element || duration <= 0) return

    const { x, percentage } = calculatePositionFromEvent(event, element)

    tooltipPosition.value = x
    tooltipTime.value = (percentage / 100) * duration
    showTooltip.value = true
  }

  const handleMouseLeave = () => {
    showTooltip.value = false
  }

  const handleMouseEnter = () => {
    showTooltip.value = true
  }

  const startDragging = (event, element, duration) => {
    if (!element || duration <= 0) return

    isDragging.value = true
    event.preventDefault()

    cleanupMouseListeners()

    if (onDragStart) {
      onDragStart()
    }

    const handleMouseMove = (e) => {
      if (!isDragging.value) return

      const { percentage } = calculatePositionFromEvent(e, element)
      const newTime = (percentage / 100) * duration

      if (onSeek) {
        onSeek(newTime, percentage)
      }
    }

    const handleMouseUp = () => {
      isDragging.value = false
      cleanupMouseListeners()

      if (onDragEnd) {
        onDragEnd()
      }
    }

    mouseHandlers = { handleMouseMove, handleMouseUp }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const cleanup = () => {
    cleanupMouseListeners()
    isDragging.value = false
    showTooltip.value = false
  }

  onBeforeUnmount(cleanup)

  return {
    isDragging,
    tooltipPosition,
    tooltipTime,
    showTooltip,
    handleTimelineClick,
    handleTimelineHover,
    handleMouseLeave,
    handleMouseEnter,
    startDragging,
    calculatePositionFromEvent,
    cleanup,
  }
}

export default useTimelineDrag
