import { ref, computed } from 'vue'
import { useGetUsersByPhoneNumberQuery } from '@/modules/User'

export function useUserSearch() {
  const searchQuery = ref('')

  const userSearchEnabled = computed(() => !!searchQuery.value)
  const { data: users, isLoading: userLoading } = useGetUsersByPhoneNumberQuery(searchQuery, {
    enabled: userSearchEnabled,
  })

  const searchUsers = (query) => {
    searchQuery.value = query
  }

  return {
    users,
    userLoading,
    searchUsers,
  }
}
