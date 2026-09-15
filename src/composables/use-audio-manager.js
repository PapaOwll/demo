import { ref } from 'vue'

const currentlyPlayingAudio = ref(null)
const currentlyPlayingCallback = ref(null)

function registerAsPlaying(audioElement, onStoppedCallback) {
  // Stop currently playing audio if different
  if (currentlyPlayingAudio.value && currentlyPlayingAudio.value !== audioElement) {
    currentlyPlayingAudio.value.pause()
    if (currentlyPlayingCallback.value) {
      currentlyPlayingCallback.value()
    }
  }

  currentlyPlayingAudio.value = audioElement
  currentlyPlayingCallback.value = onStoppedCallback
}

function unregisterAsPlaying(audioElement) {
  if (currentlyPlayingAudio.value === audioElement) {
    currentlyPlayingAudio.value = null
    currentlyPlayingCallback.value = null
  }
}

export function useAudioManager() {
  return {
    registerAsPlaying,
    unregisterAsPlaying,
  }
}
