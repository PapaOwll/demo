export function findStatusObject(statusId, obj) {
  if (!obj) return null
  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj) {
    if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      if (obj[key]?.id === statusId) {
        return obj[key]
      }
      const result = findStatusObject(statusId, obj[key])
      if (result !== null) {
        return result
      }
    }
  }
  return null
}
