<template>
  <QDialog v-model="internalShow" persistent>
    <QCard class="announcement-modal" :style="cardStyle">
      <QCardSection class="announcement-modal__header">
        <Typography variant="heading" size="h5" color="dark">
          {{ announcement?.title }}
        </Typography>
      </QCardSection>
      <QCardSection class="announcement-modal__body">
        <Typography variant="body" size="3" color="dark">
          {{ displayText }}
        </Typography>
      </QCardSection>
      <QCardActions class="announcement-modal__actions" align="right">
        <Button variant="filled" color="primary" :text="buttonText" @click="handleButtonClick" />
      </QCardActions>
    </QCard>
  </QDialog>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Typography from '@/base/Typography'
import Button from '@/base/Button'

const props = defineProps({
  announcement: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'dismiss'])
const router = useRouter()

const internalShow = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const displayText = computed(() => {
  return props.announcement?.text || props.announcement?.description || ''
})

const buttonText = computed(() => {
  return props.announcement?.buttonText || 'متوجه شدم'
})

const cardStyle = computed(() => {
  if (!props.announcement) return {}

  const { gradient } = props.announcement
  if (!gradient || !Array.isArray(gradient) || gradient.length < 2) {
    return {}
  }

  try {
    return {
      background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
    }
  } catch {
    return {}
  }
})

const handleDismiss = () => {
  emit('dismiss')
  internalShow.value = false
}
const handleButtonClick = () => {
  const { buttonLink } = props.announcement

  if (buttonLink) {
    router.push(buttonLink)
  }

  handleDismiss()
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/colors';
@import '@/assets/styles/mixins';

.announcement-modal {
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

  @include media-breakpoint-down(sm) {
    max-width: 90%;
  }

  &__header {
    padding: 20px 24px 12px;
  }

  &__body {
    padding: 12px 24px 20px;
  }

  &__actions {
    padding: 0 24px 20px;
    gap: 8px;
  }
}
</style>
