<template>
  <QCard v-if="treatmentData.prepayAt" class="tpp-card">
    <QCardSection class="tpp-card__section">
      <div class="tpp">
        <div class="tpp__header">
          <div class="tpp__header-text">بیعانه</div>
        </div>
        <div class="tpp__form">
          <div class="tpp__amount-display">
            <span class="tpp__label">مبلغ دریافت شده:</span>
            <span class="tpp__amount">{{ formattedPrepay }} تومان</span>
          </div>
          <QBtn
            v-if="treatmentData.prepayAt && isExtradited"
            class="tpp__extradition-button"
            :color="treatmentData.extraditionAt ? 'negative' : 'warning'"
            disable
            outline
            size="lg"
          >
            {{ isExtradited ? 'عودت داده شده' : '' }}
          </QBtn>
        </div>
      </div>
    </QCardSection>
  </QCard>
</template>

<script setup>
import { computed } from 'vue'
import { useTpProvider } from '../../composables/use-tp-provider'

const treatmentData = useTpProvider('treatmentData')

const isExtradited = computed(() => treatmentData?.value?.extraditionAt)

const formattedPrepay = computed(() => {
  const value = treatmentData?.value?.prepay
  if (!value) return ''
  return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
})
</script>

<style lang="scss" scoped>
.tpp-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }

  &__section {
    padding: 1.5rem;
  }
}

.tpp {
  &__header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    gap: 0.5rem;
  }

  &__header-icon {
    font-size: 1.5rem;
  }

  &__header-text {
    font-weight: 700;
    font-size: 1.25rem;
    color: $primary;
    text-align: center;
  }

  &__form {
    padding: 0;
  }

  &__amount-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 8px;
    margin-bottom: 1rem;
    border: 1px solid #e0e0e0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  }

  &__label {
    font-size: 0.9rem;
    color: $grey-7;
    font-weight: 500;
  }

  &__amount {
    font-size: 1.1rem;
    font-weight: 700;
    color: $primary;
    background: rgba($primary, 0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
  }

  &__extradition-button {
    margin-top: 0.75rem;
    width: 100%;
    border-radius: 8px;
    font-weight: 500;
    height: 44px;
  }
}
</style>
