import { ref, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'

const sortMethod = (rows) => rows

export function useTableSort(queryKey, setSort, options = {}) {
  const { exactRemove = false } = options
  const pagination = ref({ sortBy: null, descending: false })
  const queryClient = useQueryClient()

  watch(
    [() => pagination.value.sortBy, () => pagination.value.descending],
    ([sortBy, descending]) => {
      setSort(sortBy, descending)
      queryClient.removeQueries({ queryKey, ...(exactRemove ? { exact: true } : {}) })
      queryClient.invalidateQueries({ queryKey })
    }
  )

  return { pagination, sortMethod }
}
