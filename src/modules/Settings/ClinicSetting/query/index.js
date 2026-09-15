import { computed, unref } from 'vue'
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/vue-query'
import {
  apiSetWorkTimeWeekday,
  apiSetWorkTimeCalendar,
  apiGetWorkTimeCalendar,
  apiGetIndustrySetting,
  apiSetClinicSetting,
  apiIndustryBranches,
  apiCreateBranch,
  apiDeleteBranch,
  apiUpdateBranch,
  apiGetWeekday,
  apiGetRooms,
  apiCreateRoom,
  apiUpdateRoom,
  apiDeleteRoom,
  apiSetBranchDoctor,
  apiDeleteBranchDoctor,
  apiGetBranchDoctorList,
  apiSetDoctorWorkingHours,
  apiGetAnnouncements,
  apiCreateAnnouncement,
  apiUpdateAnnouncement,
  apiDeleteAnnouncement,
} from '../api'
import { handleError } from '@/utils/error-handler'
import { toGregorian, jalaaliMonthLength } from '@/utils/date-utils'

export const useClinicBranchesSettingInfinityQuery = (options = {}) =>
  useInfiniteQuery({
    queryKey: ['setting', 'all-clinic-branches'],
    queryFn: ({ pageParam }) => apiIndustryBranches(pageParam),
    select: ({ pages, pageParams }) => ({
      pages,
      pageParams,
    }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.data?.items.length === 0) return null

      return { page: pages.length + 1 }
    },
    placeholderData: (previousData) => previousData,
    ...options,
  })
export const useApiGetIndustrySetting = () =>
  useQuery({
    queryKey: ['setting', 'industry-setting'],
    queryFn: () => apiGetIndustrySetting(),
    select: (data) => {
      const response = data?.data?.clinic ?? data?.data
      return {
        ...response,
        instagram: response.data.instagram,
      }
    },
  })
export const useApiSetClinicSetting = (options = {}) =>
  useMutation({
    mutationFn: ({ data }) => apiSetClinicSetting(data),
    onError: (error) => handleError(error),
    ...options,
  })
export const useApiGetBranches = (options = {}) =>
  useQuery({
    queryKey: ['setting', 'industry-branches'],
    queryFn: ({ params }) => apiIndustryBranches(params),
    select: (data) => data?.data ?? data,
    ...options,
  })
export const useApiCreateBranch = (options = {}) =>
  useMutation({
    mutationFn: ({ ...data }) => apiCreateBranch(data),
    onError: (error) => handleError(error),
    ...options,
  })
export const useApiUpdateBranch = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiUpdateBranch(data, id),
    onError: (error) => handleError(error),
    ...options,
  })
export const useApiDeleteBranch = (options = {}) =>
  useMutation({
    mutationFn: (id) => apiDeleteBranch(id),
    onError: (error) => handleError(error),
    ...options,
  })
export const useApiSetWorkTimeWeekday = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiSetWorkTimeWeekday(data),
    onError: (error) => handleError(error),
    ...options,
  })
export const useApiGetWeekday = (options = {}) =>
  useQuery({
    queryKey: ['week-day'],
    queryFn: () => apiGetWeekday(),
    select: (data) => data?.data ?? data,
    ...options,
  })
export const useApiGetWorkTimeCalendar = (queryParams, options = {}) => {
  return useQuery({
    queryKey: ['work-time-calendar', queryParams],
    queryFn: () => {
      // Convert Persian month to Gregorian date range
      const { year, month, branchId } = queryParams.value
      const daysInMonth = jalaaliMonthLength(year, month)

      // First day of Persian month
      const fromDate = toGregorian(year, month, 1)
      // Last day of Persian month
      const toDate = toGregorian(year, month, daysInMonth)

      const params = {
        'filter[from_date]': `${fromDate.gy}-${String(fromDate.gm).padStart(2, '0')}-${String(fromDate.gd).padStart(2, '0')} 00:00:00`,
        'filter[to_date]': `${toDate.gy}-${String(toDate.gm).padStart(2, '0')}-${String(toDate.gd).padStart(2, '0')} 23:59:59`,
      }

      if (branchId) {
        params['filter[branch_id]'] = branchId
      }
      params.per_page = 40

      return apiGetWorkTimeCalendar(params)
    },
    staleTime: 0,
    select: (data) => data?.data ?? data,
    ...options,
  })
}

export const useApiSetWorkTimeCalendar = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiSetWorkTimeCalendar(data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useApiGetBranchDoctorsList = ({ branchId, ...options } = {}) => {
  const branchIdValue = computed(() => unref(branchId))
  return useQuery({
    queryKey: ['setting', 'branch-doctor', branchIdValue],
    queryFn: () => apiGetBranchDoctorList({ branch_id: branchIdValue.value }),
    select: (data) => data?.data ?? data,
    ...options,
  })
}

export const useApiSetBranchDoctorMutation = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiSetBranchDoctor(data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useApiRemoveBranchDoctorMutation = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiDeleteBranchDoctor(data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useApiSetDoctorWorkingHours = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiSetDoctorWorkingHours(data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useApiGetRooms = ({ branchId, ...options } = {}) =>
  useQuery({
    queryKey: ['rooms', branchId],
    queryFn: () => apiGetRooms({ 'filter[branch_id]': branchId }),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useApiCreateRoom = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiCreateRoom(data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useApiUpdateRoom = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiUpdateRoom(id, data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useApiDeleteRoom = (options = {}) =>
  useMutation({
    mutationFn: (id) => apiDeleteRoom(id),
    onError: (error) => handleError(error),
    ...options,
  })

export const useApiGetAnnouncements = ({ branchId, ...options } = {}) =>
  useQuery({
    queryKey: ['announcements', branchId],
    queryFn: () => apiGetAnnouncements({ 'filter[branch_id]': branchId }),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useApiCreateAnnouncement = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiCreateAnnouncement(data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useApiUpdateAnnouncement = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiUpdateAnnouncement(id, data),
    onError: (error) => handleError(error),
    ...options,
  })

export const useApiDeleteAnnouncement = (options = {}) =>
  useMutation({
    mutationFn: (id) => apiDeleteAnnouncement(id),
    onError: (error) => handleError(error),
    ...options,
  })
