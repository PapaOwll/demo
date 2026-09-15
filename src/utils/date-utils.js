// Utility helper functions.

function div(a, b) {
  return Math.trunc(a / b)
}

function mod(a, b) {
  return a - Math.trunc(a / b) * b
}

/*
  Jalaali years starting the 33-year rule.
*/
const breaks = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
  2456, 3178,
]

/*
    This function determines if the Jalaali (Persian) year is
    leap (366-day long) or is the common year (365 days)

    @param jy Jalaali calendar year (-61 to 3177)
    @returns number of years since the last leap year (0 to 4)
 */
function jalCalLeap(jy) {
  const bl = breaks.length
  let jp = breaks[0]
  let jm
  let jump
  let leap
  let n
  let i

  if (jy < jp || jy >= breaks[bl - 1]) {
    throw new Error(`Invalid Jalaali year ${jy}`)
  }

  for (i = 1; i < bl; i += 1) {
    jm = breaks[i]
    jump = jm - jp
    if (jy < jm) {
      break
    }
    jp = jm
  }
  n = jy - jp

  if (jump - n < 6) {
    n = n - jump + div(jump + 4, 33) * 33
  }
  leap = mod(mod(n + 1, 33) - 1, 4)
  if (leap === -1) {
    leap = 4
  }

  return leap
}

/*
  Is this a leap year or not?
*/
function isLeapJalaaliYear(jy) {
  return jalCalLeap(jy) === 0
}

/*
  Number of days in a given month in a Jalaali year.
*/
export function jalaaliMonthLength(jy, jm) {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  if (isLeapJalaaliYear(jy)) return 30
  return 29
}

/*
  This function determines if the Jalaali (Persian) year is
  leap (366-day long) or is the common year (365 days), and
  finds the day in March (Gregorian calendar) of the first
  day of the Jalaali year (jy).

  @param jy Jalaali calendar year (-61 to 3177)
  @param withoutLeap when don't need leap (true or false) default is false
  @return
    leap: number of years since the last leap year (0 to 4)
    gy: Gregorian year of the beginning of Jalaali year
    march: the March day of Farvardin the 1st (1st day of jy)
  @see: http://www.astro.uni.torun.pl/~kb/Papers/EMP/PersianC-EMP.htm
  @see: http://www.fourmilab.ch/documents/calendar/
*/
function jalCal(jy, withoutLeap) {
  const bl = breaks.length
  const gy = jy + 621
  let leapJ = -14
  let jp = breaks[0]
  let jm
  let jump
  let leap
  let n
  let i

  if (jy < jp || jy >= breaks[bl - 1]) {
    throw new Error(`Invalid Jalaali year ${jy}`)
  }

  // Find the limiting years for the Jalaali year jy.
  for (i = 1; i < bl; i += 1) {
    jm = breaks[i]
    jump = jm - jp
    if (jy < jm) {
      break
    }
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }
  n = jy - jp

  // Find the number of leap years from AD 621 to the beginning
  // of the current Jalaali year in the Persian calendar.
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4) {
    leapJ += 1
  }

  // And the same in the Gregorian calendar (until the year gy).
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150

  // Determine the Gregorian date of Farvardin the 1st.
  const march = 20 + leapJ - leapG

  // Find how many years have passed since the last leap year.
  if (!withoutLeap) {
    if (jump - n < 6) {
      n = n - jump + div(jump + 4, 33) * 33
    }
    leap = mod(mod(n + 1, 33) - 1, 4)
    if (leap === -1) {
      leap = 4
    }
  }

  return {
    leap,
    gy,
    march,
  }
}

/*
  Calculates the Julian Day number from Gregorian or Julian
  calendar dates. This integer number corresponds to the noon of
  the date (i.e. 12 hours of Universal Time).
  The procedure was tested to be good since 1 March, -100100 (of both
  calendars) up to a few million years into the future.

  @param gy Calendar year (years BC numbered 0, -1, -2, ...)
  @param gm Calendar month (1 to 12)
  @param gd Calendar day of the month (1 to 28/29/30/31)
  @return Julian Day number
*/
function g2d(gy, gm, gd) {
  let d =
    div((gy + div(gm - 8, 6) + 100_100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34_840_408
  d = d - div(div(gy + 100_100 + div(gm - 8, 6), 100) * 3, 4) + 752
  return d
}

/*
  Converts a date of the Jalaali calendar to the Julian Day number.

  @param jy Jalaali year (1 to 3100)
  @param jm Jalaali month (1 to 12)
  @param jd Jalaali day (1 to 29/31)
  @return Julian Day number
*/
function j2d(jy, jm, jd) {
  const r = jalCal(jy, true)
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
}

/*
  Calculates Gregorian and Julian calendar dates from the Julian Day number
  (jdn) for the period since jdn=-34839655 (i.e. the year -100100 of both
  calendars) to some millions years ahead of the present.

  @param jdn Julian Day number
  @return
    gy: Calendar year (years BC numbered 0, -1, -2, ...)
    gm: Calendar month (1 to 12)
    gd: Calendar day of the month M (1 to 28/29/30/31)
*/
function d2g(jdn) {
  let j = 4 * jdn + 139_361_631
  j = j + div(div(4 * jdn + 183_187_720, 146_097) * 3, 4) * 4 - 3908
  const i = div(mod(j, 1461), 4) * 5 + 308
  const gd = div(mod(i, 153), 5) + 1
  const gm = mod(div(i, 153), 12) + 1
  const gy = div(j, 1461) - 100_100 + div(8 - gm, 6)
  return {
    gy,
    gm,
    gd,
  }
}

/*
  Converts the Julian Day number to a date in the Jalaali calendar.

  @param jdn Julian Day number
  @return
    jy: Jalaali year (1 to 3100)
    jm: Jalaali month (1 to 12)
    jd: Jalaali day (1 to 29/31)
*/
function d2j(jdn) {
  const { gy } = d2g(jdn) // Calculate Gregorian year (gy).
  let jy = gy - 621
  let jd
  let jm
  let k
  const r = jalCal(jy, false)
  const jdn1f = g2d(gy, 3, r.march)

  // Find number of days that passed since 1 Farvardin.
  k = jdn - jdn1f
  if (k >= 0) {
    if (k <= 185) {
      // The first 6 months.
      jm = 1 + div(k, 31)
      jd = mod(k, 31) + 1
      return {
        jy,
        jm,
        jd,
      }
    }

    // The remaining months.
    k -= 186
  } else {
    // Previous Jalaali year.
    jy -= 1
    k += 179
    if (r.leap === 1) {
      k += 1
    }
  }
  jm = 7 + div(k, 30)
  jd = mod(k, 30) + 1
  return {
    jy,
    jm,
    jd,
  }
}

/*
  Converts a Gregorian date to Jalaali.
*/
export function toJalaali(gy, gm, gd) {
  let cloneGd = gd
  let cloneGm = gm
  let cloneGy = gy
  if (Object.prototype.toString.call(gy) === '[object Date]') {
    cloneGd = gy.getDate()
    cloneGm = gy.getMonth() + 1
    cloneGy = gy.getFullYear()
  }
  return d2j(g2d(cloneGy, cloneGm, cloneGd))
}

/*
  Converts a Jalaali date to Gregorian.
*/
export function toGregorian(jy, jm, jd) {
  return d2g(j2d(jy, jm, jd))
}

export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

export const PERSIAN_WEEKDAYS = [
  'یک\u200Cشنبه',
  'دوشنبه',
  'سه\u200Cشنبه',
  'چهارشنبه',
  'پنج\u200Cشنبه',
  'جمعه',
  'شنبه',
]

export function parseJalali(str) {
  const [jy, jm, jd] = str.split('-').map(Number)
  return { jy, jm, jd }
}

export function formatJalaliParts(jy, jm, jd) {
  return `${jy}-${jm}-${jd}`
}

export function jalaliToGregorianDate(jy, jm, jd) {
  const { gy, gm, gd } = toGregorian(jy, jm, jd)
  return new Date(gy, gm - 1, gd)
}

export function getTodayJalali() {
  const { jy, jm, jd } = toJalaali(new Date())
  return formatJalaliParts(jy, jm, jd)
}

export function jalaliWeekday(jy, jm, jd) {
  const gDate = jalaliToGregorianDate(jy, jm, jd)
  return (gDate.getDay() + 1) % 7
}

export function addJalaliDays(jy, jm, jd, amount) {
  const gDate = jalaliToGregorianDate(jy, jm, jd)
  gDate.setDate(gDate.getDate() + amount)
  const r = toJalaali(gDate)
  return { jy: r.jy, jm: r.jm, jd: r.jd }
}

export function addJalaliMonths(jy, jm, jd, amount) {
  let newJm = jm + amount
  let newJy = jy
  while (newJm > 12) {
    newJm -= 12
    newJy += 1
  }
  while (newJm < 1) {
    newJm += 12
    newJy -= 1
  }
  const maxDay = jalaaliMonthLength(newJy, newJm)
  return { jy: newJy, jm: newJm, jd: Math.min(jd, maxDay) }
}

export function jalaliStartOfWeek(jy, jm, jd) {
  const dow = jalaliWeekday(jy, jm, jd)
  return addJalaliDays(jy, jm, jd, -dow)
}

export function jalaliEndOfWeek(jy, jm, jd) {
  const dow = jalaliWeekday(jy, jm, jd)
  return addJalaliDays(jy, jm, jd, 6 - dow)
}

export function compareJalali(a, b) {
  if (a.jy !== b.jy) return a.jy - b.jy
  if (a.jm !== b.jm) return a.jm - b.jm
  return a.jd - b.jd
}

// Convert Gregorian date to Persian/Jalali format with comprehensive formatting support
export function convertToJalali(gregorianDate, format = 'jYYYY/jMM/jDD') {
  const date = new Date(gregorianDate)
  if (Number.isNaN(date.getTime())) return ''

  const weekday = date.getDay()
  const { jy: year, jm: month, jd: day } = toJalaali(date)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  const formatMap = {
    jYYYY: year.toString(),
    jYY: year.toString().slice(-2),
    jMMMM: PERSIAN_MONTHS[month - 1],
    jMMM: PERSIAN_MONTHS[month - 1]?.slice(0, 3) || '',
    jMM: month.toString().padStart(2, '0'),
    jM: month.toString(),
    jDD: day.toString().padStart(2, '0'),
    jD: day.toString(),
    jdddd: PERSIAN_WEEKDAYS[weekday],
    jddd: PERSIAN_WEEKDAYS[weekday]?.slice(0, 3),
    HH: hours.toString().padStart(2, '0'),
    H: hours.toString(),
    mm: minutes.toString().padStart(2, '0'),
    m: minutes.toString(),
    ss: seconds.toString().padStart(2, '0'),
    s: seconds.toString(),
  }

  let formatted = format
  // Sort by length descending to avoid partial replacements
  Object.keys(formatMap)
    .sort((a, b) => b.length - a.length)
    .forEach((key) => {
      formatted = formatted.replace(new RegExp(key, 'g'), formatMap[key])
    })

  return formatted
}

// Alias for convertToJalali for backward compatibility
export function formatJalali(gregorianDate, format = 'jYYYY/jMM/jDD') {
  return convertToJalali(gregorianDate, format)
}

// Alias for convertToJalali with time format for backward compatibility
export function convertToJalaliWithTime(gregorianDate, format = 'jYYYY/jMM/jDD - HH:mm') {
  return convertToJalali(gregorianDate, format)
}

// Convert Persian/Jalali date to Gregorian format with comprehensive formatting support
export function convertToGregorian(jalaaliDate, format = 'YYYY-MM-DD') {
  const weekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_')
  const months =
    'January_February_March_April_May_June_July_August_September_October_November_December'.split(
      '_'
    )

  if (!jalaaliDate) return null

  // Handle different input formats - could be date string or current timestamp
  let jYear
  let jMonth
  let jDay
  let hours = 0
  let minutes = 0
  let seconds = 0

  if (typeof jalaaliDate === 'number') {
    // If it's a timestamp, convert to current Jalali date with current time
    const date = new Date(jalaaliDate)
    const jalali = toJalaali(date)
    jYear = jalali.jy
    jMonth = jalali.jm
    jDay = jalali.jd
    hours = date.getHours()
    minutes = date.getMinutes()
    seconds = date.getSeconds()
  } else {
    // Parse Jalali date string (could include time)
    const parts = jalaaliDate.toString().split(/[\s:T-]/)
    const datePart = parts[0]
    const [year, month, day] = datePart.split('/').map(Number)
    jYear = year
    jMonth = month
    jDay = day

    // Extract time if provided
    if (parts.length > 1) {
      hours = Number.parseInt(parts[1], 10) || 0
      minutes = Number.parseInt(parts[2], 10) || 0
      seconds = Number.parseInt(parts[3], 10) || 0
    }
  }

  const { gy: year, gm: month, gd: day } = toGregorian(jYear, jMonth, jDay)

  const gWeekday = new Date(
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  ).getDay()

  const formatMap = {
    YYYY: year.toString(),
    YY: year.toString().slice(-2),
    MMMM: months[month - 1],
    MMM: months[month - 1]?.slice(0, 3),
    MM: month.toString().padStart(2, '0'),
    M: month.toString(),
    DD: day.toString().padStart(2, '0'),
    D: day.toString(),
    dddd: weekdays[gWeekday],
    ddd: weekdays[gWeekday].slice(0, 3),
    HH: hours.toString().padStart(2, '0'),
    mm: minutes.toString().padStart(2, '0'),
    ss: seconds.toString().padStart(2, '0'),
  }

  let formatted = format
  // Sort by length descending to avoid partial replacements
  Object.keys(formatMap)
    .sort((a, b) => b.length - a.length)
    .forEach((key) => {
      formatted = formatted.replace(new RegExp(key, 'g'), formatMap[key])
    })

  return formatted
}

// Alias for convertToGregorian with time format for backward compatibility
export function convertToGregorianWithTime(jalaaliDate, format = 'YYYY-MM-DD HH:mm') {
  return convertToGregorian(jalaaliDate, format)
}

export function toHHMM(time) {
  if (typeof time !== 'string') return time ?? ''
  return time.length === 5 ? time : time.slice(0, 5)
}

export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hours = d.getHours()
  const minutes = d.getMinutes()
  const seconds = d.getSeconds()

  // Create format map with all possible replacements
  const replacements = {
    YYYY: year.toString(),
    YY: year.toString().slice(-2),
    MM: month.toString().padStart(2, '0'),
    M: month.toString(),
    DD: day.toString().padStart(2, '0'),
    D: day.toString(),
    HH: hours.toString().padStart(2, '0'),
    H: hours.toString(),
    mm: minutes.toString().padStart(2, '0'),
    m: minutes.toString(),
    ss: seconds.toString().padStart(2, '0'),
    s: seconds.toString(),
  }

  // Replace all patterns in order of longest to shortest to avoid partial replacements
  let formatted = format
  Object.keys(replacements)
    .sort((a, b) => b.length - a.length)
    .forEach((key) => {
      formatted = formatted.replace(new RegExp(key, 'g'), replacements[key])
    })

  return formatted
}

// Add 1 or more units to a date
export function addToDate(date, amount, unit) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return d

  switch (unit) {
    case 'second':
    case 'seconds': {
      d.setSeconds(d.getSeconds() + amount)
      break
    }
    case 'minute':
    case 'minutes': {
      d.setMinutes(d.getMinutes() + amount)
      break
    }
    case 'hour':
    case 'hours': {
      d.setHours(d.getHours() + amount)
      break
    }
    case 'day':
    case 'days': {
      d.setDate(d.getDate() + amount)
      break
    }
    case 'month':
    case 'months': {
      d.setMonth(d.getMonth() + amount)
      break
    }
    case 'year':
    case 'years': {
      d.setFullYear(d.getFullYear() + amount)
      break
    }
    default: {
      break
    }
  }

  return d
}

// Subtract 1 or more units from a date
export function subtractFromDate(date, amount, unit) {
  return addToDate(date, -amount, unit)
}

// Calculate difference between two dates
export function diffDates(date1, date2, unit = 'days') {
  const d1 = new Date(date1)
  const d2 = new Date(date2)

  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 0

  const diffMs = d1 - d2

  switch (unit) {
    case 'second':
    case 'seconds': {
      return Math.floor(diffMs / 1000)
    }
    case 'minute':
    case 'minutes': {
      return Math.floor(diffMs / (1000 * 60))
    }
    case 'hour':
    case 'hours': {
      return Math.floor(diffMs / (1000 * 60 * 60))
    }
    case 'day':
    case 'days': {
      return Math.floor(diffMs / (1000 * 60 * 60 * 24))
    }
    case 'month':
    case 'months': {
      let months = (d1.getFullYear() - d2.getFullYear()) * 12
      months -= d2.getMonth()
      months += d1.getMonth()
      return months
    }
    case 'year':
    case 'years': {
      return d1.getFullYear() - d2.getFullYear()
    }
    default: {
      return 0
    }
  }
}

export function startOfMonth(date) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function getWeekday(date) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return 0
  const day = d.getDay()
  return day === 0 ? 7 : day // Convert Sunday from 0 to 7
}

export function formatDateRange(startDate, endDate) {
  const hasStart = startDate
  const hasExpiry = endDate

  if (!hasStart && !hasExpiry) return null

  try {
    const formattedStart = hasStart ? convertToJalali(new Date(startDate)) : ''
    const formattedExpiry = hasExpiry ? convertToJalali(new Date(endDate)) : ''

    if (formattedStart && formattedExpiry) {
      return `فعال از ${formattedStart} تا ${formattedExpiry}`
    }
    if (formattedStart) {
      return `فعال از ${formattedStart}`
    }
    if (formattedExpiry) {
      return `فعال تا ${formattedExpiry}`
    }
  } catch {
    return null
  }

  return null
}
