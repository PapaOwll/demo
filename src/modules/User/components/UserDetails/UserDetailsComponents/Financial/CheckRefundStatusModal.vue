<template>
  <BaseModal v-model="show" title="تغییر وضعیت عودت چک" width="36rem" @close="handleClose">
    <div class="crsm__info-card">
      <div class="crsm__info-row">
        <Typography variant="body" size="4" color="grey">مبلغ</Typography>
        <Typography variant="body" size="4" weight="semibold" color="dark">
          {{ formattedAmount }} تومان
        </Typography>
      </div>
      <div class="crsm__info-row">
        <Typography variant="body" size="4" color="grey">بانک صادرکننده</Typography>
        <Typography variant="body" size="4" weight="semibold" color="dark">{{ bank }}</Typography>
      </div>
      <div class="crsm__info-row">
        <Typography variant="body" size="4" color="grey">شناسه صیادی</Typography>
        <Typography variant="body" size="4" weight="semibold" color="dark" class="crsm__info-ltr">
          {{ sayyadi }}
        </Typography>
      </div>
      <div class="crsm__info-row">
        <Typography variant="body" size="4" color="grey">شماره چک</Typography>
        <Typography variant="body" size="4" weight="semibold" color="dark" class="crsm__info-ltr">
          {{ checkNumber }}
        </Typography>
      </div>
      <div class="crsm__info-row">
        <Typography variant="body" size="4" color="grey">تاریخ سررسید</Typography>
        <Typography variant="body" size="4" weight="semibold" color="dark" class="crsm__info-ltr">
          {{ dueDate }}
        </Typography>
      </div>
    </div>

    <SelectField
      v-model="selectedStatus"
      label="وضعیت"
      required
      variant="outline"
      :options="statusOptions"
      emit-value
      map-options
      option-label="label"
      option-value="value"
      placeholder="انتخاب کنید"
      class="crsm__status"
    />

    <BaseUploader
      v-if="selectedStatus === 'approved' || selectedStatus === 'refunded'"
      ref="uploaderRef"
      :enum-type="'financial.refund'"
      :auto-upload="false"
      :max-file-size="1048576 * 10"
      accept=".jpg, .jpeg, .png, image/*,.pdf"
      class="uploader"
      @upload-success="handleUploadSuccess"
      @upload-error="handleUploadError"
    />

    <TextField
      v-model="description"
      type="textarea"
      label="توضیحات"
      variant="outline"
      placeholder="توضیحات"
      autogrow
      class="crsm__description"
    />

    <template #footer>
      <Button
        variant="filled"
        color="light-blue"
        text="تغییر وضعیت"
        :is-loading="loading"
        @click="handleSubmit"
      />
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from '@/base/Modal'
import SelectField from '@/base/SelectField'
import TextField from '@/base/TextField'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import BaseUploader from '@/components/Form/BaseUploader/BaseUploader'
import { Notif } from '@/data/services/notification-service'

const requiresUpload = (status) => status === 'approved' || status === 'refunded'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  amount: { type: [Number, String], default: 0 },
  bank: { type: String, default: '' },
  sayyadi: { type: String, default: '' },
  checkNumber: { type: String, default: '' },
  dueDate: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'close', 'submit'])

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const formattedAmount = computed(() => Number(props.amount).toLocaleString('fa-IR'))

const statusOptions = [
  { value: 'refunded', label: 'عودت وجه' },
  { value: 'canceled', label: 'لغو' },
]

const selectedStatus = ref(null)
const description = ref('')
const uploadedFileIds = ref([])
const uploaderRef = ref(null)

watch(
  () => props.modelValue,
  (val) => {
    if (!val) {
      selectedStatus.value = null
      description.value = ''
      uploadedFileIds.value = []
    }
  }
)

const handleUploadSuccess = (response) => {
  const files = Array.isArray(response?.data) ? response.data : []
  files.forEach((file) => {
    if (file?.id && !uploadedFileIds.value.includes(file.id)) {
      uploadedFileIds.value.push(file.id)
    }
  })
}

const handleUploadError = () => {
  Notif.error('خطا در آپلود فایل، لطفاً دوباره تلاش کنید')
}

const handleClose = () => {
  emit('close')
}

const handleSubmit = async () => {
  if (requiresUpload(selectedStatus.value)) {
    if (!uploaderRef.value) {
      Notif.error('بارگذاری تصویر یا فایل PDF چک الزامی است')
      return
    }

    const pendingFiles = uploaderRef.value.getPendingFiles?.()
    if (pendingFiles?.length) {
      await uploaderRef.value.upload()
    }

    if (uploadedFileIds.value.length === 0) {
      Notif.error('بارگذاری تصویر یا فایل PDF چک الزامی است')
      return
    }
  }

  emit('submit', {
    status: selectedStatus.value,
    description: description.value,
    fileIds: uploadedFileIds.value,
  })
}
</script>

<style lang="scss" scoped>
.crsm {
  &__info-card {
    border: 1px solid $grey-3;
    border-radius: $radius-sm;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  &__info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__info-ltr {
    direction: ltr;
    letter-spacing: 0.5px;
  }

  &__status {
    margin-bottom: 16px;
  }

  &__description {
    margin-bottom: 16px;
  }
}

.uploader {
  margin-top: 16px;
  margin-bottom: 16px;
}
</style>
