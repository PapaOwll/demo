<template>
  <Modal
    :model-value="visible"
    title="افزودن اقساط"
    transition-show="jump-down"
    transition-hide="jump-up"
    width="500px"
    height="420px"
    backdrop-filter="blur(2px)"
    has-footer
    @close="closeForm"
  >
    <QForm class="installment-content">
      <div class="row justify-center items-center q-col-gutter-sm">
        <div class="col-md-6 col-12">
          <NumberField
            :model-value="formData.month"
            label="تعداد ماه"
            required
            :error="!!errors?.month"
            :error-message="errors?.month || null"
            @update:model-value="(e) => handleChange('month', e)"
          />
        </div>

        <div class="col-md-6 col-12">
          <NumberField
            :model-value="formData.order"
            label="اولویت نمایش"
            required
            :error="!!errors?.order"
            :error-message="errors?.order || null"
            @update:model-value="(e) => handleChange('order', e)"
          />
        </div>

        <div class="col-md-6 col-12">
          <CurrencyField
            :model-value="formData.maxPrepay"
            label="حداکثر مبلغ خدمات"
            required
            :error="!!errors?.maxPrepay"
            :error-message="errors?.maxPrepay"
            @update:model-value="(e) => handleChange('maxPrepay', e)"
          />
        </div>

        <div class="col-md-6 col-12">
          <CurrencyField
            :model-value="formData.minPrice"
            label="حداقل مبلغ خدمات"
            required
            :error="!!errors?.minPrice"
            :error-message="errors?.minPrice"
            @update:model-value="(e) => handleChange('minPrice', e)"
          />
        </div>

        <div class="col-md-6 col-12">
          <NumberField
            :model-value="formData.percentage"
            label="درصد پیش پرداخت"
            required
            :error="!!errors?.percentage"
            :error-message="errors?.percentage || null"
            @update:model-value="(e) => handleChange('percentage', e)"
          />
        </div>

        <div class="col-md-6 col-12">
          <NumberField
            :model-value="formData.profit"
            label="سود اقساط"
            required
            :error="!!errors?.profit"
            :error-message="errors?.profit || null"
            @update:model-value="(e) => handleChange('profit', e)"
          />
        </div>

        <div class="col-12 flex items-center">
          <Toggle
            class="self-start"
            label="وضعیت نمایش"
            flip
            :model-value="formData.isActive"
            @update:model-value="(e) => handleChange('isActive', e)"
          />
        </div>
      </div>
    </QForm>

    <template #footer>
      <div class="footer">
        <Button
          color="dark"
          variant="outline"
          class="full-width"
          text="بازگشت"
          @click="closeForm"
        />
        <Button
          variant="filled"
          color="light-blue"
          class="full-width"
          :is-loading="isPending"
          text="ثبت"
          @click.prevent="submitForm"
        />
      </div>
    </template>
  </Modal>
</template>

<script setup>
import Button from '@/base/Button'
import NumberField from '@/components/Form/NumberField'
import CurrencyField from '@/components/Form/CurrencyField'
import Toggle from '@/base/Toggle'
import Modal from '@/base/Modal'
import useYup from '@/composables/use-yup'
import { useApiCreateInstallment } from '@/modules/Settings/index'
import { ref, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { installmentValidationSchema } from '../schema/installment-schema'
import { Notif, confirmDialog } from '@/data/services/notification-service'

const queryClient = useQueryClient()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits(['submit', 'close'])

const defaultFormState = () => ({
  month: 0,
  percentage: 0,
  order: 0,
  maxPrepay: 0,
  minPrice: 0,
  profit: 0,
  isActive: false,
})

const formData = ref(defaultFormState())

const { validate, validateAt, errors, resetErrors } = useYup(installmentValidationSchema)

watch(
  () => props.visible,
  (isOpen) => {
    if (!isOpen) return
    formData.value = defaultFormState()
    resetErrors()
  }
)

const { mutate: createInstallment, isPending } = useApiCreateInstallment()

const handleChange = (field, value) => {
  let finalValue = value
  if (field === 'maxPrepay' || field === 'minPrice') {
    finalValue =
      value === null || value === undefined || value === '' || Number.isNaN(Number(value))
        ? null
        : Number(value)
  }
  formData.value[field] = finalValue
  validateAt(field, finalValue)
}

const invalidateInstallmentList = () => {
  queryClient.invalidateQueries({
    queryKey: ['setting', 'installment', 'list'],
  })
}

const onSuccess = (response) => {
  invalidateInstallmentList()
  Notif.success(response.message)
  emits('submit')
}

const closeForm = () => {
  formData.value = defaultFormState()
  resetErrors()
  emits('close')
}

const submitForm = async () => {
  const { isValid, payload } = await validate(formData.value)
  if (!isValid) return
  const dispatch = () => {
    createInstallment({ ...payload }, { onSuccess })
  }

  const numericFields = ['percentage', 'order', 'maxPrepay', 'minPrice', 'profit']
  const allFieldsAreZero = numericFields.every((field) => !Number(payload[field]))

  if (!allFieldsAreZero) {
    dispatch()
    return
  }

  confirmDialog(
    'تایید',
    `
    از ثبت اقساط با مقادیر
     <strong class="text-red">صفر</strong>
     مطمئن هستید؟
    `,
    dispatch,
    {
      html: true,
      ok: { label: 'تایید', color: 'primary', flat: true },
      cancel: { label: 'انصراف', color: 'negative', flat: true },
      persistent: true,
    }
  )
}
</script>

<style scoped lang="scss">
.installment-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-2xl;
}
.footer {
  display: flex;
  gap: $spacing-md;
  width: 100% !important;
  align-items: center;
}
</style>
