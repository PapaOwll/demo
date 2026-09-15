import { CHART_TYPES } from '../constants/chart-types'
import { getRecommendedChartType } from '../constants/service-question-types'

/**
 * Resolves a service to its top-level parent (handles multi-level parentage).
 *
 * @param {number|string} serviceId - The service ID to resolve
 * @param {Ref<Array>} servicesList - The current list of services
 * @param {Ref<Array>} allServicesCache - The cache of all services
 * @param {Set<number|string>} [visited=new Set()] - Internal: tracks visited services to detect circular references
 * @returns {{ service: Object|null, serviceToSelect: number|string|null, error: string|null }}
 */
export function resolveServiceWithParent(
  serviceId,
  servicesList,
  allServicesCache,
  visited = new Set()
) {
  if (!serviceId) {
    return { service: null, serviceToSelect: null, error: 'No service ID provided' }
  }

  if (visited.has(serviceId)) {
    return { service: null, serviceToSelect: null, error: 'Circular service reference detected' }
  }
  visited.add(serviceId)

  let service =
    servicesList.value?.find((s) => s.id === serviceId) ||
    allServicesCache.value?.find((s) => s.id === serviceId)

  if (!service) {
    const hasChildren =
      servicesList.value?.some((s) => s.serveIndustryId === serviceId) ||
      allServicesCache.value?.some((s) => s.serveIndustryId === serviceId)
    if (hasChildren) {
      service =
        allServicesCache.value?.find((s) => s.id === serviceId) ||
        servicesList.value?.find((s) => s.serveIndustryId === serviceId)
    }
  }

  if (!service) {
    return { service: null, serviceToSelect: null, error: `Service not found: ${serviceId}` }
  }

  if (service.serveIndustryId) {
    const parentResult = resolveServiceWithParent(
      service.serveIndustryId,
      servicesList,
      allServicesCache,
      visited // Pass visited set to detect circular references
    )

    if (parentResult.service) {
      return {
        service: parentResult.service,
        serviceToSelect: parentResult.serviceToSelect,
        error: null,
      }
    }
  }

  return { service, serviceToSelect: service.id, error: null }
}

/**
 * Resolves chart type from edit data with validation.
 *
 * @param {Object} editData - The edit data object
 * @param {Object} service - The full service object
 * @returns {string} The resolved chart type
 */
export function resolveChartType(editData, service) {
  if (editData.chartType && Object.values(CHART_TYPES).includes(editData.chartType)) {
    return editData.chartType
  }

  const serviceType = getRecommendedChartType(service)

  if (editData.description?.includes('استخوان فک')) {
    return CHART_TYPES.JAW_BONE
  }

  return serviceType || CHART_TYPES.DENTAL
}
