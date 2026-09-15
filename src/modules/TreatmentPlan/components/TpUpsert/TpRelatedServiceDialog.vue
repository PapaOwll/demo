<template>
  <Modal
    :model-value="modelValue"
    :title="title"
    :persistent="true"
    :show-close="false"
    :width="500"
    transition-show="slide-down"
    transition-hide="slide-up"
    @update:model-value="updateModalValue"
  >
    <Typography variant="body" size="3" color="dark">{{ message }}</Typography>

    <template #footer>
      <Button variant="outline" color="dark" :text="cancelText" @click="handleNo" />
      <Button variant="filled" :color="color" :text="confirmText" @click="handleYes" />
    </template>
  </Modal>
</template>

<script setup>
import Modal from '@/base/Modal'
import Typography from '@/base/Typography'
import Button from '@/base/Button'

defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'ثبت سرویس',
  },
  message: {
    type: String,
    required: true,
  },
  confirmText: {
    type: String,
    default: 'بله',
  },
  cancelText: {
    type: String,
    default: 'خیر',
  },
  color: {
    type: String,
    default: 'light-blue',
  },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const updateModalValue = ($event) => {
  emit('update:modelValue', $event)
}

const handleYes = () => {
  emit('update:modelValue', false)
  emit('confirm')
}

const handleNo = () => {
  emit('update:modelValue', false)
  emit('cancel')
}
</script>
