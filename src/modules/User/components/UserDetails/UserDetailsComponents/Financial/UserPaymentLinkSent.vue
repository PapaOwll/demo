<template>
  <div class="payment-link-sent">
    <div class="payment-link-sent__header">
      <div class="payment-link-sent__badge">
        <IconCheck :size="26" />
      </div>
      <Typography variant="heading" size="h6" class="payment-link-sent__title">
        لینک ارسال شد
      </Typography>
      <Typography variant="body" size="3" color="grey">
        همچنین می تونید QR کد رو با موبایل مشتری اسکن کنید یا لینک پرداخت زیر رو برای ارسال به مشتری
        در پیام‌رسان‌ها کپی کنید.
      </Typography>
    </div>

    <QrCode :value="paymentRequest.link" :size="148" class="payment-link-sent__qr" />

    <div class="payment-link-sent__link-box">
      <Typography variant="body" size="3" dir="ltr" class="payment-link-sent__link">
        {{ paymentRequest.link }}
      </Typography>
      <Button
        variant="flat"
        color="grey"
        is-rounded
        is-icon-only
        :left-icon="IconCopy"
        @click="handleCopy"
      />
    </div>

    <div class="payment-link-sent__meta">
      <div class="payment-link-sent__meta-row">
        <Typography variant="body" size="3" color="grey">مبلغ:</Typography>
        <Typography variant="body" size="3" weight="medium">{{ formattedAmount }} ریال</Typography>
      </div>
      <div v-if="deadlineText" class="payment-link-sent__meta-row">
        <Typography variant="body" size="3" color="grey">مهلت پرداخت:</Typography>
        <Typography variant="body" size="3" weight="medium">{{ deadlineText }}</Typography>
      </div>
    </div>

    <div class="payment-link-sent__actions">
      <Button
        class="payment-link-sent__action-btn"
        color="light-blue"
        :left-icon="IconRefresh"
        :is-loading="isResending"
        text="ارسال مجدد پیامک"
        @click="handleResend"
      />
      <Button
        class="payment-link-sent__action-btn"
        variant="outline"
        color="grey"
        text="بستن"
        @click="emit('close')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IconCheck, IconCopy, IconRefresh } from '@tabler/icons-vue'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import QrCode from '@/components/QrCode'
import { copyToClipboard } from '@/utils/copy-to-clipboard'
import { numberSeparator } from '@/utils/formatter'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import { getApiErrorMessage } from '@/utils/api-error-message'
import { Notif } from '@/data/services/notification-service'
import { useResendPaymentLinkSmsMutation } from '@/modules/User/query'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import { mockResendPaymentLinkSms } from '@/mocks/user-details/financial'

interface PaymentLinkRequest {
  paymentRequestId: number
  link: string
  amount?: number | null
  expireAt?: string | null
}

const props = defineProps<{ paymentRequest: PaymentLinkRequest }>()

const emit = defineEmits<{
  resent: [payload: PaymentLinkRequest]
  close: []
}>()

const resendMutation = useResendPaymentLinkSmsMutation(
  ENABLE_USER_DETAIL_MOCKS ? { mutationFn: mockResendPaymentLinkSms } : {}
)
const isResending = computed(() => resendMutation.isPending.value)

const formattedAmount = computed(() => numberSeparator(props.paymentRequest.amount))

const deadlineText = computed(() => {
  const { expireAt } = props.paymentRequest
  if (!expireAt) return ''
  return convertToJalaliWithTime(String(expireAt).replace(' ', 'T'))
})

const handleCopy = () => {
  copyToClipboard(props.paymentRequest.link)
  Notif.info('کپی شد')
}

const handleResend = async () => {
  try {
    const response = await resendMutation.mutateAsync({
      paymentRequestId: props.paymentRequest.paymentRequestId,
    })
    const payload = response?.data
    if (payload?.link) {
      emit('resent', payload)
    }
    Notif.success('پیامک لینک پرداخت مجدداً ارسال شد', { group: false })
  } catch (error) {
    Notif.error(getApiErrorMessage(error, 'خطا در ارسال مجدد پیامک'), { group: false })
  }
}
</script>

<style lang="scss" scoped>
.payment-link-sent {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-lg;

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-sm;
    text-align: center;
  }

  &__badge {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    color: white;
    background: linear-gradient(135deg, $green-5, $green-7);
    border-radius: $radius-round;
    animation: payment-link-sent-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      border-radius: inherit;
      background: $green-light;
      animation: payment-link-sent-pulse 1.8s ease-out infinite;
    }
  }

  &__title {
    margin: 0;
    background: linear-gradient(135deg, $green-6, $teal-5);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }

  &__qr {
    margin: $spacing-sm 0;
  }

  &__link-box {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    width: 100%;
    padding: $spacing-xs $spacing-sm;
    background: $grey-2;
    border-radius: $radius-sm;
  }

  &__link {
    flex: 1;
    direction: ltr;
    text-align: left;
    word-break: break-all;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    width: 100%;
  }

  &__meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
    width: 100%;
    margin-top: auto;
    padding-top: $spacing-md;
    border-top: 1px solid $grey-3;
  }

  &__action-btn {
    flex: 1;
  }
}

@keyframes payment-link-sent-pop {
  from {
    transform: scale(0);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes payment-link-sent-pulse {
  0% {
    transform: scale(1);
    opacity: 0.9;
  }

  70% {
    transform: scale(1.7);
    opacity: 0;
  }

  100% {
    transform: scale(1.7);
    opacity: 0;
  }
}
</style>
