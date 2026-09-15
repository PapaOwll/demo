import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/vue-query'
import {
  getFeedbackList,
  getTotalFeedbackCount,
  getFeedback,
  acceptFeedback,
  rejectFeedback,
  deleteFeedback,
  deleteFeedbackAttachment,
  uploadFeedbackFiles,
  updateFeedback,
  batchAcceptFeedbacks,
  batchRejectFeedbacks,
} from '../api'

export const useFeedbackList = (params, options = {}) =>
  useInfiniteQuery({
    queryKey: ['feedback-list', params],
    queryFn: ({ pageParam }) => getFeedbackList({ ...params.value, ...pageParam }),
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })

export const useFeedback = (id) => {
  return useQuery({
    queryKey: ['feedback', id],
    queryFn: () => getFeedback(id.value),
    enabled: !!id.value,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useAcceptFeedback = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: acceptFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-list'] })
    },
  })
}

export const useRejectFeedback = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rejectFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-list'] })
    },
  })
}

export const useDeleteFeedback = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-list'] })
    },
  })
}

export const useGetTotalFeedbackCountMutation = () =>
  useMutation({
    mutationFn: (filters) => getTotalFeedbackCount(filters.value || filters),
  })

export const useDeleteFeedbackAttachment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ feedbackId, fileId }) => deleteFeedbackAttachment(feedbackId, fileId),
    onSuccess: (data, variables) => {
      // Invalidate the specific feedback query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['feedback', variables.feedbackId] })
    },
  })
}

export const useUploadFeedbackFiles = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ feedbackId, fileIds }) => uploadFeedbackFiles(feedbackId, fileIds),
    onSuccess: (data, variables) => {
      // Invalidate the specific feedback query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['feedback', variables.feedbackId] })
    },
  })
}

export const useUpdateFeedback = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ feedbackId, data }) => updateFeedback(feedbackId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feedback', variables.feedbackId] })
      queryClient.invalidateQueries({ queryKey: ['feedback-list'] })
    },
  })
}

export const useBatchAcceptFeedbacks = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: batchAcceptFeedbacks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-list'] })
    },
  })
}

export const useBatchRejectFeedbacks = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: batchRejectFeedbacks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-list'] })
    },
  })
}
