import { computed, unref } from 'vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
import {
  apiGetAnnouncements,
  apiCreateAnnouncement,
  apiUpdateAnnouncement,
  apiDeleteAnnouncement,
  apiGetEligibleWarrantyServes,
  apiGetWarrantyServeById,
  apiSaveWarrantyServeData,
} from '../api'
import { handleApiError } from '@/utils/error-handler'

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
    onError: (err) => handleApiError(err),
    ...options,
  })

export const useApiUpdateAnnouncement = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiUpdateAnnouncement(id, data),
    onError: (err) => handleApiError(err),
    ...options,
  })

export const useApiDeleteAnnouncement = (options = {}) =>
  useMutation({
    mutationFn: (id) => apiDeleteAnnouncement(id),
    onError: (err) => handleApiError(err),
    ...options,
  })

export const useApiGetEligibleWarrantyServes = (options = {}) =>
  useQuery({
    queryKey: ['settings', 'warranty-list'],
    queryFn: () => apiGetEligibleWarrantyServes(),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useGetWarrantyServeById = (serveId, options = {}) =>
  useQuery({
    queryKey: computed(() => ['settings', 'warranty-id', unref(serveId)]),
    queryFn: () => apiGetWarrantyServeById(unref(serveId)),
    select: (data) => data?.data ?? data,
    enabled: computed(() => !!unref(serveId)),
    ...options,
  })

export const useSaveWarrantyServeData = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiSaveWarrantyServeData(data),
    onError: (err) => handleApiError(err),
    ...options,
  })
