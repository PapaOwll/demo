<template>
  <div class="manual-payment-form">
    <QForm class="manual-payment-form__form" @submit.prevent="handleSubmit">
      <button
        type="submit"
        class="manual-payment-form__hidden-submit"
        tabindex="-1"
        aria-hidden="true"
      />

      <SelectField
        v-model="form.type"
        label="نوع پرداخت"
        variant="outline"
        :options="typeOptions"
        option-value="value"
        option-label="label"
        emit-value
        map-options
        required
        placeholder="نوع پرداخت را انتخاب کنید"
        :disable="isPending"
        :error="!!errors.type"
        :error-message="errors.type"
        @update:model-value="clearFieldError('type')"
      />

      <div class="manual-payment-form__field-group">
        <div class="manual-payment-form__label">مبلغ</div>
        <CurrencyField
          v-model="form.amount"
          class="manual-payment-form__field"
          outlined
          dense
          suffix="ریال"
          dir="ltr"
          placeholder=""
          :error-message="errors.amount"
          @update:model-value="clearFieldError('amount')"
        />
        <div v-if="amountInPersianText" class="manual-payment-form__amount-text">
          {{ amountInPersianText }}
        </div>
      </div>

      <div class="manual-payment-form__row">
        <PersianDate
          :model-value="form.paidAtDate"
          class="manual-payment-form__field"
          label="تاریخ پرداخت"
          placeholder="اختیاری"
          :disable="isPending"
          @update:model-value="form.paidAtDate = $event"
        />
        <TimeField
          v-model="form.paidAtTime"
          class="manual-payment-form__field"
          label="ساعت پرداخت"
          placeholder="اختیاری"
          :disable="isPending || !form.paidAtDate"
        />
      </div>
      <div class="manual-payment-form__hint">
        در صورت خالی گذاشتن، زمان ثبت لحظه در نظر گرفته می‌شود.
      </div>

      <TextField
        v-model="form.reference"
        label="شماره پیگیری / فیش"
        variant="outline"
        :maxlength="100"
        show-character-count
        placeholder="شماره فیش، پیگیری یا رسید POS"
        :disable="isPending"
      />

      <TextField
        v-model="form.description"
        label="توضیحات"
        variant="outline"
        autogrow
        :maxlength="500"
        show-character-count
        placeholder="توضیحات اختیاری"
        :disable="isPending"
      />

      <div class="manual-payment-form__field-group">
        <div class="manual-payment-form__label">فیش / رسید پرداخت (اختیاری)</div>
        <BaseUploader
          ref="uploaderRef"
          enum-type="financial.manual-payment"
          :auto-upload="false"
          :max-file-size="1048576 * 10"
          accept="image/*,.pdf"
          multiple
          :disable="isPending || isSubmitting"
          @upload-success="handleUploadSuccess"
          @upload-error="handleUploadError"
        />
      </div>

      <div class="manual-payment-form__actions">
        <Button
          variant="flat"
          color="grey"
          text="انصراف"
          :is-disabled="isPending || isSubmitting"
          @click="emit('close')"
        />
        <Button
          variant="filled"
          color="light-blue"
          text="ثبت پرداخت"
          :is-loading="isPending || isSubmitting"
          :is-disabled="isPending || isSubmitting"
          @click="handleSubmit"
        />
      </div>
    </QForm>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { QForm } from 'quasar'
import { object, string, number } from 'yup'
import { Notif } from '@/data/services/notification-service'
import useYup from '@/composables/use-yup'
import { convertRialToTomanText } from '@/utils/persian-number-to-text'
import { useCreateManualPaymentMutation } from '@/modules/User/query'
import {
  useManualPayment,
  extractManualPaymentError,
} from '@/modules/User/composables/use-manual-payment'
import Button from '@/base/Button'
import SelectField from '@/base/SelectField'
import TextField from '@/base/TextField'
import TimeField from '@/base/TimeField'
import CurrencyField from '@/components/Form/CurrencyField'
import PersianDate from '@/components/Form/PersianDate'
import BaseUploader from '@/components/Form/BaseUploader/BaseUploader'

const props = defineProps({
  userId: {
    type: [String, Number],
    required: true,
  },
})

const emit = defineEmits(['success', 'close'])

const { typeOptions } = useManualPayment()

const createManualPaymentMutation = useCreateManualPaymentMutation()
const isPending = computed(() => createManualPaymentMutation.isPending.value)

const uploaderRef = ref(null)
const uploadedFileIds = ref([])
const hasUploadError = ref(false)
const isSubmitting = ref(false)

const getInitialForm = () => ({
  type: null,
  amount: null,
  paidAtDate: null,
  paidAtTime: '',
  reference: '',
  description: '',
})

const form = reactive(getInitialForm())

const validationSchema = object().shape({
  type: string()
    .required('نوع پرداخت را انتخاب کنید')
    .test(
      'valid-type',
      'نوع پرداخت انتخاب شده معتبر نیست.',
      (value) => !!value && typeOptions.value.some((option) => option.value === value)
    ),
  amount: number()
    .typeError('مبلغ را وارد کنید')
    .transform((value, originalValue) => {
      if (originalValue === '' || originalValue == null) return null
      return value
    })
    .required('مبلغ را وارد کنید')
    .positive('مبلغ باید بزرگ‌تر از صفر باشد'),
  reference: string().max(100, 'شماره پیگیری نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد').nullable(),
  description: string().max(500, 'توضیحات نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد').nullable(),
})

const { validate, errors, setError } = useYup(validationSchema)

const amountInPersianText = computed(() => {
  if (!form.amount || form.amount <= 0) return ''
  return convertRialToTomanText(form.amount)
})

const clearFieldError = (field) => {
  if (errors.value[field]) setError(field, null)
}

const buildPaidAt = () => {
  if (!form.paidAtDate) return null
  const time = form.paidAtTime || '00:00'
  return `${form.paidAtDate} ${time}:00`
}

const buildPayload = (fileIds) => {
  const payload = {
    user_id: props.userId,
    amount: Math.round(Number(form.amount)),
    type: form.type,
  }

  const paidAt = buildPaidAt()
  if (paidAt) payload.paid_at = paidAt

  if (form.reference && form.reference.trim()) payload.reference = form.reference.trim()
  if (form.description && form.description.trim()) payload.description = form.description.trim()
  if (fileIds?.length) payload.file_ids = fileIds

  return payload
}

const handleUploadSuccess = (response) => {
  const files = Array.isArray(response?.data) ? response.data : []
  files.forEach((file) => {
    if (file?.id && !uploadedFileIds.value.includes(file.id)) {
      uploadedFileIds.value.push(file.id)
    }
  })
}

const handleUploadError = () => {
  hasUploadError.value = true
}

// Returns the uploaded file ids, [] when no file is selected,
// or null when an upload failed (submission must be blocked).
const uploadReceiptFiles = async () => {
  const uploader = uploaderRef.value
  const selectedFiles = uploader?.selectedFiles || []
  if (selectedFiles.length === 0) return []

  hasUploadError.value = false
  const pendingFiles = uploader.getPendingFiles?.() || []
  if (pendingFiles.length > 0) {
    await uploader.uploadFiles(pendingFiles)
  }
  if (hasUploadError.value) return null

  return uploadedFileIds.value
}

const handleSubmit = async () => {
  if (isSubmitting.value || isPending.value) return

  const { isValid } = await validate(form)
  if (!isValid) {
    Notif.error('لطفاً اطلاعات پرداخت را کامل کنید')
    return
  }

  isSubmitting.value = true
  try {
    const fileIds = await uploadReceiptFiles()
    if (fileIds === null) {
      Notif.error('به دلیل خطا در آپلود فایل، پرداخت ثبت نشد')
      return
    }

    await createManualPaymentMutation.mutateAsync(buildPayload(fileIds))
    Notif.success('پرداخت دستی با موفقیت ثبت شد')
    emit('success')
  } catch (error) {
    Notif.error(extractManualPaymentError(error))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.manual-payment-form {
  &__hidden-submit {
    position: absolute;
    right: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__field-group {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__label {
    font-weight: map-get($text-weights, medium);
    color: $grey-9;
    text-align: right;
  }

  &__field {
    width: 100%;
  }

  &__row {
    display: flex;
    gap: $spacing-sm;
    align-items: flex-start;
  }

  &__hint {
    font-size: 12px;
    color: $grey-6;
    text-align: right;
    margin-top: -$spacing-xs;
  }

  &__amount-text {
    font-size: 12px;
    font-weight: map-get($text-weights, medium);
    color: $primary;
    text-align: right;
    direction: rtl;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
    padding-top: $spacing-md;
    border-top: 1px solid $grey-3;
    margin-top: $spacing-sm;
  }
}
</style>
