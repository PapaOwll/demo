/**
 * Build Dynamic Permission Guide Categories from API Response
 *
 * Transforms the ACL structure API response into the format expected by PermissionGuideModal.
 * This ensures titles, descriptions, and permissions are always in sync with the backend.
 *
 * @param {Object} aclStructure - Response from /api/acl/structure
 * @returns {Array} Categories array for PermissionGuideModal
 */

import { COMPLEXITY_LEVELS } from '../constants/permission-categories'

// Helper to get complexity based on number of permissions
const getComplexity = (permissionCount) => {
  if (permissionCount === 1) return COMPLEXITY_LEVELS.SIMPLE
  if (permissionCount <= 3) return COMPLEXITY_LEVELS.MEDIUM
  return COMPLEXITY_LEVELS.COMPLEX
}

// Helper to generate a feature ID
const generateFeatureId = (moduleKey, permissionKey, subModuleKey = null) => {
  if (subModuleKey) {
    return `${moduleKey}-${subModuleKey}-${permissionKey}`
  }
  return `${moduleKey}-${permissionKey}`
}

// Helper to create a description for a feature
const createDescription = (moduleTitle, permissionTitle, subModuleTitle = null) => {
  if (subModuleTitle) {
    return `دسترسی ${permissionTitle} به ${subModuleTitle} در بخش ${moduleTitle}`
  }
  return `دسترسی ${permissionTitle} به ${moduleTitle}`
}

// Helper to create a warning for sensitive permissions
const createWarning = (permissionKey, moduleKey, subModuleKey) => {
  const sensitivePermissions = {
    delete: '⚠️ این دسترسی اجازه حذف داده‌ها را می‌دهد.',
    recreate: '⚠️ این دسترسی اجازه رونوشت از داده‌ها را می‌دهد.',
    financial: '⚠️ این دسترسی اجازه دسترسی به اطلاعات مالی را می‌دهد.',
    update: moduleKey === 'setting' ? '⚠️ این دسترسی اجازه تغییر تنظیمات سیستم را می‌دهد.' : null,
  }

  // Special warnings for specific combinations
  if (moduleKey === 'user' && permissionKey === 'view') {
    return '⚠️ این دسترسی اجازه مشاهده پروفایل کاربران را می‌دهد.'
  }

  if (moduleKey === 'user' && permissionKey === 'impersonate') {
    return '⚠️ این دسترسی اجازه جعل هویت کاربران را می‌دهد.'
  }

  if (subModuleKey === 'treatmentPlanFinancial') {
    return '⚠️ این دسترسی اجازه دسترسی به اطلاعات مالی طرح درمان را می‌دهد.'
  }

  return sensitivePermissions[permissionKey]
}

/**
 * Category patterns for auto-discovery
 * Uses regex patterns to match module keys to categories
 * Patterns are anchored to prevent false positives
 */
const CATEGORY_PATTERNS = {
  patients: {
    id: 'patients',
    title: 'مدیریت بیماران',
    description: 'دسترسی به اطلاعات و پروفایل بیماران',
    icon: 'people',
    patterns: [/^user(-|$)/i, /^patient(-|$)/i, /^vip(-|$)/i, /^customer(-|$)/i, /^owned(-|$)/i],
  },
  appointments: {
    id: 'appointments',
    title: 'نوبت‌دهی و تقویم',
    description: 'مدیریت نوبت‌ها، تقویم و انجام کارها',
    icon: 'calendar_today',
    patterns: [/^booking(-|$)/i, /^calendar(-|$)/i, /^visit(-|$)/i, /^appointment(-|$)/i],
  },
  treatment: {
    id: 'treatment',
    title: 'طرح درمان',
    description: 'مدیریت کامل طرح‌های درمان',
    icon: 'medical_services',
    patterns: [
      /^treatment-plan(-|$)/i,
      /^tp(-|$)/i,
      /^draft(-|$)/i,
      /^perform(-|$)/i,
      /^doctor-review(-|$)/i,
      /^treatment-plan-list(-|$)/i,
    ],
  },
  communication: {
    id: 'communication',
    title: 'ارتباط با بیماران',
    description: 'مدیریت تماس‌ها و وظایف',
    icon: 'phone',
    patterns: [/^contact(-|$)/i, /^task(-|$)/i, /^call(-|$)/i],
  },
  marketing: {
    id: 'marketing',
    title: 'مارکتینگ و تبلیغات',
    description: 'مدیریت کمپین‌ها، تخفیف‌ها و بازخوردها',
    icon: 'campaign',
    patterns: [
      /^ads(-|$)/i,
      /^campaign(-|$)/i,
      /^batch(-|$)/i,
      /^imports(-|$)/i,
      /^feedback(-|$)/i,
      /^coupon(-|$)/i,
    ],
  },
  surveys: {
    id: 'surveys',
    title: 'نظرسنجی',
    description: 'مدیریت نظرسنجی‌ها و نتایج',
    icon: 'poll',
    patterns: [/^survey(-|$)/i, /^survey-lists(-|$)/i, /^survey-results(-|$)/i],
  },
  reports: {
    id: 'reports',
    title: 'گزارشات',
    description: 'دسترسی به گزارشات و تحلیل‌ها',
    icon: 'analytics',
    patterns: [
      /^report(-|$)/i,
      /^adviser(-|$)/i,
      /^sale(-|$)/i,
      /^introduction(-|$)/i,
      /^entry(-|$)/i,
    ],
  },
  settings: {
    id: 'settings',
    title: 'تنظیمات',
    description: 'مدیریت تنظیمات سیستم',
    icon: 'settings',
    patterns: [
      /^setting(-|$)/i,
      /^general(-|$)/i,
      /^clinic(-|$)/i,
      /^personal(-|$)/i,
      /^schedule(-|$)/i,
      /^pricing(-|$)/i,
      /^operator(-|$)/i,
      /^role(-|$)/i,
      /^tv(-|$)/i,
    ],
  },
  other: {
    id: 'other',
    title: 'سایر',
    description: 'دسترسی‌های متفرقه',
    icon: 'more_horiz',
    patterns: [/^dashboard(-|$)/i, /^attendance(-|$)/i, /^announcement(-|$)/i],
  },
}

/**
 * Auto-categorize modules based on patterns
 */
function categorizeModules(modules) {
  const categorized = {}
  const uncategorized = []

  // Initialize categories
  Object.keys(CATEGORY_PATTERNS).forEach((catKey) => {
    categorized[catKey] = []
  })

  // Assign modules to categories
  modules.forEach((module) => {
    let matched = false

    // Try each category's patterns
    Object.entries(CATEGORY_PATTERNS).forEach(([catKey, config]) => {
      if (config.patterns.some((pattern) => pattern.test(module.key))) {
        categorized[catKey].push(module)
        matched = true
      }
    })

    // If no match, add to uncategorized
    if (!matched) {
      uncategorized.push(module)
    }
  })

  return { categorized, uncategorized }
}

/**
 * Validate ACL structure
 * @throws {Error} If structure is invalid
 */
function validateAclStructure(aclStructure) {
  const errors = []

  if (!aclStructure) {
    errors.push('ACL structure is null or undefined')
  }

  if (aclStructure && !Array.isArray(aclStructure.modules)) {
    errors.push('modules must be an array')
  }

  if (aclStructure && !Array.isArray(aclStructure.permissions)) {
    errors.push('permissions must be an array')
  }

  if (aclStructure?.modules?.some((m) => !m.key || !m.title)) {
    errors.push('Some modules are missing required fields (key, title)')
  }

  if (aclStructure?.permissions?.some((p) => !p.key || !p.title)) {
    errors.push('Some permissions are missing required fields (key, title)')
  }

  if (errors.length > 0) {
    console.error('Invalid ACL structure:', errors)
    throw new Error(`ACL structure validation failed: ${errors.join(', ')}`)
  }
}

/**
 * Build categories dynamically from ACL structure
 */
export function buildDynamicCategories(aclStructure) {
  // Validate input
  if (!aclStructure || !aclStructure.modules || !aclStructure.permissions) {
    console.warn('buildDynamicCategories: Invalid or empty ACL structure')
    return []
  }

  try {
    validateAclStructure(aclStructure)
  } catch (error) {
    console.error('ACL validation failed:', error.message)
    // Return empty array on validation failure instead of crashing
    return []
  }

  const { modules, permissions } = aclStructure

  // Auto-categorize modules using patterns
  const { categorized, uncategorized } = categorizeModules(modules)

  // Warn about uncategorized modules
  if (uncategorized.length > 0) {
    console.warn(
      `Found ${uncategorized.length} uncategorized modules: ${uncategorized.map((m) => m.key).join(', ')}. Adding to "other" category.`
    )
  }

  // Build categories from categorized modules
  const categories = Object.entries(CATEGORY_PATTERNS)
    .map(([, categoryConfig]) => {
      const categoryModules = categorized[categoryConfig.id] || []

      if (categoryModules.length === 0) {
        return null
      }

      // Create features for each module in this category
      const features = categoryModules.flatMap((module) => {
        const isSubModule = module.parent_id !== null
        const parentModule = isSubModule ? modules.find((m) => m.id === module.parent_id) : null

        // Create features for each permission
        return permissions.map((permission) => {
          const featureId = generateFeatureId(
            module.key,
            permission.key,
            isSubModule ? module.key : null
          )

          return {
            id: featureId,
            title: isSubModule
              ? `${module.title} - ${permission.title}`
              : `${module.title} - ${permission.title}`,
            description: createDescription(
              parentModule ? parentModule.title : module.title,
              permission.title,
              isSubModule ? module.title : null
            ),
            permissions: [
              {
                module: parentModule ? parentModule.key : module.key,
                action: permission.key,
                inSubModule: isSubModule,
                subModuleName: isSubModule ? module.key : undefined,
                level: 'all',
              },
            ],
            complexity: getComplexity(1),
            warning: createWarning(
              permission.key,
              parentModule ? parentModule.key : module.key,
              isSubModule ? module.key : null
            ),
            note: null,
          }
        })
      })

      return {
        id: categoryConfig.id,
        title: categoryConfig.title,
        description: categoryConfig.description,
        icon: categoryConfig.icon,
        features,
      }
    })
    .filter((category) => category != null)

  // Add uncategorized modules to "other" category
  const otherCategory = categories.find((cat) => cat.id === 'other')

  if (otherCategory && uncategorized.length > 0) {
    const uncategorizedFeatures = uncategorized.flatMap((module) => {
      const isSubModule = module.parent_id !== null
      const parentModule = isSubModule ? modules.find((m) => m.id === module.parent_id) : null

      return permissions.map((permission) => {
        const featureId = generateFeatureId(
          module.key,
          permission.key,
          isSubModule ? module.key : null
        )

        return {
          id: featureId,
          title: isSubModule
            ? `${module.title} - ${permission.title}`
            : `${module.title} - ${permission.title}`,
          description: createDescription(
            parentModule ? parentModule.title : module.title,
            permission.title,
            isSubModule ? module.title : null
          ),
          permissions: [
            {
              module: parentModule ? parentModule.key : module.key,
              action: permission.key,
              inSubModule: isSubModule,
              subModuleName: isSubModule ? module.key : undefined,
              level: 'all',
            },
          ],
          complexity: getComplexity(1),
          warning: createWarning(
            permission.key,
            parentModule ? parentModule.key : module.key,
            isSubModule ? module.key : null
          ),
          note: 'Uncategorized module',
        }
      })
    })

    otherCategory.features.push(...uncategorizedFeatures)
  }

  return categories
}

/**
 * Build a flat list of all features (without categories)
 * Useful for search or displaying all permissions
 */
export function buildFlatFeatureList(aclStructure) {
  const categories = buildDynamicCategories(aclStructure)
  return categories.flatMap((category) => category.features)
}

/**
 * Get feature by ID
 */
export function getFeatureById(aclStructure, featureId) {
  const features = buildFlatFeatureList(aclStructure)
  return features.find((f) => f.id === featureId)
}

/**
 * Search features by query
 */
export function searchFeatures(aclStructure, query) {
  const features = buildFlatFeatureList(aclStructure)
  const lowerQuery = query.toLowerCase()

  return features.filter(
    (feature) =>
      feature.title.toLowerCase().includes(lowerQuery) ||
      feature.description.toLowerCase().includes(lowerQuery) ||
      feature.permissions.some(
        (perm) =>
          perm.module.toLowerCase().includes(lowerQuery) ||
          perm.action.toLowerCase().includes(lowerQuery)
      )
  )
}
