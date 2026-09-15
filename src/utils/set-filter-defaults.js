import { camelize } from '@/utils/convert-to-camel-snake'
import { convertToJalali, formatDate } from '@/utils/date-utils'

export const setFilterDefaults = (defaults = {}, currentFilters = {}, filterItems = []) => {
  if (!defaults || Object.keys(defaults).length === 0) {
    return currentFilters
  }

  const camelizedDefaults = camelize(defaults)
  const updatedFilters = { ...currentFilters }

  Object.entries(camelizedDefaults).forEach(([key, value]) => {
    if (
      updatedFilters[key] === undefined ||
      updatedFilters[key] === null ||
      updatedFilters[key] === ''
    ) {
      const filterItem = filterItems.find((item) => item.name === key)

      if (filterItem) {
        switch (filterItem.type) {
          case 'date': {
            if (typeof value === 'string' && /\d{4}-\d{2}-\d{2}/.test(value)) {
              updatedFilters[key] = {
                fa: convertToJalali(value, 'jYYYY/jMM/jDD'),
                en: formatDate(new Date(value), 'YYYY-MM-DD HH:mm:ss'),
              }
            } else if (typeof value === 'object' && value.en) {
              updatedFilters[key] = value
            } else {
              updatedFilters[key] = value
            }
            break
          }

          case 'select': {
            updatedFilters[key] = filterItem.multiple && !Array.isArray(value) ? [value] : value
            break
          }
          case 'component': {
            const toMaybeNumber = (v) => {
              if (typeof v === 'string' && /^\d+$/.test(v)) {
                return Number(v)
              }
              return v
            }
            if (filterItem.multiple) {
              const arr = Array.isArray(value) ? value : [value]
              updatedFilters[key] = arr
                .filter((v) => v !== null && v !== undefined && v !== '')
                .map((element) => toMaybeNumber(element))
            } else {
              updatedFilters[key] =
                value === '' || value === null || value === undefined ? null : toMaybeNumber(value)
            }
            break
          }

          case 'checkbox': {
            updatedFilters[key] = Boolean(value)
            break
          }

          default: {
            updatedFilters[key] = value
            break
          }
        }
      } else {
        updatedFilters[key] = value
      }
    }
  })

  return updatedFilters
}
export const parseRouteQueryToFilters = (query = {}, filterItems = []) => {
  if (!query || Object.keys(query).length === 0) {
    return {}
  }

  const parsed = {}
  Object.entries(query).forEach(([key, value]) => {
    const cleanKey = key.replace(/^filter\[(.*)]$/, '$1')

    const filterItem = filterItems.find((item) => item.name === cleanKey)

    if (filterItem) {
      switch (filterItem.type) {
        case 'date': {
          parsed[cleanKey] =
            typeof value === 'string' && /\d{4}-\d{2}-\d{2}/.test(value)
              ? {
                  fa: convertToJalali(value, 'jYYYY/jMM/jDD'),
                  en: formatDate(new Date(value), 'YYYY-MM-DD HH:mm:ss'),
                }
              : value
          break
        }

        case 'select': {
          if (filterItem.multiple) {
            const values =
              typeof value === 'string'
                ? value.split(',').map((v) => v.trim())
                : Array.isArray(value)
                  ? value
                  : [value]
            parsed[cleanKey] = values
              .filter((v) => v !== null && v !== undefined && v !== '')
              .map((val) => {
                const option = filterItem.options?.find((opt) => String(opt.value) === String(val))
                return option ? option.value : val
              })
          } else {
            const option = filterItem.options?.find((opt) => String(opt.value) === String(value))
            parsed[cleanKey] = option ? option.value : value
          }
          break
        }

        case 'component': {
          if (filterItem.multiple) {
            const values =
              typeof value === 'string'
                ? value.split(',').map((v) => v.trim())
                : Array.isArray(value)
                  ? value
                  : [value]
            parsed[cleanKey] = values
              .filter((v) => v !== null && v !== undefined && v !== '')
              .map((v) => (/^\d+$/.test(String(v)) ? Number(v) : v))
          } else {
            parsed[cleanKey] = /^\d+$/.test(String(value)) ? Number(value) : value
          }
          break
        }

        case 'checkbox': {
          parsed[cleanKey] = value === 'true' || value === '1' || value === 1
          break
        }

        default: {
          parsed[cleanKey] = value
          break
        }
      }
    } else {
      parsed[cleanKey] = value
    }
  })
  return camelize(parsed)
}

export default setFilterDefaults
