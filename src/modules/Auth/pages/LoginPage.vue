<template>
  <div class="form">
    <div>
      <img src="/src/assets/images/layout/HeaderContainer.png" alt="logo" />
      <div v-if="state === 'verifyOtp' || state === 'verifyMissCall'" class="row">
        <QBtn unelevated class="back-btn" @click="onChangeMobile">
          <IconArrowRight size="32" />
        </QBtn>
      </div>
      <p class="text-h5 q-my-md">{{ mainTitle }}</p>
      <p class="text-grey-6 text-h6">{{ subtitle }}</p>
    </div>
    <div>
      <QForm novalidate @submit.prevent="onAction">
        <!--        Login By Password-->
        <QInput
          v-if="state !== 'verifyOtp' && state !== 'verifyMissCall'"
          v-model="phoneNumber"
          placeholder="شماره موبایل"
          name="mobile"
          class="login__input"
          size="lg"
          outlined
          clearable
          clear-icon="clear"
          :disable="loadingList"
          :error="!!phoneError"
          :error-message="phoneError"
          @update:model-value="mobileValidation"
        />
        <QInput
          v-if="state === 'loginPassword'"
          v-model="password"
          placeholder="رمز عبور "
          class="login__input"
          type="password"
          name="password"
          size="lg"
          outlined
          :disable="loadingList"
        />
        <!--        Verify-->
        <div v-if="state === 'verifyOtp' || state === 'verifyMissCall'">
          <p v-if="preNumber" class="text-h6 text-grey-6">
            از شماره زیر با شما تماس میگیریم. شماره را کامل کنید.
          </p>
          <div class="verify-section" style="direction: ltr">
            <div class="col-md-3">
              <span v-if="preNumber" class="prenumber">{{ preNumber }}</span>
            </div>
            <div :class="preNumber ? 'col-md-9' : 'col-12'" class="otp-input-box">
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
                @update:model-value="(val) => handleInput(index, val)"
                @keydown="(event) => handleKeyDown(event, index)"
                @paste.prevent="handlePaste"
              />
            </div>
          </div>
        </div>
        <!--Timer-->
        <div class="row justify-center q-my-md">
          <div v-if="state === 'verifyMissCall' && timer.time != 0" class="login__timer">
            <span>زمان باقی مانده:</span>
            {{ timer.formattedTime }}
          </div>
          <QBtn
            v-if="state === 'verifyMissCall' && timer.time == 0"
            flat
            color="primary"
            :disable="retryPending"
            :loading="retryPending"
            @click="retrySendOtp"
          >
            درخواست رمز جدید
          </QBtn>
        </div>
        <!--        Action-->
        <QBtn
          class="full-width rounded-borders"
          color="primary"
          type="submit"
          size="lg"
          unelevated
          :loading="loadingList"
          :disable="submitValidation"
        >
          {{ actionTitle }}
        </QBtn>

        <!--        Req For MissCall-->
        <div v-if="state === 'loginPassword'" class="forget-password">
          <div class="divider">رمز عبور خود را فراموش کرده‌اید؟</div>
          <QBtn
            unelevated
            color="blue-1"
            text-color="blue-6"
            class="login__main-action-btn"
            label="دریافت کد یکبار مصرف"
            size="lg"
            @click="onChangeLoginMethod('missCall')"
          />
        </div>
        <!--        Req For OTP or Password-->
        <div v-if="state !== 'loginPassword'" class="forget-password">
          <div class="divider">از راه دیگری میخواهید وارد شوید؟</div>
          <div class="row q-col-gutter-sm full-width">
            <div v-if="state !== 'loginMissCall' && state !== 'verifyMissCall'" class="col">
              <QBtn
                unelevated
                class="rounded-borders full-width text-subtitle1"
                color="blue-1"
                size="lg"
                text-color="blue-6"
                label="ورود با تماس"
                @click="onChangeLoginMethod('missCall')"
              />
            </div>
            <!--            <div v-if="state !== 'loginOtp' && state !== 'verifyOtp'" class="col-md-6 col">-->
            <!--              <QBtn-->
            <!--                unelevated-->
            <!--                class="rounded-borders full-width text-subtitle1"-->
            <!--                color="blue-1"-->
            <!--                size="lg"-->
            <!--                text-color="blue-6"-->
            <!--                label="ورود با کد یکبار مصرف"-->
            <!--                @click="onChangeLoginMethod('otp')"-->
            <!--              />-->
            <!--            </div>-->
            <div v-if="state !== 'loginPassword'" class="col">
              <QBtn
                unelevated
                class="rounded-borders full-width text-subtitle1"
                color="blue-1"
                size="lg"
                text-color="blue-6"
                label="ورود با رمز عبور"
                @click="onChangeLoginMethod('loginPassword')"
              />
            </div>
          </div>
        </div>
      </QForm>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useTimer } from '@/composables/use-timer'
import { handleSuccessLogin } from '@/utils/auth'
import { setIndustrySlug } from '@/utils/get-industry-slug'
import { useLoginMutation, useRetrySendOtpMutation, useSendOtpMutation } from '../query'
import { IconArrowRight } from '@tabler/icons-vue'
import { convertToEnNumber } from '@/utils/convert-check-digits'
import { useQueryClient } from '@tanstack/vue-query'
import { Notif } from '@/data/services/notification-service'

const queryClient = useQueryClient()
const INPUT_LENGTH = ref(null)

const MainTitleEnum = {
  loginMissCall: 'ورود با کد یکبار مصرف',
  loginOtp: 'ورود با کد یکبار مصرف',
  loginPassword: 'ورود',
  verifyMissCall: 'ورود با کد یکبار مصرف',
  verifyOtp: 'ورود با کد یکبار مصرف',
}
const SubtitleEnum = {
  loginMissCall: 'لطفا جهت ورود شماره موبایل خود را وارد کنید',
  loginOtp: 'لطفا جهت ورود کد تایید را وارد کنید',
  loginPassword: 'برای ورود به پنل اطلاعات زیر را وارد کنید',
}
const ActionTitleEnum = {
  loginOtp: 'درخواست رمز یکبار مصرف',
  loginMissCall: 'درخواست رمز یکبار مصرف',
  verifyOtp: 'ورود',
  verifyMissCall: 'ورود',
  loginPassword: 'ورود',
}

const password = ref('')
const phoneNumber = ref('')
const phoneError = ref(null)
const uuid = ref(null)
const preNumber = ref(null)
const state = ref('loginPassword')
const inputRefs = ref([])
const otp = ref([])

const mainTitle = computed(() => MainTitleEnum[state.value])
const subtitle = computed(() => SubtitleEnum[state.value])
const actionTitle = computed(() => ActionTitleEnum[state.value])
const fullCode = computed(() => {
  return otp.value.every((digit) => digit && /^\d$/.test(digit)) ? otp.value.join('') : ''
})

const router = useRouter()
const userStore = useUserStore()
const { startTimer, timer } = useTimer(45)
const { mutate: loginMutate, isPending: loginLoading } = useLoginMutation()
const { mutate: sendOtpMutate, isPending: sendOtpLoading } = useSendOtpMutation()
const { mutate: retryOtpMutate, isPending: retryPending } = useRetrySendOtpMutation()

const loadingList = computed(() => loginLoading.value || sendOtpLoading.value || false)
const { resetLoginState, refetchCurrentUser } = userStore

const mobileValidation = () => {
  phoneError.value = /^09\d{9}$/.test(convertToEnNumber(phoneNumber.value))
    ? null
    : 'شماره موبایل باید با 09 شروع شود و 11 رقم باشد'
}

const handleInput = (index, value) => {
  const converted = convertToEnNumber(value)

  if (/^\d$/.test(converted)) {
    otp.value[index] = converted
    nextTick(() => {
      inputRefs.value[index + 1]?.focus()
    })
  } else {
    otp.value[index] = ''
  }
}

const handleKeyDown = (event, index) => {
  if (event.key === 'Backspace') {
    if (!otp.value[index] && index > 0) {
      nextTick(() => {
        inputRefs.value[index - 1].focus()
      })
    } else if (index === INPUT_LENGTH.value - 1 && otp.value[index]) {
      otp.value[index] = ''
      nextTick(() => {
        inputRefs.value[index - 1].focus()
      })
    }
  }
}

const handlePaste = (event) => {
  const pastedData = convertToEnNumber(event.clipboardData.getData('text').trim())

  if (/^\d+$/.test(pastedData)) {
    ;[...pastedData].forEach((char, index) => {
      if (index < INPUT_LENGTH.value) {
        otp.value[index] = char
      }
    })
    const lastPastedIndex = Math.min(pastedData.length, INPUT_LENGTH.value) - 1
    inputRefs.value[lastPastedIndex].$el.querySelector('input').focus()
  }
}

const onChangeLoginMethod = (method) => {
  switch (method) {
    case 'missCall': {
      state.value = 'loginMissCall'
      break
    }
    case 'otp': {
      state.value = 'loginOtp'
      break
    }
    case 'loginPassword': {
      state.value = 'loginPassword'
      break
    }
    default: {
      state.value = 'loginPassword'
      break
    }
  }
}

const onChangeMobile = () => {
  switch (state.value) {
    case 'verifyOtp': {
      state.value = 'loginOtp'
      break
    }
    case 'verifyMissCall': {
      state.value = 'loginMissCall'
      break
    }
    default: {
      break
    }
  }
}

const afterSuccessLogin = ({ data }) => {
  Notif.success('ورود با موفقیت انجام شد')
  if (data?.token) {
    handleSuccessLogin(data.token)
    setIndustrySlug(data)
    queryClient.clear()
    setTimeout(() => {
      resetLoginState()
      refetchCurrentUser()
      router.push({ path: '/' })
    }, 0)
  }
}

const loginWithPassword = () => {
  loginMutate(
    {
      mobile: convertToEnNumber(phoneNumber.value),
      password: password.value,
    },
    {
      onSuccess: (res) => afterSuccessLogin(res),
    }
  )
}

const afterSendOtp = (type) => {
  const message =
    state.value === 'loginMissCall'
      ? 'درخواست تماس شما با موفقیت ثبت شد'
      : 'کد تایید با موفقیت ارسال شد'

  Notif.success(message)
  type === 'missed_call' ? (state.value = 'verifyMissCall') : (state.value = 'verifyOtp')
  startTimer()
}

const sendOtp = () => {
  sendOtpMutate(
    {
      mobile: convertToEnNumber(phoneNumber.value),
    },
    {
      onSuccess: (res) => {
        uuid.value = res?.data?.uuid
        preNumber.value = res?.data?.verifierNumber
        INPUT_LENGTH.value = res?.data?.skippedCount
        afterSendOtp(res?.data?.type)
      },
    }
  )
}

const retrySendOtp = () => {
  retryOtpMutate(
    {
      mobile: convertToEnNumber(phoneNumber.value),
      uuid: uuid.value,
    },
    {
      onSuccess: (res) => {
        uuid.value = res?.data?.uuid
        preNumber.value = res?.data?.verifierNumber
        INPUT_LENGTH.value = res?.data?.skippedCount
        afterSendOtp(res?.data?.type)
      },
    }
  )
}

const loginWithOtp = () => {
  loginMutate(
    {
      mobile: convertToEnNumber(phoneNumber.value),
      code: fullCode.value,
      uuid: uuid.value,
    },
    {
      onSuccess: (res) => afterSuccessLogin(res),
      onError: () => {
        otp.value = Array.from({ length: INPUT_LENGTH.value }).fill('')
        nextTick(() => {
          inputRefs.value[0]?.focus()
        })
      },
    }
  )
}

const submitValidation = computed(() =>
  state.value === 'loginPassword'
    ? loadingList.value || !password.value || !!phoneError.value
    : state.value === 'loginMissCall'
      ? !phoneNumber.value || loadingList.value || !!phoneError.value
      : loadingList.value || !fullCode.value || !!phoneError.value
)

const onAction = () => {
  if (state.value === 'loginMissCall' || state.value === 'loginOtp') {
    sendOtp()
    return
  }

  if (state.value === 'verifyOtp') {
    loginWithOtp()
    return
  }
  if (state.value === 'verifyMissCall') {
    loginWithOtp()
    return
  }

  if (state.value === 'loginPassword') {
    loginWithPassword()
  }
}
watch(INPUT_LENGTH, (len) => {
  if (len) {
    otp.value = Array.from({ length: len }).fill('')
    nextTick(() => {
      inputRefs.value[0]?.focus()
    })
  }
})
watch(fullCode, (newValue) => {
  if (
    newValue.length === INPUT_LENGTH.value &&
    (state.value === 'verifyOtp' || state.value === 'verifyMissCall')
  ) {
    onAction()
  }
})
</script>

<style lang="scss" scoped>
.form {
  margin: auto;
  width: 55%;
  img {
    margin-bottom: 2rem;
  }
}
.login {
  &__input {
    width: 100%;
    margin-bottom: 1rem;
    :deep(.q-field__control) {
      border-radius: 8px !important;
      font-size: 18px;
    }
  }

  &__main-action-btn {
    width: 100%;
    margin: 1rem 0;
    border-radius: 8px;
  }

  &__timer {
    font-size: map-get($subtitle1, size);
    color: var($gray-500);
    display: flex;
    gap: 4px;
    margin: 16px 0;
  }
}
.forget-password {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.divider {
  display: flex;
  align-items: center;
  text-align: center;
  width: 100%;
  margin: 20px 0;
  max-width: 400px;
  color: $grey-9;
}
.divider::before {
  content: '';
  flex: 1;
  border-bottom: 1px solid #dbdbdb;
  margin-left: 1.5em;
}
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #dbdbdb;
  margin-right: 1.5em;
}
.otp-input-box {
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 0.75rem;
  letter-spacing: 1rem;
  &__input {
    :deep(.q-field__control) {
      width: 56px;
      height: 56px;
      border-radius: 8px !important;
    }
  }
}
.prenumber {
  letter-spacing: 8px;
  font-size: map-get($h4, size);
}
.verify-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
}
.back-btn {
  padding: 0;
}
@media only screen and (max-width: 770px) {
  .form {
    width: 100%;
  }
}
</style>
