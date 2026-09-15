export default [
  {
    path: '/survey/survey-lists',
    name: 'survey-lists',
    component: () => import('./pages/SurveyList'),
    meta: {
      layout: 'AppLayout',
    },
  },
]
