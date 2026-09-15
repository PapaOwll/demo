import { ref, computed, watch } from 'vue'
import { buildDynamicCategories } from '../utils/build-dynamic-categories'
import { ACCESS_LEVELS } from '../constants/permission-categories'

/**
 * Generate feature ID matching the format used in build-dynamic-categories
 */
function generateFeatureId(moduleKey, permissionKey, subModuleKey = null) {
  if (subModuleKey) {
    return `${moduleKey}-${subModuleKey}-${permissionKey}`
  }
  return `${moduleKey}-${permissionKey}`
}

/**
 * Validate permissions structure
 */
function validatePermissions(updatedModules) {
  if (!updatedModules || !Array.isArray(updatedModules)) {
    return {
      isValid: false,
      errors: ['Updated modules is not a valid array'],
    }
  }

  const errors = []

  updatedModules.forEach((module, index) => {
    if (!module.key) {
      errors.push(`Module at index ${index} is missing 'key' property`)
    }

    if (!module.permissions || typeof module.permissions !== 'object') {
      errors.push(`Module ${module.key} has invalid permissions structure`)
    }

    if (module.subModules && Array.isArray(module.subModules)) {
      module.subModules.forEach((subModule, subIndex) => {
        if (!subModule.key) {
          errors.push(
            `SubModule at index ${subIndex} in module ${module.key} is missing 'key' property`
          )
        }

        if (!subModule.permissions || typeof subModule.permissions !== 'object') {
          errors.push(
            `SubModule ${subModule.key} in module ${module.key} has invalid permissions structure`
          )
        }
      })
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function usePermissionGuide(currentModules, aclStructure) {
  const dynamicCategories = computed(() => {
    if (!aclStructure.value) {
      return []
    }
    return buildDynamicCategories(aclStructure.value)
  })

  const selectedCategoryId = ref(dynamicCategories.value[0]?.id || null)
  const selectedFeatureIds = ref(new Set())

  watch(
    dynamicCategories,
    (newCategories) => {
      if (newCategories.length > 0 && !selectedCategoryId.value) {
        selectedCategoryId.value = newCategories[0].id
      }
    },
    { immediate: true }
  )

  const categories = computed(() => {
    return dynamicCategories.value
  })

  const allFeatures = computed(() => {
    const features = []
    categories.value.forEach((category) => {
      features.push(...category.features)
    })
    return features
  })

  const selectedCount = computed(() => {
    return selectedFeatureIds.value.size
  })

  const setSelectedCategory = (categoryId) => {
    selectedCategoryId.value = categoryId
  }

  const toggleFeature = (featureId) => {
    const newSet = new Set(selectedFeatureIds.value)

    if (newSet.has(featureId)) {
      newSet.delete(featureId)
    } else {
      newSet.add(featureId)
    }

    selectedFeatureIds.value = newSet
  }

  const getRequiredPermissions = (featureId) => {
    const feature = allFeatures.value.find((f) => f.id === featureId)
    if (!feature) return []

    return feature.permissions
  }

  const getAllSelectedPermissions = () => {
    const permissionsMap = new Map()

    selectedFeatureIds.value.forEach((featureId) => {
      const permissions = getRequiredPermissions(featureId)

      permissions.forEach((perm) => {
        const key = `${perm.module}:${perm.action}:${perm.inSubModule ? perm.subModuleName : ''}`

        if (!permissionsMap.has(key)) {
          permissionsMap.set(key, {
            module: perm.module,
            action: perm.action,
            inSubModule: perm.inSubModule,
            subModuleName: perm.subModuleName,
            level: ACCESS_LEVELS.ALL,
          })
        }
      })
    })

    return [...permissionsMap.values()]
  }

  const applyPermissions = () => {
    const selectedPermissions = getAllSelectedPermissions()

    if (!currentModules.value || !Array.isArray(currentModules.value)) {
      console.warn('currentModules is not available')
      return []
    }

    const updatedModules = structuredClone(currentModules.value)

    const errors = []
    const warnings = []

    selectedPermissions.forEach((perm) => {
      if (perm.inSubModule) {
        // Find parent module
        const parentModule = updatedModules.find((m) => m.key === perm.module)

        if (!parentModule) {
          errors.push(`Parent module ${perm.module} not found`)
          return
        }

        // Find child module (subModule) by key and parent_id
        const childModule = updatedModules.find(
          (m) => m.key === perm.subModuleName && m.parent_id === parentModule.id
        )

        if (!childModule) {
          warnings.push(
            `SubModule ${perm.subModuleName} not found in module ${perm.module}, skipping...`
          )
          return
        }

        // Set permission on child module
        if (!childModule.permissions) {
          childModule.permissions = {}
        }

        const existingLevel = childModule.permissions[perm.action]
        childModule.permissions[perm.action] = existingLevel || perm.level

        // Ensure parent has access
        parentModule.has_access = true
      } else {
        // Module-level permission
        const moduleIndex = updatedModules.findIndex((m) => m.key === perm.module)

        if (moduleIndex === -1) {
          errors.push(`Module ${perm.module} not found`)
          return
        }

        const module = updatedModules[moduleIndex]
        module.has_access = true

        if (!module.permissions) {
          module.permissions = {}
        }

        const existingLevel = module.permissions[perm.action]
        module.permissions[perm.action] = existingLevel || perm.level
      }
    })

    if (errors.length > 0) {
      console.error('Permission application errors:', errors)
    }
    if (warnings.length > 0) {
      console.warn('Permission application warnings:', warnings)
    }

    return updatedModules
  }

  const resetSelection = () => {
    selectedFeatureIds.value = new Set()
  }

  /**
   * Pre-select existing permissions from current role
   * Finds features that match existing permissions and selects them
   */
  const preSelectExistingPermissions = () => {
    if (!currentModules.value || !Array.isArray(currentModules.value)) {
      return
    }

    const newSelectedIds = new Set()

    currentModules.value.forEach((module) => {
      // Check if this is a subModule (has parent_id)
      const isSubModule = module.parent_id !== null && module.parent_id !== undefined

      if (isSubModule) {
        // This is a subModule - find its parent
        const parentModule = currentModules.value.find((m) => m.id === module.parent_id)

        if (parentModule && module.permissions) {
          // Check subModule permissions
          Object.entries(module.permissions).forEach(([action, level]) => {
            if (level != null) {
              // Generate feature ID: parentKey-subModuleKey-action
              const featureId = generateFeatureId(parentModule.key, action, module.key)
              const matchingFeature = allFeatures.value.find((f) => f.id === featureId)
              if (matchingFeature) {
                newSelectedIds.add(featureId)
              }
            }
          })
        }
        return
      }

      // This is a parent module
      if (module.permissions) {
        Object.entries(module.permissions).forEach(([action, level]) => {
          if (level != null) {
            // Generate feature ID: moduleKey-action
            const featureId = generateFeatureId(module.key, action, null)
            const matchingFeature = allFeatures.value.find((f) => f.id === featureId)
            if (matchingFeature) {
              newSelectedIds.add(featureId)
            }
          }
        })
      }
    })

    selectedFeatureIds.value = newSelectedIds
  }

  return {
    selectedCategoryId,
    selectedFeatureIds,

    categories,
    allFeatures,
    selectedCount,

    setSelectedCategory,
    toggleFeature,
    getRequiredPermissions,
    getAllSelectedPermissions,
    applyPermissions,
    resetSelection,
    validatePermissions,
    preSelectExistingPermissions,
    generateFeatureId,
  }
}
