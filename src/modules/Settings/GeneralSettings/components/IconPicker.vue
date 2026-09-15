<template>
  <div class="icon-picker">
    <TextField
      :model-value="modelValue"
      label="نام آیکون"
      placeholder="مثال: brand-instagram"
      variant="outline"
      clearable
      :hint="hint"
      :error="!!errorMessage"
      :error-message="errorMessage"
      @update:model-value="onUpdateModelValue"
    >
      <template #startSection>
        <div class="icon-picker__preview">
          <component
            :is="resolvedIcon"
            v-if="resolvedIcon"
            :size="'20px'"
            class="icon-picker__icon"
          />
          <IconQuestionMark v-else :size="'20px'" class="text-grey-5" />
        </div>
      </template>
    </TextField>

    <div v-if="modelValue && !resolvedIcon" class="icon-picker__fallback">
      <Typography variant="caption" color="amber">
        آیکون یافت نشد — نام را بررسی کنید یا از لیست tabler.io انتخاب کنید
      </Typography>
    </div>

    <a
      href="https://tabler.io/icons"
      target="_blank"
      rel="noopener noreferrer"
      class="icon-picker__link"
    >
      <Typography variant="caption" color="light-blue">
        مشاهده لیست کامل آیکون‌ها در tabler.io/icons
      </Typography>
    </a>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IconQuestionMark } from '@tabler/icons-vue'
import TextField from '@/base/TextField'
import Typography from '@/base/Typography'
import { useTablerIcons } from '@/composables/use-tabler-icons'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: 'نام آیکون را به فرمت kebab-case وارد کنید (مثلاً brand-telegram)',
  },
  errorMessage: {
    type: String,
    default: undefined,
  },
})

const emit = defineEmits(['update:modelValue'])

function onUpdateModelValue(value) {
  emit('update:modelValue', value)
}

const { allIcons, loadIcons, resolveIcon } = useTablerIcons()
loadIcons()

const resolvedIcon = computed(() => {
  if (!props.modelValue || !allIcons.value) return null
  return resolveIcon(props.modelValue)
})
</script>

<style lang="scss" scoped>
.icon-picker {
  &__preview {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
  }

  &__icon {
    color: $primary;
  }

  &__fallback {
    margin-top: 4px;
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
