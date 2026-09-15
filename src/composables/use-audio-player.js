import { ref, onBeforeUnmount } from 'vue'

const formatTime = (seconds) => {
  if (!seconds || Number.isNaN(seconds) || !Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatMs = (ms, withMilliseconds = false) => {
  if (Number.isNaN(ms) || ms === null || ms === undefined || !Number.isFinite(ms)) {
    return withMilliseconds ? '0:00.000' : '0:00'
  }

  const totalMs = Math.max(0, Math.floor(ms))
  const totalSeconds = Math.floor(totalMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const millis = totalMs % 1000
  const mm = String(minutes)
  const ss = String(seconds).padStart(2, '0')
  if (withMilliseconds) return `${mm}:${ss}.${String(millis).padStart(3, '0')}`
  return `${mm}:${ss}`
}

export function useAudioPlayer() {
  const audioElement = ref(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const progress = ref(0)
  const playbackSpeed = ref(1)
  const isLoading = ref(false)

  let progressRafId = null

  const startProgressListener = () => {
    if (progressRafId) {
      cancelAnimationFrame(progressRafId)
    }

    const loop = () => {
      if (audioElement.value && !audioElement.value.paused) {
        currentTime.value = audioElement.value.currentTime
        progress.value = duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
        progressRafId = requestAnimationFrame(loop)
      }
    }
    loop()
  }

  const stopProgressListener = () => {
    if (progressRafId) {
      cancelAnimationFrame(progressRafId)
      progressRafId = null
    }
  }

  const cleanup = () => {
    stopProgressListener()

    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value.src = ''
      audioElement.value = null
    }

    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0
    progress.value = 0
  }

  const initAudio = (src) => {
    cleanup()

    audioElement.value = new Audio()
    audioElement.value.src = src
    audioElement.value.playbackRate = playbackSpeed.value

    audioElement.value.addEventListener('play', () => {
      isPlaying.value = true
      startProgressListener()
    })

    audioElement.value.addEventListener('pause', () => {
      isPlaying.value = false
      stopProgressListener()
    })

    audioElement.value.addEventListener('ended', () => {
      isPlaying.value = false
      currentTime.value = 0
      progress.value = 0
      stopProgressListener()
    })

    audioElement.value.addEventListener('timeupdate', () => {
      if (audioElement.value && !Number.isNaN(audioElement.value.currentTime)) {
        currentTime.value = audioElement.value.currentTime
        progress.value = duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
      }
    })

    audioElement.value.addEventListener('loadedmetadata', () => {
      if (
        audioElement.value &&
        !Number.isNaN(audioElement.value.duration) &&
        Number.isFinite(audioElement.value.duration)
      ) {
        duration.value = audioElement.value.duration
      }
    })

    return audioElement.value
  }

  const play = async () => {
    if (!audioElement.value) return

    isLoading.value = true
    try {
      if (audioElement.value.readyState < 2) {
        audioElement.value.load()
        await new Promise((resolve, reject) => {
          const handlers = {
            canplay: null,
            error: null,
          }

          const removeListeners = () => {
            audioElement.value.removeEventListener('canplay', handlers.canplay)
            audioElement.value.removeEventListener('error', handlers.error)
          }

          handlers.canplay = () => {
            removeListeners()
            resolve()
          }

          handlers.error = (err) => {
            removeListeners()
            reject(err)
          }

          audioElement.value.addEventListener('canplay', handlers.canplay)
          audioElement.value.addEventListener('error', handlers.error)
        })
      }
      await audioElement.value.play()
    } finally {
      isLoading.value = false
    }
  }

  const pause = () => {
    if (audioElement.value) {
      audioElement.value.pause()
    }
  }

  const togglePlay = async () => {
    if (!audioElement.value) return

    if (audioElement.value.paused) {
      await play()
    } else {
      pause()
    }
  }

  const seek = (timeInSeconds) => {
    if (audioElement.value && !Number.isNaN(timeInSeconds)) {
      audioElement.value.currentTime = timeInSeconds
      currentTime.value = timeInSeconds
      progress.value = duration.value > 0 ? (timeInSeconds / duration.value) * 100 : 0
    }
  }

  const seekByPercentage = (percentage) => {
    if (audioElement.value && duration.value > 0) {
      const newTime = (percentage / 100) * duration.value
      seek(newTime)
    }
  }

  const setPlaybackSpeed = (speed) => {
    playbackSpeed.value = speed
    if (audioElement.value) {
      audioElement.value.playbackRate = speed
    }
  }

  onBeforeUnmount(cleanup)

  return {
    audioElement,
    isPlaying,
    currentTime,
    duration,
    progress,
    playbackSpeed,
    isLoading,
    formatTime,
    formatMs,
    initAudio,
    play,
    pause,
    togglePlay,
    seek,
    seekByPercentage,
    setPlaybackSpeed,
    cleanup,
  }
}

export default useAudioPlayer
