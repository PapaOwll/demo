<template>
  <div class="jaw-bone-chart">
    <div class="jaw-bone-grid">
      <div
        v-for="region in regions"
        :key="region.id"
        :class="['region-item', { selected: isRegionSelected(region.id), disabled }]"
        @click="handleRegionClick(region.id)"
      >
        <Typography
          variant="body"
          size="3"
          :weight="isRegionSelected(region.id) ? 'bold' : 'medium'"
        >
          {{ region.label }}
        </Typography>
      </div>
    </div>

    <div v-if="selectedRegions.length > 0" class="selection-info">
      <Typography variant="caption" color="grey">
        نواحی انتخاب شده: {{ selectedRegions.length }}
      </Typography>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Typography from '@/base/Typography'
import { POSITION_LABELS } from '@/modules/TreatmentPlan/constants/teeth'

const props = defineProps({
  selectedRegions: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-region'])

const regions = computed(() =>
  Object.entries(POSITION_LABELS).map(([id, label]) => ({ id, label }))
)

const isRegionSelected = (regionId) => {
  return props.selectedRegions.some((r) => r.id === regionId || r === regionId)
}

const handleRegionClick = (regionId) => {
  if (!props.disabled) {
    emit('toggle-region', regionId)
  }
}
</script>

<style lang="scss" scoped>
.jaw-bone-chart {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.jaw-bone-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-lg;
  direction: rtl;
}

.region-item {
  position: relative;
  min-height: 80px;
  padding: $spacing-lg;
  border: 2px solid $grey-4;
  border-radius: $radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: white;
  text-align: center;

  &:hover:not(.disabled) {
    border-color: $light-blue-filled;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &.selected {
    border-color: $light-blue-filled;
    background-color: rgba($light-blue, 0.1);
    color: $light-blue-filled;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.selection-info {
  text-align: center;
  padding: $spacing-sm;
  background-color: $grey-1;
  border-radius: $radius-sm;
}
</style>
