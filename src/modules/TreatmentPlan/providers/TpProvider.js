import { useRoute } from 'vue-router'
import { provide, readonly, computed, watch, onUnmounted } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import {
  useGetServeItemsQuery,
  useGetTreatmentPlanByIdQuery,
  useGetTreatmentPlanByKeyQuery,
} from '../query'
import { useTpStatus } from '../composables/use-tp-status'
import { useTreatmentState } from '../composables/use-treatment-state'
import { TREATMENT_PLAN_STEP } from '../constants/enums'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import { mockGetTreatmentPlanDetail } from '@/mocks/user-details/treatment-plan'

export const TpStoreSymbol = Symbol('tp-store')

export default {
  name: 'TpProvider',
  props: {
    mode: {
      type: String,
      default: 'edit',
      validator: (v) =>
        v === 'edit' || v === 'preview' || v === 'create' || v === 'draft' || v === 'view',
    },
    treatmentPlanId: {
      type: [String, Number],
      default: null,
    },
    treatmentPlanKey: {
      type: String,
      default: null,
    },
  },
  setup(props) {
    const route = useRoute()
    const queryClient = useQueryClient()

    const isPreview = props.mode === 'preview'
    const isEdit = props.mode === 'edit'
    const isView = props.mode === 'view'

    const editId = computed(() =>
      isPreview ? null : (props.treatmentPlanId ?? route.params?.id ?? null)
    )
    const previewKey = computed(() =>
      isPreview ? (props.treatmentPlanKey ?? route.params?.key ?? null) : null
    )

    const { data: editData } = useGetTreatmentPlanByIdQuery(editId, {
      enabled: computed(() => isEdit || isView),
      ...(ENABLE_USER_DETAIL_MOCKS
        ? { queryFn: () => mockGetTreatmentPlanDetail(editId.value) }
        : {}),
    })
    const { data: previewData } = useGetTreatmentPlanByKeyQuery(previewKey, {
      enabled: computed(() => isPreview),
      ...(ENABLE_USER_DETAIL_MOCKS
        ? { queryFn: () => mockGetTreatmentPlanDetail(previewKey.value) }
        : {}),
    })
    const initialTreatmentData = computed(() => (isPreview ? previewData.value : editData.value))

    const { data: serveData } = useGetServeItemsQuery(
      { treatmentPlanId: isPreview ? previewKey.value : editId.value },
      { enabled: !isPreview }
    )

    let backendStepNumber
    const getStep = () => (isPreview ? TREATMENT_PLAN_STEP.PROPOSED : backendStepNumber?.value)
    const {
      finalPrice,
      newFinalPrice,
      selectedServe,
      selectedCheque,
      treatmentData,
      isNewCalculationDate,
      autoSelectServe,
      updateTreatment,
      updateFinalPrice,
      updateNewFinalPrice,
      updateTeeth,
      updateItems,
      removeService,
      onSelectServe,
      updateSelectedInstallment,
      updateSelectedCheque,
      filterAllTeeth,
      resetLocalState,
    } = useTreatmentState({
      initialDataRef: initialTreatmentData,
      getStep,
      isPreview,
      serveDataRef: serveData,
    })

    if (!isPreview) {
      ;({ backendStepNumber } = useTpStatus(treatmentData))
    }
    const store = isPreview
      ? {
          state: {
            treatmentData: readonly(treatmentData),
            finalPrice: readonly(finalPrice),
            newFinalPrice: readonly(newFinalPrice),
            isNewCalculationDate: readonly(isNewCalculationDate),
            selectedServe: readonly(selectedServe),
          },
          actions: {
            updateFinalPrice,
            updateNewFinalPrice,
            onSelectServe,
          },
          mode: props.mode,
        }
      : {
          state: {
            treatmentData: readonly(treatmentData),
            serveData: readonly(serveData),
            finalPrice: readonly(finalPrice),
            newFinalPrice: readonly(newFinalPrice),
            isNewCalculationDate: readonly(isNewCalculationDate),
            selectedServe: readonly(selectedServe),
            selectedCheque: readonly(selectedCheque),
          },
          actions: {
            updateFinalPrice,
            updateNewFinalPrice,
            onSelectServe,
            updateTeeth,
            updateItems,
            updateSelectedInstallment,
            updateSelectedCheque,
            updateTreatment,
            removeService,
            resetLocalState,
          },
          mode: props.mode,
        }
    provide(TpStoreSymbol, store)

    onUnmounted(async () => {
      resetLocalState()
      const usedId = editId.value
      if (isEdit && usedId) {
        await queryClient.invalidateQueries({
          queryKey: ['new-treatment-plan', 'treatment', usedId],
        })
      }
    })
    watch(
      () => initialTreatmentData.value,
      (val) => {
        if (val && !isView) filterAllTeeth()
      },
      { immediate: true }
    )

    if (!isPreview && !isView) {
      watch(
        autoSelectServe,
        (serve) => {
          if (serve) selectedServe.value = serve
        },
        { immediate: true }
      )
    }
  },
  render() {
    return this.$slots.default()
  },
}

if (import.meta.hot) {
  import.meta.hot.accept()
}
