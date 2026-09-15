import { onMounted, onBeforeUnmount } from 'vue'
import { confirmDialog } from '@/data/services/notification-service'
import { onBeforeRouteLeave } from 'vue-router'

export function useUnsavedChangesGuard(hasUnsavedChangesRef) {
  const handleBeforeUnload = (e) => {
    if (hasUnsavedChangesRef.value) {
      e.preventDefault()
      e.returnValue = ''
    }
  }

  onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeRouteLeave((to, from, next) => {
    if (hasUnsavedChangesRef.value) {
      confirmDialog(
        'توجه!',
        'شما تغییراتی دارید که ذخیره نشده است. آیا می‌خواهید صفحه را ترک کنید؟',
        () => next(),
        {
          icon: 'warning',
          ok: { label: 'ترک صفحه', flat: true, color: 'primary' },
          cancel: { label: 'انصراف', flat: true, color: 'negative' },
          persistent: true,
        },
        () => next(false)
      )
    } else {
      next()
    }
  })
}
