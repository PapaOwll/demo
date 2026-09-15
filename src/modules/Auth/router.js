import AuthLayout from '@/layout/AuthLayout'

export default [
  {
    path: '/login',
    name: 'login',
    component: () => import('./pages/LoginPage'),
    meta: { layout: AuthLayout, isPublic: true },
  },
]
