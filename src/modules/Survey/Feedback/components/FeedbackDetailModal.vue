<template>
  <QDialog
    v-model="isOpen"
    transition-show="slide-up"
    transition-hide="slide-down"
    class="feedback-detail-modal"
  >
    <QCard class="feedback-detail-modal__card">
      <!-- Header with close button -->
      <QCardSection class="feedback-detail-modal__header">
        <QBtn flat round dense @click="closeModal">
          <IconX size="20" />
        </QBtn>
      </QCardSection>

      <!-- Content -->
      <QCardSection class="feedback-detail-modal__content">
        <FeedbackDetailContent :feedback-id="feedbackId" />
      </QCardSection>
    </QCard>
  </QDialog>
</template>

<script setup>
import { computed } from 'vue'
import { IconX } from '@tabler/icons-vue'
import FeedbackDetailContent from './FeedbackDetailContent'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  feedbackId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const closeModal = () => {
  isOpen.value = false
}
</script>

<style scoped lang="scss">
.feedback-detail-modal {
  &__card {
    width: 80vw;
    max-width: 1200px;
    height: 90vh;
    max-height: 90vh;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 1rem;
    background: white;
    border-bottom: 1px solid $grey-3;
  }

  &__content {
    background: $grey-1;
    height: calc(90vh - 80px);
    overflow-y: auto;
  }
}
</style>
