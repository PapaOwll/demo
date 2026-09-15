import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useGetUserByRoleQuery } from '@/modules/User/query'

export const useRolesStore = defineStore('roles', () => {
  const { data: rolesData, isLoading } = useGetUserByRoleQuery({
    staleTime: 1000 * 60 * 30, // 30 minutes
  })

  const roles = computed(() => rolesData.value?.items || [])

  const getRoleById = (id) => {
    return roles.value.find((role) => role.id === id)
  }

  const getRoleByTitle = (title) => {
    return roles.value.find((role) => role.title === title)
  }

  const getRoleIdByTitle = (title) => {
    let role = getRoleByTitle(title)

    // If not found, try converting camelCase to snake_case
    if (!role) {
      const snakeCaseTitle = title.replace(/([A-Z])/g, '_$1').toLowerCase()
      role = getRoleByTitle(snakeCaseTitle)
    }

    return role?.id || null
  }

  const roleEnums = computed(() => {
    const enums = {}
    roles.value.forEach((role) => {
      enums[role.title] = role.id
    })
    return enums
  })

  return {
    roles,
    roleEnums,
    isLoading,
    getRoleById,
    getRoleByTitle,
    getRoleIdByTitle,
  }
})
