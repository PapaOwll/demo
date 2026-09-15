<template>
  <div class="user-barter">
    <template v-if="!otpStep">
      <div class="user-barter__field-group">
        <label class="user-barter__label text-subtitle1">تهاتر بین کاربر</label>
        <Typography variant="body" size="3" color="grey">
          دو کاربر را برای انجام عملیات تهاتر انتخاب کنید
        </Typography>
      </div>

      <div class="user-barter__field-group">
        <UserSelectField
          v-model="form.barterUser"
          label="از کاربر"
          placeholder="انتخاب کاربر مبدا"
          class="user-barter__field"
          :error="!!errors.barterUser"
          :error-message="errors.barterUser"
          @update:model-value="(value) => handleChange('barterUser', value)"
        />
      </div>

      <div class="user-barter__swap-container">
        <QBtn
          round
          flat
          icon="swap_vert"
          color="primary"
          size="md"
          class="user-barter__swap-btn"
          @click="swapUsers"
        />
      </div>

      <div class="user-barter__field-group">
        <UserSelectField
          v-model="form.receiveUser"
          label="به کاربر"
          placeholder="انتخاب کاربر مقصد"
          class="user-barter__field"
          :error="!!errors.receiveUser"
          :error-message="errors.receiveUser"
          @update:model-value="(value) => handleChange('receiveUser', value)"
        />
      </div>

      <!-- Amount -->
      <div class="user-barter__field-group user-barter__field-group--amount">
        <label class="user-barter__label">مبلغ تهاتر</label>
        <CurrencyField
          v-model="form.amount"
          outlined
          class="user-barter__field"
          :error="errors.amount ? !!errors.amount : null"
          :error-message="errors.amount"
          :max="999999999999"
          :min="100000"
          dir="ltr"
          suffix="تومان"
          placeholder=""
        />
        <div class="user-barter__hint text-caption text-grey-6">حداقل مبلغ: ۱۰,۰۰۰ تومان</div>
      </div>

      <div class="user-barter__field-group">
        <TextField
          v-model="form.description"
          label="توضیحات"
          type="textarea"
          outlined
          rows="3"
          class="user-barter__field"
          :error="errors.description ? !!errors.description : null"
          :error-message="errors.description"
          @update:model-value="(value) => handleChange('description', value)"
        />
      </div>
    </template>

    <template v-else>
      <div class="user-barter__otp">
        <section class="user-barter__otp-header">
          <div class="user-barter__otp-icon">
            <IconUser size="24" />
          </div>
          <div class="user-barter__otp-divider" />
          <div class="user-barter__otp-icon">
            <IconDeviceLandlinePhone size="24" />
          </div>
        </section>
        <div class="user-barter__field-group">
          <Typography weight="semibold" variant="body" size="3">وارد کردن کد تایید</Typography>
          <div class="user-barter__otp-message">
            <Typography variant="body" size="3" weight="medium" class="text-center">
              یک کد ۵ رقمی به {{ barterUserDisplay }} / {{ barterUserMobile }} فرستادیم. اینجا وارد
              کن.
            </Typography>
            <div class="otp-input-box user-barter__otp-box">
              <QInput
                v-for="(_, index) in otp"
                :key="index"
                ref="otpInputRefs"
                v-model="otp[index]"
                dense
                borderless
                maxlength="1"
                class="otp-input-box__input"
                input-class="text-center text-h6"
                @update:model-value="(val) => handleOtpInput(index, val)"
                @keydown="(event) => handleOtpKeyDown(event, index)"
                @paste.prevent="handleOtpPaste"
              />
            </div>
            <div class="user-barter__otp-actions">
              <div class="user-barter__otp-resend">
                <Button
                  v-if="resendCountdown > 0"
                  type="button"
                  variant="flat"
                  size="sm"
                  color="grey"
                  :is-disabled="true"
                  :text="`ارسال مجدد (${resendCountdown})`"
                />
                <Button
                  v-else
                  type="button"
                  variant="flat"
                  size="sm"
                  color="light-blue"
                  :is-loading="isResendingOtp"
                  text="ارسال مجدد کد تایید"
                  @click="handleResendOtp"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div class="user-barter__actions">
      <Button
        v-if="otpStep"
        type="button"
        color="light-blue"
        :is-loading="isConfirming"
        :is-disabled="!isOtpInputValid"
        text="تایید نهایی انتقال"
        @click="handleConfirmOtp"
      />
      <Button
        v-else
        type="button"
        color="light-blue"
        :is-loading="isSubmitting"
        text="ایجاد انتقال"
        @click="handleSubmit"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { Notif } from '@/data/services/notification-service'
import { object, string, number, mixed } from 'yup'
import useYup from '@/composables/use-yup'
import {
  useUserBarterMutation,
  useConfirmUserBarterMutation,
  useResendUserBarterOtpMutation,
  useGetUserMiniByIdQuery,
} from '@/modules/User/query'
import CurrencyField from '@/components/Form/CurrencyField'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import TextField from '@/base/TextField'
import UserSelectField from '@/components/Form/UserSelectField'
import { IconDeviceLandlinePhone, IconUser } from '@tabler/icons-vue'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import {
  mockCreateBarter,
  mockConfirmBarter,
  mockResendBarterOtp,
} from '@/mocks/user-details/financial'

const props = defineProps({
  userId: {
    type: [String, Number],
    required: true,
  },
})

const emit = defineEmits(['success', 'close'])

const OTP_LENGTH = 5
const RESEND_COUNT_DOWN_SECONDS = 60

const userBarterMutation = useUserBarterMutation(
  ENABLE_USER_DETAIL_MOCKS ? { mutationFn: mockCreateBarter } : {}
)
const confirmBarterMutation = useConfirmUserBarterMutation(
  ENABLE_USER_DETAIL_MOCKS ? { mutationFn: mockConfirmBarter } : {}
)
const resendBarterOtpMutation = useResendUserBarterOtpMutation(
  ENABLE_USER_DETAIL_MOCKS ? { mutationFn: mockResendBarterOtp } : {}
)

const { data: currentUserInfo } = useGetUserMiniByIdQuery(() => props.userId)

const isSubmitting = ref(false)
const isConfirming = ref(false)
const isResendingOtp = ref(false)

const otpStep = ref(false)
const currentBarterId = ref(null)

const form = ref({
  barterUser: null,
  receiveUser: null,
  amount: null,
  description: null,
})

const otp = ref(Array.from({ length: OTP_LENGTH }, () => ''))
const otpInputRefs = ref([])
const resendCountdown = ref(0)
let resendTimer = null

const otpCode = computed(() =>
  otp.value.every((digit) => digit && /^\d$/.test(digit)) ? otp.value.join('') : ''
)

const isOtpInputValid = computed(() => otpCode.value.length === OTP_LENGTH)

const currentUserDisplay = computed(() => {
  if (!currentUserInfo.value) return ''
  const user = currentUserInfo.value
  const name = user?.name || 'بدون نام'
  const mobile = user?.mobile || ''
  const docNumber = user?.docNumber || ''

  return `${name} / ${mobile}${docNumber ? ` / ${docNumber}` : ''}`
})

const barterUserDisplay = computed(() => {
  const user = form.value.barterUser?.rawData
  if (!user) return form.value.barterUser?.label || ''
  const firstName = user.firstName || ''
  const name = user.name || ''
  const fullName = `${firstName} ${name}`.trim()
  return fullName || user.label || 'بدون نام'
})

const barterUserMobile = computed(() => form.value.barterUser?.rawData?.mobile || '')

watch(
  currentUserInfo,
  (userInfo) => {
    if (props.userId && userInfo) {
      form.value.barterUser = {
        label: currentUserDisplay.value,
        value: props.userId,
        rawData: userInfo,
      }
    }
  },
  { immediate: true }
)

const validationSchema = object().shape({
  barterUser: mixed().required('کاربر مبدا را انتخاب کنید'),
  receiveUser: mixed()
    .required('کاربر مقصد را انتخاب کنید')
    .test({
      name: 'different-users',
      message: 'کاربر مقصد نمی‌تواند با کاربر مبدا یکی باشد',
      test: (value) => {
        const fromId = form.value.barterUser?.value
        const toId = value?.value
        return toId !== fromId
      },
    }),
  amount: number()
    .transform((value, originalValue) => {
      if (originalValue === '' || originalValue == null) {
        return 0
      }
      return value
    })
    .required('مبلغ را وارد کنید')
    .min(10_000, 'حداقل مبلغ ۱۰,۰۰۰ تومان است'),
  description: string().nullable(),
})

const { validate, validateAt, errors, setError } = useYup(validationSchema)

const handleChange = (field, value) => {
  validateAt(field, value)
  if (errors.value[field] && value) {
    setError(field, null)
  }
}

const swapUsers = () => {
  const temp = form.value.barterUser
  form.value.barterUser = form.value.receiveUser
  form.value.receiveUser = temp
}

const handlePaymentError = (error) => {
  if (error.data?.data?.message) {
    return error.data.data.message
  }
  if (error.data?.data?.error) {
    return error.data.data.error
  }
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.response?.data?.data?.message) {
    return error.response.data.data.message
  }
  if (error.data?.message) {
    return error.data.message
  }
  if (error.response?.data) {
    if (typeof error.response.data === 'string') {
      return error.response.data
    }
    if (error.response.data.error) {
      return error.response.data.error
    }
  }
  if (error.message && error.message !== 'Request failed with status code 400') {
    return error.message
  }
  return 'خطا در پردازش پرداخت'
}

const startResendCountdown = () => {
  resendCountdown.value = RESEND_COUNT_DOWN_SECONDS
  if (resendTimer) clearInterval(resendTimer)
  resendTimer = setInterval(() => {
    resendCountdown.value -= 1
    if (resendCountdown.value <= 0) {
      clearInterval(resendTimer)
      resendTimer = null
      resendCountdown.value = 0
    }
  }, 1000)
}

const clearResendTimer = () => {
  if (resendTimer) {
    clearInterval(resendTimer)
    resendTimer = null
  }
}

const resetOtpState = () => {
  otpStep.value = false
  currentBarterId.value = null
  otp.value = Array.from({ length: OTP_LENGTH }, () => '')
  isConfirming.value = false
  isResendingOtp.value = false
  resendCountdown.value = 0
  clearResendTimer()
}

const handleOtpInput = (index, value) => {
  const lastChar = value ? String(value).slice(-1) : ''
  if (/^\d$/.test(lastChar)) {
    otp.value[index] = lastChar
    if (index < OTP_LENGTH - 1) {
      nextTick(() => otpInputRefs.value[index + 1]?.focus())
    }
  } else {
    otp.value[index] = ''
  }
}

const handleOtpPaste = (event) => {
  const pastedData = (event.clipboardData.getData('text') || '').trim()
  if (/^\d+$/.test(pastedData)) {
    ;[...pastedData].forEach((char, i) => {
      if (i < OTP_LENGTH) {
        otp.value[i] = char
      }
    })
  }
}

const handleResendOtp = async () => {
  if (!currentBarterId.value || resendCountdown.value > 0 || isResendingOtp.value) return
  try {
    isResendingOtp.value = true
    await resendBarterOtpMutation.mutateAsync(currentBarterId.value)
    startResendCountdown()
    Notif.success('کد تأیید مجدداً ارسال شد', { group: false })
  } catch (error) {
    Notif.error(handlePaymentError(error), { group: false })
  } finally {
    isResendingOtp.value = false
  }
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  try {
    isSubmitting.value = true

    const { isValid } = await validate(form.value)
    if (!isValid) {
      Notif.error('لطفا تمام فیلدهای ضروری را پر کنید', { group: false })
      return
    }

    Notif.info('در حال ایجاد انتقال...', { group: false, timeout: 2000 })

    const fromUserId = form.value.barterUser?.value || form.value.barterUser
    const toUserId = form.value.receiveUser?.value || form.value.receiveUser

    if (!fromUserId || !toUserId) {
      throw new Error('کاربر مبدا و مقصد باید انتخاب شوند')
    }

    if (!form.value.amount || form.value.amount < 10_000) {
      throw new Error('حداقل مبلغ تهاتر ۱۰,۰۰۰ تومان است')
    }

    const barterData = {
      barterUserId: fromUserId,
      userId: toUserId,
      amount: form.value.amount,
      description: form.value.description || null,
    }

    const barterResponse = await userBarterMutation.mutateAsync(barterData)
    const barterId = barterResponse?.data?.barterId

    if (!barterId) {
      throw new Error('شناسه تهاتر دریافت نشد')
    }

    currentBarterId.value = barterId
    otp.value = Array.from({ length: OTP_LENGTH }, () => '')
    otpStep.value = true
    startResendCountdown()

    nextTick(() => {
      otpInputRefs.value[0]?.focus()
    })
    Notif.info('کد تأیید برای کاربران ارسال شد', { group: false })
  } catch (error) {
    Notif.error(handlePaymentError(error), { group: false })
  } finally {
    isSubmitting.value = false
  }
}

const handleConfirmOtp = async () => {
  if (isConfirming.value) return
  if (!currentBarterId.value) {
    Notif.error('شناسه تهاتر نامعتبر است', { group: false })
    return
  }
  if (!isOtpInputValid.value) {
    Notif.error('کد تأیید را به درستی وارد کنید', { group: false })
    return
  }

  try {
    isConfirming.value = true
    const response = await confirmBarterMutation.mutateAsync({
      barterId: currentBarterId.value,
      code: otpCode.value,
    })

    resetOtpState()
    emit('success', response?.data)
  } catch (error) {
    Notif.error(handlePaymentError(error), { group: false })
  } finally {
    isConfirming.value = false
  }
}

const handleOtpKeyDown = (event, index) => {
  if (event.key === 'Backspace' && !otp.value[index] && index > 0) {
    nextTick(() => otpInputRefs.value[index - 1]?.focus())
    return
  }

  if (event.key === 'Enter' && isOtpInputValid.value) {
    handleConfirmOtp()
  }
}

onBeforeUnmount(() => {
  clearResendTimer()
})
</script>

<style lang="scss" scoped>
.user-barter {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__field-group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    &--amount {
      margin-top: 12px;
    }
  }

  &__label {
    font-weight: map-get($text-weights, medium);
    color: #424242;
    margin-bottom: 4px;
    text-align: right;
  }

  &__field {
    margin-bottom: 0;
  }

  &__hint {
    margin-top: 4px;
    text-align: right;
  }

  &__swap-container {
    display: flex;
    justify-content: center;
    padding: 8px 0;
    rotate: 90deg;
  }

  &__swap-btn {
    transform: rotate(90deg);
  }

  &__otp {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__otp-header {
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 20rem;
    width: 100%;
    margin: 0 auto;
    gap: 16px;
  }

  &__otp-icon {
    width: 48px;
    height: 48px;
    background-color: $primary-light;
    color: $primary;
    border-radius: $radius-round;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__otp-divider {
    border: 1px solid $primary;
    width: 100%;
    max-width: 7.25rem;
    height: 1px;
  }

  &__otp-message {
    background-color: $light-blue-light;
    border-radius: $radius-lg;
    padding: 20px 16px;
  }

  &__otp-box {
    justify-content: center;
  }

  &__otp-actions {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  &__otp-resend {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__actions {
    display: flex;
    justify-content: end;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;
  }
}

.otp-input-box {
  display: flex;
  justify-content: center;
  gap: 8px;
  direction: ltr;
  margin-top: 16px;

  &__input {
    width: 40px;
    height: 40px;
    background-color: $white;
    border-radius: $radius-sm;
    border: none;
  }
}
</style>
