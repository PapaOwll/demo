import { useMutation, useQuery, useInfiniteQuery } from '@tanstack/vue-query'
import {
  getDoctorWorkTime,
  getSettings,
  getTagsApi,
  createTagApi,
  saveSettings,
  setDoctorWorkTime,
  updateTagApi,
  deleteTagApi,
  getIntroductionMethodsApi,
  createIntroductionMethodApi,
  updateIntroductionMethodApi,
  deleteIntroductionMethodApi,
} from '@/modules/Settings/GeneralSettings/api'
import { handleError } from '@/utils/error-handler'
import { getPersonalSetting, setPersonalSetting } from '@/modules/Settings/PersonalSetting/api'
import {
  apiCreateQuestion,
  apiDeleteQuestion,
  apiUpdateQuestion,
  createInstallment,
  deleteInstallment,
  installmentSettingList,
  updateInstallment,
  apiDeleteServeItem,
  apiGetServes,
  apiUpdateServeItem,
  serveMini,
} from '@/modules/Settings/PriceSettings/api'
import { apiGetUserStatus } from '@/modules/User/api'

export const useGetDoctorWorkTimes = (id) =>
  useQuery({
    queryKey: ['setting', 'doctor-work-times', id],
    enabled: !!id.value,
    queryFn: () => getDoctorWorkTime(id.value),
    select: (data) => {
      return data?.data ?? data
    },
  })

export const useSetDoctorWorkTimes = (options = {}) => {
  return useMutation({
    mutationKey: ['setting', 'doctor-work-times'],
    mutationFn: ({ doctorId, workTimes }) => setDoctorWorkTime(doctorId, workTimes),
    onError: (error) => {
      handleError(error)
    },
    ...options,
  })
}

export const useApiGetSettings = (key, params, options = {}) =>
  useQuery({
    queryKey: ['setting', key, params],
    queryFn: () => getSettings(key, params?.value),
    select: (data) => {
      return data?.data?.setting ?? data?.data ?? data
    },
    ...options,
  })

export const useApiSaveSetting = (key, options = {}) => {
  const { requestOptions, ...mutationOptions } = options
  return useMutation({
    mutationFn: ({ body, key: mutationKey }) => {
      const finalKey = mutationKey ?? key
      return saveSettings(body, finalKey, requestOptions)
    },
    onError: (error) => {
      handleError(error)
    },
    ...mutationOptions,
  })
}

export const useApiGetStatuses = () =>
  useQuery({
    queryKey: ['setting', 'survey', 'status'],
    queryFn: () => apiGetUserStatus(),
    select: (data) => {
      return data?.data ?? data
    },
  })

export const useApiGetMinimalServe = (filters, options = {}) =>
  useQuery({
    queryKey: ['serves', 'minimal', filters],
    queryFn: () => serveMini(filters),
    select: (data) => data.data ?? data,
    ...options,
  })

export const useApiGetInstallmentList = () =>
  useQuery({
    queryKey: ['setting', 'installment', 'list'],
    queryFn: () => installmentSettingList(),
    select: (data) => {
      return data?.data?.items ?? data.data ?? data
    },
  })

export const useApiUpdateInstallment = (options = {}) =>
  useMutation({
    mutationKey: ['setting', 'installment', 'update'],
    mutationFn: ({ installmentId, ...body }) => updateInstallment(body, installmentId),
    onError: (err) => {
      handleError(err)
    },
    ...options,
  })

export const useApiCreateInstallment = (options = {}) =>
  useMutation({
    mutationKey: ['setting', 'installment', 'create'],
    mutationFn: ({ ...body }) => createInstallment(body),
    onError: (err) => {
      handleError(err)
    },
    ...options,
  })

export const useApiDeleteInstallment = (options = {}) =>
  useMutation({
    mutationKey: ['setting', 'installment', 'delete'],
    mutationFn: (installmentId) => deleteInstallment(installmentId),
    onError: (err) => {
      handleError(err)
    },
    ...options,
  })

export const useApiGetPersonalSetting = (key) =>
  useQuery({
    queryKey: ['personal-setting'],
    queryFn: () => getPersonalSetting(key),
    select: (data) => data?.data ?? data,
  })

export const useSetPersonalSettingMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ key, ...data }) => setPersonalSetting(key, data),
    onError: (error) => {
      handleError(error)
    },
    ...options,
  })

export const useApiGetServes = () =>
  useQuery({
    queryKey: ['serves', 'all-serves'],
    queryFn: () => apiGetServes(),
    select: (data) => data?.data ?? data,
  })

export const useCreateQuestionMutation = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiCreateQuestion(data),
    onError: (error) => {
      handleError(error)
    },
    ...options,
  })

export const useUpdateQuestionMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiUpdateQuestion(data, id),
    onError: (error) => {
      handleError(error)
    },
    ...options,
  })

export const useDeleteQuestionMutation = (options = {}) =>
  useMutation({
    mutationFn: (id) => apiDeleteQuestion(id),
    onError: (error) => {
      handleError(error)
    },
    ...options,
  })

export const useUpdateQuestionItemMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiUpdateServeItem(id, data),
    onError: (err) => handleError(err),
    ...options,
  })

export const useDeleteQuestionItemMutation = (...options) =>
  useMutation({
    mutationFn: ({ serveId, serveItemId }) => apiDeleteServeItem(serveId, serveItemId),
    onError: (error) => {
      handleError(error)
    },
    ...options,
  })

export const useGetTagsQuery = (options = {}) =>
  useQuery({
    queryKey: ['tags', 'all-tags'],
    queryFn: () => getTagsApi(),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useCreateTagMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ ...data }) => createTagApi(data),
    onError: (error) => {
      handleError(error)
    },
    ...options,
  })

export const useUpdateTagMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => updateTagApi(id, data),
    onError: (error) => {
      handleError(error)
    },
    ...options,
  })

export const useDeleteTagMutation = (options = {}) =>
  useMutation({
    mutationFn: (id) => deleteTagApi(id),
    onError: (error) => {
      handleError(error)
    },
    ...options,
  })

export const useGetIntroductionMethodsQuery = (options = {}) =>
  useQuery({
    queryKey: ['introduction-methods', 'all'],
    queryFn: () => getIntroductionMethodsApi(),
    select: (data) => data?.data ?? data,
    ...options,
  })

export const useGetIntroductionMethodsInfinityQuery = (options = {}) =>
  useInfiniteQuery({
    queryKey: ['introduction-methods', 'infinity'],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => getIntroductionMethodsApi({ ...pageParam }),
    select: ({ pages, pageParams }) => ({
      pages: pages.map(({ data }) => data),
      pageParams,
    }),
    initialPageParam: { page: 1 },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage?.data?.items?.length === 0) return null
      return { page: pages.length + 1 }
    },
    ...options,
  })

export const useCreateIntroductionMethodMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ ...data }) => createIntroductionMethodApi(data),
    onError: (error) => {
      handleError(error)
    },
    ...options,
  })

export const useUpdateIntroductionMethodMutation = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => updateIntroductionMethodApi(id, data),
    onError: (error) => {
      handleError(error)
    },
    ...options,
  })

export const useDeleteIntroductionMethodMutation = (options = {}) =>
  useMutation({
    mutationFn: (id) => deleteIntroductionMethodApi(id),
    onError: (error) => {
      handleError(error)
    },
    ...options,
  })
