/**
 * Automatic saving of interrupted voice recordings.
 *
 * A recovery entry lives in IndexedDB ONLY while the voice is genuinely
 * unsaved: the moment upload + attach succeeds the entry is deleted. If the
 * user never comes back (tab closed, crash, offline exit, non-onboarded
 * user), the app-start sweep saves every leftover automatically — no dialog,
 * no user decision needed.
 *
 * Recovered recordings are always attached to the target frozen at recording
 * start (`context`), never to whatever is currently selected on screen.
 */
import { request } from '@/data/services'
import { Notif } from '@/data/services/notification-service'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import {
  saveRecordingRecovery,
  clearRecordingRecovery,
  buildRecoveredFilePayload,
  getAllRecordingRecoveries,
  getRecordingRecovery,
} from '@/utils/recording-recovery'
import { apiAttachBookingVoice, apiUploadTpVoice } from '../api'

export const VOICE_KINDS = {
  BOOKING: 'booking-voice',
  TP: 'tp-voice',
}

const KIND_FILE_TYPE = {
  [VOICE_KINDS.BOOKING]: 'booking.voice',
  [VOICE_KINDS.TP]: 'treatment-plan.voice',
}

// Guards against the page-mount auto-save and the app-start sweep racing on
// the same entry (within one tab). Cross-tab concurrency is not locked: a
// sweep in a second tab may save a recording still in progress in the first.
const pendingKeys = new Set()

// Legacy entries (written before `context.kind` existed) are resolved from
// the key prefix instead.
const resolveKind = (key, context) => {
  if (context?.kind && KIND_FILE_TYPE[context.kind]) return context.kind
  if (key.startsWith(`${VOICE_KINDS.BOOKING}-`)) return VOICE_KINDS.BOOKING
  if (key.startsWith(`${VOICE_KINDS.TP}-`)) return VOICE_KINDS.TP
  return null
}

const isPermanentError = (err) => {
  const status = err?.response?.status
  return status === 404 || status === 410
}

const uploadVoiceFile = async (file, fileType) => {
  const formData = new FormData()
  formData.append('files[0][file]', file)
  formData.append('files[0][type]', fileType)

  const res = await request.post('v1/file/upload', formData, {
    timeout: 120_000,
    skipGlobalErrorHandling: true,
  })
  return res?.data?.[0]?.id ?? null
}

const attachVoiceToFile = (kind, targetId, fileId) => {
  const voices = [{ id: fileId, type: 'recorded' }]
  const config = { hadSnakize: true, skipGlobalErrorHandling: true }

  return kind === VOICE_KINDS.BOOKING
    ? apiAttachBookingVoice(targetId, { voices }, config)
    : apiUploadTpVoice(targetId, { voices }, config)
}

/**
 * @param {string} key - recovery key, e.g. `booking-voice-12`
 * @param {object} record - entry returned by get/getAllRecordingRecoveries
 * @param {object} [options]
 * @param {boolean} [options.notify=true] - show an FYI toast after saving
 * @returns {Promise<boolean>} true when the recording was saved
 */
export const autoSaveRecoveredEntry = async (key, record, { notify = true } = {}) => {
  if (!key || pendingKeys.has(key)) return false

  if (!record?.blob || record.blob.size === 0) {
    await clearRecordingRecovery(key)
    return false
  }

  pendingKeys.add(key)
  try {
    const fresh = await getRecordingRecovery(key)
    if (!fresh?.blob || fresh.blob.size === 0) {
      // Stale/empty entry (e.g. written 0-byte by a crashed session) — clear
      // it so the app-start sweep doesn't retry it on every launch forever.
      await clearRecordingRecovery(key)
      return false
    }

    const kind = resolveKind(key, fresh.context)
    const context = fresh.context || {}
    if (!kind || !(kind === VOICE_KINDS.BOOKING ? context.bookingId : context.tpId)) {
      await clearRecordingRecovery(key)
      return false
    }

    let fileId = context.fileId || null
    if (!fileId) {
      const payload = buildRecoveredFilePayload(fresh)
      fileId = await uploadVoiceFile(payload.file, KIND_FILE_TYPE[kind])
      if (!fileId) throw new Error('voice upload returned no file id')

      saveRecordingRecovery(key, {
        blob: fresh.blob,
        mimeType: fresh.mimeType,
        savedAt: fresh.savedAt,
        context: { ...context, fileId },
      }).catch(() => {})
    }

    const targetId = kind === VOICE_KINDS.BOOKING ? context.bookingId : context.tpId
    await attachVoiceToFile(kind, targetId, fileId)

    await clearRecordingRecovery(key)
    if (notify) {
      const savedAtJalali = convertToJalaliWithTime(new Date(fresh.savedAt || Date.now()))
      Notif.success(`ضبط صوتی ناتمام (${savedAtJalali}) به‌صورت خودکار ذخیره شد`, {
        title: 'ذخیره خودکار',
      })
    }
    return true
  } catch (error) {
    if (isPermanentError(error)) {
      await clearRecordingRecovery(key)
      Notif.warning('ذخیره‌سازی ضبط ناتمام ممکن نبود و از حافظه محلی حذف شد')
    }
    return false
  } finally {
    pendingKeys.delete(key)
  }
}

/**
 * @returns {Promise<number>} how many recordings were saved
 */
export const sweepVoiceRecoveries = async () => {
  const entries = await getAllRecordingRecoveries()
  if (entries.length === 0) return 0

  const results = await Promise.all(
    entries.map((entry) => autoSaveRecoveredEntry(entry.key, entry, { notify: false }))
  )
  const savedCount = results.filter(Boolean).length

  if (savedCount === 1) {
    Notif.success('ضبط صوتی ناتمام به‌صورت خودکار ذخیره شد', { title: 'ذخیره خودکار' })
  } else if (savedCount > 1) {
    Notif.success(`${savedCount} ضبط صوتی ناتمام به‌صورت خودکار ذخیره شد`, {
      title: 'ذخیره خودکار',
    })
  }

  return savedCount
}
