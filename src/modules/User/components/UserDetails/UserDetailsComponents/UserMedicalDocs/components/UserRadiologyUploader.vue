<template>
  <QDialog v-model="showUploadModal" persistent>
    <QCard class="radiology-images__upload-dialog">
      <div class="radiology-images__upload-header">
        <span class="text-h6">بارگذاری مدرک جدید</span>
        <QBtn flat round dense @click="closeUploadDialog">
          <IconX :size="20" />
        </QBtn>
      </div>
      <QSeparator />
      <div class="radiology-images__upload-content">
        <div v-if="imageTypeOptions.length === 1" class="q-mb-md">
          <div class="text-subtitle2 text-grey-7">نوع مدرک</div>
          <div class="text-body1">{{ imageTypeOptions[0].label }}</div>
        </div>
        <QSelect
          v-else
          v-model="uploadForm.type"
          outlined
          :options="imageTypeOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          label="نوع مدرک"
          class="q-mb-md"
        />
        <BaseUploader
          ref="baseUploaderRef"
          :max-file-size="1048576 * 10"
          accept=".jpg, .jpeg, .png, image/*"
          :enum-type="effectiveEnumType"
          :multiple="uploadForm.type === 'user.cbct'"
          :extra-params="uploadExtraParams"
          :auto-upload="false"
          @upload-success="handleImageUpload"
          @upload-complete="handleUploadComplete"
        />
      </div>
      <QSeparator />
      <div class="radiology-images__upload-actions">
        <QBtn outline color="negative" label="انصراف" @click="closeUploadDialog" />
        <QBtn
          unelevated
          color="primary"
          label="ذخیره"
          :loading="isUploading"
          @click="saveUploadedImage"
        />
      </div>
    </QCard>
  </QDialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { IconX } from '@tabler/icons-vue'
import BaseUploader from '@/components/Form/BaseUploader/BaseUploader'
import useDisclosure from '@/composables/use-disclosure'
import { ENTITIES_TYPE } from '@/components/Form/BaseUploader'
import { Notif } from '@/data/services/notification-service'

const props = defineProps({
  userId: {
    type: [Number, String],
    required: true,
  },
  defaultType: {
    type: String,
    default: 'user.opg',
  },
  bookingId: {
    type: Number,
    default: 0,
  },
  allowedTypes: {
    type: Array,
    default: () => ['user.opg', 'user.cbct', 'treatment-plan.consent', 'user.docs'],
    validator: (value) => {
      const validTypes = new Set(['user.opg', 'user.cbct', 'treatment-plan.consent', 'user.docs'])
      return value.length > 0 && value.every((type) => validTypes.has(type))
    },
  },
  uploadOverrides: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['upload-complete'])

const [showUploadModal, { open: openUploadModal, close: closeUploadModal }] = useDisclosure()

const getDefaultFormState = () => ({
  type: props.defaultType,
  entity: ENTITIES_TYPE.USER,
})

const uploadForm = ref({
  type: props.defaultType,
  entity: ENTITIES_TYPE.USER,
})
const uploadedFileId = ref(null)
const baseUploaderRef = ref(null)

const allImageTypeOptions = [
  { label: 'عکس OPG', value: 'user.opg', entity: ENTITIES_TYPE.USER },
  { label: 'عکس CBCT', value: 'user.cbct', entity: ENTITIES_TYPE.USER },
  {
    label: 'رضایتنامه',
    value: 'treatment-plan.consent',
    entity: ENTITIES_TYPE.TREATMENT_PLAN,
  },
  { label: 'دیگر مدارک', value: 'user.docs', entity: ENTITIES_TYPE.USER },
]

const imageTypeOptions = computed(() => {
  const allowedSet = new Set(props.allowedTypes)
  return allImageTypeOptions.filter((option) => allowedSet.has(option.value))
})

const userId = computed(() => props.userId)
const isUploading = computed(() => baseUploaderRef.value?.isUploading ?? false)

const isDefaultTypeValid = computed(() => props.allowedTypes.includes(props.defaultType))

const entityType = computed(() => {
  const selectedOption = allImageTypeOptions.find(
    (option) => option.value === uploadForm.value.type
  )
  return selectedOption?.entity || ENTITIES_TYPE.USER
})

const uploadExtraParams = computed(() => {
  if (props.uploadOverrides?.extraParams) {
    return props.uploadOverrides.extraParams
  }
  return { entity_id: userId.value, entity_type: entityType.value }
})

const effectiveEnumType = computed(() => {
  return props.uploadOverrides?.enumType || uploadForm.value.type
})

const openUploadDialog = () => {
  if (!isDefaultTypeValid.value) {
    Notif.error('خطا: نوع پیش‌فرض در لیست انواع مجاز نیست')
    return
  }
  uploadForm.value = getDefaultFormState()
  uploadedFileId.value = null
  openUploadModal()
}

const closeUploadDialog = () => {
  uploadForm.value = getDefaultFormState()
  uploadedFileId.value = null
  closeUploadModal()
}

const handleImageUpload = (response) => {
  if (response?.data?.[0]?.id) {
    uploadedFileId.value = response.data[0].id
  }
}

const handleUploadComplete = ({ succeeded }) => {
  if (succeeded.length > 0) {
    Notif.success('تصاویر با موفقیت بارگذاری شدند')
    closeUploadDialog()
    emit('upload-complete')
  }
}

const saveUploadedImage = async () => {
  if (isUploading.value) return

  if (!userId.value) {
    Notif.error('شناسه کاربر یافت نشد')
    return
  }

  if (!uploadForm.value.type) {
    Notif.warning('نوع عکس را انتخاب کنید')
    return
  }

  if (!baseUploaderRef.value) {
    Notif.error('خطا در اتصال به آپلودر فایل')
    return
  }

  const pendingFiles = baseUploaderRef.value.getPendingFiles()
  if (!pendingFiles?.length) {
    Notif.warning('فایلی برای آپلود انتخاب نشده است')
    return
  }

  await baseUploaderRef.value.upload()
}

defineExpose({
  openUploadDialog,
})
</script>

<style scoped lang="scss">
.radiology-images {
  padding: 16px;
  min-height: 400px;
  position: relative;

  &__upload-dialog {
    width: 400px;
    max-width: 90vw;
    padding: 16px;
    border-radius: 12px;
  }

  &__upload-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  &__upload-content {
    padding: 16px 0;
  }

  &__upload-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 12px;
  }
}
</style>
