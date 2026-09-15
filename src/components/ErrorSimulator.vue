<template>
  <div class="error-simulator">
    <QCard class="q-pa-md">
      <QCardSection>
        <h5 class="text-h5 q-mb-md">شبیه‌ساز خطا - Error Simulator</h5>
        <p class="text-body2 text-grey-7 q-mb-lg">
          از این ابزار برای تست حالت‌های مختلف خطا استفاده کنید
        </p>
      </QCardSection>

      <QCardSection>
        <div class="row q-col-gutter-md">
          <!-- Component Error Section -->
          <div class="col-12 col-md-6">
            <QCard flat bordered>
              <QCardSection>
                <div class="text-h6 q-mb-md">
                  <QIcon name="bug_report" color="negative" class="q-mr-sm" />
                  خطای کامپوننت (Component Error)
                </div>
                <p class="text-caption text-grey-7 q-mb-md">
                  این خطاها توسط Error Boundary گرفته می‌شوند
                </p>

                <div class="q-gutter-sm">
                  <QBtn
                    color="negative"
                    label="ایجاد خطای Render"
                    icon="error"
                    @click="triggerRenderError"
                  />
                  <QBtn
                    color="negative"
                    outline
                    label="خطای TypeError"
                    icon="error_outline"
                    @click="triggerTypeError"
                  />
                  <QBtn
                    color="negative"
                    outline
                    label="خطای ReferenceError"
                    icon="warning"
                    @click="triggerReferenceError"
                  />
                </div>

                <!-- Component to test errors -->
                <div v-if="componentError.type" class="q-mt-md">
                  <QChip color="negative" text-color="white">
                    {{ componentError.message }}
                  </QChip>
                  <ErrorProneComponent :error-type="componentError.type" />
                </div>
              </QCardSection>
            </QCard>
          </div>

          <!-- API Error Section -->
          <div class="col-12 col-md-6">
            <QCard flat bordered>
              <QCardSection>
                <div class="text-h6 q-mb-md">
                  <QIcon name="cloud_off" color="warning" class="q-mr-sm" />
                  خطای API (Data Fetching)
                </div>
                <p class="text-caption text-grey-7 q-mb-md">
                  این خطاها در هر کامپوننت handle می‌شوند
                </p>

                <div class="q-gutter-sm">
                  <QBtn
                    color="warning"
                    label="Timeout Error"
                    icon="schedule"
                    :loading="apiLoading.timeout"
                    @click="simulateTimeout"
                  />
                  <QBtn
                    color="warning"
                    outline
                    label="Network Error"
                    icon="wifi_off"
                    :loading="apiLoading.network"
                    @click="simulateNetworkError"
                  />
                  <QBtn
                    color="warning"
                    outline
                    label="401 Unauthorized"
                    icon="lock"
                    :loading="apiLoading.auth"
                    @click="simulate401"
                  />
                  <QBtn
                    color="warning"
                    outline
                    label="500 Server Error"
                    icon="dns"
                    :loading="apiLoading.server"
                    @click="simulate500"
                  />
                </div>

                <!-- API Response Display -->
                <div v-if="apiError" class="q-mt-md">
                  <QBanner class="bg-negative-1">
                    <template #avatar>
                      <QIcon name="error" color="negative" />
                    </template>
                    <div class="text-weight-bold">{{ apiError.type }}</div>
                    <div class="text-caption">{{ apiError.message }}</div>
                    <template #action>
                      <QBtn flat label="بستن" @click="apiError = null" />
                    </template>
                  </QBanner>
                </div>

                <!-- Success Response -->
                <div v-if="apiSuccess" class="q-mt-md">
                  <QBanner class="bg-positive-1">
                    <template #avatar>
                      <QIcon name="check_circle" color="positive" />
                    </template>
                    داده‌ها با موفقیت دریافت شد
                    <template #action>
                      <QBtn flat label="بستن" @click="apiSuccess = false" />
                    </template>
                  </QBanner>
                </div>
              </QCardSection>
            </QCard>
          </div>

          <!-- Menu Loading Error Section -->
          <div class="col-12">
            <QCard flat bordered>
              <QCardSection>
                <div class="text-h6 q-mb-md">
                  <QIcon name="menu" color="info" class="q-mr-sm" />
                  خطای بارگذاری منو (Sidebar Menu)
                </div>
                <p class="text-caption text-grey-7 q-mb-md">
                  برای تست این حالت، می‌توانید connection را قطع کرده و صفحه را refresh کنید
                </p>

                <div class="q-gutter-sm">
                  <QBtn
                    color="info"
                    label="شبیه‌سازی خطای منو"
                    icon="refresh"
                    @click="simulateMenuError"
                  />
                  <QBtn
                    color="info"
                    outline
                    label="پاک کردن Cache و Reload"
                    icon="cached"
                    @click="clearCacheAndReload"
                  />
                </div>

                <QBanner class="q-mt-md bg-info-1">
                  <template #avatar>
                    <QIcon name="info" color="info" />
                  </template>
                  برای مشاهده خطای منو:
                  <ol class="q-my-sm q-pl-md">
                    <li>DevTools را باز کنید (F12)</li>
                    <li>به تب Network بروید</li>
                    <li>حالت Offline را فعال کنید</li>
                    <li>صفحه را Refresh کنید</li>
                  </ol>
                </QBanner>
              </QCardSection>
            </QCard>
          </div>

          <!-- Test Navigation -->
          <div class="col-12">
            <QCard flat bordered>
              <QCardSection>
                <div class="text-h6 q-mb-md">
                  <QIcon name="navigation" color="primary" class="q-mr-sm" />
                  تست Navigation با خطا
                </div>

                <div class="q-gutter-sm">
                  <QBtn
                    color="primary"
                    label="رفتن به صفحه UserList"
                    icon="people"
                    to="/user/list"
                  />
                  <QBtn
                    color="primary"
                    outline
                    label="رفتن به صفحه خطادار"
                    icon="error"
                    @click="navigateToErrorPage"
                  />
                </div>
              </QCardSection>
            </QCard>
          </div>
        </div>
      </QCardSection>
    </QCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Notif, confirmDialog } from '@/data/services/notification-service'

const router = useRouter()

const componentError = ref({ type: null, message: '' })
const apiError = ref(null)
const apiSuccess = ref(false)
const apiLoading = ref({
  timeout: false,
  network: false,
  auth: false,
  server: false,
})

const triggerRenderError = () => {
  componentError.value = {
    type: 'render',
    message: 'Simulating render error - این یک خطای render تستی است',
  }
}

const triggerTypeError = () => {
  componentError.value = {
    type: 'type',
    message: 'Simulating TypeError - خطای نوع داده',
  }
}

const triggerReferenceError = () => {
  componentError.value = {
    type: 'reference',
    message: 'Simulating ReferenceError - متغیر تعریف نشده',
  }
}

const simulateTimeout = async () => {
  apiLoading.value.timeout = true
  apiError.value = null
  apiSuccess.value = false

  // Create a promise that never resolves to simulate timeout
  const controller = new AbortController()

  setTimeout(() => {
    controller.abort()
    apiError.value = {
      type: 'Timeout Error',
      message: 'زمان درخواست به پایان رسید. لطفا دوباره تلاش کنید.',
      code: 'ECONNABORTED',
    }
    apiLoading.value.timeout = false
  }, 3000)

  Notif.error('Simulating timeout after 3 seconds...')
}

const simulateNetworkError = () => {
  apiLoading.value.network = true
  apiError.value = null
  apiSuccess.value = false

  setTimeout(() => {
    apiError.value = {
      type: 'Network Error',
      message: 'اتصال اینترنت خود را بررسی کنید.',
      code: 'ERR_NETWORK',
    }
    apiLoading.value.network = false

    Notif.error('Network Error - اتصال برقرار نشد')
  }, 1000)
}

const simulate401 = () => {
  apiLoading.value.auth = true
  apiError.value = null
  apiSuccess.value = false

  setTimeout(() => {
    apiError.value = {
      type: '401 Unauthorized',
      message: 'دسترسی شما منقضی شده است. لطفا دوباره وارد شوید.',
      status: 401,
    }
    apiLoading.value.auth = false

    Notif.warning('نیاز به ورود مجدد')
  }, 1000)
}

const simulate500 = () => {
  apiLoading.value.server = true
  apiError.value = null
  apiSuccess.value = false

  setTimeout(() => {
    apiError.value = {
      type: '500 Server Error',
      message: 'خطایی در سرور رخ داده است. لطفا بعدا تلاش کنید.',
      status: 500,
    }
    apiLoading.value.server = false

    Notif.error('خطای سرور')
  }, 1000)
}

const simulateMenuError = () => {
  confirmDialog(
    'شبیه‌سازی خطای منو',
    'برای این تست، باید user store را موقتا خراب کنیم. آیا مطمئن هستید؟',
    () => {
      // This would need to be implemented in the actual store
      Notif.info('لطفا DevTools را باز کرده و Network را Offline کنید، سپس صفحه را refresh کنید', {
        timeout: 5000,
      })
    },
    {
      ok: {
        label: 'بله، شبیه‌سازی کن',
        color: 'negative',
      },
    }
  )
}

const clearCacheAndReload = () => {
  localStorage.clear()
  sessionStorage.clear()
  window.location.reload()
}

const navigateToErrorPage = () => {
  router.push('/non-existent-page-for-testing-404')
}

const ErrorProneComponent = {
  props: ['errorType'],
  setup(props) {
    if (props.errorType === 'render') {
      // This will cause a render error
      throw new Error('Intentional render error for testing')
    }
    if (props.errorType === 'type') {
      // This will cause a TypeError
      const obj = null
      return obj.someProperty // TypeError
    }
    if (props.errorType === 'reference') {
      // This will cause a ReferenceError
      // eslint-disable-next-line no-undef
      return undefinedVariable // ReferenceError
    }
    return null
  },
  template: '<div>This should not render</div>',
}
</script>

<style lang="scss" scoped>
.error-simulator {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
