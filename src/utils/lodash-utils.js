/**
 * Native JavaScript alternatives to Lodash functions
 * This file replaces lodash to reduce bundle size (~70KB savings)
 */

/**
 * Deep clone an object or array
 * Uses structuredClone when available (modern browsers), falls back to JSON method
 * @param {*} obj - The object to clone
 * @returns {*} - The cloned object
 */
export function cloneDeep(obj) {
  if (obj === null || obj === undefined) return obj

  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(obj)
    } catch {
      /* empty */
    }
  }

  // eslint-disable-next-line unicorn/prefer-structured-clone
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Create a debounced function that delays invoking func until after wait milliseconds
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Invoke on the leading edge
 * @param {boolean} options.trailing - Invoke on the trailing edge (default: true)
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait = 0, options = {}) {
  let timeoutId = null
  let lastArgs = null
  let lastThis = null
  let result = null
  let lastCallTime = null
  let lastInvokeTime = 0

  const leading = options.leading ?? false
  const trailing = options.trailing ?? true
  const maxWait = options.maxWait ?? null

  function invokeFunc(time) {
    const args = lastArgs
    const thisArg = lastThis

    lastArgs = null
    lastThis = null
    lastInvokeTime = time
    result = func.apply(thisArg, args)
    return result
  }

  function startTimer(pendingFunc, waitTime) {
    timeoutId = setTimeout(pendingFunc, waitTime)
  }

  function cancelTimer() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = wait - timeSinceLastCall

    return maxWait === null ? timeWaiting : Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime

    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== null && timeSinceLastInvoke >= maxWait)
    )
  }

  function trailingEdge(time) {
    timeoutId = null

    if (trailing && lastArgs) {
      return invokeFunc(time)
    }
    lastArgs = null
    lastThis = null
    return result
  }

  function timerExpired() {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    return startTimer(timerExpired, remainingWait(time))
  }

  function leadingEdge(time) {
    lastInvokeTime = time
    startTimer(timerExpired, wait)
    return leading ? invokeFunc(time) : result
  }

  function debounced(...args) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    // eslint-disable-next-line no-invalid-this,unicorn/no-this-assignment
    lastThis = this
    lastCallTime = time

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(lastCallTime)
      }
      if (maxWait !== null) {
        startTimer(timerExpired, wait)
        return invokeFunc(lastCallTime)
      }
    }
    if (timeoutId === null) {
      startTimer(timerExpired, wait)
    }
    return result
  }

  debounced.cancel = function cancel() {
    cancelTimer()
    lastInvokeTime = 0
    lastArgs = null
    lastCallTime = null
    lastThis = null
  }

  debounced.flush = function flush() {
    if (timeoutId === null) {
      return result
    }
    return trailingEdge(Date.now())
  }

  return debounced
}

/**
 * Creates an object composed of the object properties predicate returns truthy for
 * @param {Object} obj - The source object
 * @param {Function} predicate - The function invoked per property
 * @returns {Object} - The new object
 */
export function pickBy(obj, predicate = Boolean) {
  if (obj === null || obj === undefined) return {}

  const result = {}
  const entries = Object.entries(obj)
  entries.forEach(([key, value]) => {
    if (predicate(value, key)) {
      result[key] = value
    }
  })
  return result
}

/**
 * Returns the value unchanged (identity function)
 * @param {*} value - The value to return
 * @returns {*} - The same value
 */
export function identity(value) {
  return value
}

/**
 * Converts string to camelCase
 * Handles ALL_UPPERCASE, SCREAMING_SNAKE_CASE, snake_case, kebab-case, and PascalCase
 * @param {string} str - The string to convert
 * @returns {string} - The camelCase string
 */
export function camelCase(str) {
  if (!str) return ''

  let string = str.toString()

  // Handle ALL_UPPERCASE strings (with or without separators)
  // e.g., 'ID' -> 'id', 'SERVE_TITLE' -> 'serve_title' (then process normally)
  if (string === string.toUpperCase()) {
    string = string.toLowerCase()
  }

  return string
    .replace(/[\s_-]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toLowerCase())
}

/**
 * Converts string to snake_case
 * @param {string} str - The string to convert
 * @returns {string} - The snake_case string
 */
export function snakeCase(str) {
  if (!str) return ''

  return str
    .toString()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

/**
 * Creates an array of numbers from start up to, but not including, end
 * @param {number} startOrEnd - The start value or end value if only one arg
 * @param {number} end - The end value (exclusive)
 * @param {number} step - The value to increment or decrement by
 * @returns {number[]} - The range array
 */
export function range(startOrEnd, end, step = 1) {
  let start = 0
  let finalEnd = startOrEnd

  if (end !== undefined) {
    start = startOrEnd
    finalEnd = end
  }

  if (step === 0) return []

  const length = Math.max(Math.ceil((finalEnd - start) / (step || 1)), 0)
  const result = Array.from({ length })

  for (let i = 0; i < length; i += 1) {
    result[i] = start + i * step
  }

  return result
}

/**
 * Check if value is a non-empty array
 * @param {*} value - The value to check
 * @returns {boolean} - True if value is a non-empty array
 */
export function isArray(value) {
  return Array.isArray(value) && value.length > 0
}

/**
 * Check if value is a plain object (not array, not null, not Date, etc.)
 * @param {*} value - The value to check
 * @returns {boolean} - True if value is a plain object
 */
export function isLiteralObject(value) {
  return value !== null && typeof value === 'object' && value.constructor === Object
}

/**
 * Transform object keys/values with accumulator
 * Similar to Lodash's transform - iterates over object/array and transforms it
 * @param {Object|Array} obj - The object to iterate over
 * @param {Function} iteratee - The function invoked per iteration (acc, value, key, obj)
 * @param {*} accumulator - The custom accumulator value
 * @returns {*} - The accumulated value
 */
export function transform(obj, iteratee, accumulator) {
  if (obj === null || obj === undefined) return accumulator ?? {}

  const isArr = Array.isArray(obj)
  const acc = accumulator === undefined ? (isArr ? [] : {}) : accumulator

  if (isArr) {
    for (let i = 0; i < obj.length; i += 1) {
      const result = iteratee(acc, obj[i], i, obj)
      if (result === false) break
    }
  } else {
    const keys = Object.keys(obj)
    // eslint-disable-next-line no-restricted-syntax
    for (const key of keys) {
      const result = iteratee(acc, obj[key], key, obj)
      if (result === false) break
    }
  }

  return acc
}

/**
 * Check if value is an object (not null)
 * @param {*} value - The value to check
 * @returns {boolean} - True if value is an object
 */
export function isObject(value) {
  return value !== null && typeof value === 'object'
}

export default {
  cloneDeep,
  debounce,
  pickBy,
  identity,
  camelCase,
  snakeCase,
  range,
  isArray,
  isObject,
  isLiteralObject,
  transform,
}
