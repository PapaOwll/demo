import { ref, unref, watch } from 'vue'
import { normalizePersian } from '@/utils/persian-search'

export function usePersianOptions(sourceRef, labelKey = 'name') {
  const options = ref([])

  const filter = (val, update) => {
    update(() => {
      const items = unref(sourceRef) ?? []
      if (!val) {
        options.value = [...items]
        return
      }
      const needle = normalizePersian(val)
      options.value = items.filter((item) => normalizePersian(item?.[labelKey]).includes(needle))
    })
  }

  watch(
    sourceRef,
    (items) => {
      options.value = items ?? []
    },
    { immediate: true }
  )

  return { options, filter }
}
