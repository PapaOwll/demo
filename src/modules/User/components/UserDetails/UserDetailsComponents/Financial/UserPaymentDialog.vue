<template>
  <Modal
    v-model="isVisible"
    title="افزودن تراکنش"
    persistent
    :show-close="!isSubmitting"
    :min-width="600"
    :width="600"
    :min-height="708"
    class="payment-dialog"
  >
    <TabItem
      v-model="activeTab"
      :group="tabItems"
      style-type="underline"
      class="payment-dialog__tabs"
    />

    <QForm class="payment-dialog__form" @submit.prevent="handleSubmit">
      <button
        type="submit"
        class="payment-dialog__hidden-submit"
        tabindex="-1"
        aria-hidden="true"
      />
      <QTabPanels v-model="activeTab" animated class="payment-dialog__tab-panels">
        <QTabPanel name="pos" class="payment-dialog__tab-panel">
          <SelectField
            v-model="formData.selectedPos"
            label="دستگاه کارتخوان"
            variant="outline"
            :options="posDevicesOptions"
            option-value="id"
            option-label="name"
            emit-value
            map-options
            :loading="isLoadingPosDevices"
            :disable="isSubmitting"
            :error="errors.selectedPos"
            placeholder="دستگاه کارتخوان را انتخاب کنید"
          />
        </QTabPanel>

        <QTabPanel name="barter" class="payment-dialog__tab-panel">
          <UserBarter
            v-if="activeTab === 'barter'"
            :user-id="userId"
            @success="handleBarterSuccess"
            @close="handleBarterClose"
          />
        </QTabPanel>

        <QTabPanel name="cheque" class="payment-dialog__tab-panel">
          <UserCheques :prop-data="userId" @submit="handleChequeSubmit" />
        </QTabPanel>

        <QTabPanel v-if="manualPaymentEnabled" name="manual" class="payment-dialog__tab-panel">
          <ManualPaymentForm
            v-if="activeTab === 'manual'"
            :user-id="userId"
            @success="handleManualSuccess"
            @close="handleManualClose"
          />
        </QTabPanel>
      </QTabPanels>

      <div v-if="activeTab === 'gateway'" class="payment-dialog__notice">
        {{ imagingNoticeText }}
      </div>

      <SelectField
        v-if="activeTab !== 'cheque' && activeTab !== 'barter' && activeTab !== 'manual'"
        :model-value="formData.amountType"
        label="نوع پرداخت"
        variant="outline"
        :options="amountTypeOptions"
        option-value="value"
        option-label="label"
        emit-value
        map-options
        :disable="isSubmitting"
        :error="errors.amountType"
        @update:model-value="onAmountTypeChange"
      />

      <!-- Imaging services card -->
      <ImagingServicesCard
        v-if="
          shouldShowImagingCard &&
          activeTab !== 'cheque' &&
          activeTab !== 'barter' &&
          activeTab !== 'manual'
        "
        ref="imagingCard"
        :disable="isSubmitting"
      />

      <!-- Custom amount input -->
      <div
        v-if="
          shouldShowAmountInput &&
          activeTab !== 'cheque' &&
          activeTab !== 'barter' &&
          activeTab !== 'manual'
        "
        class="payment-dialog__field-group"
      >
        <label class="payment-dialog__label">مبلغ سفارشی</label>
        <CurrencyField
          v-model="formData.customAmount"
          outlined
          dense
          class="payment-dialog__field"
          :error="errors.customAmount ? !!errors.customAmount : null"
          :error-message="errors.customAmount"
          :max="999999999999"
          :min="10000"
          dir="ltr"
          suffix="ریال"
          placeholder=""
        />
        <div
          v-if="amountInPersianText"
          class="payment-dialog__amount-text text-caption text-primary"
        >
          {{ amountInPersianText }}
        </div>
        <div class="payment-dialog__hint text-caption text-grey-6">
          حداقل مبلغ پرداخت: ۱۰,۰۰۰ ریال
        </div>
      </div>
    </QForm>

    <div
      v-if="activeTab !== 'cheque' && activeTab !== 'barter' && activeTab !== 'manual'"
      class="payment-dialog__actions"
    >
      <Button
        v-show="isSubmitting || activeTab !== 'pos'"
        class="payment-dialog__action-btn"
        variant="outline"
        color="grey"
        :is-loading="isSubmitting && !showCancelBtn"
        :text="isSubmitting ? 'لغو پرداخت' : 'انصراف'"
        @click="handleCancel"
      />
      <Button
        class="payment-dialog__action-btn"
        color="light-blue"
        :is-loading="isSubmitting"
        :is-disabled="!canSubmit"
        :text="submitButtonLabel"
        @click="handleSubmit"
      />
    </div>
  </Modal>

  <QDialog v-model="showSuccessDialog" persistent>
    <QCard class="success-dialog">
      <QCardSection class="success-dialog__content">
        <div class="success-dialog__icon">
          <QIcon name="check_circle" size="48px" color="positive" />
        </div>
        <Typography variant="heading" size="h4" class="success-dialog__title">
          پرداخت موفق
        </Typography>
        <Typography variant="body" size="3" color="grey" class="success-dialog__message">
          پرداخت با موفقیت انجام شد
        </Typography>
      </QCardSection>
      <QCardActions class="success-dialog__actions">
        <Button color="light-blue" text="تایید" @click="handleSuccessConfirm" />
      </QCardActions>
    </QCard>
  </QDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Notif } from '@/data/services/notification-service'
import { object, string, number } from 'yup'
import useYup from '@/composables/use-yup'
import { convertRialToTomanText } from '@/utils/persian-number-to-text'
import {
  usePostPosPaymentMutation,
  useGetPosDevicesQuery,
  usePostPosInquiryMutation,
  useCreatePaymentMutation,
  useCreatePaymentLinkMutation,
} from '@/modules/User/query'
import CurrencyField from '@/components/Form/CurrencyField'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import Modal from '@/base/Modal'
import TabItem from '@/base/TabItem'
import SelectField from '@/base/SelectField'
import ImagingServicesCard from './ImagingServicesCard'
import UserCheques from './UserCheques'
import UserBarter from './UserBarter'
import ManualPaymentForm from './ManualPaymentForm'
import { getPerms } from '@/utils/get-perms'
import { useManualPayment } from '@/modules/User/composables/use-manual-payment'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import {
  mockGetPosDevices,
  mockCreatePaymentLink,
  mockCreatePayment,
  mockPosPayment,
  mockPosInquiry,
} from '@/mocks/user-details/financial'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: [String, Number],
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isSubmitting = ref(false)
const showCancelBtn = ref(false)
const updatedFormData = ref(null)
const currentPaymentUuid = ref(null)
const oldPaymentUuid = ref(null)
const abortController = ref(null)
const showSuccessDialog = ref(false)
const isCancelling = ref(false)

const loadOldPaymentUuid = () => {
  const stored = localStorage.getItem(`payment-uuid-${props.userId}`)
  if (stored) {
    oldPaymentUuid.value = stored
  }
}

const savePaymentUuid = (uuid) => {
  localStorage.setItem(`payment-uuid-${props.userId}`, uuid)
}

const clearPaymentUuid = () => {
  localStorage.removeItem(`payment-uuid-${props.userId}`)
  oldPaymentUuid.value = null
  currentPaymentUuid.value = null
}

const { data: posDevices, isLoading: isLoadingPosDevices } = useGetPosDevicesQuery({
  ...(ENABLE_USER_DETAIL_MOCKS ? { queryFn: () => mockGetPosDevices() } : {}),
})

const { isEnabled: manualPaymentEnabled } = useManualPayment()

const createPaymentMutation = useCreatePaymentMutation(
  ENABLE_USER_DETAIL_MOCKS ? { mutationFn: mockCreatePayment } : {}
)
const createPaymentLinkMutation = useCreatePaymentLinkMutation(
  ENABLE_USER_DETAIL_MOCKS ? { mutationFn: mockCreatePaymentLink } : {}
)
const posPaymentMutation = usePostPosPaymentMutation(
  ENABLE_USER_DETAIL_MOCKS ? { mutationFn: mockPosPayment } : {}
)
const posInquiryMutation = usePostPosInquiryMutation(
  ENABLE_USER_DETAIL_MOCKS ? { mutationFn: mockPosInquiry } : {}
)

const initialFormData = ref({
  paymentMethod: 'pos',
  selectedPos: null,
  amountType: 'custom',
  customAmount: null,
})

const formData = computed(() => initialFormData.value)

const activeTab = ref('pos')

watch(activeTab, (newTab) => {
  initialFormData.value.paymentMethod = newTab

  if (newTab !== 'pos') {
    initialFormData.value.selectedPos = null
  }
})

const amountTypeOptions = computed(() => [
  {
    value: 'custom',
    label: 'مبلغ سفارشی',
  },
  // {
  //  value: 'imaging',
  //  label: 'تصویربرداری',
  // },
])

const tabItems = computed(() => {
  const items = [
    { value: 'gateway', label: 'درگاه پرداخت' },
    { value: 'pos', label: 'دستگاه کارتخوان' },
  ]
  if (getPerms('treatment-plan', 'update', true, 'treatmentPlanFinancial')) {
    items.push({ value: 'barter', label: 'تهاتر' })
  }
  items.push({ value: 'cheque', label: 'چک' })
  if (manualPaymentEnabled.value) {
    items.push({ value: 'manual', label: 'پرداخت دستی' })
  }
  return items
})

const imagingCard = ref(null)

const isImaging = computed(() => formData.value.amountType === 'imaging')
const shouldShowImagingCard = computed(() => isImaging.value)
const canSubmit = computed(() => !isImaging.value || !!imagingCard.value?.hasSelection)

const imagingNoticeText = computed(() => {
  return formData.value.paymentMethod === 'gateway'
    ? 'در صورت تایید، لینک پرداخت برای کاربر فرستاده میشه.'
    : 'در صورت تایید، مبلغ از دستگاه کارتخوان دریافت میشه.'
})

const resolvePaymentType = () => (isImaging.value ? 'custom' : formData.value.amountType)

const resolveDescription = () => {
  if (isImaging.value) return imagingCard.value?.getDescription() || 'افزایش موجودی'
  if (formData.value.amountType === 'custom') return 'پرداخت مبلغ سفارشی'
  if (formData.value.amountType === 'prepay') return 'پرداخت بیعانه (خودکار)'
  return 'پیش پرداخت قسط (خودکار)'
}

const posDevicesOptions = computed(() => {
  if (!posDevices.value?.items) return []
  return posDevices.value.items.map((device) => ({
    id: device.key,
    name: device.name || `POS ${device.id}`,
  }))
})

const shouldShowAmountInput = computed(() => {
  return formData.value.amountType === 'custom'
})

const amountInPersianText = computed(() => {
  if (!formData.value.customAmount || formData.value.customAmount <= 0) {
    return ''
  }
  return convertRialToTomanText(formData.value.customAmount)
})

const validationSchema = object().shape({
  paymentMethod: string().required('نحوه پرداخت را انتخاب کنید'),
  amountType: string().required('نوع مبلغ را انتخاب کنید'),
  selectedPos: string().when(['paymentMethod'], ([paymentMethod], schema) => {
    return paymentMethod === 'pos'
      ? schema.required('دستگاه کارتخوان را انتخاب کنید')
      : schema.nullable()
  }),
  customAmount: number()
    .transform((value, originalValue) => {
      if (originalValue === '' || originalValue == null) {
        return 0
      }
      return value
    })
    .when(['amountType'], ([amountType], schema) => {
      return amountType === 'custom'
        ? schema.required('مبلغ را وارد کنید').min(10_000, 'حداقل مبلغ ۱۰,۰۰۰ ریال است')
        : schema.nullable()
    }),
})

const { validate, validateAt, errors, setError } = useYup(validationSchema)

const submitButtonLabel = computed(() => {
  if (!formData.value.paymentMethod) return 'ارسال'

  switch (formData.value.paymentMethod) {
    case 'gateway': {
      return 'ارسال لینک پرداخت'
    }
    case 'pos': {
      return 'ارسال به کارتخوان'
    }
    default: {
      return 'پرداخت'
    }
  }
})

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

const handleBarterSuccess = (paymentData) => {
  emit('submit', {
    userId: props.userId,
    paymentMethod: 'barter',
    paymentData,
  })
  showSuccessDialog.value = true
}

const handleBarterClose = () => {
  isVisible.value = false
}

const handleChange = (field, value) => {
  updatedFormData.value = { ...formData.value, [field]: value }

  validateAt(field, value)

  if (errors.value[field] && value) {
    setError(field, null)
  }
}

const onAmountTypeChange = (value) => {
  initialFormData.value.amountType = value
  if (value !== 'custom') {
    initialFormData.value.customAmount = null
  }
  handleChange('amountType', value)
}

const validateForm = async () => {
  const isValid = await validate(formData.value)
  return { isValid, message: null }
}

const handleSubmit = async () => {
  try {
    abortController.value = new AbortController()
    isSubmitting.value = true

    const validationResult = await validateForm()

    if (!validationResult.isValid) {
      Notif.error(validationResult.message || 'لطفا تمام فیلدهای ضروری را پر کنید', {
        group: false,
      })
      return
    }

    if (
      formData.value.amountType === 'custom' &&
      (!formData.value.customAmount || formData.value.customAmount < 10_000)
    ) {
      Notif.error('لطفا مبلغ معتبر وارد کنید (حداقل ۱۰,۰۰۰ ریال)', { group: false })
      return
    }

    if (isImaging.value && !imagingCard.value?.hasSelection) {
      Notif.error('حداقل یک خدمت پرداختی را انتخاب کنید', { group: false })
      return
    }

    if (formData.value.paymentMethod === 'gateway') {
      const type = resolvePaymentType()
      const description = resolveDescription()
      Notif.info('در حال ایجاد لینک پرداخت...', { group: false, timeout: 2000 })

      const paymentLinkData = {
        type,
        description,
      }

      if (isImaging.value) {
        paymentLinkData.amount = imagingCard.value?.totalRial
        paymentLinkData.metadata = imagingCard.value?.getMetadata()
      } else if (formData.value.amountType === 'custom') {
        paymentLinkData.amount = formData.value.customAmount
      }

      const linkResponse = await createPaymentLinkMutation.mutateAsync({
        userId: props.userId,
        data: paymentLinkData,
      })

      if (linkResponse.data?.success === false) {
        throw new Error(
          linkResponse.data.message || linkResponse.data.error || 'خطا در ایجاد لینک پرداخت'
        )
      }

      emit('submit', {
        ...formData.value,
        userId: props.userId,
        paymentData: linkResponse.data,
        calculatedAmount: linkResponse.data?.amount,
      })

      Notif.success('پیوند پرداخت ارسال شد', { group: false })

      isVisible.value = false
      return
    }

    loadOldPaymentUuid()

    const paymentData = {
      user_id: props.userId,
      type: resolvePaymentType(),
      description: resolveDescription(),
    }

    if (isImaging.value) {
      paymentData.amount = imagingCard.value?.totalRial
      paymentData.metadata = imagingCard.value?.getMetadata()
    } else if (formData.value.amountType === 'custom') {
      paymentData.amount = formData.value.customAmount
    }

    Notif.info('در حال ایجاد تراکنش...', { group: false, timeout: 1000 })

    const paymentResponse = await createPaymentMutation.mutateAsync(paymentData)

    if (paymentResponse.data?.success === false) {
      throw new Error(
        paymentResponse.data.message || paymentResponse.data.error || 'خطا در ایجاد پرداخت'
      )
    }

    showCancelBtn.value = true

    const paymentUuid =
      paymentResponse.data?.payment_uuid || paymentResponse.data?.gatewayReferenceId
    currentPaymentUuid.value = paymentUuid

    if (!paymentUuid) {
      throw new Error('کد تراکنش دریافت نشد')
    }

    savePaymentUuid(paymentUuid)

    if (formData.value.paymentMethod === 'pos' && paymentUuid) {
      Notif.info('درخواست به دستگاه کارتخوان ارسال شد. لطفا عملیات پرداخت را تکمیل کنید...', {
        group: false,
        timeout: 5000,
      })

      const posPaymentData = {
        pos: formData.value.selectedPos,
        payment_uuid: paymentUuid,
      }

      const posResponse = await posPaymentMutation.mutateAsync({
        data: posPaymentData,
        signal: abortController.value.signal,
      })

      if (posResponse.data?.success === false) {
        const isCancellationError =
          posResponse.data?.error === 'CANCELED_BY_SERVER' ||
          posResponse.data?.error === 'CANCELED_BY_POS'

        if (isCancellationError) {
          clearPaymentUuid()

          throw new Error(
            posResponse.data.message || posResponse.data.error || 'خطا در دستگاه کارتخوان'
          )
        }

        throw new Error(
          posResponse.data.message || posResponse.data.error || 'خطا در دستگاه کارتخوان'
        )
      }

      if (posResponse.data.success === true && posResponse.data.status === 'success') {
        clearPaymentUuid()

        emit('submit', {
          ...formData.value,
          userId: props.userId,
          paymentUuid,
          referenceId: posResponse.referenceId,
        })

        showSuccessDialog.value = true
      }
    } else {
      emit('submit', {
        ...formData.value,
        userId: props.userId,
      })

      Notif.success('درخواست پرداخت ایجاد شد', { group: false })
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      if (!isCancelling.value) {
        Notif.warning('درخواست پرداخت لغو شد', { group: false })
      }
      return
    }

    const errorMessage = error.message || ''
    const isCancellationError =
      errorMessage.includes('CANCELED_BY_SERVER') ||
      errorMessage.includes('CANCELED_BY_POS') ||
      error.data?.data?.error === 'CANCELED_BY_SERVER' ||
      error.data?.data?.error === 'CANCELED_BY_POS'

    if (!isCancellationError && oldPaymentUuid.value) {
      try {
        const oldInquiryData = { payment_uuid: oldPaymentUuid.value }
        const oldStatusResponse = await posInquiryMutation.mutateAsync({
          data: oldInquiryData,
        })

        if (
          oldStatusResponse.data?.status === 'success' ||
          oldStatusResponse.status === 'success'
        ) {
          emit('submit', {
            ...formData.value,
            userId: props.userId,
            paymentUuid: oldPaymentUuid.value,
          })

          isVisible.value = false
          return
        }

        if (oldStatusResponse.data?.status === 'failed' || oldStatusResponse.status === 'failed') {
          oldPaymentUuid.value = null
        }
      } catch {
        // Silently ignore
      } finally {
        clearPaymentUuid()
      }
    } else if (isCancellationError) {
      clearPaymentUuid()
    }

    Notif.error(handlePaymentError(error), { group: false })
  } finally {
    isSubmitting.value = false
    showCancelBtn.value = false
    abortController.value = null
  }
}

const resetForm = () => {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }

  updatedFormData.value = null
  initialFormData.value = {
    paymentMethod: 'pos',
    selectedPos: formData.value?.selectedPos || null,
    amountType: 'custom',
    customAmount: null,
  }
  imagingCard.value?.reset()
  activeTab.value = 'pos'

  isSubmitting.value = false
  showCancelBtn.value = false
  currentPaymentUuid.value = null
  isCancelling.value = false

  Object.keys(errors.value).forEach((field) => {
    setError(field, null)
  })
}

const handleCancel = () => {
  if (isSubmitting.value) {
    isCancelling.value = true

    // if (abortController.value) {
    //   abortController.value.abort()
    //   abortController.value = null
    // }

    posInquiryMutation
      .mutateAsync({
        data: { payment_uuid: currentPaymentUuid.value },
      })
      .finally(() => {
        if (currentPaymentUuid.value) {
          clearPaymentUuid()
          currentPaymentUuid.value = null
        }
        isCancelling.value = false
      })

    isSubmitting.value = false
    showCancelBtn.value = false

    Notif.warning('درخواست پرداخت لغو شد', { group: false })
  } else {
    isVisible.value = false
    resetForm()
  }
}

const handleSuccessConfirm = () => {
  showSuccessDialog.value = false
  isVisible.value = false
  resetForm()
}

const handleChequeSubmit = () => {
  isVisible.value = false
  resetForm()
  emit('submit')
}

const handleManualSuccess = () => {
  resetForm()
  emit('submit', { userId: props.userId, paymentMethod: 'manual' })
  isVisible.value = false
}

const handleManualClose = () => {
  isVisible.value = false
}

watch(isVisible, (newValue) => {
  if (newValue) {
    loadOldPaymentUuid()
  } else {
    resetForm()
  }
})
</script>

<style lang="scss" scoped>
.payment-dialog {
  &__hidden-submit {
    position: absolute;
    right: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  &__tabs {
    margin-bottom: $spacing-lg;
  }

  &__tab-panels {
    background: transparent;
  }

  &__tab-panel {
    padding: $spacing-xs;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__field-group {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__label {
    font-weight: map-get($text-weights, medium);
    color: $grey-9;
    margin-bottom: $spacing-xs;
    text-align: right;
  }

  &__field {
    margin-bottom: 0;
  }

  &__notice {
    background: $amber-1;
    border: 1px solid $amber-3;
    color: $amber-10;
    font-size: 12.5px;
    line-height: 1.9;
    border-radius: $radius-sm;
    padding: $spacing-sm $spacing-md;
    margin-bottom: $spacing-sm;
    text-align: right;
  }

  &__hint {
    margin-top: $spacing-xs;
    text-align: right;
  }

  &__amount-text {
    margin-top: $spacing-sm;
    margin-bottom: $spacing-xs;
    text-align: right;
    font-weight: map-get($text-weights, medium);
    direction: rtl;
  }

  &__actions {
    display: flex;
    margin-top: auto;
    padding-top: $spacing-md;
    border-top: 1px solid $grey-3;
    gap: $spacing-sm;
  }

  &__action-btn {
    flex: 1;
  }
}

.success-dialog {
  min-width: 400px;
  max-width: 500px;
  width: 100%;
  border-radius: $radius-lg;
  text-align: center;

  &__content {
    padding: $spacing-2xl $spacing-xl;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-lg;
  }

  &__icon {
    margin-bottom: $spacing-sm;
  }

  &__title {
    margin: 0;
  }

  &__message {
    margin: 0;
  }

  &__actions {
    padding: $spacing-lg $spacing-xl;
    border-top: 1px solid $grey-4;
    justify-content: center;
  }
}
</style>
