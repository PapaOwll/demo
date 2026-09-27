import { computed } from 'vue'
import { useGetManualPaymentConfigQuery } from '@/modules/User/query'
import { getPerms } from '@/utils/get-perms'

const MANUAL_PAYMENT_PERMISSION = 'manualPayment'

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
