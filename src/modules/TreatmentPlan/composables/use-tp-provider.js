import { inject } from 'vue'
import { TpStoreSymbol } from '../providers/TpProvider'

const EDIT_ONLY_KEYS = new Set([
  'serveData',
  'selectedCheque',
  'updateTeeth',
  'updateItems',
  'updateSelectedInstallment',
  'updateSelectedCheque',
  'updateTreatment',
  'removeService',
  'resetLocalState',
])

function warnIfEditOnly(key, mode) {
  if (import.meta.env.DEV && mode === 'preview' && EDIT_ONLY_KEYS.has(key)) {
    // eslint-disable-next-line no-console
    console.warn(`[useTpProvider] "${key}" is edit-only and is not exposed in preview mode.`)
  }
}

function warnIfUnknown(key, flat) {
  if (import.meta.env.DEV && !(key in flat)) {
    // eslint-disable-next-line no-console
    console.warn(`[useTpProvider] unknown key "${key}" — will return undefined`)
  }
}

/**
 * @param {string|string[]|undefined} select - key (or keys) to pick from the store
 */
export function useTpProvider(select) {
  const store = inject(TpStoreSymbol)

  if (!store) {
    throw new Error('useTpProvider() must be used within a <TpProvider>')
  }

  const flat = {
    ...store.state,
    ...store.actions,
    isPreview: store.mode === 'preview',
  }

  if (select == null) {
    if (import.meta.env.DEV && store.mode === 'preview') {
      return new Proxy(flat, {
        get(target, key) {
          if (typeof key === 'string') warnIfEditOnly(key, store.mode)
          return target[key]
        },
      })
    }
    return flat
  }

  if (typeof select === 'string') {
    warnIfUnknown(select, flat)
    warnIfEditOnly(select, store.mode)
    return flat[select]
  }

  if (Array.isArray(select)) {
    return select.reduce((acc, key) => {
      if (typeof key !== 'string') {
        throw new TypeError(
          `useTpProvider() array selector must contain strings, got: ${typeof key}`
        )
      }
      warnIfUnknown(key, flat)
      warnIfEditOnly(key, store.mode)
      acc[key] = flat[key]
      return acc
    }, {})
  }

  throw new Error(
    `useTpProvider() selector must be a string, array of strings, or undefined — got: ${typeof select}`
  )
}
