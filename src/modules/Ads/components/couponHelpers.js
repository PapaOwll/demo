/**
 * Constants for coupon form
 */
export const ALL_OPTION = 0
export const ALL_TITLE = 'همه'

/**
 * Safely extracts ID from a value that might be an object with id property or a primitive
 * @param {*} value - The value to extract ID from
 * @returns {*} The extracted ID or the original value
 */
export const extractId = (value) => {
  if (value == null) return value
  if (typeof value === 'object' && 'id' in value) {
    return value.id
  }
  return value
}

/**
 * Checks if "All" option is selected for a serve
 * @param {number} serveIndex - Index of the serve group in conditions array
 * @param {Array} conditions - Array of condition objects
 * @returns {boolean} True if "All" option is selected
 */
export const isAllSelected = (serveIndex, conditions) => {
  const id = extractId(conditions[serveIndex]?.serveIndustryId)
  return id === ALL_OPTION
}

/**
 * Determines if question selection should be disabled
 * @param {number} serveIndex - Index of the serve group in conditions array
 * @param {Array} conditions - Array of condition objects
 * @returns {boolean} True if questions should be disabled
 */
export const shouldDisableQuestions = (serveIndex, conditions) => {
  const serve = conditions[serveIndex]
  if (!serve?.serveIndustryId) return true

  const serveId = extractId(serve.serveIndustryId)
  return serveId === ALL_OPTION
}

/**
 * Determines if item selection should be disabled
 * @param {number} serveIndex - Index of the serve group in conditions array
 * @param {number} itemIndex - Index of the item in the serve's items array
 * @param {Array} conditions - Array of condition objects
 * @returns {boolean} True if items should be disabled
 */
export const shouldDisableItems = (serveIndex, itemIndex, conditions) => {
  const serve = conditions[serveIndex]
  if (!serve?.serveIndustryId) return true

  const serveId = extractId(serve.serveIndustryId)
  if (serveId === ALL_OPTION) return true

  const item = serve.items[itemIndex]
  if (!item?.serveIndustryQuestionId) return false

  const questionId = extractId(item.serveIndustryQuestionId)
  return questionId === ALL_OPTION
}

/**
 * Determines if "Add Item" button should be disabled
 * @param {number} serveIndex - Index of the serve group in conditions array
 * @param {Array} conditions - Array of condition objects
 * @returns {boolean} True if add item button should be disabled
 */
export const shouldDisableAddItem = (serveIndex, conditions) => {
  const serve = conditions[serveIndex]
  if (!serve?.serveIndustryId) return true

  const serveId = extractId(serve.serveIndustryId)
  if (serveId === ALL_OPTION) return true

  const lastItem = serve.items.at(-1)
  if (!lastItem) return true

  if (!lastItem.serveIndustryQuestionId) return true

  const questionId = extractId(lastItem.serveIndustryQuestionId)
  return questionId === ALL_OPTION
}

/**
 * Determines if "Add Serve" button should be disabled
 * @param {Array} conditions - Array of condition objects
 * @returns {boolean} True if add serve button should be disabled
 */
export const shouldDisableAddServe = (conditions) => {
  const lastServe = conditions.at(-1)
  if (!lastServe?.serveIndustryId) return true

  const id = extractId(lastServe.serveIndustryId)
  return id === ALL_OPTION
}

/**
 * Gets available questions for a serve group based on current selections
 * Filters out questions that have all their items selected already
 * @param {number} serveIndex - Index of the serve group in conditions array
 * @param {Array} conditions - Array of condition objects with current selections
 * @param {Object} allServes - Object containing all serves data
 * @param {Array} allServes.items - Array of all available serves
 * @returns {Array} Array of available question objects with optional disabled property
 */
export const getAvailableQuestions = (serveIndex, conditions, allServes) => {
  const serveGroup = conditions[serveIndex]

  const serveGroupId = extractId(serveGroup?.serveIndustryId)
  if (serveGroupId === ALL_OPTION) {
    return [{ id: ALL_OPTION, title: ALL_TITLE }]
  }

  if (!serveGroup?.serveIndustryId) {
    return [{ id: ALL_OPTION, title: ALL_TITLE }]
  }

  if (!allServes?.items) {
    return [{ id: ALL_OPTION, title: ALL_TITLE }]
  }

  const serveId = extractId(serveGroup.serveIndustryId)
  const selectedServe = allServes.items.find((s) => s?.id === serveId)

  if (!selectedServe) {
    return [{ id: ALL_OPTION, title: ALL_TITLE }]
  }

  const questions = selectedServe?.questions || []

  if (!Array.isArray(questions) || questions.length === 0) {
    return [{ id: ALL_OPTION, title: ALL_TITLE }]
  }

  const isAllQuestionsSelected = serveGroup.items.some((item) => {
    return extractId(item?.serveIndustryQuestionId) === ALL_OPTION
  })

  if (isAllQuestionsSelected) {
    return []
  }

  const questionsWithAllItemsSelected = new Set()
  serveGroup.items.forEach((existingItem) => {
    const questionId = extractId(existingItem?.serveIndustryQuestionId)
    const itemId = extractId(existingItem?.serveIndustryItemId)

    if (questionId && itemId === ALL_OPTION) {
      questionsWithAllItemsSelected.add(questionId)
    }
  })

  const selectedItemsByQuestion = new Map()
  serveGroup.items.forEach((existingItem) => {
    const questionId = extractId(existingItem?.serveIndustryQuestionId)
    const itemId = extractId(existingItem?.serveIndustryItemId)

    if (questionId && itemId && questionId !== ALL_OPTION && itemId !== ALL_OPTION) {
      if (!selectedItemsByQuestion.has(questionId)) {
        selectedItemsByQuestion.set(questionId, new Set())
      }

      selectedItemsByQuestion.get(questionId).add(itemId)
    }
  })

  const validQuestions = questions
    .filter((q) => {
      if (q?.id == null) return false

      const questionItems = q?.items || []

      if (!Array.isArray(questionItems) || questionItems.length === 0) {
        return false
      }

      const validQuestionItems = questionItems.filter((item) => item?.id != null)

      if (validQuestionItems.length === 0) {
        return false
      }

      const allQuestionItemsSelected = validQuestionItems.every((item) => {
        const itemsSelectedForThisQuestion = selectedItemsByQuestion.get(q.id) || new Set()

        return itemsSelectedForThisQuestion.has(item.id)
      })

      return !allQuestionItemsSelected
    })
    .map((q) => ({
      ...q,
      disabled: questionsWithAllItemsSelected.has(q.id),
    }))

  if (validQuestions.length === 0) {
    return [{ id: ALL_OPTION, title: ALL_TITLE }]
  }

  return [{ id: ALL_OPTION, title: ALL_TITLE }, ...validQuestions]
}

/**
 * Determines if delete button should be shown for an item
 * @param {number} serveIndex - Index of the serve group in conditions array
 * @param {Array} conditions - Array of condition objects
 * @returns {boolean} True if delete button should be visible (more than 1 item)
 */
export const shouldShowDeleteButton = (serveIndex, conditions) => {
  const serveGroup = conditions[serveIndex]

  return serveGroup.items.length > 1
}

/**
 * Gets tooltip message explaining why "Add Item" button is disabled
 * @param {number} serveIndex - Index of the serve group in conditions array
 * @param {Array} conditions - Array of condition objects
 * @param {Function} getAvailableQuestionsFn - Function to get available questions
 * @returns {string} Tooltip message in Persian, or empty string if no tooltip
 */
export const getAddItemTooltip = (serveIndex, conditions, getAvailableQuestionsFn) => {
  const serve = conditions[serveIndex]

  const serveId = extractId(serve?.serveIndustryId)
  if (serveId === ALL_OPTION) {
    return 'برای افزودن آیتم، خدمت مجزا انتخاب کنید'
  }

  const lastItem = serve?.items.at(-1)

  const questionId = extractId(lastItem?.serveIndustryQuestionId)
  if (questionId === ALL_OPTION) {
    return 'برای افزودن جزئیات، آیتم مجزا انتخاب کنید'
  }

  const availableQuestions = getAvailableQuestionsFn(serveIndex)
  if (availableQuestions.length === 0) {
    return 'همه آیتم‌های تمام سوالات انتخاب شده‌اند'
  }

  const itemId = extractId(lastItem?.serveIndustryItemId)
  if (itemId === ALL_OPTION) {
    return 'همه آیتم‌ها انتخاب شده‌اند'
  }

  return ''
}

/**
 * Gets available items for a question based on current selections
 * Filters out items that are already selected for the same question
 * @param {number} serveIndex - Index of the serve group in conditions array
 * @param {number} itemIndex - Index of the item in the serve's items array
 * @param {Array} conditions - Array of condition objects with current selections
 * @param {Object} allServes - Object containing all serves data
 * @param {Array} allServes.items - Array of all available serves
 * @returns {Array|null} Array of available item objects, null if question is "All", or array with disabled "All" if all individual items selected
 */
export const getAvailableItems = (serveIndex, itemIndex, conditions, allServes) => {
  const serveGroup = conditions[serveIndex]
  const item = serveGroup?.items[itemIndex]

  const serveId = extractId(serveGroup?.serveIndustryId)
  if (serveId === ALL_OPTION) {
    return [{ id: ALL_OPTION, title: ALL_TITLE }]
  }

  const questionId = extractId(item?.serveIndustryQuestionId)
  if (questionId === ALL_OPTION) {
    return null
  }

  if (!item?.serveIndustryQuestionId) {
    return [{ id: ALL_OPTION, title: ALL_TITLE }]
  }

  if (!allServes?.items) {
    return [{ id: ALL_OPTION, title: ALL_TITLE }]
  }

  const selectedServe = allServes.items.find((s) => s?.id === serveId)

  if (!selectedServe) {
    return [{ id: ALL_OPTION, title: ALL_TITLE }]
  }

  const questions = selectedServe?.questions || []

  if (!Array.isArray(questions)) {
    return [{ id: ALL_OPTION, title: ALL_TITLE }]
  }

  const selectedQuestion = questions.find((q) => q?.id === questionId)

  if (!selectedQuestion) {
    return [{ id: ALL_OPTION, title: ALL_TITLE }]
  }

  const items = selectedQuestion?.items || []

  if (!Array.isArray(items) || items.length === 0) {
    return [{ id: ALL_OPTION, title: ALL_TITLE }]
  }

  const currentQuestionId = extractId(item?.serveIndustryQuestionId)

  const selectedItemIds = new Set(
    serveGroup.items
      .filter((_, idx) => idx !== itemIndex)
      .filter((existingItem) => {
        if (currentQuestionId == null) {
          return false
        }

        const existingQuestionId = extractId(existingItem?.serveIndustryQuestionId)
        return existingQuestionId === currentQuestionId
      })
      .map((existingItem) => extractId(existingItem?.serveIndustryItemId))
      .filter((id) => id != null)
  )

  const isAllItemsSelected = selectedItemIds.has(ALL_OPTION)

  if (isAllItemsSelected) {
    return [{ id: ALL_OPTION, title: ALL_TITLE }]
  }

  const validItems = items.filter((i) => {
    if (i?.id == null) return false

    return !selectedItemIds.has(i.id)
  })

  const allIndividualItemsSelected =
    items.length > 1 && items.every((i) => i?.id !== ALL_OPTION && selectedItemIds.has(i.id))

  if (allIndividualItemsSelected) {
    return [
      {
        id: ALL_OPTION,
        title: ALL_TITLE,
        disabled: true,
      },
    ]
  }

  return [{ id: ALL_OPTION, title: ALL_TITLE }, ...validItems]
}

/**
 * Transforms API conditions data to form serves structure
 * Converts flat conditions array from API into hierarchical form structure
 * @param {Array} conditions - Array of condition objects from API
 * @returns {Array} Array of serve objects with items, suitable for form state
 */
export const transformConditionsToFormServes = (conditions) => {
  if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
    return [
      {
        serveIndustryId: null,
        items: [
          {
            serveIndustryQuestionId: null,
            serveIndustryItemId: null,
            discountValue: '',
            discountType: 'percent',
          },
        ],
      },
    ]
  }

  const servesMap = new Map()

  conditions.forEach((condition) => {
    if (!condition) return

    const serveId = condition.serveIndustryId
    const questionId = condition.serveIndustryQuestionId ?? 0
    const itemId = condition.serveIndustryItemId ?? 0
    const discountValue = condition.discountValue ?? 0
    const discountType = condition.discountType || 'percent'

    if (serveId === 0) {
      if (!servesMap.has('all')) {
        servesMap.set('all', {
          serveIndustryId: { id: ALL_OPTION },
          items: [
            {
              serveIndustryQuestionId: { id: ALL_OPTION, title: ALL_TITLE },
              serveIndustryItemId: { id: ALL_OPTION, title: ALL_TITLE },
              discountValue,
              discountType,
            },
          ],
        })
      }
      return
    }

    if (!serveId) return

    if (!servesMap.has(serveId)) {
      servesMap.set(serveId, {
        serveIndustryId: { id: serveId },
        items: [],
      })
    }

    const serveGroup = servesMap.get(serveId)

    if (questionId === 0) {
      serveGroup.items.push({
        serveIndustryQuestionId: { id: ALL_OPTION, title: ALL_TITLE },
        serveIndustryItemId: { id: ALL_OPTION, title: ALL_TITLE },
        discountValue,
        discountType,
      })
      return
    }

    serveGroup.items.push({
      serveIndustryQuestionId: { id: questionId },
      serveIndustryItemId:
        itemId === 0 ? { id: ALL_OPTION, title: ALL_TITLE } : itemId ? { id: itemId } : null,
      discountValue,
      discountType,
    })
  })

  const serves = [...servesMap.values()]

  if (serves.length === 0) {
    return [
      {
        serveIndustryId: null,
        items: [
          {
            serveIndustryQuestionId: null,
            serveIndustryItemId: null,
            discountValue: '',
          },
        ],
      },
    ]
  }

  return serves
}

/**
 * Transforms form data to API request format
 * Converts form state structure to flat API payload format with snake_case keys
 * @param {Object} data - Form data object with coupon information
 * @param {string} data.name - Coupon name
 * @param {string} data.code - Coupon code
 * @param {Array} data.branchId - Branch ID or array of branch IDs
 * @param {boolean} data.hasUnLimit - True if coupon has unlimited usage
 * @param {number|null} data.limit - Usage limit if not unlimited
 * @param {string} data.discountType - Type of discount (e.g., 'percent')
 * @param {Array} data.conditions - Array of serve conditions from form
 * @param {Date|null} data.startsAt - Start date for coupon
 * @param {Date|null} data.expiresAt - Expiration date for coupon
 * @param {string} data.description - Coupon description
 * @returns {Object} API-ready object with snake_case keys and flat structure
 */
export const transformFormDataToApi = (data) => {
  const conditions = []

  data.conditions.forEach((serve) => {
    const serveId = extractId(serve.serveIndustryId)
    if (serveId === ALL_OPTION) {
      if (!serve.items || serve.items.length === 0) return

      const rawDiscountValue = serve.items[0].discountValue
      const discountValue =
        typeof rawDiscountValue === 'number'
          ? rawDiscountValue
          : Number.parseFloat(rawDiscountValue) || 0
      const itemDiscountType = serve.items[0].discountType || data.discountType

      conditions.push({
        discount_type: itemDiscountType,
        discount_value: discountValue,
        serve_industry_id: ALL_OPTION,
        serve_industry_question_id: 0,
        serve_industry_item_id: 0,
      })
    } else {
      serve.items.forEach((item) => {
        const questionId = extractId(item.serveIndustryQuestionId)
        const itemId = extractId(item.serveIndustryItemId) ?? 0
        const rawDiscountValue = item.discountValue
        const discountValue =
          typeof rawDiscountValue === 'number'
            ? rawDiscountValue
            : Number.parseFloat(rawDiscountValue) || 0
        const itemDiscountType = item.discountType || data.discountType

        conditions.push({
          discount_type: itemDiscountType,
          discount_value: discountValue,
          serve_industry_id: serveId,
          serve_industry_question_id: questionId,
          serve_industry_item_id: itemId,
        })
      })
    }
  })

  return {
    name: data.name,
    code: data.code,
    is_active: true,
    branch_id: Array.isArray(data.branchId) ? data.branchId[0] : data.branchId,
    expires_at: data.expiresAt,
    starts_at: data.startsAt,
    limit: data.hasUnLimit ? null : data.limit,
    description: data.description || null,
    conditions: conditions.length > 0 ? conditions : null,
  }
}
