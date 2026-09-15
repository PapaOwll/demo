import { ref, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import breakpoints from '@/constants/breakpoints'

export function useIsMobile(): Ref<boolean> {
  const mql = window.matchMedia(`(min-width: ${breakpoints.lg})`)
  const isMobile = ref(!mql.matches)

  const handleChange = (event: MediaQueryListEvent): void => {
    isMobile.value = !event.matches
  }

  mql.addEventListener('change', handleChange)
  onBeforeUnmount(() => mql.removeEventListener('change', handleChange))

  return isMobile
}
