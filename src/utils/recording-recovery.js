/**
 * Crash-recovery persistence for in-progress voice recordings.
 *
 * While the user is recording, AudioRecorder periodically persists the
 * partial audio (as a Blob) into IndexedDB — which survives tab close,
 * browser crash and OS shutdown. On the next app load the consumer checks
 * for a leftover recording under its key and re-uploads it through the
 * normal `v1/file/upload` flow.
 */
const DB_NAME = 'sitra-crm'
const DB_VERSION = 1
const STORE_NAME = 'recording-recovery'

let dbPromise = null

const buildRecordingName = (date) =>
  `recording-${date.toISOString().slice(0, 19).replace(/:/g, '-')}.weba`

const openDb = () => {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.addEventListener('upgradeneeded', () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    })

    request.addEventListener('success', () => resolve(request.result))
    request.addEventListener('error', () => {
      dbPromise = null
      reject(request.error)
    })
  })

  return dbPromise
}

const withStore = async (mode, executor) => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    const request = executor(store)

    transaction.addEventListener('complete', () => resolve(request?.result))
    transaction.addEventListener('error', () => reject(transaction.error))
    transaction.addEventListener('abort', () => reject(transaction.error))
  })
}

/**
 * Persists (overwrites) the partial recording stored under `key`.
 *
 * @param {string} key - consumer-scoped key, e.g. `booking-voice-12`
 * @param {object} record
 * @param {Blob} record.blob - partial audio captured so far
 * @param {string} record.mimeType
 * @param {object} record.context - consumer metadata for debugging
 * @param {number} record.savedAt - epoch ms
 */
export const saveRecordingRecovery = (key, { blob, mimeType, context, savedAt }) =>
  withStore('readwrite', (store) =>
    store.put({ blob, mimeType, context, savedAt: savedAt ?? Date.now() }, key)
  )

/**
 * Returns the persisted partial recording for `key`, or `null`.
 *
 * @returns {Promise<{blob: Blob, mimeType: string, context: object, savedAt: number}|null>}
 */
export const getRecordingRecovery = async (key) => {
  try {
    const record = await withStore('readonly', (store) => store.get(key))
    return record ?? null
  } catch {
    return null
  }
}

/**
 * Removes the persisted recording for `key` (called after a successful
 * stop/save, a cancel, or after the recovered file has been handed off).
 */
export const clearRecordingRecovery = (key) =>
  withStore('readwrite', (store) => store.delete(key)).catch(() => {})

/**
 * Builds the `save`-event payload for a recovered recording, in the same
 * shape AudioRecorder emits for a normal stop — so consumers can hand it
 * straight to their existing upload handler.
 *
 * @param {object} recovered - record returned by `getRecordingRecovery`
 * @returns {{file: File, name: string, size: number, type: string, uploadType: string, lastModified: number}}
 */
export const buildRecoveredFilePayload = (recovered) => {
  const savedAt = new Date(recovered?.savedAt || Date.now())
  const file = new File([recovered.blob], buildRecordingName(savedAt), {
    type: recovered.mimeType || recovered.blob.type || 'audio/webm',
    lastModified: savedAt.getTime(),
  })

  return {
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    uploadType: 'recorded',
    lastModified: file.lastModified,
  }
}
