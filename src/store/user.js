import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { hasAccessToken, logoutImpersonateUser, setImpersonateAccessToken } from '@/utils/auth'
import { getIndustrySlug } from '@/utils/get-industry-slug'
import { useGetCurrentUser } from '@/modules/User/query'

const impersonateUser = (token) => {
  setImpersonateAccessToken(token)
  window.location.reload()
}
const exitImpersonatingUser = () => {
  logoutImpersonateUser()
  window.location.reload()
}

const getStoredLoginData = () => {
  try {
    const INDUSTRY_SLUG_KEY = 'sitra-crm-current-campaign'
    const storedData = localStorage.getItem(INDUSTRY_SLUG_KEY)
    return storedData ? JSON.parse(storedData) : null
  } catch {
    return null
  }
}

export const useUserStore = defineStore('user', () => {
  const isLoggedIn = ref(hasAccessToken())

  const resetLoginState = () => {
    isLoggedIn.value = hasAccessToken()
  }

  const industrySlug = computed(() => (isLoggedIn?.value ? getIndustrySlug() : false))

  const {
    data: userData,
    refetch: refetchCurrentUser,
    isLoading,
    isError,
    error,
  } = useGetCurrentUser(industrySlug, {
    enabled: () => isLoggedIn.value && !!industrySlug.value,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
  })

  const storedLoginData = getStoredLoginData()

  const mobile = computed(() => {
    return userData.value?.user?.mobile || storedLoginData?.mobile || null
  })

  const userId = computed(() => userData.value?.user?.id ?? null)

  const branchId = computed(() => userData.value?.branch?.id ?? null)

  const modules = computed(() => userData.value?.role?.modules ?? [])

  return {
    userId,
    userData,
    mobile,
    branchId,
    modules,
    isLoading,
    isError,
    error,
    resetLoginState,
    refetchCurrentUser,
    impersonateUser,
    exitImpersonatingUser,
  }
})
