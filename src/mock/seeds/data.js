// Simplified demo data — a few schema-shaped records per list.
// Field names mirror the real API snapshots exactly; volume kept minimal.

// Rooms + roles seeds live with the other static clinic reference data.
import {
  serves as referenceServes,
  doctors,
  diseases,
  FILE_STATUSES,
  filePlaceholder,
} from './reference'

export { rooms, roles } from './reference'

const branch = { id: 24, name: 'شعبه سعادت‌آباد' }
const advisor = { id: 821_964, name: 'نیلوفر احمدی' }

const testUsers = [
  { id: 1, first_name: 'رضا', name: 'محمدی', gender: 'male', mobile: '9121111111' },
  { id: 2, first_name: 'زهرا', name: 'احمدی', gender: 'female', mobile: '9122222222' },
  { id: 3, first_name: 'حسین', name: 'کریمی', gender: 'male', mobile: '9123333333' },
]

const baseUser = (u, extra = {}) => ({
  id: u.id,
  mobile: u.mobile,
  name: u.name,
  role: { id: 6, fa_title: 'کاربر عادی' },
  active_task_count: 1,
  contact_count: 2,
  task_count: 1,
  active_treatment_plan: null,
  has_treatment_plan: false,
  advisor,
  creation_date: '2026-09-01T10:00:00.000000Z',
  first_name: u.first_name,
  gender: u.gender,
  document_number: null,
  is_passenger: false,
  is_incomplete: false,
  has_file: false,
  is_vip: false,
  vip_type: 0,
  last_status: { id: 40, title: 'در حال پیگیری' },
  method_of_introduction: {
    id: 4,
    fa_title: 'دوستان',
    en_title: 'friend',
    icon: 'carbon:friendship',
  },
  last_contact: {
    last_contact_at: '2026-09-08 10:00:00',
    last_contact_result_id: 20,
    last_contact_result_title: 'تماس موفق',
  },
  national_code: null,
  is_beta: false,
  ...extra,
})

// Medical history per user — every field of the GET medical-info contract is
// present (diseases array, medications, tobacco/alcohol) so no consumer reads
// an undefined layer.
const medicalInfo = (diseaseIds, medications, tobacco) => ({
  diseases: diseases.filter((d) => diseaseIds.includes(d.id)),
  consumed_medications_amount: medications,
  tobacco_alcohol_use: tobacco,
})

export const users = [
  baseUser(testUsers[0], {
    has_treatment_plan: true,
    role: { id: 2, fa_title: 'مشاور' },
    // REVN-9: implant base-count dropdown preselect
    implant_needed_teeth: 4,
    medical_info: medicalInfo([1, 2], 'متفورمین ۵۰۰ — روزی یک قرص', 'سیگار گاه‌به‌گاه'),
  }),
  baseUser(testUsers[1], {
    last_status: { id: 60, title: 'نوبت داده شد' },
    role: { id: 2, fa_title: 'مشاور' },
    medical_info: medicalInfo([4], 'قرص آلرژی فصلی', 'ندارد'),
  }),
  // role id 6 (کاربر عادی) — impersonation intentionally hidden for this one
  baseUser(testUsers[2], {
    is_passenger: true,
    medical_info: medicalInfo([], null, 'ندارد'),
  }),
]

export const owners = testUsers.map((u, i) => ({
  ...baseUser(u),
  confirmed_date: `2026-09-0${i + 4} 12:00:00`,
  serves: [{ id: 246, name: 'ایمپلنت' }],
  // BookingCoordinate reads activeTreatmentPlanServes[0] without a guard.
  active_treatment_plan_serves: [{ id: 246, title: 'ایمپلنت' }],
  branch,
  introduced_count: i + 1,
}))

const bookingBase = (id, u, type, date, time, treatmentPlan = null) => ({
  id,
  user: { id: u.id, first_name: u.first_name, name: u.name, mobile: u.mobile, gender: u.gender },
  advisor,
  assign_to: advisor.id,
  created_by: 'نیلوفر احمدی',
  type,
  date,
  time,
  // Combined datetime — the bookings list column and the TP booking dropdown read bookingAt.
  booking_at: `${date} ${time}:00`,
  doctor: doctors[id % doctors.length],
  branch,
  serves: [],
  treatment_plan: treatmentPlan,
  visit_type: type === 1 ? { id: 1, title: 'ویزیت حضوری' } : null,
  doc_number: null,
  description: null,
  performed_at: null,
  has_treatment_description: false,
  status: { id: 1, title: 'ثبت شده' },
})

// Slim treatment-plan reference embedded on booking rows (TpDescriptionButton,
// goToTreatmentPlan and the booking edit sidebar only need id + public link).
const tpRef = (id) => ({
  id,
  public_hash_key: `demo-tp-${id}`,
  public_link: `/tp/demo-tp-${id}`,
})

// Tiny generated WAV (8 kHz, 8-bit mono chime) inlined as a data URL so the
// seeded booking voices play offline — no network, no blob URLs, and the
// payload survives the localStorage JSON round-trip (~13 KB base64 per voice).
const buildVoiceDataUrl = (freq = 440, seconds = 1.2) => {
  const rate = 8000
  const samples = Math.floor(rate * seconds)
  const buffer = new ArrayBuffer(44 + samples)
  const view = new DataView(buffer)
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.codePointAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + samples, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, rate, true)
  view.setUint32(28, rate, true)
  view.setUint16(32, 1, true)
  view.setUint16(34, 8, true) // bits per sample
  writeStr(36, 'data')
  view.setUint32(40, samples, true)
  for (let i = 0; i < samples; i += 1) {
    const t = i / rate
    const envelope = Math.min(1, t * 8) * Math.exp(-t * 2.2)
    const value = Math.sin(2 * Math.PI * freq * t) * envelope
    view.setUint8(44 + i, Math.round(128 + value * 100))
  }
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const CHUNK = 0x80_00
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK))
  }
  return `data:audio/wav;base64,${btoa(binary)}`
}

export const bookings = [
  bookingBase(101, testUsers[0], 1, '2026-09-10', '10:00'),
  bookingBase(102, testUsers[1], 1, '2026-09-11', '12:00'),
  bookingBase(103, testUsers[2], 1, '2026-09-12', '16:00'),
  {
    ...bookingBase(201, testUsers[0], 2, '2026-09-15', '09:00', tpRef(501)),
    // Booking 201 already has one seeded performed serve (see performedServes).
    performed_at: '2026-09-15 09:30:00',
    has_treatment_description: true,
    // AW-152: seeded session voices (tab «فایل های صوتی») — playable data URLs.
    voices: [
      {
        id: 9001,
        path: buildVoiceDataUrl(440),
        name: 'توضیحات جلسه اول.wav',
        duration: 1200,
        type: 'booking.voice',
        created_at: '2026-09-15 09:45:00',
      },
      {
        id: 9002,
        path: buildVoiceDataUrl(330),
        name: 'یادداشت پیگیری.wav',
        duration: 1200,
        type: 'booking.voice',
        created_at: '2026-09-15 10:05:00',
      },
    ],
  },
  bookingBase(202, testUsers[1], 2, '2026-09-16', '11:00', tpRef(502)),
  bookingBase(203, testUsers[2], 2, '2026-09-17', '15:00', tpRef(503)),
]

const contact = (id, u, result, contactedAt, billsec, duration) => ({
  id,
  user: {
    id: u.id,
    first_name: u.first_name,
    name: u.name,
    gender: u.gender,
    mobile: u.mobile,
    role: { id: 6 },
    is_vip: false,
    vip_type: 0,
    is_passenger: false,
  },
  result_id: result.id,
  result_title: result.title,
  branch,
  type: 1,
  created_by: 'نیلوفر احمدی',
  advisor_name: 'نیلوفر احمدی',
  contacted_at: contactedAt,
  description: null,
  billsec,
  duration,
  recordingfile: '',
  serves: [],
  transcript_summary: null,
})

export const contacts = [
  contact(301, testUsers[0], { id: 20, title: 'تماس موفق' }, '2026-09-08 10:00:00', 45, 60),
  contact(302, testUsers[1], { id: 1, title: 'پاسخ نداد' }, '2026-09-08 11:00:00', 0, 30),
  contact(303, testUsers[2], { id: 13, title: 'مشغول/پشت خطی' }, '2026-09-08 12:00:00', 0, 25),
]

const task = (id, u, type, dueDate, priority, description) => ({
  id,
  title: null,
  user: {
    id: u.id,
    first_name: u.first_name,
    name: u.name,
    gender: u.gender,
    mobile: u.mobile,
    role: { id: 6 },
    advisor,
    is_vip: false,
    vip_type: 0,
    is_passenger: false,
    city: { id: 288, name: 'کرج' },
  },
  advisor,
  assignee_name: 'نیلوفر احمدی',
  assign_to: advisor.id,
  created_by: 'نیلوفر احمدی',
  type,
  due_date: dueDate,
  done_at: null,
  status: 2,
  status_title: 'در حال انجام',
  priority,
  description,
})

export const tasks = [
  task(
    401,
    testUsers[0],
    { id: 2, title: 'نوبت', template_id: null },
    '2026-09-12 15:00:00',
    3,
    null
  ),
  task(
    402,
    testUsers[1],
    { id: 5, title: 'قبل ویزیت', template_id: null },
    '2026-09-10 12:00:00',
    2,
    null
  ),
  task(
    403,
    testUsers[2],
    { id: 1, title: 'عکس OPG', template_id: null },
    '2026-09-09 09:00:00',
    1,
    'یادآوری ارسال عکس'
  ),
  // survey follow-up tasks — TaskList shows the پیگیری button for follow-up
  // kind slugs (followupKindSlugs) and FollowUpSurveyModal reads the matching question set
  task(
    404,
    testUsers[1],
    {
      id: 11,
      title: 'پیگیری پس از نخستین ویزیت',
      slug: 'first-visit-follow-up',
      template_id: null,
    },
    '2026-09-18 10:00:00',
    2,
    null
  ),
  task(
    405,
    testUsers[2],
    { id: 12, title: 'پیگیری پس از درمان', slug: 'post-treatment-follow-up', template_id: null },
    '2026-09-17 09:30:00',
    1,
    null
  ),
]

// Follow-up survey question sets served by GET v1/survey/followups/{taskId}.
// Answer persistence lives on the task row itself (survey_answers / call_answered).
export const followUpSurveys = [
  {
    kindSlug: 'first-visit-follow-up',
    kindTitle: 'نظرسنجی پس از نخستین ویزیت',
    items: [
      {
        id: 'fv1',
        title: 'میزان رضایت شما از نخستین بازدید کلینیک چقدر بود؟',
        type: 'number',
        min: 1,
        max: 5,
        showAverage: true,
      },
      {
        id: 'fv2',
        title: 'برخورد و پاسخگویی کارشناسان پذیرش را چگونه ارزیابی می‌کنید؟',
        type: 'choice',
        options: [
          { value: 'excellent', label: 'عالی' },
          { value: 'good', label: 'خوب' },
          { value: 'fair', label: 'متوسط' },
          { value: 'poor', label: 'ضعیف' },
        ],
      },
      {
        id: 'fv3',
        title: 'آیا نوبت شما در زمان مقرر آغاز شد؟',
        type: 'choice',
        options: [
          { value: 'yes', label: 'بله' },
          { value: 'almost', label: 'با تاخیر کم' },
          { value: 'no', label: 'خیر' },
        ],
      },
      {
        id: 'fv4',
        title: 'توضیحات یا پیشنهاد شما برای بهبود خدمات',
        type: 'text',
      },
    ],
  },
  {
    kindSlug: 'post-treatment-follow-up',
    kindTitle: 'نظرسنجی پیگیری پس از درمان',
    items: [
      {
        id: 'pt1',
        title: 'میزان رضایت شما از نتیجه درمان چقدر بود؟',
        type: 'number',
        min: 1,
        max: 5,
        showAverage: true,
      },
      {
        id: 'pt2',
        title: 'آیا پس از پایان درمان درد یا حساسیت داشتید؟',
        type: 'choice',
        options: [
          { value: 'no', label: 'خیر' },
          { value: 'mild', label: 'کم' },
          { value: 'severe', label: 'زیاد' },
        ],
      },
      {
        id: 'pt3',
        title: 'آیا کلینیک را به دوستان و آشنایان پیشنهاد می‌کنید؟',
        type: 'choice',
        options: [
          { value: 'definitely', label: 'حتما پیشنهاد می‌کنم' },
          { value: 'probably', label: 'احتمالا پیشنهاد می‌کنم' },
          { value: 'no', label: 'پیشنهاد نمی‌کنم' },
        ],
      },
      {
        id: 'pt4',
        title: 'نظر نهایی شما درباره روند درمان',
        type: 'text',
      },
      {
        // AW-169: زمان انتظار — NumberField (دقیقه), validated as integer >= 0
        id: 'pt5',
        title: 'چند دقیقه در اتاق انتظار سپری کردید؟',
        type: 'time',
      },
    ],
  },
]

// Questions copied from the reference serves (pricing catalog) with a proposed
// pivot per item — the shape the TP upsert tabs and the شرح درمان quick-add
// chips consume (items[].questions[] with pivot flags).
const tpQuestionsFromReference = (serveId) => {
  const serve = referenceServes.find((s) => s.id === serveId)
  return (serve?.questions ?? []).map((qq) => ({
    id: qq.id,
    title: qq.title,
    type: qq.type,
    coefficient: qq.coefficient,
    items: qq.items.map((it) => ({
      id: it.id,
      title: it.title,
      price: it.price,
      pivot: { unit: 1, is_draft: false, is_proposed: true, is_performed: false },
    })),
  }))
}

const treatmentPlan = (id, u, serveId, price, teeth, extra = {}) => {
  const serve = referenceServes.find((s) => s.id === serveId)
  const prepay = Math.round(price / 6)
  return {
    id,
    user: {
      id: u.id,
      first_name: u.first_name,
      name: u.name,
      mobile: u.mobile,
    },
    advisor,
    created_by: { id: 821_964, name: 'نیلوفر احمدی' },
    status: 2,
    status_title: 'در حال انجام',
    is_active: true,
    is_draft: false,
    is_performed: false,
    is_proposed: false,
    can_edit_active: true,
    total_price: price,
    total_cost: price,
    final_price: price,
    prepay,
    description: null,
    public_hash_key: `demo-tp-${id}`,
    // serves[].teeth is the showable-teeth format used by calculateTeeth
    serves: [{ id: serveId, serve_id: serveId, title: serve?.title, teeth }],
    items: [
      {
        id: id * 10 + 1,
        serve_id: serveId,
        title: serve?.title,
        serve_title: serve?.title,
        price,
        questions: tpQuestionsFromReference(serveId),
      },
    ],
    // FinancialDetailsDialog reads prepayment/prepayment_percent off the row.
    prepayment: prepay,
    prepayment_percent: 20,
    created_at: '2026-09-05 10:00:00',
    branch,
    ...extra,
  }
}

export const treatmentPlans = [
  treatmentPlan(501, testUsers[0], 246, 30_000_000, [
    { position: 'TL', toothNumber: 3 },
    { position: 'TL', toothNumber: 4 },
  ]),
  treatmentPlan(502, testUsers[1], 253, 80_000_000, [
    { position: 'TR', toothNumber: 3 },
    { position: 'TR', toothNumber: 4 },
  ]),
  treatmentPlan(503, testUsers[2], 257, 6_000_000, [{ position: 'BR', toothNumber: 5 }]),
]

// Performed serves (شرح درمان rows) — grouped by booking on the description
// page. teeth uses ONE scalar display-number per entry (the card's tooth chips
// render tooth.number scalars; array payloads are normalized in the handler).
export const performedServes = [
  {
    id: 2001,
    treatment_plan_id: 501,
    booking_id: 201,
    serve_industry_id: 246,
    serve_industry_title: 'ایمپلنت',
    question_id: 2461,
    question_title: 'برند ایمپلنت',
    item_id: 24_611,
    item_title: 'کره‌ای',
    unit: 1,
    price: 15_000_000,
    price_with_profit: 15_000_000,
    teeth: [
      { position: 'TL', number: 3 },
      { position: 'TL', number: 4 },
    ],
    description: 'ایمپلنت کره‌ای برای دو دندان فک بالا چپ در جلسه اول انجام شد.',
    performed_at: '2026-09-15 09:30:00',
  },
]

export const introductionMethods = [
  { id: 4, fa_title: 'دوستان', en_title: 'friend', icon: 'carbon:friendship', status: 1 },
  { id: 10, fa_title: 'پیامک-عدد', en_title: 'sms_number', icon: 'IconMessage2', status: 1 },
  { id: 14, fa_title: 'ایتا', en_title: 'eitaa', icon: 'eitaa', status: 1 },
  { id: 53, fa_title: 'نامشخص', en_title: 'unknown', icon: 'IconQuestionMark', status: 0 },
]

export const campaigns = [
  {
    id: 601,
    title: 'کمپین اینستاگرام',
    budget: 50_000_000,
    start_date: '2026-08-01',
    end_date: '2026-09-30',
    status: 1,
    status_title: 'فعال',
    introduced_count: 12,
  },
  {
    id: 602,
    title: 'کمپین یلوادوایز',
    budget: 20_000_000,
    start_date: '2026-09-01',
    end_date: '2026-09-30',
    status: 1,
    status_title: 'فعال',
    introduced_count: 5,
  },
]

export const coupons = [
  {
    id: 701,
    code: 'MOCK1234',
    amount: 500_000,
    is_active: true,
    expire_at: '2026-12-31',
    usage_count: 0,
  },
]

export const imports = [
  {
    id: 801,
    file_name: 'users.xlsx',
    status: 1,
    status_title: 'تکمیل شده',
    count: 25,
    created_at: '2026-09-01 10:00:00',
    campaign_id: 601,
  },
]

// Attendance rows mirror the API shape: nested user object, full datetimes,
// admin (registrar) and room. Dates are built from "today" so the present-tab
// `filter[today]=1` matches whenever the demo db is (re)seeded.
const todayStr = () => new Date().toISOString().slice(0, 10)
const attendanceRow = (id, u, date, checkIn, checkOut, room) => ({
  id,
  user: { id: u.id, first_name: u.first_name, name: u.name, mobile: u.mobile, gender: u.gender },
  checked_in_at: `${date} ${checkIn}:00`,
  checked_out_at: checkOut ? `${date} ${checkOut}:00` : null,
  admin: { id: 821_964, name: 'نیلوفر احمدی' },
  room: room ? { id: room, name: `اتاق ${room}` } : null,
  branch,
})

export const attendance = [
  attendanceRow(901, testUsers[0], todayStr(), '09:00', null, 1),
  attendanceRow(902, testUsers[1], '2026-09-05', '10:30', null, 2),
  attendanceRow(903, testUsers[2], '2026-09-06', '11:00', '19:30', null),
]

export const transactions = [
  {
    id: 1001,
    user_id: 1,
    amount: 5_000_000,
    type: 'income',
    type_title: 'دریافت',
    created_at: '2026-09-06 12:00:00',
    description: 'پیش پرداخت',
  },
]

// Radiology/medical documents (v1/user/{id}/files/{type}). Statuses and
// placeholder paths come from the shared reference constants; the mock
// placeholders under /mocks keep the image preview modal renderable.
const radFile = (id, userId, type, name, status, createdAt) => ({
  id,
  user_id: userId,
  entity_type: 'user',
  entity_id: userId,
  type,
  name,
  path: filePlaceholder(type),
  status,
  created_at: createdAt,
})

export const files = [
  radFile(3001, 1, 'user.opg', 'OPG-کل-فک.jpg', FILE_STATUSES.verified, '2026-08-20 10:30:00'),
  radFile(3002, 1, 'user.cbct', 'CBCT-ناحیه-46.jpg', FILE_STATUSES.verified, '2026-09-02 14:10:00'),
  radFile(3003, 2, 'user.opg', 'OPG-اولیه.jpg', FILE_STATUSES.pending, '2026-09-10 09:00:00'),
]

// AW-158: one cheque for user 2 (active TP 502) — the header warning banner
// counts the remaining active-TP patients (users 1 and 3 → count 2). Cheques
// registered later via POST v1/user/{id}/cheques shrink the count on refresh.
export const cheques = [
  {
    id: 6001,
    user_id: 2,
    amount: 20_000_000,
    cheque_number: '845123',
    cheque_type: 'PHYSICAL',
    bank: { id: 1, title: 'بانک ملت' },
    bank_branch_title: 'شعبه ونک',
    due_date: '2026-12-01',
    status: { id: 1, title: 'در جریان' },
    created_at: '2026-09-10 09:00:00',
  },
]

// AW-163: branch status history — old/new value snapshots per change. The
// `data` field is a JSON string (phone/address/location) that the composable
// decodes per sub-key; newest entry first so PUT-appended rows stay on top.
export const branchStatusHistory = [
  {
    id: 2,
    branch_id: 24,
    user: { first_name: 'نیلوفر', name: 'احمدی' },
    created_at: '2026-09-12 16:40:00',
    old_values: {
      status: 1,
      name: 'شعبه سعادت‌آباد',
      contract_date: '2024-03-01',
      activation_date: '2024-04-01',
      data: JSON.stringify({
        phone: ['02112345678', '02188001234'],
        address: 'تهران، سعادت‌آباد، میدان کاج',
        location: { lat: 35.7834, lng: 51.3731 },
      }),
    },
    new_values: {
      status: 1,
      name: 'شعبه سعادت‌آباد',
      contract_date: '2025-03-01',
      activation_date: '2024-04-01',
      data: JSON.stringify({
        phone: ['02112345678'],
        address: 'تهران، سعادت‌آباد، میدان کاج',
        location: { lat: 35.7834, lng: 51.3731 },
      }),
    },
  },
  {
    id: 1,
    branch_id: 24,
    user: { first_name: 'زهرا', name: 'احمدی' },
    created_at: '2026-09-05 10:15:00',
    old_values: {
      status: 2,
      name: 'شعبه سعادت‌آباد',
      contract_date: '2024-03-01',
      activation_date: null,
      data: JSON.stringify({
        phone: ['02112345678'],
        address: 'تهران، سعادت‌آباد',
        location: '',
      }),
    },
    new_values: {
      status: 1,
      name: 'شعبه سعادت‌آباد',
      contract_date: '2024-03-01',
      activation_date: '2024-04-01',
      data: JSON.stringify({
        phone: ['02112345678', '02188001234'],
        address: 'تهران، سعادت‌آباد، میدان کاج',
        location: { lat: 35.7834, lng: 51.3731 },
      }),
    },
  },
]
