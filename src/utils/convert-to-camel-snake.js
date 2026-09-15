import { isArray, isLiteralObject, camelCase, snakeCase } from '@/utils/lodash-utils'

/**
 * Recursively converts object keys to camelCase
 * Handles nested objects and arrays
 * @param {*} obj - The object/array to convert
 * @returns {*} - The converted object/array
 */
export function camelize(obj) {
  if (obj === null || obj === undefined) return obj
  if (isArray(obj)) {
    return obj.map((item) => camelize(item))
  }
  if (isLiteralObject(obj)) {
    const result = {}
    const keys = Object.keys(obj)

    // eslint-disable-next-line no-restricted-syntax
    for (const key of keys) {
      const value = obj[key]
      const shouldPreserveDots = typeof key === 'string' && key.includes('.')
      const newKey = shouldPreserveDots ? key : camelCase(key)
      result[newKey] = camelize(value)
    }

    return result
  }
  return obj
}

/**
 * Recursively converts object keys to snake_case
 * Handles nested objects and arrays
 * @param {*} obj - The object/array to convert
 * @returns {*} - The converted object/array
 */
export function snakize(obj) {
  if (obj === null || obj === undefined) return obj
  if (isArray(obj)) {
    return obj.map((item) => snakize(item))
  }
  if (isLiteralObject(obj)) {
    const result = {}
    const keys = Object.keys(obj)

    // eslint-disable-next-line no-restricted-syntax
    for (const key of keys) {
      const value = obj[key]
      const shouldPreserveDots = typeof key === 'string' && key.includes('.')
      const newKey = shouldPreserveDots ? key : snakeCase(key)
      result[newKey] = snakize(value)
    }

    return result
  }
  return obj
}
