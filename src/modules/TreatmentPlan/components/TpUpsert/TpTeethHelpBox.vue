<template>
  <div class="tpt__help">
    <div class="tpt__help-title">راهنما</div>
    <div class="tpt__help-item">
      <div class="tpt__help-icon tpt__help-icon--draft" />
      <div class="tpt__help-text">پیش‌نویس</div>
    </div>
    <div class="tpt__help-item">
      <div class="tpt__help-icon tpt__help-icon--plan" />
      <div class="tpt__help-text">طرح درمان</div>
    </div>
    <div class="tpt__help-item">
      <div class="tpt__help-icon tpt__help-icon--selected" />
      <div class="tpt__help-text">انتخاب شده</div>
    </div>
  </div>
</template>
<script setup></script>
<style lang="scss" scoped>
.tpt {
  &__help {
    position: absolute;
    top: 82px;
    right: 1rem;
    background-color: $grey-1;
    border-radius: 8px;
    border: 1px solid $grey-4;
    padding: 16px;
    width: 160px;
    z-index: 10;
    text-align: right;

    &-title {
      font-weight: 500;
      margin-bottom: 12px;
      color: #465167;
      font-size: 1rem;
    }

    &-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      gap: 12px;
      &:last-child {
        margin-bottom: 0;
      }
    }

    &-text {
      font-size: 0.9rem;
    }

    &-icon {
      width: 30px;
      height: 30px;
      border-radius: 4px;
      font-weight: 500;
      display: flex;
      justify-content: center;
      align-items: center;

      &--draft {
        background-color: $blue-1;
      }

      &--plan {
        background-color: $blue-2;
      }

      &--selected {
        border: 2px solid $blue-8;
        border-radius: 4px;
      }
    }
  }
}
</style>
