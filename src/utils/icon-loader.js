// Import all required icons statically
import {
  IconBrandChrome,
  IconBrandInstagram,
  IconPhone,
  IconBrandZoom,
  IconBrandTelegram,
  IconBrandGoogleFilled,
  IconReservedLine,
  IconMessage2,
  IconBrandWhatsapp,
  IconQuestionMark,
  IconBrandYoutube,
  IconBrandOpenai,
  IconUsers,
  IconWalk,
  IconDentalOff,
  IconUserQuestion,
  IconPhoneX,
  IconRobot,
  IconHome,
  IconUser,
  IconCalendar,
  IconCalendarPause,
  IconDental,
  IconClipboard,
  IconList,
  IconStethoscope,
  IconAd,
  IconChartBarPopular,
  IconSettings,
  IconLabel,
  IconMessages,
  // Add commonly used icons from the app
  IconCalendarWeek,
  IconLogout2,
  IconSpyOff,
  IconUserScan,
  IconPlus,
  IconDownload,
  IconRefresh,
  IconPencil,
  IconAlertCircle,
  IconReportMoney,
  IconDeviceMobileDollar,
  IconCreditCard,
  IconCashBanknotePlus,
  IconDatabaseDollar,
  IconReceipt2,
  IconXboxB,
} from '@tabler/icons-vue'

import tapsell from '@/assets/icons/Tapsell.svg'
import aparat from '@/assets/icons/aparat.svg'
import bale from '@/assets/icons/bale.svg'
import eitaa from '@/assets/icons/eitaa.svg'
import landin from '@/assets/icons/Landin.svg'
import rubika from '@/assets/icons/Rubika.svg'
import adwords from '@/assets/icons/adwords.svg'
import goftino from '@/assets/icons/Goftino.svg'
import sitraLogo from '@/assets/icons/sitra-logo.svg'

const svgIcons = {
  tapsell,
  aparat,
  adwords,
  bale,
  eitaa,
  landin,
  rubika,
  goftino,
  'sitra-logo': sitraLogo,
}

// Create a map of icon names to components
const iconMap = {
  // Brand icons
  'brand-chrome': IconBrandChrome,
  IconBrandChrome,
  IconMessages,
  'brand-instagram': IconBrandInstagram,
  IconBrandInstagram,
  'brand-zoom': IconBrandZoom,
  IconBrandZoom,
  'brand-telegram': IconBrandTelegram,
  IconBrandTelegram,
  'brand-google-filled': IconBrandGoogleFilled,
  IconBrandGoogleFilled,
  'brand-whatsapp': IconBrandWhatsapp,
  IconBrandWhatsapp,
  'brand-youtube': IconBrandYoutube,
  IconBrandYoutube,
  'brand-openai': IconBrandOpenai,
  IconBrandOpenai,

  // Communication icons
  phone: IconPhone,
  IconPhone,
  'phone-x': IconPhoneX,
  IconPhoneX,
  'message-2': IconMessage2,
  IconMessage2,
  'reserved-line': IconReservedLine,
  IconReservedLine,

  // User/People icons
  users: IconUsers,
  IconUsers,
  'user-question': IconUserQuestion,
  IconUserQuestion,
  user: IconUser,
  IconUser,
  walk: IconWalk,
  IconWalk,
  'user-scan': IconUserScan,
  IconUserScan,

  // UI/System icons
  robot: IconRobot,
  IconRobot,
  home: IconHome,
  IconHome,
  'question-mark': IconQuestionMark,
  IconQuestionMark,
  settings: IconSettings,
  IconSettings,
  label: IconLabel,
  IconLabel,

  // Calendar icons
  calendar: IconCalendar,
  IconCalendar,
  'calendar-pause': IconCalendarPause,
  IconCalendarPause,
  'calendar-week': IconCalendarWeek,
  IconCalendarWeek,

  // Medical/Health icons
  dental: IconDental,
  IconDental,
  'dental-off': IconDentalOff,
  IconDentalOff,
  stethoscope: IconStethoscope,
  IconStethoscope,

  // Business/Office icons
  clipboard: IconClipboard,
  IconClipboard,
  list: IconList,
  IconList,
  ad: IconAd,
  IconAd,
  'chart-bar-popular': IconChartBarPopular,
  IconChartBarPopular,

  // Action icons
  plus: IconPlus,
  IconPlus,
  download: IconDownload,
  IconDownload,
  refresh: IconRefresh,
  IconRefresh,
  pencil: IconPencil,
  IconPencil,

  // Status/Alert icons
  'alert-circle': IconAlertCircle,
  IconAlertCircle,
  'logout-2': IconLogout2,
  IconLogout2,
  'spy-off': IconSpyOff,
  IconSpyOff,

  // Financial icons
  'report-money': IconReportMoney,
  IconReportMoney,
  'device-mobile-dollar': IconDeviceMobileDollar,
  IconDeviceMobileDollar,
  'credit-card': IconCreditCard,
  IconCreditCard,
  'cash-banknote-plus': IconCashBanknotePlus,
  IconCashBanknotePlus,
  'database-dollar': IconDatabaseDollar,
  IconDatabaseDollar,
  'receipt-2': IconReceipt2,
  IconReceipt2,
  IconXboxB,
}

/**
 * Gets a Tabler icon component from the predefined map
 * @param {string|Object} iconName - Name of the icon or icon object with properties
 * @returns {Component|null} The icon component or null
 */
export const getTablerIcon = (iconName) => {
  // Return null for falsy values
  if (!iconName) return null

  // Handle string input (direct icon name)
  if (typeof iconName === 'string') {
    return iconMap[iconName] || svgIcons[iconName] || null
  }

  // Handle object input with icon and enTitle properties
  if (typeof iconName === 'object') {
    // First try to find by icon property in iconMap
    if (iconName.icon && iconMap[iconName.icon]) {
      return iconMap[iconName.icon]
    }

    // Fallback to enTitle in svgIcons
    if (iconName.enTitle && svgIcons[iconName.enTitle]) {
      return svgIcons[iconName.enTitle]
    }
  }

  // Return null if no icon found
  return null
}

/**
 * Loads a Tabler icon component (kept for backwards compatibility)
 * Now simply returns from the static map instead of dynamic import
 * @param {string} iconName - Name of the icon
 * @returns {Promise} The icon component or null
 */
export const loadTablerIcon = async (iconName) => {
  return getTablerIcon(iconName)
}

/**
 * Creates an async Vue component for a Tabler icon
 * @param {string|Object} iconName - Name of the icon or icon object with properties
 * @returns {Component|null} Async component or null
 */
export const createAsyncIconComponent = (iconName) => {
  if (!iconName) return null

  // Since we're using static imports, we can return the component directly
  const icon = getTablerIcon(iconName)
  if (icon) return icon

  // Return null if icon not found
  return null
}

/**
 * Gets all available icon names
 * @returns {string[]} Array of available icon names
 */
export const getAvailableIconNames = () => {
  return Object.keys(iconMap)
}

/**
 * Checks if an icon is available
 * @param {string|Object} iconName - Name of the icon or icon object to check
 * @returns {boolean} True if icon is available
 */
export const isIconAvailable = (iconName) => {
  if (!iconName) return false

  // Handle string input
  if (typeof iconName === 'string') {
    return iconName in iconMap || iconName in svgIcons
  }

  // Handle object input
  if (typeof iconName === 'object') {
    return (
      (iconName.icon && iconName.icon in iconMap) ||
      (iconName.enTitle && iconName.enTitle in svgIcons)
    )
  }

  return false
}

/**
 * Gets all available icons grouped by category
 * @returns {Object} Icons grouped by category
 */
export const getIconsByCategory = () => {
  return {
    brand: [
      'brand-chrome',
      'brand-instagram',
      'brand-zoom',
      'brand-telegram',
      'brand-google-filled',
      'brand-whatsapp',
      'brand-youtube',
      'brand-openai',
    ],
    communication: ['phone', 'message-2', 'reserved-line'],
    user: ['users', 'user', 'walk', 'user-scan'],
    system: ['robot', 'home', 'question-mark', 'settings', 'label'],
    calendar: ['calendar', 'calendar-pause', 'calendar-week'],
    medical: ['dental', 'stethoscope'],
    business: ['clipboard', 'list', 'ad', 'chart-bar-popular'],
    action: ['plus', 'download', 'refresh', 'pencil'],
    status: ['alert-circle', 'logout-2', 'spy-off'],
    financial: [
      'report-money',
      'device-mobile-dollar',
      'credit-card',
      'cash-banknote-plus',
      'database-dollar',
      'receipt-2',
    ],
  }
}

// Export the icon map for direct usage if needed
export { iconMap }
