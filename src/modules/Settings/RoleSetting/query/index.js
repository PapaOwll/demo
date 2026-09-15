import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { toValue } from 'vue'
import { getAllRoles, getACLStructure, getRoleACL, updateRoleACL, createRole } from '../api'
import { Notif } from '@/data/services/notification-service'
import { handleError } from '@/utils/error-handler'

export const useGetAllRoles = () =>
  useQuery({
    queryKey: ['acl-roles'],
    queryFn: getAllRoles,
    select: (data) => data?.data || [],
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true, // Override the global setting
    enabled: true, // Ensure it's enabled
  })

export const useGetACLStructure = () =>
  useQuery({
    queryKey: ['acl-structure'],
    queryFn: getACLStructure,
    select: (data) => data?.data || { modules: [], permissions: [] }, // Fixed: data?.data instead of data?.data?.data
    staleTime: 10 * 60 * 1000,
    refetchOnMount: true,
    enabled: true,
  })

export const useGetRoleACL = (roleId) =>
  useQuery({
    queryKey: () => ['role-acl', toValue(roleId)],
    queryFn: () => {
      const id = toValue(roleId)
      if (!id) throw new Error('No role ID provided')
      return getRoleACL(id)
    },
    select: (data) => data?.data || null,
    enabled: () => !!toValue(roleId),
    staleTime: 2 * 60 * 1000,
  })

export const useUpdateRoleACL = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, data }) => updateRoleACL(roleId, data),
    onSuccess: (response, { roleId }) => {
      Notif.success('سطح دسترسی با موفقیت بروزرسانی شد')
      queryClient.invalidateQueries({ queryKey: ['role-acl', roleId] })
    },
    onError: (error) => {
      Notif.error(error?.response?.data?.message || 'خطا در بروزرسانی سطح دسترسی')
    },
  })
}

export const useCreateRole = (options = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['acl', 'role', 'create'],
    mutationFn: (data) => createRole(data),
    onSuccess: (response) => {
      const isPartialSuccess = response?.data?.success === false

      if (isPartialSuccess) {
        Notif.warning(response?.data?.message || 'نقش ایجاد شد اما کپی دسترسی‌ها با خطا مواجه شد', {
          caption: 'می‌توانید دسترسی‌ها را به صورت دستی تنظیم کنید',
          timeout: 5000,
        })
      } else {
        Notif.success('نقش جدید با موفقیت ایجاد شد')
      }

      queryClient.invalidateQueries({ queryKey: ['acl-roles'] })
    },
    onError: (error) => {
      handleError(error)
    },
    ...options,
  })
}
