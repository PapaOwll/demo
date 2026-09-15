import { QUESTION_TYPE } from './enums'
import { teethMapping } from './teeth'
import { CHART_TYPES } from './chart-types'

/**
 * @param {Array} questions
 * @param {string} chartType
 * @returns {Array}
 */
export const filterQuestionsByChartType = (questions, chartType) => {
  if (!questions || questions.length === 0) return []
  if (chartType === 'dental') {
    return questions.filter(
      (q) =>
        [QUESTION_TYPE.MULTIPLE, QUESTION_TYPE.PER_TEETH, QUESTION_TYPE.UNIT_WITH_TEETH].includes(
          q.type
        ) ||
        ([QUESTION_TYPE.PER_UNIT].includes(q.type) && !q.coefficient)
    )
  }

  if (chartType === 'jaw-bone') {
    return questions.filter(
      (q) =>
        [
          QUESTION_TYPE.PER_JAW,
          QUESTION_TYPE.YES_NO,
          QUESTION_TYPE.PER_QUADRANT,
          QUESTION_TYPE.SIMPLE_MULTIPLE,
        ].includes(q.type) ||
        ([QUESTION_TYPE.PER_UNIT].includes(q.type) && q.coefficient)
    )
  }

  return questions
}

/**
 * @param {Array} questions
 * @param {Array} selectedTeeth
 * @returns {Object}
 */
export const groupQuestionsByTooth = (questions, selectedTeeth) => {
  const grouped = {}

  selectedTeeth.forEach((toothId) => {
    const toothNumber = teethMapping[toothId]
    grouped[toothId] = {
      toothNumber,
      questions: questions.filter((q) => q.teethRange?.includes(toothId) || !q.teethRange),
    }
  })

  return grouped
}

/**
 * @param {Object} service
 * @param {Array} [service.questions]
 * @param {Object} [service.questions.items]
 * @param {Array} [service.items]
 * @returns {Array}
 */
export const getServiceQuestions = (service) => {
  if (!service) {
    if (import.meta.env.DEV) {
      console.warn('[getServiceQuestions] No service provided')
    }
    return []
  }

  if (service.questions && Array.isArray(service.questions)) {
    return service.questions
  }

  if (service.questions?.items && Array.isArray(service.questions.items)) {
    return service.questions.items
  }

  if (service.items?.[0]?.items) {
    return service.items[0].items
  }

  if (import.meta.env.DEV && (service.questions || service.items)) {
    console.warn('[getServiceQuestions] Unexpected service structure:', {
      hasQuestions: !!service.questions,
      questionsType: typeof service.questions,
      hasItems: !!service.items,
      serviceId: service.id,
    })
  }

  return []
}

/**

 * @param {Object} service 
 * @returns {string} (CHART_TYPES.DENTAL یا CHART_TYPES.JAW_BONE)
 * const service = { questions: [{ type: QUESTION_TYPE.PER_UNIT }] }
 * getRecommendedChartType(service) // returns 'jaw-bone'
 * const service2 = { questions: [{ type: QUESTION_TYPE.MULTIPLE }] }
 * getRecommendedChartType(service2) // returns 'dental'
 */
export const getRecommendedChartType = (service) => {
  const questions = getServiceQuestions(service)
  if (!questions || questions.length === 0) {
    return CHART_TYPES.DENTAL
  }

  const hasDentalQuestions = questions.some((q) => {
    if (typeof q?.type !== 'number') {
      return false
    }
    return [
      QUESTION_TYPE.MULTIPLE,
      QUESTION_TYPE.PER_TEETH,
      QUESTION_TYPE.UNIT_WITH_TEETH,
    ].includes(q.type)
  })

  if (hasDentalQuestions) {
    return CHART_TYPES.DENTAL
  }
  const hasJawBoneQuestions = questions.some((q) => {
    if (typeof q?.type !== 'number') {
      return false
    }
    return [
      QUESTION_TYPE.PER_UNIT,
      QUESTION_TYPE.PER_JAW,
      QUESTION_TYPE.YES_NO,
      QUESTION_TYPE.PER_QUADRANT,
      QUESTION_TYPE.SIMPLE_MULTIPLE,
    ].includes(q.type)
  })

  return hasJawBoneQuestions ? CHART_TYPES.JAW_BONE : CHART_TYPES.DENTAL
}

export const QUESTION_DISPLAY_TYPES = {
  DROPDOWN: 'dropdown',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  TEXT: 'text',
  // MULTI_SELECT: 'multi-select', // Currently unused - reserved for future question types
}

/**
 * @param {number} questionType
 * @returns {string}
 */
export const getQuestionDisplayType = (questionType) => {
  switch (questionType) {
    case QUESTION_TYPE.MULTIPLE:
    case QUESTION_TYPE.PER_UNIT:
    case QUESTION_TYPE.PER_JAW:
    case QUESTION_TYPE.PER_QUADRANT:
    case QUESTION_TYPE.UNIT_WITH_TEETH:
    case QUESTION_TYPE.SIMPLE_MULTIPLE: {
      return QUESTION_DISPLAY_TYPES.DROPDOWN
    }

    case QUESTION_TYPE.YES_NO: {
      return QUESTION_DISPLAY_TYPES.CHECKBOX
    }

    default: {
      return ''
    }
  }
}
