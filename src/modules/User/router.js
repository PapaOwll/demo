export default [
  {
    path: '/users',
    name: 'user',
    component: () => import('./pages/UserList'),
    meta: { layout: 'AppLayout' },
  },
]
