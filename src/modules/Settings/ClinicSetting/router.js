export default [
  {
    path: '/setting/clinicSetting',
    name: 'clinic-settings',
    component: () => import('./pages/ClinicSetting'),
    meta: { layout: 'AppLayout' },
  },
]
