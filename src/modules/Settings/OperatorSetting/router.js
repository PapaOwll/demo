export default [
  {
    path: '/setting/operatorSetting',
    name: 'operator-settings',
    component: () => import('./pages/OperatorSetting'),
    meta: { layout: 'AppLayout' },
  },
]
