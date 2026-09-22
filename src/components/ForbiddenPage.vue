<template>
  <div class="page-403">
    <Typography variant="heading" size="h1" color="grey" class="page-403__error-number">
      403
    </Typography>
    <Typography variant="heading" size="h5" color="grey" class="page-403__message">
      شما دسترسی لازم برای مشاهده این بخش را ندارید.
    </Typography>
    <Typography
      v-if="backendMessage"
      variant="body"
      size="2"
      color="red"
      weight="medium"
      class="page-403__backend-message"
    >
      {{ backendMessage }}
    </Typography>
    <div class="page-403__actions">
      <Button
        variant="outline"
        color="blue"
        :to="{ name: hasAccessToken ? 'dashboard' : 'login' }"
        :text="buttonText"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import { hasAccessToken } from '@/utils/auth'

const BACKEND_MESSAGE_KEY = 'auth:403-message'

const backendMessage = ref(sessionStorage.getItem(BACKEND_MESSAGE_KEY) || '')
sessionStorage.removeItem(BACKEND_MESSAGE_KEY)

const buttonText = computed(() => {
  return hasAccessToken() ? 'رفتن به داشبورد' : 'رفتن به صفحه ورود'
})
</script>

<style scoped lang="scss">
.page-403 {
  color: $grey-6;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: $spacing-lg;

  &__error-number {
    font-size: 100px;
    margin: 0 0 1rem;
  }

  &__message {
    margin: 0 0 0.5rem;
  }

  &__backend-message {
    margin: 0 0 0.5rem;
  }

  &__actions {
    margin-top: 2rem;
  }
}
</style>

<style lang="scss">
.q-page:has(.page-403) {
  display: flex;
  flex-direction: column;

  .offline-wrapper,
  .offline-wrapper__online-content,
  .error-boundary,
  .router-transition-wrapper,
  .page-403 {
    display: flex;
    flex-direction: column;
    flex: 1 0 auto;
  }
}
</style>
