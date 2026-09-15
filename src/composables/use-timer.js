/**
 * Vue composable for managing countdown timers
 *
 * @example
 * // Basic usage
 * const { timer, startTimer, stopTimer } = useTimer(60) // 60 seconds timer
 * startTimer()
 * console.log(timer.formattedTime) // "01:00"
 *
 * @example
 * // Usage with timeout callback
 * const { timer, startTimer } = useTimer(30)
 * startTimer(() => {
 *   console.log('Timer finished!')
 * })
 *
 * @example
 * // Usage in a component
 * <template>
 *   <div>
 *     <p>Time remaining: {{ timer.formattedTime }}</p>
 *     <button @click="startTimer" :disabled="timer.isActive">Start</button>
 *     <button @click="stopTimer" :disabled="!timer.isActive">Stop</button>
 *   </div>
 * </template>
 *
 * <script setup>
 * import { useTimer } from '@/composables/use-timer'
 *
 * const { timer, startTimer, stopTimer } = useTimer(60)
 * </script>
 *
 * @typedef {Object} Timer
 * @property {number} start - Timestamp when timer started
 * @property {string} time - Current time remaining as string
 * @property {string} formattedTime - Time formatted as "MM:SS"
 * @property {number|null} timeout - Current timeout reference
 * @property {boolean} isActive - Whether timer is currently running
 * @property {number} allowed - Total allowed time in seconds
 */

import { reactive } from 'vue'

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

export const useTimer = (time) => {
  const timer = reactive({
    start: 0,
    time: '',
    timeout: null,
    isActive: false,
    allowed: time,
    onTimeout: null,
    formattedTime: '00:00',
  })

  const stopTimer = () => {
    window.clearTimeout(timer.timeout)
    timer.time = '0'
    timer.formattedTime = '00:00'
    timer.isActive = false
  }

  const updateTimer = () => {
    window.clearTimeout(timer.timeout)
    const elapsed = timer.allowed - Math.floor((Date.now() - timer.start) / 1000)

    if (elapsed <= 0) {
      stopTimer()
      if (typeof timer.onTimeout === 'function') {
        timer.onTimeout()
      }
    } else {
      timer.time = elapsed.toString()
      timer.formattedTime = formatTime(elapsed)
      timer.timeout = window.setTimeout(updateTimer, 1000)
    }
  }

  const startTimer = (onTimeout) => {
    timer.start = Date.now()
    timer.isActive = true
    timer.onTimeout = onTimeout
    updateTimer()
  }

  const initTimer = () => {
    timer.start = Date.now()
    const elapsed = timer.allowed - Math.floor((Date.now() - timer.start) / 1000)
    timer.time = elapsed.toString()
    timer.formattedTime = formatTime(elapsed)
  }

  return {
    timer,
    startTimer,
    stopTimer,
    updateTimer,
    initTimer,
  }
}
