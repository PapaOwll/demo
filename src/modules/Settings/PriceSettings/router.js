export default [
  {
    path: '/setting/pricing',
    name: 'price-settings',
    component: () => import('./pages/PriceSettings'),
    meta: { layout: 'AppLayout' },
  },
]
