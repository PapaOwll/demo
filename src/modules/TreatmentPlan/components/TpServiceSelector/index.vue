<template>
  <div class="service-selector">
    <div v-if="chartType === CHART_TYPES.DENTAL" class="chart-section">
      <Typography v-if="isImplantService" variant="body" size="3" weight="bold">
        محل کاشت ایمپلنت را مشخص کنید
      </Typography>

      <TeethChart
        :selected-teeth="selectedTeeth"
        :disabled="disabled"
        :is-implant="isImplantService"
        @toggle-tooth="toggleTooth"
        @quick-select="handleQuickSelect"
      />

      <div v-if="isType4Service" class="type4-ignore-section q-mt-md">
        <Checkbox
          v-model="ignoreType4Model"
          :label="service.title"
          :disabled="disabled"
          class="type4-ignore-checkbox"
        />
      </div>
    </div>

    <div class="questions-section">
      <Typography v-if="chartType === CHART_TYPES.JAW_BONE" variant="body" size="3" weight="bold">
        ناحیه تحت درمان را مشخص کنید
      </Typography>
      <QuestionsPanel
        :questions="filteredQuestions"
        :answers="itemAnswers"
        :selected-teeth="selectedTeeth"
        :selected-regions="selectedRegions"
        :disabled="isItemDisable"
        @set-answer="setItemAnswer"
      />

      <div class="description-section q-mt-md">
        <Typography variant="body" size="3" weight="bold" class="q-mb-sm">توضیحات</Typography>
        <TextField
          v-model="descriptionText"
          variant="outline"
          autogrow
          :disable="disabled"
          label="توضیحات درمان"
          hint="توضیحات اضافی را اینجا وارد کنید"
        />
      </div>
    </div>

    <div v-if="!disabled" class="actions">
      <Button
        v-if="hasSelections"
        text="پاک کردن همه"
        variant="outline"
        color="dark"
        @click="handleReset"
      />
      <Button text="ثبت شرح درمان" color="light-blue" :is-disabled="!isValid" @click="handleSave" />
    </div>
  </div>
</template>

<script setup>
import { watch, computed } from 'vue'
import { useServiceSelector } from '../../composables/use-service-selector'
import TeethChart from './TeethChart'
import QuestionsPanel from './QuestionsPanel'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import Checkbox from '@/base/Checkbox'
import TextField from '@/base/TextField'
import { CHART_TYPES } from '@/modules/TreatmentPlan/constants/chart-types'

const props = defineProps({
  service: {
    type: Object,
    required: true,
  },
  initialData: {
    type: Object,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  chartType: {
    type: String,
    default: 'dental',
  },
})

const initialData = computed(() => ({
  ...props.initialData,
  chartType: props.chartType,
}))
const emit = defineEmits(['save'])
const {
  selectedTeeth,
  selectedRegions,
  filteredQuestions,
  itemAnswers,
  descriptionText,
  outputData,
  isValid,
  ignoreNotType4,
  toggleTooth,
  setItemAnswer,
  setDescription,
  setChartType,
  reset,
  loadData,
  toggleIgnoreType4,
} = useServiceSelector(
  computed(() => props.service),
  initialData.value
)

const isImplantService = computed(() => {
  if (!props.service) return false

  const implantServiceIds = [246, 257]
  if (implantServiceIds.includes(props.service.id)) {
    return true
  }

  const title = props.service.title || ''
  return title.toLowerCase().includes('ایمپلنت') || title.toLowerCase().includes('implant')
})

const isType4Service = computed(() => {
  if (!props.service) return false

  if (!props.service.questions || !Array.isArray(props.service.questions)) {
    const serviceType = Number(props.service.type)
    return serviceType === 4
  }

  return props.service.questions.some((q) => Number(q.type) === 4)
})

const ignoreType4Model = computed({
  get: () => ignoreNotType4.value,
  set: () => {
    toggleIgnoreType4()
  },
})

const hasSelections = computed(() => {
  const hasTeeth = selectedTeeth.value && selectedTeeth.value.length > 0
  const hasRegions = selectedRegions.value && selectedRegions.value.length > 0
  const hasAnswers = itemAnswers.value && Object.keys(itemAnswers.value).length > 0

  return hasTeeth || hasRegions || hasAnswers
})

const isItemDisable = computed(() => props.disabled || ignoreNotType4.value)

const handleSave = () => {
  emit('save', outputData.value)
}

const handleReset = () => {
  reset()
}

const handleQuickSelect = (newTeeth) => {
  if (!Array.isArray(newTeeth)) {
    console.error('[handleQuickSelect] Expected array, got:', typeof newTeeth)
    return
  }

  const validTeeth = newTeeth.filter((t) => t >= 1 && t <= 28 && Number.isInteger(t))

  if (validTeeth.length !== newTeeth.length) {
    console.warn('[handleQuickSelect] Some invalid teeth were filtered out')
  }

  itemAnswers.value = {}

  selectedTeeth.value = validTeeth
  toggleTooth()
}

watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      loadData(newData)
    }
  },
  { immediate: true }
)

watch(descriptionText, (newText) => {
  setDescription(newText)
})

watch(
  () => props.chartType,
  (newChartType) => {
    if (newChartType) {
      setChartType(newChartType)
      if (!props.initialData && Object.keys(itemAnswers.value).length > 0) {
        itemAnswers.value = {}
      }
    }
  }
)
</script>

<style lang="scss" scoped>
.service-selector {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: $spacing-2xl;
  height: max(100% + 20dvh) !important;
}

.chart-section {
  background-color: white;
  border-radius: $radius-md;
  padding: $spacing-xl;
}

.type4-ignore-section {
  display: flex;
  align-items: center;
  padding: $spacing-lg;
  background-color: $grey-1;
  border-radius: $radius-sm;
  border: 1px solid $grey-3;
  width: 100%;
  :deep(.checkbox__title) {
    width: 100%;
    font-size: 18px !important;
    font-weight: 500;
  }
}

.questions-section {
  background-color: white;
  border-radius: $radius-md;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.actions {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: $spacing-md;
  justify-content: flex-end;
  padding: $spacing-sm $spacing-lg;
  background-color: white !important;
  border-top: 1px solid $grey-4;
  margin-top: auto;
  z-index: 100;
}
</style>
