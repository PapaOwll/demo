<template>
  <div class="error-boundary">
    <!-- Show error fallback UI when error occurs -->
    <div v-if="errorInfo.hasError" class="error-boundary__fallback">
      <QCard class="error-boundary__card">
        <QCardSection class="error-boundary__header">
          <div class="error-boundary__icon">
            <QIcon name="error_outline" size="48px" color="negative" />
          </div>
          <h5 class="error-boundary__title">متاسفانه خطایی رخ داده است</h5>
        </QCardSection>

        <QCardSection class="error-boundary__content">
          <p class="error-boundary__message">
            {{ userFriendlyMessage }}
          </p>

          <!-- Show technical details in development -->
          <QExpansionItem
            v-if="isDevelopment"
            icon="bug_report"
            label="جزئیات فنی"
            class="error-boundary__details"
          >
            <QCard flat>
              <QCardSection>
                <pre class="error-boundary__stack">{{
                  errorInfo.error?.stack || errorInfo.error
                }}</pre>
                <p class="error-boundary__info">Component: {{ errorInfo.info }}</p>
              </QCardSection>
            </QCard>
          </QExpansionItem>
        </QCardSection>

        <QCardActions class="error-boundary__actions">
          <QBtn color="primary" label="تلاش مجدد" icon="refresh" @click="resetError" />
          <QBtn flat color="primary" label="بازگشت به صفحه اصلی" icon="home" @click="goHome" />
        </QCardActions>
      </QCard>
    </div>

    <!-- Render children normally when no error -->
    <slot v-else />
  </div>
</template>

<script setup>
import { ref, computed, onErrorCaptured, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { withScope, captureException } from '@sentry/vue'
import { Notif } from '@/data/services/notification-service'

const route = useRoute()

const props = defineProps({
  fallback: {
    type: Object,
    default: null,
  },
  showInProduction: {
    type: Boolean,
    default: true,
  },
  customMessage: {
    type: String,
    default: '',
  },
  logErrors: {
    type: Boolean,
    default: true,
  },
})
const emit = defineEmits(['error', 'reset'])

const router = useRouter()

const errorInfo = ref({
  hasError: false,
  error: null,
  info: null,
  errorCount: 0,
})

const isDevelopment = computed(() => process.env.NODE_ENV === 'development')

watch(
  () => route.path,
  () => {
    if (errorInfo.value.hasError) {
      errorInfo.value = {
        hasError: false,
        error: null,
        info: null,
        errorCount: 0,
      }
    }
  }
)

const userFriendlyMessage = computed(() => {
  if (props.customMessage) {
    return props.customMessage
  }

  // Provide context-specific messages based on error type
  const { error } = errorInfo.value
  if (error?.message?.includes('Network')) {
    return 'مشکلی در ارتباط با سرور وجود دارد. لطفا اتصال اینترنت خود را بررسی کنید.'
  }
  if (error?.message?.includes('404')) {
    return 'اطلاعات مورد نظر یافت نشد.'
  }
  if (error?.message?.includes('401') || error?.message?.includes('403')) {
    return 'شما دسترسی لازم برای مشاهده این بخش را ندارید.'
  }
  if (error?.message?.includes('500')) {
    return 'خطایی در سرور رخ داده است. لطفا بعدا تلاش کنید.'
  }

  return '  در نمایش این بخش مشکلی پیش آمده است. لطفا دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.'
})

onErrorCaptured((error, instance, info) => {
  // Update error state
  errorInfo.value = {
    hasError: true,
    error,
    info,
    errorCount: errorInfo.value.errorCount + 1,
  }

  // Emit error event for parent handling
  emit('error', {
    error,
    instance,
    info,
  })

  // Show notification in production
  if (!isDevelopment.value && props.showInProduction) {
    Notif.error('خطایی رخ داده است', {
      caption: userFriendlyMessage.value,
      timeout: 5000,
    })
  }

  // Log to GlitchTip via the Sentry-compatible SDK
  if (props.logErrors) {
    const isApiError = error?.name === 'ApiError' || error?.errorType === 'api'
    withScope((scope) => {
      if (isApiError) {
        scope.setLevel('warning')
      }
      scope.setContext('vue', {
        componentName: instance?.$options?.name,
        errorInfo: info,
      })
      captureException(error)
    })
  }

  // Prevent the error from propagating further
  return false
})

const resetError = () => {
  errorInfo.value = {
    hasError: false,
    error: null,
    info: null,
    errorCount: 0,
  }
  emit('reset')

  // Force re-render by triggering a route reload
  router.go(0)
}

const goHome = () => {
  errorInfo.value = {
    hasError: false,
    error: null,
    info: null,
    errorCount: 0,
  }
  router.push('/')
}

defineExpose({
  resetError,
  errorInfo,
})
</script>

<style scoped lang="scss">
.error-boundary {
  width: 100%;
  height: 100%;

  &__fallback {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    padding: 2rem;
  }

  &__card {
    max-width: 600px;
    width: 100%;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  &__header {
    text-align: center;
    padding: 2rem 1rem 1rem;
  }

  &__icon {
    margin-bottom: 1rem;
  }

  &__title {
    margin: 0;
    color: $grey-9;
    font-size: 1.5rem;
    font-weight: 600;
  }

  &__content {
    padding: 1rem 2rem;
  }

  &__message {
    text-align: center;
    color: $grey-8;
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  &__details {
    margin-top: 1rem;
    background-color: $grey-2;
    border-radius: 8px;
  }

  &__stack {
    background-color: $grey-9;
    color: $grey-2;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.875rem;
    font-family: monospace;
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__info {
    margin-top: 0.5rem;
    color: $grey-7;
    font-size: 0.875rem;
  }

  &__actions {
    justify-content: center;
    padding: 1rem 2rem 2rem;
    gap: 1rem;
  }
}
</style>
