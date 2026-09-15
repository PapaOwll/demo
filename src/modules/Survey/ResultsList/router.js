export default [
  {
    path: '/survey/survey-results',
    name: 'survey-results',
    component: () => import('./pages/ResultsList'),
    meta: {
      layout: 'AppLayout',
    },
  },
]
