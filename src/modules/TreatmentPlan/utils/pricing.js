import { teethMapping } from '../constants/teeth'
import { QUESTION_TYPE } from '../constants/enums'

/**
 * Find the item that should be used for pricing calculations
 * First tries to find item with isProposed: true, falls back to first item
 * @param {Array} items - Array of question items
 * @returns {Object|null} The proposed item or first item as fallback
 */
const findProposedItem = (items) => {
  if (!items?.length) return null
  const proposedItems = items.filter((it) => it?.pivot?.isProposed)

  if (proposedItems.length > 1) {
    console.warn('[pricing] Multiple items have isProposed: true. Using first match.', {
      itemCount: items.length,
      proposedCount: proposedItems.length,
    })
  }

  return proposedItems[0] || items[0]
}

export const calculateTypeFourPrice = (question) => {
  return (
    question?.teeth?.reduce((prev, tooth) => {
      const mappedToothNumber = teethMapping[tooth]
      const matchedItem = question?.items.find((item) => Number(item.title) === mappedToothNumber)
      return (Number(matchedItem?.price) || 0) + prev
    }, 0) || 0
  )
}

export const calculateServePrice = (question, item) => {
  const pricedItem = findProposedItem(question.items)

  return question.type === QUESTION_TYPE.PER_TEETH
    ? calculateTypeFourPrice(question)
    : question.type === QUESTION_TYPE.MULTIPLE
      ? question.coefficient
        ? (pricedItem?.price || 0) * (pricedItem?.pivot?.unit || 0)
        : item?.teeth
          ? (pricedItem?.price || 0) * item.teeth.length
          : 0
      : question.type === QUESTION_TYPE.PER_QUADRANT
        ? question.items?.reduce((sum, qItem) => sum + (Number(qItem.price) || 0), 0) || 0
        : question.type === QUESTION_TYPE.SIMPLE_MULTIPLE
          ? question.items?.reduce((sum, qItem) => sum + (Number(qItem.price) || 0), 0) || 0
          : pricedItem?.price || 0
}

export const calculateItemPrice = (item) => {
  return (
    item.questions?.reduce(
      (prev, question) => prev + Number(calculateServePrice(question, item)),
      0
    ) || 0
  )
}
