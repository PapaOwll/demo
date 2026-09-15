import { ref, computed, onBeforeUnmount } from 'vue'

const ZOOM_CONFIG = {
  MIN_SCALE: 0.5,
  MAX_SCALE: 5,
  WHEEL_STEP: 0.1,
  PINCH_STEP: 0.05,
}

// Utility function to clamp values
const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

// Calculate distance between two touch points
const getTouchDistance = (touches) => {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.hypot(dx, dy)
}

export function useImageZoom(options = {}) {
  const {
    minScale = ZOOM_CONFIG.MIN_SCALE,
    maxScale = ZOOM_CONFIG.MAX_SCALE,
    onZoomChange,
  } = options

  // State
  const scale = ref(1)
  const translateX = ref(0)
  const translateY = ref(0)
  const isDragging = ref(false)
  const dragStartX = ref(0)
  const dragStartY = ref(0)
  const initialTranslateX = ref(0)
  const initialTranslateY = ref(0)
  const lastTouchDistance = ref(0)

  // Computed styles
  const containerStyle = computed(() => ({
    transform: `scale(${scale.value}) translate(${translateX.value}px, ${translateY.value}px)`,
    transformOrigin: 'center center',
    transition: isDragging.value ? 'none' : 'transform 0.3s ease',
    cursor: scale.value > 1 ? 'grab' : 'default',
  }))

  // Reset zoom to default
  const reset = () => {
    scale.value = 1
    translateX.value = 0
    translateY.value = 0
    isDragging.value = false
    lastTouchDistance.value = 0
  }

  // Handle mouse wheel zoom
  const handleWheel = (e) => {
    const delta = e.deltaY > 0 ? -ZOOM_CONFIG.WHEEL_STEP : ZOOM_CONFIG.WHEEL_STEP
    const newScale = clamp(scale.value + delta, minScale, maxScale)

    if (newScale <= 1) {
      reset()
    } else {
      scale.value = newScale
    }

    onZoomChange?.(scale.value)
  }

  // Handle mouse down for dragging
  const handleMouseDown = (e) => {
    if (scale.value > 1) {
      isDragging.value = true
      dragStartX.value = e.clientX
      dragStartY.value = e.clientY
      initialTranslateX.value = translateX.value
      initialTranslateY.value = translateY.value
    }
  }

  // Handle mouse move for panning
  const handleMouseMove = (e) => {
    if (isDragging.value && scale.value > 1) {
      const deltaX = e.clientX - dragStartX.value
      const deltaY = e.clientY - dragStartY.value

      // Calculate boundary constraints to prevent dragging off-screen
      const maxTranslate = (scale.value - 1) * 500

      translateX.value = clamp(initialTranslateX.value + deltaX, -maxTranslate, maxTranslate)
      translateY.value = clamp(initialTranslateY.value + deltaY, -maxTranslate, maxTranslate)
    }
  }

  // Handle mouse up
  const handleMouseUp = () => {
    isDragging.value = false
  }

  // Handle touch start for pinch-to-zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      lastTouchDistance.value = getTouchDistance(e.touches)
    } else if (e.touches.length === 1 && scale.value > 1) {
      isDragging.value = true
      dragStartX.value = e.touches[0].clientX
      dragStartY.value = e.touches[0].clientY
      initialTranslateX.value = translateX.value
      initialTranslateY.value = translateY.value
    }
  }

  // Handle touch move for pinch-to-zoom and dragging
  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const currentDistance = getTouchDistance(e.touches)
      const delta = currentDistance - lastTouchDistance.value
      const scaleFactor = delta > 0 ? ZOOM_CONFIG.PINCH_STEP : -ZOOM_CONFIG.PINCH_STEP
      const newScale = clamp(scale.value + scaleFactor, minScale, maxScale)

      if (newScale <= 1) {
        reset()
      } else {
        scale.value = newScale
      }

      lastTouchDistance.value = currentDistance
      onZoomChange?.(scale.value)
    } else if (e.touches.length === 1 && isDragging.value) {
      const deltaX = e.touches[0].clientX - dragStartX.value
      const deltaY = e.touches[0].clientY - dragStartY.value

      // Apply boundary constraints
      const maxTranslate = (scale.value - 1) * 500

      translateX.value = clamp(initialTranslateX.value + deltaX, -maxTranslate, maxTranslate)
      translateY.value = clamp(initialTranslateY.value + deltaY, -maxTranslate, maxTranslate)
    }
  }

  // Handle touch end
  const handleTouchEnd = () => {
    isDragging.value = false
    lastTouchDistance.value = 0
  }

  // Cleanup on unmount
  const cleanup = () => {
    reset()
  }

  onBeforeUnmount(cleanup)

  return {
    // State
    scale,
    translateX,
    translateY,
    isDragging,

    // Computed
    containerStyle,

    // Methods
    reset,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    cleanup,
  }
}
