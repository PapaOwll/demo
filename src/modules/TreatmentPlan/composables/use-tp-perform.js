import { useRoute } from 'vue-router'
import { Notif } from '@/data/services/notification-service'
import { useQueryClient } from '@tanstack/vue-query'
import { usePerformTreatmentPlanMutation } from '../query'
import { useTpProvider } from './use-tp-provider'
import { calculateItemPrice } from '../utils/pricing'
import { QUESTION_TYPE } from '../constants/enums'
import { getServiceQuestions } from '../constants/service-question-types'
import { buildServeIndustryItems } from '../utils/question-items-builder'

const handleError = (e, onErrorCallback) => {
  Notif.error(e.response?.data?.message || 'خطایی رخ داد', {
    group: false,
    timeout: 10_000,
  })

  onErrorCallback?.()
}

export const useTpPerform = () => {
  const route = useRoute()
  const queryClient = useQueryClient()
  const { selectedServe, resetLocalState } = useTpProvider(['selectedServe', 'resetLocalState'])

  const { mutate: performTreatmentPlan, isPending: isPerformPending } =
    usePerformTreatmentPlanMutation()

  const validateServices = (itemList) => {
    if (!selectedServe.value) {
      Notif.error('لطفاً ابتدا یک سرویس انتخاب کنید', { group: false, timeout: 5000 })
      return false
    }

    const selectedItem = itemList.find((item) => item.id === selectedServe.value.id)

    if (!selectedItem) {
      Notif.error('سرویس انتخاب شده معتبر نیست', { group: false, timeout: 5000 })
      return false
    }

    const questions = getServiceQuestions(selectedItem)
    const needsTeeth =
      questions?.some(
        (question) => question.type === QUESTION_TYPE.MULTIPLE && !question.coefficient
      ) || false

    if (needsTeeth && (!selectedItem.teeth || selectedItem.teeth.length === 0)) {
      Notif.error(
        `برای سرویس <strong>"${selectedItem?.title || 'انتخابی'}"</strong> حداقل یک دندان انتخاب کنید`,
        { group: false, html: true, timeout: 10_000 }
      )
      return false
    }

    const hasQuestions = questions && questions.length > 0
    const hasQuestionsWithItems =
      questions?.some((question) => question.items && question.items.length > 0) || false

    if (hasQuestions && !hasQuestionsWithItems) {
      Notif.error(
        `برای سرویس <strong>"${selectedItem?.title || 'انتخابی'}"</strong> حداقل یک گزینه انتخاب کنید`,
        { group: false, html: true, timeout: 10_000 }
      )
      return false
    }

    return true
  }

  const buildPerformanceData = (itemList) => {
    const selectedItem = itemList.find((item) => item.id === selectedServe.value.id)

    if (!selectedItem) {
      return null
    }

    const teeth = selectedItem.convertedTeeth
      ? selectedItem.convertedTeeth
          .map((ts) => ({
            position: ts.key,
            number: ts.teeth,
          }))
          .filter((_item) => _item.number.length > 0)
      : []

    const serveIndustryItems = selectedItem.questions
      ? selectedItem.questions
          .flatMap((question) => buildServeIndustryItems(question))
          .filter(Boolean)
      : []

    const totalPrice = calculateItemPrice(selectedItem)

    return {
      serve_industry_id: selectedServe.value.id,
      price: totalPrice,
      teeth,
      serve_industry_items: serveIndustryItems,
    }
  }

  const handleSuccess = async (res, onSuccessCallback) => {
    res.message && Notif.success(res.message, { group: false })

    resetLocalState?.()
    await queryClient.invalidateQueries({
      queryKey: ['new-treatment-plan', 'treatment', route.params?.id],
    })
    await queryClient.invalidateQueries({
      queryKey: ['treatment-plan', 'all-treatment-plans'],
    })

    onSuccessCallback?.()
  }

  const performTpAction = (itemList, { onSuccess, onError } = {}) => {
    if (!validateServices(itemList)) return

    const performanceData = buildPerformanceData(itemList)

    if (!performanceData) {
      Notif.error('داده‌های سرویس انتخاب شده برای اجرا آماده نیست', {
        group: false,
        timeout: 5000,
      })
      return
    }

    performTreatmentPlan(
      { treatmentPlanId: route.params?.id, data: performanceData },
      {
        onSuccess: (res) => handleSuccess(res, onSuccess),
        onError: (e) => handleError(e, onError),
      }
    )
  }

  return {
    performTpAction,
    isPerformPending,
  }
}
