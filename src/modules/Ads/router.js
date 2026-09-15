export default [
  {
    path: '/ads/campaign',
    name: 'ads-campaign',
    component: () => import('./pages/CampaignList'),
    meta: { layout: 'AppLayout' },
  },
  {
    path: '/ads/batch-import',
    name: 'ads-batch-import',
    component: () => import('./pages/BatchImport'),
    meta: { layout: 'AppLayout' },
  },
  {
    path: '/ads/imports',
    name: 'ads-imports',
    component: () => import('./pages/ImportList'),
    meta: { layout: 'AppLayout' },
  },
  {
    path: '/ads/coupon',
    name: 'ads-coupon',
    component: () => import('./pages/CouponList'),
    meta: { layout: 'AppLayout' },
  },
  {
    path: '/ads/coupon/create',
    name: 'ads-coupon-create',
    component: () => import('./components/CouponForm'),
    meta: { layout: 'AppLayout' },
  },
  {
    path: '/ads/coupon/view/:id',
    name: 'ads-coupon-view',
    component: () => import('./components/CouponForm'),
    meta: { layout: 'AppLayout' },
  },
  {
    path: '/ads/introductionMethod',
    name: 'ads-introductionMethod',
    component: () =>
      import('@/modules/Settings/GeneralSettings/components/IntroductionMethodSettings'),
    meta: { layout: 'AppLayout' },
  },
]
