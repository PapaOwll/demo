<template>
  <div class="wrapper">
    <QForm v-if="!finished" class="cp" :disable="isFormPending" @submit.prevent="handleSubmitForm">
      <Transition :name="transitionName" mode="out-in">
        <div :key="step" class="cp__content">
          <h4 class="cp__content__title">{{ stepTitle }}</h4>
          <div class="cp__content__subtitle">{{ stepSubtitle }}</div>
          <template v-if="step === 1">
            <div v-if="!isLoggedIn" class="cp__content__field">
              <QInput
                id="mobile"
                v-model="form.mobile"
                hide-bottom-space
                class="simple-input"
                outlined
                clearable
                clear-icon="clear"
                label="شماره موبایل خود را وارد کنید"
                name="mobile"
                :error="!!errorsSendOtp.mobile"
                :error-message="errorsSendOtp.mobile"
              />
            </div>
            <div v-else class="cp__content__field">
              <span class="mobile-number-display">{{ form.mobile }}</span>
            </div>
          </template>
          <template v-else-if="step === 2">
            <!-- Verify -->
            <div class="verify-section">
              <p v-if="preNumber" class="verify-section__subtitle">
                با شماره زیر با شما تماس می‌گیریم. ادامه شماره را وارد کنید.
              </p>
              <div class="verify-section__inputs" style="direction: ltr">
                <div class="verify-section__prenumber">
                  <span v-if="preNumber" class="prenumber">{{ preNumber }}</span>
                </div>
                <div
                  :class="preNumber ? 'verify-section__otp' : 'verify-section__otp--full'"
                  class="otp-input-box"
                >
                  <QInput
                    v-for="(_, index) in otp"
                    :key="index"
                    ref="inputRefs"
                    v-model="otp[index]"
                    dense
                    outlined
                    maxlength="1"
                    class="otp-input-box__input"
                    input-class="text-center text-h6"
                    type="text"
                    @update:model-value="(val) => handleInput(index, val)"
                    @keydown="(event) => handleKeyDown(event, index)"
                    @paste.prevent="handlePaste"
                  />
                </div>
              </div>
            </div>
            <div class="row justify-center q-my-md">
              <div v-if="timer.time !== 0" class="login__timer">
                <span>اعتبار کد:</span>
                {{ timer.formattedTime }}
              </div>
            </div>
            <div class="cp__content__edit">
              <QBtn unelevated class="back-btn" @click="onChangeStep('sendOtp')">
                <IconPencil width="30px" class="cp__content__edit__icon" />
                <span>اصلاح شماره موبایل</span>
              </QBtn>
            </div>
          </template>
          <template v-else-if="step === 3">
            <div class="cp__content__field">
              <QInput
                id="password"
                v-model="form.password"
                hide-bottom-space
                class="simple-input"
                label="رمز عبور جدید را وارد کنید"
                name="password"
                type="password"
                outlined
                clearable
                clear-icon="clear"
                :error="!!errorsResetPassword.password"
                :error-message="errorsResetPassword.password || null"
              />
            </div>
            <div class="cp__content__field">
              <QInput
                id="confirmPassword"
                v-model="form.confirmPassword"
                hide-bottom-space
                type="password"
                outlined
                clearable
                clear-icon="clear"
                class="simple-input"
                label="رمز عبور جدید را تکرار کنید"
                name="confirmPassword"
                :error="!!errorsResetPassword.confirmPassword"
                :error-message="errorsResetPassword.confirmPassword || null"
              />
            </div>
            <div class="cp__content__edit">
              <QBtn unelevated class="back-btn" @click="onChangeStep('sendOtp')">
                <IconPencil width="30px" class="cp__content__edit__icon" />
                <span>بازگشت</span>
              </QBtn>
            </div>
          </template>
          <QBtn
            type="submit"
            :loading="isFormPending"
            class="cp__content__btn"
            color="primary"
            unelevated
            size="lg"
          >
            {{ stepBtnLabel }}
          </QBtn>
        </div>
      </Transition>
    </QForm>
    <template v-else>
      <div class="result-box">
        <SuccessResult v-if="isSuccess" />
        <ErrorResult v-else />
        <div class="space" />
        <QBtn class="back-btn" flat @click="handleBack">بازگشت</QBtn>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { object, string } from 'yup'
import { IconPencil } from '@tabler/icons-vue'
import { useTimer } from '@/composables/use-timer'
import useYup from '@/composables/use-yup'
import { handleError } from '@/utils/error-handler'
import { useSendOtpMutation } from '@/modules/Auth/query'
import { useResetPasswordMutation } from '@/modules/Settings/PersonalSetting/query'
import SuccessResult from '../SuccessResult'
import ErrorResult from '../ErrorResult'
import { useUserStore } from '@/store/user'
import { convertToEnNumber } from '@/utils/convert-check-digits'
import { Notif } from '@/data/services/notification-service'

const { startTimer, timer, stopTimer } = useTimer(45)
const userStore = useUserStore()
/*
  step 1 : 'send-otp',
  step 2 : 'confirm-otp',
  step 3 : 'reset-password'
*/
const step = ref(1)
const finished = ref(false)
const isSuccess = ref(false)
const isDirectionRight = ref(true)

// OTP verification state
const INPUT_LENGTH = ref(4)
const otp = ref([])
const inputRefs = ref([])
const preNumber = ref('')

const form = ref({
  mobile: null,
  uuid: null,
  code: null,
  password: null,
  confirmPassword: null,
})

const transitionName = computed(() => {
  return isDirectionRight.value ? 'slide-right' : 'slide-left'
})

const sendOtpSchema = object().shape({
  mobile: string().required('فیلد شماره موبایل ضروری است.'),
})

const resetPasswordSchema = object().shape({
  password: string().required('فیلد رمز عبور الزامی است'),
  confirmPassword: string().required('فیلد تکرار رمز عبور اجباری است'),
})

const { validate: validateSendOtp, errors: errorsSendOtp } = useYup(sendOtpSchema)
const { validate: validateResetPassword, errors: errorsResetPassword } = useYup(resetPasswordSchema)

const { mutate: mutateSendOtp, isPending: isSendOtpPending } = useSendOtpMutation()
const { mutate: mutateResetPassword, isPending: isResetPasswordPending } =
  useResetPasswordMutation()

const handleSubmitForm = async () => {
  switch (step.value) {
    case 1: {
      const { isValid } = await validateSendOtp({ mobile: form.value.mobile })
      if (!isValid) return

      mutateSendOtp(
        { mobile: form.value.mobile },
        {
          onSuccess: (response) => {
            step.value = 2
            form.value.uuid = response?.data?.uuid
            preNumber.value = response?.data?.verifierNumber || ''
            INPUT_LENGTH.value = response?.data?.skippedCount || 4
            otp.value = Array.from({ length: INPUT_LENGTH.value }, () => '')
            startTimer(() => {
              if (step.value === 2) step.value = 1
              form.value.code = null
            })
          },
          onError: (error) => {
            handleError(error)
          },
        }
      )
      break
    }
    case 2: {
      // Check if OTP is complete
      if (!form.value.code || form.value.code.length !== INPUT_LENGTH.value) {
        Notif.error('لطفا کد تایید را کامل وارد کنید')
        return
      }

      // Move to step 3 - OTP will be verified when submitting the new password
      step.value = 3
      stopTimer()
      break
    }
    case 3: {
      const { isValid } = await validateResetPassword({
        password: form.value.password,
        confirmPassword: form.value.confirmPassword,
        uuid: form.value.uuid,
      })
      if (!isValid) return
      if (form.value.password !== form.value.confirmPassword) {
        Notif.error('مقدار تکرار رمز عبور با رمز عبور یکی نیست')
        return
      }
      const body = {
        mobile: form.value.mobile,
        code: form.value.code,
        password: form.value.password,
        password_confirmation: form.value.password,
        uuid: form.value.uuid,
      }
      mutateResetPassword(body, {
        onSuccess: (response) => {
          Notif.success(response.message)
          finished.value = true
          isSuccess.value = true
        },
        onError: (error) => {
          handleError(error, { showToast: true, glitchtipLog: false })
        },
      })
      break
    }
    default: {
      break
    }
  }
}

const isFormPending = computed(() => {
  return isSendOtpPending.value || isResetPasswordPending.value
})

const isLoggedIn = computed(() => !!userStore.mobile)

onMounted(() => {
  if (isLoggedIn.value) {
    form.value.mobile = userStore.mobile
  }
  // Initialize OTP array
  otp.value = Array.from({ length: INPUT_LENGTH.value }, () => '')
})

const stepTitle = computed(() => {
  const titles = {
    1: 'تغییر رمز عبور',
    2: 'تایید شماره موبایل',
    3: 'تنظیم رمز عبور جدید',
  }
  return titles[step.value] || 'تغییر رمز عبور'
})

const stepSubtitle = computed(() => {
  const subtitles = {
    1: isLoggedIn.value
      ? 'در حال تغییر رمز عبور برای شماره زیر'
      : 'شماره موبایل خود را برای دریافت کد تایید وارد کنید',
    2: `کد ۴ رقمی ارسال شده به ${form.value.mobile} را وارد کنید`,
    3: 'رمز عبور جدید خود را وارد کنید',
  }
  return subtitles[step.value]
})

const stepBtnLabel = computed(() => {
  const labels = {
    1: 'دریافت کد تایید',
    2: 'تایید و ادامه',
    3: 'تغییر رمز عبور',
  }
  return labels[step.value] || 'دریافت کد تایید'
})

const handleInput = (index, value) => {
  if (!value) {
    otp.value[index] = ''
    form.value.code = otp.value.join('')
    return
  }

  const convertedValue = convertToEnNumber(value)

  const lastChar = convertedValue.slice(-1)
  otp.value[index] = /^\d$/.test(lastChar) ? lastChar : ''

  form.value.code = otp.value.join('')

  if (otp.value[index] && index < INPUT_LENGTH.value - 1) {
    inputRefs.value[index + 1]?.focus()
  }

  if (form.value.code && form.value.code.length === INPUT_LENGTH.value && step.value === 2) {
    handleSubmitForm()
  }
}

const handleKeyDown = (event, index) => {
  if (event.key === 'Backspace' && !otp.value[index] && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
}

const handlePaste = (event) => {
  const pastedData = event.clipboardData.getData('text')
  const convertedData = convertToEnNumber(pastedData)

  const digitsOnly = convertedData.replace(/\D/g, '').slice(0, INPUT_LENGTH.value)

  ;[...digitsOnly].forEach((char, i) => {
    otp.value[i] = char
  })

  form.value.code = otp.value.join('')
  // Focus the last filled input or the first empty one
  const nextIndex = Math.min(digitsOnly.length, INPUT_LENGTH.value - 1)
  inputRefs.value[nextIndex]?.focus()

  if (form.value.code && form.value.code.length === INPUT_LENGTH.value && step.value === 2) {
    handleSubmitForm()
  }
}

const resetForm = () => {
  finished.value = false
  isSuccess.value = false
  step.value = 1
  form.value = {
    mobile: isLoggedIn.value ? userStore.mobile : null,
    code: null,
    uuid: null,
    password: null,
    confirmPassword: null,
  }
  otp.value = []
  preNumber.value = ''
}

const onChangeStep = (method) => {
  switch (method) {
    case 'sendOtp': {
      step.value = 1
      break
    }
    case 'confirmOtp': {
      step.value = 2
      break
    }
    case 'resetPassword': {
      step.value = 3
      break
    }
    case 'verifyMissCall': {
      step.value = 2
      break
    }
    default: {
      step.value = 1
      break
    }
  }
}

const handleBack = async () => {
  isDirectionRight.value = false

  resetForm()
  setTimeout(() => {
    isDirectionRight.value = true
  }, 200)
}
</script>
<style scoped lang="scss">
.wrapper {
  margin: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  align-items: center;
  max-width: 500px;
  width: 100%;
}

.verify-section {
  width: 100%;
  margin-bottom: 1.5rem;

  &__subtitle {
    font-size: map-get($subtitle1, size);
    color: $grey-6;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  &__inputs {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 0.75rem;
    justify-content: center;
  }

  &__prenumber {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: fit-content;
  }

  &__otp {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
    letter-spacing: 1rem;
    flex: 1;

    &--full {
      width: 100%;
      justify-content: center;
    }
  }
}

.prenumber {
  letter-spacing: 8px;
  font-size: map-get($h4, size);
  color: $grey-9;
  direction: ltr;
  text-align: center;
}

.otp-input-box {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  letter-spacing: 1rem;

  &__input {
    :deep(.q-field__control) {
      width: 56px;
      height: 56px;
      border-radius: 8px !important;
    }

    :deep(input) {
      font-size: map-get($h5, size);
      font-weight: 600;
      text-align: center;
    }
  }
}

.cp {
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  position: relative;

  &__content {
    width: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__content__title {
    font-size: map-get($h5, size);
    color: $grey-9;
    font-weight: bold;
    text-align: center;
  }

  &__content__subtitle {
    font-size: map-get($h6, size);
    color: $grey-6;
    text-align: center;
    margin-bottom: 1.5rem;
  }

  &__content__field {
    width: 100%;
    margin-bottom: 1rem;
    display: flex;
    justify-content: center;
  }

  &__content__edit {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 1rem;
  }

  &__content__edit__icon {
    margin-left: 0.5rem;
  }

  &__content__btn {
    width: 100%;
    font-size: map-get($subtitle1, size);
    border-radius: 8px;
    margin-top: 1rem !important;
  }
}

.back-btn {
  font-size: map-get($subtitle1, size);
  padding: 0;
  color: $blue-6;
}

.login__timer {
  font-size: map-get($subtitle1, size);
  color: $grey-6;
  display: flex;
  gap: 4px;
  margin: 16px 0;
}

:deep(.simple-input) {
  width: 100%;
  :deep(.q-field__control) {
    border-radius: 8px !important;
    font-size: 18px;
  }

  input::placeholder {
    font-size: map-get($body2, size);
    color: $grey-6;
  }
}

.mobile-number-display {
  font-size: map-get($h4, size);
  font-weight: 600;
  color: $grey-9;
  letter-spacing: 2px;
  direction: ltr;
  text-align: center;
}

.result-box {
  text-align: center;
}

.space {
  margin-bottom: 8rem;
}

.slide-right-enter-active,
.slide-left-enter-active,
.slide-right-leave-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
  position: absolute;
  width: 100%;
}

.slide-right-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-left-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

@media only screen and (max-width: 770px) {
  .wrapper {
    width: 100%;
  }
}
</style>
