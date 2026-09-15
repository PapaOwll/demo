import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCrmAnnouncementsQuery } from '@/layout/query'

const DISMISSED_KEY = 'crm-dismissed-announcements'

const loadDismissedIds = () => {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

const saveDismissedIds = (ids) => {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]))
  } catch (error) {
    console.error('Failed to save dismissed announcements:', error)
  }
}

const mergeMetadata = (announcement) => {
  if (!announcement.metadata) return announcement
  try {
    const metadata =
      typeof announcement.metadata === 'string'
        ? JSON.parse(announcement.metadata)
        : announcement.metadata
    return { ...announcement, ...metadata }
  } catch {
    return announcement
  }
}

const getShowType = (announcement) => announcement.showType || 'header'

const sortByDate = (a, b) => {
  try {
    const dateA = a.startsAt ? new Date(a.startsAt) : new Date(0)
    const dateB = b.startsAt ? new Date(b.startsAt) : new Date(0)
    return dateB - dateA || b.id - a.id
  } catch {
    return b.id - a.id
  }
}

const filterByTime = ({ startsAt, expiresAt }) => {
  if (!startsAt && !expiresAt) return true

  try {
    const now = new Date()
    const start = startsAt ? new Date(startsAt) : null
    const end = expiresAt ? new Date(expiresAt) : null

    if (start && now < start) return false
    if (end && now > end) return false
    return true
  } catch {
    return true
  }
}

const filterByRoute = ({ path }, currentPath) => {
  if (!path || path.length === 0) return true
  return path.some((p) => currentPath === p || currentPath.startsWith(`${p}/`))
}

export function useCrmAnnouncements() {
  const route = useRoute()
  const dismissedIds = ref(loadDismissedIds())

  const { data: announcements, isLoading } = useCrmAnnouncementsQuery({
    enabled: true,
  })

  const activeAnnouncements = computed(() => {
    if (!announcements.value || !Array.isArray(announcements.value)) {
      return []
    }
    try {
      return announcements.value
        .map((item) => mergeMetadata(item))
        .filter((item) => {
          const isActive = item.isActive ?? true
          return isActive && filterByTime(item) && filterByRoute(item, route.path)
        })
    } catch (error) {
      console.error('Error filtering announcements:', error)
      return []
    }
  })

  const getFilteredAndSorted = (type) => {
    return computed(() => {
      return activeAnnouncements.value.filter((a) => getShowType(a) === type).sort(sortByDate)
    })
  }

  const headerAnnouncements = getFilteredAndSorted('header')
  const modalAnnouncements = getFilteredAndSorted('modal')

  const modalAnnouncement = computed(() => modalAnnouncements.value[0] || null)

  const shouldShowModal = computed(() => {
    const modal = modalAnnouncement.value
    return modal && !dismissedIds.value.has(modal.id)
  })

  const dismissAnnouncement = (id) => {
    dismissedIds.value.add(id)
    saveDismissedIds(dismissedIds.value)
  }

  const cleanExpiredDismissals = () => {
    if (!announcements.value || !Array.isArray(announcements.value)) return
    const activeIds = new Set(announcements.value.map((a) => a.id))
    const filteredDismissed = [...dismissedIds.value].filter((id) => activeIds.has(id))

    if (filteredDismissed.length !== dismissedIds.value.size) {
      dismissedIds.value = new Set(filteredDismissed)
      saveDismissedIds(dismissedIds.value)
    }
  }

  watch(announcements, () => {
    cleanExpiredDismissals()
  })

  return {
    announcements,
    isLoading,
    activeAnnouncements,
    headerAnnouncements,
    modalAnnouncement,
    shouldShowModal,
    dismissAnnouncement,
  }
}
