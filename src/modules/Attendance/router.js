export default [
  {
    path: '/attendance',
    name: 'attendance',
    component: () => import('./pages/AttendanceList'),
    meta: {
      layout: 'AppLayout',
    },
  },
]
