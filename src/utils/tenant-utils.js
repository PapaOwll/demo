/**
 * Tenant utility functions
 * Determines environment-specific behavior based on the tenant
 */

/**
 * Check if the current tenant is orthopedic (serito)
 * @returns {boolean} true if the current origin includes 'serito'
 */
export const isOrthopedic = () => {
  return window.location.origin.includes('serito')
}

/**
 * Check if current environment is a specific tenant
 * Used for API routing and environment-specific configurations
 * @param {string} tenantIdentifier - The tenant identifier to check (e.g., 'serito', 'release')
 * @returns {boolean} true if the origin includes the tenant identifier
 */
export const isTenant = (tenantIdentifier) => {
  return window.location.origin.includes(tenantIdentifier)
}
