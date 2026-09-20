<template>
  <div class="numeric-score-input">
    <QRating
      class="numeric-score-input__stars"
      :model-value="modelValue"
      :max="max"
      icon="star_border"
      icon-selected="star"
      icon-half="star_half"
      color="amber"
      size="3em"
      @update:model-value="(value) => emit('update:modelValue', value)"
    />
    <div class="numeric-score-input__labels">
      <span
        v-for="number in max"
        :key="number"
        class="numeric-score-input__label"
        :class="{ 'numeric-score-input__label--active': modelValue === number + min - 1 }"
        @click="emit('update:modelValue', number + min - 1)"
      >
        {{ number + min - 1 }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Number,
    default: null,
  },
  max: {
    type: Number,
    default: 10,
  },
  min: {
    type: Number,
    default: 1,
  },
})

const emit = defineEmits(['update:modelValue'])
</script>

<style scoped lang="scss">
.numeric-score-input {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: $spacing-md;

  &__stars {
    display: flex;
    gap: $spacing-xs;
  }

  &__labels {
    display: flex;
    gap: $spacing-sm;
  }

  &__label {
    width: 3em;
    text-align: center;
    cursor: pointer;
    color: $grey-7;
    font-size: 14px;

    &--active {
      color: $primary;
      font-weight: bold;
    }
  }
}
</style>
