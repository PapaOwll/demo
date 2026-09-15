import { ref, computed, onBeforeUnmount } from 'vue'

const HOUR_START = 8
const HOUR_HEIGHT = 100
const ROUND_MINUTES = 5
const MIN_DRAG_PX = 8

function yToTime(offsetY) {
  const rawMinutes = HOUR_START * 60 + Math.floor((offsetY / HOUR_HEIGHT) * 60)
  const clamped = Math.max(HOUR_START * 60, Math.min(24 * 60, rawMinutes))
  const rounded = Math.round(clamped / ROUND_MINUTES) * ROUND_MINUTES
  const h = Math.floor(rounded / 60)
  const m = rounded % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function useDragTimeSelect() {
  const isDragging = ref(false)
  const startY = ref(0)
  const endY = ref(0)
  const dragResult = ref(null)
  let cellRect = null

  function onGlobalMove(e) {
    if (!isDragging.value || !cellRect) return
    endY.value = Math.max(0, e.clientY - cellRect.top)
  }

  function onGlobalUp() {
    if (!isDragging.value) return

    const top = Math.min(startY.value, endY.value)
    const bottom = Math.max(startY.value, endY.value)

    dragResult.value =
      bottom - top < MIN_DRAG_PX
        ? { isDrag: false, time: yToTime(top) }
        : { isDrag: true, startTime: yToTime(top), endTime: yToTime(bottom) }

    isDragging.value = false
    cellRect = null
    window.removeEventListener('mousemove', onGlobalMove)
    window.removeEventListener('mouseup', onGlobalUp)
  }

  onBeforeUnmount(() => {
    window.removeEventListener('mousemove', onGlobalMove)
    window.removeEventListener('mouseup', onGlobalUp)
  })

  function startDrag(event, cellEl) {
    if (event.button !== 0) return
    if (
      event.target.closest(
        '.appointment-popup-trigger, .appointment-card, .single-week__preview-card, .single-day__preview-card'
      )
    )
      return

    cellRect = cellEl.getBoundingClientRect()
    const offsetY = event.clientY - cellRect.top

    isDragging.value = true
    startY.value = offsetY
    endY.value = offsetY
    dragResult.value = null

    window.addEventListener('mousemove', onGlobalMove)
    window.addEventListener('mouseup', onGlobalUp)

    event.preventDefault()
  }

  const selectionStyle = computed(() => {
    if (!isDragging.value) return null
    const top = Math.min(startY.value, endY.value)
    const height = Math.abs(endY.value - startY.value)
    return { top: `${top}px`, height: `${height}px` }
  })

  const dragTimeLabel = computed(() => {
    if (!isDragging.value) return null
    const top = Math.min(startY.value, endY.value)
    const bottom = Math.max(startY.value, endY.value)
    if (bottom - top < MIN_DRAG_PX) return null
    return `${yToTime(top)} - ${yToTime(bottom)}`
  })

  return {
    isDragging,
    startY,
    endY,
    selectionStyle,
    startDrag,
    dragResult,
    dragTimeLabel,
  }
}
