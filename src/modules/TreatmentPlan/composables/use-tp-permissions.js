import { getPerms } from '@/utils/get-perms'
import { TREATMENT_PLAN_STATUS } from '../constants/enums'

const hasAdminPerms = () => {
  return (
    getPerms('user', 'view', true, 'impersonate') || getPerms('setting', 'add', true, 'pricing')
  )
}

const hasFinancialPerms = () => {
  return getPerms('treatment-plan', 'update', true, 'treatmentPlanFinancial')
}

const canCreateTreatmentPlan = () => {
  return getPerms('treatment-plan', 'add') || getPerms('treatment-plan', 'add', true, 'create')
}

const canPerformTreatmentPlan = () => {
  return (
    getPerms('treatment-plan', 'update', true, 'perform-treatment-plan') ||
    getPerms('treatment-plan', 'add', true, 'perform-treatment-plan')
  )
}

const canActivateTreatmentPlan = () => {
  return getPerms('treatment-plan', 'add')
}

const canCloseTreatmentPlan = () => {
  return (
    getPerms('treatment-plan', 'update', true, 'perform-treatment-plan') ||
    getPerms('treatment-plan', 'add', true, 'perform-treatment-plan') ||
    getPerms('setting', 'update', true, 'clinicSetting')
  )
}

const canEditTreatmentPlan = (plan) => {
  // Non-active plans: existing permission check
  if (plan.status !== TREATMENT_PLAN_STATUS.PERFORMED) {
    return getPerms('treatment-plan', 'update')
  }
  // Active plans: check backend-computed flag
  return !!plan.canEditActive
}

export function useTpPermissions() {
  return {
    hasAdminPerms,
    hasFinancialPerms,
    canCreateTreatmentPlan,
    canPerformTreatmentPlan,
    canActivateTreatmentPlan,
    canCloseTreatmentPlan,
    canEditTreatmentPlan,
  }
}
