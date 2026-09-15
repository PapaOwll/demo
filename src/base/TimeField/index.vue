<template>
  <div :class="classes">
    <Typography v-if="label && stackLabel" variant="body" size="4" weight="medium" color="dark">
      {{ label }}
    </Typography>
    <TextField
      :model-value="modelValue"
      :variant="variant"
      :placeholder="placeholder"
      :disable="disable"
      :error="error"
      :error-message="errorMessage"
      :label="stackLabel ? undefined : label"
      mask="time"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <template #endSection>
        <QIcon name="access_time" :class="{ 'cursor-pointer': !hidePicker }">
          <QPopupProxy v-if="!hidePicker" cover transition-show="scale" transition-hide="scale">
            <QTime
              :model-value="modelValue"
              format24h
              :mask="mask"
              @update:model-value="$emit('update:modelValue', $event)"
            >
              <div class="row items-center justify-end">
                <QBtn v-close-popup label="تایید" color="primary" flat />
              </div>
            </QTime>
          </QPopupProxy>
        </QIcon>
      </template>
    </TextField>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { QTime, QIcon, QBtn, QPopupProxy } from 'quasar'
import Typography from '@/base/Typography'
import TextField from '@/base/TextField'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: 'outline',
  },
  placeholder: {
    type: String,
    default: '00:00',
  },
  mask: {
    type: String,
    default: 'HH:mm',
  },
  disable: Boolean,
  error: {
    type: [Boolean, String],
    default: undefined,
  },
  errorMessage: {
    type: String,
    default: undefined,
  },
  stackLabel: {
    type: Boolean,
    default: false,
  },
  hidePicker: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])

const classes = computed(() => [
  'timefield',
  {
    'timefield--disabled': props.disable,
    'timefield--stacked': props.stackLabel,
  },
])
</script>

<style lang="scss" scoped>
.timefield {
  display: flex;
  align-items: center;
  gap: 4px;

  &--stacked {
    flex-direction: column;
    align-items: stretch;
  }

  &--disabled {
    opacity: 0.6;
  }

  &__input {
    flex: 1;
  }
}
</style>
