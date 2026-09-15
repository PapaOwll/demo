import { ref } from 'vue'

let instance = null

const playNotificationSound = () => {
  try {
    // Create a simple ding sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800 // Frequency in Hz
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to play notification sound:', error)
  }
}

// Show browser notification
const showBrowserNotification = () => {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      // eslint-disable-next-line no-new
      new Notification('یادآوری ضبط جلسه', {
        body: 'جلسه تموم شد؟ یادت نره جلسه رو قطع کنی.',
        icon: `${import.meta.env.BASE_URL}favicon.ico`,
        tag: 'recording-reminder',
      })
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          // eslint-disable-next-line no-new
          new Notification('یادآوری ضبط جلسه', {
            body: 'جلسه تموم شد؟ یادت نره جلسه رو قطع کنی.',
            icon: `${import.meta.env.BASE_URL}favicon.ico`,
            tag: 'recording-reminder',
          })
        }
      })
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to show browser notification:', error)
  }
}

export function useRecordingReminders() {
  // Return existing instance if already created
  if (instance) {
    return instance
  }

  const showDraftReminder = ref(false)
  const showRecordingReminder = ref(false)
  const isRecording = ref(false)
  let draftReminderTimer = null
  let recordingReminderTimer = null

  let toggleRecordingCallback = null

  // Start draft reminder timer (5 seconds after calling)
  const startDraftReminderTimer = () => {
    if (isRecording.value) {
      return
    }

    if (draftReminderTimer) {
      clearTimeout(draftReminderTimer)
    }

    draftReminderTimer = setTimeout(() => {
      if (!isRecording.value) {
        showDraftReminder.value = true
      }
    }, 5000) // 5 seconds
  }

  // Show recording reminder (can be called multiple times)
  const showRecordingReminderNotification = () => {
    showRecordingReminder.value = true
    playNotificationSound()
    showBrowserNotification()

    // Schedule next reminder if still recording
    if (isRecording.value) {
      recordingReminderTimer = setTimeout(() => {
        showRecordingReminderNotification()
      }, 600_000) // Repeat every 10 minutes (600000ms)
    }
  }

  // Start recording reminder timer (10 minutes after calling, then repeats)
  const startRecordingReminderTimer = () => {
    isRecording.value = true

    if (recordingReminderTimer) {
      clearTimeout(recordingReminderTimer)
    }

    recordingReminderTimer = setTimeout(() => {
      showRecordingReminderNotification()
    }, 600_000) // First reminder after 10 minutes (600000ms)
  }

  const clearDraftReminderTimer = () => {
    if (draftReminderTimer) {
      clearTimeout(draftReminderTimer)
      draftReminderTimer = null
    }
  }

  const clearRecordingReminderTimer = () => {
    isRecording.value = false

    if (recordingReminderTimer) {
      clearTimeout(recordingReminderTimer)
      recordingReminderTimer = null
    }
    showRecordingReminder.value = false
  }

  const clearAllTimers = () => {
    clearDraftReminderTimer()
    clearRecordingReminderTimer()
  }

  const setToggleRecordingCallback = (callback) => {
    toggleRecordingCallback = callback
  }

  const triggerToggleRecording = async () => {
    if (toggleRecordingCallback) {
      await toggleRecordingCallback()
    }
  }

  // Create instance
  instance = {
    showDraftReminder,
    showRecordingReminder,
    isRecording,
    startDraftReminderTimer,
    startRecordingReminderTimer,
    clearDraftReminderTimer,
    clearRecordingReminderTimer,
    clearAllTimers,
    setToggleRecordingCallback,
    triggerToggleRecording,
  }

  return instance
}

// Export a function to reset the singleton (for cleanup)
export function resetRecordingReminders() {
  if (instance) {
    instance.clearAllTimers()
    instance = null
  }
}
