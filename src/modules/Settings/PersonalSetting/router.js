export default [
  {
    path: '/setting/personalSetting',
    name: 'personal-setting',
    component: () => import('./pages/PersonalSetting'),
    meta: { layout: 'AppLayout' },
  },
]
