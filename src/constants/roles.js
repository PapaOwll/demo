/**
 * Centralized Role Constants
 *
 * Prevents typos and provides autocomplete support when working with role names.
 * Replaces hardcoded strings like 'admin' with ROLES.ADMIN
 *
 * @example
 * import { ROLES, isAdminRole } from '@/constants/roles'
 *
 * // Instead of: hasRole('admin')
 * hasRole(ROLES.ADMIN)
 *
 * // Check role groups
 * if (isAdminRole(userRole)) { ... }
 */

// ==================== ROLE CONSTANTS ====================

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  DOCTOR: 'doctor',
  ADVISOR: 'advisor',
  DIAGNOSTICIAN: 'diagnostician',
  PRESENTER: 'presenter',
  FINANCIAL: 'financial',
  ONLINE_VISIT: 'onlineVisit',
  VALIDATOR: 'validator',
  RECEPTION: 'reception',
  ACCOUNTING: 'accounting',
  ANONYMOUS: 'anonymous',
  PATIENT: 'patient',
}

// ==================== ROLE GROUPS ====================

/**
 * Roles with administrative access
 * Can manage system settings, users, and perform sensitive operations
 */
export const ADMIN_ROLES = Object.freeze([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEVELOPER])

/**
 * Roles with financial access
 * Can view/edit pricing, payments, and financial records
 */
export const FINANCIAL_ROLES = Object.freeze([
  ...ADMIN_ROLES,
  ROLES.PRESENTER,
  ROLES.FINANCIAL,
  ROLES.ONLINE_VISIT,
  ROLES.VALIDATOR,
])

/**
 * Roles that can create treatment plans
 */
export const TP_CREATE_ROLES = Object.freeze([
  ...ADMIN_ROLES,
  ROLES.PRESENTER,
  ROLES.DIAGNOSTICIAN,
  ROLES.ONLINE_VISIT,
  ROLES.VALIDATOR,
])

/**
 * Roles that can perform treatment plans
 * Add treatments/perform operations
 */
export const TP_PERFORM_ROLES = Object.freeze([ROLES.DOCTOR])

/**
 * Roles that can activate treatment plans
 */
export const TP_ACTIVE_ROLES = Object.freeze([...ADMIN_ROLES, ROLES.ADVISOR, ROLES.PRESENTER])

/**
 * Roles that can close treatment plans
 */
export const TP_CLOSE_ROLES = Object.freeze([...ADMIN_ROLES, ROLES.DOCTOR])

/**
 * Clinical roles (medical staff)
 * Can access patient records and treatment plans
 */
export const CLINICAL_ROLES = Object.freeze([
  ROLES.DOCTOR,
  ROLES.ADVISOR,
  ROLES.DIAGNOSTICIAN,
  ROLES.PRESENTER,
])

// ==================== ROLE LABELS (Persian) ====================

/**
 * Persian display labels for roles
 */
export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'مدیر کل',
  [ROLES.ADMIN]: 'ادمین',
  [ROLES.DEVELOPER]: 'توسعه‌دهنده',
  [ROLES.DOCTOR]: 'پزشک',
  [ROLES.ADVISOR]: 'مشاور',
  [ROLES.DIAGNOSTICIAN]: 'پزشک تشخیص',
  [ROLES.PRESENTER]: 'اتاق مشاوره',
  [ROLES.FINANCIAL]: 'مالی',
  [ROLES.ONLINE_VISIT]: 'ویزیت آنلاین',
  [ROLES.VALIDATOR]: 'اعتبارسنجی',
  [ROLES.RECEPTION]: 'پذیرش',
  [ROLES.ACCOUNTING]: 'حسابداری',
  [ROLES.ANONYMOUS]: 'ناشناس',
  [ROLES.PATIENT]: 'بیمار',
}

// ==================== ROLE ICONS ====================

/**
 * Icon names for roles (from @tabler/icons-vue)
 */
export const ROLE_ICONS = {
  [ROLES.SUPER_ADMIN]: 'IconShield',
  [ROLES.ADMIN]: 'IconUserCog',
  [ROLES.DEVELOPER]: 'IconCode',
  [ROLES.DOCTOR]: 'IconStethoscope',
  [ROLES.ADVISOR]: 'IconUserStar',
  [ROLES.DIAGNOSTICIAN]: 'IconBrain',
  [ROLES.PRESENTER]: 'IconPresentation',
  [ROLES.FINANCIAL]: 'IconCoin',
  [ROLES.ONLINE_VISIT]: 'IconVideo',
  [ROLES.VALIDATOR]: 'IconChecklist',
  [ROLES.RECEPTION]: 'IconPhoneCall',
  [ROLES.ACCOUNTING]: 'IconCalculator',
  [ROLES.ANONYMOUS]: 'IconUserOff',
  [ROLES.PATIENT]: 'IconUser',
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get Persian label for a role
 * @param {string} roleKey - Role key from ROLES constant
 * @returns {string} Persian label
 */
export function getRoleLabel(roleKey) {
  return ROLE_LABELS[roleKey] || roleKey
}

/**
 * Get icon name for a role
 * @param {string} roleKey - Role key from ROLES constant
 * @returns {string} Icon name
 */
export function getRoleIcon(roleKey) {
  return ROLE_ICONS[roleKey] || 'IconUser'
}

/**
 * Check if role is in a specific group
 * @param {string} roleKey - Role key from ROLES constant
 * @param {string[]} group - Array of role keys to check against
 * @returns {boolean}
 */
export function isRoleInGroup(roleKey, group) {
  return group.includes(roleKey)
}

/**
 * Check if role has admin privileges
 * @param {string} roleKey - Role key from ROLES constant
 * @returns {boolean}
 */
export function isAdminRole(roleKey) {
  return ADMIN_ROLES.includes(roleKey)
}

/**
 * Check if role has clinical access
 * @param {string} roleKey - Role key from ROLES constant
 * @returns {boolean}
 */
export function isClinicalRole(roleKey) {
  return CLINICAL_ROLES.includes(roleKey)
}

/**
 * Check if role has financial access
 * @param {string} roleKey - Role key from ROLES constant
 * @returns {boolean}
 */
export function isFinancialRole(roleKey) {
  return FINANCIAL_ROLES.includes(roleKey)
}

/**
 * Get all available role keys
 * @returns {string[]} Array of all role keys
 */
export function getAllRoleKeys() {
  return Object.values(ROLES)
}

/**
 * Get all available role labels
 * @returns {Object} Object mapping role keys to labels
 */
export function getAllRoleLabels() {
  return { ...ROLE_LABELS }
}

// ==================== VALIDATION ====================

/**
 * Validate if a string is a valid role key
 * @param {string} roleKey - Role key to validate
 * @returns {boolean}
 */
export function isValidRole(roleKey) {
  return Object.values(ROLES).includes(roleKey)
}

/**
 * Assert that a role key is valid
 * @param {string} roleKey - Role key to validate
 * @throws {Error} If role key is invalid
 */
export function assertValidRole(roleKey) {
  if (!isValidRole(roleKey)) {
    throw new Error(
      `Invalid role key: "${roleKey}". Must be one of: ${getAllRoleKeys().join(', ')}`
    )
  }
}
