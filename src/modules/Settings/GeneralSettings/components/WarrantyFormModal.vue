<template>
  <QDialog :model-value="visible" @update:model-value="$emit('close')">
    <QCard flat class="wsd">
      <QInnerLoading :showing="isPending">
        <QSpinnerGears size="40" color="primary" />
      </QInnerLoading>
      <div class="wsd__header">
        <Typography variant="heading" size="h6">
          {{ isEditMode ? 'ویرایش ضمانت نامه' : 'ضمانت‌نامه جدید' }}
        </Typography>
        <Button
          variant="flat"
          is-icon-only
          is-rounded
          :left-icon="IconX"
          color="grey"
          @click="closeModal"
        />
      </div>
      <QForm class="wsd__form" @submit.prevent="submitForm">
        <div class="wsd__form-content">
          <ServeSelect
            :model-value="serveWarrantyData.serveId"
            label="نام خدمت"
            outlined
            clearable
            mini-serve-service
            :prop-filter="filter"
            clear-icon="clear"
            :disable="isEditMode"
            :error-message="errors.serveId ?? null"
            @update:model-value="(e) => handleChange('serveId', e)"
          />
          <Select
            :options="warrantyServeItemData"
            :model-value="normalizedServeItemId"
            label="نوع"
            outlined
            clearable
            clear-icon="clear"
            option-label="title"
            option-value="id"
            emit-value
            map-options
            :loading="isWarrantyServeLoading"
            :disable="isWarrantyServeLoading || isEditMode"
            :error-message="errors.serveItemId ?? null"
            @update:model-value="(e) => handleChange('serveItemId', e)"
          >
            <template #option="{ opt, itemProps }">
              <QItem v-bind="itemProps">
                <div class="flex full-width justify-between items-center">
                  <Typography variant="body" size="3">{{ opt.title }}</Typography>
                  <Typography v-if="opt.months > 0" variant="body" size="3" color="red">
                    {{ opt.months }} ماه
                  </Typography>
                </div>
              </QItem>
            </template>
          </Select>
          <NumberField
            v-if="!isUnLimited"
            :model-value="serveWarrantyData.months ?? null"
            label="مدت زمان ضمانت (ماه)"
            placeholder="تعداد ماه ضمانت را وارد کنید"
            outlined
            clearable
            clear-icon="clear"
            :disable="isUnLimited"
            :error-message="errors.months ?? null"
            @update:model-value="(e) => handleChange('months', e)"
          />

          <Toggle :model-value="isUnLimited" label="مادام العمر" @click="handleUnlimitedMonth" />
        </div>
        <div class="wsd__form-actions">
          <Button
            variant="outline"
            color="red"
            text="انصراف"
            :is-loading="isPending"
            @click="closeModal"
          />
          <Button
            variant="filled"
            color="light-blue"
            text="ثبت و ذخیره"
            :is-loading="isPending"
            type="submit"
          />
        </div>
      </QForm>
    </QCard>
  </QDialog>
</template>

<script setup>
import { computed, ref, toRefs, watch } from 'vue'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import Toggle from '@/base/Toggle'
import Select from '@/base/SelectField'
import { IconX } from '@tabler/icons-vue'
import {
  useGetWarrantyServeById,
  useSaveWarrantyServeData,
} from '@/modules/Settings/GeneralSettings/query'
import { object, number } from 'yup'
import useYup from '@/composables/use-yup'
import ServeSelect from '@/components/Form/ServeSelect'
import NumberField from '@/components/Form/NumberField'
import { useQueryClient } from '@tanstack/vue-query'
import { Notif } from '@/data/services/notification-service'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object,
    default: null,
  },
})
const { visible, data } = toRefs(props)
const emits = defineEmits(['close'])
const queryClient = useQueryClient()

const updatedWarrantyData = ref(null)

const initialData = computed(() => data?.value)
const filter = ref({
  is_warranty_eligible: 1,
})

const serveWarrantyData = computed(() => updatedWarrantyData.value || initialData.value || {})
const isEditMode = computed(() => !!data?.value)
const isUnLimited = ref(false)
let tempMonths

const validationSchema = object().shape({
  serveId: number().required('خدمت مورد نظر را انتخاب کنید'),
  serveItemId: number().required('نوع را مشخص کنید'),
  months: number().when('$isUnLimited', {
    is: false,
    // eslint-disable-next-line unicorn/no-thenable
    then: (schema) => schema.required('مدت ضمانت را مشخص کنید'),
    otherwise: (schema) => schema.notRequired().strip(),
  }),
})

const warrantyServeId = computed(() => data.value?.serveId ?? serveWarrantyData.value?.serveId)
const { data: warrantyServe, isLoading: isWarrantyServeLoading } =
  useGetWarrantyServeById(warrantyServeId)
const warrantyServeItemData = computed(() => warrantyServe.value?.items || [])

const normalizedServeItemId = computed(() => {
  const itemId = serveWarrantyData.value?.serveItemId
  if (!itemId) return null
  const firstOption = warrantyServeItemData.value[0]
  if (firstOption && typeof firstOption.id === 'number') {
    return Number(itemId)
  }
  return String(itemId)
})

const { validate, validateAt, errors } = useYup(validationSchema)

const handleChange = (field, value) => {
  updatedWarrantyData.value = { ...serveWarrantyData.value, [field]: value }
  if (field === 'months') {
    validateAt(field, value, { isUnLimited: isUnLimited.value })
  } else {
    validateAt(field, value)
  }
}

watch(
  () => data.value,
  (newData) => {
    if (newData?.months > 1000) {
      isUnLimited.value = true
      tempMonths = newData.months === 1200 ? 0 : newData.months
    } else {
      isUnLimited.value = false
      tempMonths = undefined
    }
  },
  { immediate: true }
)

const handleUnlimitedMonth = () => {
  if (isUnLimited.value) {
    isUnLimited.value = false
    handleChange('months', tempMonths ?? 0)
  } else {
    tempMonths = serveWarrantyData.value?.months
    isUnLimited.value = true
    handleChange('months', 1200)
  }
}
const closeModal = () => {
  updatedWarrantyData.value = null
  isUnLimited.value = false
  tempMonths = undefined
  emits('close')
}

const { mutate, isPending } = useSaveWarrantyServeData()
const submitForm = async () => {
  const { isValid, payload } = await validate(serveWarrantyData.value, {
    abortEarly: false,
    stripUnknown: true,
    context: { isUnLimited: isUnLimited.value },
  })
  if (!isValid) return
  const formPayload = {
    serveId: payload.serveId,
    itemId: payload.serveItemId?.id || payload.serveItemId,
    months: isUnLimited.value ? 1200 : Number(payload.months),
  }
  mutate(
    { ...formPayload },
    {
      onSuccess: (response) => {
        Notif.success(response.message)
        queryClient.invalidateQueries({
          queryKey: ['settings', 'warranty-list'],
        })
        queryClient.invalidateQueries({
          queryKey: ['settings', 'warranty-id'],
        })
        closeModal()
      },
    }
  )
}
</script>

<style scoped lang="scss">
.wsd {
  min-width: 480px;
  padding: $spacing-lg $spacing-xl;
  border-radius: $radius-lg;
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: $spacing-lg;
  }
  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-3xl;
    &-content {
      display: flex;
      flex-direction: column;
      gap: $spacing-xl;
    }
    &-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: $spacing-lg;
    }
  }
}
</style>
