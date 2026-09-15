<template>
  <QDialog
    ref="dialogRef"
    :model-value="modelValue"
    :persistent="persistent"
    :seamless="seamless"
    :position="position"
    :transition-show="transitionShow"
    :transition-hide="transitionHide"
    :transition-duration="transitionDuration"
    :backdrop-filter="backdropFilter"
    :content-style="dialogContentStyle"
    :content-class="contentClass"
    @update:model-value="handleModelValueUpdate"
    @before-show="(e) => emit('beforeShow', e)"
    @before-hide="(e) => emit('beforeHide', e)"
  >
    <QCard flat :class="[modalClasses, cardClass]" :style="cardStyle">
      <QInnerLoading :showing="loading">
        <QSpinnerTail color="primary" size="40px" />
      </QInnerLoading>

      <div v-if="showHeader" class="modal__header">
        <slot name="header">
          <div class="modal__header-content">
            <div class="modal__header-titles">
              <Typography
                v-if="title"
                weight="medium"
                variant="heading"
                size="h6"
                color="dark-primary"
              >
                {{ title }}
              </Typography>
              <Typography v-if="subtitle" variant="body" size="4" color="body">
                {{ subtitle }}
              </Typography>
            </div>
            <Button
              v-if="showClose"
              variant="flat"
              color="dark"
              is-icon-only
              is-rounded
              :left-icon="IconX"
              size="sm"
              aria-label="بستن"
              @click="handleClose"
            />
          </div>
        </slot>
      </div>

      <Button
        v-if="showClose && !showHeader"
        variant="flat"
        color="grey"
        is-icon-only
        is-rounded
        :left-icon="IconX"
        class="modal__close-standalone"
        aria-label="بستن"
        @click="handleClose"
      />

      <div class="modal__body">
        <slot />
      </div>

      <div v-if="hasFooter" class="modal__footer">
        <slot name="footer" />
      </div>
    </QCard>
  </QDialog>
</template>

<script setup>
import { computed, useTemplateRef, useSlots } from 'vue'
import { QDialog, QCard, QInnerLoading, QSpinnerTail } from 'quasar'
import { IconX } from '@tabler/icons-vue'
import Typography from '@/base/Typography'
import Button from '@/base/Button'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: undefined,
  },
  subtitle: {
    type: String,
    default: undefined,
  },
  persistent: {
    type: Boolean,
    default: false,
  },
  position: {
    type: String,
    default: undefined,
  },
  seamless: {
    type: Boolean,
    default: false,
  },
  showClose: {
    type: Boolean,
    default: true,
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  minWidth: {
    type: [String, Number],
    default: undefined,
  },
  minHeight: {
    type: [String, Number],
    default: undefined,
  },
  width: {
    type: [String, Number],
    default: undefined,
  },
  height: {
    type: [String, Number],
    default: undefined,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  transitionShow: {
    type: String,
    default: 'scale',
  },
  transitionHide: {
    type: String,
    default: 'scale',
  },
  transitionDuration: {
    type: [String, Number],
    default: undefined,
  },
  backdropFilter: {
    type: String,
    default: undefined,
  },
  backgroundColor: {
    type: String,
    default: undefined,
  },
  contentClass: {
    type: String,
    default: undefined,
  },
  cardClass: {
    type: [String, Array, Object],
    default: undefined,
  },
})

const emit = defineEmits(['update:modelValue', 'close', 'beforeShow', 'beforeHide'])

const slots = useSlots()
const dialogRef = useTemplateRef(null)

const hasFooter = computed(() => !!slots.footer)

const toPx = (value) => (typeof value === 'number' ? `${value}px` : value)

const isDrawer = computed(() => ['left', 'right', 'top', 'bottom'].includes(props.position))

const modalClasses = computed(() => {
  return [
    'modal',
    {
      'modal--no-header': !props.showHeader,
      'modal--no-footer': !hasFooter.value,
      'modal--drawer': isDrawer.value,
      'modal--drawer-left': props.position === 'left',
      'modal--drawer-right': props.position === 'right',
      'modal--drawer-top': props.position === 'top',
      'modal--drawer-bottom': props.position === 'bottom',
    },
  ]
})

const dialogContentStyle = computed(() => {
  const style = { maxWidth: 'none' }
  if (props.minWidth) {
    style.minWidth = toPx(props.minWidth)
  }
  return style
})

const cardStyle = computed(() => {
  const style = {}
  if (props.width) {
    style.width = toPx(props.width)
  }
  if (props.height) {
    style.height = toPx(props.height)
  }
  if (props.minHeight) {
    style.minHeight = `min(${toPx(props.minHeight)}, calc(100vh - 48px))`
  }
  if (props.backgroundColor) {
    style['--modal-bg-color'] = props.backgroundColor
  }
  return style
})

const handleModelValueUpdate = (value) => {
  if (!value) {
    emit('close')
  }
  emit('update:modelValue', value)
}

const handleClose = () => {
  emit('close')
  emit('update:modelValue', false)
}

defineExpose({
  show: () => dialogRef.value?.show(),
  hide: () => {
    dialogRef.value?.hide()
    handleClose()
  },
})
</script>

<style lang="scss" scoped src="./modal.scss" />
