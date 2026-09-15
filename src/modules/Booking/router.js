export default [
  {
    path: '/booking',
    name: 'booking',
    component: () => import('./pages/BookingList'),
    meta: { layout: 'AppLayout' },
  },
  {
    path: '/visit',
    name: 'visit',
    component: () => import('./pages/VisitList'),
    meta: { layout: 'AppLayout' },
  },
  {
    path: '/ownedUsers',
    name: 'ownedUsers',
    component: () => import('./pages/BookingCoordinate'),
    meta: { layout: 'AppLayout' },
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: () => import('./pages/BookingCalendar'),
    meta: { layout: 'AppLayout' },
  },
  {
    path: '/booking/print',
    name: 'booking-print',
    component: () => import('./pages/BookingPrint'),
  },
]
