import { computed, unref } from 'vue'
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/vue-query'
import {
  apiCreateCampaign,
  apiCreateCoupon,
  apiGetCampaigns,
  apiGetCoupon,
  apiGetCouponById,
  apiGetTotalCampaignCount,
  apiGetTotalImportCount,
  apiUpdateCampaign,
  apiUpdateCoupon,
  apiDeleteCoupon,
  checkImports,
  imports,
  importUsers,
  apiValidateCouponCode,
  apiGenerateCouponCode,
  apiToggleActiveCoupon,
} from '../api'
import { handleError } from '@/utils/error-handler'

export const useGetCampaignInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['campaign', 'all-campaigns', filters],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => apiGetCampaigns({ ...filters.value, ...pageParam }),
    select: ({ pages, pageParams }) => ({
      pages: pages.map(({ data }) => data),
      pageParams,
    }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage?.data?.items?.length === 0) return null

      return { page: pages.length + 1 }
    },
    placeholderData: (previousData) => previousData,
    ...options,
  })
export const useGetCampaignListQuery = (filters, options = {}) =>
  useQuery({
    queryKey: ['campaign', 'all-campaigns', filters],
    refetchOnMount: 'always',
    queryFn: () => apiGetCampaigns(unref(filters)),
    select: (data) => data?.data ?? data,
    ...options,
  })
export const useUpdateCampaignMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiUpdateCampaign(id, data),
    onError: (error) => handleError(error),
    ...options,
  })
export const useCreateCampaignMutation = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiCreateCampaign(data),
    onError: (error) => handleError(error),
    ...options,
  })
export const useImportsInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['import', 'all-imports', filters],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => imports({ ...filters.value, ...pageParam }),
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
    ...options,
  })
export const useGetTotalCampaignCountMutation = (options = {}) =>
  useMutation({
    mutationFn: (filters) => apiGetTotalCampaignCount(filters.value),
    onError: (error) => handleError(error),
    ...options,
  })
export const useGetTotalImportCountMutation = (options = {}) =>
  useMutation({
    mutationFn: (filters) => apiGetTotalImportCount(filters.value),
    onError: (error) => handleError(error),
    ...options,
  })
export const useCheckImportFileMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ ...data }) => checkImports(data),
    onError: (err) => handleError(err),
    ...options,
  })
export const useImportUsersMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ ...data }) => importUsers(data),
    onError: (err) => handleError(err),
    ...options,
  })
export const useGetCouponInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['coupon', 'all-coupon', filters],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => apiGetCoupon({ ...filters.value, ...pageParam }),
    select: ({ pages, pageParams }) => ({
      pages: pages.map(({ data }) => data),
      pageParams,
    }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage?.data?.items?.length === 0) return null

      return { page: pages.length + 1 }
    },
    placeholderData: (previousData) => previousData,
    ...options,
  })
export const useCreateCouponMutation = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiCreateCoupon(data),
    onError: (error) => handleError(error),
    ...options,
  })
export const useUpdateCouponMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiUpdateCoupon(id, data),
    onError: (error) => handleError(error),
    ...options,
  })
export const useDeleteCouponMutation = (options = {}) =>
  useMutation({
    mutationFn: (couponId) => apiDeleteCoupon(couponId),
    onError: (error) => handleError(error),
    ...options,
  })
export const useValidateCouponQuery = (code, options = {}) =>
  useQuery({
    queryKey: ['coupon', 'validate-coupon', code],
    queryFn: () => apiValidateCouponCode(code.value),
    select: (data) => data?.data ?? data,
    enabled: computed(() => !!code.value && code.value.length >= 3),
    ...options,
  })
export const useGenerateCouponMutation = (options = {}) =>
  useMutation({
    mutationFn: () => apiGenerateCouponCode(),
    onError: (error) => handleError(error),
    ...options,
  })
export const useCouponToggleActiveMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id }) => apiToggleActiveCoupon(id),
    onError: (error) => handleError(error),
    ...options,
  })
export const useGetCouponByIdQuery = (couponId, options = {}) =>
  useQuery({
    queryKey: ['coupon', 'detail', couponId],
    queryFn: () => apiGetCouponById(couponId),
    select: (data) => data?.data ?? data,
    enabled: !!couponId,
    ...options,
  })
