import { ref, computed, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { camelize } from '@/utils/convert-to-camel-snake'
import { camelCase, snakeCase } from '@/utils/lodash-utils'
import { parseRouteQueryToFilters } from '@/utils/set-filter-defaults'
import { normalizeMobile } from '@/utils/normalizeMobileNumber'
import { convertToGregorian } from '@/utils/date-utils'
import { convertToApiFormat } from '@/utils/convertToApiFormat'
import { convertToEnNumber } from '@/utils/convert-check-digits'

const mapToDateRange = (filterItem, filters) => {
  if (!filterItem?.fields || !Array.isArray(filterItem.fields)) return null

  const fromValue = filters[filterItem.fields[0]]
  const toValue = filters[filterItem.fields[1]]

  if (!fromValue && !toValue) return null

  return {
    from: fromValue ? String(fromValue).split(' ')[0] : null,
    to: toValue ? String(toValue).split(' ')[0] : null,
  }
}

export function useHandleFilters(routeQuery = {}, defaultFilters = {}, filterItems = []) {
  const route = useRoute()
  const parseRouteQuery = (query) => {
    const camelizedQueryKeys = camelize(query)
    return parseRouteQueryToFilters(camelizedQueryKeys, filterItems)
  }

  const mergeWithDefaults = (filters) => {
    return { ...defaultFilters, ...filters }
  }

  const initialFilters =
    routeQuery && Object.keys(routeQuery).length > 0
      ? mergeWithDefaults(parseRouteQuery(routeQuery))
      : defaultFilters

  const filtersState = ref(initialFilters)

  const initializeFormValues = (filters) => {
    const initialValues = {}
    filterItems.forEach((item) => {
      const dateRangeValue = mapToDateRange(item, filters)
      if (dateRangeValue !== null) {
        initialValues[item.name] = dateRangeValue
        return
      }

      const val = filters[item.name]
      if (item.multiple && (item.type === 'select' || item.type === 'component')) {
        initialValues[item.name] = Array.isArray(val)
          ? val
          : val !== null && val !== undefined && val !== ''
            ? [val]
            : []
      } else {
        initialValues[item.name] = item.type === 'checkbox' ? !!val : (val ?? null)
      }
    })
    return initialValues
  }
  const formValues = reactive(initializeFormValues(filtersState.value))
  const apiFilters = computed(() => {
    const filters = mergeWithDefaults(filtersState.value || {})
    const apiFormatted = convertToApiFormat(filters)
    return apiFormatted || {}
  })

  const setSort = (sortBy, descending) => {
    const current = { ...filtersState.value }
    if (sortBy) {
      const formattedKey = snakeCase(sortBy)
      const sortString = descending ? `-${formattedKey}` : `${formattedKey}`
      filtersState.value = { ...current, sort: sortString }
    } else {
      const { sort, ...rest } = current
      filtersState.value = { ...rest }
    }
  }

  const setDefaults = (defaults) => {
    if (!defaults || Object.keys(defaults).length === 0) return

    const camelizedDefaults = camelize(defaults)
    Object.entries(camelizedDefaults).forEach(([key, value]) => {
      if (formValues[key] === undefined || formValues[key] === null) {
        const filterItem = filterItems.find((item) => item.name === key)
        if (filterItem) {
          switch (filterItem.type) {
            case 'date': {
              formValues[key] =
                typeof value === 'string' && /\d{4}-\d{2}-\d{2}/.test(value)
                  ? convertToGregorian(value, 'YYYY-MM-DD HH:mm:ss')
                  : value
              break
            }
            case 'select':
            case 'component': {
              formValues[key] =
                filterItem.multiple && !Array.isArray(value) ? [filterItem] : filterItem
              break
            }
            case 'checkbox': {
              formValues[key] = Boolean(value)
              break
            }
            default: {
              formValues[key] = value
              break
            }
          }
        } else {
          formValues[key] = value
        }
      }
    })
  }

  const handleInput = (item, newValue) => {
    formValues[item.name] = newValue
    if (item.name === 'mobile' || item.name === 'user.mobile') {
      formValues[item.name] = normalizeMobile(formValues[item.name])
    }
    if (item.type === 'number') {
      formValues[item.name] = convertToEnNumber(formValues[item.name])
    }

    if (item.type === 'select' && item.options) {
      const value = formValues[item.name]
      if (Array.isArray(value)) {
        formValues[item.name] = value
          .filter((v) => v !== null && v !== undefined && v !== '')
          .map((val) => {
            const option = item.options.find((opt) => opt.value === val || opt.label === val)
            return option ? option.value : val
          })
      } else if (value !== null && value !== undefined && value !== '') {
        const option = item.options.find((opt) => opt.value === value || opt.label === value)
        if (option) {
          formValues[item.name] = option.value
        }
      }
    }

    if (item.type === 'component') {
      const value = formValues[item.name]
      if (Array.isArray(value)) {
        formValues[item.name] = value.filter((v) => v !== null && v !== undefined && v !== '')
      }
    }

    return formValues[item.name]
  }

  const updateFilter = (key, value) => {
    formValues[key] = value
  }

  const handleSuggestFilter = (item) => {
    if (!item || !item.filters || !Array.isArray(item.filters)) {
      return
    }

    const camelizedFilters = item.filters.map((filter) => {
      if (typeof filter === 'object' && filter !== null) {
        return {
          ...filter,
          key: typeof filter.key === 'string' ? camelCase(filter.key) : filter.key,
        }
      }
      return filter
    })

    if (camelizedFilters && camelizedFilters.length > 0) {
      camelizedFilters.forEach((filter) => {
        if (filter.key && filter.value !== undefined) {
          const filterItem = filterItems.find((i) => i.name === filter.key)

          if (filterItem) {
            let finalValue = filter.value

            if (filterItem.type === 'select' && filterItem.options) {
              const option = filterItem.options.find(
                (opt) => opt.value === filter.value || opt.label === filter.value
              )
              if (option) {
                finalValue = option.value
              }
            }
            updateFilter(filter.key, finalValue)
          } else {
            updateFilter(filter.key, filter.value)
          }
        }
      })
    }
  }
  const getFilter = (key) => {
    return filtersState.value[key]
  }

  const hasActiveFilters = computed(() => {
    return Object.values(formValues).some((value) => {
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'boolean') return value === true
      return value !== null && value !== undefined && value !== ''
    })
  })

  const applyFilters = (newFilters) => {
    const camelizedFilters = camelize(newFilters)

    // Handle components with fields mapping (e.g., PersianDateRange)
    const processedFilters = { ...camelizedFilters }
    Object.entries(camelizedFilters).forEach(([key, value]) => {
      const filterItem = filterItems.find((i) => i.name === key)

      // Check if this filter item has a fields mapping
      if (
        filterItem?.fields &&
        Array.isArray(filterItem.fields) &&
        value &&
        typeof value === 'object'
      ) {
        // Remove the original field
        delete processedFilters[key]

        // Map the from/to values to the specified fields
        const { from, to } = value
        const format = filterItem.format || filterItem.dateFormat

        if (from && filterItem.fields[0]) {
          processedFilters[filterItem.fields[0]] = format ? from : `${from} 00:00:00`
        }
        if (to && filterItem.fields[1]) {
          processedFilters[filterItem.fields[1]] = format ? to : `${to} 23:59:59`
        }
      }
    })

    filtersState.value = mergeWithDefaults(processedFilters)

    Object.keys(formValues).forEach((key) => {
      const filterItem = filterItems.find((i) => i.name === key)
      const isCheckbox = filterItems.some(
        (i) => (i.key === key || i.name === key) && i.type === 'checkbox'
      )

      const dateRangeValue = mapToDateRange(filterItem, filtersState.value)
      formValues[key] =
        dateRangeValue === null
          ? (filtersState.value[key] ?? (isCheckbox ? false : null))
          : dateRangeValue
    })

    return filtersState.value
  }

  const resetFilters = () => {
    filtersState.value = { ...defaultFilters }

    Object.keys(formValues).forEach((key) => {
      const filterItem = filterItems.find((i) => i.name === key)
      const isCheckbox = filterItems.some(
        (i) => (i.key === key || i.name === key) && i.type === 'checkbox'
      )

      const dateRangeValue = mapToDateRange(filterItem, filtersState.value)
      formValues[key] = dateRangeValue ?? filtersState.value[key] ?? (isCheckbox ? false : null)
    })

    return filtersState.value
  }
  watch(
    () => route?.query,
    (newQuery) => {
      if (newQuery && Object.keys(newQuery).length > 0) {
        const parsedQuery = parseRouteQuery(newQuery)
        filtersState.value = mergeWithDefaults(parsedQuery)

        Object.keys(formValues).forEach((key) => {
          const item = filterItems.find((it) => it.name === key)

          const dateRangeValue = mapToDateRange(item, filtersState.value)
          if (dateRangeValue !== null) {
            formValues[key] = dateRangeValue
            return
          }

          const val = filtersState.value[key]
          if (item && item.multiple && (item.type === 'select' || item.type === 'component')) {
            formValues[key] = Array.isArray(val)
              ? val
              : val !== null && val !== undefined && val !== ''
                ? [val]
                : []
          } else {
            formValues[key] = item && item.type === 'checkbox' ? !!val : (val ?? null)
          }
        })
      } else {
        filtersState.value = { ...defaultFilters }

        Object.keys(formValues).forEach((key) => {
          const item = filterItems.find((it) => it.name === key)
          const val = filtersState.value[key]

          const dateRangeValue = mapToDateRange(item, filtersState.value)
          if (dateRangeValue !== null) {
            formValues[key] = dateRangeValue
            return
          }

          formValues[key] =
            item && item.multiple && (item.type === 'select' || item.type === 'component')
              ? Array.isArray(val)
                ? val
                : []
              : item && item.type === 'checkbox'
                ? !!val
                : (val ?? null)
        })
      }
    },
    { immediate: true, deep: true }
  )

  return {
    filtersState,
    formValues,
    apiFilters,
    applyFilters,
    resetFilters,
    updateFilter,
    getFilter,
    setDefaults,
    handleInput,
    hasActiveFilters,
    handleSuggestFilter,
    setSort,
  }
}
