/**
 * Tiny localStorage-backed store for demo/mock data.
 * Data written by mock mutations survives reloads so the user
 * can see everything they saved.
 */

export const MOCK_STORAGE_PREFIX = 'crm-demo-mocks'

const PREFIX = MOCK_STORAGE_PREFIX

export const mockStorage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(`${PREFIX}:${key}`)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value))
    } catch {
      /* storage full/unavailable — ignore in demo */
    }
    return value
  },

  update(key, fallback, updater) {
    const current = this.get(key, fallback)
    const next = updater(current)
    this.set(key, next)
    return next
  },
}

/** Returns an ISO string for `days` ago at hh:mm */
export const daysAgo = (days, hours = 10, minutes = 30) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

/** Small artificial delay so loading states stay visible in the demo */
export const mockDelay = (ms = 400) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
