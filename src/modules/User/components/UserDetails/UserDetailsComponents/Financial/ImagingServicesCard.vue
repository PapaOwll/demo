<template>
  <div class="imaging-card">
    <div v-for="item in breakdown" :key="item.key" class="imaging-card__item-row">
      <div class="imaging-card__item-info">
        <Typography variant="body" size="4" weight="medium" class="imaging-card__item-name">
          {{ item.label }}
        </Typography>
        <Typography variant="caption" weight="medium" class="imaging-card__item-unit-price">
          {{ item.unitPriceRial === 0 ? 'رایگان' : `${numberSeparator(item.unitPriceRial)} ریال` }}
        </Typography>
      </div>

      <div class="imaging-card__stepper">
        <Button
          variant="outline"
          color="grey"
          size="sm"
          is-rounded
          is-icon-only
          type="button"
          class="imaging-card__step-btn"
          :left-icon="IconMinus"
          :is-disabled="disable || item.count <= item.min"
          @click="decrement(item)"
        />
        <div class="imaging-card__qty-input">
          <TextField
            :model-value="item.count"
            type="text"
            inputmode="numeric"
            variant="outline"
            size="sm"
            :disable="disable"
            :min="item.min"
            :max="item.max"
            @update:model-value="(value) => setCount(item, value)"
          />
        </div>
        <Button
          variant="outline"
          color="grey"
          size="sm"
          is-rounded
          is-icon-only
          type="button"
          class="imaging-card__step-btn"
          :left-icon="IconPlus"
          :is-disabled="disable || (item.max !== Infinity && item.count >= item.max)"
          @click="increment(item)"
        />
      </div>

      <Typography variant="body" size="4" weight="medium" class="imaging-card__row-amount">
        {{ numberSeparator(item.lineTotalRial) }} ریال
      </Typography>
    </div>

    <div class="imaging-card__divider" />

    <div class="imaging-card__total-row">
      <Typography variant="body" size="4" weight="medium" class="imaging-card__total-label">
        مبلغ نهایی
      </Typography>
      <Typography variant="body" size="4" weight="medium" class="imaging-card__total-amount">
        {{ numberSeparator(totalRial) }} ریال
      </Typography>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { IconMinus, IconPlus } from '@tabler/icons-vue'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import TextField from '@/base/TextField'
import { numberSeparator } from '@/utils/formatter'

defineProps({
  disable: {
    type: Boolean,
    default: false,
  },
})

const SERVICES = [
  {
    key: 'opg',
    label: 'OPG',
    unitPriceRial: 8_000_000,
    min: 0,
    max: Infinity,
  },
  {
    key: 'cbct',
    label: 'CBCT',
    unitPriceRial: 25_000_000,
    min: 0,
    max: 4,
  },
  {
    key: 'implant',
    label: 'ایمپلنت',
    unitPriceRial: 0,
    min: 0,
    max: 24,
  },
]

const createInitialServices = () =>
  SERVICES.reduce((acc, service) => {
    acc[service.key] = service.min
    return acc
  }, {})

const clampCount = (service, value) => {
  const parsed = Number(value)
  const numeric = Number.isNaN(parsed) ? 0 : Math.floor(parsed)
  const lower = Math.max(service.min, numeric)
  return service.max === Infinity ? lower : Math.min(lower, service.max)
}

const computeBreakdown = (services) =>
  SERVICES.map((service) => {
    const count = services[service.key] ?? 0
    return {
      key: service.key,
      label: service.label,
      count,
      min: service.min,
      max: service.max,
      unitPriceRial: service.unitPriceRial,
      lineTotalRial: count * service.unitPriceRial,
    }
  })

const services = reactive(createInitialServices())

const breakdown = computed(() => computeBreakdown(services))
const totalRial = computed(() => breakdown.value.reduce((sum, item) => sum + item.lineTotalRial, 0))
const hasSelection = computed(() => breakdown.value.some((item) => item.count > 0))

const reset = () => {
  const initial = createInitialServices()
  SERVICES.forEach((service) => {
    services[service.key] = initial[service.key]
  })
}

const increment = (service) => {
  services[service.key] = clampCount(service, (services[service.key] ?? 0) + 1)
}

const decrement = (service) => {
  services[service.key] = clampCount(service, (services[service.key] ?? 0) - 1)
}

const setCount = (service, value) => {
  services[service.key] = clampCount(service, value)
}

const getMetadata = () => {
  const items = breakdown.value
  return {
    kind: 'increase_balance_services',
    services: items
      .filter((item) => item.count > 0)
      .map((item) => ({
        type: item.key,
        count: item.count,
        unit_price_rial: item.unitPriceRial,
        total_rial: item.lineTotalRial,
      })),
    total_rial: totalRial.value,
  }
}

const getDescription = () => {
  const selected = breakdown.value.filter((item) => item.count > 0)
  if (selected.length === 0) return 'افزایش موجودی'
  const formatter = new Intl.NumberFormat('fa-IR')
  const parts = selected.map((item) => `${item.label}: ${formatter.format(item.count)}`)
  return `افزایش موجودی (${parts.join('، ')})`
}

defineExpose({
  totalRial,
  hasSelection,
  getMetadata,
  getDescription,
  reset,
})
</script>

<style lang="scss" scoped>
.imaging-card {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-lg;
  background: $grey-light;
  border: 1px solid $grey-3;
  border-radius: $radius-md;
  user-select: none;

  &__item-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: $spacing-xs;
    min-height: 44px;
  }

  &__item-info {
    display: flex;
    flex-direction: column;
    gap: $spacing-xxs;
    justify-self: start;
    text-align: right;
  }

  &__stepper {
    display: flex;
    align-items: center;
    justify-self: center;
    gap: $spacing-md;
  }

  &__row-amount {
    justify-self: end;
    color: $dark;
    text-align: left;
    white-space: nowrap;
  }

  &__item-name {
    color: $grey-8;
  }

  &__item-unit-price {
    color: $grey-6;
  }

  &__step-btn {
    min-width: $spacing-2xl !important;
    border-radius: $radius-round !important;
    background: $white !important;
    border-color: $grey-3 !important;
    color: $dark-6 !important;

    &.button--disabled {
      background: transparent !important;
      border: solid 1px $grey-4 !important;
    }
  }

  &__qty-input {
    width: 44px;
    flex: 0 0 44px;

    :deep(.textfield__label),
    :deep(.textfield__hint) {
      display: none !important;
    }

    :deep(.q-field__control) {
      padding: 0 $spacing-xs !important;
    }

    :deep(.q-field__native) {
      text-align: center !important;
    }
  }

  &__divider {
    height: 1px;
    background: $grey-3;
    margin: $spacing-xs 0;
  }

  &__total-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-md;
    background: $white;
    border: 1px solid $grey-3;
    border-radius: $radius-sm;
    min-height: $spacing-3xl;
  }

  &__total-label {
    color: $grey-8;
  }

  &__total-amount {
    color: $dark;
    white-space: nowrap;
  }
}
</style>
