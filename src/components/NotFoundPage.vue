<template>
  <div class="page-404">
    <h1 class="page-404__error-number">404</h1>
    <h5 class="page-404__message">صفحه مورد نظر شما وجود ندارد!</h5>
    <p class="text-center">
      <RouterLink :to="{ name: hasAccessToken ? 'dashboard' : 'login' }">
        <QBtn color="primary" outline class="mt-3" :label="buttonText" />
      </RouterLink>
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { hasAccessToken } from '@/utils/auth'

const buttonText = computed(() => {
  return hasAccessToken() ? 'رفتن به داشبورد' : 'رفتن به صفحه ورود'
})
</script>

<style scoped lang="scss">
.page-404 {
  color: $grey-6;
  text-align: center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  &__error-number {
    font-size: 100px;
    margin-bottom: 1rem;
  }

  &__message {
    margin-bottom: 2rem;
  }
}
</style>
