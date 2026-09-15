import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TREATMENT_PLAN_MODE, TREATMENT_PLAN_STATUS, TREATMENT_PLAN_STEP } from '../constants/enums'

export const isToothStatusMatchingStep = (toothData, stepNumber) => {
  if (!toothData) return true

  switch (stepNumber) {
    case TREATMENT_PLAN_STEP.DRAFT: {
      return toothData.isDraft && !toothData.isProposed && !toothData.isPerformed
    }
    case TREATMENT_PLAN_STEP.PROPOSED: {
      return toothData.isProposed && !toothData.isPerformed
    }
    default: {
      return true
    }
  }
}

export function useTpStatus(treatmentData = null) {
  const route = useRoute()
  const router = useRouter()

  const mode = computed(() =>
    route?.path?.includes('draft/view')
      ? TREATMENT_PLAN_MODE.DRAFT
      : route.params?.id
        ? TREATMENT_PLAN_MODE.EDIT
        : route.path?.includes('draft/create')
          ? TREATMENT_PLAN_MODE.CREATE
          : TREATMENT_PLAN_MODE.PREVIEW
  )
  const currentStepNumber = computed(() => {
    if (!treatmentData?.value?.id) return null

    const treatment = treatmentData?.value

    if (treatment.isProposed || treatment.isPerformed) return TREATMENT_PLAN_STEP.PROPOSED
    if (treatment.isDraft && router.currentRoute.value.name === 'treatment-plan-edit')
      return TREATMENT_PLAN_STEP.PROPOSED

    return TREATMENT_PLAN_STEP.DRAFT
  })

  const backendStepNumber = computed(() => {
    const treatment = treatmentData?.value
    if (!treatment?.id) return null

    if (treatment.isPerformed) return TREATMENT_PLAN_STEP.PROPOSED
    if (treatment.isProposed) return TREATMENT_PLAN_STEP.PROPOSED
    if (treatment.isDraft) return TREATMENT_PLAN_STEP.DRAFT

    return TREATMENT_PLAN_STEP.NONE
  })

  const isDraft = computed(() => {
    const treatment = treatmentData?.value
    return treatment?.status === TREATMENT_PLAN_STATUS.DRAFT || treatment?.isDraft
  })

  const isCompletedTp = computed(
    () => treatmentData?.value?.status === TREATMENT_PLAN_STATUS.COMPLETED
  )

  return {
    mode,
    isDraft,
    currentStepNumber,
    backendStepNumber,
    isCompletedTp,
  }
}
