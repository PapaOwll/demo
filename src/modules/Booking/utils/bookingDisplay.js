export function getCustomerName(booking) {
  const user = booking?.user
  if (!user) return ''
  return `${user.firstName || ''} ${user.name || ''}`.trim() || user.mobile || ''
}

export function formatTimeHHMM(dateValue) {
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return ''
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function getBookingTimeRange(booking) {
  const d = new Date(booking?.bookingAt)
  if (Number.isNaN(d.getTime())) return { time: '', endTime: '' }
  const end = booking?.bookingEndedAt
    ? new Date(booking.bookingEndedAt)
    : new Date(d.getTime() + 30 * 60 * 1000)
  return { time: formatTimeHHMM(d), endTime: formatTimeHHMM(end) }
}

export function getDoctorName(booking) {
  const doc = booking?.assignTo
  if (!doc) return ''
  return `${doc.firstName || ''} ${doc.name || ''}`.trim()
}

export function getVisitTypeLabel(type) {
  if (type === 2) return 'درمان'
  if (type === 1) return 'مشاوره'
  return 'نوبت'
}

export function getSlotTimeFromClick(
  event,
  { startHour = 8, endHour = 24, slotHeight = 100, roundMinutes = 10 } = {}
) {
  const cellRect = event.currentTarget.getBoundingClientRect()
  const offsetY = event.clientY - cellRect.top
  const rawMinutes = startHour * 60 + Math.floor((offsetY / slotHeight) * 60)
  const clamped = Math.max(startHour * 60, Math.min(endHour * 60, rawMinutes))
  const rounded = Math.round(clamped / roundMinutes) * roundMinutes
  const totalMinutes = Math.min(endHour * 60, rounded)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
