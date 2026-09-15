<template>
  <template v-for="item in items" :key="item.id">
    <div class="row q-col-gutter-sm">
      <div
        v-if="item?.price > 0"
        class="col-12 checkbox-item"
        :class="{ checked: isChecked(item.id), disabled }"
        @click="handleToggle(item.id)"
      >
        <Checkbox
          :model-value="isChecked(item.id)"
          :disabled="disabled"
          class="q-mr-md"
          @update:model-value="handleToggle(item.id)"
        />

        <Typography variant="body" size="3" class="item-label">
          {{ props.question?.title }}
        </Typography>

        <Typography
          v-if="item.price && getPerms('treatment-plan', 'mass-update')"
          variant="caption"
          color="grey"
          class="price-label"
        >
          {{ numberSeparator(item.price) }} تومان
        </Typography>
      </div>
    </div>
  </template>
</template>
<script setup>
import { computed } from 'vue'
import Typography from '@/base/Typography'
import Checkbox from '@/base/Checkbox'
import { numberSeparator } from '@/utils/formatter'
import { getPerms } from '@/utils/get-perms'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: null,
  },
  question: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const items = computed(() => props.question?.items || [])

/**
 * Extract ID from modelValue which can be an object or primitive
 * Handles both: {id: "1", ...} (object) and "1" (primitive)
 */
const getModelValueId = () => {
  if (!props.modelValue) return null
  if (typeof props.modelValue === 'object') {
    return props.modelValue.id ?? null
  }
  return props.modelValue
}

/**
 * Check if checkbox should be shown as checked
 * @param {string|number} itemId - The ID of the current item
 * @returns {boolean} Whether this item is checked
 */
const isChecked = (itemId) => {
  const modelValueId = getModelValueId()
  if (modelValueId == null || itemId == null) return false

  // eslint-disable-next-line eqeqeq -- Need loose equality for type coercion (string vs number IDs)
  return modelValueId == itemId
}

const handleToggle = (itemId) => {
  if (!props.disabled) {
    const currentValue = getModelValueId()
    // If current item is selected, deselect (return null); otherwise select it
    // eslint-disable-next-line eqeqeq -- Need loose equality for type coercion (string vs number IDs)
    const newValue = currentValue == itemId ? null : itemId
    emit('update:modelValue', newValue)
  }
}
</script>

<style lang="scss" scoped>
.checkbox-item {
  display: flex;
  align-items: center;
  padding: $spacing-md $spacing-lg;
  border: 1px solid $grey-3;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: white;

  &:hover:not(.disabled) {
    border-color: $primary;
    background-color: $blue-1;
  }

  &.checked {
    border-color: $primary;
    background-color: $blue-1;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.item-label {
  flex: 1;
  font-weight: 500;
}

.price-label {
  margin-right: auto;
}
</style>
