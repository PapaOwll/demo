<template>
  <div class="role-setting-page q-pa-md">
    <QCard flat bordered>
      <QCardSection>
        <div class="text-h5 text-weight-bold q-mb-md">مدیریت سطح دسترسی (ACL)</div>

        <div class="row q-gutter-md q-mb-lg items-start">
          <div class="col-12 col-md-4">
            <QSelect
              v-model="selectedRoleId"
              :options="roleOptions"
              label="انتخاب نقش"
              outlined
              emit-value
              map-options
              option-value="value"
              option-label="label"
              :loading="rolesLoading"
              :disable="isSaving"
            >
              <template #prepend>
                <QIcon name="person" />
              </template>
            </QSelect>
          </div>
          <div class="col-auto">
            <QBtn
              unelevated
              color="primary"
              label="افزودن نقش جدید"
              icon="add"
              :disable="isSaving"
              @click="showCreateDialog = true"
            />
          </div>
        </div>
      </QCardSection>

      <QSeparator />

      <QCardSection v-if="selectedRoleId">
        <div v-if="isLoadingACL" class="q-pa-xl text-center">
          <QSpinnerDots size="50px" color="primary" />
          <div class="q-mt-md">در حال بارگذاری سطوح دسترسی...</div>
        </div>

        <div v-else-if="aclError" class="q-pa-xl text-center text-negative">
          <QIcon name="error" size="50px" />
          <div class="q-mt-md">خطا در بارگذاری اطلاعات</div>
          <QBtn flat color="primary" label="تلاش مجدد" class="q-mt-md" @click="refetchACL" />
        </div>

        <div v-else>
          <div class="q-mb-md row justify-end q-gutter-sm">
            <QBtn
              outline
              color="grey"
              label="راهنمای تنظیم دسترسی"
              icon="menu_book"
              @click="showPermissionGuide = true"
            />
            <QBtn
              outline
              color="grey"
              label="بازنشینی"
              :disable="!hasChanges || isSaving"
              @click="resetChanges"
            />
            <QBtn
              unelevated
              color="primary"
              label="ذخیره تغییرات"
              :loading="isSaving"
              :disable="!hasChanges"
              @click="saveChanges"
            />
          </div>

          <ACLTable
            v-model:modules="currentModules"
            :permissions="availablePermissions"
            :loading="isSaving"
            :disabled="isSaving"
          />

          <div class="q-mt-lg row justify-end q-gutter-sm">
            <QBtn
              outline
              color="grey"
              label="راهنمای تنظیم دسترسی"
              icon="menu_book"
              @click="showPermissionGuide = true"
            />
            <QBtn
              outline
              color="grey"
              label="بازنشانی"
              :disable="!hasChanges || isSaving"
              @click="resetChanges"
            />
            <QBtn
              unelevated
              color="primary"
              label="ذخیره تغییرات"
              :loading="isSaving"
              :disable="!hasChanges"
              @click="saveChanges"
            />
          </div>
        </div>
      </QCardSection>

      <QCardSection v-else class="text-center q-pa-xl">
        <QIcon name="info" size="50px" color="grey-5" />
        <div class="q-mt-md text-grey-7">لطفاً یک نقش را برای مدیریت سطح دسترسی انتخاب کنید</div>
      </QCardSection>
    </QCard>

    <CreateRoleDialog v-model:show="showCreateDialog" :roles="roles" @success="handleRoleCreated" />

    <PermissionGuideModal
      v-model:show="showPermissionGuide"
      :current-modules="currentModules"
      :acl-structure="aclStructure"
      @update:modules="handleUpdateFromGuide"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ACLTable from '../components/ACLTable'
import CreateRoleDialog from '../components/CreateRoleDialog'
import PermissionGuideModal from '../components/PermissionGuideModal/PermissionGuideModal'
import { useGetAllRoles, useGetACLStructure, useGetRoleACL, useUpdateRoleACL } from '../query'
import { aclSchema } from '../schema'
import { Notif, confirmDialog } from '@/data/services/notification-service'

const selectedRoleId = ref(null)
const currentModules = ref([])
const originalModules = ref([])
const availablePermissions = ref([])
const showCreateDialog = ref(false)
const showPermissionGuide = ref(false)

const { data: roles, isLoading: rolesLoading } = useGetAllRoles()
const { data: aclStructure } = useGetACLStructure()

const {
  data: roleACL,
  isLoading: isLoadingACL,
  error: aclError,
  refetch: refetchACL,
} = useGetRoleACL(selectedRoleId)

const updateRoleACLMutation = useUpdateRoleACL()

const roleOptions = computed(() => {
  if (!roles.value || roles.value.length === 0) {
    return []
  }

  return roles.value.map((role) => ({
    label: role.faTitle || role.fa_title || role.title, // Check both faTitle and fa_title
    value: role.id,
  }))
})

const hasChanges = computed(() => {
  return JSON.stringify(currentModules.value) !== JSON.stringify(originalModules.value)
})

const isSaving = computed(() => updateRoleACLMutation.isPending.value)

const processModulesData = (aclData) => {
  if (!aclData || !aclData.modules) {
    return []
  }

  const permissions = aclData.permissions || []
  availablePermissions.value = permissions

  return aclData.modules
    .filter((module) => module.is_active !== false && module.is_public !== false)
    .map((module) => {
      const modulePermissions = {}

      permissions.forEach((permission) => {
        // Check original key and camelCase variant
        const camelCaseKey = permission.key.replace(/-(\w)/g, (_, letter) => letter.toUpperCase())

        const permissionValue =
          module.permissions?.[permission.key] ?? module.permissions?.[camelCaseKey] ?? null

        modulePermissions[permission.key] = permissionValue
      })

      const processedModule = {
        id: module.id,
        key: module.key,
        title: module.title,
        parent_id: module.parent_id || module.parentId, // Handle both parent_id and parentId
        hidden: module.hidden || false,
        has_access: module.has_access || module.hasAccess || false, // Handle both has_access and hasAccess
        permissions: modulePermissions,
      }

      return processedModule
    })
}

watch(roleACL, (newData) => {
  if (newData) {
    const processedModules = processModulesData(newData)
    currentModules.value = structuredClone(processedModules)
    originalModules.value = structuredClone(processedModules)
  }
})

watch(
  () => aclStructure.value,
  (structure) => {
    if (structure && structure.permissions) {
      availablePermissions.value = structure.permissions
    }
  }
)

const resetChanges = () => {
  // eslint-disable-next-line unicorn/prefer-structured-clone
  currentModules.value = JSON.parse(JSON.stringify(originalModules.value))
}

const validateData = async () => {
  try {
    await aclSchema.validate({ modules: currentModules.value })
    return true
  } catch (error) {
    Notif.error(error.message)
    return false
  }
}

const saveChanges = async () => {
  const isValid = await validateData()
  if (!isValid) return

  confirmDialog(
    'تأیید ذخیره',
    'آیا از ذخیره تغییرات سطح دسترسی اطمینان دارید؟',
    async () => {
      try {
        await updateRoleACLMutation.mutateAsync({
          roleId: selectedRoleId.value,
          data: {
            modules: currentModules.value,
            availablePermissions: availablePermissions.value,
          },
        })

        originalModules.value = structuredClone(currentModules.value)

        await refetchACL()
      } catch {
        // Error is handled by mutation
      }
    },
    {
      cancel: {
        label: 'انصراف',
        color: 'grey',
        flat: true,
      },
      ok: {
        label: 'ذخیره',
        color: 'primary',
        unelevated: true,
      },
    }
  )
}

const handleRoleCreated = (newRoleId) => {
  if (newRoleId) {
    selectedRoleId.value = newRoleId
  }
}

const handleUpdateFromGuide = (updatedModules) => {
  currentModules.value = updatedModules
}

// Access check disabled - all authenticated users can access this page
</script>

<style lang="scss" scoped>
.role-setting-page {
  min-height: calc(100vh - 100px);

  .q-card {
    min-height: 600px;
  }
}
</style>
