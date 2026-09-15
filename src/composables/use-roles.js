import { computed, unref } from 'vue'
import { useGetAdvisorsQuery, useGetUserByRoleQuery } from '@/modules/User/query'

export default function useRoles(roles, options = {}) {
  const filterKey = 'filter[rolesFilter]'
  const enabledRef = computed(() => (options.enabled === undefined ? true : unref(options.enabled)))
  const { data: allRoles } = useGetUserByRoleQuery({ enabled: enabledRef })
  const filters = computed(() => {
    if (!enabledRef.value) return { [filterKey]: '', per_page: 300 }
    const selectedRoles = []
    const items = allRoles.value?.items || []
    items.forEach((role) => {
      roles.forEach((selectedRole) => {
        if (selectedRole === role?.title) {
          selectedRoles.push(role.id)
        }
      })
    })
    return { [filterKey]: selectedRoles.join(','), per_page: 300 }
  })
  const enabled = computed(() => !!filters.value[filterKey] && enabledRef.value)
  const { data: users } = useGetAdvisorsQuery(filters, { enabled })

  return {
    filters,
    allRoles,
    data: users,
  }
}
