import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

const HOUR_START = 8
const HOUR_HEIGHT_PX = 100

function smoothScrollTo(element, targetTop, duration = 800) {
  const startTop = element.scrollTop
  const distance = targetTop - startTop
  if (distance === 0) return
  const startTime = performance.now()
  const node = element

  function step(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - (1 - progress) ** 3
    node.scrollTop = startTop + distance * eased
    if (progress < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

export function useScrollToFirstBooking(bookings) {
  const scrollRef = ref(null)
  let scrolled = false
  let raf = null

  function doScroll() {
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      const el = scrollRef.value
      if (!el) return
      const list = typeof bookings === 'function' ? bookings() : bookings.value
      if (!list?.length) return
      let earliestMins = Infinity
      list.forEach((b) => {
        const d = new Date(b.bookingAt)
        if (Number.isNaN(d.getTime())) return
        const m = d.getHours() * 60 + d.getMinutes()
        if (m < earliestMins) earliestMins = m
      })
      if (earliestMins === Infinity) return
      const h = Math.floor(earliestMins / 60)
      const min = earliestMins % 60
      const target = Math.max(
        0,
        (h - HOUR_START - 1) * HOUR_HEIGHT_PX + (min / 60) * HOUR_HEIGHT_PX
      )
      smoothScrollTo(el, target)
    })
  }

  onMounted(() => {
    nextTick(() => {
      doScroll()
    })
  })

  watch(
    () => {
      const list = typeof bookings === 'function' ? bookings() : bookings.value
      return list?.length ?? 0
    },
    (newLen, oldLen) => {
      if (newLen > 0 && (!scrolled || newLen !== oldLen)) {
        scrolled = true
        nextTick(doScroll)
      }
    }
  )

  onUnmounted(() => {
    if (raf) cancelAnimationFrame(raf)
  })

  return { scrollRef }
}
