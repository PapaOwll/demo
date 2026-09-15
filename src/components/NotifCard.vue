<template>
  <div class="app-notify" :class="`app-notify--${type}`">
    <div class="app-notify__main">
      <div class="app-notify__icon">
        <component :is="resolvedIcon" :size="24" />
      </div>

      <div class="app-notify__content">
        <div v-if="title" class="app-notify__header">
          <span class="app-notify__title">{{ title }}</span>
          <Button
            variant="flat"
            color="grey"
            size="sm"
            is-icon-only
            :left-icon="IconX"
            aria-label="بستن"
            @click="emit('close')"
          />
        </div>

        <div class="app-notify__body">{{ message }}</div>

        <div v-if="caption" class="app-notify__caption">{{ caption }}</div>

        <div v-if="actions.length > 0" class="app-notify__actions">
          <Button
            v-for="(action, index) in actions"
            :key="index"
            :variant="action.variant || 'filled'"
            :color="action.color || 'primary'"
            size="sm"
            :text="action.label"
            @click="emit('action', action)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  IconCheck,
  IconAlertCircle,
  IconAlertTriangle,
  IconRosette,
  IconX,
} from '@tabler/icons-vue'
import Button from '@/base/Button'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (val) => ['success', 'error', 'warning', 'info'].includes(val),
  },
  title: {
    type: [String, null],
    default: null,
  },
  message: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
    default: '',
  },
  actions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'action'])

const TYPE_ICON_MAP = Object.freeze({
  success: IconCheck,
  error: IconAlertCircle,
  warning: IconAlertTriangle,
  info: IconRosette,
})

const resolvedIcon = computed(() => TYPE_ICON_MAP[props.type] || TYPE_ICON_MAP.info)
</script>

<style lang="scss" scoped>
.app-notify {
  min-width: 400px;
  max-width: 480px;
  height: fit-content;
  max-height: 150px;
  padding: $spacing-lg $spacing-md;
  border-radius: $radius-md;
  border-width: 1.5px;
  border-style: solid;
  box-shadow: 0 $spacing-xs $spacing-lg transparent;

  &__main {
    display: flex;
    align-items: flex-start;
    gap: $spacing-sm;
    width: 100%;
  }

  &__icon {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: $spacing-2xl;
    height: $spacing-2xl;
  }

  &__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  &__header {
    width: 100%;
    font-weight: 700;
    font-size: 14px;
    line-height: 1.5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-xs;
  }

  &__title {
    flex: 1;
    min-width: 0;
  }

  &__body {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.6;
    margin-top: $spacing-xxs;
    display: flex;
    justify-content: space-between;
  }

  &__caption {
    font-size: 12px;
    font-weight: 400;
    line-height: 1.5;
    margin-top: $spacing-xxs;
    color: $body;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $spacing-xs;
    margin-top: $spacing-sm;
  }

  &--success {
    background-color: $green-1;
    border-color: $green-8;

    .app-notify__icon {
      color: $green-8;
    }

    .app-notify__header {
      color: $green-8;
    }

    .app-notify__body {
      color: $dark;
    }
  }

  &--error {
    background-color: $red-1;
    border-color: $red-8;

    .app-notify__icon {
      color: $red-8;
    }

    .app-notify__header {
      color: $red-8;
    }

    .app-notify__body {
      color: $dark;
    }
  }

  &--warning {
    background-color: $amber-1;
    border-color: $amber-8;

    .app-notify__icon {
      color: $amber-9;
    }

    .app-notify__header {
      color: $amber-9;
    }

    .app-notify__body {
      color: $dark;
    }
  }

  &--info {
    background-color: $blue-1;
    border-color: $blue-8;

    .app-notify__icon {
      color: $blue-8;
    }

    .app-notify__header {
      color: $blue-8;
    }

    .app-notify__body {
      color: $dark;
    }
  }
}
</style>
