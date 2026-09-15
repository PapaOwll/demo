import { computed, ref, watch } from 'vue'
import { useGetPresentSessionTimes } from '../query'

const toHHMM = (time) => (time?.length === 5 ? time : (time?.slice(0, 5) ?? ''))

/**
 * Fetches and caches session times from POST v1/booking/sessions.
 *
 * Each API slot has the shape { start, end, count, reserve }.
 * - startTimeOptions exposes every slot's `start` as a selectable option.
 * - endTimeOptions exposes every slot's `end` as a selectable option.
 *
 * @param {import('vue').Ref<string>} dateRef - reactive date string (YYYY-MM-DD)
 * @param {import('vue').Ref<number|string>} branchIdRef - reactive branch id
 * @returns {{
 *   sessionTimes: import('vue').ComputedRef<Array<{start:string,end:string,count:number,reserve:boolean}>>,
 *   startTimeOptions: import('vue').ComputedRef<Array<{label:string,value:string}>>,
 *   endTimeOptions: import('vue').ComputedRef<Array<{label:string,value:string}>>,
 *   isLoading: import('vue').Ref<boolean>
 * }}
 */
export function useSessionTimes(dateRef, branchIdRef) {
  const rawTimes = ref([])
  const isLoading = ref(false)

  const { mutate: fetchSessionTimes } = useGetPresentSessionTimes({
    onSuccess: (response) => {
      const data = response?.data ?? response
      if (Array.isArray(data)) {
        rawTimes.value = data
      } else if (data?.items) {
        rawTimes.value = data.items
      } else if (typeof data === 'object') {
        // If the API returns an object with time slots
        rawTimes.value = Object.values(data).filter(Boolean)
      } else {
        rawTimes.value = []
      }
    },
    onError: () => {
      rawTimes.value = []
    },
  })

  const sessionTimes = computed(() =>
    (rawTimes.value || []).map((t) => {
      if (typeof t === 'string') {
        return { start: t, end: t, count: 0, reserve: false }
      }
      if (typeof t === 'object' && t?.start && t?.end) {
        return {
          start: t.start,
          end: t.end,
          count: t.count ?? 0,
          reserve: !!t.reserve,
        }
      }
      if (typeof t === 'object' && t?.time) {
        return { start: t.time, end: t.time, count: 0, reserve: false }
      }
      return { start: String(t), end: String(t), count: 0, reserve: false }
    })
  )

  const startTimeOptions = computed(() =>
    sessionTimes.value.map((t) => ({
      label: toHHMM(t.start),
      value: t.start,
      disabled: t.reserve,
      end: t.end,
      count: t.count,
      reserve: t.reserve,
    }))
  )

  const endTimeOptions = computed(() =>
    sessionTimes.value.map((t) => ({
      label: toHHMM(t.end),
      value: t.end,
      disabled: t.reserve,
      start: t.start,
      count: t.count,
      reserve: t.reserve,
    }))
  )

  watch(
    [dateRef, branchIdRef],
    ([date, branchId]) => {
      if (!date || !branchId) {
        rawTimes.value = []
        return
      }
      isLoading.value = true
      fetchSessionTimes(
        { date, branchId },
        {
          onSettled: () => {
            isLoading.value = false
          },
        }
      )
    },
    { immediate: true }
  )

  return { sessionTimes, startTimeOptions, endTimeOptions, isLoading }
}
