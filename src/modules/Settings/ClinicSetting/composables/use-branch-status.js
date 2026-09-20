import { computed, reactive, ref, unref, watch } from 'vue'
import { apiUpdateBranch, apiGetBranchStatusHistory, apiGetBranchDeactivationImpact } from '../api'
import { useGetEnumsBySlug } from '@/modules/User/query'
import { convertToJalali, convertToJalaliWithTime } from '@/utils/date-utils'
import { confirmDialog } from '@/composables/use-notif'

const BRANCH_STATUS_SLUG = 'branch-status'

const INTERNAL_FIELDS = ['status', 'contractDate', 'activationDate']
const DATE_FIELDS = new Set(['contractDate', 'activationDate'])

const EMPTY_VALUE = '—'

const toDateOnly = (value) => {
  if (typeof value !== 'string') return value
  return value.slice(0, 10)
}

const normalizeField = (field, value) => {
  if (value == null || value === '') return null
  return DATE_FIELDS.has(field) ? toDateOnly(value) : value
}

const resolveField = (branch, field) => {
  if (!branch) return null
  if (field === 'status') return branch?.status?.id ?? null
  if (field === 'contractDate') return branch?.contractDate ?? null
  if (field === 'activationDate') return branch?.activationDate ?? null
  return null
}

const METADATA_KEYS = new Set([
  'updatedAt',
  'statusChangedAt',
  'updated_at',
  'status_changed_at',
  'id',
  'entityId',
  'entity_id',
  'createdAt',
  'created_at',
])

const DATA_FIELD_LABELS = {
  phone: 'تلفن',
  address: 'آدرس',
  location: 'لوکیشن',
}

const decodeDataField = (value) => {
  if (value == null || value === '') return null
  if (typeof value === 'object') return value
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'object' && parsed !== null ? parsed : null
  } catch {
    return null
  }
}

const resolveDataFieldLabel = (key) => DATA_FIELD_LABELS[key] ?? key

const formatDataValue = (key, value) => {
  if (value == null || value === '') return EMPTY_VALUE
  if (key === 'phone' && Array.isArray(value)) {
    return value.length > 0 ? value.join('، ') : EMPTY_VALUE
  }
  if (key === 'location' && typeof value === 'object' && !Array.isArray(value)) {
    const { lat, lng } = value
    if (lat != null && lng != null) return `${lat}, ${lng}`
    return JSON.stringify(value)
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const resolveFieldLabel = (key) => {
  const lower = String(key).toLowerCase()
  if (lower.includes('status')) return 'وضعیت شعبه'
  if (lower.includes('activation')) return 'تاریخ فعال‌سازی'
  if (lower.includes('contract')) return 'تاریخ قرارداد'
  if (lower.includes('name')) return 'نام شعبه'
  return key
}

const formatHistoryValue = (key, value, statusLabels) => {
  if (value == null || value === '') return EMPTY_VALUE
  const lower = String(key).toLowerCase()
  if (lower.includes('status')) return statusLabels[value] ?? String(value)
  if (lower.includes('date')) return convertToJalali(toDateOnly(String(value))) || EMPTY_VALUE
  return String(value)
}

const resolveUserName = (item) => {
  const user = item?.user
  const full = [user?.firstName, user?.name].filter(Boolean).join(' ').trim()
  return full || EMPTY_VALUE
}

const resolveChangeTimeRaw = (item) => item?.createdAt || null

const getSnapshots = (item) => ({
  old: item?.oldValues ?? {},
  new: item?.newValues ?? {},
})

const buildHistoryRows = (items, statusLabels) =>
  items.flatMap((item, index) => {
    const { old: oldValues, new: newValues } = getSnapshots(item)
    const createdAtRaw = resolveChangeTimeRaw(item)
    const userName = resolveUserName(item)
    const createdAt = createdAtRaw ? convertToJalaliWithTime(createdAtRaw) : EMPTY_VALUE
    const rowId = item?.id ?? index
    const changedKeys = Object.keys(newValues).filter((key) => {
      if (METADATA_KEYS.has(key)) return false
      return normalizeField(key, oldValues[key]) !== normalizeField(key, newValues[key])
    })

    return changedKeys.flatMap((key) => {
      if (key !== 'data') {
        return [
          {
            id: `${rowId}-${key}`,
            fieldLabel: resolveFieldLabel(key),
            oldValue: formatHistoryValue(key, oldValues[key], statusLabels),
            newValue: formatHistoryValue(key, newValues[key], statusLabels),
            userName,
            createdAtRaw,
            createdAt,
          },
        ]
      }

      const oldData = decodeDataField(oldValues[key]) ?? {}
      const newData = decodeDataField(newValues[key]) ?? {}
      const subKeys = [...new Set([...Object.keys(oldData), ...Object.keys(newData)])]

      return subKeys
        .filter((subKey) => {
          const oldValue = oldData[subKey]
          const newValue = newData[subKey]
          if (Array.isArray(oldValue) || Array.isArray(newValue)) {
            return JSON.stringify(oldValue ?? null) !== JSON.stringify(newValue ?? null)
          }
          return oldValue !== newValue
        })
        .map((subKey) => ({
          id: `${rowId}-data-${subKey}`,
          fieldLabel: resolveDataFieldLabel(subKey),
          oldValue: formatDataValue(subKey, oldData[subKey]),
          newValue: formatDataValue(subKey, newData[subKey]),
          userName,
          createdAtRaw,
          createdAt,
        }))
    })
  })

const confirmDeactivation = (affectedUserCount) =>
  new Promise((resolve) => {
    confirmDialog(
      'غیرفعالسازی شعبه',
      `با غیرفعال کردن این شعبه، 
<span 
      class="text-bold text-negative"
      style="text-decoration: underline"
  >
      ${affectedUserCount}
</span>
 کاربر که به این شعبه تعلق دارند غیرفعال میشوند و از حساب خود خارج میشوند. آیا مطمئن هستید؟`,
      () => resolve(true),
      { persistent: true, html: true },
      () => resolve(false)
    )
  })

export const useBranchStatus = (branchIdSource, branchSource) => {
  const branchId = computed(() => {
    if (typeof branchIdSource === 'function') return branchIdSource()
    return unref(branchIdSource)
  })
  const branch = computed(() => {
    if (typeof branchSource === 'function') return branchSource()
    return unref(branchSource)
  })

  const enumQuery = useGetEnumsBySlug(BRANCH_STATUS_SLUG)

  const statusOptions = computed(() => {
    const items = enumQuery.data.value?.items ?? []
    return items.map((item) => ({ value: item?.id, label: item?.title }))
  })

  const statusLabels = computed(() => {
    const items = enumQuery.data.value?.items ?? []
    return items.reduce((acc, item) => {
      acc[item?.id] = item?.title
      return acc
    }, {})
  })

  const isStatusOptionsLoading = computed(() => enumQuery.isLoading.value)

  const inactiveStatusId = computed(() => {
    const items = enumQuery.data.value?.items ?? []
    return items.find((item) => item?.slug === 'inactive')?.id ?? null
  })

  const form = reactive({
    status: null,
    contractDate: null,
    activationDate: null,
  })

  const savedSnapshot = ref({
    status: null,
    contractDate: null,
    activationDate: null,
  })

  const currentStatus = computed(() => {
    const b = branch.value
    return {
      status: resolveField(b, 'status'),
      contractDate: resolveField(b, 'contractDate'),
      activationDate: resolveField(b, 'activationDate'),
    }
  })

  const syncForm = (source) => {
    const snapshot = {
      status: source?.status ?? null,
      contractDate: source?.contractDate ?? null,
      activationDate: source?.activationDate ?? null,
    }
    savedSnapshot.value = { ...snapshot }
    form.status = snapshot.status
    form.contractDate = snapshot.contractDate
    form.activationDate = snapshot.activationDate
  }

  const rawHistory = ref([])
  const isHistoryLoading = ref(false)
  const historyError = ref(null)

  const history = computed(() => buildHistoryRows(rawHistory.value, statusLabels.value))

  const fetchHistory = async () => {
    const id = branchId.value
    if (!id) {
      rawHistory.value = []
      return
    }
    isHistoryLoading.value = true
    historyError.value = null
    try {
      const response = await apiGetBranchStatusHistory(id)
      rawHistory.value = response?.data?.items ?? []
    } catch (error) {
      historyError.value = error
      rawHistory.value = []
    } finally {
      isHistoryLoading.value = false
    }
  }

  watch(currentStatus, syncForm, { immediate: true, deep: true })
  watch(
    branchId,
    () => {
      syncForm(currentStatus.value)
      fetchHistory()
    },
    { immediate: true }
  )

  const isFieldChanged = (field) =>
    normalizeField(field, savedSnapshot.value[field]) !== normalizeField(field, form[field])

  const hasChanges = computed(() => INTERNAL_FIELDS.some((field) => isFieldChanged(field)))

  const isSubmitting = ref(false)

  const reset = () => {
    syncForm(currentStatus.value)
  }

  const submit = async () => {
    if (isSubmitting.value) return { success: false, busy: true }
    const changedFields = INTERNAL_FIELDS.filter((field) => isFieldChanged(field))
    if (changedFields.length === 0) return { success: true, changedCount: 0, noOp: true }

    if (form.status === inactiveStatusId.value && isFieldChanged('status')) {
      let impact
      try {
        impact = await apiGetBranchDeactivationImpact(branchId.value)
      } catch (error) {
        return { success: false, error }
      }
      const affectedUserCount = impact?.data?.affected_user_count ?? 0
      const confirmed = await confirmDeactivation(affectedUserCount)
      if (!confirmed) return { success: false, cancelled: true }
    }

    isSubmitting.value = true
    try {
      const branchData = branch.value
      const payload = {
        name: branchData?.name ?? '',
        data: {
          phone: branchData?.data?.phone ?? [],
          address: branchData?.data?.address ?? '',
          location: branchData?.data?.location ?? null,
        },
        contract_date: form.contractDate,
        activation_date: form.activationDate,
        status_id: form.status,
      }
      const response = await apiUpdateBranch(payload, branchId.value)
      savedSnapshot.value = {
        status: form.status,
        contractDate: form.contractDate,
        activationDate: form.activationDate,
      }
      fetchHistory()
      return {
        success: true,
        changedCount: changedFields.length,
        message: response?.message,
      }
    } catch (error) {
      return { success: false, error }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    form,
    statusOptions,
    isStatusOptionsLoading,
    hasChanges,
    isSubmitting,
    submit,
    reset,
    history,
    isHistoryLoading,
    historyError,
    refreshHistory: fetchHistory,
  }
}
