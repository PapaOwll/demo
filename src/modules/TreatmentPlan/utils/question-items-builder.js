import { teethMapping } from '../constants/teeth'
import { QUESTION_TYPE } from '../constants/enums'
import { convertTeethToShowableTeeth } from '@/modules/TreatmentPlan/utils/teeth'

/**
 * Builds serve industry items for PER_TEETH question type
 * Aggregates duplicate tooth items and calculates units
 *
 * @param {Object} question - Question object with teeth and items
 * @returns {Array<{id: number, unit: number, price: number}>} Array of item objects
 */
export const buildTypeFourItems = (question) => {
  const items = []

  question.teeth?.forEach((tooth) => {
    const toothItem = question.items.find((_t) => Number(_t.title) === teethMapping[tooth])

    if (!toothItem) {
      return
    }

    const existingItemIndex = items.findIndex((_item) => _item?.id === toothItem.id)

    if (existingItemIndex === -1) {
      items.push({ id: toothItem.id, unit: 1, price: toothItem.price })
    } else {
      items[existingItemIndex] = {
        ...items[existingItemIndex],
        unit: items[existingItemIndex].unit + 1,
      }
    }
  })

  return items
}

/**
 * Builds serve industry items for multi-select question types
 * Creates separate item for each selected option
 *
 * @param {Object} question - Question object with items array
 * @returns {Array<{id: number, unit: number, price: number}>} Array of item objects or empty array
 */
export const buildMultiSelectItems = (question) => {
  if (!question.items || question.items.length === 0) {
    return []
  }

  return question.items.map((questionItem) => ({
    id: questionItem.id,
    unit: 1,
    price: questionItem.price,
  }))
}

/**
 * Checks if question type supports multiple selections
 *
 * @param {number} questionType - QUESTION_TYPE enum value
 * @returns {boolean} True if multi-select supported
 */
export const isMultiSelectQuestionType = (questionType) => {
  return [QUESTION_TYPE.PER_QUADRANT, QUESTION_TYPE.SIMPLE_MULTIPLE].includes(questionType)
}

/**
 * Builds serve industry items for single-select question types
 * Creates single record from first item
 *
 * @param {Object} question - Question object with items array
 * @returns {Object} Single item object with id, unit, and price
 */
export const buildSingleSelectItem = (question) => {
  if (!question.items || question.items.length === 0) {
    return null
  }

  return {
    id: question.items[0].id,
    unit:
      question.type === QUESTION_TYPE.MULTIPLE && question.coefficient
        ? question.items[0]?.pivot?.unit
        : 1,
    price: question.items[0].price,
  }
}

/**
 * Main builder function for serve_industry_items array
 * Routes to appropriate builder based on question type
 *
 * @param {Object} question - Question object with type and items
 * @returns {Array<{id: number, unit: number, price: number}>|Object|null} Items array or single item object
 */
export const buildServeIndustryItems = (question) => {
  if (question.type === QUESTION_TYPE.PER_TEETH) {
    return buildTypeFourItems(question)
  }

  if (isMultiSelectQuestionType(question.type)) {
    return buildMultiSelectItems(question)
  }

  return buildSingleSelectItem(question)
}

export const buildServeIndustries = (teethData) => {
  if (!teethData) return []

  return teethData
    .map((t) => {
      const teeth = convertTeethToShowableTeeth(t.teeth)
        .map((ts) => ({
          position: ts.key,
          number: ts.teeth.map((_tooth) => +_tooth),
        }))
        .filter((_item) => _item.number.length > 0)

      return {
        serve_industry_id: t.serve?.id,
        teeth,
      }
    })
    .filter((item) => item.teeth.length > 0)
}
