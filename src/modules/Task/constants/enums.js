export const followupKindFilters = Object.freeze({
  DAY_3: { slug: 'followup-3', faTitle: 'فالوآپ اول (+۳)' },
  DAY_14: { slug: 'followup-14', faTitle: 'فالوآپ دوم (+۱۴)' },
  DAY_45: { slug: 'followup-45', faTitle: 'فالوآپ سوم (+۴۵)' },
  CROWN_FOLLOW_UP: { slug: 'crown-followup', faTitle: 'نظرسنجی پروتز (روکش)' },
  FIRST_VISIT: { slug: 'first-visit-follow-up', faTitle: 'نظرسنجی ویزیت اولیه' },
  TREATMENT_FOLLOW_UP: { slug: 'post-treatment-follow-up', faTitle: 'پیگیری پس از درمان' },
})

export const followupKindSlugs = new Set(
  Object.values(followupKindFilters).map((kind) => kind.slug)
)
