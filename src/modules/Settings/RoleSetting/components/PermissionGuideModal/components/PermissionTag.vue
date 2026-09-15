<template>
  <QChip :style="chipProps" :class="chipProps.bg" clickable class="permission-tag">
    <template #default>
      <div class="row items-center no-wrap gap-xs">
        <QIcon :name="icon" size="16px" />
        <span class="text-body3">{{ permissionLabel }}</span>
        <QTooltip
          v-if="showTooltip"
          class="text-weight-bold text-subtitle2 text-white bg-black"
          anchor="top middle"
          self="bottom middle"
        >
          {{ tooltipTitle }}
          <div v-if="tooltipSubtitle" class="text-white q-mt-xs">
            {{ tooltipSubtitle }}
          </div>
        </QTooltip>
      </div>
    </template>
  </QChip>
</template>

<script setup>
import { computed } from 'vue'
import { COMPLEXITY_COLORS, COMPLEXITY_LEVELS } from '../constants/permission-categories'
import { getPermissionLabel, getPermissionLabelWithCode } from '@/utils/permission-labels'

const props = defineProps({
  permission: {
    type: Object,
    required: true,
  },
  complexity: {
    type: String,
    default: COMPLEXITY_LEVELS.SIMPLE,
  },
  showTooltip: {
    type: Boolean,
    default: true,
  },
})

const complexityConfig = computed(() => {
  return COMPLEXITY_COLORS[props.complexity] || COMPLEXITY_COLORS[COMPLEXITY_LEVELS.SIMPLE]
})

const color = computed(() => {
  return complexityConfig.value.text.replace('text-', '')
})

const icon = computed(() => {
  if (props.complexity === COMPLEXITY_LEVELS.COMPLEX) {
    return 'warning'
  }
  if (props.complexity === COMPLEXITY_LEVELS.MEDIUM) {
    return 'error'
  }
  return 'check_circle'
})

const chipProps = computed(() => {
  return {
    color: color.value,
    bg: complexityConfig.value.bg,
  }
})

const permissionLabel = computed(() => {
  return getPermissionLabel(props.permission)
})

const tooltipTitle = computed(() => {
  return getPermissionLabelWithCode(props.permission)
})

const tooltipSubtitle = computed(() => {
  if (props.complexity === COMPLEXITY_LEVELS.COMPLEX) {
    return 'پیچیده: چندین شرط AND/OR'
  }
  if (props.complexity === COMPLEXITY_LEVELS.MEDIUM) {
    return 'متوسط: شرط OR'
  }
  return 'ساده: یک دسترسی'
})
</script>

<style lang="scss" scoped>
.permission-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
