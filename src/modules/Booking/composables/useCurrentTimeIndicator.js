import { ref, computed, onMounted, onUnmounted } from 'vue'

const HOUR_START = 8
const HOUR_END = 24
const HOUR_HEIGHT_PX = 100

export function useCurrentTimeIndicator() {
  const currentTime = ref(new Date())
  let intervalId

  onMounted(() => {
    intervalId = setInterval(() => {
      currentTime.value = new Date()
    }, 60 * 1000)
  })

  onUnmounted(() => {
    clearInterval(intervalId)
  })

  const hours = computed(() => {
    const h = []
    for (let i = HOUR_START; i <= HOUR_END; i += 1) {
      h.push(i)
    }
    return h
  })

  const currentTimeIndicatorTop = computed(() => {
    const now = currentTime.value
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    if (currentHour < HOUR_START || currentHour > HOUR_END) return -100
    return (currentHour - HOUR_START) * HOUR_HEIGHT_PX + (currentMinute / 60) * HOUR_HEIGHT_PX
  })

  return {
    currentTime,
    hours,
    currentTimeIndicatorTop,
  }
}
