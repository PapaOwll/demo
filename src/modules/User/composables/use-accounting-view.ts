import { ref, watch } from 'vue'
import { balanceTypeLabels, chequeTypeLabels } from '@/modules/User/enums/financialEnums'
import { convertToJalali } from '@/utils/date-utils'
import { generatePriceFormat } from '@/utils/formatter'

export type TransactionsView = 'table' | 'timeline'
export type BalanceType = 'credit' | 'debit' | 'settled'

export interface UserAccountingItem {
  autoid?: string | number
  eventAt?: string
  type?: string
  inAmount?: string | number
  outAmount?: string | number
  enumerationSlug?: string
  mtGroupNameFa?: string
  description?: string
  userBalance?: string | number
  userBalanceCum?: string | number
  userBalanceTypeCum?: string
  chequeType?: string
  chequeId?: string | number
  docNumber?: string | number
  transactionId?: string | number
  userId?: string | number
  methodCode?: string | number
  methodName?: string
  unitCount?: string | number
  unitPrice?: string | number
  doctorName?: string
  userServiceAmount?: string | number
  userServiceAmountCum?: string | number
  userCashFlow?: string | number
  userCashFlowCum?: string | number
  totalDiscount?: string | number
  rn?: string | number
  [key: string]: unknown
}

export interface TransactionDetailField {
  key: string
  label: string
  display: string
}

const TRANSACTIONS_VIEW_STORAGE_KEY = 'crm-financial-transactions-view'
const TRANSACTIONS_VIEWS = new Set<TransactionsView>(['table', 'timeline'])
const BALANCE_TYPES = new Set<BalanceType>(['credit', 'debit', 'settled'])
const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  payment: 'پرداخت',
  service: 'خدمت',
}
const ENUMERATION_LABELS: Record<string, string> = {
  beta: 'بتا',
  cheque: 'چک',
  cash: 'نقدی',
  gateway: 'درگاه',
  'card-to-card': 'کارت به کارت',
  pose: 'پوز',
  'promissory-note': 'سفته',
  deposit: 'واریز',
  installment: 'اقساط',
}
const MONEY_KEY_PATTERN = /(amount|price|discount|balance|cash|cost|irt)/i
const MISSING_VALUE = '—'

const readStoredView = (): TransactionsView => {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_VIEW_STORAGE_KEY) as TransactionsView | null
    return raw && TRANSACTIONS_VIEWS.has(raw) ? raw : 'table'
  } catch {
    return 'table'
  }
}

const transactionsView = ref<TransactionsView>(readStoredView())

watch(transactionsView, (value) => {
  try {
    localStorage.setItem(TRANSACTIONS_VIEW_STORAGE_KEY, value)
  } catch {
    /* noop */
  }
})

export const useTransactionsView = () => transactionsView

export const getTransactionTitle = (item: UserAccountingItem): string => {
  if (item.enumerationSlug === 'beta') return 'بتا'
  return item.mtGroupNameFa || MISSING_VALUE
}

export const getTransactionTypeLabel = (item: UserAccountingItem): string => {
  if (!item.type) return MISSING_VALUE
  return TRANSACTION_TYPE_LABELS[item.type] || item.type
}

export const resolveBalanceType = (item: UserAccountingItem): BalanceType => {
  const apiType = item.userBalanceTypeCum as BalanceType | undefined
  if (apiType && BALANCE_TYPES.has(apiType)) return apiType
  const balance = Number(item.userBalanceCum)
  if (!Number.isFinite(balance) || balance === 0) return 'settled'
  return balance > 0 ? 'credit' : 'debit'
}

export const getBalanceTypeLabel = (item: UserAccountingItem): string =>
  balanceTypeLabels[resolveBalanceType(item)] || MISSING_VALUE

type DetailFormat = 'text' | 'money' | 'date' | 'type' | 'balance' | 'cheque' | 'method'

interface DetailFieldSpec {
  key: string
  label: string
  format: DetailFormat
  always?: boolean
}

const DETAIL_FIELD_SPECS: DetailFieldSpec[] = [
  { key: 'description', label: 'توضیحات', format: 'text' },
  { key: 'autoid', label: 'شناسه رکورد', format: 'text' },
  { key: 'rn', label: 'شماره ردیف', format: 'text', always: true },
  { key: 'eventAt', label: 'تاریخ و ساعت', format: 'date', always: true },
  { key: 'type', label: 'نوع تراکنش', format: 'type', always: true },
  { key: 'docNumber', label: 'شماره سند', format: 'text', always: true },
  { key: 'transactionId', label: 'شناسه تراکنش', format: 'text' },
  { key: 'userId', label: 'شناسه کاربر', format: 'text' },
  { key: 'chequeId', label: 'شناسه چک', format: 'text' },
  { key: 'methodCode', label: 'کد متد', format: 'text' },
  { key: 'methodName', label: 'نام متد', format: 'text' },
  { key: 'enumerationSlug', label: 'روش تراکنش', format: 'method' },
  { key: 'mtGroupNameFa', label: 'گروه تراکنش', format: 'text' },
  { key: 'unitCount', label: 'تعداد واحد', format: 'text' },
  { key: 'unitPrice', label: 'قیمت واحد', format: 'money' },
  { key: 'doctorName', label: 'نام پزشک', format: 'text' },
  { key: 'inAmount', label: 'مبلغ ورودی', format: 'money', always: true },
  { key: 'outAmount', label: 'مبلغ خروجی', format: 'money', always: true },
  { key: 'totalDiscount', label: 'تخفیف کل', format: 'money', always: true },
  { key: 'userServiceAmount', label: 'مبلغ خدمات', format: 'money' },
  { key: 'userServiceAmountCum', label: 'مبلغ خدمات تجمعی', format: 'money', always: true },
  { key: 'userCashFlow', label: 'جریان نقدی', format: 'money' },
  { key: 'userCashFlowCum', label: 'جریان نقدی تجمعی', format: 'money', always: true },
  { key: 'userBalance', label: 'مانده تراکنش', format: 'money' },
  { key: 'userBalanceCum', label: 'مانده', format: 'money', always: true },
  { key: 'userBalanceTypeCum', label: 'وضعیت مانده', format: 'balance', always: true },
  { key: 'chequeType', label: 'نوع چک', format: 'cheque' },
]

const isEmptyValue = (value: unknown) => value === null || value === undefined || value === ''

const isPrimitiveValue = (value: unknown) =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'

const humanizeKey = (key: string) =>
  key.replace(/([\da-z])([A-Z])/g, '$1 $2').replace(/^./, (char) => char.toUpperCase())

const formatDetailValue = (spec: DetailFieldSpec, item: UserAccountingItem): string => {
  const value = item[spec.key]
  switch (spec.format) {
    case 'date': {
      return item.eventAt ? convertToJalali(item.eventAt, 'jYYYY/jMM/jDD - HH:mm') : MISSING_VALUE
    }
    case 'type': {
      return getTransactionTypeLabel(item)
    }
    case 'balance': {
      return getBalanceTypeLabel(item)
    }
    case 'method': {
      return item.enumerationSlug
        ? ENUMERATION_LABELS[item.enumerationSlug] || item.enumerationSlug
        : MISSING_VALUE
    }
    case 'cheque': {
      return item.chequeType && chequeTypeLabels[item.chequeType]
        ? `چک ${chequeTypeLabels[item.chequeType]}`
        : MISSING_VALUE
    }
    case 'money': {
      return isEmptyValue(value) ? MISSING_VALUE : generatePriceFormat(value as string | number)
    }
    default: {
      return isEmptyValue(value) ? MISSING_VALUE : String(value)
    }
  }
}

const formatUnknownValue = (key: string, value: string | number | boolean): string => {
  if (typeof value === 'boolean') return value ? 'بله' : 'خیر'
  if (typeof value === 'number' && MONEY_KEY_PATTERN.test(key)) return generatePriceFormat(value)
  return String(value)
}

export const getTransactionDetailFields = (item: UserAccountingItem): TransactionDetailField[] => {
  const fields: TransactionDetailField[] = []
  const seen = new Set<string>()

  DETAIL_FIELD_SPECS.forEach((spec) => {
    if (!spec.always && isEmptyValue(item[spec.key])) return
    fields.push({ key: spec.key, label: spec.label, display: formatDetailValue(spec, item) })
    seen.add(spec.key)
  })

  Object.entries(item).forEach(([key, value]) => {
    if (seen.has(key) || key.startsWith('_') || !isPrimitiveValue(value) || isEmptyValue(value)) {
      return
    }
    fields.push({ key, label: humanizeKey(key), display: formatUnknownValue(key, value) })
  })

  return fields
}
