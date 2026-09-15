import { ref, onUnmounted } from 'vue'
import { QUESTION_TYPE } from '../constants/enums'

const SHARED_CONFIG = {
  SERVE_INDUSTRY_ID: 246,
  TARGET_BRANCH_ID: [9, 61],
  DIALOG_DELAY_MS: 2000,
}

const GTR_CONFIG = {
  KEYWORD: 'GTR',
  MULTIPLIER: 2,
}

const BIOBOOST_CONFIG = {
  KEYWORD: 'BIOBOOST',
  MIN_BASE_VALUE: 8,
}

export const BIOBOOST_MIN_BASE_VALUE = BIOBOOST_CONFIG.MIN_BASE_VALUE

// ============== Pipeline helpers ==============

function createSkip(reason) {
  return { type: 'skip', reason }
}

function createFail(reason, warning) {
  return { type: 'fail', reason, warning }
}

function createRulePipeline(rules) {
  return (ctx) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const rule of rules) {
      const result = rule(ctx)
      if (result) return result
    }
    return null
  }
}

// ============== Pure finders ==============

/**
 * @param {Array} questions
 * @param {string} keyword
 * @returns {Object|null}
 */
function findQuestionByKeyword(questions, keyword) {
  if (!questions?.length) return null
  const lowerKeyword = keyword.toLowerCase()

  return questions.find((q) => (q.title || '').toLowerCase().includes(lowerKeyword)) ?? null
}

/**
 * @param {Array} questions
 * @returns {Object|null}
 */
function findGtrQuestion(questions) {
  if (!questions?.length) return null

  return (
    findQuestionByKeyword(questions, GTR_CONFIG.KEYWORD) ??
    questions.find(
      (q) =>
        q.id === SHARED_CONFIG.SERVE_INDUSTRY_ID &&
        q.type === QUESTION_TYPE.PER_UNIT &&
        q.coefficient === false
    ) ??
    questions.find(
      (q) => q.id === SHARED_CONFIG.SERVE_INDUSTRY_ID && q.type === QUESTION_TYPE.PER_UNIT
    ) ??
    null
  )
}

/**
 * @param {Array} questions
 * @returns {Object|null}
 */
function findBioboostQuestion(questions) {
  return findQuestionByKeyword(questions, BIOBOOST_CONFIG.KEYWORD)
}

/**
 * @param {Function} getBaseItemValue
 * @param {number} branchId
 * @param {object} selectedServe
 * @param {Array} questions
 * @returns {{ coefficientQuestion: object, baseValue: number } | null}
 */
function resolveCommonContext(getBaseItemValue, branchId, selectedServe, questions) {
  const isTargetContext =
    SHARED_CONFIG.TARGET_BRANCH_ID.includes(branchId) &&
    selectedServe?.id === SHARED_CONFIG.SERVE_INDUSTRY_ID &&
    Boolean(questions?.length)

  if (!isTargetContext) return null

  const coefficientQuestion = questions.find(
    (q) => q.type === QUESTION_TYPE.MULTIPLE && q.coefficient === true
  )
  if (!coefficientQuestion) return null

  const baseValue = getBaseItemValue(coefficientQuestion)
  if (!baseValue || baseValue <= 0) return null

  return { coefficientQuestion, baseValue }
}

function createDialogController(delayMs) {
  const show = ref(false)
  const hasShown = ref(false)
  let timer = null

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function reset() {
    clearTimer()
    show.value = false
    hasShown.value = false
  }

  function rearm() {
    clearTimer()
    hasShown.value = false
  }

  function schedule() {
    clearTimer()
    timer = setTimeout(() => {
      show.value = true
      hasShown.value = true
      timer = null
    }, delayMs)
  }

  return { show, hasShown, reset, rearm, schedule }
}

function createAbort(reset, scope) {
  return (reason) => {
    if (reason && import.meta.env.DEV) {
      console.warn(`[useDetectService] ${scope}: ${reason}`)
    }
    reset()
  }
}

/**
 * @param {Function} getBaseItemValue
 * @param {Function} getItemValue
 * @returns {Object}
 */
export function useDetectService(getBaseItemValue, getItemValue) {
  // ---- GTR state ----
  const gtrDialog = createDialogController(SHARED_CONFIG.DIALOG_DELAY_MS)
  const gtrCount = ref(0)
  const lastGtrBaseValue = ref(null)
  const lastGtrValue = ref(null)

  function resetGtrState() {
    gtrDialog.reset()
    gtrCount.value = 0
    lastGtrBaseValue.value = null
    lastGtrValue.value = null
  }

  const abortGtr = createAbort(resetGtrState, 'GTR')

  // ---- BIOBOOST state ----
  const bioboostDialog = createDialogController(SHARED_CONFIG.DIALOG_DELAY_MS)
  const abortBioboost = createAbort(bioboostDialog.reset, 'BIOBOOST')

  // =========================
  // GTR pipeline
  // =========================

  const runGtrPipeline = createRulePipeline([
    (ctx) => {
      const commonContext = resolveCommonContext(
        getBaseItemValue,
        ctx.branchId,
        ctx.selectedServe,
        ctx.questions
      )
      if (!commonContext) {
        return createFail('COMMON_CONTEXT_INVALID')
      }

      ctx.commonContext = commonContext
      ctx.baseValue = commonContext.baseValue
      return null
    },

    (ctx) => {
      const gtrQuestion = findGtrQuestion(ctx.questions)

      if (!gtrQuestion) {
        return createFail('GTR_QUESTION_NOT_FOUND', 'GTR question not found in questions array')
      }

      ctx.gtrQuestion = gtrQuestion
      return null
    },

    (ctx) => {
      const calculatedGtrCount = ctx.baseValue * GTR_CONFIG.MULTIPLIER
      const matchedItem = ctx.gtrQuestion.items?.find(
        (item) => item.title === String(calculatedGtrCount)
      )

      if (!matchedItem) {
        return createFail(
          'GTR_ITEM_NOT_FOUND',
          `GTR item with count ${calculatedGtrCount} not found in available items`
        )
      }

      ctx.calculatedGtrCount = calculatedGtrCount
      ctx.matchedGtrItem = matchedItem
      return null
    },

    (ctx) => {
      ctx.currentGtrValue = getItemValue(ctx.gtrQuestion)
      return null
    },

    (ctx) => {
      const baseValueChanged =
        lastGtrBaseValue.value !== null && lastGtrBaseValue.value !== ctx.baseValue

      if (baseValueChanged) {
        lastGtrValue.value = null
        gtrDialog.rearm()
      }

      return null
    },

    (ctx) => {
      if (ctx.currentGtrValue == null) return null

      const alreadyCorrect = ctx.matchedGtrItem?.id === ctx.currentGtrValue
      if (!alreadyCorrect) return null

      lastGtrBaseValue.value = ctx.baseValue
      lastGtrValue.value = ctx.currentGtrValue

      return createSkip('GTR_ALREADY_CORRECT')
    },

    (ctx) => {
      const alreadyPrompted =
        gtrDialog.hasShown.value &&
        lastGtrBaseValue.value === ctx.baseValue &&
        lastGtrValue.value === ctx.currentGtrValue

      if (alreadyPrompted) {
        return createSkip('GTR_ALREADY_PROMPTED')
      }

      return null
    },
  ])

  /**
   * @param {number} branchId
   * @param {object} selectedServe
   * @param {array} questions
   * @returns {object|null}
   */
  function checkGtrConditions(branchId, selectedServe, questions) {
    const ctx = {
      branchId,
      selectedServe,
      questions,
      commonContext: null,
      baseValue: null,
      gtrQuestion: null,
      calculatedGtrCount: null,
      matchedGtrItem: null,
      currentGtrValue: null,
    }

    const result = runGtrPipeline(ctx)

    if (result) {
      if (result.type === 'fail') {
        abortGtr(result.warning)
      }
      return null
    }

    lastGtrBaseValue.value = ctx.baseValue
    lastGtrValue.value = ctx.currentGtrValue
    gtrCount.value = ctx.calculatedGtrCount
    gtrDialog.schedule()

    return { baseValue: ctx.baseValue, gtrQuestion: ctx.gtrQuestion }
  }

  // =========================
  // BIOBOOST pipeline
  // =========================

  const runBioboostPipeline = createRulePipeline([
    (ctx) => {
      const commonContext = resolveCommonContext(
        getBaseItemValue,
        ctx.branchId,
        ctx.selectedServe,
        ctx.questions
      )

      if (!commonContext) {
        return createFail('COMMON_CONTEXT_INVALID')
      }

      ctx.commonContext = commonContext
      ctx.baseValue = commonContext.baseValue
      return null
    },

    (ctx) => {
      if (ctx.baseValue < BIOBOOST_CONFIG.MIN_BASE_VALUE) {
        return createSkip('BIOBOOST_MIN_BASE_VALUE_NOT_REACHED')
      }

      return null
    },

    (ctx) => {
      const bioboostQuestion = findBioboostQuestion(ctx.questions)

      if (!bioboostQuestion) {
        return createFail('BIOBOOST_QUESTION_NOT_FOUND')
      }

      ctx.bioboostQuestion = bioboostQuestion
      return null
    },

    (ctx) => {
      const firstItem = ctx.bioboostQuestion.items?.[0]

      if (!firstItem) {
        return createFail('BIOBOOST_NO_ITEMS', 'BIOBOOST question has no items')
      }

      ctx.firstItem = firstItem
      return null
    },

    (ctx) => {
      ctx.currentValue = getItemValue(ctx.bioboostQuestion)
      return null
    },

    (ctx) => {
      if (ctx.currentValue === ctx.firstItem.id) {
        return createSkip('BIOBOOST_ALREADY_SELECTED')
      }

      return null
    },

    () => {
      if (bioboostDialog.hasShown.value) {
        return createSkip('BIOBOOST_ALREADY_SHOWN')
      }

      return null
    },
  ])

  /**
   * @param {number} branchId
   * @param {object} selectedServe
   * @param {array} questions
   * @returns {object|null}
   */
  function checkBioboostConditions(branchId, selectedServe, questions) {
    const ctx = {
      branchId,
      selectedServe,
      questions,
      commonContext: null,
      baseValue: null,
      bioboostQuestion: null,
      firstItem: null,
      currentValue: null,
    }

    const result = runBioboostPipeline(ctx)

    if (result) {
      if (result.type === 'fail') {
        abortBioboost(result.warning)
      }
      return null
    }

    bioboostDialog.schedule()

    return {
      baseValue: ctx.baseValue,
      bioboostQuestion: ctx.bioboostQuestion,
      item: ctx.firstItem,
    }
  }

  onUnmounted(() => {
    resetGtrState()
    bioboostDialog.reset()
  })

  return {
    // GTR
    showGtrDialog: gtrDialog.show,
    gtrCount,
    checkGtrConditions,
    resetGtrDialog: resetGtrState,
    findGtrQuestion,

    // BIOBOOST
    showBioboostDialog: bioboostDialog.show,
    checkBioboostConditions,
    resetBioboostDialog: bioboostDialog.reset,
    findBioboostQuestion,
  }
}
