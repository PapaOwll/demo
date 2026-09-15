<template>
  <div class="feedback-edit-form">
    <div class="feedback-edit-form__row">
      <label class="feedback-edit-form__label">نام نمایشی:</label>
      <QInput
        :model-value="modelValue.shownName"
        outlined
        dense
        placeholder="نام نمایشی را وارد کنید"
        class="feedback-edit-form__input"
        :maxlength="255"
        @update:model-value="updateField('shownName', $event)"
      />
    </div>

    <div class="feedback-edit-form__row">
      <label class="feedback-edit-form__label">نوع بازخورد: *</label>
      <QSelect
        :model-value="modelValue.feedbackTypeId"
        outlined
        dense
        :options="feedbackTypeOptions"
        option-value="value"
        option-label="label"
        emit-value
        map-options
        class="feedback-edit-form__input"
        @update:model-value="updateField('feedbackTypeId', $event)"
      />
    </div>

    <div class="feedback-edit-form__row">
      <label class="feedback-edit-form__label">امتیاز:</label>
      <QSelect
        :model-value="modelValue.rating"
        outlined
        dense
        :options="ratingOptions"
        option-value="value"
        option-label="label"
        emit-value
        map-options
        clearable
        class="feedback-edit-form__input"
        @update:model-value="updateField('rating', $event)"
      />
    </div>

    <div class="feedback-edit-form__row feedback-edit-form__row--full">
      <label class="feedback-edit-form__label">نظر:</label>
      <QInput
        :model-value="modelValue.comment"
        outlined
        type="textarea"
        rows="6"
        placeholder="نظر خود را وارد کنید"
        class="feedback-edit-form__input"
        @update:model-value="updateField('comment', $event)"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  feedbackTypeOptions: {
    type: Array,
    default: () => [],
  },
  ratingOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  })
}
</script>

<style lang="scss" scoped>
.feedback-edit-form {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  &__row {
    display: flex;
    align-items: flex-start;
    gap: 1rem;

    &--full {
      flex-direction: column;
      align-items: stretch;
    }
  }

  &__label {
    min-width: 120px;
    font-size: 0.9375rem;
    font-weight: 600;
    color: $grey-8;
    padding-top: 0.5rem;
    text-align: right;
  }

  &__input {
    flex: 1;
    max-width: 500px;
  }

  &__row--full &__input {
    max-width: 100%;
  }
}
</style>
