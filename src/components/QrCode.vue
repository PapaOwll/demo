<template>
  <div class="qr-code" :style="{ width: `${size}px`, height: `${size}px` }">
    <canvas v-show="!hasError" ref="canvasRef" class="qr-code__canvas" />
    <div v-if="hasError" class="qr-code__error">
      <IconQrcode :size="32" class="qr-code__error-icon" />
      <Typography variant="caption" color="grey">خطا در ساخت QR کد</Typography>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import QRCode from 'qrcode'
import { IconQrcode } from '@tabler/icons-vue'
import Typography from '@/base/Typography'

interface Props {
  value: string
  size?: number
}

const props = withDefaults(defineProps<Props>(), { size: 128 })

const emit = defineEmits<{ error: [] }>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const hasError = ref(false)

const render = async (): Promise<void> => {
  if (!props.value || !canvasRef.value) return
  hasError.value = false
  try {
    await QRCode.toCanvas(canvasRef.value, props.value, {
      width: props.size,
      margin: 2,
    })
  } catch {
    hasError.value = true
    emit('error')
  }
}

onMounted(render)

watch(() => [props.value, props.size], render)
</script>

<style lang="scss" scoped>
.qr-code {
  display: flex;
  align-items: center;
  justify-content: center;

  &__canvas {
    display: block;
    border-radius: $radius-sm;
  }

  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    width: 100%;
    height: 100%;
    border: 1px dashed $grey-4;
    border-radius: $radius-sm;
    color: $grey-6;
  }

  &__error-icon {
    color: $grey-5;
  }
}
</style>
