export default [
  {
    path: '/error-test',
    name: 'error-test',
    component: () => import('./pages/ErrorTest'),
    meta: {
      isShared: true,
      layout: 'AppLayout',
    },
  },
  {
    path: '/monitoring',
    name: 'monitoring',
    component: () => import('./pages/ApiMonitor'),
    meta: {
      isShared: true,
      layout: 'AppLayout',
    },
  },
]
