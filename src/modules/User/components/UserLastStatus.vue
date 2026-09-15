<template>
  <div class="row">
    <QChip class="status-chip" :color="statusColor?.color" :text-color="statusColor?.text">
      {{ lastStatus?.title || 'بدون وضعیت' }}
    </QChip>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { findStatusObject } from '@/utils/find-user-status'
import { useGetUserStatusQuery } from '@/modules/User/query'

const props = defineProps({
  userLastStatus: { type: Object, default: () => {} },
})
const { data: userStatus } = useGetUserStatusQuery()
const userStatusList = computed(() => userStatus.value)
const lastStatus = computed(() => findStatusObject(props.userLastStatus?.id, userStatusList.value))
const statusColor = computed(() => {
  return {
    color:
      lastStatus.value?.color === 'success'
        ? 'green-1'
        : lastStatus.value?.color === 'danger'
          ? 'red-1'
          : '$dark-light',
    text:
      lastStatus.value?.color === 'success'
        ? 'green-6'
        : lastStatus.value?.color === 'danger'
          ? 'red-6'
          : '$dark-text',
  }
})
</script>
<style scoped lang="scss">
.status-chip {
  width: fit-content;
  padding: 0.5rem 1rem;
  border-radius: $radius-2xl;
}
</style>
