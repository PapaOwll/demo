import { teethBase, teethMapping, totalNumberOfTeeth } from '../constants/teeth'
import { TREATMENT_PLAN_STEP, QUESTION_TYPE } from '../constants/enums'

export const convertTeethToShowableTeeth = (teeth) => [
  {
    key: 'TL',
    title: 'بالا چپ',
    teeth: teeth.filter((tooth) => tooth <= 7).map((t) => teethMapping[t]),
  },
  {
    key: 'TR',
    title: 'بالا راست',
    teeth: teeth.filter((tooth) => tooth >= 8 && tooth <= 14).map((t) => teethMapping[t]),
  },
  {
    key: 'BL',
    title: 'پایین چپ',
    teeth: teeth.filter((tooth) => tooth >= 15 && tooth <= 21).map((t) => teethMapping[t]),
  },
  {
    key: 'BR',
    title: 'پایین راست',
    teeth: teeth.filter((tooth) => tooth >= 22 && tooth <= 28).map((t) => teethMapping[t]),
  },
]
export const convertShowableToothToTooth = (tooth) => {
  switch (tooth.position) {
    case 'TL': {
      return 8 - tooth.toothNumber || 8 - tooth.number
    }
    case 'TR': {
      return 7 + tooth.toothNumber || 7 + tooth.number
    }
    case 'BL': {
      return 22 - tooth.toothNumber || 22 - tooth.number
    }
    default: {
      return 21 + tooth.toothNumber || 21 + tooth.number
    }
  }
}
export const convertShowableTeethToTeeth = (teeth) =>
  teeth.map((tooth) => {
    return convertShowableToothToTooth(tooth)
  })

export const findTeethFromTeethData = (serve, teethData) =>
  teethData?.find((teeth) => teeth?.serveDetail?.serveId === serve.serveId)?.teeth || []

/**
 * @param {number[]} teeth
 * @returns {number[]}
 * @example
 * deduplicateTeeth([1, 2, 2, 3]) // returns [1, 2, 3]
 * deduplicateTeeth([3, 1, 2]) // returns [1, 2, 3]
 * deduplicateTeeth([]) // returns []
 * deduplicateTeeth(null) // returns []
 */
export const deduplicateTeeth = (teeth) => {
  if (!teeth || !Array.isArray(teeth)) return []

  const validTeeth = teeth.filter((tooth) => {
    const num = Number(tooth)
    return !Number.isNaN(num) && num >= 1 && num <= 28
  })

  return [...new Set(validTeeth)].sort((a, b) => a - b)
}

export const calculateBaseNumber = (_teeth) => {
  let topConsecutiveTeeth = []
  let bottomConsecutiveTeeth = []
  const teeth = [..._teeth]
  teeth.sort((a, b) => a - b)

  teeth.forEach((tooth, index) => {
    if (tooth <= totalNumberOfTeeth / 2) {
      topConsecutiveTeeth =
        topConsecutiveTeeth.length > 0 && teeth[index - 1] === tooth - 1
          ? topConsecutiveTeeth.map((v, i) => (i === topConsecutiveTeeth.length - 1 ? v + 1 : v))
          : [...topConsecutiveTeeth, 1]
    } else {
      bottomConsecutiveTeeth =
        bottomConsecutiveTeeth.length > 0 && teeth[index - 1] === tooth - 1
          ? bottomConsecutiveTeeth.map((v, i) =>
              i === bottomConsecutiveTeeth.length - 1 ? v + 1 : v
            )
          : [...bottomConsecutiveTeeth, 1]
    }
  })

  return [...topConsecutiveTeeth, ...bottomConsecutiveTeeth].reduce(
    (prev, current) => prev + teethBase[current],
    0
  )
}

export const filterQuestionsByStep = (questions, step) => {
  if (!step || !questions) return questions

  return questions
    .map((question) => {
      const filteredItems = question.items?.filter((item) => {
        if (
          item.pivot?.isDraft === undefined &&
          item.pivot?.isProposed === undefined &&
          item.pivot?.isPerformed === undefined
        ) {
          return true
        }
        if (step === TREATMENT_PLAN_STEP.DRAFT) return item.pivot?.isDraft === true
        if (step === TREATMENT_PLAN_STEP.PROPOSED) return item.pivot?.isProposed === true
        return true
      })

      return {
        ...question,
        items: filteredItems || [],
      }
    })
    .filter((question) => question.items?.length > 0)
}

export const getSelectedTeethAndServices = (treatmentData, serveItems, step = null) => {
  if (!treatmentData || !serveItems) return []

  const teethServeIds = treatmentData?.value?.teeth?.map((t) => t?.serve?.serveId) || []

  const itemServeIds = treatmentData?.value?.items?.map((i) => i?.serveId) || []

  const teethWithoutItem =
    treatmentData?.value?.teeth?.filter((t) => !itemServeIds.includes(t?.serve?.serveId)) || []

  const items =
    treatmentData?.value?.items?.map((_item) => {
      if (teethServeIds?.includes(_item?.serveId)) {
        const serve = serveItems.value?.find((_serve) => _serve.serveId === _item?.serveId)
        if (!serve) return _item
        const teethItem = treatmentData?.value?.teeth?.find(
          (t) => t.serve.serveId === _item?.serveId
        )
        if (!teethItem) return _item

        const deduplicatedTeeth = deduplicateTeeth(teethItem.teeth)

        const typeFourQuestions = serve?.questions
          ?.filter((_q) => _q.type === QUESTION_TYPE.PER_TEETH)
          ?.map((q) => ({ ...q, teeth: deduplicatedTeeth }))

        const allQuestions = [
          ..._item.questions.filter((_q) => _q.type !== QUESTION_TYPE.PER_TEETH),
          ...typeFourQuestions,
        ]
        const filteredQuestions = filterQuestionsByStep(allQuestions, step)

        return {
          ..._item,
          teeth: deduplicatedTeeth,
          teethData: teethItem.serve.teeth,
          convertedTeeth: convertTeethToShowableTeeth(deduplicatedTeeth),
          questions: filteredQuestions,
        }
      }

      return _item
    }) || []

  const remainItems =
    teethWithoutItem?.flatMap((t) => {
      const serve = serveItems.value?.find((_serve) => _serve.serveId === t?.serve?.serveId)
      if (!serve) return []

      const deduplicatedTeeth = deduplicateTeeth(t.teeth)

      const typeFourQuestions = serve.questions
        .filter((_q) => _q.type === QUESTION_TYPE.PER_TEETH)
        .map((q) => ({ ...q, teeth: deduplicatedTeeth }))

      return {
        ...serve,
        teeth: deduplicatedTeeth,
        convertedTeeth: convertTeethToShowableTeeth(deduplicatedTeeth),
        questions: typeFourQuestions,
      }
    }) || []

  return [...items, ...remainItems]
}

/**
 * Find the item that should be used for display/pricing
 * First tries to find item with isProposed: true, falls back to first item
 * @param {Array} items - Array of question items
 * @returns {Object|null} The proposed item or first item as fallback
 */
const findProposedItemForTitle = (items) => {
  if (!items?.length) return null
  const proposedItem = items.find((it) => it?.pivot?.isProposed)
  return proposedItem || items[0]
}

export const calculateServeTitle = (question, item, withTitle = true) => {
  const displayItem = findProposedItemForTitle(question.items)

  return question.type === QUESTION_TYPE.PER_TEETH
    ? `${item.teeth?.length || 0} دندان`
    : question.type === QUESTION_TYPE.PER_QUADRANT
      ? `${withTitle ? `${question.title} : ` : '' || ''}${question.items?.map((i) => i.title).join('، ') || ''} (نواحی دهان)`
      : question.type === QUESTION_TYPE.SIMPLE_MULTIPLE
        ? `${withTitle ? `${question.title} : ` : '' || ''}${question.items?.map((i) => i.title).join('، ') || ''}`
        : `${withTitle ? `${question.title} : ` : '' || ''}${displayItem?.title || ''} ${
            question.type === QUESTION_TYPE.MULTIPLE &&
            question.coefficient &&
            displayItem?.pivot?.unit
              ? `(${displayItem.pivot.unit} پایه)`
              : question.type === QUESTION_TYPE.MULTIPLE && !question.coefficient
                ? `${item.teeth?.length || 0}  دندان`
                : question.type === QUESTION_TYPE.PER_UNIT
                  ? 'واحد'
                  : ''
          }`.trim()
}

/**
 * Get tooth name/number by index and type
 * @param {number} index - Tooth index
 * @param {number} type - Tooth type (1, 8, 15, or 22)
 * @returns {number|undefined} Tooth value
 */
export const getTeethName = (index, type) => {
  const teeth = []
  let starter = type

  let valueCounter = 1
  if (type === 1 || type === 15) {
    valueCounter = 7
  }
  for (starter; starter < type + 7; starter += 1) {
    if (type === 1 || type === 15) {
      teeth.push({
        value: valueCounter,
        key: starter,
      })
      valueCounter -= 1
    } else {
      teeth.push({
        value: valueCounter,
        key: starter,
      })
      valueCounter += 1
    }
  }

  return teeth.find((el) => el.key === index)?.value
}

/**
 * Checks if array contains all teeth in a range
 * @param {string[]|number[]} teeth - Array of tooth IDs
 * @param {number} start - Start of range (inclusive)
 * @param {number} end - End of range (inclusive)
 * @returns {boolean} True if all teeth in range are present
 *
 * @example
 * hasAllTeethInRange(['1', '2', '3'], 1, 3) // true
 * hasAllTeethInRange(['1', '2'], 1, 3) // false
 * hasAllTeethInRange([1, 2, 3, 4, 5, 6, 7, 8], 1, 8) // true
 * hasAllTeethInRange(null, 1, 14) // false
 */
export const hasAllTeethInRange = (teeth, start, end) => {
  if (!teeth || !Array.isArray(teeth)) return false

  const normalizedTeeth = new Set(teeth.map(String))

  for (let i = start; i <= end; i += 1) {
    if (!normalizedTeeth.has(String(i))) {
      return false
    }
  }
  return true
}

/**
 * Gets badge text for full jaw selections
 * @param {string[]|number[]} selectedTeeth - Array of selected tooth IDs
 * @returns {string|null} Badge text or null if not a full jaw
 *
 * @example
 * getJawBadgeText(['1', '2', ..., '14']) // 'همه دندان‌های بالا'
 * getJawBadgeText(['15', '16', ..., '28']) // 'همه دندان‌های پایین'
 * getJawBadgeText(['1', '2', '3']) // null
 * getJawBadgeText(null) // null
 */
export const getJawBadgeText = (selectedTeeth) => {
  if (!selectedTeeth || !Array.isArray(selectedTeeth) || selectedTeeth.length === 0) {
    return null
  }

  const normalizedTeeth = selectedTeeth.map(String)
  const hasAllUpper = hasAllTeethInRange(normalizedTeeth, 1, 14)
  const hasAllLower = hasAllTeethInRange(normalizedTeeth, 15, 28)

  if (hasAllUpper && hasAllLower) {
    return 'همه دندان‌ها'
  }
  if (hasAllUpper) {
    return 'همه دندان‌های بالا'
  }
  if (hasAllLower) {
    return 'همه دندان‌های پایین'
  }

  return null
}
