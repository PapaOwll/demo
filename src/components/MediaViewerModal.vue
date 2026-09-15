<template>
  <QDialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <QCard class="media-viewer-card">
      <QCardSection class="media-viewer-card__header">
        <div class="text-h6">{{ media?.fileName || media?.file_name || 'فایل' }}</div>
        <QBtn icon="close" flat round dense @click="handleClose" />
      </QCardSection>

      <QCardSection class="media-viewer-card__content">
        <!-- Image Viewer -->
        <img
          v-if="isImage"
          :src="media?.path"
          :alt="media?.fileName || media?.file_name"
          class="media-viewer-card__image"
        />

        <!-- Video Viewer -->
        <video
          v-else-if="isVideo"
          ref="videoRef"
          :src="media?.path"
          class="media-viewer-card__video"
          controls
          autoplay
        />
      </QCardSection>

      <QCardActions align="right" class="media-viewer-card__actions">
        <QBtn flat color="primary" label="دانلود" icon="download" @click="handleDownload" />
        <QBtn
          flat
          color="negative"
          label="حذف"
          icon="delete"
          :loading="isDeleting"
          @click="handleDelete"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  media: {
    type: Object,
    default: null,
  },
  isDeleting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'download', 'delete'])

const videoRef = ref(null)

const mimeType = computed(() => props.media?.mimeType || props.media?.mime_type || '')

const isImage = computed(() => mimeType.value.startsWith('image/'))

const isVideo = computed(() => mimeType.value.startsWith('video/'))

const handleClose = () => {
  if (videoRef.value) {
    videoRef.value.pause()
  }
  emit('update:modelValue', false)
}

const handleDownload = () => {
  emit('download', props.media)
}

const handleDelete = () => {
  emit('delete', props.media)
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen && videoRef.value) {
      videoRef.value.pause()
      videoRef.value.src = ''
    }
  }
)
</script>

<style lang="scss" scoped>
.media-viewer-card {
  background: white;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid $grey-3;
    background: white;

    .text-h6 {
      margin: 0;
      font-weight: 600;
      color: $grey-9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 400px;
    }
  }

  &__content {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: white;
    max-height: calc(90vh - 180px);
    overflow: auto;
  }

  &__image {
    max-width: 100%;
    max-height: calc(90vh - 200px);
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: 8px;
  }

  &__video {
    max-width: 100%;
    max-height: calc(90vh - 200px);
    width: auto;
    height: auto;
    border-radius: 8px;
  }

  &__actions {
    padding: 1rem 1.5rem;
    border-top: 1px solid $grey-3;
    background: white;
    gap: 0.5rem;
  }
}

@media (max-width: 768px) {
  .media-viewer-card {
    max-width: 95vw;

    &__header .text-h6 {
      max-width: 200px;
      font-size: 1rem;
    }

    &__content {
      padding: 1rem;
    }

    &__image,
    &__video {
      max-height: calc(90vh - 180px);
    }
  }
}
</style>
