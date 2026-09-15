<template>
  <div class="user-cheques">
    <!-- Image Uploader Section -->
    <QCard flat class="">
      <QCardSection>
        <div class="flex items-baseline q-gutter-sm q-mb-md">
          <Typography variant="body" size="4" color="grey">
            برای افزودن و تکمیل سیستمی چک‌ها می‌توانید عکس چک‌ها را بارگذاری کنید و با استفاده از
            دکمه افزودن خودکار، آن‌ها را در تراکنش‌های بیمار ثبت کنید
          </Typography>
        </div>
        <BaseUploader
          ref="uploaderRef"
          v-model="uploadedFiles"
          :multiple="true"
          :accept="'image/*,.pdf'"
          :enum-type="'user.cheques'"
          :extra-params="{ entity_id: userId, entity_type: ENTITIES_TYPE.USER }"
          @upload-success="handleUploadSuccess"
        />
      </QCardSection>
      <QCardSection v-if="chequeFiles.length > 0" class="q-pt-none">
        <div class="cheque-files-grid">
          <div
            v-for="(file, index) in chequeFiles"
            :key="file.id || index"
            class="cheque-file-item"
          >
            <QImg
              v-if="isImageFile(file)"
              :src="file.path"
              class="cheque-file-image"
              fit="cover"
              @click="openImagePreview(file.path)"
            />
            <div v-else class="cheque-file-pdf" @click="openPdfPreview(file.path)">
              <QIcon name="picture_as_pdf" size="3rem" color="grey-7" />
            </div>
            <Button
              :is-icon-only="true"
              variant="filled"
              color="red"
              :left-icon="IconTrash"
              class="cheque-file-delete"
              @click="deleteFile(file)"
            />
          </div>
        </div>
      </QCardSection>
    </QCard>

    <!-- Cheques List Section -->
    <QCard flat>
      <QCardSection>
        <div class="flex items-center justify-between q-mb-md">
          <Typography variant="heading" size="h5">لیست چک‌ها</Typography>
          <Button
            color="light-blue"
            :left-icon="IconPlus"
            text="افزودن چک"
            type="button"
            @click.prevent="addCheque"
          />
        </div>
      </QCardSection>

      <QCardSection v-if="cheques.length === 0" class="text-center q-pa-xl">
        <Typography variant="body" size="3" color="grey">هیچ چکی ثبت نشده است</Typography>
      </QCardSection>

      <QList v-else bordered separator class="attach-file-modal__list">
        <template v-for="(cheque, index) in cheques" :key="cheque.id || index">
          <QExpansionItem v-model="cheque.expanded" class="cheque-item">
            <template #header>
              <QItemSection avatar>
                <QAvatar color="primary" text-color="white" icon="receipt_long" />
              </QItemSection>
              <QItemSection>
                <QItemLabel>{{ formatAmount(cheque.amount) }} تومان</QItemLabel>
                <QItemLabel caption>
                  {{ getBankName(cheque.bank_id) }} - {{ formatPersianDate(cheque.due_date) }}
                </QItemLabel>
              </QItemSection>
              <QItemSection side>
                <div class="cheque-item__actions">
                  <Button
                    :is-icon-only="true"
                    variant="flat"
                    color="light-blue"
                    :left-icon="IconCopy"
                    @click.prevent.stop="duplicateCheque(index)"
                  >
                    <QTooltip>چک بعدی با همین اطلاعات</QTooltip>
                  </Button>
                  <Button
                    :is-icon-only="true"
                    variant="flat"
                    color="red"
                    :left-icon="IconTrash"
                    @click.prevent.stop="deleteCheque(cheque, index)"
                  />
                </div>
              </QItemSection>
            </template>

            <QCard flat class="q-ma-md cheque-form">
              <QCardSection>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <SelectField
                      v-model="cheque.bank_id"
                      :options="bankOptions"
                      option-label="title"
                      option-value="id"
                      label="بانک"
                      required
                      variant="outline"
                      emit-value
                      map-options
                      :error="!!getError(index, 'bank_id')"
                      :error-message="getError(index, 'bank_id')"
                      @update:model-value="clearError(index, 'bank_id')"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <TextField
                      v-model="cheque.cheque_number"
                      label="شماره چک"
                      required
                      variant="outline"
                      :error="!!getError(index, 'cheque_number')"
                      :error-message="getError(index, 'cheque_number')"
                      @update:model-value="clearError(index, 'cheque_number')"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <TextField
                      v-model="cheque.sayad_number"
                      label="شماره صیادی"
                      required
                      variant="outline"
                      :maxlength="16"
                      hint="شماره صیادی باید ۱۶ رقم باشد"
                      :error="!!getError(index, 'sayad_number')"
                      :error-message="getError(index, 'sayad_number')"
                      @update:model-value="clearError(index, 'sayad_number')"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <PersianDate
                      :model-value="cheque.due_date"
                      label="تاریخ سررسید"
                      required
                      :error="!!getError(index, 'due_date')"
                      :error-message="getError(index, 'due_date')"
                      @update:model-value="
                        (e) => ((cheque.due_date = e), clearError(index, 'due_date'))
                      "
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <TextField
                      v-model="cheque.bank_branch_code"
                      label="کد شعبه بانک"
                      required
                      variant="outline"
                      :error="!!getError(index, 'bank_branch_code')"
                      :error-message="getError(index, 'bank_branch_code')"
                      @update:model-value="clearError(index, 'bank_branch_code')"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <TextField
                      v-model="cheque.bank_branch_title"
                      label="نام شعبه بانک"
                      required
                      variant="outline"
                      :error="!!getError(index, 'bank_branch_title')"
                      :error-message="getError(index, 'bank_branch_title')"
                      @update:model-value="clearError(index, 'bank_branch_title')"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <TextField
                      v-model="cheque.account_holder"
                      label="صاحب حساب"
                      required
                      variant="outline"
                      :error="!!getError(index, 'account_holder')"
                      :error-message="getError(index, 'account_holder')"
                      @update:model-value="clearError(index, 'account_holder')"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <TextField
                      v-model="cheque.account_number"
                      label="شماره حساب"
                      variant="outline"
                      :error="!!getError(index, 'account_number')"
                      :error-message="getError(index, 'account_number')"
                      @update:model-value="clearError(index, 'account_number')"
                    />
                  </div>
                  <div class="col-12">
                    <CurrencyField
                      v-model="cheque.amount"
                      label="مبلغ"
                      suffix="تومان"
                      dense
                      :error-message="getError(index, 'amount')"
                      @update:model-value="clearError(index, 'amount')"
                    />
                    <div
                      v-if="chequeAmountInPersianText(cheque.amount)"
                      class="text-caption text-primary cheque-amount-text"
                    >
                      {{ chequeAmountInPersianText(cheque.amount) }}
                    </div>
                  </div>
                </div>
              </QCardSection>
            </QCard>
          </QExpansionItem>
        </template>
      </QList>

      <!-- Single Save Button Outside -->
      <QCardSection v-if="cheques.length > 0" class="q-pt-none">
        <div class="flex justify-end">
          <Button
            color="light-blue"
            text="ثبت تراکنش"
            :is-loading="isSaving"
            type="button"
            @click.prevent="saveAllCheques"
          />
        </div>
      </QCardSection>
    </QCard>

    <!-- Image Preview Modal -->
    <QDialog v-model="imagePreviewVisible">
      <QImg :src="previewImageUrl" style="max-width: 90vw; max-height: 90vh" />
    </QDialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import { useQueryClient } from '@tanstack/vue-query'
import { object, string, number as yupNumber, mixed } from 'yup'
import { IconTrash, IconPlus, IconCopy } from '@tabler/icons-vue'
import BaseUploader from '@/components/Form/BaseUploader/BaseUploader'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import SelectField from '@/base/SelectField'
import TextField from '@/base/TextField'
import {
  useCreateUserChequesMutation,
  useDeleteUserChequeMutation,
  useGetBanksQuery,
  useGetFilesByType,
} from '@/modules/User/query'
import { handleError } from '@/utils/error-handler'
import PersianDate from '@/components/Form/PersianDate'
import CurrencyField from '@/components/Form/CurrencyField'
import { convertNumberToPersianText } from '@/utils/persian-number-to-text'
import { convertToJalali } from '@/utils/date-utils'
import { ENTITIES_TYPE } from '@/components/Form/BaseUploader'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import { mockGetBanks, mockCreateCheques, mockDeleteCheque } from '@/mocks/user-details/financial'

const DOCUMENT_TYPE = 'financial-docs'

const props = defineProps({
  propData: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['submit'])

const queryClient = useQueryClient()
const userId = computed(() => props.propData)

const cheques = ref([])

const chequeSchema = object().shape({
  bank_id: mixed().required('انتخاب بانک الزامی است'),
  cheque_number: string().required('شماره چک الزامی است'),
  sayad_number: string()
    .required('شماره صیادی الزامی است')
    .length(16, 'شماره صیادی باید ۱۶ رقم باشد'),
  due_date: string().required('تاریخ سررسید الزامی است'),
  amount: yupNumber()
    .typeError('مبلغ چک الزامی است')
    .transform((value, original) => (original === '' || original == null ? null : value))
    .required('مبلغ چک الزامی است')
    .positive('مبلغ باید بزرگتر از صفر باشد'),
  bank_branch_code: string()
    .required('کد شعبه بانک الزامی است')
    .max(255, 'کد شعبه بانک نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد'),
  bank_branch_title: string()
    .required('نام شعبه بانک الزامی است')
    .max(255, 'نام شعبه بانک نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد'),
  account_holder: string()
    .required('صاحب حساب الزامی است')
    .max(255, 'صاحب حساب نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد'),
  account_number: string().max(255, 'شماره حساب نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد'),
})

const fieldErrors = ref({})
const getError = (index, field) => fieldErrors.value[`${index}.${field}`] || null
const clearError = (index, field) => {
  const key = `${index}.${field}`
  if (fieldErrors.value[key]) delete fieldErrors.value[key]
}

const { data: banksData } = useGetBanksQuery({
  ...(ENABLE_USER_DETAIL_MOCKS ? { queryFn: () => mockGetBanks() } : {}),
})
const bankOptions = computed(() => banksData.value?.items || [])

const { data: filesData } = useGetFilesByType(userId, 'cheques')
const chequeFiles = computed(() => filesData.value?.items || [])

const { mutateAsync: createCheques, isPending: isCreating } = useCreateUserChequesMutation(
  ENABLE_USER_DETAIL_MOCKS ? { mutationFn: mockCreateCheques } : {}
)
const { mutateAsync: deleteChequeMutation, isPending: isDeleting } = useDeleteUserChequeMutation(
  ENABLE_USER_DETAIL_MOCKS ? { mutationFn: mockDeleteCheque } : {}
)

const isSaving = computed(() => isCreating.value || isDeleting.value)

const uploaderRef = ref(null)
const uploadedFiles = ref([])

const handleUploadSuccess = async () => {
  Notif.success('فایل‌ها با موفقیت آپلود شدند')
}

const isImageFile = (file) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
  const fileName = file.path || file.name || ''
  return imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext))
}

const deleteFile = async () => {
  confirmDialog('تأیید حذف', 'آیا از حذف این فایل اطمینان دارید؟', async () => {
    try {
      // Note: You may need to implement a delete file API if not available
      Notif.success('فایل با موفقیت حذف شد')
    } catch (error) {
      handleError(error)
    }
  })
}

const imagePreviewVisible = ref(false)
const previewImageUrl = ref('')

const openImagePreview = (url) => {
  previewImageUrl.value = url
  imagePreviewVisible.value = true
}

const openPdfPreview = (url) => {
  window.open(url, '_blank')
}

// Cheques CRUD operations
const addCheque = () => {
  cheques.value.unshift({
    bank_id: null,
    cheque_number: '',
    sayad_number: '',
    amount: null,
    due_date: '',
    bank_branch_code: '',
    bank_branch_title: '',
    account_holder: '',
    account_number: '',
    expanded: true,
  })
}

const duplicateCheque = (index) => {
  const source = cheques.value[index]
  const { id, ...rest } = source
  cheques.value.splice(index + 1, 0, {
    ...rest,
    cheque_number: '',
    sayad_number: '',
    due_date: '',
    expanded: true,
  })
  fieldErrors.value = {}
}

const saveAllCheques = async () => {
  fieldErrors.value = {}
  let hasError = false

  for (let i = 0; i < cheques.value.length; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await chequeSchema.validate(cheques.value[i], { abortEarly: false })
    } catch (error) {
      hasError = true
      if (error.inner) {
        error.inner.forEach((validationError) => {
          fieldErrors.value[`${i}.${validationError.path}`] = validationError.message
        })
      }
      cheques.value[i].expanded = true
    }
  }

  if (hasError) {
    Notif.warning('لطفاً خطاهای فرم چک‌ها را برطرف کنید')
    return
  }

  try {
    // Amounts are entered (and sent) in Toman.
    const payload = cheques.value.map(({ expanded, ...cheque }) => cheque)

    await createCheques({
      userId: userId.value,
      cheques: payload,
    })

    // Invalidate queries
    await queryClient.invalidateQueries({
      queryKey: ['user', 'files', DOCUMENT_TYPE, userId.value],
    })
    await queryClient.invalidateQueries({
      queryKey: ['user', 'files', 'cheques', userId.value],
    })
    await queryClient.invalidateQueries({
      queryKey: ['user', 'transactions'],
    })
    await queryClient.invalidateQueries({
      queryKey: ['user', 'accounting'],
    })

    Notif.success('تراکنش‌ها با موفقیت ثبت شدند')

    // Clear the form after successful save
    cheques.value = []
    fieldErrors.value = {}

    // Emit submit event to close modal
    emit('submit')
  } catch (error) {
    handleError(error)
  }
}

const deleteCheque = (cheque, index) => {
  confirmDialog(
    'تأیید حذف',
    'آیا از حذف این چک اطمینان دارید؟',
    async () => {
      try {
        if (cheque.id) {
          await deleteChequeMutation({
            userId: userId.value,
            chequeId: cheque.id,
            chequeNumber: cheque.cheque_number,
          })
        } else {
          cheques.value.splice(index, 1)
        }
        Notif.success('تراکنش با موفقیت حذف شد')
      } catch (error) {
        handleError(error)
      }
    },
    { ok: { label: 'تایید', color: 'negative', flat: true } }
  )
}

// Utility functions
const getBankName = (bankId) => {
  const bank = bankOptions.value.find((b) => b.id === bankId)
  return bank ? bank.name : '-'
}

const formatAmount = (amount) => {
  if (!amount) return '0'
  return new Intl.NumberFormat('fa-IR').format(Number(amount))
}

const formatPersianDate = (date) => {
  if (!date) return '-'
  return convertToJalali(date)
}

// Amount is entered in Toman, so the Persian text is the Toman amount in words.
const chequeAmountInPersianText = (amount) => {
  if (!amount || amount <= 0) return ''
  return `${convertNumberToPersianText(amount)} تومان`
}
</script>

<style scoped lang="scss">
.cheque-file-image {
  width: 100%;
  height: 120px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.cheque-file-pdf {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $grey-1;
  cursor: pointer;
}

.cheque-file-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.cheque-file-item:hover .cheque-file-delete {
  opacity: 1;
}

.cheque-item {
  margin-bottom: 0.5rem;

  &:hover {
    background-color: $grey-1;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
}

.cheque-form {
  border: 1px solid $grey-3;
  border-radius: 8px;
}
.attach-file-modal__list {
  border-radius: 8px !important;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .q-expansion-item {
    border-bottom: 1px solid $grey-4;

    &:last-child {
      border-bottom: none;
    }

    &__header {
      padding: 16px;
      background-color: $white;
      min-height: 60px;

      &:hover {
        background-color: $grey-1;
      }
    }
  }
}
</style>
