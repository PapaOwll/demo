/* eslint-disable no-restricted-syntax */

const createFilterObject = (data = {}) => {
  if (!data || typeof data !== 'object') {
    return {}
  }

  const keys = Object.keys(data)
  const filters = {}

  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) {
      if (Array.isArray(data[key])) {
        if (data[key].length > 0) {
          const validValues = data[key].filter(
            (val) => val !== null && val !== undefined && val !== ''
          )
          if (validValues.length > 0) {
            filters[`filter[${key}]`] = validValues.join(',')
          }
        }
      } else if (typeof data[key] === 'object') {
        // Handle date range objects (from PersianDateRange component)
        if (data[key].from !== undefined || data[key].to !== undefined) {
          if (data[key].from) {
            filters[`filter[${key}_from]`] = `${data[key].from} 00:00:00`
          }
          if (data[key].to) {
            filters[`filter[${key}_to]`] = `${data[key].to} 23:59:59`
          }
        } else if (data[key].en) {
          filters[`filter[${key}]`] = data[key].en
        } else {
          for (const langKey of Object.keys(data[key])) {
            const filterKey = `filter[${key}.${langKey}]`
            filters[filterKey] = data[key][langKey]

            if (`${key}.${langKey}` === 'user.mobile') {
              const phoneNumber = data[key][langKey]
              const noZeroPhoneNumber = phoneNumber
                ? String(phoneNumber).replace(/^(0|98|\+98)/, '')
                : ''
              filters[filterKey] = noZeroPhoneNumber
            }

            if (!data[key][langKey] || data[key][langKey] === '') {
              delete filters[filterKey]
            }
          }
        }
      } else if (key === 'mobile' || key === 'user_mobile' || key === 'user.mobile') {
        const phoneNumber = data[key]
        const noZeroPhoneNumber = phoneNumber?.replace(/^(0|98|\+98)/, '')
        const filterKey = `filter[${key}]`
        filters[filterKey] = noZeroPhoneNumber
      } else if (key === 'sort') {
        delete filters[key]
        filters[key] = data[key]
      } else {
        const filterKey = `filter[${key}]`
        filters[filterKey] = data[key]
        if ((!data[key] || data[key] === '') && data[key] !== 0) {
          delete filters[filterKey]
        }
      }
    } else {
      delete filters[`filter[${key}]`]
    }
  }

  Object.keys(filters).forEach((key) => {
    if ((!filters[key] || filters[key] === '') && filters[key] !== 0) {
      delete filters[key]
    }
  })

  return filters
}
export default createFilterObject
