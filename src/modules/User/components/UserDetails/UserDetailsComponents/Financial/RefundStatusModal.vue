<template>
  <BaseModal v-model="show" title="تغییر وضعیت عودت" width="36rem" @close="handleClose">
    <div class="rsm__info-card">
      <div class="rsm__info-row">
        <Typography variant="body" size="4" color="grey">شماره شبا</Typography>
        <Typography variant="body" size="4" weight="semibold" color="dark" class="rsm__info-ltr">
          IR {{ sheba }}
        </Typography>
      </div>
      <div class="rsm__info-row">
        <Typography variant="body" size="4" color="grey">نوع عودت</Typography>
        <Typography variant="body" size="4" weight="semibold" color="dark">
          {{ returnType }}
        </Typography>
      </div>
      <div class="rsm__info-row">
        <Typography variant="body" size="4" color="grey">مبلغ پرداختی</Typography>
        <Typography variant="body" size="4" weight="semibold" color="dark">
          {{ formattedAmount }} تومان
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
    />

    <BaseUploader
      v-if="selectedStatus === 'approved' || selectedStatus === 'refunded'"
      ref="baseUploaderRef"
      :enum-type="'financial.refund'"
      :auto-upload="false"
      :max-file-size="1048576 * 10"
      accept=".jpg, .jpeg, .png, image/*"
      multiple
      class="rsm__uploader"
      @upload-success="handleUploadSuccess"
      @upload-error="handleUploadError"
    />

    <div class="rsm__description">
      <TextField
        v-model="description"
        type="textarea"
        label="توضیحات"
        variant="outline"
        placeholder="توضیحات"
        autogrow
      />
    </div>

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
import { Notif } from '@/data/services/notification-service'
import BaseModal from '@/base/Modal'
import SelectField from '@/base/SelectField'
import TextField from '@/base/TextField'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import BaseUploader from '@/components/Form/BaseUploader/BaseUploader'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  sheba: { type: String, default: '' },
  returnType: { type: String, default: '' },
  amount: { type: [Number, String], default: 0 },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'close', 'submit'])

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const selectedStatus = ref(null)
const description = ref('')
const uploadedFileIds = ref([])
const baseUploaderRef = ref(null)

const formattedAmount = computed(() => Number(props.amount).toLocaleString('fa-IR'))

const statusOptions = [
  { value: 'refunded', label: 'عودت وجه' },
  { value: 'canceled', label: 'لغو' },
]

watch(
  () => props.modelValue,
  (val) => {
    if (!val) {
      selectedStatus.value = null
      description.value = ''
      uploadedFileIds.value = []
      baseUploaderRef.value = null
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
  if (
    (selectedStatus.value === 'approved' || selectedStatus.value === 'refunded') &&
    baseUploaderRef.value
  ) {
    const pendingFiles = baseUploaderRef.value.getPendingFiles?.()
    if (pendingFiles?.length) {
      await baseUploaderRef.value.upload()
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
.rsm {
  &__info-card {
    border: 1px solid $grey-3;
    border-radius: $radius-sm;
    padding: $spacing-md $spacing-lg;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    margin-bottom: $spacing-xl;
    background: $grey-1;
  }

  &__info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
  }

  &__info-ltr {
    direction: ltr;
    letter-spacing: 0.5px;
  }

  &__description {
    margin-top: $spacing-lg;
  }

  &__uploader {
    margin-top: $spacing-lg;
  }
}
</style>
