import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/user'
import { useRolesStore } from '@/store/roles'

export function useRoleManager() {
  const { userData: currentUser } = storeToRefs(useUserStore())
  const { getRoleIdByTitle, roleEnums } = useRolesStore()

  const getRoleId = (role) => {
    if (typeof role === 'number') return role
    if (typeof role !== 'string') return null
    return getRoleIdByTitle(role) || roleEnums.value?.[role]
  }

  const hasRole = (role) => {
    if (!currentUser.value?.role?.id) return false
    const roleId = getRoleId(role)
    if (!roleId) return false
    return currentUser.value.role.id === roleId
  }

  const hasAnyRole = (roles) => {
    if (!currentUser.value?.role?.id) return false
    return roles.some((role) => hasRole(role))
  }

  return {
    hasRole,
    hasAnyRole,
  }
}
