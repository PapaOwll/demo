const INDUSTRY_SLUG_KEY = 'sitra-crm-current-campaign'
const SLUG_NAME_KEY = 'slug-name'

const extractSlug = (data) => data?.industries?.[0]?.slug || 'clinic'

export const setIndustrySlug = (data) => {
  const slug = extractSlug(data)
  try {
    localStorage.setItem(INDUSTRY_SLUG_KEY, JSON.stringify(data))
    localStorage.setItem(SLUG_NAME_KEY, JSON.stringify(slug))
  } catch {
    // Silently fail
  }
  return slug
}

export const entityName = (() => {
  try {
    return JSON.parse(localStorage.getItem(SLUG_NAME_KEY))
  } catch {
    return null
  }
})()

export const getIndustrySlug = () => {
  if (entityName) return entityName

  try {
    const storedData = JSON.parse(localStorage.getItem(INDUSTRY_SLUG_KEY))
    const slug = extractSlug(storedData)
    localStorage.setItem(SLUG_NAME_KEY, JSON.stringify(slug))
    return slug
  } catch {
    return 'clinic'
  }
}

export default getIndustrySlug
