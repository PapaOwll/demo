import { computed } from 'vue'

const DEFAULT_BRANCH = {
  payeeName: 'کیمیا سلامت هوشمند تریتا',
  nationalId: '1400855399',
}

const SHARED_BRANCH = {
  payeeName: 'لبخند مهر گیسو',
  nationalId: '14014768639',
}

const BRANCH_MAP = {
  28: SHARED_BRANCH,
  24: SHARED_BRANCH,
  27: SHARED_BRANCH,
  9: DEFAULT_BRANCH,
}

export function useBranchInfo(treatmentData) {
  const userBranchId = computed(() => treatmentData.value?.branch?.id)

  const branchInfo = computed(() => {
    return BRANCH_MAP[userBranchId.value] || DEFAULT_BRANCH
  })

  const payeeName = computed(() => branchInfo.value.payeeName)
  const nationalId = computed(() => branchInfo.value.nationalId)

  return {
    branchInfo,
    payeeName,
    nationalId,
    userBranchId,
  }
}
