import { createRouter, createWebHistory } from 'vue-router'
import modules from '@/modules/modules'
import adsRoutes from '@/modules/Ads/router'
import authRoutes from '@/modules/Auth/router'
import miscRoutes from '@/modules/misc/router'
import userRoutes from '@/modules/User/router'
import taskRoutes from '@/modules/Task/router'
import bookingRoutes from '@/modules/Booking/router'
// import reportsRoutes from '@/modules/Reports/router'
import contactRoutes from '@/modules/Contact/router'
import dashboardRoutes from '@/modules/Dashboard/router'
import TreatmentPlanRoutes from '@/modules/TreatmentPlan/router'
import feedbackRoutes from '@/modules/Survey/Feedback/router'
import attendanceRoutes from '@/modules/Attendance/router'
// import priceCalculatorRoutes from '@/modules/PriceCalculator/router'

import { storeToRefs } from 'pinia'
import { useOfflineStore } from '@/store/offline'

import { hasAccessToken } from '@/utils/auth'

const newRoutes = [
  ...authRoutes,
  ...adsRoutes,
  ...dashboardRoutes,
  ...userRoutes,
  ...taskRoutes,
  ...miscRoutes,
  ...contactRoutes,
  ...bookingRoutes,
  // ...reportsRoutes,
  ...TreatmentPlanRoutes,
  ...feedbackRoutes,
  ...attendanceRoutes,
  // ...priceCalculatorRoutes,
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('@/components/NotFoundPage'),
    meta: { layout: 'AppLayout', isPublic: false },
  },
]

const legacyRoutes = Object.keys(modules).flatMap((moduleKey) =>
  Object.keys(modules[moduleKey]).reduce(
    (prev, subKey) => [...prev, ...(modules[moduleKey][subKey]?.router || [])],
    []
  )
)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...legacyRoutes, ...newRoutes],
})
// const unAuthorizedRoutes = [
//   'login',
//   'register',
//   'verify-by-code',
//   'reset-password',
//   'forget-password',
//   'verify-by-password',
//   'forget-password-otp',
//   'treatment-plan',
// ]

// Lazy store access to avoid Pinia initialization issues
let offlineStore = null
const getOfflineStore = () => {
  if (!offlineStore) {
    offlineStore = useOfflineStore()
  }
  return offlineStore
}

router.beforeEach(async (to, from, next) => {
  const isAuthorized = hasAccessToken()
  if (!to.meta?.isPublic && !isAuthorized && !to.meta?.isShared) return next({ name: 'login' })
  if (to.meta?.isPublic && isAuthorized && !to.meta?.isShared) return next({ name: 'dashboard' })

  // Only check offline status after initial navigation (when Pinia is ready)
  if (from.name !== undefined) {
    const store = getOfflineStore()
    const { isOffline } = storeToRefs(store)
    if (isOffline.value) {
      store.setPendingRoute(to.fullPath)
      return next(false)
    }
  }
  return next()
})

export default router
