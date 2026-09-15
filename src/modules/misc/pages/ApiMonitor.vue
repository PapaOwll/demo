<template>
  <div class="api-monitor">
    <div class="api-monitor__header">
      <div class="api-monitor__controls">
        <QBtn
          :color="isMonitoring ? 'negative' : 'primary'"
          :icon="isMonitoring ? 'stop' : 'play_arrow'"
          :label="isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'"
          @click="toggleMonitoring"
        />
        <QBtn
          color="secondary"
          icon="delete"
          label="Clear"
          :disable="apiCalls.length === 0"
          @click="handleClear"
        />
        <QBtn
          color="accent"
          icon="refresh"
          label="Retry Failed"
          :disable="failedCalls.length === 0"
          :loading="retrying"
          @click="retryFailedCalls"
        />
      </div>

      <div class="api-monitor__stats">
        <QChip color="primary" text-color="white" icon="cloud_download">
          Total: {{ formatBytes(totalSize) }}
        </QChip>
        <QChip color="secondary" text-color="white" icon="api">Calls: {{ apiCalls.length }}</QChip>
        <QChip v-if="failedCalls.length > 0" color="negative" text-color="white" icon="error">
          Failed: {{ failedCalls.length }}
        </QChip>
      </div>
    </div>

    <QTable
      :rows="sortedApiCalls"
      :columns="columns"
      row-key="id"
      class="api-monitor__table"
      flat
      bordered
      :pagination="{ rowsPerPage: 20 }"
      :no-data-label="
        isMonitoring ? 'Waiting for API calls...' : 'Start monitoring to capture API calls'
      "
    >
      <template #body-cell-status="props">
        <QTd :props="props">
          <QBadge
            :color="props.row.success ? 'positive' : 'negative'"
            :label="props.row.status || 'Error'"
          />
        </QTd>
      </template>

      <template #body-cell-method="props">
        <QTd :props="props">
          <QBadge :color="getMethodColor(props.row.method)" :label="props.row.method" />
        </QTd>
      </template>

      <template #body-cell-size="props">
        <QTd :props="props">
          <span :class="getSizeClass(props.row.size)">
            {{ formatBytes(props.row.size) }}
          </span>
        </QTd>
      </template>

      <template #body-cell-actions="props">
        <QTd :props="props">
          <QBtn
            v-if="!props.row.success"
            flat
            dense
            round
            color="primary"
            icon="refresh"
            @click="retryCall(props.row)"
          >
            <QTooltip>Retry this call</QTooltip>
          </QBtn>
        </QTd>
      </template>
    </QTable>
  </div>
</template>

<script setup>
import { computed, ref, onUnmounted, onMounted } from 'vue'
import { apiMonitor } from '@/data/services/instance'
import { formatBytes } from '@/composables/use-api-monitor'
import { request } from '@/data/services'

const apiCalls = ref([])
const isMonitoring = ref(false)
const retrying = ref(false)
let pollInterval = null

const columns = [
  {
    name: 'method',
    label: 'Method',
    field: 'method',
    align: 'center',
    sortable: true,
  },
  {
    name: 'endpoint',
    label: 'Endpoint',
    field: 'endpoint',
    align: 'left',
    sortable: true,
  },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    align: 'center',
    sortable: true,
  },
  {
    name: 'size',
    label: 'Size',
    field: 'size',
    align: 'center',
    sortable: true,
    sort: (a, b) => b - a,
  },
  {
    name: 'duration',
    label: 'Duration (ms)',
    field: 'duration',
    align: 'center',
    sortable: true,
    format: (val) => `${val?.toFixed(0) || 0} ms`,
  },
  {
    name: 'callCount',
    label: 'Calls',
    field: 'callCount',
    align: 'center',
    sortable: true,
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'center',
  },
]

const sortedApiCalls = computed(() => {
  return [...apiCalls.value].sort((a, b) => b.size - a.size)
})

const totalSize = computed(() => {
  return apiCalls.value.reduce((acc, call) => acc + call.size, 0)
})

const failedCalls = computed(() => {
  return apiCalls.value.filter((call) => !call.success)
})

const refreshCalls = () => {
  apiCalls.value = [...apiMonitor.getCalls()]
  isMonitoring.value = apiMonitor.isMonitoring()
}

const toggleMonitoring = () => {
  if (isMonitoring.value) {
    apiMonitor.stopMonitoring()
    isMonitoring.value = false
  } else {
    apiMonitor.startMonitoring()
    isMonitoring.value = true
  }
}

const handleClear = () => {
  apiMonitor.clearCalls()
  apiCalls.value = []
}

const getMethodColor = (method) => {
  const colors = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    PATCH: 'purple',
    DELETE: 'red',
  }
  return colors[method] || 'grey'
}

const getSizeClass = (size) => {
  if (size > 1024 * 1024) return 'api-monitor__size--large'
  if (size > 100 * 1024) return 'api-monitor__size--medium'
  return 'api-monitor__size--small'
}

const retryCall = async (call) => {
  try {
    const method = call.method.toLowerCase()
    await request[method](call.endpoint)
  } catch {
    // Error is tracked by the interceptor
  }
}

const retryFailedCalls = async () => {
  retrying.value = true
  const failed = [...failedCalls.value]

  await Promise.all(failed.map((call) => retryCall(call)))

  retrying.value = false
}

const handleBeforeUnload = () => {
  // Auto-stop monitoring when browser tab/window is closed
  apiMonitor.stopMonitoring()
}

onMounted(() => {
  refreshCalls()
  pollInterval = setInterval(refreshCalls, 500)

  // Listen for tab/window close
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }

  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style lang="scss" scoped>
.api-monitor {
  direction: ltr;
  padding: 1rem;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  &__controls {
    display: flex;
    gap: 0.5rem;
  }

  &__stats {
    display: flex;
    gap: 0.5rem;
  }

  &__table {
    :deep(.q-table) {
      border-radius: 8px;
    }

    :deep(.q-table tbody td) {
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
    }
  }

  &__size {
    &--small {
      color: $positive;
    }

    &--medium {
      color: $warning;
    }

    &--large {
      color: $negative;
      font-weight: bold;
    }
  }
}
</style>
