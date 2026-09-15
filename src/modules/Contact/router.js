export default [
  {
    path: '/contacts',
    name: 'contact',
    component: () => import('./pages/ContactList'),
    meta: {
      layout: 'AppLayout',
    },
  },
]
