// Mock system bootstrap.
// Seeds the auth token so the demo opens straight into the dashboard,
// and keeps a persisted mock DB in localStorage.
import { initDb } from './db'

const TOKEN_KEY = 'sitra-crm-access-token'
const SLUG_KEY = 'slug-name'

if (typeof window !== 'undefined') {
  initDb()

  if (!localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, 'mock-demo-token')
  }
  if (!localStorage.getItem(SLUG_KEY)) {
    localStorage.setItem(SLUG_KEY, JSON.stringify('clinic'))
  }
}

// Convenience for demos: window.resetMockDb() restores seed data.
if (typeof window !== 'undefined') {
  window.resetMockDb = () => {
    localStorage.removeItem('crm-mock-db')
    window.location.reload()
  }
}
