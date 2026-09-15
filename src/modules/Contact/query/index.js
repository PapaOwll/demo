import { computed } from 'vue'
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/vue-query'
import {
  apiGetContactsTotalCount,
  apiGetContacts,
  apiGetContact,
  apiDeleteContact,
  apiUpdateContact,
  apiCreateContact,
  apiGetContactTypes,
  contactResults,
  apiGetAudioFile,
} from '../api'
import { handleError } from '@/utils/error-handler'

export const useContactInfinityQuery = (filters, options = {}) =>
  useInfiniteQuery({
    queryKey: ['contact', 'all-contacts', filters],
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) => apiGetContacts({ ...filters.value, ...pageParam }),
    select: ({ pages, pageParams }) => ({
      pages,
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
export const useApiGetContactType = () =>
  useQuery({
    queryKey: ['contact-type'],
    queryFn: () => apiGetContactTypes(),
    select: (data) => data?.data ?? data,
  })
export const useApiCreateContact = (options = {}) =>
  useMutation({
    mutationFn: (data) => apiCreateContact(data),
    onError: (err) => handleError(err),
    ...options,
  })
export const useApiUpdateContact = (options = {}) =>
  useMutation({
    mutationFn: ({ id, ...data }) => apiUpdateContact(id, data),
    onError: (err) => handleError(err),
    ...options,
  })
export const useApiDeleteContact = (options = {}) =>
  useMutation({
    mutationFn: (id) => apiDeleteContact(id),
    onError: (err) => handleError(err),
    ...options,
  })
export const useGetContactsTotalCountMutation = (options = {}) =>
  useMutation({
    mutationFn: (filters) => apiGetContactsTotalCount(filters.value),
    onError: (err) => handleError(err),
    ...options,
  })
export const useGetContactResults = (options = {}) =>
  useQuery({
    queryKey: ['contact', 'results'],
    queryFn: () => contactResults(),
    select: (data) => data?.data ?? data,
    ...options,
  })
export const useGetAudioMutation = (options = {}) =>
  useMutation({
    mutationFn: (file) => apiGetAudioFile(file),
    onError: (err) => handleError(err),
    ...options,
  })

export const useContactQuery = (contactId, placeholder, options = {}) =>
  useQuery({
    queryKey: ['contact', 'detail', contactId],
    queryFn: () => apiGetContact(contactId.value),
    select: (data) => data?.data ?? data,
    enabled: computed(() => !!contactId.value),
    placeholderData: () => placeholder?.value ?? undefined,
    ...options,
  })
