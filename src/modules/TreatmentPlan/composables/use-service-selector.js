import { computed, ref } from 'vue'
import { QUESTION_TYPE } from '../constants/enums'
import {
  filterQuestionsByChartType,
  getServiceQuestions,
  groupQuestionsByTooth,
  hasUnsetBaseCount,
} from '../constants/service-question-types'
import { CHART_TYPES, DEFAULT_CHART_TYPE } from '../constants/chart-types'

/**
 * @param {Ref|Object} service
 * @param {Object} initialData
 * @returns {Object}
 */
export const useServiceSelector = (service, initialData = null) => {
  const selectedTeeth = ref(initialData?.selectedTeeth || [])
  const selectedRegions = ref(initialData?.selectedRegions || [])
  const selectedChartType = ref(initialData?.chartType || DEFAULT_CHART_TYPE)
  const itemAnswers = ref(initialData?.items || {})
  const descriptionText = ref(initialData?.description || '')
  const ignoreNotType4 = ref(false)

  const serviceQuestions = computed(() => {
    const serviceValue = service.value || service
    return getServiceQuestions(serviceValue)
  })

  const filteredQuestions = computed(() => {
    return filterQuestionsByChartType(serviceQuestions.value, selectedChartType.value)
  })

  const hasJawChart = computed(() => {
    return serviceQuestions.value.some((_q) =>
      [
        QUESTION_TYPE.PER_JAW,
        QUESTION_TYPE.PER_UNIT,
        QUESTION_TYPE.YES_NO,
        QUESTION_TYPE.PER_QUADRANT,
        QUESTION_TYPE.SIMPLE_MULTIPLE,
      ].includes(_q.type)
    )
  })

  const questionsByTooth = computed(() => {
    if (selectedTeeth.value.length === 0) return {}
    return groupQuestionsByTooth(filteredQuestions.value, selectedTeeth.value)
  })

  const outputData = computed(() => {
    const serviceValue = service.value || service
    const chartTypeValue = selectedChartType.value

    const result = {
      serviceId: serviceValue?.id,
      chartType: chartTypeValue,
      items: itemAnswers.value,
      description: descriptionText.value,
      isIgnored: false,
    }

    const type4QuestionIds = serviceQuestions.value
      .filter((q) => Number(q.type) === 4)
      .map((q) => q.id)
    const notType4QuestionIds = serviceQuestions.value
      .filter((q) => Number(q.type) !== 4)
      .map((q) => q.id)

    const filteredItems = {}
    const allowedIds = ignoreNotType4.value ? type4QuestionIds : notType4QuestionIds
    Object.entries(itemAnswers.value).forEach(([questionId, answer]) => {
      if (allowedIds.includes(Number(questionId))) {
        filteredItems[questionId] = answer
      }
    })

    result.items = filteredItems
    result.isIgnored = ignoreNotType4.value

    if (chartTypeValue === CHART_TYPES.DENTAL) {
      result.selectedTeeth = selectedTeeth.value
      result.selectedRegions = []
    } else if (chartTypeValue === CHART_TYPES.JAW_BONE) {
      result.selectedRegions = selectedRegions.value
      result.selectedTeeth = []
    } else {
      result.selectedTeeth = []
      result.selectedRegions = []
    }

    return result
  })

  const toggleTooth = (toothId) => {
    const index = selectedTeeth.value.indexOf(toothId)
    if (index > -1) {
      selectedTeeth.value.splice(index, 1)
    } else {
      selectedTeeth.value.push(toothId)
    }
  }

  const toggleRegion = (regionId) => {
    const index = selectedRegions.value.indexOf(regionId)
    if (index > -1) {
      selectedRegions.value.splice(index, 1)
    } else {
      selectedRegions.value.push(regionId)
    }
  }

  const setItemAnswer = (itemId, value) => {
    itemAnswers.value[itemId] = value
  }

  const getItemAnswer = (itemId) => {
    return itemAnswers.value[itemId]
  }

  const setDescription = (text) => {
    descriptionText.value = text
  }

  const setChartType = (chartType) => {
    const validTypes = Object.values(CHART_TYPES)
    if (!validTypes.includes(chartType)) {
      return
    }
    selectedChartType.value = chartType
  }

  const reset = () => {
    selectedTeeth.value = []
    selectedRegions.value = []
    itemAnswers.value = {}
    descriptionText.value = ''
    ignoreNotType4.value = false
  }

  const toggleIgnoreType4 = () => {
    ignoreNotType4.value = !ignoreNotType4.value
  }

  const loadData = (data) => {
    if (data?.selectedTeeth) {
      selectedTeeth.value = [...data.selectedTeeth]
    }
    if (data?.selectedRegions) {
      selectedRegions.value = [...data.selectedRegions]
    }
    if (data?.chartType) {
      selectedChartType.value = data?.chartType
    }
    if (data?.items) {
      itemAnswers.value = { ...data.items }
    }
    if (data?.description !== undefined) {
      descriptionText.value = data.description
    }
    if (data?.isIgnored !== undefined) {
      ignoreNotType4.value = data.isIgnored
    }
  }

  const isValid = computed(() => {
    const serviceValue = service.value || service
    const questions = getServiceQuestions(serviceValue)

    const hasType4Questions = serviceQuestions.value.some((q) => Number(q.type) === 4)
    if (hasType4Questions && ignoreNotType4.value) {
      return selectedTeeth.value.length > 0
    }

    if (hasUnsetBaseCount(filteredQuestions.value, itemAnswers.value)) {
      return false
    }

    const needsTeeth =
      questions?.some(
        (question) => question.type === QUESTION_TYPE.MULTIPLE && !question.coefficient
      ) || false

    return selectedChartType.value === CHART_TYPES.DENTAL
      ? !(needsTeeth && selectedTeeth.value.length === 0)
      : true
  })

  return {
    // State
    selectedTeeth,
    selectedRegions,
    selectedChartType,
    itemAnswers,
    descriptionText,
    ignoreNotType4,

    // Computed
    serviceQuestions,
    filteredQuestions,
    questionsByTooth,
    outputData,
    isValid,
    hasJawChart,

    // Actions
    toggleTooth,
    toggleRegion,
    setItemAnswer,
    getItemAnswer,
    setDescription,
    setChartType,
    reset,
    loadData,
    toggleIgnoreType4,
  }
}
