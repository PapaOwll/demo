import { computed } from 'vue'
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/vue-query'
import {
  apiCheckHoliday,
  apiCreateTask,
  apiDeleteTask,
  apiGetTask,
  apiGetTaskAssignee,
  apiGetTasks,
  apiGetTasksTotalCount,
  apiGetTaskType,
  apiSendDueTaskTimes,
  apiUpdateTask,
  apiSubmitFollowUpAnswers,
  apiGetFollowUpsSurvey,
  apiSetCallStatus,
} from '../api'

import { handleError } from '@/utils/error-handler'

export const useTaskInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['task', 'all-tasks', filters],
    queryFn: ({ pageParam }) => apiGetTasks({ ...filters.value, ...pageParam }),
    select: ({ pages, pageParams }) => ({
      pages,
      pageParams,
    }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.data.items.length === 0) return null

      return { page: pages.length + 1 }
    },
    placeholderData: (previousData) => previousData,
    refetchOnMount: 'always',
    ...options,
  })
export const useApiCreateTask = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiCreateTask(data),
    onError: (err) => handleError(err),
    ...options,
  })
export const useApiUpdateTask = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiUpdateTask(id, data),
    onError: (err) => handleError(err),
    ...options,
  })
export const useApiDeleteTask = (options = {}) =>
  useMutation({
    mutationFn: (id) => apiDeleteTask(id),
    onError: (err) => handleError(err),
    ...options,
  })

export const useApiCheckHoliday = (date, branchId, options = {}) =>
  useQuery({
    queryKey: ['is-holiday', date, branchId],
    queryFn: () => apiCheckHoliday(date.value.date, branchId.value),
    select: (data) => data,
    ...options,
  })
export const useGetDueTaskTimesMutation = () => {
  return useMutation({
    mutationKey: ['task', 'due-times'],
    mutationFn: (data) => apiSendDueTaskTimes(data),
  })
}

export const useApiGetTaskAssignee = () =>
  useQuery({
    queryKey: ['task', 'assignee'],
    queryFn: () => apiGetTaskAssignee(),
    select: (data) => {
      return data?.data.items ?? data?.data ?? data
    },
  })

export const useGetTaskTotalCountMutation = () =>
  useMutation({
    mutationFn: (filters) => apiGetTasksTotalCount(filters.value),
  })
export const useGetTaskType = (options = {}) =>
  useQuery({
    queryKey: ['type'],
    queryFn: () => apiGetTaskType(),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useTaskQuery = (taskId, placeholder, options = {}) =>
  useQuery({
    queryKey: ['task', 'detail', taskId],
    queryFn: () => apiGetTask(taskId.value),
    select: (data) => data?.data ?? data,
    enabled: computed(() => !!taskId.value),
    placeholderData: () => placeholder?.value ?? undefined,
    ...options,
  })

export const useGetFollowUpsSurvey = (taskId, options = {}) =>
  useQuery({
    queryKey: ['survey', 'followups', taskId],
    queryFn: () => apiGetFollowUpsSurvey(taskId.value),
    select: (data) => data.data ?? data,
    ...options,
  })

export const useSubmitFollowUpAnswers = (options = {}) =>
  useMutation({
    mutationFn: ({ taskId, payload }) => apiSubmitFollowUpAnswers(taskId, payload),
    onError: (err) => handleError(err),
    ...options,
  })

export const useSetCallStatusMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ taskId, data }) => apiSetCallStatus(taskId, data),
    onError: (err) => handleError(err),
    ...options,
  })
