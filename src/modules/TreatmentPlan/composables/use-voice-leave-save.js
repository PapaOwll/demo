/**
 * Deterministic voice save on SPA route leave.
 *
 * The mount-time recovery and the app-start sweep only save an interrupted
 * recording AFTER the user comes back (or reopens the app). This composable
 * closes that gap: when the user navigates away from a page that has an
 * in-progress (or not-yet-attached) recording, the recording is finalized
 * and uploaded + attached BEFORE the navigation is allowed to continue.
 *
 * Tab close / reload cannot guarantee async uploads (the browser kills the
 * JS context during unload), so for those the IndexedDB recovery entry —
 * persisted every 3s and on pagehide by AudioRecorder — plus the app-start
 * sweep remain the safety net.
 */
import { onBeforeRouteLeave } from 'vue-router'
import { Notif } from '@/data/services/notification-service'
import { getRecordingRecovery, clearRecordingRecovery } from '@/utils/recording-recovery'
import { autoSaveRecoveredEntry } from './use-voice-auto-save'

// Upper bound for the whole finalize + upload + attach chain. The user must
// never be trapped on a page by a stuck save: on timeout the navigation
// proceeds and the IndexedDB entry + app-start sweep take over.
const LEAVE_SAVE_TIMEOUT_MS = 60_000

const withTimeout = (promise, ms) => {
  let timer
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error('voice-leave-save timed out')), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/**
 * @param {object} options
 * @param {import('vue').Ref} options.recorderRef - template ref to AudioRecorder
 * @param {() => string | null} options.getRecoveryKey - recovery key of the
 *   recording target; null means no save target (e.g. draft treatment plan),
 *   in which case the legacy unmount behavior is kept
 * @param {() => boolean} [options.isUploadPending] - true while the consumer's
 *   own upload/attach is in flight; those requests complete independently of
 *   navigation and clear the entry on success, so retrying them here would
 *   attach the voice twice
 */
export const useVoiceLeaveSave = ({ recorderRef, getRecoveryKey, isUploadPending }) => {
  onBeforeRouteLeave(async () => {
    const key = getRecoveryKey()
    if (!key) return true

    // A consumer upload/attach is already in flight (the user stopped the
    // recording and its save started, or the recorder was unmounted by
    // collapsing its section): that request survives the navigation and
    // clears the recovery entry on success — auto-saving here would attach
    // the voice twice. On failure the entry stays and the app-start sweep
    // retries it.
    if (isUploadPending?.()) return true

    const recorder = recorderRef.value

    // Stop an in-progress recording and wait for the final IndexedDB
    // snapshot so the full audio is included in the save below.
    if (recorder?.finalizeRecordingForLeave) {
      try {
        await withTimeout(recorder.finalizeRecordingForLeave(), LEAVE_SAVE_TIMEOUT_MS)
      } catch {
        // Finalize hung or failed — the last interval snapshot (≤3s old) is
        // already persisted; continue with whatever the recovery store has.
        // Prevent the abandoned finalize from re-persisting the entry after
        // the save below cleared it (would resurrect a duplicate).
        recorder.abandonRecordingFinalize?.()
      }
    }

    // Nothing recorded (or the consumer's own upload already succeeded and
    // cleared the entry) — nothing to save. A leftover 0-byte entry is
    // garbage: clean it up so the app-start sweep skips it.
    const entry = await getRecordingRecovery(key)
    if (!entry?.blob || entry.blob.size === 0) {
      if (entry) await clearRecordingRecovery(key)
      return true
    }

    try {
      Notif.info('در حال ذخیرهٔ خودکار ضبط صوتی ناتمام...')
      await withTimeout(autoSaveRecoveredEntry(key, entry), LEAVE_SAVE_TIMEOUT_MS)
    } catch {
      Notif.warning(
        'ذخیرهٔ خودکار ضبط صوتی ناتمام پیش از خروج انجام نشد؛ در اجرای بعدی برنامه به‌صورت خودکار ذخیره می‌شود'
      )
    }

    return true
  })
}
