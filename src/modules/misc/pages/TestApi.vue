<template>
  <div class="test-api">
    <div class="test-api__header">
      <QBtn
        :disable="loading"
        :loading="loading"
        color="primary"
        @click="handleCalculateApiDetails"
      >
        New Record
      </QBtn>
    </div>

    <QTable
      :rows="tableData"
      :columns="columns"
      :loading="loading"
      class="quasar-table test-api__table"
      :no-data-label="null"
      flat
      bordered
    />

    <div class="test-api__info">
      <p class="test-api__info-text">
        For more details see
        <a
          target="_blank"
          href="https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Resource_timing"
          class="test-api__link"
        >
          MDN Documentation
        </a>
      </p>
      <div class="test-api__diagram">
        <img
          src="https://mdn.github.io/shared-assets/images/diagrams/api/performance/timestamp-diagram.svg"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'

const API_URL = 'https://panel.seritaclinic.ir/api/v1/health/check'

const data = ref([])
const loading = ref(false)

const columns = [
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    align: 'left',
    sortable: true,
  },
  {
    name: 'redirect',
    label: 'Redirect (ms)',
    field: 'redirect',
    align: 'center',
    sortable: true,
    format: (val) => val?.toFixed(2) || '0',
  },
  {
    name: 'dns',
    label: 'DNS (ms)',
    field: 'dns',
    align: 'center',
    sortable: true,
    format: (val) => val?.toFixed(2) || '0',
  },
  {
    name: 'tls',
    label: 'TLS (ms)',
    field: 'tls',
    align: 'center',
    sortable: true,
    format: (val) => val?.toFixed(2) || '0',
  },
  {
    name: 'tcp',
    label: 'TCP (ms)',
    field: 'tcp',
    align: 'center',
    sortable: true,
    format: (val) => val?.toFixed(2) || '0',
  },
  {
    name: 'request',
    label: 'Request (ms)',
    field: 'request',
    align: 'center',
    sortable: true,
    format: (val) => val?.toFixed(2) || '0',
  },
  {
    name: 'response',
    label: 'Response (ms)',
    field: 'response',
    align: 'center',
    sortable: true,
    format: (val) => val?.toFixed(2) || '0',
  },
  {
    name: 'duration',
    label: 'Duration (ms)',
    field: 'duration',
    align: 'center',
    sortable: true,
    format: (val) => val?.toFixed(2) || '0',
  },
  {
    name: 'total',
    label: 'Total (ms)',
    field: 'total',
    align: 'center',
    sortable: true,
    format: (val) => `${val} ms`,
  },
]

const tableData = computed(() => {
  return data.value.map((item, index) => ({ ...item, id: index }))
})

const calculateLoadTimes = (url, metrics) => {
  if (typeof performance === 'undefined') {
    return metrics
  }

  const resources = performance.getEntriesByType('resource')
  if (!resources || resources.length === 0) {
    return metrics
  }

  const resource = resources.find((res) => res.name === url)
  if (!resource) {
    return metrics
  }

  return {
    ...metrics,
    redirect: resource.redirectStart > 0 ? resource.redirectEnd - resource.redirectStart : 0,
    dns: resource.domainLookupStart > 0 ? resource.domainLookupEnd - resource.domainLookupStart : 0,
    tcp: resource.connectStart > 0 ? resource.connectEnd - resource.connectStart : 0,
    tls:
      resource.secureConnectionStart > 0 ? resource.connectEnd - resource.secureConnectionStart : 0,
    response: resource.responseStart > 0 ? resource.responseEnd - resource.responseStart : 0,
    request: resource.requestStart > 0 ? resource.responseStart - resource.requestStart : 0,
    duration: resource.duration || 0,
  }
}

const handleCalculateApiDetails = async () => {
  if (loading.value) return

  loading.value = true
  const startTime = Date.now()

  let metrics = {
    status: 'pending',
    statusCode: null,
    error: null,
  }

  try {
    const response = await axios.get(API_URL)
    metrics = {
      ...metrics,
      status: 'success',
      statusCode: response.status,
    }
  } catch (error) {
    metrics = {
      ...metrics,
      status: 'failed',
      error: error?.message || 'Unknown error',
      statusCode: error?.response?.status || 500,
    }
  } finally {
    const totalTime = Date.now() - startTime
    const finalMetrics = calculateLoadTimes(API_URL, {
      ...metrics,
      total: totalTime,
    })

    data.value = [finalMetrics, ...data.value]
    loading.value = false
  }
}

onMounted(() => {
  handleCalculateApiDetails()
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/colors';

.test-api {
  direction: ltr;

  &__header {
    margin-bottom: 1.5rem;
  }

  &__table {
    margin-bottom: 2rem;

    :deep(.q-table) {
      border-radius: 8px;
    }

    :deep(.q-table__top) {
      padding: 12px;
    }

    :deep(.q-table tbody td) {
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
    }
  }

  &__info {
    margin-bottom: 1rem;
  }

  &__info-text {
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: $grey-7;
  }

  &__link {
    color: $primary;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__diagram {
    border: 1px solid $grey-4;
    border-radius: 8px;
    padding: 1rem;
    background-color: $grey-1;
  }

  &__diagram-image {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
  }
}
</style>
