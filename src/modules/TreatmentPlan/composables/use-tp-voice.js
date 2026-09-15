import { ref, computed } from 'vue'

// Singleton state shared across all instances
const pendingVoiceRecordings = ref([])

export function useTpVoice() {
  const addVoiceRecording = (voice) => {
    pendingVoiceRecordings.value.push(voice)
  }

  const saveVoiceRecordings = (treatmentPlanId, uploadVoiceMutation) => {
    if (pendingVoiceRecordings.value.length === 0) return

    const voices = pendingVoiceRecordings.value.map((voice) => ({
      id: voice.id,
      type: voice.type,
    }))

    uploadVoiceMutation({ id: treatmentPlanId, voices })
    pendingVoiceRecordings.value = []
  }

  const clearVoiceRecordings = () => {
    pendingVoiceRecordings.value = []
  }

  const getCombinedVoiceRecordings = (savedVoices, options = {}) => {
    const { markPending = false } = options

    return computed(() => {
      const saved = savedVoices?.value || []
      const pending = markPending
        ? pendingVoiceRecordings.value.map((voice) => ({ ...voice, isPending: true }))
        : pendingVoiceRecordings.value

      return [...saved, ...pending]
    })
  }

  return {
    pendingVoiceRecordings,
    addVoiceRecording,
    saveVoiceRecordings,
    clearVoiceRecordings,
    getCombinedVoiceRecordings,
  }
}
