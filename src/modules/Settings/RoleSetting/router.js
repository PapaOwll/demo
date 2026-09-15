export default [
  {
    path: '/setting/roleSetting',
    name: 'role-settings',
    component: () => import('./pages/RoleSetting'),
    meta: {
      layout: 'AppLayout',
      requiresAuth: true,
    },
  },
]
