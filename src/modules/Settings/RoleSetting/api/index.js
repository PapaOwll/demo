import { request } from '@/data/services'

export const getAllRoles = () => request.get('acl/roles')

export const getACLStructure = () => request.get('acl/structure')

export const getRoleACL = (roleId) => request.get(`acl/role/${roleId}`)

export const updateRoleACL = (roleId, data) => {
  const formattedData = {
    modules: data.modules.map((module) => {
      const permissions = []

      if (module.permissions) {
        Object.entries(module.permissions).forEach(([permissionKey, accessLevel]) => {
          const permissionId = data.availablePermissions?.find((p) => p.key === permissionKey)?.id
          if (permissionId && accessLevel !== null) {
            permissions.push({
              permission_id: permissionId,
              access: accessLevel,
            })
          }
        })
      }

      return {
        module_id: module.id,
        has_access: module.has_access || false,
        hidden: module.hidden || false,
        permissions,
      }
    }),
  }

  return request.put(`acl/role/${roleId}`, formattedData)
}

export const createRole = (data) => request.post('acl/role', data)
