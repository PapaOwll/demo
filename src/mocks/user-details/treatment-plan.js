import { daysAgo, mockDelay } from '@/mocks/mock-storage'
import { coll, findById } from '@/mock/db'
import { camelize } from '@/utils/convert-to-camel-snake'

/**
 * Mocks for the طرح درمان tab:
 * - plan cards + توضیحات tab (description + sample voice files)
 * - بررسی پزشکی tab (doctor reviews)
 * - plan detail (serves/items/teeth/cheques) so the public preview (/tp/{hashKey}) renders
 */

const sampleVoiceUrl = `${import.meta.env.BASE_URL}mocks/sample-voice.wav`

const mockUser = (firstName, name) => ({
  firstName,
  name,
  userRole: { faTitle: 'مدیر کلینیک' },
})

/** showable tooth -> simple helper */
const tooth = (position, number) => ({ position, number })

/** question item with proposed pivot + price */
const qItem = (id, title, price, unit = 1) => ({
  id,
  title,
  price,
  pivot: { isProposed: true, unit },
})

/** simple single-choice question */
const qSimple = (id, title, items) => ({ id, type: 1, title, items })

/** per-tooth question — prices keyed by visible tooth title */
const qPerTeeth = (id, title, perToothPrice) => ({
  id,
  type: 4,
  title,
  items: [3, 4, 5, 6].map((n) => qItem(`${id}-${n}`, String(n), perToothPrice)),
})

/** monthly cheque rows for the preview cheque table */
const monthlyCheques = (price, months, startMonthsAgo = -1) =>
  Array.from({ length: months }, (_, i) => ({
    price,
    time: daysAgo(startMonthsAgo - i, 10, 0),
  }))

const PLAN_DETAIL_7101 = {
  serves: [
    {
      id: 801,
      serveId: 801,
      title: 'روت کانال',
      teeth: [tooth('BL', 3), tooth('BL', 4)],
    },
    {
      id: 802,
      serveId: 802,
      title: 'روکش زیرکونیا',
      teeth: [tooth('BL', 3), tooth('BL', 4)],
    },
  ],
  items: [
    {
      id: 9101,
      serveId: 801,
      questions: [
        qSimple(9111, 'نوع روت کانال', [qItem(91_111, 'تک کاناله', 4_000_000)]),
        qSimple(9112, 'بی‌حسی', [qItem(91_121, 'بی‌حسی موضعی', 500_000)]),
      ],
    },
    {
      id: 9102,
      serveId: 802,
      questions: [qPerTeeth(9121, 'روکش زیرکونیا', 7_500_000)],
    },
  ],
}

const PLAN_DETAIL_7102 = {
  serves: [
    {
      id: 803,
      serveId: 803,
      title: 'ایمپلنت',
      teeth: [tooth('BR', 2), tooth('BR', 3)],
    },
    {
      id: 804,
      serveId: 804,
      title: 'گرافت استخوان',
      teeth: [tooth('BR', 2)],
    },
  ],
  items: [
    {
      id: 9201,
      serveId: 803,
      questions: [qPerTeeth(9211, 'ایمپلنت کره‌ای', 25_000_000)],
    },
    {
      id: 9202,
      serveId: 804,
      questions: [qSimple(9221, 'نوع گرافت', [qItem(92_211, 'گرافت مصنوعی', 8_000_000)])],
    },
  ],
}

const buildPlan = (base) => ({
  ...base,
  ...base.detail,
  teethData: JSON.stringify(
    base.detail.serves.map((serve) => ({
      serveDetail: { serveId: serve.serveId },
      teeth: serve.teeth,
    }))
  ),
})

const PLANS = [
  buildPlan({
    detail: PLAN_DETAIL_7101,
    id: 7101,
    version: 2,
    publicHashKey: 'mock-tp-7101',
    createdAt: daysAgo(18, 11, 20),
    startDate: daysAgo(18, 12, 0),
    createdBy: mockUser('مریم', 'دکتر مریم احمدی'),
    isActive: true,
    isDraft: false,
    isProposed: false,
    isPerformed: true,
    status: 3, // TREATMENT_PLAN_STATUS.PERFORMED
    creditStatus: true,
    prepay: 5_000_000,
    prepayAt: daysAgo(18, 12, 30),
    financialFiles: [{ id: 1 }],
    consent: true,
    installment: { id: 1, month: 6, percentage: 20, profit: 0 },
    installmentPrice: 2_500_000,
    cheques: monthlyCheques(2_500_000, 6),
    discountPercent: '0',
    discount: 0,
    totalCost: 19_500_000, // 4M (تک کاناله) + 0.5M (بی‌حسی) + 2×7.5M (روکش)
    publicDescription: 'درمان روت کانال دندان‌های فک پایین به همراه روکش زیرکونیا در دو جلسه.',
    description:
      'بیمار برای درمان روت کانال دندان ۳۶ مراجعه کرد. پس از بررسی OPG، روت کانال در دو جلسه انجام شد. در جلسه دوم پوسیدگی گسترده تاج بررسی و روکش پیشنهاد گردید. حساسیت لثه در ناحیه فک پایین نیز کنترل شد.',
    voices: [
      {
        id: 9001,
        path: sampleVoiceUrl,
        name: 'توضیحات-جلسه-اول.mp3',
        duration: 3000,
        createdAt: daysAgo(18, 11, 45),
        user: mockUser('مریم', 'دکتر مریم احمدی'),
      },
      {
        id: 9002,
        path: sampleVoiceUrl,
        name: 'توصیه‌های-پس-از-درمان.mp3',
        duration: 3000,
        createdAt: daysAgo(11, 13, 10),
        user: mockUser('علی', 'دکتر علی رضایی'),
      },
    ],
    user: { id: 1 },
  }),
  buildPlan({
    detail: PLAN_DETAIL_7102,
    id: 7102,
    version: 2,
    publicHashKey: 'mock-tp-7102',
    createdAt: daysAgo(4, 15, 40),
    startDate: null,
    createdBy: mockUser('علی', 'دکتر علی رضایی'),
    isActive: false,
    isDraft: false,
    isProposed: true,
    isPerformed: false,
    status: 2, // TREATMENT_PLAN_STATUS.PROPOSED
    creditStatus: false,
    prepay: 0,
    prepayAt: null,
    financialFiles: [],
    consent: false,
    installment: null,
    cheques: [],
    discountPercent: '0',
    discount: 0,
    totalCost: 58_000_000, // 2×25M (ایمپلنت) + 8M (گرافت)
    publicDescription: 'طرح ایمپلنت دو واحد در ناحیه فک پایین راست همراه با گرافت استخوان.',
    description:
      'طرح ایمپلنت دو واحد در ناحیه ۴۶ و ۴۷. پس از ارزیابی CBCT، تراکم استخوان مناسب تشخیص داده شد. ایمپلنت کره‌ای برند کره پیشنهاد شد. نیاز به گرافت سینوس در ناحیه ۴۶ وجود ندارد.',
    voices: [
      {
        id: 9003,
        path: sampleVoiceUrl,
        name: 'بررسی-CBCT.mp3',
        duration: 3000,
        createdAt: daysAgo(4, 16, 5),
        user: mockUser('علی', 'دکتر علی رضایی'),
      },
    ],
    user: { id: 1 },
  }),
]

export const MOCK_TREATMENT_PLANS = {
  data: {
    items: PLANS.map(({ detail, ...plan }) => plan),
  },
}

/** plan list (single-page — an empty page terminates the infinite query) */
export const mockGetTreatmentPlans = async (params) => {
  await mockDelay(500)
  const page = Number(params?.page) || 1
  if (page > 1) {
    return { data: { items: [] } }
  }
  return MOCK_TREATMENT_PLANS
}

/** plan detail by numeric id or public hash key (e.g. 'mock-tp-7101') */
export const mockGetTreatmentPlanDetail = async (idOrKey) => {
  await mockDelay(500)
  const plan = PLANS.find((p) => String(p.id) === String(idOrKey) || p.publicHashKey === idOrKey)
  if (plan) {
    const { detail, ...rest } = plan
    return { data: rest }
  }
  // Fall back to the db-seeded plans (Bookings → شرح درمان flow) so the
  // persisted, editable plans (501/502/…) resolve by id or public hash key.
  const dbPlan =
    findById('treatmentPlans', idOrKey) ??
    coll('treatmentPlans').find((p) => p.public_hash_key === idOrKey)
  if (dbPlan) return { data: camelize(dbPlan) }
  throw new Error('طرح درمان یافت نشد')
}

/** serve items (tab list for the public preview), matched by hash key — with embedded questions */
export const mockGetServeItemsByKey = async (key) => {
  await mockDelay(400)
  const plan = PLANS.find((p) => p.publicHashKey === key)
  if (plan) {
    return plan.serves.map((serve) => ({
      ...serve,
      questions: plan.items.find((item) => item.serveId === serve.serveId)?.questions ?? [],
    }))
  }
  // Fall back to the db-seeded plans (Bookings → شرح درمان flow) so the
  // persisted plans' public previews (/tp/demo-tp-501 …) render too.
  const dbPlan = coll('treatmentPlans').find((p) => p.public_hash_key === key)
  if (!dbPlan) return []
  const camelPlan = camelize(dbPlan)
  return (camelPlan.serves ?? []).map((serve) => ({
    ...serve,
    questions: camelPlan.items.find((item) => item.serveId === serve.serveId)?.questions ?? [],
  }))
}

export const mockGetDoctorReviews = async () => {
  await mockDelay(400)
  return {
    data: {
      items: [
        {
          id: 4401,
          doctor: { name: 'دکتر مریم احمدی' },
          createdAt: daysAgo(17, 12, 15),
          status: { slug: 'approve', faTitle: 'تایید شده' },
          review:
            'روت کانال با کیفیت مناسب انجام شده است. کانال‌ها تا طول کار کامل پر شده‌اند. روکش را می‌توان در جلسه بعد شروع کرد.',
        },
        {
          id: 4402,
          doctor: { name: 'دکتر علی رضایی' },
          createdAt: daysAgo(3, 10, 45),
          status: { slug: 'pending', faTitle: 'در انتظار بررسی' },
          review:
            'لطفا قبل از شروع ایمپلنت، عکس CBCT جدیدتر با زاویه استاندارد تهیه شود. ارتفاع استخوان در ناحیه ۴۶ به‌طور دقیق قابل ارزیابی نیست.',
        },
        {
          id: 4403,
          doctor: { name: 'دکتر سارا موسوی' },
          createdAt: daysAgo(45, 9, 30),
          status: { slug: 'reject', faTitle: 'رد شده' },
          review:
            'طرح درمان قبلی به دلیل عدم تطابق فاکتور با خدمات ارائه‌شده رد شد. لطفا فاکتور اصلاح و مجددا ارسال گردد.',
        },
      ],
    },
  }
}
