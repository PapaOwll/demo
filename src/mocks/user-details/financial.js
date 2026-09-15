import { daysAgo, mockDelay, mockStorage, MOCK_STORAGE_PREFIX } from '@/mocks/mock-storage'

/**
 * Mocks for the اطلاعات مالی tab:
 * - تراکنش ها (v2/accounting list + financial summary + تعهد پرداخت list)
 * - Add-payment flows (درگاه / کارتخوان / تهاتر / چک) — persisted in localStorage
 * - عودت وجه (نقدی / چک) — persisted in localStorage
 */

const tx = (autoid, eventAt, type, inAmount, outAmount, description, extra = {}) => ({
  autoid,
  eventAt,
  type,
  inAmount,
  outAmount,
  enumerationSlug: null,
  mtGroupNameFa: type === 'payment' ? 'پرداخت' : 'خدمت',
  description,
  userBalanceCum: 0,
  userBalanceTypeCum: 'credit',
  ...extra,
})

/** Base demo transactions (mixed موجود / تعهد پرداخت entries) */
const BASE_ACCOUNTING = [
  tx(1001, daysAgo(45, 10, 5), 'payment', 1_500_000_000, 0, 'پرداخت نقدی - بیعانه طرح درمان'),
  tx(1002, daysAgo(42, 12, 20), 'service', 0, 800_000_000, 'روت کانال دندان ۳۶ - جلسه اول'),
  tx(1003, daysAgo(35, 9, 45), 'service', 0, 700_000_000, 'روت کانال دندان ۳۶ - جلسه دوم'),
  tx(
    1004,
    daysAgo(30, 16, 10),
    'payment',
    2_000_000_000,
    0,
    'پرداخت با دستگاه کارتخوان - سالن انتظار'
  ),
  tx(1005, daysAgo(24, 11, 30), 'payment', 500_000_000, 0, 'چک بانک ملت - شماره ۸۴۵۱۲۳', {
    enumerationSlug: 'cheque',
  }),
  tx(1006, daysAgo(20, 13, 15), 'service', 0, 1_200_000_000, 'روکش زیرکونیا - دندان ۱۶'),
  tx(1007, daysAgo(15, 10, 50), 'payment', 1_000_000_000, 0, 'پرداخت از طریق درگاه پرداخت آنلاین'),
  tx(1008, daysAgo(10, 15, 5), 'payment', 250_000_000, 0, 'قسط اول بتا', {
    enumerationSlug: 'beta',
  }),
  tx(1009, daysAgo(6, 12, 40), 'service', 0, 900_000_000, 'ترمیم کامپوزیت - دندان‌های ۱۱ و ۲۱'),
  tx(1010, daysAgo(3, 17, 25), 'payment', 300_000_000, 0, 'تهاتر با کاربر دیگر'),
]

export const getAccountingKey = (userId) => `accounting-${userId}`

/** persisted list of deleted cheque numbers per user (covers seeded + created rows) */
const getDeletedChequesKey = (userId) => `deleted-cheques-${userId}`

/** persisted removed accounting row ids (autoid or id) */
const DELETED_ACCOUNTING_KEY = 'deleted-accounting-ids'

const isDeletedAccountingRow = (it, deletedIds) =>
  deletedIds.some((id) => String(it.autoid) === String(id) || String(it.id) === String(id))

const getUserAccountingItems = (userId) => {
  const deletedCheques = mockStorage.get(getDeletedChequesKey(userId), [])
  const isDeletedCheque = (it) =>
    it.enumerationSlug === 'cheque' && deletedCheques.some((num) => it.description?.includes(num))
  const deletedRows = mockStorage.get(DELETED_ACCOUNTING_KEY, [])
  const isRemoved = (it) => isDeletedCheque(it) || isDeletedAccountingRow(it, deletedRows)
  return [
    ...mockStorage.get(getAccountingKey(userId), []).filter((it) => !isRemoved(it)),
    ...BASE_ACCOUNTING.filter((it) => !isRemoved(it)),
  ]
}

/** queryFn mock for useGetUserAccountingQuery */
export const mockGetUserAccounting = async (userId, params) => {
  await mockDelay(500)
  const page = Number(params?.page) || 1
  // single-page demo dataset — an empty page terminates the infinite query
  if (page > 1) {
    return { data: { items: { data: [], current_page: page, next_page_url: null } } }
  }
  const all = getUserAccountingItems(userId).sort(
    (a, b) => new Date(b.eventAt) - new Date(a.eventAt)
  )
  return {
    data: {
      items: {
        data: all,
        current_page: page,
        next_page_url: null,
      },
    },
  }
}

export const getRefundKey = (userId) => `refund-requests-${userId}`

/** queryFn mock for the financial summary */
export const mockGetFinancialSummary = async (userId) => {
  await mockDelay(400)
  const items = getUserAccountingItems(userId)
  const totalPaid = items.reduce((sum, it) => sum + (it.inAmount || 0), 0)
  const totalCost = items.reduce((sum, it) => sum + (it.outAmount || 0), 0)
  const refundRequests = mockStorage.get(getRefundKey(userId), [])
  const totalRefund = refundRequests.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  return {
    totalBalance: totalPaid - totalCost - totalRefund,
    totalCost,
    totalDiscount: 200_000_000,
    totalPayable: totalCost - 200_000_000,
    totalPayment: totalPaid,
    totalRefund,
    unpaidCommitmentIrt: 600_000_000,
  }
}

/* -------------------------------------------------------------------------- */
/* تعهد پرداخت (installments) — persisted وضعیت وصول changes                    */
/* -------------------------------------------------------------------------- */

const BASE_OBLIGATIONS = [
  {
    id: 301,
    totalAmount: 1_200_000_000,
    installmentAmount: 200_000_000,
    fromDate: daysAgo(40, 9, 0),
    status: { id: 144, title: 'در انتظار وصول' },
    betaUser: { firstName: 'زهرا', name: 'کریمی' },
    betaContractType: { title: 'اقساط ۶ ماهه' },
    installments: [
      { id: 3011, amount: 200_000_000, dueDate: daysAgo(25, 9, 0), statusId: 143 },
      { id: 3012, amount: 200_000_000, dueDate: daysAgo(-5, 9, 0), statusId: 144 },
      { id: 3013, amount: 200_000_000, dueDate: daysAgo(-35, 9, 0), statusId: 144 },
    ],
  },
  {
    id: 302,
    totalAmount: 600_000_000,
    installmentAmount: 300_000_000,
    fromDate: daysAgo(10, 11, 0),
    status: { id: 144, title: 'در انتظار وصول' },
    betaUser: { firstName: 'زهرا', name: 'کریمی' },
    betaContractType: { title: 'اقساط ۲ ماهه' },
    installments: [
      { id: 3021, amount: 300_000_000, dueDate: daysAgo(-20, 9, 0), statusId: 144 },
      { id: 3022, amount: 300_000_000, dueDate: daysAgo(-50, 9, 0), statusId: 144 },
    ],
  },
]

/** persisted installment status overrides — keyed by installment id (وضعیت وصول) */
const INSTALLMENT_STATUS_OVERRIDES_KEY = 'installment-status-overrides'
/** persisted deleted obligation/installment ids */
const DELETED_OBLIGATIONS_KEY = 'deleted-obligations'

const applyObligationOverrides = (obligations) => {
  const overrides = mockStorage.get(INSTALLMENT_STATUS_OVERRIDES_KEY, {})
  const deleted = mockStorage.get(DELETED_OBLIGATIONS_KEY, [])
  return obligations
    .filter((ob) => !deleted.includes(ob.id))
    .map((ob) => ({
      ...ob,
      installments: ob.installments
        .filter((inst) => !deleted.includes(inst.id))
        .map((inst) =>
          overrides[inst.id] === undefined ? inst : { ...inst, statusId: overrides[inst.id] }
        ),
    }))
    .filter((ob) => ob.installments.length > 0)
}

/** queryFn mock for تعهد پرداخت list (useGetUserPaymentObligationsQuery) */
export const mockGetPaymentObligations = async (params) => {
  await mockDelay(450)
  if (Number(params?.page) > 1) return { data: { items: [] } }
  return {
    data: {
      items: applyObligationOverrides(BASE_OBLIGATIONS),
    },
  }
}

/** PUT user-installment/{id}/status — persists وضعیت وصول (143 پرداخت شده / 144 در انتظار وصول) */
export const mockUpdateInstallmentStatus = async ({ id, statusId } = {}) => {
  await mockDelay(400)
  if (!id) throw new Error('قسط یافت نشد')
  mockStorage.update(INSTALLMENT_STATUS_OVERRIDES_KEY, {}, (overrides) => ({
    ...overrides,
    [id]: statusId,
  }))
  const message = statusId === 143 ? 'قسط با موفقیت پرداخت شد' : 'وضعیت قسط ثبت شد'
  return { data: { success: true, message } }
}

/** DELETE beta-installments — persists removed obligations/installments */
export const mockDeleteBetaInstallments = async (ids) => {
  await mockDelay(400)
  const list = Array.isArray(ids) ? ids : [ids]
  mockStorage.update(DELETED_OBLIGATIONS_KEY, [], (deleted) => [...new Set([...deleted, ...list])])
  return { data: { success: true, message: 'تعبهد پرداخت حذف شد' } }
}

/** DELETE accounting/{autoid} — persists removed transaction row (created or seeded) */
export const mockDeleteAccountingItem = async (autoid) => {
  await mockDelay(300)
  mockStorage.update(DELETED_ACCOUNTING_KEY, [], (ids) =>
    ids.includes(autoid) ? ids : [...ids, autoid]
  )
  // also drop already-persisted rows matching this id
  const users = Object.keys(localStorage)
    .filter((k) => k.startsWith(`${MOCK_STORAGE_PREFIX}:accounting-`))
    .map((k) => k.replace(`${MOCK_STORAGE_PREFIX}:accounting-`, ''))
  users.forEach((userId) => {
    mockStorage.update(getAccountingKey(userId), [], (items) =>
      items.filter((it) => !isDeletedAccountingRow(it, [autoid]))
    )
  })
  return { data: { success: true } }
}

export const mockGetPosDevices = async () => {
  await mockDelay(300)
  return {
    data: {
      items: [
        { id: 1, key: 'pos-waiting-room', name: 'کارتخوان سالن انتظار' },
        { id: 2, key: 'pos-room-2', name: 'کارتخوان اتاق ۲' },
        { id: 3, key: 'pos-reception', name: 'کارتخوان پذیرش' },
      ],
    },
  }
}

export const mockGetBanks = async () => {
  await mockDelay(250)
  return {
    data: {
      items: [
        { id: 1, title: 'بانک ملت', name: 'بانک ملت' },
        { id: 2, title: 'بانک ملی ایران', name: 'بانک ملی ایران' },
        { id: 3, title: 'بانک سامان', name: 'بانک سامان' },
        { id: 4, title: 'بانک پاسارگاد', name: 'بانک پاسارگاد' },
        { id: 5, title: 'بانک سپه', name: 'بانک سپه' },
      ],
    },
  }
}

/* -------------------------------------------------------------------------- */
/* Persisted add-payment mutation mocks                                        */
/* -------------------------------------------------------------------------- */

const pushAccountingItem = (userId, item) => {
  mockStorage.update(getAccountingKey(userId), [], (items) => [
    { ...item, autoid: Date.now() },
    ...items,
  ])
}

/** درگاه پرداخت — POST payment/link */
export const mockCreatePaymentLink = async ({ userId, data }) => {
  await mockDelay(700)
  pushAccountingItem(userId, {
    eventAt: new Date().toISOString(),
    type: 'payment',
    inAmount: Number(data.amount) || 0,
    outAmount: 0,
    enumerationSlug: null,
    mtGroupNameFa: 'پرداخت',
    description: `${data.description || 'پرداخت درگاه'} (لینک ارسال شد)`,
    userBalanceCum: 0,
    userBalanceTypeCum: 'credit',
  })
  return {
    data: {
      success: true,
      amount: data.amount,
      payment_url: 'https://pay.mock.example/#######',
    },
  }
}

/** کارتخوان — POST payment/create (keeps context for the pos/pay step) */
export const mockCreatePayment = async (data) => {
  await mockDelay(500)
  mockStorage.set(`payment-context-${data.user_id}`, data)
  return {
    data: {
      success: true,
      payment_uuid: `mock-uuid-${Date.now()}`,
    },
  }
}

/** کارتخوان — POST pos/pay */
export const mockPosPayment = async ({ data }) => {
  await mockDelay(1500)
  // pos/pay payload has no user_id — recover the create-payment context by scanning stores
  const contextKeys = Object.keys(localStorage).filter((k) =>
    k.startsWith(`${MOCK_STORAGE_PREFIX}:payment-context-`)
  )
  const contexts = contextKeys.map((k) =>
    mockStorage.get(k.replace(`${MOCK_STORAGE_PREFIX}:`, ''), {})
  )
  const context = contexts.at(-1) || {}
  const lastContextKey = contextKeys.at(-1)
  if (lastContextKey) localStorage.removeItem(lastContextKey) // consume the one-time context
  const userId = context.user_id ?? data.userId
  pushAccountingItem(userId, {
    eventAt: new Date().toISOString(),
    type: 'payment',
    inAmount: Number(context.amount) || Number(data.amount) || 0,
    outAmount: 0,
    enumerationSlug: null,
    mtGroupNameFa: 'پرداخت',
    description: `${context.description || data.description || 'پرداخت'} - کارتخوان`,
    userBalanceCum: 0,
    userBalanceTypeCum: 'credit',
  })
  return { data: { success: true, status: 'success' } }
}

/** کارتخوان — POST pos/inquiry */
export const mockPosInquiry = async () => {
  await mockDelay(300)
  return { data: { success: true, status: 'success' } }
}

/** تهاتر */
let lastBarterData = null

export const mockCreateBarter = async (data) => {
  await mockDelay(600)
  lastBarterData = data
  return { data: { barterId: `mock-barter-${Date.now()}` } }
}

export const mockConfirmBarter = async ({ barterId }) => {
  await mockDelay(700)
  if (lastBarterData) {
    pushAccountingItem(lastBarterData.userId, {
      eventAt: new Date().toISOString(),
      type: 'payment',
      inAmount: Number(lastBarterData.amount) || 0,
      outAmount: 0,
      enumerationSlug: null,
      mtGroupNameFa: 'پرداخت',
      description: lastBarterData.description || 'تهاتر بین کاربران',
      userBalanceCum: 0,
      userBalanceTypeCum: 'credit',
    })
  }
  return { data: { success: true, barterId } }
}

export const mockResendBarterOtp = async () => {
  await mockDelay(300)
  return { data: { success: true } }
}

/** چک — POST user/{id}/cheques */
export const mockCreateCheques = async ({ userId, cheques }) => {
  await mockDelay(800)
  cheques.forEach((cheque) => {
    pushAccountingItem(userId, {
      eventAt: new Date().toISOString(),
      type: 'payment',
      inAmount: (Number(cheque.amount) || 0) * 10, // toman -> rial
      outAmount: 0,
      enumerationSlug: 'cheque',
      mtGroupNameFa: 'پرداخت',
      description: `چک ${cheque.cheque_number} - ${cheque.bank_branch_title || ''}`,
      userBalanceCum: 0,
      userBalanceTypeCum: 'credit',
    })
  })
  return { data: { success: true } }
}

/** چک — DELETE user/{id}/cheques/{chequeId} — persists the removed cheque number (survives reloads) */
export const mockDeleteCheque = async ({ userId, chequeNumber } = {}) => {
  await mockDelay(300)
  if (chequeNumber) {
    mockStorage.update(getDeletedChequesKey(userId), [], (nums) =>
      nums.includes(chequeNumber) ? nums : [...nums, chequeNumber]
    )
    // also drop already-persisted accounting rows matching this cheque
    mockStorage.update(getAccountingKey(userId), [], (items) =>
      items.filter(
        (it) => !(it.enumerationSlug === 'cheque' && it.description?.includes(chequeNumber))
      )
    )
  }
  return { data: { success: true } }
}

/* -------------------------------------------------------------------------- */
/* عودت وجه (cash + cheque) — persisted refund requests                        */
/* -------------------------------------------------------------------------- */

export const mockRefundEnums = {
  RefundRequestTypeEnum: {
    cash: { id: 1, enTitle: 'CASH', faTitle: 'عودت نقدی', slug: 'cash' },
    cheque: { id: 2, enTitle: 'CHEQUE', faTitle: 'عودت چک', slug: 'cheque' },
  },
  RefundReferenceTypeEnum: {
    userWallet: { id: 1, enTitle: 'USER_WALLET', faTitle: 'حساب بیمار', slug: 'user_wallet' },
    treatmentPlanPrepay: {
      id: 2,
      enTitle: 'TREATMENT_PLAN_PREPAY',
      faTitle: 'بیعانه طرح درمان',
      slug: 'treatment_plan_prepay',
    },
    treatmentPlanPrepayment: {
      id: 3,
      enTitle: 'TREATMENT_PLAN_PREPAYMENT',
      faTitle: 'پیش پرداخت طرح درمان',
      slug: 'treatment_plan_prepayment',
    },
    userInstallmentCheque: {
      id: 4,
      enTitle: 'USER_INSTALLMENT_CHEQUE',
      faTitle: 'چک قسط کاربر',
      slug: 'user_installment_cheque',
    },
  },
  RefundRequestStatusEnum: {
    pending: { id: 1, enTitle: 'PENDING', faTitle: 'در انتظار بررسی', slug: 'pending' },
    refunded: { id: 2, enTitle: 'REFUNDED', faTitle: 'عودت شده', slug: 'refunded' },
    canceled: { id: 3, enTitle: 'CANCELED', faTitle: 'لغو شده', slug: 'canceled' },
  },
}

/** cheque list shown inside the عودت چک tab */
export const mockGetUserCheques = async () => {
  await mockDelay(400)
  return {
    data: {
      items: [
        {
          id: 7001,
          amount: 50_000_000,
          chequeNumber: '۸۴۵۱۲۳',
          bank: { title: 'بانک ملت' },
          dueDate: daysAgo(-30, 9, 0),
          sayadNumber: '۱۲۳۴۵۶۷۸۹۰۱۲۳۴۵۶',
        },
        {
          id: 7002,
          amount: 30_000_000,
          chequeNumber: '۹۱۲۳۴۵',
          bank: { title: 'بانک سامان' },
          dueDate: daysAgo(-60, 9, 0),
          sayadNumber: '۹۸۷۶۵۴۳۲۱۰۹۸۷۶۵۴',
        },
      ],
    },
  }
}

const BASE_REFUNDS = (userId) => [
  {
    id: 5501,
    amount: 15_000_000,
    createdAt: daysAgo(8, 10, 20),
    type: { id: 1, title: 'عودت نقدی', slug: 'cash' },
    referenceType: { id: 1, title: 'حساب بیمار' },
    status: { id: 1, title: 'در انتظار بررسی', slug: 'pending' },
    sheba: 'IR820540102680020817909002',
    description: 'عودت مبلغ اضافه پرداختی بیعانه',
    userId,
  },
  {
    id: 5502,
    amount: 30_000_000,
    createdAt: daysAgo(25, 14, 45),
    type: { id: 2, title: 'عودت چک', slug: 'check' },
    referenceType: { id: 1, title: 'حساب بیمار' },
    status: { id: 2, title: 'عودت شده', slug: 'refunded' },
    description: 'عودت چک بلااستفاده',
    reference: {
      bank: 'بانک سامان',
      sayyadi: '۹۸۷۶۵۴۳۲۱۰۹۸۷۶۵۴',
      checkNumber: '۹۱۲۳۴۵',
      dueDate: daysAgo(60, 9, 0),
      amount: 30_000_000,
    },
    userId,
  },
]

/** persisted status overrides for refund requests — keyed by request id (covers base + created rows) */
const REFUND_STATUS_OVERRIDES_KEY = 'refund-status-overrides'

const applyRefundStatusOverrides = (items) => {
  const overrides = mockStorage.get(REFUND_STATUS_OVERRIDES_KEY, {})
  return items.map((r) => (overrides[r.id] ? { ...r, status: overrides[r.id] } : r))
}

export const mockGetRefundRequests = async (userId, params) => {
  await mockDelay(450)
  if (Number(params?.page) > 1) {
    return { data: { items: { data: [], current_page: Number(params.page), next_page_url: null } } }
  }
  const items = applyRefundStatusOverrides([
    ...mockStorage.get(getRefundKey(userId), []),
    ...BASE_REFUNDS(userId),
  ]).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return {
    data: {
      items: {
        data: items,
        current_page: 1,
        next_page_url: null,
      },
    },
  }
}

/** POST refund-requests — persists the submitted form so the user can see it */
export const mockCreateRefundRequest = async (payload) => {
  await mockDelay(600)
  const isCheque = payload.reference_id && payload.type_id === 2
  const request = {
    id: Date.now(),
    amount: Number(payload.amount) || 0,
    createdAt: new Date().toISOString(),
    type:
      payload.type_id === 2
        ? { id: 2, title: 'عودت چک', slug: 'check' }
        : { id: 1, title: 'عودت نقدی', slug: 'cash' },
    referenceType: { id: 1, title: 'حساب بیمار' },
    status: { id: 1, title: 'در انتظار بررسی', slug: 'pending' },
    sheba: payload.sheba || null,
    description: payload.description || null,
    reference: isCheque ? payload.reference : null,
    userId: payload.user_id,
  }
  mockStorage.update(getRefundKey(payload.user_id), [], (items) => [request, ...items])
  return { data: { success: true, message: 'درخواست عودت وجه ثبت شد', request } }
}

const setRefundStatusOverride = (id, status) => {
  mockStorage.update(REFUND_STATUS_OVERRIDES_KEY, {}, (overrides) => ({
    ...overrides,
    [id]: status,
  }))
}

export const mockApproveRefundRequest = async ({ id }) => {
  await mockDelay(500)
  setRefundStatusOverride(id, { id: 2, title: 'عودت شده', slug: 'refunded' })
  return { data: { success: true, message: 'درخواست عودت تایید شد', id } }
}

export const mockRejectRefundRequest = async ({ id }) => {
  await mockDelay(500)
  setRefundStatusOverride(id, { id: 3, title: 'لغو شده', slug: 'canceled' })
  return { data: { success: true, message: 'درخواست عودت لغو شد', id } }
}
