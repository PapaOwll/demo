import { CHART_TYPES } from '../constants/chart-types'
import { POSITION_LABELS, teethMapping } from '../constants/teeth'
import { QUESTION_TYPE } from '../constants/enums'
import { getServiceQuestions } from '../constants/service-question-types'
import { getJawBadgeText } from './teeth'

/**
 * @param {string} services - Comma-separated service string
 * @returns {string[]} Array of visible services
 */
function getVisibleSpecialServices(services) {
  if (!services || services === '-') return []

  const serviceList = services.split(',').filter((s) => s.trim())
  if (serviceList.length <= 2) return serviceList

  return [...serviceList.slice(0, 2), `+${serviceList.length - 2}`]
}

/**
 * @param {string} services - Comma-separated service string
 * @returns {string[]} Array of all services
 */
function getAllSpecialServices(services) {
  if (!services || services === '-') return []

  return services.split(',').filter((s) => s.trim())
}

/**
 * @param {Object.<string, Object>} items - Items object keyed by question ID
 * @returns {boolean} True if items contain PER_TEETH mapped items
 */
function hasPerTeethItems(items) {
  if (!items || typeof items !== 'object') return false

  return Object.values(items).some((item) => {
    if (!item || !item.title) return false
    return /^\d$/.test(item.title.trim())
  })
}

/**
 * @param {Object} service - Service object with questions
 * @param {string[]} selectedTeeth - Array of selected tooth IDs (e.g., ["8", "15", "5", "12"])
 * @param {Object} existingItems - Existing items object (to check for duplicates)
 * @returns {Object} New items object with mapped items (itemId → itemData)
 */
export function mapTeethToItemsForPerTeethQuestions(service, selectedTeeth, existingItems = {}) {
  if (!selectedTeeth || selectedTeeth.length === 0) {
    return {}
  }

  const questions = getServiceQuestions(service)
  if (!questions || questions.length === 0) {
    return {}
  }

  const perTeethQuestions = questions.filter((q) => q.type === QUESTION_TYPE.PER_TEETH)
  if (perTeethQuestions.length === 0) {
    return {}
  }

  const existingItemTitles = new Set(Object.values(existingItems).map((item) => item.title))

  const newItems = {}
  const addedTitles = new Set()

  const uniquePositions = new Set()

  selectedTeeth.forEach((toothId) => {
    const toothNum = typeof toothId === 'string' ? Number.parseInt(toothId, 10) : toothId

    if (Number.isNaN(toothNum) || toothNum < 1 || toothNum > 28) {
      return
    }

    const position = teethMapping[toothNum]
    if (!position) {
      return
    }

    uniquePositions.add(position)
  })

  uniquePositions.forEach((position) => {
    const expectedItemTitle = String(position)

    if (existingItemTitles.has(expectedItemTitle) || addedTitles.has(expectedItemTitle)) {
      return
    }

    const foundQuestion = perTeethQuestions
      .filter((question) => question.items && Array.isArray(question.items))
      .find((question) => {
        return question.items.some((item) => item.title === expectedItemTitle)
      })

    if (!foundQuestion) {
      return
    }

    const foundItem = foundQuestion.items.find((item) => item.title === expectedItemTitle)

    if (!foundItem) {
      return
    }

    newItems[foundItem.id] = {
      id: foundItem.id,
      price: String(foundItem.price || 0),
      unit: foundItem.unit || 1,
      title: foundItem.title || '',
    }

    addedTitles.add(expectedItemTitle)
  })

  return newItems
}

/**
 * @typedef {Object} ToothGroup
 * @property {number[]} number - Array containing single position value
 * @property {string} position - Quadrant identifier (TL, TR, BL, BR)
 * @property {number} serve_industry_item_id - Service item ID for this tooth
 * @property {number} unit - Unit count
 * @property {string} price - Price as string
 */

/**
 * @typedef {Object} ServiceItem
 * @property {number} id - The unique identifier for the item
 * @property {number} unit - The quantity/unit of the service
 * @property {string} price - The price of the service as a string
 */
/**
 * @param {string[]} selectedTeeth - Array of tooth IDs (e.g., ["18-1", "18", "6"])
 * @returns {ToothGroup[]} Array of objects grouped by quadrant
 */
function groupTeethByPosition(selectedTeeth) {
  if (!selectedTeeth?.length) return []

  const quadrants = {
    TL: [],
    TR: [],
    BL: [],
    BR: [],
  }

  selectedTeeth.forEach((toothId) => {
    let toothNumber

    if (typeof toothId === 'number') {
      toothNumber = toothId
    } else if (typeof toothId === 'string') {
      const parts = toothId.split('-')
      toothNumber = Number.parseInt(parts[0], 10)
    } else {
      return
    }

    if (Number.isNaN(toothNumber) || toothNumber < 1 || toothNumber > 28) {
      return
    }

    if (toothNumber <= 7) quadrants.TL.push(toothNumber)
    else if (toothNumber <= 14) quadrants.TR.push(toothNumber)
    else if (toothNumber <= 21) quadrants.BL.push(toothNumber)
    else quadrants.BR.push(toothNumber)
  })

  return Object.entries(quadrants)
    .filter(([, teeth]) => teeth.length > 0)
    .map(([position, teeth]) => ({
      position,
      number: teeth.map((tooth) => teethMapping[tooth]).filter(Boolean),
    }))
}

/**
 * @param {string[]} selectedTeeth - Array of tooth IDs
 * @returns {ToothGroup[]}
 */
export function transformTeethToApiFormat(selectedTeeth) {
  if (!selectedTeeth?.length) return []
  return groupTeethByPosition(selectedTeeth)
}

/**
 * @param {string[]} selectedRegions - Array of region IDs (e.g., ["TL", "BR"])
 * @returns {ToothGroup[]}
 */
export function transformRegionsToApiFormat(selectedRegions) {
  if (!selectedRegions?.length) return []

  const VALID_REGIONS = new Set(['TL', 'TR', 'BL', 'BR'])

  return selectedRegions
    .filter((regionId) => {
      const isValid = VALID_REGIONS.has(regionId)
      return isValid
    })
    .map((regionId) => ({
      position: regionId,
      number: [1],
    }))
}

/**
 * @param {string} chartType - Chart type ('dental' | 'jawBone')
 * @param {string[]} [selectedTeeth] - Selected teeth IDs
 * @param {string[]} [selectedRegions] - Selected region IDs
 * @returns {ToothGroup[]} Transformed teeth data (empty array if no data)
 */
export function transformChartDataToApiFormat(chartType, selectedTeeth = [], selectedRegions = []) {
  if (chartType === CHART_TYPES.DENTAL && selectedTeeth?.length > 0) {
    return transformTeethToApiFormat(selectedTeeth)
  }
  if (chartType === CHART_TYPES.JAW_BONE && selectedRegions?.length > 0) {
    return transformRegionsToApiFormat(selectedRegions)
  }
  return []
}

/**
 * @param {Object.<string, {id: number, price: number, unit?: number}|Array<{id: number, price: number, unit?: number}>>} items - Map of item data (single or array for multi-select)
 * @returns {ServiceItem[]}
 */
export function transformItemsToApiFormat(items) {
  if (!items || Object.keys(items).length === 0) return []

  return Object.entries(items)
    .flatMap(([, itemData]) => {
      if (Array.isArray(itemData)) {
        return itemData.map((singleItem) => {
          if (!singleItem || typeof singleItem !== 'object') {
            return null
          }

          const id = Number(singleItem.id)
          if (Number.isNaN(id) || id < 0) {
            return null
          }

          return {
            id,
            unit: Math.max(1, Number(singleItem.unit) || 1),
            price: String(Math.max(0, Number(singleItem.price) || 0)),
          }
        })
      }

      if (!itemData?.id && itemData?.id !== 0) {
        return null
      }

      const id = Number(itemData.id)
      if (Number.isNaN(id) || id < 0) {
        return null
      }

      return {
        id,
        unit: Math.max(1, Number(itemData.unit) || 1),
        price: String(Math.max(0, Number(itemData.price) || 0)),
      }
    })
    .filter(Boolean)
}

/**
 * Adds PER_TEETH auto-mapped items to teeth data groups.
 *
 * Expands each tooth position into a separate object with item details.
 *
 * @param {Object} service - Service object with questions
 * @param {string[]} selectedTeeth - Selected teeth IDs
 * @param {Object} items - Existing items object
 * @param {ToothGroup[]} teethData - Current teeth data array
 * @param {Set<number>} [perTeethItemIds=new Set()] - Set to populate with PER_TEETH item IDs
 * @returns {{ teethData: ToothGroup[], teethItemIds: number[] }} Updated teeth data with individual tooth objects and array of item IDs
 */
function addTeethItemsToTeethData(
  service,
  selectedTeeth,
  items,
  teethData,
  perTeethItemIds = new Set()
) {
  if (!teethData || teethData.length === 0) {
    return { teethData, teethItemIds: [] }
  }

  const perTeethItems = mapTeethToItemsForPerTeethQuestions(service, selectedTeeth, items)

  const perTeethItemsArray = Object.values(perTeethItems)

  if (perTeethItemsArray.length === 0) {
    return { teethData, teethItemIds: [] }
  }

  const teethItemIds = []

  perTeethItemsArray.forEach((item) => {
    perTeethItemIds.add(item.id)
    teethItemIds.push(item.id)
  })

  const positionToItem = {}

  perTeethItemsArray.forEach((item) => {
    if (!item.title || typeof item.title !== 'string') {
      return
    }

    const trimmedTitle = item.title.trim()
    if (!/^\d$/.test(trimmedTitle)) {
      return
    }

    const position = Number.parseInt(trimmedTitle, 10)

    if (!Number.isNaN(position) && position >= 1 && position <= 7) {
      positionToItem[position] = item
    }
  })

  const expandedTeeth = []

  teethData.forEach((toothGroup) => {
    if (!toothGroup.number || !Array.isArray(toothGroup.number)) {
      return
    }

    toothGroup.number.forEach((position) => {
      const item = positionToItem[position]
      if (item) {
        expandedTeeth.push({
          number: [position],
          position: toothGroup.position,
          serveIndustryItemId: item.id,
          unit: item.unit,
          price: item.price,
        })
      }
    })
  })

  return { teethData: expandedTeeth, teethItemIds }
}

/**
 * @typedef {Object} DescriptionData
 * @property {number} serviceId - Service industry ID
 * @property {string} chartType - Chart type ('dental' | 'jawBone')
 * @property {string[]} [selectedTeeth] - Selected teeth IDs
 * @property {string[]} [selectedRegions] - Selected region IDs
 * @property {Object} items - Service items data
 * @property {number|string} bookingId - The booking identifier
 * @property {Object} [service] - Full service object (used for PER_TEETH auto-mapping)
 * @property {boolean} [isIgnored] - Whether type 4 questions should be ignored
 */

/**
 * @param {DescriptionData} descriptionData - Complete data object
 * @returns {{
 * serve_industry_id: number,
 * teeth: ToothGroup[]|null,
 * booking_id: (number|string),
 * serve_industry_items: ServiceItem[]
 * }}
 */
export function transformDescriptionToApiRequest(descriptionData) {
  const {
    chartType,
    selectedTeeth,
    selectedRegions,
    serviceId,
    bookingId,
    items,
    description,
    service,
    isIgnored,
  } = descriptionData

  let teethData = transformChartDataToApiFormat(chartType, selectedTeeth, selectedRegions)

  const perTeethItemIds = new Set()

  // When checkbox is NOT active (isIgnored): add PER_TEETH items to teeth
  if (
    isIgnored &&
    service &&
    selectedTeeth &&
    selectedTeeth.length > 0 &&
    chartType === CHART_TYPES.DENTAL
  ) {
    const result = addTeethItemsToTeethData(
      service,
      selectedTeeth,
      items,
      teethData,
      perTeethItemIds
    )
    teethData = result.teethData
  }

  const apiTeethData = teethData.length > 0 ? teethData : null

  const filteredItems = (items ? Object.entries(items) : [])
    .filter(([itemId]) => !perTeethItemIds.has(Number(itemId)))
    .reduce((acc, [itemId, itemData]) => {
      acc[itemId] = itemData
      return acc
    }, {})

  return {
    serve_industry_id: serviceId,
    teeth: apiTeethData,
    booking_id: bookingId,
    serve_industry_items: transformItemsToApiFormat(filteredItems),
    description: description || '',
  }
}

/**
 * @typedef {Object} TableTreatmentItem
 * @property {string|number} id - Item ID
 * @property {string|number} code - Treatment code
 * @property {string} date - Treatment date (ISO string)
 * @property {string} serviceType - Service type/title
 * @property {string} area - Formatted area string (teeth/regions)
 * @property {Object} specialServices - Question and item titles
 * @property {string} specialServices.questionTitle - Question title
 * @property {string} specialServices.itemTitle - Item title
 * @property {string} description - Chart type description
 * @property {number} cost - Total cost of the treatment
 */

/**
 * @param {Array<Object>} apiData - Array of booking items from API
 * @returns {TableTreatmentItem[]} Array of table-formatted treatment items
 */
export function transformApiResponseToTableFormat(apiData) {
  if (!apiData || !Array.isArray(apiData)) return []

  const flattenedItems = apiData.flatMap((booking) => {
    if (!booking.items || !Array.isArray(booking.items)) return []

    return booking.items.map((item) => ({
      ...item,
      doctorName: booking.doctorName || booking.doctor_name || '',
      performFiles: booking.perform_files || [],
      bookingId: booking.booking_id || null,
    }))
  })

  return flattenedItems.map((item, index) => {
    let areaString = '-'
    if (item.teeth?.length > 0) {
      const teethByPosition = item.teeth.reduce((acc, tooth) => {
        if (!acc[tooth.position]) {
          acc[tooth.position] = []
        }
        acc[tooth.position].push(tooth.number)
        return acc
      }, {})

      areaString = Object.entries(teethByPosition)
        .map(([position, numbers]) => {
          const positionLabel = POSITION_LABELS[position] || position
          return `${positionLabel}: [${numbers.join(', ')}]`
        })
        .join(', ')
    }

    const selectedTeeth = []
    if (item.teeth && item.teeth.length > 0) {
      item.teeth.forEach((toothData) => {
        if (!toothData.position || !toothData.number) return

        const numbersArray = Array.isArray(toothData.number) ? toothData.number : [toothData.number]

        const positionRanges = {
          TL: [1, 7],
          TR: [8, 14],
          BL: [15, 21],
          BR: [22, 28],
        }

        const [minId, maxId] = positionRanges[toothData.position] || [1, 28]

        numbersArray.forEach((displayNum) => {
          for (let id = minId; id <= maxId; id += 1) {
            if (teethMapping[id] === displayNum) {
              selectedTeeth.push(String(id))
            }
          }
        })
      })
    }

    const jawBadgeText = getJawBadgeText(selectedTeeth)

    const price = Number(item.price) || 0
    const cost = Number(item.priceWithProfit) || price

    const hasTeeth = item.teeth && item.teeth.length > 0
    const itemTitle = item.itemTitle || item.item_title || '-'
    const itemTitleAsNumber = Number(itemTitle)
    const unit = hasTeeth
      ? item.teeth.reduce(
          (sum, tooth) => sum + (Array.isArray(tooth.number) ? tooth.number.length : 1),
          0
        )
      : !Number.isNaN(itemTitleAsNumber) && itemTitleAsNumber > 0
        ? itemTitleAsNumber
        : Number(item.unit) || 0

    const specialServices = {
      questionTitle: item.questionTitle || item.question_title || '-',
      itemTitle,
    }

    return {
      tpdId: item?.id,
      id:
        item.itemId || item.item_id || `${item.serveIndustryId || item.serve_industry_id || index}`,
      serveId: item.serveIndustryId || item.serve_industry_id,
      serveTitle: item.serveIndustryTitle || item.serve_industry_title,
      code:
        (item.serveIndustryId || item.serve_industry_id)?.toString() ||
        (item.itemId || item.item_id)?.toString() ||
        '-',
      date:
        item.bookingAt ||
        item.booking_at ||
        item.performedAt ||
        item.performed_at ||
        new Date().toISOString(),
      serviceType: item.serveIndustryTitle || item.serve_industry_title || '-',
      area: areaString,
      specialServices,
      description: item.description || '',
      teeth: item.teeth || [],
      selectedTeeth,
      jawBadgeText,
      cost,
      price,
      unit,
      questionId: item.questionId || item.question_id,
      doctorName: item.doctorName || '',
      files: item.files || [],
      bookingId: item.bookingId || null,
    }
  })
}

/**
 * @param {Object} params - Transformation parameters
 * @param {number} params.serviceId - Service ID
 * @param {string} params.chartType - Chart type
 * @param {Object} params.requestData - API request data
 * @returns {TableTreatmentItem} Table-formatted treatment item
 */
export function transformNewTreatmentToTableFormat({ serviceId, chartType, requestData }) {
  const firstIndustry = requestData?.serve_industries?.[0]

  const area =
    firstIndustry?.teeth?.map((t) => `${t.position}: [${t.number.join(', ')}]`).join(', ') || '-'

  const specialServicesString =
    requestData?.serve_industry_items?.map((i) => i.id).join(', ') || '-'

  const chartTypeLabel = chartType === 'dental' ? 'چارت دندان' : 'استخوان فک - لثه'

  return {
    code: serviceId,
    date: new Date().toISOString(),
    serviceType: serviceId,
    area,
    specialServices: specialServicesString,
    visibleSpecialServices: getVisibleSpecialServices(specialServicesString),
    allSpecialServices: getAllSpecialServices(specialServicesString),
    description: chartTypeLabel,
  }
}

/**
 * @param {Object} params - Transformation parameters
 * @param {Object} params.selectorData - Service selector data from TpServiceSelector
 * @param {string} params.chartType - Chart type ('dental' | 'jawBone')
 * @param {number|string} params.bookingId - Booking ID
 * @param {Object} [params.service] - Full service object (used for PER_TEETH auto-mapping)
 * @param {boolean} [params.enableAutoMapping=true] - Whether to enable PER_TEETH auto-mapping
 * @returns {{
 *   serve_industry_item_id: number,
 *   unit: number,
 *   price: string,
 *   booking_id: number|string|null,
 *   teeth: ToothGroup[],
 *   description: string
 * }}
 * @throws {Error} If items object is empty
 */
export function transformDescriptionToUpdateRequest({
  selectorData,
  chartType,
  bookingId,
  service,
  enableAutoMapping = true,
}) {
  const { selectedTeeth, selectedRegions, items, description } = selectorData

  let teethData = transformChartDataToApiFormat(chartType, selectedTeeth, selectedRegions)

  const perTeethItemIds = new Set()

  if (
    enableAutoMapping &&
    service &&
    selectedTeeth &&
    selectedTeeth.length > 0 &&
    !hasPerTeethItems(items) &&
    chartType === CHART_TYPES.DENTAL
  ) {
    const result = addTeethItemsToTeethData(
      service,
      selectedTeeth,
      items,
      teethData,
      perTeethItemIds
    )
    teethData = result.teethData
  }

  const itemKeys = Object.keys(items || {})
  if (itemKeys.length === 0) {
    throw new Error('transformDescriptionToUpdateRequest: At least one item is required')
  }

  const nonPerTeethItemKeys = itemKeys.filter((key) => !perTeethItemIds.has(Number(key)))

  if (nonPerTeethItemKeys.length === 0) {
    throw new Error(
      'transformDescriptionToUpdateRequest: At least one non-PER_TEETH item is required for update. PER_TEETH items are auto-mapped to teeth[].serve_industry_item_id.'
    )
  }

  const firstItemKey = nonPerTeethItemKeys[0]
  const itemData = items[firstItemKey]

  if (Array.isArray(itemData)) {
    const firstItem = itemData[0]

    const id = Number(firstItem?.id)
    if (Number.isNaN(id) || id < 0) {
      throw new Error(`transformDescriptionToUpdateRequest: Invalid item ID in multi-select array`)
    }

    return {
      serve_industry_item_id: id,
      unit: Math.max(1, Number(firstItem?.unit) || 1),
      price: String(Math.max(0, Number(firstItem?.price) || 0)),
      booking_id: bookingId || null,
      teeth: teethData,
      description: description || '',
    }
  }

  const id = Number(itemData?.id)
  if (Number.isNaN(id) || id < 0) {
    throw new Error(`transformDescriptionToUpdateRequest: Invalid item ID`)
  }

  return {
    serve_industry_item_id: id,
    unit: Math.max(1, Number(itemData?.unit) || 1),
    price: String(Math.max(0, Number(itemData?.price) || 0)),
    booking_id: bookingId || null,
    teeth: teethData,
    description: description || '',
  }
}

function extractSelectedTeethFromItem(teeth) {
  const selectedTeeth = []
  if (teeth && teeth.length > 0) {
    teeth.forEach((toothData) => {
      if (!toothData.position || !toothData.number) return

      const numbersArray = Array.isArray(toothData.number) ? toothData.number : [toothData.number]

      const positionRanges = {
        TL: [8, 14],
        TR: [1, 7],
        BL: [22, 28],
        BR: [15, 21],
      }

      const [minId, maxId] = positionRanges[toothData.position] || [1, 28]

      numbersArray.forEach((displayNum) => {
        for (let id = minId; id <= maxId; id += 1) {
          if (teethMapping[id] === displayNum) {
            selectedTeeth.push(String(id))
          }
        }
      })
    })
  }
  return selectedTeeth
}

export function transformBookingsToCardFormat(apiData) {
  if (!apiData || !Array.isArray(apiData)) return []

  return apiData.map((booking) => ({
    id: booking.id || booking.booking_id,
    doctorName: booking.doctorName || booking.doctor_name || '',
    date: booking.bookingAt || booking.booking_at || booking.performedAt || '',
    items: (booking.items || []).map((item) => {
      const selectedTeeth = extractSelectedTeethFromItem(item.teeth)
      const price = Number(item.price) || 0
      const cost = Number(item.priceWithProfit) || price

      return {
        tpdId: item?.id,
        id: item.itemId || item.item_id,
        serveId: item.serveIndustryId || item.serve_industry_id,
        serveTitle: item.serveIndustryTitle || item.serve_industry_title || '-',
        date:
          item.bookingAt ||
          item.booking_at ||
          item.performedAt ||
          item.performed_at ||
          new Date().toISOString(),
        cost,
        price,
        teeth: item.teeth || [],
        selectedTeeth,
        jawBadgeText: getJawBadgeText(selectedTeeth),
        description: item.description || '',
        doctorName: booking.doctorName || booking.doctor_name || '',
        specialServices: {
          questionTitle: item.questionTitle || item.question_title || '-',
          itemTitle: item.itemTitle || item.item_title || '-',
        },
      }
    }),
  }))
}
