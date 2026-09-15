import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/user'
import { computed } from 'vue'
import { useApiGetSettings } from '@/modules/Settings'
import { useRoleManager } from '@/composables/use-role-manager'

export function useBranchTpPerform() {
  const { userData: currentUser } = storeToRefs(useUserStore())
  const branch = computed(() => currentUser.value?.branch?.id)
  const { hasAnyRole } = useRoleManager()

  const { data: tpPerformSettings } = useApiGetSettings('hasTpPerform')

  const isBranchHasTpPerform = computed(() => {
    const settingsValue = tpPerformSettings.value
    const enabledBranches = Array.isArray(settingsValue) ? settingsValue : []

    return enabledBranches.includes(branch.value) && hasAnyRole(['doctor'])
  })

  return {
    isBranchHasTpPerform,
  }
}
