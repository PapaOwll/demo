import { computed } from 'vue'

/**
 * Computes overlap groups for a list of bookings.
 *
 * Two bookings overlap if: bookingA.start < bookingB.end AND bookingB.start < bookingA.end
 *
 * Returns a Map from booking.id → { columnIndex, columnCount, sideBySide, textPosition }
 *
 * @param {Array} bookings - Array of booking objects with `bookingAt` and optional `bookingEndedAt`
 * @returns {Map<number, {columnIndex: number, columnCount: number, sideBySide: boolean, textPosition: string}>}
 */
export function computeOverlapInfo(bookings) {
  const result = new Map()

  if (!bookings || bookings.length === 0) return result

  // Parse start/end minutes from midnight for each booking
  const parsed = bookings.map((booking) => {
    const start = new Date(booking.bookingAt)
    const startMin = start.getHours() * 60 + start.getMinutes()

    let endMin
    if (booking.bookingEndedAt) {
      const end = new Date(booking.bookingEndedAt)
      endMin = end.getHours() * 60 + end.getMinutes()
    } else {
      endMin = startMin + 30 // default 30min duration
    }

    return { id: booking.id, startMin, endMin, canceled: !!booking.canceledAt }
  })

  // Sort by start time for deterministic column assignment
  const sorted = [...parsed].sort((a, b) => a.startMin - b.startMin)

  // Group overlapping bookings into clusters
  const clusters = []
  let currentCluster = []

  sorted.forEach((item) => {
    if (currentCluster.length === 0) {
      currentCluster.push(item)
    } else {
      // Check if this item overlaps with ANY item in the current cluster
      const overlapsCluster = currentCluster.some(
        (existing) => item.startMin < existing.endMin && existing.startMin < item.endMin
      )

      if (overlapsCluster) {
        currentCluster.push(item)
      } else {
        clusters.push(currentCluster)
        currentCluster = [item]
      }
    }
  })
  if (currentCluster.length > 0) clusters.push(currentCluster)

  // Within each cluster, assign each booking to a lane (column) via first-fit so
  // that no two overlapping bookings share a lane. columnIndex = lane and
  // columnCount = number of lanes (= max simultaneous bookings). This bases each
  // card's width on REAL local concurrency instead of the whole transitive
  // cluster size, so unrelated bookings chained transitively no longer squeeze
  // each other. The card still renders overlap-on-top (lane 0 = base).
  // Special case: two bookings at the exact same time slot render side-by-side.
  clusters.forEach((cluster) => {
    const sideBySide =
      cluster.length === 2 &&
      cluster[0].startMin === cluster[1].startMin &&
      cluster[0].endMin === cluster[1].endMin

    // Assign lanes to canceled bookings first so they claim the lower lanes and
    // render behind (base), keeping active bookings on top. Process by start time
    // so first-fit uses the minimum number of lanes (= true max concurrency) —
    // other orderings (e.g. duration) inflate columnCount and make cards too narrow.
    const laneOrder = [...cluster].sort((a, b) => {
      if (a.canceled === b.canceled) {
        const aDuration = a.endMin - a.startMin
        const bDuration = b.endMin - b.startMin
        if (aDuration === bDuration) return a.startMin - b.startMin
        return bDuration - aDuration
      }
      return a.canceled ? -1 : 1
    })

    const laneEnds = []
    const lanes = laneOrder.map((item) => {
      const freeLane = laneEnds.findIndex((end) => end <= item.startMin)
      const lane = freeLane === -1 ? laneEnds.length : freeLane
      if (freeLane === -1) {
        laneEnds.push(item.endMin)
      } else {
        laneEnds[freeLane] = item.endMin
      }
      return { id: item.id, lane }
    })

    const totalColumns = laneEnds.length

    // Promote the longest booking to lane 0 (the base, rendered behind) by
    // swapping its lane label with lane 0. Swapping two lane labels keeps every
    // lane conflict-free, so we get "longest = base" without inflating card widths.
    const longest = cluster.reduce((best, item) => {
      const bestDur = best.endMin - best.startMin
      const itemDur = item.endMin - item.startMin
      if (itemDur > bestDur || (itemDur === bestDur && item.startMin < best.startMin)) return item
      return best
    })
    const longestLane = lanes.find((entry) => entry.id === longest.id).lane
    const resolveLane = (lane) => {
      if (lane === longestLane) return 0
      if (lane === 0) return longestLane
      return lane
    }

    // Position each card's text on the side that isn't covered by an overlapping
    // card: top if nothing overlaps from above, bottom if covered from above, and
    // center when covered from BOTH above and below.
    cluster.forEach((item) => {
      const overlapsFromAbove = cluster.some(
        (other) =>
          other.id !== item.id &&
          other.startMin < item.endMin &&
          item.startMin < other.endMin &&
          other.startMin <= item.startMin
      )
      const overlapsFromBelow = cluster.some(
        (other) =>
          other.id !== item.id &&
          other.startMin < item.endMin &&
          item.startMin < other.endMin &&
          other.endMin >= item.endMin
      )
      const { lane } = lanes.find((entry) => entry.id === item.id)
      let textPosition = 'top'
      if (overlapsFromAbove) textPosition = overlapsFromBelow ? 'center' : 'bottom'
      result.set(item.id, {
        columnIndex: resolveLane(lane),
        columnCount: totalColumns,
        sideBySide,
        textPosition,
      })
    })
  })

  return result
}

/**
 * Vue composable wrapper that reactively computes overlap info.
 *
 * @param {import('vue').ComputedRef<Array>|Array} bookings - reactive or plain array of bookings
 * @returns {import('vue').ComputedRef<Map<number, {columnIndex: number, columnCount: number}>>}
 */
export function useOverlapDetection(bookings) {
  return computed(() => {
    const list = bookings?.value === undefined ? bookings : bookings.value
    return computeOverlapInfo(list)
  })
}
