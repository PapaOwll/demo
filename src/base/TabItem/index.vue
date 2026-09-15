<template>
  <QTabs
    v-bind="$attrs"
    :model-value="modelValue"
    :vertical="orientation === 'vertical'"
    :class="containerClasses"
    no-caps
    mobile-arrows
    indicator-color="transparent"
    @update:model-value="(val) => $emit('update:modelValue', val)"
  >
    <template v-if="group">
      <QTab
        v-for="item in group"
        :key="itemValue(item)"
        :name="itemValue(item)"
        :class="groupedItemClasses(item)"
        @click="handleGroupClick(item)"
      >
        <div class="tab-content-wrapper">
          <component :is="item.icon" v-if="item.icon" :size="iconSize" />

          <Typography
            v-if="itemDisplayLabel(item)"
            variant="body"
            :size="textSize"
            :weight="isItemSelected(item) ? 'semibold' : 'medium'"
          >
            {{ itemDisplayLabel(item) }}
          </Typography>

          <div v-if="item.badge" class="tab-item__badge">
            <Typography variant="body" size="4" weight="medium">{{ item.badge }}</Typography>
          </div>
        </div>
      </QTab>
    </template>

    <slot v-else />
  </QTabs>
</template>

<script setup>
import { computed } from 'vue'
import Typography from '@/base/Typography'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: undefined,
  },
  value: {
    type: [String, Number, Boolean],
    default: undefined,
  },
  group: {
    type: Array,
    default: undefined,
  },
  labelKey: {
    type: String,
    default: 'label',
  },
  size: { type: String, default: 'md' },
  styleType: { type: String, default: 'default' },
  orientation: { type: String, default: 'horizontal' },
})

const emit = defineEmits(['update:modelValue', 'select'])

const iconSize = computed(() => (props.size === 'sm' ? 20 : 24))
const textSize = computed(() => (props.size === 'sm' ? '4' : '3'))

const itemValue = (item) => item.value ?? item.index

const itemDisplayLabel = (item) => item[props.labelKey] || item.title

const isItemSelected = (item) =>
  props.modelValue !== undefined && props.modelValue === itemValue(item)

const isSelected = computed(() => {
  return props.modelValue !== undefined && props.modelValue === props.value
})

const containerClasses = computed(() => {
  if (props.group) {
    return ['tab-group', `tab-group--${props.orientation}`, `tab-group--${props.styleType}`]
  }
  return [
    'tab-item',
    `tab-item--${props.size}`,
    `tab-item--${props.orientation}`,
    `tab-item--${props.styleType}`,
    { 'tab-item--selected': isSelected.value },
  ]
})

const groupedItemClasses = (item) => {
  return [
    'tab-item',
    'tab-item--grouped',
    `tab-item--${props.size}`,
    `tab-item--${props.orientation}`,
    `tab-item--${props.styleType}`,
    item.class,
    {
      'tab-item--selected': isItemSelected(item),
      'tab-item--icon-only': !itemDisplayLabel(item),
    },
  ]
}

const handleGroupClick = (item) => {
  const newValue = itemValue(item)
  emit('update:modelValue', newValue)
  emit('select', newValue)
}
</script>
<style lang="scss" scoped src="./tabItem.scss" />
