<template>
  <QFile
    ref="qFileRef"
    v-model="localFileModel"
    dense
    multiple
    class="ar__rnu-file"
    :accept="accept"
    label=""
    :disable="isLoading"
    @update:model-value="onFilesSelected"
  >
    <template #label>
      <div class="flex justify-center items-center q-gutter-xs text-weight-bold">
        <IconUpload class="text-grey-6" size="20" />
        <span class="text-grey-6">برای آپلود فایل،</span>
        <span class="text-primary">کلیک کن</span>
      </div>
    </template>
  </QFile>
</template>

<script setup>
import { ref } from 'vue'
import { IconUpload } from '@tabler/icons-vue'

defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
  accept: {
    type: String,
    default: 'audio/*',
  },
})

const emit = defineEmits(['files-selected'])

const qFileRef = ref(null)
const localFileModel = ref(null)

const onFilesSelected = (files) => {
  const fileList = Array.isArray(files) ? files : [files]
  if (fileList.length > 0) {
    emit('files-selected', fileList)
  }
  localFileModel.value = null
}

const reset = () => {
  localFileModel.value = null
}

defineExpose({
  reset,
})
</script>

<style lang="scss" scoped>
.ar__rnu-file {
  width: 100%;
  height: 48px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1.25rem;
  border: 2px dashed $grey-4 !important;
  border-radius: 24px !important;
  background-color: $grey-1 !important;
  transition: all 0.3s ease !important;

  &:hover {
    border-color: $primary !important;
    background-color: rgba($primary, 0.02) !important;
  }
}
</style>
