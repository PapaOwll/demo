/**
 * Composable for handling treatment plan viewing operations
 * Normalizes API response format differences between snake_case and camelCase
 */

/**
 * @typedef {Object} TreatmentPlan
 * @property {number} version - Treatment plan version (1 or higher)
 * @property {string} [public_hash_key] - Public hash key (snake_case)
 * @property {string} [publicHashKey] - Public hash key (camelCase)
 * @property {string} [public_link] - Public link URL for v1 (snake_case)
 * @property {string} [publicLink] - Public link URL for v1 (camelCase)
 */

/**
 * Gets the public hash key from a treatment plan object
 * Handles both snake_case and camelCase property names
 * @param {TreatmentPlan} treatmentPlan - Treatment plan object
 * @returns {string|undefined} Public hash key
 */
function getPublicHashKey(treatmentPlan) {
  return treatmentPlan
    ? treatmentPlan?.publicHashKey || treatmentPlan?.treatmentPlan?.publicHashKey
    : undefined
}

/**
 * Gets the public link from a treatment plan object (for version 1)
 * Handles both snake_case and camelCase property names
 * @param {TreatmentPlan} treatmentPlan - Treatment plan object
 * @returns {string|undefined} Public link URL
 */
function getPublicLink(treatmentPlan) {
  return treatmentPlan
    ? treatmentPlan?.publicLink ||
        treatmentPlan?.treatmentPlan?.publicLink ||
        treatmentPlan?.public_link ||
        treatmentPlan?.treatmentPlan?.public_link
    : undefined
}

/**
 * Opens a treatment plan in a new tab
 * Handles both version 1 (direct link) and version 2+ (hash key routing)
 * @param {TreatmentPlan} treatmentPlan - Treatment plan object with version and link properties
 * @returns {{success: boolean, reason?: string, window?: Window}} Result object with success status
 */
function viewTreatmentPlan(treatmentPlan) {
  if (!treatmentPlan) {
    return { success: false, reason: 'no-data' }
  }

  const { version } = treatmentPlan

  if (version === 1) {
    const publicLink = getPublicLink(treatmentPlan)
    if (!publicLink) {
      return { success: false, reason: 'missing-link' }
    }
    const newWindow = window.open(publicLink, '_blank')
    if (!newWindow) {
      return { success: false, reason: 'popup-blocked' }
    }
    return { success: true, window: newWindow }
  }

  const hashKey = getPublicHashKey(treatmentPlan)
  if (!hashKey) {
    return { success: false, reason: 'missing-hash-key' }
  }

  const newWindow = window.open(`/tp/${hashKey}`, '_blank')
  if (!newWindow) {
    return { success: false, reason: 'popup-blocked' }
  }
  return { success: true, window: newWindow }
}

/**
 * Composable for treatment plan link operations
 * @returns {Object} Treatment plan link utilities
 * @returns {Function} return.getPublicHashKey - Extracts public hash key from treatment plan
 * @returns {Function} return.getPublicLink - Extracts public link from treatment plan (v1 only)
 * @returns {Function} return.viewTreatmentPlan - Opens treatment plan in new tab
 */
export function useTpLink() {
  return {
    getPublicHashKey,
    getPublicLink,
    viewTreatmentPlan,
  }
}
