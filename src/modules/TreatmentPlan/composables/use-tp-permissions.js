import { getPerms } from '@/utils/get-perms'

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
