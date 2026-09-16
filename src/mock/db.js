// localStorage-backed mock database
import * as data from './seeds/data'
import { serves as servesSeed, branchList, doctors, workingHours } from './seeds/reference'

const STORAGE_KEY = 'crm-mock-db'
const VERSION = 12

let cache = null

export const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // storage full — ignore
  }
}

const buildInitialDb = () =>
  structuredClone({
    version: VERSION,
    users: data.users,
    owners: data.owners,
    bookings: data.bookings,
    contacts: data.contacts,
    tasks: data.tasks,
    treatmentPlans: data.treatmentPlans,
    performedServes: data.performedServes,
    drafts: [],
    campaigns: data.campaigns,
    coupons: data.coupons,
    imports: data.imports,
    attendance: data.attendance,
    rooms: data.rooms,
    transactions: data.transactions,
    introductionMethods: data.introductionMethods,
    serves: servesSeed,
    branches: branchList,
    roles: data.roles,
    settings: {
      // Weekly clinic work time (WorkWeeklyCalendar reads workTimes[weekday]).
      'general.workTime': {
        workTimes: Object.fromEntries(
          ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(
            (day, index) => [
              day,
              {
                start: '09:00:00',
                end: '20:00:00',
                weekday: index,
                visit_count_per_session: 2,
                is_active: true,
              },
            ]
          )
        ),
      },
      // DiscountSetting (treatmentPlanPriceConfig)
      'general.treatmentPlanPriceConfig': {
        maxDiscountPercent: 20,
        maxDiscountPrice: 10_000_000,
        minPrepayPrice: 1_000_000,
      },
      // AutoVipSetting (treatmentPlanPriceForVip)
      'general.treatmentPlanPriceForVip': { price: 5_000_000 },
      // TagSettings color palette (reads colors[].{name, hex}).
      'general.colors': {
        colors: [
          { name: 'آبی', hex: '#1976d2' },
          { name: 'قرمز', hex: '#d32f2f' },
          { name: 'سبز', hex: '#388e3c' },
          { name: 'نارنجی', hex: '#f57c00' },
          { name: 'بنفش', hex: '#7b1fa2' },
          { name: 'صورتی', hex: '#c2185b' },
          { name: 'فیروزه‌ای', hex: '#0097a7' },
          { name: 'خاکستری', hex: '#455a64' },
        ],
      },
      // SystemMessages defaults (booking submitted / reminder / birthday / welcome).
      'general.messages': {
        bookingSubmittedMsg: {
          autoSend: true,
          title: 'پیام ثبت نوبت',
          info: 'پس از ثبت نوبت برای کاربر ارسال می‌شود',
          message: '{{name}} عزیز، نوبت شما در تاریخ {{bookedAt}} ثبت شد.\n{{clinicName}}',
        },
        bookingDueMsg: {
          autoSend: true,
          title: 'یادآوری نوبت',
          info: 'قبل از زمان نوبت برای کاربر ارسال می‌شود',
          message:
            '{{firstName}} عزیز، یادآوری می‌شود نوبت شما در تاریخ {{bookedAt}} است.\nکارشناس: {{adviserName}}',
        },
        birthdayMsg: {
          autoSend: false,
          title: 'پیام تولد',
          info: 'در روز تولد کاربر ارسال می‌شود',
          message: '{{firstName}} عزیز، تولدتان مبارک! 🎂\n{{clinicName}}',
        },
        welcomeMsg: {
          autoSend: false,
          title: 'پیام خوش‌آمدگویی',
          info: 'پس از ثبت‌نام کاربر ارسال می‌شود',
          message: '{{name}} عزیز، به {{clinicName}} خوش آمدید.',
        },
      },
      // SmsPanel channel config.
      'general.smsChannel': { sendSms: true, from: '3000505', key: '', sendSmsUrl: '' },
      // QuickMessages defaults (keyed msg1, msg2 — component builds the list from keys).
      'general.quickMessages': {
        msg1: {
          title: 'تولد',
          info: 'پیام تبریک تولد کاربر',
          message: '{{firstName}} عزیز، تولد شما مبارک',
        },
        msg2: {
          title: 'ثبت نوبت',
          info: 'ارسال پس از ثبت نوبت',
          message: '{{name}} عزیز، نوبت شما در {{bookedAt}} ثبت شد',
        },
      },
    },
    // TagSettings / TagSelect pick from these (items envelope).
    tags: [
      { id: 1, name: 'VIP', color: '#d32f2f' },
      { id: 2, name: 'بازگشت', color: '#388e3c' },
      { id: 3, name: 'مهم', color: '#f57c00' },
    ],
    accounting: [],
    surveys: [],
    feedbacks: [],
    announcements: [],
    installments: [
      {
        id: 1,
        month: 6,
        percentage: 0,
        profit: 12,
        max_prepay: 50,
        min_price: 5_000_000,
        order: 1,
        is_active: true,
      },
      {
        id: 2,
        month: 12,
        percentage: 0,
        profit: 18,
        max_prepay: 40,
        min_price: 10_000_000,
        order: 2,
        is_active: true,
      },
    ],
    branchDoctors: doctors.map((doc, index) => ({
      id: index + 1,
      branch_id: 24,
      doctor: { id: doc.id, first_name: '', name: doc.name, is_default: index === 0 },
      working_hours: workingHours,
    })),
  })

export const initDb = () => {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.version === VERSION) {
        cache = parsed
        return cache
      }
    }
  } catch {
    // fallthrough — reseed
  }
  cache = buildInitialDb()
  persist()
  return cache
}

export const db = () => initDb()

export const coll = (name) => {
  const d = initDb()
  if (!Array.isArray(d[name])) {
    d[name] = []
    persist()
  }
  return d[name]
}

export const nextId = (name) =>
  coll(name).reduce((max, item) => Math.max(max, Number(item.id) || 0), 1000) + 1

export const findById = (name, id) => coll(name).find((item) => String(item.id) === String(id))

export const removeById = (name, id) => {
  const list = coll(name)
  const idx = list.findIndex((item) => String(item.id) === String(id))
  if (idx !== -1) list.splice(idx, 1)
  persist()
  return idx !== -1
}
