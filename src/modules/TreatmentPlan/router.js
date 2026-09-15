export default [
  // {
  //   path: '/treatment-plan/select-user',
  //   name: 'treatment-plan-select-user',
  //   component: () => import('./pages/TreatmentPlanSelectUser'),
  //   meta: { layout: 'AppLayout' },
  // },
  {
    path: '/treatment-plan/create',
    name: 'treatment-plan-create',
    component: () => import('./pages/TpCreateDraft'),
    meta: {},
  },
  {
    path: '/treatment-plan/draft/create',
    name: 'treatment-plan-draft-create',
    component: () => import('./pages/TpCreateDraft'),
    meta: {},
  },
  {
    path: '/treatment-plan/draft/view/:id',
    name: 'treatment-plan-draft-view',
    component: () => import('./pages/TpShowDraft'),
    meta: {},
  },
  {
    path: '/treatment-plan/treatment-plan-list',
    name: 'treatment-plan-list',
    component: () => import('./pages/TpList'),
    meta: { layout: 'AppLayout' },
  },
  {
    path: '/treatment-plan/edit/:id',
    name: 'treatment-plan-edit',
    component: () => import('./pages/TpEdit'),
    meta: {},
  },
  {
    path: '/tp/:key',
    name: 'treatment-plan-preview',
    component: () => import('./pages/TpPublicPreview'),
    meta: { isPublic: true, isShared: true },
  },
  {
    path: '/treatment-plan/doctor-review',
    name: 'treatment-plan-doctor-review',
    component: () => import('./pages/TpDoctorReviewList'),
    meta: { layout: 'AppLayout' },
  },
  {
    path: '/treatment-plan/description/:tpId',
    name: 'treatment-plan-description',
    component: () => import('./pages/TpDescription'),
    meta: { layout: 'AppLayout' },
  },
  {
    path: '/tpd/patient-file',
    name: 'patient-file',
    component: () => import('./pages/TpPatientFile'),
    meta: {},
  },
  {
    path: '/tpd/doctor-tpd-form',
    name: 'doctor-tpd-form',
    component: () => import('./pages/TpdDoctorDescriptionForm'),
    meta: {},
  },
]
