import { computed, ref, watch } from 'vue'
import { formatDate, convertToGregorian } from '@/utils/date-utils'
import { isToothStatusMatchingStep } from './use-tp-status'
import { convertShowableToothToTooth } from '../utils/teeth'
import { NEW_CALCULATION_CUTOVER_DATETIME } from '../constants/enums'

export function useTreatmentState({
  initialDataRef,
  getStep,
  // isPreview = false,
  serveDataRef = null,
}) {
  const updatedTreatmentData = ref(null)
  const finalPrice = ref(0)
  const newFinalPrice = ref(0)
  const selectedServe = ref(null)
  const selectedCheque = ref(null)

  const treatmentData = computed(() => updatedTreatmentData.value || initialDataRef.value || {})
  const isNewCalculationDate = computed(
    () =>
      formatDate(treatmentData.value?.createdAt, 'YYYY-MM-DD HH:mm:ss') >
      NEW_CALCULATION_CUTOVER_DATETIME
  )

  watch(
    () => initialDataRef.value,
    () => {
      updatedTreatmentData.value = null
    }
  )

  const updateTreatment = (updates) => {
    updatedTreatmentData.value = { ...treatmentData.value, ...updates }
  }

  const updateFinalPrice = (value) => {
    finalPrice.value = value >= 0 ? Math.round(value) : 0
  }

  const updateNewFinalPrice = (value) => {
    newFinalPrice.value = value >= 0 ? Math.round(value) : 0
  }

  const updateTeeth = (newTeeth) => {
    const hasTeeth = treatmentData?.value?.teeth?.find(
      (item) => item.serve.id === newTeeth.serve.id
    )

    updateTreatment({
      teeth: hasTeeth
        ? treatmentData?.value?.teeth?.map((item) =>
            item.serve.id === newTeeth.serve.id ? newTeeth : item
          )
        : [...(treatmentData?.value?.teeth || []), newTeeth],
    })
  }

  const updateItems = (item) => {
    const hasItem = treatmentData?.value?.items?.find((i) => item.id === i.id)
    updateTreatment({
      items: hasItem
        ? treatmentData?.value?.items?.map((i) => (item.id === i.id ? item : i))
        : [...(treatmentData?.value?.items || []), item],
    })
  }

  const removeService = (serve) => {
    const serveId = serve.serveId || serve.id

    if (selectedServe.value?.serveId === serveId) {
      selectedServe.value = null
    }

    updateTreatment({
      teeth: treatmentData?.value?.teeth?.filter((item) => item.serve.id !== serve.id) || [],
      items: treatmentData?.value?.items?.filter((item) => item.serveId !== serveId) || [],
    })
  }

  const filterTeethForServe = (serveTeethData) => {
    if (!serveTeethData || !serveTeethData.teeth?.length) return []

    const teethData = serveTeethData.serve?.teeth
    if (!teethData) return serveTeethData.teeth

    return serveTeethData.teeth.filter((toothId) => {
      const toothData = teethData.find((tooth) => convertShowableToothToTooth(tooth) === toothId)
      return isToothStatusMatchingStep(toothData, getStep())
    })
  }

  const filterAllTeeth = () => {
    const treatmentDataValue = treatmentData.value
    if (!treatmentDataValue || !Array.isArray(treatmentDataValue.teeth)) return

    const updatedTeeth = treatmentDataValue.teeth.map((serveTeethData) => {
      if (!serveTeethData.teeth?.length) return serveTeethData

      const filteredTeeth = filterTeethForServe(serveTeethData)

      if (filteredTeeth.length !== serveTeethData.teeth.length) {
        return {
          ...serveTeethData,
          teeth: filteredTeeth,
          total: filteredTeeth.length,
        }
      }
      return serveTeethData
    })

    const hasChanges = updatedTeeth.some((item, index) => item !== treatmentDataValue.teeth[index])
    if (hasChanges) {
      updateTreatment({ teeth: updatedTeeth })
    }
  }

  const onSelectServe = (serve) => {
    selectedServe.value = serve
    // if (isPreview) return
    //
    // const serveTeethData = treatmentData?.value?.teeth?.find((item) => item.serve.id === serve.id)
    //
    // if (serveTeethData && serveTeethData.teeth?.length) {
    //   const filteredTeeth = filterTeethForServe(serveTeethData)
    //
    //   if (filteredTeeth.length !== serveTeethData.teeth.length) {
    //     updateTeeth({
    //       ...serveTeethData,
    //       teeth: filteredTeeth,
    //       total: filteredTeeth.length,
    //     })
    //   }
    // }
  }

  const updateSelectedInstallment = (installment) => {
    updateTreatment({ installment, prepaymentPercent: null })
    selectedCheque.value = null
  }

  const updateSelectedCheque = (cheque) => {
    selectedCheque.value = cheque
    const cheques = cheque?.dates.map((ch) => ({
      price: Number(cheque?.chequeAmount.replace(/,/g, '')),
      time: convertToGregorian(ch),
    }))
    updateTreatment({ cheques })
  }

  const autoSelectServe = computed(() => {
    if (selectedServe.value) return null
    const serves = serveDataRef?.value
    if (!serves?.length) return null

    const teeth = treatmentData.value?.teeth
    const items = treatmentData.value?.items

    const withTeeth = serves.find((s) =>
      teeth?.find((t) => t.serve.id === s.id && t.teeth?.length > 0)
    )
    if (withTeeth) return withTeeth

    const withItems = serves.find((s) => items?.some((i) => i.serveId === s.id))
    if (withItems) return withItems

    return serves[0]
  })

  const resetLocalState = () => {
    updatedTreatmentData.value = null
    selectedServe.value = null
    selectedCheque.value = null
  }

  return {
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
    filterTeethForServe,
    filterAllTeeth,
    resetLocalState,
  }
}
