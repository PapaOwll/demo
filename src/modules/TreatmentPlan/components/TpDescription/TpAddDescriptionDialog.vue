<template>
  <Modal
    :model-value="visible"
    :title="editData ? 'ویرایش شرح درمان' : 'افزودن شرح درمان'"
    :position="drawerPosition"
    backdrop-filter="blur(4px)"
    :transition-show="drawerTransitionShow"
    :transition-hide="drawerTransitionHide"
    :transition-duration="700"
    :width="drawerWidth"
    card-class="tpd-drawer"
    content-class="tpd-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <QScrollArea class="tpd-drawer__body">
      <div class="tpd__content">
        <div v-if="!editData" class="tpd__content-services">
          <div class="col-md-6 col-12 q-pa-none">
            <SelectField
              v-model="selectedService"
              class="tpd__search-input"
              variant="outline"
              label="نوع خدمت"
              placeholder="خدمت مورد نظر را بنویسید"
              :options="servicesList"
              option-label="title"
              option-value="id"
              emit-value
              map-options
              use-input
              clearable
              input-debounce="300"
              :loading="isLoading"
              :disable="isSaving"
              :search-fn="filterServices"
              @update:model-value="handleServiceSelect"
            >
              <template #startSection>
                <div class="tpd__search-icon">
                  <IconSearch size="18" />
                </div>
              </template>
              <template #no-option>
                <div class="tpd__no-option">
                  <Typography variant="body" size="4" color="grey">خدمتی یافت نشد</Typography>
                </div>
              </template>
            </SelectField>
          </div>

          <div class="col-md-6 col-12 q-pa-none">
            <SelectField
              v-model="localBookingId"
              class="tpd__booking-select"
              variant="outline"
              label="نوبت بیمار"
              placeholder="نوبت بیمار را انتخاب کنید"
              :options="bookingOptions"
              option-label="label"
              option-value="id"
              emit-value
              map-options
              clearable
              :loading="isBookingsLoading"
              :disable="isSaving"
            />
          </div>
        </div>

        <div v-if="selectedService || editData" class="tpd__chart-tabs-wrapper">
          <TabItem
            :model-value="selectedServiceChartType"
            style-type="underline"
            :group="chartTypeTabs"
            class="tpd__chart-tabs"
            :class="{ 'tpd__chart-tabs--disabled': isSaving }"
            @select="handleChartTabSelect"
          />
        </div>
        <QSeparator
          v-if="selectedService || editData"
          class="full-width"
          color="grey-4"
          style="margin-top: -14px; height: 2px"
        />

        <!-- Quick Add Services Chips -->
        <div v-if="!editData && !selectedService" class="tpd__quick-add">
          <Typography variant="caption" size="4" weight="semibold" color="grey">
            خدمات طرح درمان
          </Typography>

          <div v-if="isPatientServicesLoading" class="tpd__quick-add-chips">
            <QSkeleton
              v-for="n in 5"
              :key="n"
              type="rect"
              animation="wave"
              class="tpd__quick-skeleton"
            />
          </div>

          <div v-else-if="patientServices.length > 0" class="tpd__quick-add-chips">
            <Button
              v-for="serve in patientServices"
              :key="serve.id"
              type="button"
              variant="outline"
              size="sm"
              is-rounded
              :text="serve.title"
              :is-disabled="isSaving"
              class="tpd__quick-chip"
              @click="handleQuickSelect(serve)"
            />
          </div>
        </div>

        <!-- Service Selector Section -->
        <div v-if="selectedService && fullServiceObject" class="tpd__selector-section">
          <TpServiceSelector
            :service="fullServiceObject"
            :initial-data="serviceSelectorData"
            :chart-type="selectedServiceChartType"
            :disabled="isSaving"
            @save="handleServiceSelectorSave"
            @cancel="handleServiceSelectorCancel"
          />
        </div>
      </div>
    </QScrollArea>
  </Modal>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Notif } from '@/data/services/notification-service'
import { useQueryClient } from '@tanstack/vue-query'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import Modal from '@/base/Modal'
import SelectField from '@/base/SelectField'
import TabItem from '@/base/TabItem'
import { QScrollArea } from 'quasar'
import { IconSearch } from '@tabler/icons-vue'
import TpServiceSelector from '@/modules/TreatmentPlan/components/TpServiceSelector'
import {
  useGetTreatmentPlanByIdQuery,
  usePerformTreatmentPlanMutation,
  useServesWithQuestionsQuery,
  useUpdateTpDescriptionMutation,
} from '@/modules/TreatmentPlan/query'
import { handleError } from '@/utils/error-handler'
import { deduplicateTeeth } from '@/modules/TreatmentPlan/utils/teeth'
import { CHART_TYPES, DEFAULT_CHART_TYPE } from '@/modules/TreatmentPlan/constants/chart-types'
import {
  BASE_COUNT_REQUIRED_MESSAGE,
  filterQuestionsByChartType,
  getRecommendedChartType,
  getServiceQuestions,
  hasUnsetBaseCount,
} from '@/modules/TreatmentPlan/constants/service-question-types'
import {
  transformDescriptionToApiRequest,
  transformDescriptionToUpdateRequest,
} from '@/modules/TreatmentPlan/utils/tp-description-transformers'
import { useServiceSelector } from '@/modules/TreatmentPlan/composables/use-service-selector'
import {
  resolveChartType,
  resolveServiceWithParent,
} from '@/modules/TreatmentPlan/utils/service-resolver'
import { useIsMobile } from '@/composables/use-is-mobile'

const route = useRoute()
const queryClient = useQueryClient()
const emit = defineEmits(['update:visible', 'saved'])

const isMobile = useIsMobile()
const drawerPosition = computed(() => (isMobile.value ? 'bottom' : 'left'))
const drawerWidth = computed(() => (isMobile.value ? '100%' : '60dvw'))
const drawerTransitionShow = computed(() => (isMobile.value ? 'slide-up' : 'slide-right'))
const drawerTransitionHide = computed(() => (isMobile.value ? 'slide-down' : 'slide-left'))
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  tpId: {
    type: [String, Number],
    default: null,
  },
  bookingId: {
    type: [String, Number],
    default: null,
  },
  bookingOptions: {
    type: Array,
    default: () => [],
  },
  isBookingsLoading: {
    type: Boolean,
    default: false,
  },
  editData: {
    type: Object,
    default: null,
  },
})

const selectedService = ref(null)
const selectedServiceChartType = ref(DEFAULT_CHART_TYPE)
const filterText = ref('')
const fullServiceObject = ref(null)
const serviceSelectorData = ref(null)

const allServicesCache = ref([])
let requestCounter = 0
const hasSelectedService = ref(false)

const { data, isLoading, refetch } = useServesWithQuestionsQuery(
  filterText,
  computed(() => props.visible),
  { treatmentPlanId: computed(() => props.tpId) }
)
const servicesList = computed(() => {
  if (!data.value) return []
  if (data.value?.data?.items) return data.value.data.items
  if (data.value?.items) return data.value.items
  if (Array.isArray(data.value)) return data.value
  return []
})

const { data: tpData, isLoading: isPatientServicesLoading } = useGetTreatmentPlanByIdQuery(
  computed(() => props.tpId),
  { enabled: computed(() => !!props.tpId) }
)

const patientServices = computed(() => {
  const items = tpData.value?.items
  if (!Array.isArray(items)) return []
  return items.filter((serve) => serve.questions && serve.questions.length > 0)
})
const localBookingId = ref(props.bookingId ? Number(props.bookingId) : null)

watch(
  () => props.bookingId,
  (val) => {
    localBookingId.value = val ? Number(val) : null
  }
)

const { hasJawChart, setChartType } = useServiceSelector(fullServiceObject)

const chartTypeTabs = computed(() => {
  const tabs = [{ value: CHART_TYPES.DENTAL, label: 'چارت دندان' }]
  if (hasJawChart.value) {
    tabs.push({ value: CHART_TYPES.JAW_BONE, label: 'استخوان فک - لثه' })
  }
  return tabs
})

const saveDescriptionMutation = usePerformTreatmentPlanMutation()
const updateDescriptionMutation = useUpdateTpDescriptionMutation()

const isSaving = computed(
  () => saveDescriptionMutation.isPending.value || updateDescriptionMutation.isPending.value
)

const clearServiceData = () => {
  fullServiceObject.value = null
  serviceSelectorData.value = null
  selectedServiceChartType.value = DEFAULT_CHART_TYPE
  hasSelectedService.value = false
}

const filterServices = (val, update) => {
  update(() => {
    filterText.value = val.toUpperCase().trim()
    requestCounter += 1
  })
}

const updateChartType = (chartType) => {
  const validTypes = Object.values(CHART_TYPES)
  if (!validTypes.includes(chartType)) {
    handleError(new Error(`Invalid chart type: ${chartType}`))
    return
  }

  selectedServiceChartType.value = chartType
  setChartType(selectedServiceChartType.value)
}

const handleChartTabSelect = (chartType) => {
  if (isSaving.value) return
  updateChartType(chartType)
}

const handleServiceSelect = (service) => {
  if (!service) {
    if (hasSelectedService.value) {
      clearServiceData()
      hasSelectedService.value = false
    }
    return
  }

  hasSelectedService.value = true

  const result = resolveServiceWithParent(service, servicesList, allServicesCache)

  if (result.error || !result.service) {
    Notif.error('خطا در بارگذاری اطلاعات خدمت')
    return
  }
  const fullService = result.service
  const originalService = servicesList.value.find((s) => s.id === service)

  if (result.serviceToSelect !== service) {
    Notif.info(`خدمت "${fullService.title}" انتخاب شد`, {
      caption: `سرویس "${originalService?.title || ''}" زیرمجموعه این دسته است`,
      timeout: 3000,
    })
  }

  selectedService.value = fullService || result.serviceToSelect || result.service
  fullServiceObject.value = fullService

  let recommendedChartType
  if (originalService?.itemType === 'serve_industry_question') {
    const serviceType = Number(originalService.type)
    recommendedChartType = [1, 4].includes(serviceType) ? CHART_TYPES.DENTAL : CHART_TYPES.JAW_BONE
    updateChartType(recommendedChartType)
  } else {
    recommendedChartType = getRecommendedChartType(fullService)
    updateChartType(recommendedChartType)
  }

  selectedServiceChartType.value = recommendedChartType
  setChartType(selectedServiceChartType.value)

  if (!props.editData) {
    serviceSelectorData.value = null
  }

  const typeLabel =
    recommendedChartType === CHART_TYPES.JAW_BONE ? 'استخوان فک - لثه' : 'چارت دندان'
  Notif.info(`نوع چارت "${typeLabel}" انتخاب شد`, {
    caption: 'بر اساس نوع سوالات سرویس، چارت مناسب انتخاب شد',
    timeout: 3000,
  })
}

const handleQuickSelect = (item) => {
  if (!allServicesCache.value.some((s) => s.id === item.id)) {
    allServicesCache.value = [...allServicesCache.value, item]
  }
  handleServiceSelect(item.id)

  const teethEntry = (tpData.value?.teeth || []).find((t) => {
    const s = t?.serve || {}
    const serveId = s.serveId ?? s.serve_id
    const itemServeId = item.serveId ?? item.serve_id
    return s.id === item.id || (serveId != null && itemServeId != null && serveId === itemServeId)
  })
  const teeth = deduplicateTeeth(teethEntry?.teeth)
  if (teeth.length > 0) {
    serviceSelectorData.value = {
      selectedTeeth: teeth,
      selectedRegions: [],
      items: {},
      description: '',
      chartType: selectedServiceChartType.value,
    }
  }
}

const handleServiceSelectorSave = async (selectorData) => {
  const descriptionData = {
    chartType: selectedServiceChartType.value,
    selectedTeeth: selectorData.selectedTeeth,
    selectedRegions: selectorData.selectedRegions,
    items: selectorData.items,
    bookingId: localBookingId.value,
    description: selectorData.description,
    service: fullServiceObject.value,
  }

  const tpId = props.tpId || route.params?.id || route.query?.tpId

  if (!tpId) {
    Notif.error('شناسه طرح درمان یافت نشد')
    return
  }

  if (fullServiceObject.value) {
    const chartQuestions = filterQuestionsByChartType(
      getServiceQuestions(fullServiceObject.value),
      selectorData.chartType
    )
    if (hasUnsetBaseCount(chartQuestions, selectorData.items)) {
      Notif.error(BASE_COUNT_REQUIRED_MESSAGE, {
        caption: 'لطفاً تعداد پایه را انتخاب کنید',
      })
      return
    }
  }

  let requestData

  if (props.editData) {
    const updateData = transformDescriptionToUpdateRequest({
      selectorData,
      chartType: selectedServiceChartType.value,
      bookingId: localBookingId.value,
      service: fullServiceObject.value,
    })

    if (!updateData.serve_industry_item_id) {
      Notif.error('شناسه آیتم خدمت نامعتبر است')
      return
    }

    if (updateData.unit < 1) {
      Notif.error('تعداد واحد باید حداقل 1 باشد')
      return
    }

    if (Number(updateData.price) < 0) {
      Notif.error('مبلغ نمی‌تواند منفی باشد')
      return
    }

    requestData = updateData
  } else {
    if (!selectorData.serviceId) {
      Notif.error('شناسه سرویس نامعتبر است')
      return
    }

    if (!fullServiceObject.value) {
      Notif.warning('اطلاعات سرویس یافت نشد', {
        caption: 'لطفاً مجدداً سرویس را انتخاب کنید',
      })
      return
    }

    descriptionData.serviceId = selectorData.serviceId
    descriptionData.service = fullServiceObject.value
    descriptionData.isIgnored = selectorData.isIgnored
    requestData = transformDescriptionToApiRequest(descriptionData)
  }

  const loadingNotifier = Notif.info(
    props.editData ? 'در حال ویرایش شرح درمان...' : 'در حال ذخیره شرح درمان...',
    { timeout: 0, spinner: true }
  )

  try {
    if (props.editData) {
      await updateDescriptionMutation.mutateAsync({
        tpId,
        // tpdId targets the stored performed row; `id` is the catalog item id
        itemId: props.editData.tpdId ?? props.editData.id,
        ...requestData,
      })

      queryClient.invalidateQueries({
        queryKey: ['tp-description', tpId],
      })

      Notif.success('شرح درمان با موفقیت ویرایش شد')
    } else {
      await saveDescriptionMutation.mutateAsync({
        treatmentPlanId: tpId,
        data: requestData,
      })

      Notif.success('شرح درمان با موفقیت ذخیره شد')
    }

    clearServiceData()
    emit('saved', { descriptionData, requestData })
    emit('update:visible', false)
  } catch (error) {
    handleError(error)
  } finally {
    loadingNotifier()
  }
}

const handleServiceSelectorCancel = () => {
  serviceSelectorData.value = null
}

watch(
  data,
  (newData) => {
    if (!props.visible) return

    const currentRequestId = requestCounter

    if (newData?.data?.items) {
      if (filterText.value) {
        const updatedCache = [...allServicesCache.value]
        newData.data.items.forEach((newItem) => {
          const existingIndex = updatedCache.findIndex((s) => s.id === newItem.id)
          if (existingIndex >= 0) {
            updatedCache[existingIndex] = newItem
          } else {
            updatedCache.push(newItem)
          }
        })

        if (currentRequestId === requestCounter) {
          allServicesCache.value = updatedCache
        }
      } else if (currentRequestId === requestCounter) {
        allServicesCache.value = newData.data.items
      }
    }
  },
  { immediate: true }
)

watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      selectedService.value = null
      selectedServiceChartType.value = DEFAULT_CHART_TYPE
      filterText.value = ''
      hasSelectedService.value = false
      localBookingId.value = props.bookingId ? Number(props.bookingId) : null
      clearServiceData()
      return
    }

    refetch()
  }
)

let stopServicesWatcher = null

const cleanupServicesWatcher = () => {
  if (stopServicesWatcher) {
    stopServicesWatcher()
    stopServicesWatcher = null
  }
}

watch(
  () => props.editData,
  (editData) => {
    cleanupServicesWatcher()

    if (!editData) {
      clearServiceData()
      return
    }

    const serviceId = editData?.serveId
    if (!serviceId) return

    const loadEditData = () => {
      const result = resolveServiceWithParent(serviceId, servicesList, allServicesCache)

      if (result.error || !result.service) {
        Notif.warning('خدمت انتخاب شده در لیست موجود نیست', {
          caption: 'این خدمت ممکن است حذف شده باشد. لطفاً مجدداً انتخاب کنید',
          timeout: 5000,
        })
        selectedService.value = null
        fullServiceObject.value = null
        hasSelectedService.value = false
        return
      }

      selectedService.value = result.serviceToSelect
      hasSelectedService.value = true
      fullServiceObject.value = result.service
      selectedServiceChartType.value = resolveChartType(editData, result.service)

      const items = {}
      if (editData.questionId && editData.id) {
        items[editData.questionId] = {
          id: editData.id,
          price: editData.price || 0,
          // No auto-prefill: an unset base count must be re-picked manually
          // (the hasUnsetBaseCount guard then blocks the save until then).
          unit: editData.unit ?? null,
          title: editData.specialServices?.itemTitle || '',
        }
      }

      if (
        editData.selectedTeeth ||
        editData.selectedRegions ||
        Object.keys(items).length > 0 ||
        editData.description
      ) {
        serviceSelectorData.value = {
          selectedTeeth: editData.selectedTeeth || [],
          selectedRegions: editData.selectedRegions || [],
          items,
          description: editData.description || '',
          chartType: selectedServiceChartType.value,
        }
      }
    }

    if (servicesList.value.length > 0) {
      loadEditData()
    } else {
      stopServicesWatcher = watch(
        servicesList,
        (list) => {
          if (list.length > 0) {
            loadEditData()
            cleanupServicesWatcher()
          }
        },
        { once: true }
      )
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  cleanupServicesWatcher()
})
</script>

<style lang="scss">
.tpd__content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: $spacing-md;

  &-services {
    width: 100% !important;
    padding: $spacing-md $spacing-2xl $spacing-md;
  }
}

.tpd__search-input,
.tpd__booking-select {
  width: 100%;
}

.tpd__search-icon {
  display: flex;
  align-items: center;
  color: $grey-7;
}

.tpd__no-option {
  padding: $spacing-sm $spacing-md;
}

.tpd__chart-tabs-wrapper {
  margin-top: $spacing-xs;
}

.tpd__chart-tabs {
  display: flex;
  justify-content: start;

  :deep(.tab-group) {
    width: auto;
  }

  &--disabled {
    :deep(.tab-item) {
      cursor: not-allowed;
      opacity: 0.6;
      pointer-events: none;
    }
  }
}

.tpd__quick-add {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: $spacing-xs;
  margin-top: $spacing-xs;
  padding: 0 $spacing-2xl;
}

.tpd__quick-add-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $spacing-xs;
}

.tpd__quick-chip {
  font-size: 0.8125rem;
  font-weight: 500;
  border-color: $grey-4 !important;
  color: $grey-9 !important;
}

.tpd__quick-skeleton {
  width: 90px;
  height: 28px;
  border-radius: 999px;
}

.tpd__selector-section {
  width: 100%;
  padding: $spacing-md $spacing-lg $spacing-md $spacing-2xl;
}

.tpd-drawer {
  height: 92dvh;
  border-radius: $radius-lg !important;

  &__body {
    flex: 1;
    min-height: 0;
  }
}

@include media-breakpoint-down(md) {
  .q-dialog__inner.tpd-dialog {
    padding-inline: 0;
  }

  .q-dialog__inner .tpd-drawer {
    margin: 0;
    width: 100% !important;
    height: 100dvh;
    border-radius: 0 !important;
  }

  .tpd__quick-add {
    padding: 0 $spacing-md;
  }
}
</style>
