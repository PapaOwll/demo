<template>
  <QDialog v-model="isOpen" maximized class="image-preview-modal">
    <div class="image-preview-modal__backdrop" @click="close">
      <QBtn outline round color="white" class="image-preview-modal__close-btn" @click.stop="close">
        <IconX size="28" color="white" />
      </QBtn>

      <div
        class="image-preview-modal__content"
        @click.stop
        @wheel.prevent="handleWheel"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <div class="image-preview-modal__image-container" :style="containerStyle">
          <img
            v-if="currentImage"
            :src="currentImage.url || currentImage.path || currentImage"
            :alt="currentImage.name || 'تصویر'"
            class="image-preview-modal__image"
          />
        </div>
      </div>
      <div class="actions" @click.stop>
        <QBtn color="white" round :disable="currentIndex <= 0" @click="prevImage">
          <IconChevronRight size="24" color="black" />
        </QBtn>
        <QBtn color="white" round :disable="currentIndex >= images.length - 1" @click="nextImage">
          <IconChevronLeft size="24" color="black" />
        </QBtn>
      </div>
      <slot name="extra-actions" />
      <div class="image-preview-modal__navbar" @click.stop>
        <div class="image-preview-modal__thumbnails">
          <div
            v-for="(image, index) in images"
            :key="index"
            class="image-preview-modal__thumbnail"
            :class="{ 'image-preview-modal__thumbnail--active': index === currentIndex }"
            @click="selectImage(index)"
          >
            <img
              :src="image.url || image.path || image"
              :alt="image.name || `تصویر ${index + 1}`"
            />
          </div>
        </div>
      </div>
    </div>
  </QDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IconX, IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'
import { useImageZoom } from '@/composables/use-image-zoom'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  images: {
    type: Array,
    default: () => [],
  },
  initialIndex: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const currentIndex = ref(props.initialIndex)

const currentImage = computed(() => {
  if (props.images.length === 0) return null
  return props.images[currentIndex.value]
})

// Use the zoom composable
const {
  containerStyle,
  reset: resetZoom,
  handleWheel,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
} = useImageZoom({
  minScale: 0.5,
  maxScale: 5,
})

// Helper to navigate to a specific image with zoom reset
const navigateToImage = (index) => {
  if (index >= 0 && index < props.images.length) {
    currentIndex.value = index
    resetZoom()
  }
}

watch(
  () => props.initialIndex,
  (newVal) => {
    currentIndex.value = newVal
  }
)

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      currentIndex.value = props.initialIndex
      resetZoom()
    }
  }
)

const close = () => {
  isOpen.value = false
}

const prevImage = () => navigateToImage(currentIndex.value - 1)

const nextImage = () => navigateToImage(currentIndex.value + 1)

const selectImage = (index) => navigateToImage(index)
</script>

<style lang="scss" scoped>
.image-preview-modal {
  &__backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(3px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  &__close-btn {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 10;
    background-color: rgba(255, 255, 255, 0.1);
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }

  &__content {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100dvw;
    max-height: 100%;
    overflow: hidden;
    user-select: none;
    margin-bottom: 7rem;
  }

  &__image-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  &__image {
    max-width: 90vw;
    max-height: calc(100vh - 200px);
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    pointer-events: none;
  }

  &__navbar {
    width: 95%;
    position: fixed;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    background-color: white;
    padding: 12px 16px;
    border-radius: 16px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  }
  &__thumbnails {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    overflow-x: auto;
    padding: 4px 0;

    &::-webkit-scrollbar {
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: $grey-3;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: $grey-5;
      border-radius: 3px;
    }
  }

  &__thumbnail {
    flex-shrink: 0;
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s ease;

    &:hover {
      border-color: $grey-5;
    }

    &--active {
      border-color: $primary;
      box-shadow: 0 0 0 2px rgba($primary, 0.3);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}
.actions {
  width: max-content;
  display: flex;
  //margin-bottom: 7rem;
  //margin-top: auto;
  justify-content: start;
  gap: 12px;
  padding: 0 2.2rem;
  z-index: 100 !important;
  position: absolute;
  bottom: 18%;
  right: 1%;
}
</style>
