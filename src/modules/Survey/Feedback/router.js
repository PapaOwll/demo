export default [
  {
    path: '/ads/feedback',
    name: 'feedback-list',
    component: () => import('./pages/FeedbackList'),
    meta: {
      layout: 'AppLayout',
    },
  },
]
