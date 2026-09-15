<template>
  <div class="feedback-media-gallery">
    <!-- Add Button -->
    <button class="feedback-media-gallery__add-media" @click="openFileDialog">
      <IconPlus :size="24" class="plus-icon" />
      <span>افزودن</span>
    </button>
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*,video/*"
      multiple
      style="display: none"
      @change="handleFileSelect"
    />

    <!-- Media Items -->
    <div v-for="file in mediaFiles" :key="file.id" class="feedback-media-gallery__media-item">
      <div class="feedback-media-gallery__media-content" @click="handleView(file)">
        <!-- Image -->
        <img
          v-if="(file.mimeType || file.mime_type)?.startsWith('image/')"
          :src="file.path"
          :alt="file.fileName || file.file_name"
          class="feedback-media-gallery__media-image"
        />
        <!-- Video -->
        <video
          v-else-if="(file.mimeType || file.mime_type)?.startsWith('video/')"
          :src="file.path"
          class="feedback-media-gallery__media-video"
        />
        <!-- Dark overlay on hover -->
        <div class="feedback-media-gallery__media-overlay" />
      </div>
      <button class="feedback-media-gallery__media-view" @click.stop="handleView(file)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path
            d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
          />
        </svg>
      </button>
      <button
        class="feedback-media-gallery__media-delete"
        :disabled="isDeletingAttachment"
        @click.stop="handleDelete(file)"
      >
        <IconTrash :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { IconPlus, IconTrash } from '@tabler/icons-vue'

defineProps({
  mediaFiles: {
    type: Array,
    default: () => [],
  },
  isDeletingAttachment: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['view', 'delete', 'add-files'])

const fileInputRef = ref(null)

const openFileDialog = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const handleFileSelect = (event) => {
  const { files } = event.target
  if (!files || files.length === 0) return

  emit('add-files', [...files])

  // Clear the file input
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleView = (file) => {
  emit('view', file)
}

const handleDelete = (file) => {
  emit('delete', file)
}
</script>

<style lang="scss" scoped>
.feedback-media-gallery {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }

  &__media-item {
    position: relative;
    flex-shrink: 0;
    width: 128px;
    height: 128px;
    border-radius: 12px;
    overflow: hidden;

    &:hover {
      .feedback-media-gallery__media-view,
      .feedback-media-gallery__media-delete {
        opacity: 1;
      }

      .feedback-media-gallery__media-overlay {
        opacity: 1;
      }
    }
  }

  &__media-content {
    position: relative;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #cbd5e0 0%, #94a3b8 100%);
    cursor: pointer;
  }

  &__media-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &__media-image,
  &__media-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__media-view {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
    color: white;

    svg {
      fill: white;
    }

    &:hover {
      background: rgba(0, 0, 0, 0.7);
    }
  }

  &__media-delete {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(239, 68, 68, 0.85);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
    color: white;

    &:hover {
      background: rgba(239, 68, 68, 1);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: rgba(156, 163, 175, 0.85);
    }
  }

  &__add-media {
    flex-shrink: 0;
    width: 128px;
    height: 128px;
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    background: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    color: #9ca3af;
    font-size: 0.875rem;

    .plus-icon {
      color: #9ca3af;
    }

    &:hover {
      border-color: #3b82f6;
      background: #eff6ff;
      color: #3b82f6;

      .plus-icon {
        color: #3b82f6;
      }
    }
  }
}
</style>
