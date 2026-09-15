<template>
  <div class="tag-list">
    <span
      v-for="item in selectedItems"
      :key="item[itemValue]"
      :class="['tag-list__chip', `tag-list__chip--${color}`]"
    >
      {{ item[itemLabel] }}
      <IconX :size="12" class="tag-list__chip-remove" @click.stop="toggle(item[itemValue])" />
    </span>
    <QBtn class="tag-list__add" flat dense unelevated padding="none">
      <IconPlus :size="16" />
      <QMenu>
        <QList style="min-width: 200px">
          <QItem
            v-for="option in options"
            :key="option[itemValue]"
            clickable
            @click="toggle(option[itemValue])"
          >
            <QItemSection side>
              <QCheckbox
                :model-value="isSelected(option[itemValue])"
                @update:model-value="() => toggle(option[itemValue])"
              />
            </QItemSection>
            <QItemSection>
              <QItemLabel>{{ option[itemLabel] }}</QItemLabel>
            </QItemSection>
          </QItem>
          <div v-if="options.length === 0" class="tag-list__empty">
            <QItem>
              <QItemSection>
                <QItemLabel caption>موردی یافت نشد</QItemLabel>
              </QItemSection>
            </QItem>
          </div>
        </QList>
      </QMenu>
    </QBtn>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { QBtn, QMenu, QList, QItem, QItemSection, QItemLabel, QCheckbox } from 'quasar'
import { IconPlus, IconX } from '@tabler/icons-vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] },
  itemLabel: { type: String, default: 'label' },
  itemValue: { type: String, default: 'value' },
  color: {
    type: String,
    default: 'blue',
    validator: (v) => ['blue', 'green', 'red', 'amber', 'grey'].includes(v),
  },
})

const emit = defineEmits(['update:modelValue'])

const selectedItems = computed(() =>
  props.options.filter((opt) => props.modelValue.includes(opt[props.itemValue]))
)

const isSelected = (val) => props.modelValue.includes(val)

const toggle = (val) => {
  const current = [...props.modelValue]
  const idx = current.indexOf(val)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(val)
  }
  emit('update:modelValue', current)
}
</script>

<style scoped lang="scss">
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;

  &__chip {
    display: flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    gap: 4px;

    &--blue {
      background: rgba(0, 85, 255, 0.08);
      color: #0055ff;
    }

    &--green {
      background: rgba(46, 125, 50, 0.08);
      color: #2e7d32;
    }

    &--red {
      background: rgba(229, 57, 53, 0.08);
      color: #e53935;
    }

    &--amber {
      background: rgba(255, 152, 0, 0.08);
      color: #e65100;
    }

    &--grey {
      background: rgba(0, 0, 0, 0.05);
      color: #616161;
    }
  }

  &__chip-remove {
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s;
    flex-shrink: 0;
  }

  &__chip:hover &__chip-remove {
    opacity: 0.7;

    &:hover {
      opacity: 1;
    }
  }

  &__add {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid #e0e0e0;
    border-radius: 8px;
    background: #fff;
    color: #616161;
    flex-shrink: 0;
    min-height: unset;

    :deep(.q-btn__content) {
      margin: 0;
    }

    &::before {
      box-shadow: none;
    }
  }

  &__empty {
    padding: 8px 0;
  }
}
</style>
