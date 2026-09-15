export const COMPLEXITY_LEVELS = {
  SIMPLE: 'simple',
  MEDIUM: 'medium',
  COMPLEX: 'complex',
}

export const COMPLEXITY_COLORS = {
  [COMPLEXITY_LEVELS.SIMPLE]: {
    bg: 'bg-green-1',
    text: 'text-green',
    border: 'border-green',
  },
  [COMPLEXITY_LEVELS.MEDIUM]: {
    bg: 'bg-amber-1',
    text: 'text-orange',
    border: 'border-orange',
  },
  [COMPLEXITY_LEVELS.COMPLEX]: {
    bg: 'bg-red-1',
    text: 'text-red',
    border: 'border-red',
  },
}

export const COMPLEXITY_LABELS = {
  [COMPLEXITY_LEVELS.SIMPLE]: 'ساده',
  [COMPLEXITY_LEVELS.MEDIUM]: 'متوسط',
  [COMPLEXITY_LEVELS.COMPLEX]: 'پیچیده',
}

export const PERMISSION_LOGIC = {
  AND: 'و',
  OR: 'یا',
}

export const ACCESS_LEVELS = {
  ALL: 'all',
  OWNER: 'owner',
  BRANCH: 'branch',
  NONE: null,
}

export const ACCESS_LEVEL_LABELS = {
  [ACCESS_LEVELS.ALL]: 'همه',
  [ACCESS_LEVELS.OWNER]: 'خودی',
  [ACCESS_LEVELS.BRANCH]: 'شعبه',
  [ACCESS_LEVELS.NONE]: '-',
}

export const CATEGORY_ICONS = {
  PATIENTS: 'people',
  TREATMENT_PLANS: 'medical_services',
  APPOINTMENTS: 'event',
  SETTINGS: 'settings',
  COMMUNICATION: 'chat',
}
