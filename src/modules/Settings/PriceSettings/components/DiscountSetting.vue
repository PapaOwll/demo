<template>
  <div class="discount">
    <div class="flex justify-between items-baseline">
      <h5 class="q-mb-xl">تنظیمات مبالغ طرح درمان</h5>
      <QBtn round outline @click="refresh"><IconRefresh /></QBtn>
    </div>
    <QForm @submit.prevent="submitForm">
      <div class="row justify-between items-center q-col-gutter-md">
        <QInnerLoading :showing="isLoading || isPending">
          <QSpinnerGears size="50px" color="primary" />
        </QInnerLoading>
        <div class="col-md-6 col-12">
          <CurrencyField
            :model-value="discountData?.maxDiscountPrice"
            :disable="isPending"
            label="حداکثر مبلغ تخفیف*"
            :error="!!errors?.maxDiscountPrice"
            :error-message="errors?.maxDiscountPrice || null"
            @update:model-value="(e) => handleChange('maxDiscountPrice', e)"
          />
        </div>
        <div class="col-md-6 col-12">
          <NumberField
            :model-value="discountData?.maxDiscountPercent"
            :disable="isPending"
            label="حداکثر درصد تخفیف*"
            :suffix="'درصد'"
            :error="!!errors?.maxDiscountPercent"
            :error-message="errors?.maxDiscountPercent || null"
            @update:model-value="(e) => handleChange('maxDiscountPercent', e)"
          />
        </div>

        <div class="col-md-6 col-12">
          <CurrencyField
            :model-value="discountData?.minPrepayPrice"
            :disable="isPending"
            label="حداقل مبلغ بیعانه*"
            :error="!!errors?.minPrepayPrice"
            :error-message="errors?.minPrepayPrice || null"
            @update:model-value="(e) => handleChange('minPrepayPrice', e)"
          />
        </div>
      </div>
      <QBtn
        class="discount__form-btn"
        label="ذخیره"
        color="primary"
        type="submit"
        unelevated
        :loading="isPending"
      />
    </QForm>
  </div>
</template>
<script setup>
import { object, string, number } from 'yup'
import { useApiGetSettings, useApiSaveSetting } from '@/modules/Settings/index'
import { computed, ref } from 'vue'
import useYup from '@/composables/use-yup'
import { IconRefresh } from '@tabler/icons-vue'
import { useQueryClient } from '@tanstack/vue-query'
import CurrencyField from '@/components/Form/CurrencyField'
import NumberField from '@/components/Form/NumberField'
import { Notif } from '@/data/services/notification-service'

const queryClient = useQueryClient()
const updatedDiscountData = ref(null)

const { data, isLoading } = useApiGetSettings('treatmentPlanPriceConfig')
const initialData = computed(() => data?.value || [])

const discountData = computed(() => updatedDiscountData.value || initialData.value || [])

const refresh = () => {
  queryClient.invalidateQueries({ queryKey: ['setting', 'treatmentPlanPriceConfig'] })
  Notif.success('لیست بروزرسانی شد')
}

const validationSchema = object().shape({
  maxDiscountPercent: string().required('مقدار درصد را وارد کنید'),
  maxDiscountPrice: number().nullable().required('مقدار مبلغ را وارد کنید'),
  minPrepayPrice: number().nullable().required('مقدار مبلغ را وارد کنید'),
})

const { validate, validateAt, errors } = useYup(validationSchema)

const handleChange = (field, value) => {
  let finalValue = value

  // Handle currency fields (maxDiscountPrice, minPrepayPrice)
  if (field === 'maxDiscountPrice' || field === 'minPrepayPrice') {
    finalValue =
      value === null || value === undefined || value === '' || Number.isNaN(Number(value))
        ? null
        : Number(value)
  }

  updatedDiscountData.value = { ...discountData.value, [field]: finalValue }
  validateAt(field, finalValue)
}

const { mutate, isPending } = useApiSaveSetting()

const submitForm = async () => {
  const { isValid, payload } = await validate(discountData.value)
  if (!isValid) return
  mutate(
    { body: payload, key: 'treatmentPlanPriceConfig' },
    {
      onSuccess: (response) => {
        Notif.success(response?.message || 'عملیات با موفق انجام شد')
      },
    }
  )
}
</script>
<style scoped lang="scss">
:deep(.q-field__control) {
  border-radius: 0.5rem !important;
}
.discount {
  width: 100%;
  &__form {
    &-btn {
      margin-top: 10px;
      min-width: 104px;
      flex-grow: 12;
      float: left;
    }
  }
}
</style>
