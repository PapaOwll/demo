export default [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('./pages/PanelDashboard'),
    meta: {
      layout: 'AppLayout',
    },
  },
  {
    path: '/report-dashboard',
    name: 'report-dashboard',
    component: () => import('./pages/ReportDashboard'),
    meta: {
      layout: 'AppLayout',
    },
  },
]
