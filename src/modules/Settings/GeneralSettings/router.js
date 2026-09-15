export default [
  {
    path: '/setting/generalSetting',
    name: 'general-settings',
    component: () => import('./pages/GeneralSettings'),
    meta: { layout: 'AppLayout' },
  },
]
