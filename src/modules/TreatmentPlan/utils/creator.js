/**
 * Builds a display name for a treatment-plan creator (backend sends
 * `firstName` + `name` as last name, optionally a ready-made `fullName`).
 *
 * @param {Object|null} createdBy - creator object from the treatment plan payload
 * @param {string} fallback - value returned when no name parts exist
 * @returns {string}
 */
export const getCreatorName = (createdBy, fallback = 'نامشخص') => {
  if (!createdBy) return fallback
  if (createdBy.fullName) return createdBy.fullName
  return `${createdBy.firstName || ''} ${createdBy.name || ''}`.trim() || fallback
}
