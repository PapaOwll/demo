import { ref, computed } from 'vue'
import {
  toJalaali,
  parseJalali,
  formatJalaliParts,
  getTodayJalali,
  jalaliWeekday,
  addJalaliDays,
  addJalaliMonths,
  jalaliStartOfWeek,
  jalaliEndOfWeek,
  compareJalali,
  PERSIAN_MONTHS,
} from '@/utils/date-utils'

export const JALALI_FMT = 'jYYYY-jM-jD'
export const DAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه\u200Cشنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

export function toPersian(n) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

const JALALI_RE = /^\d{4}(?:-\d{1,2}){2}$/

export function toJalali(value) {
  if (!value) return getTodayJalali()
  if (typeof value === 'string') {
    if (JALALI_RE.test(value)) return value
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return getTodayJalali()
    const { jy, jm, jd } = toJalaali(date)
    return formatJalaliParts(jy, jm, jd)
  }
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return getTodayJalali()
  const { jy, jm, jd } = toJalaali(d)
  return formatJalaliParts(jy, jm, jd)
}

export function getJalaliDayName(jalaliStr) {
  const { jy, jm, jd } = parseJalali(jalaliStr)
  const dow = jalaliWeekday(jy, jm, jd)
  return DAY_NAMES[dow]
}

function jalaliFormat(jy, jm, jd, fmt) {
  const dow = jalaliWeekday(jy, jm, jd)
  return fmt
    .replace('dddd', DAY_NAMES[dow])
    .replace('DD', String(jd).padStart(2, '0'))
    .replace('D', String(jd))
    .replace('MMMM', PERSIAN_MONTHS[jm - 1])
    .replace('YYYY', String(jy))
}

function shiftDate(jy, jm, jd, amount, isMonth) {
  return isMonth ? addJalaliMonths(jy, jm, jd, amount) : addJalaliDays(jy, jm, jd, amount)
}

export function useCalendar(opts = {}) {
  const TODAY = getTodayJalali()
  const currentDate = ref(opts.initialDate ? toJalali(opts.initialDate) : TODAY)
  const viewMode = ref(opts.initialViewMode || 'week')
  const transitDir = ref('slide-left')

  const cm = computed(() => parseJalali(currentDate.value))

  const weekStart = computed(() => {
    const { jy, jm, jd } = cm.value
    return jalaliStartOfWeek(jy, jm, jd)
  })

  const weekEnd = computed(() => {
    const { jy, jm, jd } = cm.value
    return jalaliEndOfWeek(jy, jm, jd)
  })

  const displayLabel = computed(() => {
    if (viewMode.value === 'day') {
      const { jy, jm, jd } = cm.value
      return jalaliFormat(jy, jm, jd, 'dddd D MMMM YYYY')
    }
    if (viewMode.value === 'week') {
      const s = weekStart.value
      const e = weekEnd.value
      let fmt = 'D'
      if (s.jm !== e.jm) fmt = 'D MMMM'
      if (s.jy !== e.jy) fmt = 'D MMMM YYYY'
      return `${jalaliFormat(s.jy, s.jm, s.jd, fmt)} - ${jalaliFormat(e.jy, e.jm, e.jd, 'D MMMM YYYY')}`
    }
    const { jy, jm } = cm.value
    return `${PERSIAN_MONTHS[jm - 1]} ${jy}`
  })

  const isTodayVisible = computed(() => {
    if (viewMode.value === 'day') return currentDate.value === TODAY
    const today = parseJalali(TODAY)
    return compareJalali(today, weekStart.value) >= 0 && compareJalali(today, weekEnd.value) <= 0
  })

  function buildDay(jalaliStr, inCurrentMonth = true) {
    const { jy, jm, jd } = parseJalali(jalaliStr)
    const todayParts = parseJalali(TODAY)
    const vac = opts.vacations?.value ?? []
    const item = vac.find((v) => {
      if (v.date instanceof Date) {
        const vj = toJalaali(v.date)
        return formatJalaliParts(vj.jy, vj.jm, vj.jd) === jalaliStr
      }
      if (typeof v.date === 'string') {
        return toJalali(v.date) === jalaliStr
      }
      return false
    })
    const dow = jalaliWeekday(jy, jm, jd)

    return {
      date: jalaliStr,
      dayNumber: toPersian(jd),
      dayName: DAY_NAMES[dow],
      dow,
      isToday: jalaliStr === TODAY,
      isCurrentMonth: inCurrentMonth,
      isWeekend: dow === 6,
      isVacation: !!item,
      vacationTitle: item?.title,
      isPast: compareJalali({ jy, jm, jd }, todayParts) < 0,
    }
  }

  const weekDays = computed(() => {
    let { jy, jm, jd } = weekStart.value
    return Array.from({ length: 7 }, () => {
      const str = formatJalaliParts(jy, jm, jd)
      const result = buildDay(str)
      const next = addJalaliDays(jy, jm, jd, 1)
      jy = next.jy
      jm = next.jm
      jd = next.jd
      return result
    })
  })

  const dayData = computed(() => buildDay(currentDate.value))

  const monthWeeks = computed(() => {
    const { jy: jY, jm: jM } = cm.value
    const days = []

    let cur = { jy: jY, jm: jM, jd: 1 }
    while (cur.jm === jM) {
      days.push(buildDay(formatJalaliParts(cur.jy, cur.jm, cur.jd), true))
      cur = addJalaliDays(cur.jy, cur.jm, cur.jd, 1)
    }

    let first = parseJalali(days[0].date)
    while (jalaliWeekday(first.jy, first.jm, first.jd) !== 0) {
      first = addJalaliDays(first.jy, first.jm, first.jd, -1)
      days.unshift(buildDay(formatJalaliParts(first.jy, first.jm, first.jd), false))
    }

    let last = parseJalali(days.at(-1).date)
    while (jalaliWeekday(last.jy, last.jm, last.jd) !== 6) {
      last = addJalaliDays(last.jy, last.jm, last.jd, 1)
      days.push(buildDay(formatJalaliParts(last.jy, last.jm, last.jd), false))
    }

    const weeks = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
    return weeks
  })

  function unitIsMonth() {
    return viewMode.value === 'month'
  }

  function unitAmount() {
    if (viewMode.value === 'day') return 1
    if (viewMode.value === 'week') return 7
    return 1
  }

  function canGoPrev() {
    if (!opts.minDate?.value) return true
    const { jy, jm, jd } = cm.value
    const shifted = shiftDate(jy, jm, jd, -unitAmount(), unitIsMonth())
    const minParts = parseJalali(toJalali(opts.minDate.value))
    return compareJalali(shifted, minParts) >= 0
  }

  function canGoNext() {
    if (!opts.maxDate?.value) return true
    const { jy, jm, jd } = cm.value
    const shifted = shiftDate(jy, jm, jd, unitAmount(), unitIsMonth())
    const maxParts = parseJalali(toJalali(opts.maxDate.value))
    return compareJalali(shifted, maxParts) <= 0
  }

  function goPrev() {
    if (!canGoPrev()) return
    transitDir.value = 'slide-right'
    const { jy, jm, jd } = cm.value
    const shifted = shiftDate(jy, jm, jd, -unitAmount(), unitIsMonth())
    currentDate.value = formatJalaliParts(shifted.jy, shifted.jm, shifted.jd)
  }

  function goNext() {
    if (!canGoNext()) return
    transitDir.value = 'slide-left'
    const { jy, jm, jd } = cm.value
    const shifted = shiftDate(jy, jm, jd, unitAmount(), unitIsMonth())
    currentDate.value = formatJalaliParts(shifted.jy, shifted.jm, shifted.jd)
  }

  function goToday() {
    const todayParts = parseJalali(TODAY)
    const { jy, jm, jd } = cm.value
    const cmp = compareJalali({ jy, jm, jd }, todayParts)
    transitDir.value = cmp < 0 ? 'slide-left' : 'slide-right'
    currentDate.value = TODAY
  }

  function setViewMode(m) {
    viewMode.value = m
  }
  function setDate(v) {
    currentDate.value = toJalali(v)
  }

  return {
    TODAY,
    currentDate,
    viewMode,
    transitDir,
    displayLabel,
    isTodayVisible,
    weekDays,
    dayData,
    monthWeeks,
    weekStart,
    weekEnd,
    prev: goPrev,
    next: goNext,
    goToday,
    canGoPrev,
    canGoNext,
    setViewMode,
    setDate,
  }
}
export { getTodayJalali } from '@/utils/date-utils'
