export const TREATMENT_PLAN_MODE = Object.freeze({
  DRAFT: 'draft',
  EDIT: 'edit',
  CREATE: 'create',
  PREVIEW: 'preview',
})

export const TREATMENT_PLAN_STATUS = Object.freeze({
  DRAFT: 0,
  PENDING: 1,
  PROPOSED: 2,
  PERFORMED: 3,
  COMPLETED: 4,
})

export const TREATMENT_PLAN_ACTIVE_STATUS = Object.freeze({
  ACTIVE: 3,
  INACTIVE: 2,
  COMPLETED: 4,
})

export const TREATMENT_PLAN_STATUS_OPTIONS = Object.freeze([
  {
    id: TREATMENT_PLAN_ACTIVE_STATUS.ACTIVE,
    label: 'فعال',
    badgeColor: 'green',
  },
  {
    id: TREATMENT_PLAN_ACTIVE_STATUS.COMPLETED,
    label: 'پایان یافته',
    badgeColor: 'red',
  },
  {
    id: TREATMENT_PLAN_ACTIVE_STATUS.INACTIVE,
    label: 'غیرفعال',
    badgeColor: 'grey',
  },
])

export const TREATMENT_PLAN_STEP = Object.freeze({
  NONE: 0,
  DRAFT: 1,
  PROPOSED: 2,
  PERFORMED: 3,
})

export const QUESTION_TYPE = Object.freeze({
  MULTIPLE: 1,
  YES_NO: 2,
  PER_UNIT: 3,
  PER_TEETH: 4,
  PER_JAW: 5,
  PER_QUADRANT: 6,
  SIMPLE_MULTIPLE: 7,
  UNIT_WITH_TEETH: 11,
})

export const VISIT_TYPE = Object.freeze({
  IN_PERSON: 1,
  ONLINE: 2,
})

// Treatment plans created after this moment use the new calculation flow.
export const NEW_CALCULATION_CUTOVER_DATETIME = '2026-01-18 13:00:00'
