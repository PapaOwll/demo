// Mock route table — resolves axios requests to local mock responses.
import { coll, db, persist, nextId, findById, removeById } from './db'
import * as R from './seeds/reference'
import { followUpSurveys } from './seeds/data'

const nowStr = () => new Date().toISOString().slice(0, 19).replace('T', ' ')

const daysFromNow = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

// ---------- helpers ----------

const parseConfig = (config) => {
  const rawUrl = config.url || ''
  const [path, qs = ''] = rawUrl.split('?')
  const url = path.replace(/^\/+/, '')
  const params = { ...config.params }
  qs.split('&')
    .filter(Boolean)
    .forEach((pair) => {
      const [k, v] = pair.split('=')
      if (k) params[k] = decodeURIComponent(v || '')
    })
  let body = config.data
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  return { url, params, body, method: (config.method || 'get').toLowerCase() }
}

const isCountRequest = (params) =>
  String(params.return_count || '') === '1' || params.return_count === 1

const pageNum = (params) => {
  const p = params.page
  if (p && typeof p === 'object') return Number(p.page) || 1
  return Number(p) || 1
}

const listEnvelope = (items, params) => {
  if (isCountRequest(params)) return items.length
  const page = pageNum(params)
  const perPage = Number(params.per_page) || 10
  return {
    data: {
      items: items.slice((page - 1) * perPage, page * perPage),
      suggest_filters: [],
      sum: {},
      count: items.length,
      time:
        (params.page && typeof params.page === 'object' && params.page.list_visited_at) || nowStr(),
    },
  }
}

const matchesQuery = (item, q) =>
  [
    item.name,
    item.first_name,
    item.mobile,
    item.title,
    item.code,
    item.file_name,
    item.user?.name,
    item.user?.first_name,
    item.user?.mobile,
  ]
    .filter(Boolean)
    .some((v) => String(v).includes(String(q)))

// The app builds filters as flat bracket keys: params['filter[type]'], params['filter[user_id]'], ...
const extractFilters = (params) => {
  const flat = {}
  Object.keys(params).forEach((k) => {
    const m = k.match(/^filter\[(.+)]$/)
    if (m) flat[m[1]] = params[k]
  })
  const nested = params.filter || {}
  const get = (key) => (flat[key] === undefined ? nested[key] : flat[key])
  return { flat, get }
}

const applyFilters = (items, params) => {
  let out = [...items]
  const { get } = extractFilters(params)

  const q =
    params.search ||
    get('search') ||
    get('user_full_name') ||
    get('name') ||
    get('mobile') ||
    get('user.mobile') ||
    get('title') ||
    get('doc_number')
  if (q) out = out.filter((i) => matchesQuery(i, q))

  const type = get('type')
  if (type !== undefined && type !== null && type !== '')
    out = out.filter((i) => String(i.type) === String(type))
  if (params.type) out = out.filter((i) => String(i.type) === String(params.type))

  const userId = get('user_id')
  if (userId) out = out.filter((i) => String(i.user?.id ?? i.user_id) === String(userId))

  // Bookings linked to a treatment plan (TP description page booking dropdown).
  const tpFilter = get('treatment_plan')
  if (tpFilter)
    out = out.filter(
      (i) => String(i.treatment_plan?.id ?? i.treatmentPlan?.id ?? '') === String(tpFilter)
    )

  const assignTo = get('assign_to')
  if (assignTo)
    out = out.filter(
      (i) => String(i.assign_to ?? i.user?.advisor?.id ?? i.advisor?.id) === String(assignTo)
    )

  const dateAfter = get('booking_at_after')
  if (dateAfter)
    out = out.filter((i) => String(i.date ?? i.booking_at ?? '') >= String(dateAfter).slice(0, 10))
  const dateBefore = get('booking_at_before')
  if (dateBefore)
    out = out.filter((i) => String(i.date ?? i.booking_at ?? '') <= String(dateBefore).slice(0, 10))

  if (params.status_id)
    out = out.filter(
      (i) => String(i.last_status?.id ?? i.status?.id ?? i.status) === String(params.status_id)
    )
  if (params.advisor_id)
    out = out.filter((i) => String(i.advisor?.id) === String(params.advisor_id))
  if (params.branch_id) out = out.filter((i) => String(i.branch?.id) === String(params.branch_id))
  return out
}

const ok = (body) => ({ status: 200, body })

const blobBody = (config, text) =>
  config.responseType === 'blob' ? new Blob([text], { type: 'text/csv' }) : { data: [] }

// generic collection CRUD factory
const crudRoutes = (path, name, opts = {}) => {
  const { filter = applyFilters, afterCreate } = opts
  return [
    [
      'get',
      new RegExp(`^${path}$`),
      ({ params }) => ok(listEnvelope(filter(coll(name), params), params)),
    ],
    [
      'post',
      new RegExp(`^${path}$`),
      ({ body }) => {
        const item = { ...body, id: nextId(name), created_at: nowStr() }
        if (afterCreate) afterCreate(item)
        coll(name).unshift(item)
        persist()
        return ok({ data: item })
      },
    ],
    [
      'get',
      new RegExp(`^${path}/(\\d+)$`),
      ({ match }) => ok({ data: findById(name, match[1]) ?? {} }),
    ],
    [
      'put',
      new RegExp(`^${path}/(\\d+)$`),
      ({ match, body }) => {
        const item = findById(name, match[1])
        if (item) Object.assign(item, body)
        persist()
        return ok({ data: item ?? {} })
      },
    ],
    [
      'delete',
      new RegExp(`^${path}/(\\d+)$`),
      ({ match }) => {
        removeById(name, match[1])
        return ok({ data: { success: true } })
      },
    ],
  ]
}

// ---------- route table ----------

const routes = []
const on = (method, pattern, handler) => routes.push([method, new RegExp(`^${pattern}$`), handler])

// ===== auth =====
const loginBody = () => ({
  data: {
    token: `mock-token-${Date.now()}`,
    industries: [{ slug: 'clinic', title: 'کلینیک' }],
  },
})
on('post', 'v1/client/login', () => ok(loginBody()))
on('post', 'v1/client/check-otp', () => ok(loginBody()))
on('post', 'v1/client/send-otp', () =>
  ok({ data: { uuid: 'mock-uuid', verifier_number: '1234', skipped_count: 0, type: 1 } })
)
on('post', 'v1/client/retry', () =>
  ok({ data: { uuid: 'mock-uuid', verifier_number: '1234', skipped_count: 0, type: 1 } })
)
on('post', 'v1/client/reset-password', () => ok({ data: { success: true } }))
// `v1/user/{industry}/current` serves both the auth session and the clinic-info
// form — merge any persisted clinic info over the seed current user.
// Impersonation tokens (`mock-imp-{userId}-{ts}`) swap the identity to the
// impersonated user (role/modules stay the admin's — deliberate demo choice so
// navigation keeps working) until exit-impersonate restores the previous token.
on('get', 'v1/user/([a-z-]+)/current', ({ config }) => {
  const base = { ...R.currentUser, ...db().settings?.clinicInfo }
  const headers = config?.headers
  const auth = String(
    (typeof headers?.get === 'function' && headers.get('Authorization')) ||
      headers?.Authorization ||
      headers?.authorization ||
      ''
  )
  const impMatch = /mock-imp-(\d+)-/.exec(auth)
  if (impMatch) {
    const target = coll('users').find((u) => String(u.id) === impMatch[1])
    if (!target) {
      // stale impersonation token (user deleted / db reset) — force clean logout
      return { status: 401, body: { message: 'نشست جعل هویت منقضی شده است' } }
    }
    return ok({
      data: {
        ...base,
        user: {
          id: target.id,
          mobile: target.mobile,
          name: `${target.first_name ?? ''} ${target.name ?? ''}`.trim(),
        },
      },
    })
  }
  return ok({ data: base })
})

// ===== static reference =====
// Branches are a persisted collection — ClinicSetting (infinite query), BranchSelect
// and SendInformation all read the items envelope (`data.items`).
on('get', 'v1/(clinic|beauty)/branches', ({ params }) => ok(listEnvelope(coll('branches'), params)))
on('post', 'v1/(clinic|beauty)/branches', ({ body }) => {
  const item = {
    ...body,
    id: nextId('branches'),
    status_id: body?.status_id ?? 1,
    status: { id: body?.status_id ?? 1 },
    is_active: true,
  }
  coll('branches').push(item)
  persist()
  return ok({ data: item, message: 'شعبه با موفقیت ثبت شد' })
})
// Snapshot for the branch status history drawer (AW-163) — snaked keys
// camelize on the response; `data` rides as a JSON string that the
// use-branch-status composable decodes per-subkey (phone/address/location).
const branchHistorySnapshot = (branch) => ({
  status: branch?.status?.id ?? null,
  name: branch?.name ?? null,
  contract_date: branch?.contract_date ?? null,
  activation_date: branch?.activation_date ?? null,
  data: JSON.stringify(branch?.data ?? {}),
})
on('put', String.raw`v1/(clinic|beauty)/branches/(\d+)`, ({ match, body }) => {
  const branch = findById('branches', match[2])
  if (branch) {
    const oldValues = branchHistorySnapshot(branch)
    Object.assign(branch, body)
    if (body?.status_id) Object.assign(branch, { status: { id: body.status_id } })
    const newValues = branchHistorySnapshot(branch)
    // Audit real edits only — no-op saves shouldn't pollute the history drawer.
    if (JSON.stringify(oldValues) !== JSON.stringify(newValues)) {
      coll('branchStatusHistory').unshift({
        id: nextId('branchStatusHistory'),
        branch_id: Number(match[2]),
        // Demo acting user — same person the seeds attribute recent edits to.
        user: { first_name: '', name: R.currentUser.user.name },
        created_at: nowStr(),
        old_values: oldValues,
        new_values: newValues,
      })
    }
  }
  persist()
  return ok({ data: branch ?? {}, message: 'شعبه با موفقیت ویرایش شد' })
})
on('delete', String.raw`v1/(clinic|beauty)/branches/(\d+)`, ({ match }) => {
  removeById('branches', match[2])
  return ok({ data: { success: true }, message: 'شعبه با موفقیت حذف شد' })
})
on('get', String.raw`v1/(clinic|beauty)/branches/(\d+)/history`, ({ match }) =>
  ok({
    data: {
      items: coll('branchStatusHistory').filter((h) => String(h.branch_id) === String(match[2])),
    },
  })
)
on('put', String.raw`v1/(clinic|beauty)/branches/(\d+)/status`, () =>
  ok({ data: { success: true }, message: 'وضعیت شعبه با موفقیت تغییر کرد' })
)
on('get', String.raw`v1/(clinic|beauty)/branches/(\d+)/deactivation-impact`, () =>
  ok({ data: { affected_user_count: 0 } })
)
// Read the persisted branches so clinic-settings edits are reflected here too.
on('get', 'v1/branch', () => ok({ data: coll('branches') }))
on('get', 'v1/user/advisors', () => ok({ data: { items: R.advisorList } }))
on('get', 'v1/user/status', () => ok({ data: R.userStatuses }))
// Roles use the items envelope (use-roles / RoleSelect / store read `.items`).
on('get', 'v1/user/roles', () => ok({ data: { items: coll('roles') } }))
on('get', 'v1/user/introduction-methods', () => ok({ data: R.introductionMethods }))
on('get', 'v1/client/provinces', () => ok({ data: R.provinces }))
on('get', 'v1/client/iran/provinces', () => ok({ data: R.provinces }))
on('get', String.raw`v1/client/cities/(\d+)`, ({ match }) =>
  ok({ data: R.citiesByProvince[match[1]] || [] })
)
on('get', String.raw`v1/client/areas/\d+`, () => ok({ data: [] }))
// Branch status enum has a dedicated items-based shape (use-branch-status composable).
on('get', 'v1/client/enums/branch-status', () =>
  ok({
    data: {
      items: [
        { id: 1, title: 'فعال', slug: 'active' },
        { id: 2, title: 'غیرفعال', slug: 'inactive' },
      ],
    },
  })
)
on('get', 'v1/client/enums/([a-zA-Z0-9_-]+)', ({ match }) =>
  ok({ data: { [match[1]]: R.enums[match[1]] || [] } })
)
on('get', 'v1/client/enums', ({ params }) => {
  const names = String(params.enums || '')
    .split(',')
    .filter(Boolean)
  const out = {}
  names.forEach((n) => {
    out[n] = R.enums[n] || []
  })
  return ok({ data: out })
})
on('get', 'v1/financial/banks', () => ok({ data: R.banks }))
on('get', 'v1/contact/results', () => ok({ data: R.contactResults }))
on('get', 'v1/task/types', () => ok({ data: R.taskTypes }))
on('get', 'v1/task/assignee', () => ok({ data: R.advisorList }))
on('get', 'v1/task/due-times', () => ok({ data: ['09:00', '10:30', '12:00', '15:00', '18:00'] }))
on('get', 'v1/work-time/is-holiday', () => ok({ data: false }))
// Serves: list endpoints return an items envelope (consumed by useGetServeItemsQuery,
// PriceSettings and ServeSelect via `data.data.items`). Serves live in the persisted
// db collection so pricing edits (questions/items) survive reloads.
on('get', 'v1/(clinic|beauty)/serves/with-questions', ({ params }) => {
  const { get } = extractFilters(params)
  const qTitle = String(get('title') || '')
  const items = qTitle
    ? coll('serves').filter((s) => String(s.title).includes(qTitle))
    : coll('serves')
  return ok({ data: { items } })
})
on('get', 'v1/(clinic|beauty)/serves/minimal', () => ok({ data: { items: coll('serves') } }))
on('get', 'v1/(clinic|beauty)/serves', () => ok({ data: { items: coll('serves') } }))
on('get', 'v1/user/serves', () => ok({ data: { items: coll('serves') } }))
on('get', 'v1/treatment-plan/view/serves', () => ok({ data: coll('serves') }))

// pricing: unique id across all serve questions/items
const nextServeSubId = () => {
  let max = 999
  coll('serves').forEach((s) =>
    (s.questions || []).forEach((q) => {
      max = Math.max(max, Number(q.id) || 0)
      ;(q.items || []).forEach((it) => {
        max = Math.max(max, Number(it.id) || 0)
      })
    })
  )
  return max + 1
}
const findQuestion = (predicate) => {
  let found = null
  coll('serves').forEach((s) => {
    if (found) return
    const q = (s.questions || []).find((item) => predicate(item))
    if (q) found = q
  })
  return found
}
const buildQuestionItems = (items, serveId, questionId) =>
  (items || []).map((it) => ({
    id: it.id ?? nextServeSubId(),
    title: it.title,
    price: it.price ?? 0,
    is_active: it.is_active ?? true,
    is_public: it.is_public ?? true,
    serve_industry_id: serveId,
    serve_industry_question_id: questionId,
  }))
on('post', 'v1/(clinic|beauty)/serves/questions', ({ body }) => {
  const serve = findById('serves', body?.serve_industry_id ?? body?.serve_id)
  if (!serve) return ok({ data: { success: false }, message: 'سرویس یافت نشد' })
  const question = {
    id: nextServeSubId(),
    title: body.title,
    type: body.type ?? 1,
    coefficient: body.coefficient ?? 1,
    serve_industry_id: serve.id,
    items: buildQuestionItems(body.items, serve.id, null),
  }
  question.items = question.items.map((it) => ({ ...it, serve_industry_question_id: question.id }))
  serve.questions = [...(serve.questions || []), question]
  persist()
  return ok({ data: question, message: 'سوال با موفقیت ثبت شد' })
})
on('put', String.raw`v1/(clinic|beauty)/serves/questions/(\d+)`, ({ match, body }) => {
  const question = findQuestion((q) => String(q.id) === match[2])
  if (!question) return ok({ data: {}, message: 'سوال یافت نشد' })
  question.title = body?.title ?? question.title
  question.type = body?.type ?? question.type
  question.coefficient = body?.coefficient ?? question.coefficient
  if (Array.isArray(body?.items)) {
    question.items = buildQuestionItems(body.items, question.serve_industry_id, question.id)
  }
  persist()
  return ok({ data: question, message: 'سوال با موفقیت ویرایش شد' })
})
on('delete', String.raw`v1/(clinic|beauty)/serves/questions/(\d+)`, ({ match }) => {
  coll('serves').forEach((s) => {
    const qs = s.questions || []
    const idx = qs.findIndex((q) => String(q.id) === match[2])
    if (idx !== -1) qs.splice(idx, 1)
  })
  persist()
  return ok({ data: { success: true }, message: 'سوال با موفقیت حذف شد' })
})
on('post', String.raw`v1/(clinic|beauty)/serves/(\d+)/items`, ({ match, body }) => {
  const serve = findById('serves', match[2])
  if (!serve) return ok({ data: { success: false }, message: 'سرویس یافت نشد' })
  // Whole-serve save from the pricing page: body carries a `questions` array.
  if (Array.isArray(body?.questions)) {
    serve.questions = body.questions.map((incoming) => {
      const questionId = incoming.id ?? nextServeSubId()
      return {
        id: questionId,
        title: incoming.title,
        type: incoming.type ?? 1,
        coefficient: incoming.coefficient ?? 1,
        serve_industry_id: serve.id,
        items: buildQuestionItems(incoming.items, serve.id, questionId),
      }
    })
    persist()
    return ok({ data: serve, message: 'تعرفه با موفقیت ذخیره شد' })
  }
  let question =
    (body?.question_id &&
      (serve.questions || []).find((q) => String(q.id) === String(body.question_id))) ||
    (body?.id &&
      findQuestion((q) => (q.items || []).some((it) => String(it.id) === String(body.id)))) ||
    (serve.questions || [])[0]
  if (!question) {
    question = { id: nextServeSubId(), title: body?.title ?? 'سوال', type: 1, items: [] }
    serve.questions = [...(serve.questions || []), question]
  }
  const existing = (question.items || []).find((it) => String(it.id) === String(body?.id))
  if (existing) {
    existing.title = body?.title ?? existing.title
    existing.price = body?.price ?? existing.price
  } else {
    const item = {
      id: nextServeSubId(),
      title: body?.title,
      price: body?.price ?? 0,
      is_active: true,
      is_public: true,
      serve_industry_id: serve.id,
      serve_industry_question_id: question.id,
    }
    question.items = [...(question.items || []), item]
  }
  persist()
  return ok({ data: question, message: 'با موفقیت ذخیره شد' })
})
on('delete', String.raw`v1/(clinic|beauty)/serves/(\d+)/items/(\d+)`, ({ match }) => {
  const serve = findById('serves', match[2])
  if (serve) {
    serve.questions = (serve.questions || []).map((q) => ({
      ...q,
      items: (q.items || []).filter((it) => String(it.id) !== match[3]),
    }))
  }
  persist()
  return ok({ data: { success: true }, message: 'با موفقیت حذف شد' })
})
on('get', 'v1/setting/general/theme', () => ok(R.themeSetting))
on('get', 'v1/announcement/crm', () => ok({ data: db().announcements }))
on('get', 'v1/report/advisor/statistics', () => ok({ data: [] }))
on('get', 'v1/report/introduction-method(/advisor)?/statistics', () => ok({ data: [] }))
on('get', 'v1/report/advisor/efficiency', () => ok({ data: [] }))
on('get', 'v1/report', () => ok({ data: R.reportWidgets }))
on('get', 'v1/user/exist', () => ok({ data: false }))
// Medical-history checkbox catalog (TpdDisease) — the select unwraps data, so
// the payload itself must be the array.
on('get', 'v1/user/diseases', () => ok({ data: R.diseases }))
on('get', 'v1/sitak/call', () => ok({ data: [] }))
on('get', 'v1/user/conversations/channels', () => ok({ data: [] }))
on('get', 'v1/coupon/generate-code', () =>
  ok({ data: { code: `MOCK${Math.floor(1000 + Math.random() * 9000)}` } })
)
on('get', 'v1/coupon/validate/[^/]+', () => ok({ data: { valid: true } }))
// Payments persist as income transactions so the user financial tab keeps them.
const recordPayment = (body, label) => {
  const txn = {
    id: nextId('transactions'),
    user_id: body?.user_id ?? body?.userId ?? null,
    amount: Number(body?.amount ?? 0),
    type: 'income',
    type_title: 'دریافت',
    created_at: nowStr(),
    description: label,
  }
  coll('transactions').unshift(txn)
  persist()
  return txn
}
on('get', 'v1/financial/payment/pos/devices', () =>
  ok({ data: [{ id: 1, title: 'پایانه شعبه سعادت‌آباد' }] })
)
on('post', 'v1/financial/payment/pos/pay', ({ body }) => {
  const txn = recordPayment(body, 'پرداخت پایانه فروش')
  return ok({ data: { success: true, reference_number: String(txn.id).padStart(6, '0') } })
})
on('post', 'v1/financial/payment/pos/inquiry', () => ok({ data: { status: 'success' } }))
on('post', 'v1/financial/payment/create', ({ body }) => {
  const txn = recordPayment(body, 'پرداخت آنلاین')
  return ok({ data: { success: true, payment_id: txn.id } })
})
on('get', 'v1/financial/payment/manual/config', () => ok({ data: { enabled: true } }))
on('post', 'v1/financial/payment/manual', ({ body }) => {
  recordPayment(body, 'پرداخت دستی')
  return ok({ data: { success: true } })
})
on('get', 'v1/financial/installment', () => ok({ data: db().installments }))
on('post', 'v1/financial/installment', ({ body }) => {
  const item = { ...body, id: nextId('installments') }
  coll('installments').push(item)
  persist()
  return ok({ data: item })
})
on('put', String.raw`v1/financial/installment/(\d+)`, ({ match, body }) => {
  const inst = findById('installments', match[1])
  if (inst) Object.assign(inst, body)
  persist()
  return ok({ data: inst ?? {} })
})
on('delete', String.raw`v1/financial/installment/(\d+)`, ({ match }) => {
  removeById('installments', match[1])
  return ok({ data: { success: true } })
})
on('get', 'v1/file/status', () => ok({ data: [] }))
// BaseUploader (FormData: files[0][file], files[0][type], entity_id, entity_type).
// Rows are persisted into the files collection so uploaded radiology images
// survive reloads; small images are inlined as data URLs (capped low — the
// whole db shares one localStorage key), larger payloads fall back to the
// type's sample placeholder. Booking voice uploads (AW-152) are inlined too
// so recorded sessions keep playing across reloads — audio gets a much larger
// cap than images: MediaRecorder (webm/opus) easily produces multi-minute
// recordings in the megabytes, and a placeholder path would never play in the
// offline demo. Keep it well under the ~5MB localStorage budget shared by the
// whole db; persist() swallows quota errors, so over-budget writes are skipped
// rather than crashing the app.
const INLINE_IMAGE_MAX_BYTES = 300_000
const INLINE_AUDIO_MAX_BYTES = 2_500_000
const readFileAsDataUrl = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result))
    reader.addEventListener('error', () => resolve(null))
    reader.readAsDataURL(file)
  })
on('post', 'v1/file/upload', async ({ body }) => {
  const created = []
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const entries = {}
    body.forEach((value, key) => {
      entries[key] = value
    })
    const file = entries['files[0][file]']
    const type = entries['files[0][type]'] || 'user.docs'
    const entityId = Number(entries.entity_id) || null
    // Booking voices are attached by file id via v2/booking/{id}/voice right
    // after upload, so a missing entity_id is expected for that flow.
    if (entityId === null && type !== 'booking.voice') {
      // eslint-disable-next-line no-console
      console.warn('[mock] file/upload without entity_id — row will be orphaned')
    }
    if (file && typeof File !== 'undefined' && file instanceof File) {
      const inlineable =
        (/^image\//.test(file.type) && file.size <= INLINE_IMAGE_MAX_BYTES) ||
        (/^audio\//.test(file.type) && file.size <= INLINE_AUDIO_MAX_BYTES)
      const dataUrl = inlineable ? await readFileAsDataUrl(file) : null
      created.push({
        id: nextId('files'),
        user_id: entityId,
        entity_type: entries.entity_type || 'user',
        entity_id: entityId,
        type,
        name: file.name,
        path: dataUrl ?? R.filePlaceholder(type),
        status: R.FILE_STATUSES.verified,
        created_at: nowStr(),
      })
    }
  }
  if (created.length > 0) {
    coll('files').push(...created)
    persist()
  }
  return ok({ data: created })
})

// ===== introduction methods (ads → روش‌های آشنایی) =====
routes.push(...crudRoutes('v1/introduction-methods', 'introductionMethods'))

// ===== settings / roles / announcements / tags (persisted demo config) =====
const settingsStore = () => {
  if (!db().settings) db().settings = {}
  return db().settings
}
on('post', 'v1/(clinic|beauty)/info', ({ body }) => {
  const previous = settingsStore().clinicInfo ?? {}
  settingsStore().clinicInfo = {
    ...previous,
    name: body?.name ?? previous.name,
    instagram: body?.instagram ?? previous.instagram,
    icon: { id: body?.icon_file_id ?? previous.icon?.id ?? null, path: previous.icon?.path ?? '' },
    data: { instagram: body?.instagram ?? previous.instagram },
  }
  persist()
  return ok({ data: settingsStore().clinicInfo, message: 'اطلاعات کلینیک با موفقیت ذخیره شد' })
})
// Operator rest-time ranges (RestTimeTab reads {setting: [{roleId, startTime,
// endTime}]}). Registered BEFORE the generic v1/setting/general/:key routes —
// dispatch picks the first matching route, so this specific handler must be
// pushed into the table ahead of the catch-all.
const REST_TIME_KEY = 'general.employeeBreakTimeRange'
const restTimeSeed = () => [
  { role_id: 1, start_time: '13:00', end_time: '14:00' },
  { role_id: 2, start_time: '13:30', end_time: '14:30' },
]
// Tolerate both the fresh `{setting: [...]}` payload and the bare array a
// previous generic-handler save may have persisted.
const normalizeRestTime = (value) => ({
  setting: Array.isArray(value) ? value : (value?.setting ?? restTimeSeed()),
})
on('get', 'v1/setting/general/employeeBreakTimeRange', () =>
  ok({ data: normalizeRestTime(settingsStore()[REST_TIME_KEY]) })
)
on('post', 'v1/setting/general/employeeBreakTimeRange', ({ body }) => {
  const stored = normalizeRestTime(body)
  settingsStore()[REST_TIME_KEY] = stored
  persist()
  return ok({ data: stored, message: 'زمان استراحت با موفقیت ذخیره شد' })
})
on('get', 'v1/setting/general/([a-zA-Z0-9_-]+)', ({ match }) =>
  ok({ data: settingsStore()[`general.${match[1]}`] ?? {} })
)
on('post', 'v1/setting/general/([a-zA-Z0-9_-]+)', ({ match, body }) => {
  // Settings posted as { <key>: value } (messages) or { messages } (quickMessages)
  // are stored unwrapped so the GET round-trip returns the inner map components read.
  const key = match[1]
  const isPlainObject = body && typeof body === 'object' && !Array.isArray(body)
  const value = isPlainObject
    ? key in body
      ? body[key]
      : Object.keys(body).length === 1 && 'messages' in body
        ? body.messages
        : body
    : body
  settingsStore()[`general.${key}`] = value
  persist()
  return ok({ data: value, message: 'تنظیمات با موفقیت ذخیره شد' })
})
on('get', 'v1/setting/personal/([a-zA-Z0-9_-]+)', ({ match }) =>
  ok({ data: settingsStore()[`personal.${match[1]}`] ?? {} })
)
on('post', 'v1/setting/personal/([a-zA-Z0-9_-]+)', ({ match, body }) => {
  settingsStore()[`personal.${match[1]}`] = body
  persist()
  return ok({ data: body, message: 'تنظیمات با موفقیت ذخیره شد' })
})
on('get', 'v1/work-time', ({ params }) => ok(listEnvelope([], params)))
on('post', 'v1/work-time', ({ body }) => {
  settingsStore().workTime = body
  persist()
  return ok({ data: body })
})
on('get', String.raw`v1/user/(\d+)/work-time`, () =>
  ok({ data: settingsStore().workTime ?? R.workingHours })
)
on('put', String.raw`v1/user/(\d+)/work-time`, ({ body }) => {
  settingsStore().workTime = body
  persist()
  return ok({ data: body })
})

// acl / roles — list + editable per-role permission sets (persisted)
on('get', 'acl/roles', () => ok({ data: coll('roles') }))
on('get', 'acl/structure', () => ok({ data: { modules: [], permissions: [] } }))
on('get', String.raw`acl/role/(\d+)`, ({ match }) =>
  ok({
    data: settingsStore()[`acl.role.${match[1]}`] ??
      findById('roles', match[1]) ?? { id: Number(match[1]), modules: [] },
  })
)
on('post', 'acl/role', ({ body }) => {
  const item = { ...body, id: nextId('roles') }
  coll('roles').push(item)
  persist()
  return ok({ data: item })
})
on('put', String.raw`acl/role/(\d+)`, ({ match, body }) => {
  settingsStore()[`acl.role.${match[1]}`] = { ...body, id: Number(match[1]) }
  const role = findById('roles', match[1])
  if (role && body?.title) role.title = body.title
  persist()
  return ok({ data: settingsStore()[`acl.role.${match[1]}`] })
})

// announcements (settings → notifications tab)
on('get', 'v1/announcement', ({ params }) => {
  const { get } = extractFilters(params)
  let items = coll('announcements')
  const branchId = get('branch_id')
  if (branchId)
    items = items.filter((a) => String(a.branch_id ?? a.branch?.id) === String(branchId))
  return ok(listEnvelope(items, params))
})
on('post', 'v1/announcement', ({ body }) => {
  const item = { ...body, id: nextId('announcements'), created_at: nowStr() }
  coll('announcements').unshift(item)
  persist()
  return ok({ data: item })
})
on('put', String.raw`v1/announcement/(\d+)`, ({ match, body }) => {
  const a = findById('announcements', match[1])
  if (a) Object.assign(a, body)
  persist()
  return ok({ data: a ?? {} })
})
on('delete', String.raw`v1/announcement/(\d+)`, ({ match }) => {
  removeById('announcements', match[1])
  return ok({ data: { success: true } })
})

// tags (general settings) — items envelope (TagSettings + TagSelect read `.items`),
// rows carry { id, name, color }.
on('get', 'v1/user/tags', () => ok({ data: { items: coll('tags') } }))
on('post', 'v1/user/tags', ({ body }) => {
  const item = { name: body?.name, color: body?.color ?? '#1976d2', id: nextId('tags') }
  coll('tags').push(item)
  persist()
  return ok({ data: item, message: 'برچسب با موفقیت ثبت شد' })
})
on('put', String.raw`v1/user/tags/(\d+)`, ({ match, body }) => {
  const t = findById('tags', match[1])
  if (t) Object.assign(t, body)
  persist()
  return ok({ data: t ?? {}, message: 'برچسب با موفقیت ویرایش شد' })
})
on('delete', String.raw`v1/user/tags/(\d+)`, ({ match }) => {
  removeById('tags', match[1])
  return ok({ data: { success: true }, message: 'برچسب با موفقیت حذف شد' })
})

// surveys / warranty settings reads
on('get', 'v1/survey/list', () => ok({ data: { items: [] } }))
const warrantyRow = (s) => ({
  id: s.id,
  serve_id: s.serve_id,
  title: s.title,
  name: s.title,
  warranty_months: s.warranty_months ?? 0,
})
on('get', 'v1/serve-warranty/eligible', () =>
  ok({ data: coll('serves').map((s) => warrantyRow(s)) })
)
on('get', String.raw`v1/serve-warranty/all/(\d+)`, ({ match }) => {
  const serve = findById('serves', match[1])
  return ok({ data: serve ? [warrantyRow(serve)] : [] })
})
on('post', 'v1/serve-warranty/update-months', ({ body }) => {
  const serve = findById('serves', body?.serve_id ?? body?.id)
  if (serve) serve.warranty_months = body?.months ?? body?.warranty_months ?? 0
  persist()
  return ok({ data: { success: true }, message: 'گارانتی با موفقیت ذخیره شد' })
})

// ===== users =====
on('get', 'v1/user/index', ({ params }) =>
  ok(listEnvelope(applyFilters(coll('users'), params), params))
)
// Phone-number OR free-text user lookup (UserSelectField / assign forms).
on('get', 'v1/user/([^/]+)/search', ({ match }) => {
  const q = match[1]
  const found = coll('users').filter(
    (u) =>
      String(u.mobile).includes(q) ||
      String(u.name || '').includes(q) ||
      String(u.first_name || '').includes(q)
  )
  // Consumer reads `data.data.items` (select: data?.data ?? data, then ?.items)
  return ok({ data: { items: found } })
})
on('get', 'v1/user/history', ({ params }) => ok(listEnvelope([], params)))
on('get', String.raw`v1/user/(\d+)/vip/(\d+|true|false)`, ({ match }) => {
  const user = findById('users', match[1])
  if (user) user.is_vip = match[2] === '1' || match[2] === 'true'
  persist()
  return ok({ data: user ?? {} })
})
on('post', 'v1/user', ({ body }) => {
  const user = { ...body, id: nextId('users'), creation_date: new Date().toISOString() }
  coll('users').unshift(user)
  persist()
  return ok({ data: user })
})
on('get', String.raw`v1/user/(\d+)/(show|mini)`, ({ match }) =>
  ok({ data: findById('users', match[1]) ?? {} })
)
on('get', String.raw`v1/user/(\d+)`, ({ match }) => ok({ data: findById('users', match[1]) ?? {} }))
// 'medical' is the group type — the granular upload types all belong to it.
const MEDICAL_FILE_TYPES = new Set(['user.opg', 'user.cbct', 'user.docs', 'medical'])
on('get', String.raw`v1/user/(\d+)/files(/[^/]+)?`, ({ match }) => {
  const type = match[2] ? decodeURIComponent(match[2].slice(1)) : null
  const items = coll('files').filter((file) => {
    if (String(file.user_id) !== String(match[1])) return false
    if (!type || type === 'medical') return MEDICAL_FILE_TYPES.has(file.type)
    return file.type === type
  })
  return ok({ data: { items } })
})
on('get', String.raw`v1/user/(\d+)/medical-info`, ({ match }) =>
  ok({
    data: findById('users', match[1])?.medical_info ?? {
      diseases: [],
      consumed_medications_amount: null,
      tobacco_alcohol_use: null,
    },
  })
)
on('put', String.raw`v1/user/(\d+)/medical-info`, ({ match, body }) => {
  const user = findById('users', match[1])
  if (user) user.medical_info = body
  persist()
  return ok({ data: body, message: 'اطلاعات پزشکی با موفقیت ذخیره شد' })
})
on('put', String.raw`v1/user/(\d+)/role`, ({ match, body }) => {
  const user = findById('users', match[1])
  if (user) user.role = body?.role ?? body
  persist()
  return ok({ data: user ?? {}, message: 'نقش کاربر با موفقیت تغییر کرد' })
})
on('get', String.raw`v1/user/(\d+)/quick-messages`, () => ok({ data: [] }))
on('get', String.raw`v1/user/(\d+)/conversations`, ({ params }) => ok(listEnvelope([], params)))
on('get', String.raw`v1/user/(\d+)/(chat|call)-summary`, () => ok({ data: null }))
on('get', String.raw`v1/user/(\d+)/cheques`, ({ match }) =>
  ok({ data: coll('cheques').filter((c) => String(c.user_id) === String(match[1])) })
)
on('post', String.raw`v1/user/(\d+)/cheques`, ({ match, body }) => {
  const item = { ...body, user_id: Number(match[1]), id: nextId('cheques') }
  coll('cheques').unshift(item)
  persist()
  return ok({ data: item })
})
on('delete', String.raw`v1/user/(\d+)/cheques/(\d+)`, ({ match }) => {
  removeById('cheques', match[2])
  return ok({ data: { success: true } })
})
// ===== prescriptions (imaging + drugs) — persisted, surfaced on the OPG tab =====
const prescriptionCard = (p) => ({
  id: p.id,
  registrationDate: p.registrationDate,
  expireDate: p.expireDate,
  trackingCode: p.trackingCode,
  doctorName: p.doctorName,
  services: p.services,
})
const randomCode = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
on('get', String.raw`v1/user/(\d+)/prescription`, ({ match }) =>
  ok({
    data: coll('prescriptions')
      .filter((p) => String(p.user_id) === String(match[1]))
      .map((p) => prescriptionCard(p)),
  })
)
on('post', String.raw`v1/user/(\d+)/prescription`, ({ match, body }) => {
  // hadSnakize API — srv_id arrives snake_cased
  const srvId = body?.srv_id ?? body?.srvId
  const imaging = (settingsStore()['general.medicalPrescriptions']?.imaging ?? []).find(
    (item) => item.srvId === srvId
  )
  const item = {
    id: nextId('prescriptions'),
    user_id: Number(match[1]),
    kind: 'imaging',
    registrationDate: nowStr(),
    expireDate: daysFromNow(14),
    trackingCode: randomCode('OPG'),
    doctorName: 'دکتر مریم احمدی',
    services: JSON.stringify([{ detail_id: srvId, service_name: imaging?.title ?? 'تصویربرداری' }]),
  }
  coll('prescriptions').unshift(item)
  persist()
  return ok({ data: item, message: 'درخواست تصویربرداری با موفقیت ثبت شد' })
})
on('post', String.raw`v1/user/(\d+)/prescription/drugs`, ({ match, body }) => {
  const settings = settingsStore()['general.medicalPrescriptions']
  const allDrugs = (settings?.drugs ?? []).flatMap((reason) => reason.drugs ?? [])
  const items = (body?.items ?? []).map((it, index) => {
    const srvId = it?.srv_id ?? it?.srvId
    const drug = allDrugs.find((d) => d.srvId === srvId)
    return { detail_id: srvId, service_name: drug?.name ?? `دارو ${index + 1}` }
  })
  const item = {
    id: nextId('prescriptions'),
    user_id: Number(match[1]),
    kind: 'drug',
    registrationDate: nowStr(),
    expireDate: null,
    trackingCode: randomCode('RX'),
    doctorName: 'دکتر مریم احمدی',
    services: JSON.stringify(items),
  }
  coll('prescriptions').unshift(item)
  persist()
  return ok({ data: item, message: 'نسخه دارویی با موفقیت ثبت شد' })
})
on('get', String.raw`v1/user/(\d+)/payment-obligations`, ({ params }) =>
  ok(listEnvelope([], params))
)
on('get', String.raw`v1/user/(\d+)/treatment-plan/active`, ({ match }) => {
  const plan =
    coll('treatmentPlans').find(
      (p) => String(p.user?.id) === String(match[1]) && p.is_active !== false
    ) ??
    // demo fallback: any active plan, so perform bookings stay submittable
    coll('treatmentPlans').find((p) => p.is_active !== false && !p.is_draft) ??
    null
  return ok({ data: plan })
})
on('post', String.raw`v1/user/(\d+)/impersonate`, ({ match }) =>
  ok({ data: { token: `mock-imp-${match[1]}-${Date.now()}` } })
)
on('post', String.raw`v1/user/(\d+)/recreate`, () => ok({ data: { success: true } }))
on('post', String.raw`v1/user/(\d+)/tags/sync`, () => ok({ data: { success: true } }))
on('post', 'v1/user/send-sms', () => ok({ data: { success: true } }))
on('post', 'v1/user/(clinic|beauty)/send-contact', () => ok({ data: { success: true } }))
on('post', 'v1/user/my-tooth', () => ok({ data: { success: true } }))
on('post', 'v1/user/merge', () => ok({ data: { success: true } }))
on('post', 'v1/user/mass-update', ({ body }) => {
  const ids = new Set((body?.users || []).map(String))
  const targets = coll('users').filter((u) => ids.has(String(u.id)))
  targets.forEach((u) => {
    if (body?.cancel_advise) Object.assign(u, { advisor: null })
    if (body?.status_id)
      Object.assign(u, { last_status: { id: body.status_id, title: body.status_title ?? '' } })
  })
  persist()
  return ok({ data: { success: true }, message: 'کاربران با موفقیت به‌روزرسانی شدند' })
})
on('put', String.raw`v1/user/(\d+)`, ({ match, body }) => {
  const user = findById('users', match[1])
  if (user) Object.assign(user, body)
  persist()
  return ok({ data: user ?? {} })
})
on('put', String.raw`v1/file/\d+/verification`, () => ok({ data: { success: true } }))
on('get', 'v1/user/export', (ctx) => ok(blobBody(ctx.config, 'id,name,mobile\n1,محمدی,9121111111')))

// ===== owners (coordinate list) =====
on('get', 'v1/user/owner/user', ({ params }) =>
  ok(listEnvelope(applyFilters(coll('owners'), params), params))
)
on('post', String.raw`v1/user/owner/(\d+)/user`, ({ match, body }) => {
  const owner = findById('owners', match[1])
  if (owner) {
    owner.introduced_count = (owner.introduced_count || 0) + 1
    persist()
  }
  return ok({ data: { success: true, user_id: body?.user_id } })
})
on('delete', String.raw`v1/user/owner/(\d+)/user/(\d+)`, () => ok({ data: { success: true } }))

// ===== bookings & visits =====
const pad2 = (n) => String(n).padStart(2, '0')
const eachDate = (from, to) => {
  const out = []
  if (!from || !to) return out
  const start = new Date(`${String(from).slice(0, 10)}T00:00:00`)
  const end = new Date(`${String(to).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return out
  for (let d = new Date(start); d <= end && out.length < 100; d.setDate(d.getDate() + 1)) {
    out.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`)
  }
  return out
}

// Calendar "people" (doctors on the doctor tab, advisors on the adviser tab) with
// per-day busy stats — the shape consumed by useBookingCalendarQuery.
on('get', 'v1/booking/calendar', ({ params }) => {
  const { get } = extractFilters(params)
  const type = get('type')
  const isAdviserTab = type === '1' || type === 'adviser'
  const people = isAdviserTab
    ? R.advisorList.map((a) => ({ id: a.id, name: a.name }))
    : R.doctors.map((d) => ({ id: d.id, name: d.name }))

  const inRange = applyFilters(coll('bookings'), params)
  const items = people.map((person) => {
    const mine = inRange.filter((b) => String(b.assign_to ?? '') === String(person.id))
    const days = eachDate(get('from'), get('to')).map((date) => {
      const list = mine.filter((b) => String(b.booking_at ?? b.date ?? '').slice(0, 10) === date)
      const busy = list.length * 30
      return {
        date,
        total_busy_time: `${pad2(Math.floor(busy / 60))}:${pad2(busy % 60)}`,
        visit_bookings_count: list.filter((b) => String(b.type) === '1').length,
        perform_bookings_count: list.filter((b) => String(b.type) === '2').length,
        total_bookings_count: list.length,
      }
    })
    return { id: person.id, name: person.name, total_bookings_count: mine.length, days }
  })
  return ok({ data: { items } })
})

// Branch staff (doctors + advisors) with weekly working hours for calendar grids.
// Persisted collection so the clinic-settings BranchDoctors tab survives reloads.
on('get', 'v1/doctor-working-hours', ({ params }) => {
  const branchId = params?.branch_id ?? params?.branchId
  const rows = coll('branchDoctors').filter(
    (row) => !branchId || String(row.branch_id) === String(branchId)
  )
  return ok({ data: rows })
})
const isBranchDoctorRow = (row, body) =>
  String(row.doctor.id) === String(body?.doctor_id) &&
  String(row.branch_id) === String(body?.branch_id)
on('post', 'v1/doctor-working-hours', ({ body }) => {
  const row = coll('branchDoctors').find((r) => isBranchDoctorRow(r, body))
  if (row) {
    row.working_hours = (body?.working_hours || []).map((slots, day) => ({
      day_of_week: day,
      hours: (slots || []).map((slot) => ({ start_time: slot.start, end_time: slot.end })),
    }))
    persist()
  }
  return ok({ data: { success: true }, message: 'ساعات کاری با موفقیت ذخیره شد' })
})
on('post', 'v1/setting/branch-doctors/add', ({ body }) => {
  const exists = coll('branchDoctors').some((r) => isBranchDoctorRow(r, body))
  if (!exists) {
    const person = [...R.doctors, ...R.advisorList].find(
      (p) => String(p.id) === String(body?.doctor_id)
    ) || { id: body?.doctor_id, name: 'کاربر' }
    const row = {
      id: nextId('branchDoctors'),
      branch_id: body?.branch_id,
      doctor: {
        id: person.id,
        first_name: '',
        name: person.name,
        is_default: body?.is_default ?? false,
      },
      working_hours: structuredClone(R.workingHours),
    }
    coll('branchDoctors').push(row)
    persist()
  }
  return ok({ data: { success: true }, message: 'پزشک با موفقیت اضافه شد' })
})
on('post', 'v1/setting/branch-doctors/remove', ({ body }) => {
  const rows = coll('branchDoctors')
  const idx = rows.findIndex((r) => isBranchDoctorRow(r, body))
  if (idx !== -1) rows.splice(idx, 1)
  persist()
  return ok({ data: { success: true }, message: 'پزشک با موفقیت حذف شد' })
})
on('get', 'v1/booking/advisor/online-visit-times/[^/]+', () =>
  ok({ data: ['09:00', '10:00', '11:00', '16:00', '17:00'] })
)
on('post', 'v1/booking/sessions', () => ok({ data: [] }))
on('post', String.raw`v1/booking/(\d+)/cancellation`, ({ match }) => {
  const b = findById('bookings', match[1])
  if (b) b.status = { id: 3, title: 'لغو شده' }
  persist()
  return ok({ data: b ?? {} })
})
// The booking forms send a scalar treatment_plan_id — resolve it to the slim
// {id, public_hash_key, public_link} ref that booking rows, TpDescriptionButton
// and the TP-description booking dropdown (filter[treatment_plan]) consume.
// Callers only invoke it when the body carries the linkage key (so a stored
// ref is kept when the form omits the field entirely).
const resolveTreatmentPlanRef = (body) => {
  const tp = findById('treatmentPlans', body?.treatment_plan_id)
  return tp
    ? { id: tp.id, public_hash_key: tp.public_hash_key, public_link: `/tp/${tp.public_hash_key}` }
    : null
}
on('post', 'v1/booking', ({ body }) => {
  const item = {
    ...body,
    type: body?.type ?? 2,
    id: nextId('bookings'),
    created_at: nowStr(),
    status: { id: 1, title: 'ثبت شده' },
    created_by: R.currentUser.user.name,
  }
  if (body && 'treatment_plan_id' in body) item.treatment_plan = resolveTreatmentPlanRef(body)
  coll('bookings').unshift(item)
  persist()
  return ok({ data: item, message: 'نوبت با موفقیت ثبت شد' })
})
on('post', 'v1/visit', ({ body }) => {
  const item = {
    ...body,
    type: 1,
    id: nextId('bookings'),
    created_at: nowStr(),
    status: { id: 1, title: 'ثبت شده' },
    created_by: R.currentUser.user.name,
  }
  coll('bookings').unshift(item)
  persist()
  return ok({ data: item, message: 'ویزیت با موفقیت ثبت شد' })
})
on('put', String.raw`v1/visit/(\d+)`, ({ match, body }) => {
  const item = findById('bookings', match[1])
  if (item) Object.assign(item, body)
  persist()
  return ok({ data: item ?? {} })
})
on('get', String.raw`v1/visit/(\d+)`, ({ match }) =>
  ok({ data: findById('bookings', match[1]) ?? {} })
)
on('get', 'v1/booking', ({ params }) =>
  ok(listEnvelope(applyFilters(coll('bookings'), params), params))
)
on('get', String.raw`v1/booking/(\d+)`, ({ match }) =>
  ok({ data: findById('bookings', match[1]) ?? {} })
)
on('put', String.raw`v1/booking/(\d+)`, ({ match, body }) => {
  const item = findById('bookings', match[1])
  if (item) {
    Object.assign(item, body)
    if (body && 'treatment_plan_id' in body) item.treatment_plan = resolveTreatmentPlanRef(body)
  }
  persist()
  return ok({ data: item ?? {} })
})
on('delete', String.raw`v1/booking/(\d+)`, ({ match }) => {
  removeById('bookings', match[1])
  return ok({ data: { success: true } })
})
// ===== booking voices (AW-152 — TpDescription recorder) =====
// Attach resolves uploaded file ids onto the booking row so the session card
// voices tab (fed by GET v2/booking/{id}/serves) reflects them across reloads.
on('post', String.raw`v2/booking/(\d+)/voice`, ({ match, body }) => {
  const booking = findById('bookings', match[1])
  if (!booking) return { status: 404, body: { message: 'نوبت یافت نشد' } }
  booking.voices = Array.isArray(booking.voices) ? booking.voices : []
  ;(body?.voices || []).forEach((v) => {
    const file = findById('files', v?.id)
    if (!file || booking.voices.some((existing) => String(existing.id) === String(file.id))) return
    booking.voices.push({
      id: file.id,
      path: file.path,
      name: file.name,
      duration: v?.duration ?? 0,
      type: v?.type ?? file.type,
      created_at: file.created_at || nowStr(),
    })
  })
  persist()
  return ok({ data: { voices: booking.voices }, message: 'ذخیره سازی صدا با موفقیت انجام شد.' })
})
on('get', String.raw`v2/booking/(\d+)/serves`, ({ match }) => {
  const booking = findById('bookings', match[1])
  return ok({ data: { voices: booking?.voices ?? [] } })
})
// AW-158 — header warning chip: patients with an active treatment plan but no
// cheque on file. AppHeader reads data.count (query select unwraps data?.data).
on('get', 'v1/booking/patients-without-cheque-count', () => {
  const withCheque = new Set(coll('cheques').map((c) => String(c.user_id)))
  const activePatients = new Set(
    coll('treatmentPlans')
      .filter((tp) => tp.is_active !== false && !tp.is_draft)
      .map((tp) => String(tp.user?.id ?? tp.user_id))
      .filter(Boolean)
  )
  let count = 0
  activePatients.forEach((id) => {
    if (!withCheque.has(id)) count += 1
  })
  return ok({ data: { count } })
})

// ===== tasks / contacts (generic CRUD) =====
routes.push(...crudRoutes('v1/task', 'tasks'), ...crudRoutes('v1/contact', 'contacts'))

// ===== survey follow-ups (FollowUpSurveyModal) =====
// Questions come from the seeded followUpSurveys (matched by task type slug);
// answers / call outcomes persist on the task row so the modal prefills them
// after reload and TaskList reflects the completed state.
const surveyForTask = (task) => followUpSurveys.find((s) => s.kindSlug === task?.type?.slug)
const completeTask = (task) => {
  Object.assign(task, { done_at: nowStr(), status: 1, status_title: 'انجام شده' })
}
on('get', String.raw`v1/survey/followups/(\d+)`, ({ match }) => {
  const task = findById('tasks', match[1])
  const survey = surveyForTask(task)
  if (!survey) return ok({ data: { kindTitle: 'نظرسنجی بیمار', items: [] } })
  return ok({
    data: {
      kindTitle: survey.kindTitle,
      items: survey.items,
      ...(task?.survey_answers ? { answers: task.survey_answers } : {}),
    },
  })
})
on('post', String.raw`v1/survey/followups/(\d+)/answers`, ({ match, body }) => {
  const task = findById('tasks', match[1])
  if (task) {
    task.survey_answers = body?.answers ?? {}
    completeTask(task)
    persist()
  }
  return ok({ data: { success: true }, message: 'نظرسنجی با موفقیت ثبت شد' })
})
on('post', String.raw`v1/survey/followups/(\d+)/call`, ({ match, body }) => {
  const task = findById('tasks', match[1])
  if (task) {
    task.call_answered = body?.answered ?? false
    completeTask(task)
    persist()
  }
  return ok({ data: { success: true }, message: 'وضعیت تماس با موفقیت ثبت شد' })
})

// ===== attendance (dedicated — rows carry a nested user object, full
// datetimes, admin and room; the list drives the present/history tabs) =====
const attendanceFilters = (items, params) => {
  const { get } = extractFilters(params)
  let out = [...items]

  const today = get('today')
  if (today !== undefined && today !== null && today !== '') {
    const wanted = String(today) === '1' ? nowStr().slice(0, 10) : '____-__-__'
    out = out.filter((a) => String(a.checked_in_at || '').slice(0, 10) === wanted)
  }

  const checkedOut = get('is_checked_out')
  if (checkedOut !== undefined && checkedOut !== null && checkedOut !== '')
    out = out.filter((a) => Boolean(a.checked_out_at) === (String(checkedOut) === '1'))

  const userId = get('user_id')
  if (userId) out = out.filter((a) => String(a.user?.id) === String(userId))

  const roomId = get('room_id')
  if (roomId) out = out.filter((a) => String(a.room?.id) === String(roomId))

  const branchId = get('branch_id')
  if (branchId) out = out.filter((a) => String(a.branch?.id) === String(branchId))

  const from = get('checked_in_at_from')
  if (from) out = out.filter((a) => String(a.checked_in_at || '') >= String(from))
  const to = get('checked_in_at_to')
  if (to) out = out.filter((a) => String(a.checked_in_at || '') <= String(to))

  return out
}
on('get', 'v1/attendance', ({ params }) =>
  ok(listEnvelope(attendanceFilters(coll('attendance'), params), params))
)
on('get', String.raw`v1/attendance/(\d+)`, ({ match }) =>
  ok({ data: findById('attendance', match[1]) ?? {} })
)
on('post', 'v1/attendance/check-in', ({ body }) => {
  const seed = findById('users', body?.user_id ?? body?.userId)
  const user = seed
    ? {
        id: seed.id,
        first_name: seed.first_name,
        name: seed.name,
        mobile: seed.mobile,
        gender: seed.gender,
      }
    : (body?.user ?? null)
  const item = {
    id: nextId('attendance'),
    user,
    checked_in_at: nowStr(),
    checked_out_at: null,
    admin: { id: R.currentUser.user.id, name: R.currentUser.user.name },
    room: null,
    branch: R.branchList[0],
  }
  coll('attendance').unshift(item)
  persist()
  return ok({ data: item, message: 'ورود با موفقیت ثبت شد' })
})
on('post', String.raw`v1/attendance/(\d+)/check-out`, ({ match }) => {
  const item = findById('attendance', match[1])
  if (item) item.checked_out_at = nowStr()
  persist()
  return ok({ data: item ?? {}, message: 'خروج با موفقیت ثبت شد' })
})
on('put', String.raw`v1/attendance/(\d+)`, ({ match, body }) => {
  const item = findById('attendance', match[1])
  if (item) {
    const { room_id: roomId, ...rest } = body || {}
    Object.assign(item, rest)
    if (roomId !== undefined) {
      const room = findById('rooms', roomId)
      item.room = roomId ? { id: room?.id ?? roomId, name: room?.title ?? `اتاق ${roomId}` } : null
    }
  }
  persist()
  return ok({ data: item ?? {}, message: 'اطلاعات با موفقیت ویرایش شد' })
})
on('delete', String.raw`v1/attendance/(\d+)`, ({ match }) => {
  removeById('attendance', match[1])
  return ok({ data: { success: true } })
})

// ===== clinic rooms (v1/user/rooms — items envelope, filtered by branch) =====
on('get', 'v1/user/rooms', ({ params }) => {
  const { get } = extractFilters(params)
  const branchId = get('branch_id') || params.branch_id
  const items = branchId
    ? coll('rooms').filter((r) => String(r.branch_id) === String(branchId))
    : coll('rooms')
  return ok({ data: { items } })
})
on('post', 'v1/user/rooms', ({ body }) => {
  const item = { ...body, id: nextId('rooms') }
  coll('rooms').push(item)
  persist()
  return ok({ data: item })
})
on('put', String.raw`v1/user/rooms/(\d+)`, ({ match, body }) => {
  const room = findById('rooms', match[1])
  if (room) Object.assign(room, body)
  persist()
  return ok({ data: room ?? {} })
})
on('delete', String.raw`v1/user/rooms/(\d+)`, ({ match }) => {
  removeById('rooms', match[1])
  return ok({ data: { success: true } })
})

// ===== internal phones (operator settings — items envelope, keyed by phone) =====
on('get', 'v1/(clinic|beauty)/internal-phones', ({ params }) =>
  ok(listEnvelope(coll('internalPhones'), params))
)
on('post', 'v1/(clinic|beauty)/internal-phones', ({ body }) => {
  const item = { ...body, id: nextId('internalPhones') }
  coll('internalPhones').push(item)
  persist()
  return ok({ data: item, message: 'شماره داخلی با موفقیت ثبت شد' })
})
on('put', String.raw`v1/(clinic|beauty)/internal-phones/([^/]+)`, ({ match, body }) => {
  const phone = coll('internalPhones').find((p) => String(p.phone_number ?? p.phone) === match[2])
  if (phone) Object.assign(phone, body)
  persist()
  return ok({ data: phone ?? {}, message: 'شماره داخلی با موفقیت ویرایش شد' })
})
on('delete', String.raw`v1/(clinic|beauty)/internal-phones/([^/]+)`, ({ match }) => {
  const list = coll('internalPhones')
  const idx = list.findIndex((p) => String(p.phone_number ?? p.phone) === match[2])
  if (idx !== -1) list.splice(idx, 1)
  persist()
  return ok({ data: { success: true }, message: 'شماره داخلی با موفقیت حذف شد' })
})

// ===== treatment plans =====
routes.push(...crudRoutes('v1/treatment-plan', 'treatmentPlans'))
on('get', 'v1/treatment-plan/view', () => ok({ data: coll('treatmentPlans')[0] ?? {} }))
on('get', String.raw`v1/treatment-plan/(\d+)/history`, ({ params }) => ok(listEnvelope([], params)))
on('get', String.raw`v1/treatment-plan/(\d+)/send-link`, () =>
  ok({ data: { link: 'https://mock.local/tp' } })
)
on('post', String.raw`v1/treatment-plan/(\d+)/(activate|complete)`, ({ match }) => {
  const plan = findById('treatmentPlans', match[1])
  if (plan) {
    plan.status = match[2] === 'activate' ? 2 : 3
    plan.status_title = match[2] === 'activate' ? 'در حال انجام' : 'تکمیل شده'
    persist()
  }
  return ok({ data: plan ?? {} })
})
on('post', String.raw`v1/treatment-plan/financial/\d+/(confirmation|extradition)`, () =>
  ok({ data: { success: true } })
)
on('post', 'v1/treatment-plan/cheques/calculate', () => ok({ data: [] }))
on('post', String.raw`v1/treatment-plan/transfer/\d+/\d+`, () => ok({ data: { success: true } }))
on('post', String.raw`v1/treatment-plan/(\d+)/(voice|file)`, () => ok({ data: { success: true } }))
on('get', 'v1/doctor-reviews', ({ params }) => ok(listEnvelope([], params)))

// v2 treatment-plan (drafts & perform)
on('get', 'v2/treatment-plan/draft', ({ params }) => ok(listEnvelope(coll('drafts'), params)))
on('get', 'v2/treatment-plan/draft/export', (ctx) => ok(blobBody(ctx.config, 'draft export')))
on('post', 'v2/treatment-plan/draft', ({ body }) => {
  const item = { ...body, id: nextId('drafts'), status: 1, created_at: nowStr() }
  coll('drafts').unshift(item)
  persist()
  return ok({ data: item })
})
on('post', String.raw`v2/treatment-plan/from-draft/(\d+)`, ({ match, body }) => {
  const item = {
    ...body,
    id: nextId('treatmentPlans'),
    status: 2,
    status_title: 'در حال انجام',
    created_at: nowStr(),
  }
  coll('treatmentPlans').unshift(item)
  removeById('drafts', match[1])
  return ok({ data: item })
})
on('post', 'v2/treatment-plan', ({ body }) => {
  const item = {
    ...body,
    id: nextId('treatmentPlans'),
    status: 2,
    status_title: 'در حال انجام',
    created_at: nowStr(),
  }
  coll('treatmentPlans').unshift(item)
  persist()
  return ok({ data: item })
})
on('put', String.raw`v2/treatment-plan/(\d+)`, ({ match, body }) => {
  const plan = findById('treatmentPlans', match[1]) || findById('drafts', match[1])
  if (plan) Object.assign(plan, body)
  persist()
  return ok({ data: plan ?? {} })
})
// ---- شرح درمان (performed serves) persistence --------------------------------
// The perform payload arrives as
//   { serve_industry_id, teeth, booking_id, serve_industry_items: [{id, unit, price}], description }
// (PER_TEETH auto-mapped items ride on teeth[].serve_industry_item_id instead).
// Rows are stored flat in `performedServes` and grouped by booking on read.

// One tooth entry per scalar display number — the description card renders
// tooth.number scalars (array payloads from the client are expanded here).
const normalizeTeeth = (teeth) =>
  (Array.isArray(teeth) ? teeth : []).flatMap((t) => {
    const position = t?.position
    const numbers = t?.number ?? t?.toothNumber ?? t?.tooth_number
    if (!position || numbers == null) return []
    return (Array.isArray(numbers) ? numbers : [numbers]).map((n) => ({ position, number: n }))
  })

// Meta for a performed row — question/item titles resolved from the pricing
// catalog. Unknown ids null the question meta explicitly so PUT edits never
// keep stale titles from the previous item.
const resolveServeItemMeta = (serveId, itemId) => {
  const serve = coll('serves').find((s) => String(s.id) === String(serveId))
  if (!serve) return {}
  const question = (serve.questions ?? []).find((qq) =>
    (qq.items ?? []).some((c) => String(c.id) === String(itemId))
  )
  if (!question) {
    return {
      serve_industry_title: serve.title,
      question_id: null,
      question_title: null,
      item_title: null,
    }
  }
  return {
    serve_industry_title: serve.title,
    question_id: question.id,
    question_title: question.title,
    item_title: (question.items ?? []).find((c) => String(c.id) === String(itemId))?.title ?? null,
  }
}

const performedRowFromItem = (tpId, body, entry) => {
  const unit = Math.max(1, Number(entry.unit) || 1)
  const price = unit * (Number(entry.price) || 0)
  return {
    id: nextId('performedServes'),
    treatment_plan_id: Number(tpId),
    booking_id: body?.booking_id ?? null,
    serve_industry_id: body?.serve_industry_id,
    ...resolveServeItemMeta(body?.serve_industry_id, entry.id),
    item_id: entry.id,
    unit,
    price,
    price_with_profit: price,
    teeth: normalizeTeeth(body?.teeth),
    description: body?.description || '',
    performed_at: nowStr(),
  }
}

const syncPerformedFlags = (tpId, bookingId) => {
  const remaining = coll('performedServes').filter(
    (r) => String(r.treatment_plan_id) === String(tpId)
  )
  const plan = findById('treatmentPlans', tpId)
  if (plan) plan.is_performed = remaining.length > 0
  const booking = bookingId == null ? null : findById('bookings', bookingId)
  if (booking) {
    const hasRows = remaining.some((r) => String(r.booking_id) === String(bookingId))
    booking.has_treatment_description = hasRows
    booking.performed_at = hasRows ? (booking.performed_at ?? nowStr()) : null
  }
  persist()
}

on('get', String.raw`v2/treatment-plan/(\d+)/performed-serves`, ({ match, params }) => {
  let rows = coll('performedServes').filter((r) => String(r.treatment_plan_id) === String(match[1]))
  if (params.booking_id != null && params.booking_id !== '')
    rows = rows.filter((r) => String(r.booking_id) === String(params.booking_id))
  // Plain array (not the items envelope) — the query unwraps response.data.data/data.
  const groups = []
  rows.forEach((row) => {
    let group = groups.find((g) => String(g.booking_id) === String(row.booking_id))
    if (!group) {
      const booking = row.booking_id == null ? null : findById('bookings', row.booking_id)
      group = {
        booking_id: row.booking_id,
        booking_at: booking?.booking_at ?? row.performed_at,
        doctor_name: booking?.doctor?.name ?? '',
        perform_files: [],
        items: [],
      }
      groups.push(group)
    }
    group.items.push({
      id: row.id,
      booking_id: row.booking_id,
      performed_at: row.performed_at,
      serve_industry_id: row.serve_industry_id,
      serve_industry_title: row.serve_industry_title,
      question_id: row.question_id,
      question_title: row.question_title,
      item_id: row.item_id,
      item_title: row.item_title,
      unit: row.unit,
      price: row.price,
      price_with_profit: row.price_with_profit,
      teeth: row.teeth,
      description: row.description,
      files: [],
    })
  })
  return ok({ data: groups })
})
on('post', String.raw`v2/treatment-plan/(\d+)/perform`, ({ match, body }) => {
  const items = body?.serve_industry_items?.length
    ? body.serve_industry_items
    : (Array.isArray(body?.teeth) ? body.teeth : [])
        .filter((t) => t?.serve_industry_item_id ?? t?.serveIndustryItemId)
        .map((t) => ({
          id: t.serve_industry_item_id ?? t.serveIndustryItemId,
          unit: t.unit ?? 1,
          price: t.price ?? 0,
        }))
  const created = []
  items.forEach((entry) => {
    if (entry?.id == null) return
    const row = performedRowFromItem(match[1], body, entry)
    coll('performedServes').unshift(row)
    created.push(row)
  })
  if (created.length === 0) {
    return { status: 422, body: { message: 'هیچ خدمتی برای ثبت شرح درمان انتخاب نشده است' } }
  }
  syncPerformedFlags(match[1], body?.booking_id)
  return ok({ data: created, message: 'شرح درمان با موفقیت ثبت شد' })
})
on('put', String.raw`v2/treatment-plan/(\d+)/perform/items/(\d+)`, ({ match, body }) => {
  const row = findById('performedServes', match[2])
  if (row && String(row.treatment_plan_id) === String(match[1])) {
    const oldBookingId = row.booking_id
    const itemId = body?.serve_industry_item_id ?? body?.serveIndustryItemId ?? row.item_id
    const unit = Math.max(1, Number(body?.unit) || row.unit)
    const unitPrice = Number(body?.price)
    // body.price is the per-unit price; when omitted keep the stored unit price.
    const price =
      Number.isFinite(unitPrice) && unitPrice >= 0
        ? unit * unitPrice
        : row.unit > 0
          ? Math.round((row.price / row.unit) * unit)
          : row.price
    Object.assign(row, resolveServeItemMeta(row.serve_industry_id, itemId), {
      item_id: itemId,
      unit,
      price,
      price_with_profit: price,
      teeth: body?.teeth ? normalizeTeeth(body.teeth) : row.teeth,
      description: body?.description ?? row.description,
      booking_id: body?.booking_id ?? row.booking_id,
    })
    syncPerformedFlags(match[1], row.booking_id)
    // Reassigning the booking must clear the performed flags on the old one.
    if (oldBookingId != null && String(oldBookingId) !== String(row.booking_id)) {
      syncPerformedFlags(match[1], oldBookingId)
    }
  }
  return ok({ data: row ?? {}, message: 'شرح درمان با موفقیت ویرایش شد' })
})
on('delete', String.raw`v2/treatment-plan/(\d+)/perform/items/(\d+)`, ({ match }) => {
  const row = findById('performedServes', match[2])
  if (row && String(row.treatment_plan_id) === String(match[1])) {
    removeById('performedServes', match[2])
    syncPerformedFlags(match[1], row.booking_id)
  }
  return ok({ data: { success: true }, message: 'شرح درمان با موفقیت حذف شد' })
})
on('post', String.raw`v2/treatment-plan/(\d+)/credit`, () => ok({ data: { success: true } }))
// Full financial summary — UserTpCard/FinancialDetailsDialog read credit
// (کیف پول), balance (negative = بدهی) and performedServesPrice off it.
on('get', String.raw`v2/treatment-plan/(\d+)/credit-total`, ({ match }) => {
  const plan = findById('treatmentPlans', match[1])
  const performedTotal = coll('performedServes')
    .filter((row) => String(row.treatment_plan_id) === String(match[1]))
    .reduce((sum, row) => sum + (Number(row.price) || 0), 0)
  const total = Number(plan?.total_price) || 0
  const prepay = Number(plan?.prepay) || 0
  return ok({
    data: {
      total,
      prepay,
      performedServesPrice: performedTotal,
      credit: Math.max(0, prepay - performedTotal),
      balance: Math.min(0, prepay - performedTotal),
      discount: { fixed: 0, percent: 0 },
    },
  })
})
on('get', 'v2/treatment-plan/[^/]+/[^/]+/print', () => ok({ data: {} }))
on('get', String.raw`v2/treatment-plan/(\d+)/warranties`, () => ok({ data: [] }))
on('get', String.raw`v2/user/(\d+)/warranties`, () => ok({ data: [] }))
on('post', 'v2/(treatment-plan/)?warranty/toggle', () => ok({ data: { success: true } }))
on('post', String.raw`v2/treatment-plan/(\d+)/consent`, () => ok({ data: { success: true } }))
on('put', 'v2/consent-file/status', () => ok({ data: { success: true } }))
on('post', 'v1/coupon/calculate', () => ok({ data: { discount: 0 } }))

// ===== ads =====
on('get', 'v1/(clinic|beauty)/campaigns', ({ params }) =>
  ok(listEnvelope(applyFilters(coll('campaigns'), params), params))
)
on('post', 'v1/(clinic|beauty)/campaigns', ({ body }) => {
  const item = {
    ...body,
    id: nextId('campaigns'),
    status: 1,
    status_title: 'فعال',
    introduced_count: 0,
  }
  coll('campaigns').unshift(item)
  persist()
  return ok({ data: item })
})
on('put', String.raw`v1/(clinic|beauty)/campaigns/(\d+)`, ({ match, body }) => {
  const c = findById('campaigns', match[2])
  if (c) Object.assign(c, body)
  persist()
  return ok({ data: c ?? {} })
})
on('get', 'v1/user/import', ({ params }) => ok(listEnvelope(coll('imports'), params)))
on('post', 'v1/user/user-import', ({ body }) => {
  const item = {
    ...body,
    id: nextId('imports'),
    status: 1,
    status_title: 'تکمیل شده',
    created_at: nowStr(),
  }
  coll('imports').unshift(item)
  persist()
  return ok({ data: item })
})
on('post', 'v1/user/check-user-import', () => ok({ data: { valid: true } }))
routes.push(...crudRoutes('v1/coupon', 'coupons'))
on('put', String.raw`v1/coupon/(\d+)/toggle-active`, ({ match }) => {
  const c = findById('coupons', match[1])
  if (c) c.is_active = !c.is_active
  persist()
  return ok({ data: c ?? {} })
})

// ===== financial =====
routes.push(...crudRoutes('v1/transaction', 'transactions'))
on('get', 'v2/accounting', ({ params }) => ok(listEnvelope(coll('accounting'), params)))
on('delete', String.raw`v1/accounting/\d+`, () => ok({ data: { success: true } }))
on('get', String.raw`v1/refund-requests/user/\d+`, ({ params }) => ok(listEnvelope([], params)))
on('post', String.raw`v1/refund-requests(/\d+/(approve|reject))?`, () =>
  ok({ data: { success: true } })
)
on('get', String.raw`v1/user-installments/\d+/financial-summary`, () => ok({ data: {} }))
on('put', String.raw`v1/user-installment/\d+/status`, () => ok({ data: { success: true } }))
on('delete', 'v1/beta-installments', () => ok({ data: { success: true } }))
on('post', String.raw`v1/user/(\d+)/beta-installments`, () => ok({ data: { success: true } }))
on('post', String.raw`v1/user/(\d+)/payment/link`, () =>
  ok({ data: { link: 'https://mock.local/pay' } })
)
on('post', String.raw`v1/treatment-plan/financial/\d+/payment/link`, () =>
  ok({ data: { link: 'https://mock.local/pay' } })
)
on('post', 'v1/financial/barter', () => ok({ data: { id: 1 } }))
on('post', String.raw`v1/financial/barter/\d+/(confirm|resend-otp)`, () =>
  ok({ data: { success: true } })
)
on('post', String.raw`v2/user/(\d+)/summarize-chats`, () => ok({ data: null }))

// ---------- dispatcher ----------

export const handleMockRequest = (config) => {
  const { url, params, body, method } = parseConfig(config)

  const entry = routes.find(([m, pattern]) => m === method && pattern.test(url))
  if (entry) {
    const [, pattern, handler] = entry
    return handler({ params, body, match: url.match(pattern), config })
  }

  // eslint-disable-next-line no-console
  console.warn(`[mock] unhandled ${method.toUpperCase()} ${url} — returning empty`)
  return { status: 200, body: { data: [] } }
}
