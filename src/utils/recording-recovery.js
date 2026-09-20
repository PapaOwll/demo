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

export const clearRecordingRecovery = (key) =>
  withStore('readwrite', (store) => store.delete(key)).catch(() => {})

/**
 * @returns {Promise<Array<{key: string, blob: Blob, mimeType: string, context: object, savedAt: number}>>}
 */
export const getAllRecordingRecoveries = async () => {
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const entries = []
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const request = transaction.objectStore(STORE_NAME).openCursor()

      request.addEventListener('success', () => {
        const cursor = request.result
        if (cursor) {
          entries.push({ key: cursor.key, ...cursor.value })
          cursor.continue()
        } else {
          resolve(entries)
        }
      })
      transaction.addEventListener('error', () => reject(transaction.error))
      transaction.addEventListener('abort', () => reject(transaction.error))
    })
  } catch {
    return []
  }
}

/**
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
