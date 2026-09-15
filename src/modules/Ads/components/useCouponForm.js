import { computed } from 'vue'
import { couponValidationSchema } from './couponSchema'
import useYup from '@/composables/use-yup'
import {
  isAllSelected,
  shouldDisableQuestions,
  shouldDisableItems,
  shouldDisableAddItem,
  shouldDisableAddServe as shouldDisableAddServeFn,
  getAvailableQuestions,
  shouldShowDeleteButton,
  getAddItemTooltip,
  getAvailableItems,
  transformConditionsToFormServes,
  transformFormDataToApi,
} from './couponHelpers'

const DEFAULT_DISCOUNT_TYPE = 'percent'

/**
 * Composable for coupon form logic
 * @param {import('vue').Ref} formData - Reactive form data
 * @param {import('vue').Ref} allServes - Reactive all serves data
 * @returns {Object} Form utilities, computed properties, and actions
 */
export function useCouponForm(formData, allServes) {
  const { validate, validateAt, errors } = useYup(couponValidationSchema)

  const availableQuestionsMap = computed(() =>
    formData.value.conditions.map((_, serveIndex) =>
      getAvailableQuestions(serveIndex, formData.value.conditions, allServes.value)
    )
  )

  const availableItemsMap = computed(() =>
    formData.value.conditions.map((serve, serveIndex) =>
      serve.items.map((_, itemIndex) =>
        getAvailableItems(serveIndex, itemIndex, formData.value.conditions, allServes.value)
      )
    )
  )

  const isAllSelectedMap = computed(() =>
    formData.value.conditions.map((_, serveIndex) =>
      isAllSelected(serveIndex, formData.value.conditions)
    )
  )

  const shouldDisableQuestionsMap = computed(() =>
    formData.value.conditions.map((_, serveIndex) =>
      shouldDisableQuestions(serveIndex, formData.value.conditions)
    )
  )

  const shouldDisableItemsMap = computed(() =>
    formData.value.conditions.map((serve, serveIndex) =>
      serve.items.map((_, itemIndex) =>
        shouldDisableItems(serveIndex, itemIndex, formData.value.conditions)
      )
    )
  )

  const shouldDisableAddItemMap = computed(() =>
    formData.value.conditions.map((_, serveIndex) =>
      shouldDisableAddItem(serveIndex, formData.value.conditions)
    )
  )

  const shouldDisableAddServe = computed(() => shouldDisableAddServeFn(formData.value.conditions))

  const shouldShowDeleteButtonMap = computed(() =>
    formData.value.conditions.map((_, serveIndex) =>
      shouldShowDeleteButton(serveIndex, formData.value.conditions)
    )
  )

  const getAddItemTooltipMap = computed(() =>
    formData.value.conditions.map((_, serveIndex) =>
      getAddItemTooltip(
        serveIndex,
        formData.value.conditions,
        (idx) => availableQuestionsMap.value[idx]
      )
    )
  )

  /**
   * Updates a form field and validates it
   * @param {string} field - Field name
   * @param {*} value - New value
   */
  const updateField = async (field, value) => {
    // eslint-disable-next-line no-param-reassign
    formData.value[field] = value

    if (field === 'code') {
      errors.value.code = null
    }

    await validateAt(field, value, formData.value)
  }

  /**
   * Updates a serve field and validates it
   * @param {number} serveIndex - Index of the serve group
   * @param {string} field - Field name
   * @param {*} value - New value
   */
  const updateServeField = async (serveIndex, field, value) => {
    const serveData = formData.value.conditions[serveIndex]

    await validateAt(`conditions[${serveIndex}].${field}`, value, formData.value)

    if (field === 'serveIndustryId') {
      serveData[field] = value
      serveData.items = [
        {
          serveIndustryQuestionId: null,
          serveIndustryItemId: null,
          discountValue: '',
          discountType: DEFAULT_DISCOUNT_TYPE,
        },
      ]

      errors.value[`conditions[${serveIndex}].items`] = null
      return
    }

    serveData[field] = value
  }

  /**
   * Updates an item field and clears related errors
   * @param {number} serveIndex - Index of the serve group
   * @param {number} itemIndex - Index of the item
   * @param {string} field - Field name
   * @param {*} value - New value
   */
  const updateItemField = (serveIndex, itemIndex, field, value) => {
    const itemData = formData.value.conditions[serveIndex].items[itemIndex]

    errors.value[`conditions[${serveIndex}].items[${itemIndex}].${field}`] = null

    if (field === 'serveIndustryQuestionId') {
      itemData[field] = value
      itemData.serveIndustryItemId = null
      itemData.discountValue = ''
      itemData.discountType = DEFAULT_DISCOUNT_TYPE
      return
    }

    itemData[field] = value
  }

  /**
   * Adds a new item to a serve group
   * @param {number} serveIndex - Index of the serve group
   */
  const addItem = (serveIndex) => {
    formData.value.conditions[serveIndex].items.push({
      serveIndustryQuestionId: null,
      serveIndustryItemId: null,
      discountValue: '',
      discountType: DEFAULT_DISCOUNT_TYPE,
    })
  }

  /**
   * Removes an item from a serve group
   * @param {number} serveIndex - Index of the serve group
   * @param {number} itemIndex - Index of the item to remove
   */
  const removeItem = (serveIndex, itemIndex) => {
    formData.value.conditions[serveIndex].items.splice(itemIndex, 1)
  }

  /**
   * Adds a new serve group to conditions
   */
  const addServe = () => {
    formData.value.conditions.push({
      serveIndustryId: null,
      items: [
        {
          serveIndustryQuestionId: null,
          serveIndustryItemId: null,
          discountValue: '',
          discountType: DEFAULT_DISCOUNT_TYPE,
        },
      ],
    })
  }

  /**
   * Removes a serve group from conditions
   * @param {number} serveIndex - Index of the serve group to remove
   */
  const removeServe = (serveIndex) => {
    formData.value.conditions.splice(serveIndex, 1)
  }

  return {
    validate,
    validateAt,
    errors,

    availableQuestionsMap,
    availableItemsMap,
    isAllSelectedMap,
    shouldDisableQuestionsMap,
    shouldDisableItemsMap,
    shouldDisableAddItemMap,
    shouldDisableAddServe,
    shouldShowDeleteButtonMap,
    getAddItemTooltipMap,

    updateField,
    updateServeField,
    updateItemField,
    addItem,
    removeItem,
    addServe,
    removeServe,

    transformConditionsToFormServes,
    transformFormDataToApi,
  }
}
