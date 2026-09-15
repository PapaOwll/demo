<template>
  <div
    class="base-uploader"
    :class="[uploaderClass, { 'base-uploader--disabled': disable || isUploading }]"
  >
    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      :multiple="multiple"
      :disabled="disable || isUploading"
      class="base-uploader__input"
      @change="handleFileChange"
    />

    <div
      class="base-uploader__drop-zone"
      :class="[headerClass, { 'base-uploader__drop-zone--drag-over': isDragOver }]"
      @click="triggerFileSelect"
      @dragover.prevent="handleDragOver"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <slot name="header">
        <div class="base-uploader__header">
          <slot name="header-icon">
            <div class="base-uploader__header-icon">
              <IconUpload />
            </div>
          </slot>
          <slot name="header-content">
            <div class="base-uploader__header-title">
              <Typography variant="body" size="4" color="body" weight="bold">
                برای بارگذاری فایل‌
              </Typography>
              <Typography
                variant="body"
                size="4"
                :color="disable ? 'body' : 'light-blue'"
                weight="bold"
              >
                کلیک کنید
              </Typography>
            </div>
            <div class="base-uploader__header-desc">
              <Typography v-if="maxFileSize" variant="caption" color="blue-grey">
                حداکثر:
                {{ maxFileSizeFormatted }}
              </Typography>
              <Typography variant="caption" color="blue-grey">
                ({{ accept || 'همه فرمت‌ها' }})
              </Typography>
            </div>
          </slot>
        </div>
      </slot>
    </div>

    <div v-if="selectedFiles.length > 0" class="base-uploader__list" :class="listClass">
      <!-- view: img (thumbnail grid) -->
      <div v-if="view === 'img'" class="base-uploader__thumbs">
        <div
          v-for="(file, index) in selectedFiles"
          :key="getFileKey(file)"
          class="base-uploader__thumb"
          :class="statusClass(file, 'base-uploader__thumb')"
        >
          <QImg
            v-if="isImageFile(file) && thumbSrc(file)"
            :src="thumbSrc(file)"
            fit="cover"
            class="base-uploader__thumb-img"
            @click="triggerFilePreview(file)"
          />
          <div v-else class="base-uploader__thumb-placeholder" @click="triggerFilePreview(file)">
            <QImg :src="fileTypeImage" fit="contain" width="40px" />
          </div>

          <div v-if="getFileStatus(file) === 'loading'" class="base-uploader__thumb-overlay">
            <QSpinnerTail color="primary" size="2em" />
          </div>
          <div
            v-else-if="getFileStatus(file) === 'error'"
            class="base-uploader__thumb-overlay base-uploader__thumb-overlay--error"
          >
            <IconAlertTriangle size="24" />
          </div>

          <Button
            v-if="getFileStatus(file) !== 'loading'"
            variant="flat"
            color="grey"
            type="button"
            is-icon-only
            :left-icon="IconX"
            size="sm"
            class="base-uploader__thumb-remove"
            aria-label="حذف فایل"
            @click.stop="removeFile(index)"
          />
        </div>
      </div>

      <!-- view: default (file list) -->
      <template v-else>
        <div
          v-for="(file, index) in selectedFiles"
          :key="getFileKey(file)"
          class="base-uploader__file-wrapper"
        >
          <div class="base-uploader__item" :class="statusClass(file, 'base-uploader__item')">
            <div class="base-uploader__file-icon" @click="triggerFilePreview(file)">
              <QSpinnerTail v-if="getFileStatus(file) === 'loading'" color="primary" size="2em" />
              <QImg
                v-else-if="isImageFile(file) && previewUrls[getFileKey(file)]"
                :src="previewUrls[getFileKey(file)]"
                fit="cover"
                width="40px"
                height="40px"
                class="base-uploader__preview-thumb"
              />
              <slot v-else name="file-icon">
                <QImg :src="fileTypeImage" fit="contain" width="40px" />
              </slot>
            </div>
            <div class="base-uploader__item-info">
              <Typography
                variant="body"
                size="4"
                color="dark"
                weight="medium"
                tag="div"
                class="base-uploader__item-name ellipsis"
              >
                {{ file.name }}
              </Typography>
              <div v-if="getFileStatus(file) === 'error'" class="base-uploader__item-error">
                <Typography variant="caption" color="red">
                  {{ getFileError(file) || 'خطا در آپلود' }}
                </Typography>
              </div>
              <Typography
                v-else
                variant="caption"
                color="grey"
                tag="div"
                class="base-uploader__item-size"
              >
                {{ formatFileSize(file.size) }}
              </Typography>
            </div>
            <Button
              variant="flat"
              color="grey"
              size="sm"
              type="button"
              :is-link="false"
              is-icon-only
              :left-icon="IconX"
              aria-label="حذف فایل"
              @click="removeFile(index)"
            />
          </div>
          <div v-if="file.previewPath" class="base-uploader__preview">
            <Button
              variant="flat"
              color="primary"
              size="sm"
              type="button"
              :is-link="false"
              text="مشاهده فایل"
              @click="previewUploadedFile(file.previewPath)"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { Notif } from '@/data/services/notification-service'
import { handleError } from '@/utils/error-handler'
import fileTypeImage from '@/assets/images/file-type.svg'
import { useFileUploadMutation } from './index'
import { IconAlertTriangle, IconUpload, IconX } from '@tabler/icons-vue'
import Typography from '@/base/Typography'
import Button from '@/base/Button'

const props = defineProps({
  multiple: {
    type: Boolean,
    default: false,
  },
  view: {
    type: String,
    default: 'default',
    validator: (val) => ['default', 'img'].includes(val),
  },
  accept: {
    type: String,
    default: '',
  },
  maxFileSize: {
    type: Number,
    default: 0,
  },
  enumType: {
    type: String,
    default: '',
  },
  disable: {
    type: Boolean,
    default: false,
  },
  autoUpload: {
    type: Boolean,
    default: true,
  },
  extraParams: {
    type: Object,
    default: () => ({}),
  },
  uploaderClass: {
    type: [String, Array, Object],
    default: '',
  },
  headerClass: {
    type: [String, Array, Object],
    default: '',
  },
  listClass: {
    type: [String, Array, Object],
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'upload-success', 'upload-error', 'upload-complete'])

const fileInputRef = ref(null)
const selectedFiles = ref([])
const isDragOver = ref(false)
const pendingUploads = ref(0)
const isUploading = computed(() => pendingUploads.value > 0)

const getFileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`

const fileStatuses = ref({})

const getFileStatus = (file) => fileStatuses.value[getFileKey(file)] ?? null

const statusClass = (file, baseClass) => {
  const status = getFileStatus(file)
  return status ? `${baseClass}--${status}` : ''
}

const setFileStatus = (file, status) => {
  fileStatuses.value[getFileKey(file)] = status
}

const clearFileStatus = (file) => {
  delete fileStatuses.value[getFileKey(file)]
}

const fileErrors = ref({})

const getFileError = (file) => fileErrors.value[getFileKey(file)] ?? null

const setFileError = (file, message) => {
  fileErrors.value[getFileKey(file)] = message
}

const clearFileError = (file) => {
  delete fileErrors.value[getFileKey(file)]
}

const isFileSelected = (file) => selectedFiles.value.some((f) => getFileKey(f) === getFileKey(file))

const isImageFile = (file) => {
  if (!file.type || typeof file.type !== 'string') {
    return false
  }
  return file.type.startsWith('image/')
}

const previewUrls = ref({})

const thumbSrc = (file) => previewUrls.value[getFileKey(file)] || file.previewPath || ''

const createPreviewUrl = (file) => {
  const key = getFileKey(file)
  if (!file.previewPath && isImageFile(file) && !previewUrls.value[key]) {
    try {
      previewUrls.value[key] = URL.createObjectURL(file)
    } catch (error) {
      handleError(error)
    }
  }
}

const removePreviewUrl = (file) => {
  const key = getFileKey(file)
  if (previewUrls.value[key]) {
    URL.revokeObjectURL(previewUrls.value[key])
    delete previewUrls.value[key]
  }
}

const revokeAllBlobUrls = () => {
  Object.values(previewUrls.value).forEach((url) => {
    URL.revokeObjectURL(url)
  })
  previewUrls.value = {}
}

onBeforeUnmount(() => {
  revokeAllBlobUrls()
})

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = [
    { name: 'Bytes', value: 'بایت' },
    { name: 'KB', value: 'کیلوبایت' },
    { name: 'MB', value: 'مگابایت' },
    { name: 'GB', value: 'گیگابایت' },
    { name: 'TB', value: 'ترابایت' },
  ]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i].value}`
}

const maxFileSizeFormatted = computed(() => {
  if (props.maxFileSize === 0) return '0 B'
  return formatBytes(props.maxFileSize, 2)
})

const formatFileSize = (bytes) => formatBytes(bytes, 2)

const { mutateAsync } = useFileUploadMutation()

const getValidationError = (file) => {
  if (!file.name || file.name.trim() === '') {
    return 'نام فایل نمی‌تواند خالی باشد'
  }

  const dangerousExtensions = [
    '.exe',
    '.bat',
    '.cmd',
    '.com',
    '.pif',
    '.scr',
    '.vbs',
    '.js',
    '.jar',
    '.app',
    '.deb',
    '.pkg',
    '.dmg',
    '.rpm',
    '.run',
  ]
  const fileExtension = file.name.toLowerCase().slice(Math.max(0, file.name.lastIndexOf('.')))
  if (dangerousExtensions.includes(fileExtension)) {
    return `فایل‌های با پسوند ${fileExtension} مجاز نیستند`
  }

  if (file.name.length > 255) {
    return 'نام فایل طولانی است. حداکثر طول مجاز: 255 کاراکتر'
  }

  const restrictedChars = /["*/:<>?\\|]/
  if (restrictedChars.test(file.name)) {
    return 'نام فایل شامل کاراکترهای غیرمجاز است'
  }

  if (props.maxFileSize > 0 && file.size > props.maxFileSize) {
    return `حجم فایل ${file.name} (${formatFileSize(file.size)}) بیشتر از حد مجاز (${formatBytes(props.maxFileSize)}) است`
  }

  if (props.accept) {
    const acceptedTypes = props.accept.split(',').map((type) => type.trim().toLowerCase())
    const fileName = file.name.toLowerCase()
    const fileType = file.type.toLowerCase()

    const isAccepted = acceptedTypes.some((acceptType) => {
      if (acceptType.startsWith('.')) {
        return fileName.endsWith(acceptType)
      }
      if (acceptType.includes('/*')) {
        return fileType.startsWith(acceptType.replace('/*', ''))
      }
      return fileType === acceptType
    })

    if (!isAccepted) {
      return `فرمت فایل ${file.name} نامعتبر است. فرمت‌های مجاز: ${props.accept}`
    }
  }

  return null
}

const uploadFiles = async (files) => {
  const filesToUpload = files || selectedFiles.value

  if (!filesToUpload || filesToUpload.length === 0) {
    emit('upload-error', new Error('No files to upload'))
    Notif.warning('هیچ فایلی برای آپلود انتخاب نشده است')
    return
  }

  const uploadPromises = filesToUpload.map(async (file) => {
    const validationError = getValidationError(file)
    if (validationError) {
      setFileStatus(file, 'error')
      setFileError(file, validationError)
      return {
        status: 'rejected',
        reason: new Error(validationError, { cause: { fileName: file.name } }),
      }
    }

    pendingUploads.value += 1
    setFileStatus(file, 'loading')
    clearFileError(file)

    const formData = new FormData()
    formData.append('files[0][file]', file, file.name)
    if (props.enumType) {
      formData.append('files[0][type]', props.enumType)
    }

    try {
      const res = await mutateAsync({ formData, extraParams: props.extraParams })
      const uploadedFileData = selectedFiles.value.find((f) => getFileKey(f) === getFileKey(file))

      if (uploadedFileData) {
        const serverData = Array.isArray(res.data) ? res.data[0] : res.data
        uploadedFileData.previewPath = serverData?.path
        removePreviewUrl(file)
      }

      if (isFileSelected(file)) {
        setFileStatus(file, 'success')
      }
      return { status: 'fulfilled', value: { file, response: res } }
    } catch (error) {
      if (isFileSelected(file)) {
        setFileStatus(file, 'error')
        setFileError(file, error?.response?.data?.message || 'خطا در آپلود')
      }
      return {
        status: 'rejected',
        reason: new Error(error?.response?.data?.message || 'خطا در آپلود', {
          cause: { fileName: file.name },
        }),
      }
    } finally {
      pendingUploads.value -= 1
    }
  })

  const results = await Promise.all(uploadPromises)

  const succeeded = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
  const failed = results.filter((r) => r.status === 'rejected').map((r) => r.reason)
  const total = results.length

  if (succeeded.length > 0) {
    const responses = succeeded.map((s) => s.response)
    const allFileData = responses.flatMap((r) => (Array.isArray(r.data) ? r.data : [r.data]))

    const finalResponse = {
      ...responses[0],
      data: allFileData,
    }

    emit('update:modelValue', finalResponse)
    emit('upload-success', finalResponse)
  }

  if (failed.length > 0) {
    emit('upload-error', failed)
  }

  emit('upload-complete', {
    total,
    succeededCount: succeeded.length,
    failedCount: failed.length,
    succeeded,
    failed,
    status:
      total === failed.length
        ? 'total-failure'
        : total === succeeded.length
          ? 'total-success'
          : 'partial',
  })

  if (total === failed.length) {
    Notif.error(`آپلود ${total} فایل با خطا مواجه شد`)
  } else if (failed.length > 0) {
    Notif.warning(`${succeeded.length} فایل آپلود شد، اما ${failed.length} فایل خطا داشت`)
  }
}

const processFiles = async (files) => {
  if (!files || files.length === 0) return

  const results = files.map((file) => ({ file, error: getValidationError(file) }))
  const validFiles = results.filter((r) => !r.error).map((r) => r.file)
  const invalidFiles = results.filter((r) => r.error)

  invalidFiles.forEach(({ error }) => Notif.error(error))

  const incomingFiles = [...validFiles, ...invalidFiles.map((r) => r.file)]

  if (props.multiple) {
    selectedFiles.value = [...selectedFiles.value, ...incomingFiles]
  } else {
    selectedFiles.value.forEach((file) => {
      removePreviewUrl(file)
      clearFileStatus(file)
      clearFileError(file)
    })
    selectedFiles.value = incomingFiles.slice(0, 1)
  }

  invalidFiles.forEach(({ file, error }) => {
    setFileStatus(file, 'error')
    setFileError(file, error)
  })

  validFiles.forEach((file) => createPreviewUrl(file))

  if (props.autoUpload && validFiles.length > 0) {
    await uploadFiles(validFiles)
  }
}

const handleFileChange = async (event) => {
  const files = [...event.target.files]
  await processFiles(files)

  const inputElement = event.target
  inputElement.value = ''
}

const handleDragOver = (event) => {
  if (props.disable || isUploading.value) return
  event.preventDefault()
  isDragOver.value = true
}

const handleDragEnter = (event) => {
  if (props.disable || isUploading.value) return
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event) => {
  if (props.disable || isUploading.value) return
  event.preventDefault()
  isDragOver.value = false
}

const handleDrop = async (event) => {
  if (props.disable || isUploading.value) return
  event.preventDefault()
  isDragOver.value = false

  const files = [...event.dataTransfer.files]
  await processFiles(files)
}

const triggerFileSelect = () => {
  if (props.disable || isUploading.value) return
  fileInputRef.value?.click()
}

const previewUploadedFile = (filePath) => {
  window.open(filePath, '_blank')
}

const triggerFilePreview = (file) => {
  const key = getFileKey(file)
  const localUrl = previewUrls.value[key]
  if (localUrl) {
    window.open(localUrl, '_blank')
  } else if (file.previewPath) {
    previewUploadedFile(file.previewPath)
  }
}

const removeFile = (index) => {
  const file = selectedFiles.value[index]
  removePreviewUrl(file)
  clearFileStatus(file)
  clearFileError(file)
  selectedFiles.value.splice(index, 1)
}

const getPendingFiles = () => {
  return selectedFiles.value.filter((file) => !file.previewPath)
}

const clearAllFiles = () => {
  revokeAllBlobUrls()
  fileStatuses.value = {}
  fileErrors.value = {}
  selectedFiles.value = []
}

defineExpose({
  upload: () => uploadFiles(),
  uploadFiles,
  getPendingFiles,
  clearAllFiles,
  isUploading,
  uploaderRef: fileInputRef,
  selectedFiles,
})
</script>

<style scoped lang="scss">
.base-uploader {
  max-height: fit-content;
  width: 100%;
  position: relative;

  &--disabled {
    opacity: 0.6;
    pointer-events: none;

    .base-uploader__header {
      background-color: $grey-3;
      border: 1px solid $grey-4;
    }
  }

  &__input {
    display: none;
  }

  &__drop-zone {
    text-align: center;
    border: 1px solid $grey-outline;
    border-radius: $radius-md;
    cursor: pointer;
    padding: $spacing-sm;
    transition: all 0.2s ease;
    background-color: $grey-outline;
    color: $body;

    &--drag-over {
      border-color: $primary;
      background-color: rgba($primary, 0.1);
      transform: scale(1.02);
    }
  }

  &__header {
    background-color: $white;
    padding: $spacing-sm;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid transparent;
    border-radius: $radius-md;
    gap: $spacing-sm;
    transition: all 0.2s ease;

    &:hover {
      border-color: $primary;
      color: $primary;
    }
  }

  &__header-icon {
    border: 1px solid $grey-2;
    width: 40px;
    height: 40px;
    margin: auto;
    padding-top: $spacing-sm;
    border-radius: 8px;
    background-color: $grey-2;
    transition: all 0.2s ease;

    .base-uploader__drop-zone:hover & {
      background-color: rgba($primary, 0.1);
    }
  }

  &__header-title {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: $grey-9;
    gap: $spacing-xs;
    font-weight: 500;
  }

  &__header-desc {
    font-size: 0.75rem;
    color: $grey-6;
    direction: rtl;
  }

  &__list {
    position: relative;
    min-height: 60px;
    padding: 1rem;
    margin: 0.5rem;
    background-color: $grey-1;
    border-radius: 8px;
    overflow-y: auto;
    max-height: 150px;
  }

  &__thumbs {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  &__thumb {
    position: relative;
    width: 96px;
    height: 96px;
    border: 1px solid $grey-3;
    border-radius: 8px;
    background-color: $white;
    overflow: hidden;
    padding: $spacing-sm;

    &--success {
      border-color: $green-6;
    }

    &--error {
      border-color: $red-6;
    }
  }

  &__thumb-img {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  &__thumb-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  &__thumb-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba($white, 0.7);

    &--error {
      color: $red-6;
    }
  }

  &__thumb-remove {
    position: absolute;
    top: -$spacing-xs;
    right: 65px;
    inset-inline-end: 0;
    padding: 0;
    border: none;
    border-radius: 50%;
    background-color: $grey-6;
    color: $white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: $red-6;
    }
  }

  &__file-wrapper {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background-color: white;
    border-radius: 8px;
    border: 1px solid $grey-3;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &--success {
      border-color: $green-6;
    }

    &--error {
      border-color: $red-6;
    }
  }

  &__item-error {
    margin-top: 2px;
  }

  &__item-info {
    flex: 1;
    margin: 0 12px;
    min-width: 0;
  }

  &__item-name {
    direction: rtl;
    text-align: right;
  }

  &__item-size {
    margin-top: 2px;
  }

  &__preview {
    text-align: left;
    margin-top: 4px;
  }

  &__file-icon {
    cursor: pointer;
    border-radius: 6px;
    overflow: hidden;
  }

  &__preview-thumb {
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba($primary, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba($primary, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba($primary, 0);
  }
}

.base-uploader__drop-zone--drag-over {
  animation: pulse 1.5s infinite;
}
</style>
