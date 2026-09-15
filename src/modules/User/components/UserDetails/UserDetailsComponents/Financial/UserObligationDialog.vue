<template>
  <QDialog v-model="isVisible" persistent>
    <QCard class="obligation-dialog">
      <QCardSection class="obligation-dialog__header">
        <div class="obligation-dialog__title">
          <Typography variant="heading" size="h4">افزودن تعهد پرداخت</Typography>
        </div>
        <QBtn
          class="obligation-dialog__close-btn"
          flat
          round
          dense
          icon="close"
          @click="isVisible = false"
        />
      </QCardSection>

      <QCardSection class="obligation-dialog__tabs">
        <QTabs
          v-model="activeTab"
          dense
          active-color="primary"
          indicator-color="primary"
          align="justify"
        >
          <QTab name="beta" label="بتا" />
        </QTabs>
      </QCardSection>

      <QCardSection class="obligation-dialog__content">
        <QTabPanels v-model="activeTab" animated class="obligation-dialog__tab-panels">
          <QTabPanel name="beta" class="obligation-dialog__tab-panel">
            <UserBetaInstallments :prop-data="userId" @submit="handleSubmit" />
          </QTabPanel>
        </QTabPanels>
      </QCardSection>
    </QCard>
  </QDialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import Typography from '@/base/Typography'
import UserBetaInstallments from './UserBetaInstallments'

const queryClient = useQueryClient()
const activeTab = ref('beta')

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: [String, Number],
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const handleSubmit = async () => {
  await queryClient.invalidateQueries({ queryKey: ['user', 'payment-obligations'] })
  isVisible.value = false
  emit('submit')
}
</script>

<style lang="scss" scoped>
.obligation-dialog {
  min-width: 500px;
  max-width: 700px;
  width: 100%;
  border-radius: 16px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid #e0e0e0;
  }

  &__title {
    flex: 1;
  }

  &__close-btn {
    width: 32px;
    height: 32px;
  }

  &__tabs {
    padding: 0 24px;
    padding-bottom: 0;
    border-bottom: 1px solid $default-disabled-border;
  }
  :deep(.q-tabs) {
    width: fit-content;
  }
  &__tab-panels {
    background: transparent;
  }

  &__tab-panel {
    padding: 0;
  }

  &__content {
    padding: 24px;
  }
}
</style>
