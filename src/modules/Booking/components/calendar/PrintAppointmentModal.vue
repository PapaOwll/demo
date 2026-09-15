<template>
  <Modal
    :model-value="modelValue"
    title="پرینت نوبت"
    :width="500"
    @update:model-value="(val) => emit('update:modelValue', val)"
    @close="emit('update:modelValue', false)"
  >
    <div class="print-appointment-modal__body">
      <PersianDate
        v-model="formDate"
        label="تاریخ"
        required
        :error="!!dateError"
        :error-message="dateError"
      />

      <SelectField
        v-model="formDoctorId"
        :options="filteredDoctorOptions"
        :loading="isDoctorsLoading"
        label="پزشک"
        required
        emit-value
        map-options
        outlined
        use-input
        input-debounce="300"
        :search-fn="filterDoctors"
        :error="!!doctorError"
        :error-message="doctorError"
      />
    </div>

    <template #footer>
      <div class="print-appointment-modal__actions">
        <Button
          class="print-appointment-modal__action"
          variant="outline"
          color="grey"
          text="بازگشت"
          @click="close"
        />
        <Button
          class="print-appointment-modal__action"
          color="light-blue"
          text="پرینت"
          :is-disabled="!canSubmit || isPrinting"
          :is-loading="isPrinting"
          @click="onPrint"
        />
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Modal from '@/base/Modal'
import Button from '@/base/Button'
import SelectField from '@/base/SelectField'
import PersianDate from '@/components/Form/PersianDate'
import useRoles from '@/composables/use-roles'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  defaultDate: {
    type: String,
    default: '',
  },
  submitFn: {
    type: Function,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const { data: doctorsData } = useRoles(['doctor'])
const isDoctorsLoading = computed(() => !doctorsData.value)

const doctorOptions = computed(() => {
  const items = doctorsData.value?.items ?? []
  return items.map((item) => ({
    label: item.name || `#${item.id}`,
    value: item.id,
  }))
})

const filteredDoctorOptions = ref([])

const filterDoctors = (val, update) => {
  update(() => {
    const needle = (val || '').trim().toLowerCase()
    filteredDoctorOptions.value = needle
      ? doctorOptions.value.filter((option) => (option.label || '').toLowerCase().includes(needle))
      : doctorOptions.value
  })
}

watch(
  doctorOptions,
  (options) => {
    filteredDoctorOptions.value = options
  },
  { immediate: true }
)

const formDate = ref(props.defaultDate || '')
const formDoctorId = ref(null)
const dateError = ref('')
const doctorError = ref('')
const isPrinting = ref(false)

const canSubmit = computed(() => !!formDate.value && !!formDoctorId.value)

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      formDate.value = props.defaultDate || ''
      formDoctorId.value = null
      dateError.value = ''
      doctorError.value = ''
      isPrinting.value = false
    }
  }
)

function close() {
  emit('update:modelValue', false)
}

async function onPrint() {
  if (!canSubmit.value || isPrinting.value) return

  let hasError = false
  if (!formDate.value) {
    dateError.value = 'انتخاب تاریخ الزامی است'
    hasError = true
  }
  if (!formDoctorId.value) {
    doctorError.value = 'انتخاب پزشک الزامی است'
    hasError = true
  }
  if (hasError) return

  isPrinting.value = true
  try {
    await props.submitFn?.({
      date: formDate.value,
      doctorId: formDoctorId.value,
    })
    close()
  } catch {
    isPrinting.value = false
  }
}
</script>

<style scoped lang="scss">
.print-appointment-modal {
  &__body {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $spacing-md;
    padding: $spacing-md 0;
  }

  &__actions {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  &__action {
    width: 48%;
  }
}
</style>
