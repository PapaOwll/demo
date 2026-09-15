import { computed } from 'vue'
import { useGetManualPaymentConfigQuery } from '@/modules/User/query'
import { getPerms } from '@/utils/get-perms'

const MANUAL_PAYMENT_PERMISSION = 'manualPayment'

/**
 * Extracts a user-facing message from a manual-payment API error.
 *
 * The backend returns the actionable text in `response.data.message`
 * for every failure case (403 branch-not-enabled, 403 permission-denied,
 * 422 validation, 400 infra error, 422 missing MinaDoc record).
 *
 * @param {unknown} error
 * @returns {string}
 */
export const extractManualPaymentError = (error) => {
  const responseMessage = error?.response?.data?.message
  if (responseMessage) return responseMessage

  const dataMessage = error?.response?.data?.data?.message
  if (dataMessage) return dataMessage

  if (error?.response?.data?.error) return error.response.data.error

  return error?.message || 'خطا در ثبت پرداخت دستی'
}

/**
 * Wraps the per-branch manual-payment config.
 *
 * The feature is gated by BOTH the operator permission
 * (`manualPayment.add`) AND the per-branch `enabled` flag returned by
 * the config endpoint. The config is cached at session level (see the query
 * hook) so it is not re-fetched per patient.
 */
export const useManualPayment = () => {
  const canAddManualPayment = getPerms('treatment-plan', 'add', true, MANUAL_PAYMENT_PERMISSION)

  const { data: configData } = useGetManualPaymentConfigQuery({
    enabled: canAddManualPayment,
  })

  const isEnabled = computed(() => !!configData.value?.enabled && canAddManualPayment)

  const paymentTypes = computed(() => configData.value?.types || [])

  const typeOptions = computed(() =>
    paymentTypes.value.map((type) => ({
      label: type.name ?? type.title,
      value: type.code ?? type.key,
    }))
  )

  return {
    isEnabled,
    typeOptions,
  }
}
