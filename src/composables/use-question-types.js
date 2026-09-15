import { QUESTION_TYPE } from '@/modules/TreatmentPlan/constants/enums'

const questionTypeConfig = {
  [QUESTION_TYPE.MULTIPLE]: {
    name: 'brand-price',
    fields: ['title', 'price'],
    defaultItems: () => [
      {
        title: '',
        price: 0,
        isActive: true,
        isPublic: true,
      },
    ],
  },
  [QUESTION_TYPE.UNIT_WITH_TEETH]: {
    name: 'brand-price',
    fields: ['title', 'price'],
    defaultItems: () => [
      {
        title: '',
        price: 0,
        isActive: true,
        isPublic: true,
      },
    ],
  },
  [QUESTION_TYPE.YES_NO]: {
    name: 'boolean',
    fields: ['title', 'price'],
    defaultItems: () => [
      { title: 'دارد', price: 0, isActive: true, isPublic: true },
      { title: 'ندارد', price: 0, isActive: true, isPublic: true },
    ],
  },
  [QUESTION_TYPE.PER_UNIT]: {
    name: 'count-based',
    fields: ['title', 'price'],
    defaultItems: () => [
      {
        title: '1',
        price: 0,
        isActive: true,
        isPublic: true,
      },
    ],
    calculateItems: (baseItem) => {
      const count = Number(baseItem.title) || 1
      const unitPrice = Number(baseItem.price) || 0
      return Array.from({ length: count }, (_, i) => ({
        title: String(i + 1),
        price: unitPrice * (i + 1),
        isActive: true,
        isPublic: true,
      }))
    },
  },
  [QUESTION_TYPE.PER_TEETH]: {
    name: 'teeth-type',
    fields: ['title', 'price'],
    defaultItems: () =>
      Array.from({ length: 7 }, (_, i) => ({
        title: String(i + 1),
        price: 0,
        isActive: true,
        isPublic: true,
      })),
  },
  [QUESTION_TYPE.PER_JAW]: {
    name: 'jaw-type',
    fields: ['title', 'price'],
    hasAddButton: false,
    defaultItems: () => [
      { title: 'نیم فک بالا', price: 0, isActive: true, isPublic: true },
      { title: 'نیم فک پایین', price: 0, isActive: true, isPublic: true },
      { title: 'دو فک', price: 0, isActive: true, isPublic: true },
    ],
  },
  [QUESTION_TYPE.PER_QUADRANT]: {
    name: 'quadrant-type',
    fields: ['title', 'price'],
    hasAddButton: false,
    defaultItems: () => [
      { title: 'بالا راست', price: 0, isActive: true, isPublic: true },
      { title: 'بالا چپ', price: 0, isActive: true, isPublic: true },
      { title: 'پایین راست', price: 0, isActive: true, isPublic: true },
      { title: 'پایین چپ', price: 0, isActive: true, isPublic: true },
    ],
  },
  [QUESTION_TYPE.SIMPLE_MULTIPLE]: {
    name: 'simple-multiple',
    fields: ['title', 'price'],
    defaultItems: () => [
      {
        title: '',
        price: 0,
        isActive: true,
        isPublic: true,
      },
    ],
  },
}

export function useQuestionTypes() {
  const getTypeConfig = (type) =>
    questionTypeConfig[type] || questionTypeConfig[QUESTION_TYPE.MULTIPLE]

  const initializeItems = (question) => {
    const config = getTypeConfig(question.type)

    return config.defaultItems().map((item) => ({
      ...item,
      serveIndustryId: question.serveIndustryId,
      serveIndustryQuestionId: question.id,
    }))
  }

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const shouldUseDefaultItems = (items) => {
    return !items || !Array.isArray(items) || items.length === 0
  }

  const prepareItemsForQuestion = (question) => {
    if (!shouldUseDefaultItems(question.items)) {
      return question.items.map((item) => ({
        ...item,
        serveIndustryId: question.serveIndustryId,
        serveIndustryQuestionId: question.id,
      }))
    }

    return initializeItems(question)
  }

  const handleItemUpdate = (currentItems, updateData, questionType) => {
    const { itemIndex, field, value } = updateData
    const updatedItems = [...currentItems]
    if (updatedItems[itemIndex]) {
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        [field]: value,
      }
    }
    if (questionType === QUESTION_TYPE.PER_UNIT) {
      const config = getTypeConfig(questionType)
      if (config.calculateItems) {
        const calculatedItems = config.calculateItems(updatedItems[0])
        return calculatedItems.map((item, index) => ({
          ...item,
          serveIndustryId: updatedItems[0]?.serveIndustryId,
          serveIndustryQuestionId: updatedItems[0]?.serveIndustryQuestionId,
          id: updatedItems[index]?.id || undefined,
        }))
      }
    }

    return updatedItems
  }

  const addNewItem = (currentItems, question) => {
    const config = getTypeConfig(question.type)

    if (config.hasAddButton === false) {
      return currentItems
    }

    const newItem = {
      ...config.defaultItems()[0],
      serveIndustryId: question.serveIndustryId,
      serveIndustryQuestionId: question.id,
    }

    return [...currentItems, newItem]
  }

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const removeItem = (currentItems, itemIndex) => {
    return currentItems.filter((_, index) => index !== itemIndex)
  }

  const processItemsForSave = (question) => {
    const config = getTypeConfig(question.type)

    const itemsToProcess = shouldUseDefaultItems(question.items)
      ? initializeItems(question)
      : question.items

    if (config.calculateItems && question.type === QUESTION_TYPE.PER_UNIT) {
      return config.calculateItems(itemsToProcess[0]).map((item) => ({
        ...item,
        serveIndustryId: question.serveIndustryId,
        serveIndustryQuestionId: question.id,
      }))
    }

    return itemsToProcess
  }

  const validateItems = (items, questionType) => {
    if (shouldUseDefaultItems(items)) {
      return false
    }

    switch (questionType) {
      case QUESTION_TYPE.MULTIPLE: {
        return items.every((item) => item.title && item.title.trim() !== '')
      }
      case QUESTION_TYPE.YES_NO: {
        return items.length === 2
      }
      case QUESTION_TYPE.PER_UNIT: {
        return items.length > 0 && items[0].title && Number(items[0].title) > 0
      }
      case QUESTION_TYPE.PER_TEETH: {
        return items.length === 7
      }
      case QUESTION_TYPE.PER_JAW: {
        return items.length === 3 || items.length === 4
      }
      case QUESTION_TYPE.PER_QUADRANT: {
        return items.length === 4
      }
      case QUESTION_TYPE.SIMPLE_MULTIPLE: {
        return items.every((item) => item.title && item.title.trim() !== '')
      }
      default: {
        return true
      }
    }
  }

  return {
    getTypeConfig,
    initializeItems,
    prepareItemsForQuestion,
    shouldUseDefaultItems,
    handleItemUpdate,
    addNewItem,
    removeItem,
    processItemsForSave,
    validateItems,
    questionTypeConfig,
  }
}
