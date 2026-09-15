import { shallowRef } from 'vue'

let iconsCache = null

const normalizeIconName = (name) => {
  if (!name) return null
  let normalized = name.replace(/^icon/i, '')
  normalized = normalized
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('')
  return `Icon${normalized}`
}

export function useTablerIcons() {
  const allIcons = shallowRef(null)

  const loadIcons = async () => {
    if (allIcons.value) return
    if (iconsCache) {
      allIcons.value = iconsCache
      return
    }
    try {
      const module = await import('@tabler/icons-vue')
      iconsCache = module
      allIcons.value = module
    } catch {
      iconsCache = {}
      allIcons.value = {}
    }
  }

  const resolveIcon = (name) => {
    if (!name || !allIcons.value) return null
    const pascalName = normalizeIconName(name)
    return allIcons.value[pascalName] || null
  }

  return { allIcons, loadIcons, resolveIcon, normalizeIconName }
}
