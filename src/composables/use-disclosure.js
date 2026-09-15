import { ref } from 'vue'

export default function useDisclosure(initialState = false, callbacks = {}) {
  const { onOpen, onClose } = callbacks
  const isOpened = ref(initialState)

  const open = () => {
    if (!isOpened.value) {
      isOpened.value = true
      onOpen?.()
    }
  }

  const close = () => {
    if (isOpened.value) {
      isOpened.value = false
      onClose?.()
    }
  }

  const toggle = () => {
    isOpened.value ? close() : open()
  }

  return [isOpened, { open, close, toggle }]
}
