import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  getTvSubtitleList,
  getTvSubtitle,
  createTvSubtitle,
  updateTvSubtitle,
  deleteTvSubtitle,
} from '../api/subtitle'

export const useTvSubtitleList = (params, options = {}) =>
  useQuery({
    queryKey: ['tv-subtitle-list', params],
    queryFn: () => getTvSubtitleList(params.value || params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })

export const useTvSubtitle = (id, options = {}) => {
  return useQuery({
    queryKey: ['tv-subtitle', id],
    queryFn: () => getTvSubtitle(id.value || id),
    enabled: !!(id.value || id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

export const useCreateTvSubtitle = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTvSubtitle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-subtitle-list'] })
    },
  })
}

export const useUpdateTvSubtitle = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => updateTvSubtitle(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tv-subtitle', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['tv-subtitle-list'] })
    },
  })
}

export const useDeleteTvSubtitle = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTvSubtitle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-subtitle-list'] })
    },
  })
}
