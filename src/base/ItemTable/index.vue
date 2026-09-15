<template>
  <div
    :class="[
      'item-table',
      `item-table--${type}`,
      `item-table--${variant}`,
      { 'item-table--active': active || (type === 'header' && sortDirection !== null) },
      { 'item-table--no-label': !title },
    ]"
    @click="handleHeaderClick"
  >
    <div v-if="variant === 'swap'" class="item-table__swap-container">
      <div class="item-table__icon-container item-table__icon-container--fixed">
        <component :is="IconArrowsLeftRight" :size="computedIconSize" stroke-width="2" />
      </div>
    </div>

    <div v-else-if="icon" class="item-table__icon-container item-table__icon-container--fixed">
      <component :is="icon" :size="computedIconSize" stroke-width="2" />
    </div>

    <div v-if="title" class="item-table__content">
      <Typography variant="body2" class="item-table__title">
        {{ title }}
      </Typography>
      <Typography
        v-if="description && type === 'cell'"
        variant="caption"
        class="item-table__description"
      >
        {{ description }}
      </Typography>
    </div>

    <div v-if="type === 'header' && sortable" class="item-table__sort-icon">
      <component
        :is="computedSortIcon"
        :size="16"
        stroke-width="2"
        :class="{ 'text-primary': sortDirection }"
      />
    </div>

    <div v-else-if="type === 'cell' && $slots.action" class="item-table__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Typography from '@/base/Typography'
import { IconArrowsLeftRight, IconArrowDown, IconArrowUp } from '@tabler/icons-vue'

const props = defineProps({
  type: { type: String, default: 'cell' }, // 'header' | 'cell'
  variant: { type: String, default: 'text' }, // 'text' | 'swap'
  title: { type: String, required: false, default: undefined },
  description: { type: String, default: '' },
  icon: { type: [Object, Function, String], default: null },
  sortable: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['sort-change'])
const sortDirection = ref(null)

const handleHeaderClick = () => {
  if (props.type !== 'header' || !props.sortable) return

  if (sortDirection.value === null) sortDirection.value = 'desc'
  else if (sortDirection.value === 'desc') sortDirection.value = 'asc'
  else sortDirection.value = null

  emit('sort-change', sortDirection.value)
}

const computedSortIcon = computed(() => {
  if (sortDirection.value === 'asc') return IconArrowUp
  return IconArrowDown // Default sort icon as per design
})

const computedIconSize = computed(() => (props.type === 'header' ? 18 : 20))
</script>
<style lang="scss" scoped>
@import './item-table.scss';
</style>
