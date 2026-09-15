export default [
  {
    path: '/setting/schedule',
    name: 'schedule',
    component: () => import('./pages/SettingCalendar'),
    meta: { layout: 'AppLayout' },
  },
]
