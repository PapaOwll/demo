import { hasAccessToken } from '@/utils/auth'
import { request } from '@/data/services'
import { handleError } from './error-handler'

const THEME_SETTINGS_KEY = 'crm-theme-settings'
const isLoggedIn = hasAccessToken()

function setFavIcon(url) {
  let link = document.querySelector("link[rel~='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.append(link)
  }
  link.href = url
}

const rgbToHex = (r, g, b) => {
  const hex = 1 * 16_777_216 + r * 65_536 + g * 256 + b
  return `#${hex.toString(16).slice(1)}`
}

const hexToRgb = (hex) => {
  const bigint = Number.parseInt(hex.slice(1), 16)

  const r = Math.floor(bigint / 65_536) % 256 // Extract red component
  const g = Math.floor(bigint / 256) % 256 // Extract green component
  const b = bigint % 256 // Extract blue component

  return [r, g, b]
}

function lightenColor(color, factor) {
  const rgbColor = hexToRgb(color)

  const newR = Math.min(255, rgbColor[0] + 255 * factor)
  const newG = Math.min(255, rgbColor[1] + 255 * factor)
  const newB = Math.min(255, rgbColor[2] + 255 * factor)

  return rgbToHex(newR, newG, newB)
}

function generateColorVariations(mainColorKey, mainColor) {
  const variations = {}
  variations[`${mainColorKey}-light-3`] = lightenColor(mainColor, 0.1)
  variations[`${mainColorKey}-light-5`] = lightenColor(mainColor, 0.2)
  variations[`${mainColorKey}-light-7`] = lightenColor(mainColor, 0.3)
  variations[`${mainColorKey}-light-8`] = lightenColor(mainColor, 0.4)
  variations[`${mainColorKey}-light-9`] = lightenColor(mainColor, 0.45)
  variations[`${mainColorKey}-dark-2`] = lightenColor(mainColor, -0.2)
  return variations
}

function storeThemeSetting(settings) {
  localStorage.setItem(THEME_SETTINGS_KEY, JSON.stringify(settings))
}

export function getThemeSetting() {
  try {
    return JSON.parse(localStorage.getItem(THEME_SETTINGS_KEY))
  } catch {
    return {}
  }
}

export async function setThemeColors() {
  try {
    if (isLoggedIn) {
      const {
        data: { setting },
      } = await request.get('v1/setting/general/theme')

      storeThemeSetting(setting)

      if (setting?.colors?.length) {
        setting?.colors?.forEach((color) => {
          document.documentElement.style.setProperty(`--el-color-${color.name}`, color.hex_code)
          const variations = generateColorVariations(color.name, color.hex_code)
          Object.keys(variations).forEach((variable) => {
            document.documentElement.style.setProperty(
              `--el-color-${variable}`,
              variations[variable]
            )
          })
        })
      }

      const favIcon = setting?.icon

      if (favIcon) {
        setFavIcon(favIcon)
      }
    }
  } catch (error) {
    handleError(error, { showToast: false, glitchtipLog: true })
  }
}
