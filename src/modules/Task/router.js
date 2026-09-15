export default [
  {
    path: '/tasks',
    name: 'task',
    component: () => import('./pages/TaskList'),
    meta: {
      layout: 'AppLayout',
    },
  },
]
