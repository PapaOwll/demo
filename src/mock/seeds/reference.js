// Reference / static data: current user, sidebar modules, enums, lookups.

// Full branch shape consumed by ClinicSetting branches tab + use-branch-status
// (status/status_id, contract/activation dates, nested data payload).
export const branchList = [
  {
    id: 24,
    name: 'شعبه سعادت‌آباد',
    is_active: true,
    status_id: 1,
    status: { id: 1 },
    contract_date: '2024-03-01',
    activation_date: '2024-04-01',
    data: { phone: ['02112345678'], address: 'تهران، سعادت‌آباد', location: '' },
  },
  {
    id: 27,
    name: 'شعبه شهرک غرب',
    is_active: true,
    status_id: 1,
    status: { id: 1 },
    contract_date: '2024-05-01',
    activation_date: '2024-06-01',
    data: { phone: ['02187654321'], address: 'تهران، شهرک غرب', location: '' },
  },
]

export const advisorList = [
  {
    id: 821_964,
    name: 'نیلوفر احمدی',
    mobile: '9120000000',
    role: { id: 1, title: 'مدیر', fa_title: 'مدیر' },
  },
  {
    id: 1_016_998,
    name: 'هدی',
    mobile: '9121111111',
    role: { id: 2, title: 'مشاور', fa_title: 'مشاور' },
  },
  {
    id: 1_016_999,
    name: 'سمانه',
    mobile: '9122222222',
    role: { id: 2, title: 'مشاور', fa_title: 'مشاور' },
  },
]

// Full action set — demo user can do everything (getPerms looks these up per module/subModule)
const PERMS = ['add', 'update', 'delete', 'view', 'manage', 'mass-update'].map((key) => ({ key }))

const mod = (id, key, title, icon, subModules = []) => ({
  id,
  key,
  title,
  icon,
  hidden: false,
  status: 1,
  permissions: PERMS,
  subModules,
})
const sub = (key, title) => ({ key, title, status: 1, hidden: false, permissions: PERMS })

export const currentUser = {
  user: { id: 821_964, mobile: '9120000000', name: 'نیلوفر احمدی' },
  branch: { id: 24 },
  role: {
    id: 1,
    title: 'مدیر',
    permissions: PERMS,
    modules: [
      mod(1, 'dashboard', 'داشبورد', 'IconLayoutDashboard'),
      mod(2, 'user', 'کاربران', 'IconUsers', [
        {
          key: 'impersonate',
          title: 'جعل هویت',
          status: 1,
          // Hidden from the sidebar menu — the permission is still granted,
          // so the impersonation actions in UserMenu keep working.
          hidden: true,
          permissions: PERMS,
        },
      ]),
      mod(3, 'visit', 'ویزیت‌ها', 'IconStethoscope'),
      mod(4, 'booking', 'انجام کار', 'IconCalendarEvent'),
      mod(5, 'ownedUsers', 'منتظر نوبتدهی', 'IconUsersGroup'),
      mod(6, 'calendar', 'تقویم', 'IconCalendar'),
      mod(7, 'contact', 'تماس‌ها', 'IconPhone'),
      mod(8, 'task', 'وظایف', 'IconListCheck'),
      mod(9, 'attendance', 'حضور و غیاب', 'IconClock'),
      mod(10, 'treatment-plan', 'طرح درمان', 'IconClipboardList', [
        sub('create', 'ثبت طرح درمان'),
        sub('treatment-plan-list', 'لیست طرح‌های درمان'),
        sub('doctor-review', 'بررسی دکتر'),
        {
          key: 'perform-treatment-plan',
          title: 'اجرا',
          status: 1,
          hidden: true,
          permissions: PERMS,
        },
        {
          key: 'treatmentPlanFinancial',
          title: 'مالی',
          status: 1,
          hidden: true,
          permissions: PERMS,
        },
      ]),
      mod(11, 'ads', 'تبلیغات', 'IconAd', [
        sub('campaign', 'کمپین‌ها'),
        sub('imports', 'لیست ورودی‌ها'),
        sub('coupon', 'کوپن‌ها'),
        sub('introductionMethod', 'روش‌های آشنایی'),
        sub('feedback', 'بازخوردها'),
      ]),
      mod(12, 'survey', 'نظرسنجی', 'IconMessageChatbot', [
        sub('survey-lists', 'لیست نظرسنجی‌ها'),
        sub('survey-results', 'نتایج نظرسنجی'),
      ]),
      mod(13, 'setting', 'تنظیمات', 'IconSettings', [
        sub('generalSetting', 'تنظیمات عمومی'),
        sub('clinicSetting', 'تنظیمات کلینیک'),
        sub('pricing', 'تعرفه‌ها'),
        sub('operatorSetting', 'تنظیمات کارمندان'),
        sub('roleSetting', 'تنظیمات دسترسی'),
        sub('personalSetting', 'تنظیمات شخصی'),
        sub('schedule', 'تقویم'),
      ]),
    ],
  },
  // Clinic-info fields merged into the same response (ClinicSetting reads
  // name / instagram / icon.path / data.instagram from `v1/user/{industry}/current`).
  name: 'کلینیک دمو',
  instagram: '@demo.clinic',
  icon: { id: null, path: '' },
  data: { instagram: '@demo.clinic' },
}

export const userStatuses = [
  { id: 1, title: 'بدون وضعیت' },
  { id: 40, title: 'در حال پیگیری' },
  { id: 60, title: 'نوبت داده شد' },
  { id: 70, title: 'ویزیت شده' },
]

export const roles = [
  { id: 1, title: 'مدیر', fa_title: 'مدیر', slug: 'manager' },
  { id: 2, title: 'مشاور', fa_title: 'مشاور', slug: 'advisor' },
  { id: 6, title: 'کاربر عادی', fa_title: 'کاربر عادی', slug: 'user' },
]

export const introductionMethods = [
  { id: 4, fa_title: 'دوستان', en_title: 'friend', icon: 'carbon:friendship' },
  { id: 10, fa_title: 'پیامک-عدد', en_title: 'sms_number', icon: 'IconMessage2' },
  { id: 14, fa_title: 'ایتا', en_title: 'eitaa', icon: 'eitaa' },
  { id: 53, fa_title: 'نامشخص', en_title: 'unknown', icon: 'IconQuestionMark' },
]

// Serves with pricing questions — the shape consumed by the TP upsert tabs,
// the /settings/pricing page and the perform page. Question types mirror
// QUESTION_TYPE: 1 multiple, 2 yes/no, 3 per-unit, 4 per-teeth, 5 per-jaw,
// 6 per-quadrant, 7 simple-multiple, 11 unit-with-teeth.
const qItem = (id, title, price) => ({ id, title, price, is_active: true, is_public: true })
const q = (serveId, id, title, type, items, coefficient = 1) => ({
  id,
  title,
  type,
  coefficient,
  serve_industry_id: serveId,
  items: items.map((it) => ({ ...it, serve_industry_id: serveId, serve_industry_question_id: id })),
})

export const serves = [
  {
    id: 246,
    serve_id: 246,
    title: 'ایمپلنت',
    name: 'ایمپلنت',
    is_active: true,
    questions: [
      q(246, 2461, 'برند ایمپلنت', 1, [
        qItem(24_611, 'کره‌ای', 15_000_000),
        qItem(24_612, 'سوئیسی', 22_000_000),
        qItem(24_613, 'آلمانی', 28_000_000),
      ]),
      q(246, 2462, 'تعداد ایمپلنت', 3, [qItem(24_614, 'هر واحد', 3_000_000)]),
      q(246, 2463, 'نیاز به پیون استخوان دارد؟', 2, [
        qItem(24_615, 'بله', 8_000_000),
        qItem(24_616, 'خیر', 0),
      ]),
    ],
  },
  {
    id: 253,
    serve_id: 253,
    title: 'ارتودنسی',
    name: 'ارتودنسی',
    is_active: true,
    questions: [
      q(253, 2531, 'نوع ارتودنسی', 1, [
        qItem(25_311, 'ثابت فلزی', 80_000_000),
        qItem(25_312, 'ثابت سرامیکی', 95_000_000),
        qItem(25_313, 'متحرک', 45_000_000),
      ]),
      q(253, 2532, 'فک درگیر', 5, [
        qItem(25_314, 'فک بالا', 40_000_000),
        qItem(25_315, 'فک پایین', 40_000_000),
      ]),
      q(253, 2533, 'خدمات جانبی', 7, [
        qItem(25_316, 'رینیر', 6_000_000),
        qItem(25_317, 'نگهدارنده', 4_000_000),
      ]),
    ],
  },
  {
    id: 257,
    serve_id: 257,
    title: 'عصب‌کشی',
    name: 'عصب‌کشی',
    is_active: true,
    questions: [
      q(257, 2571, 'تعداد ریشه', 1, [
        qItem(25_711, 'تک ریشه', 4_000_000),
        qItem(25_712, 'چند ریشه', 6_000_000),
      ]),
      q(257, 2572, 'روکش دندان', 4, [qItem(25_713, 'هر دندان', 8_000_000)]),
      q(257, 2573, 'ترمیم ربع فک', 6, [qItem(25_714, 'هر ربع', 12_000_000)]),
    ],
  },
]

// Clinic rooms — consumed by RoomSelectField / RoomPopupSelect and the
// clinic settings locations tab via `v1/user/rooms` (items envelope).
export const rooms = [
  { id: 1, title: 'اتاق ۱', branch_id: 24 },
  { id: 2, title: 'اتاق ۲', branch_id: 24 },
  { id: 3, title: 'اتاق ۳', branch_id: 27 },
]

// Doctors shown on the booking calendar (doctor tab) — mock clinic staff.
export const doctors = [
  { id: 777, name: 'دکتر رضایی', role: { id: 4, title: 'دکتر' } },
  { id: 888, name: 'دکتر کاظمی', role: { id: 4, title: 'دکتر' } },
]

// Medical-history checkbox catalog (v1/user/diseases) — TpdDisease and the
// user medical-info payload both reference these ids.
export const diseases = [
  { id: 1, name: 'دیابت' },
  { id: 2, name: 'فشار خون بالا' },
  { id: 3, name: 'بیماری قلبی' },
  { id: 4, name: 'آلرژی به دارو' },
  { id: 5, name: 'بارداری' },
  { id: 6, name: 'اختلال انعقاد خون' },
  { id: 7, name: 'بیماری تیروئید' },
  { id: 8, name: 'آسم' },
  { id: 9, name: 'صرع' },
  { id: 10, name: 'هپاتیت' },
]

// File-row statuses — the TpDescription card filters on id 15 / slug
// 'verified'. Shared by the seeds and the upload handler.
export const FILE_STATUSES = {
  verified: { id: 15, slug: 'verified', title: 'تایید شده' },
  pending: { id: 14, slug: 'pending', title: 'در انتظار تایید' },
}

// Placeholder paths for mock file rows (files live under public/mocks).
// Non-radiology types fall back to the neutral document placeholder.
const FILE_PLACEHOLDERS = {
  'user.opg': 'sample-opg.svg',
  'user.cbct': 'sample-cbct.svg',
}
export const filePlaceholder = (type) =>
  `${import.meta.env.BASE_URL}mocks/${FILE_PLACEHOLDERS[type] ?? 'sample-doc.svg'}`

// Weekly working hours (JS getDay(): 0=Sun … 6=Sat), 09:00–20:00 every day.
export const workingHours = Array.from({ length: 7 }, (_, day) => ({
  day_of_week: day,
  hours: [{ start_time: '09:00', end_time: '20:00' }],
}))

export const provinces = [
  { id: 1, name: 'تهران' },
  { id: 2, name: 'البرز' },
]

export const citiesByProvince = {
  1: [
    { id: 288, name: 'کرج' },
    { id: 293, name: 'ماهدشت' },
  ],
  2: [{ id: 1121, name: 'ساری' }],
}

export const banks = [
  { id: 1, title: 'ملت' },
  { id: 2, title: 'ملی' },
  { id: 3, title: 'سامان' },
]

export const taskTypes = [
  { id: 1, title: 'عکس OPG', template_id: null },
  { id: 2, title: 'نوبت', template_id: null },
  { id: 5, title: 'قبل ویزیت', template_id: null },
]

export const taskPriorities = [
  { id: 1, title: 'فوری' },
  { id: 2, title: 'مهم' },
  { id: 3, title: 'عادی' },
]

export const contactResults = [
  { id: 1, title: 'پاسخ نداد' },
  { id: 13, title: 'مشغول/پشت خطی' },
  { id: 20, title: 'تماس موفق' },
]

export const enums = {
  ContactTypeEnum: [
    { value: 1, label: 'تماس خروجی' },
    { value: 2, label: 'تماس ورودی' },
  ],
  GenderEnum: [
    { value: 'male', label: 'مرد' },
    { value: 'female', label: 'زن' },
  ],
  TaskStatusEnum: [
    { value: 1, label: 'انجام نشده' },
    { value: 2, label: 'در حال انجام' },
    { value: 3, label: 'انجام شده' },
  ],
  BookingTypeEnum: [
    { value: 1, label: 'ویزیت' },
    { value: 2, label: 'نوبت' },
  ],
  VisitTypeEnum: [
    { value: 1, label: 'حضوری' },
    { value: 2, label: 'تلفنی' },
  ],
  // Keyed-object enum (QuestionForm reads { KEY: { id, faTitle } }).
  ServeIndustryQuestionTypeEnum: {
    MULTIPLE: { id: 1, faTitle: 'چند انتخابی' },
    YES_NO: { id: 2, faTitle: 'بله / خیر' },
    PER_UNIT: { id: 3, faTitle: 'بر اساس واحد' },
    PER_TEETH: { id: 4, faTitle: 'بر اساس دندان' },
    PER_JAW: { id: 5, faTitle: 'بر اساس فک' },
    PER_QUADRANT: { id: 6, faTitle: 'بر اساس ربع' },
    SIMPLE_MULTIPLE: { id: 7, faTitle: 'چند انتخابی ساده' },
    UNIT_WITH_TEETH: { id: 11, faTitle: 'واحد با دندان' },
  },
}

export const themeSetting = {
  data: {
    setting: {
      colors: [
        { name: 'primary', hex_code: '#00b4d8' },
        { name: 'secondary', hex_code: '#0077b6' },
      ],
      icon: null,
    },
  },
}

const widget = (value, label, color, uri, icon) => ({
  cols: [{ value, label, meta: { color, additional: { uri, icon } } }],
})

export const reportWidgets = {
  usersWithoutVisitCount: widget(3, 'کاربران بدون ویزیت', 'red', '/users', 'IconUserExclamation'),
  usersWithoutStatusCount: widget(2, 'کاربران بدون وضعیت', 'yellow', '/users', 'IconUserQuestion'),
  rawUsersCount: widget(5, 'کاربران خام', 'blue', '/users', 'IconUserPlus'),
}
