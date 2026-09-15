<template>
  <div class="acl-table-container">
    <QTable
      :rows="formattedModules"
      :columns="columns"
      row-key="id"
      flat
      bordered
      :loading="loading"
      :rows-per-page-options="[0]"
      hide-pagination
      :no-data-label="null"
      class="quasar-table"
    >
      <template #header="headerProps">
        <QTr :props="headerProps">
          <QTh
            v-for="col in headerProps.cols"
            :key="col.name"
            :props="headerProps"
            class="text-center bg-grey-2"
          >
            {{ col.label }}
          </QTh>
        </QTr>
      </template>

      <template #body="bodyProps">
        <QTr :props="bodyProps">
          <QTd key="module" :props="bodyProps" class="module-name-cell">
            <div>
              {{ bodyProps.row.title }}
            </div>
          </QTd>

          <QTd key="hidden" :props="bodyProps" class="text-center">
            <QCheckbox
              v-model="bodyProps.row.hidden"
              :disable="!bodyProps.row.has_access || disabled"
              @update:model-value="updateModule(bodyProps.row)"
            />
          </QTd>

          <QTd key="has_access" :props="bodyProps" class="text-center">
            <QCheckbox
              v-model="bodyProps.row.has_access"
              :disable="disabled"
              @update:model-value="toggleAccess(bodyProps.row)"
            />
          </QTd>

          <QTd
            v-for="permission in props.permissions"
            :key="permission.key"
            :props="bodyProps"
            class="text-center permission-cell"
          >
            <QSelect
              v-model="bodyProps.row.permissions[permission.key]"
              :options="accessOptions"
              :disable="!bodyProps.row.has_access || disabled"
              emit-value
              map-options
              dense
              outlined
              @update:model-value="updateModule(bodyProps.row)"
            />
          </QTd>
        </QTr>
      </template>
    </QTable>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  modules: {
    type: Array,
    required: true,
  },
  permissions: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modules'])

const accessOptions = [
  { label: '-', value: null },
  { label: 'همه', value: 'all' },
  { label: 'خودی', value: 'owner' },
  { label: 'شعبه', value: 'branch' },
]

const columns = computed(() => {
  const cols = [
    {
      name: 'module',
      label: 'ماژول',
      align: 'left',
      field: 'title',
      sortable: false,
    },
    {
      name: 'hidden',
      label: 'مخفی',
      align: 'center',
      field: 'hidden',
      sortable: false,
    },
    {
      name: 'has_access',
      label: 'دسترسی',
      align: 'center',
      field: 'has_access',
      sortable: false,
    },
  ]

  if (props.permissions && Array.isArray(props.permissions)) {
    props.permissions.forEach((permission) => {
      cols.push({
        name: permission.key,
        label: permission.title,
        align: 'center',
        sortable: false,
      })
    })
  }

  return cols
})

const formattedModules = computed(() => {
  const result = []
  const moduleMap = {}

  props.modules.forEach((module) => {
    moduleMap[module.id] = module
  })

  const processModule = (module, indent = 0) => {
    result.push({
      ...module,
      indent: indent * 20,
    })

    const children = props.modules.filter((m) => m.parent_id === module.id)
    children.forEach((child) => processModule(child, indent + 1))
  }

  props.modules.filter((m) => !m.parent_id).forEach((module) => processModule(module))

  return result
})

const updateModule = (updatedModule) => {
  const newModules = props.modules.map((module) =>
    module.id === updatedModule.id ? updatedModule : module
  )

  emit('update:modules', newModules)
}

const toggleAccess = (moduleToUpdate) => {
  const updatedModule = { ...moduleToUpdate }
  if (!updatedModule.has_access) {
    updatedModule.hidden = false

    if (updatedModule.permissions) {
      const newPermissions = { ...updatedModule.permissions }
      Object.keys(newPermissions).forEach((key) => {
        newPermissions[key] = null
      })
      updatedModule.permissions = newPermissions
    }
  }

  updateModule(updatedModule)
}

watch(
  () => props.modules,
  (newModules) => {
    const modulesWithPermissions = newModules.map((module) => {
      if (!module.permissions) {
        const permissions = {}
        props.permissions.forEach((p) => {
          permissions[p.key] = null
        })
        return { ...module, permissions }
      }
      return module
    })
    if (JSON.stringify(modulesWithPermissions) !== JSON.stringify(newModules)) {
      emit('update:modules', modulesWithPermissions)
    }
  },
  { immediate: true, deep: true }
)
</script>

<style lang="scss" scoped>
.acl-table-container {
  width: 100%;

  .acl-table {
    .module-name-cell {
      min-width: 200px;
      font-weight: 500;
    }

    .permission-cell {
      min-width: 120px;

      ::v-deep(.q-field__control) {
        height: 32px;
      }
    }
  }
}
</style>
