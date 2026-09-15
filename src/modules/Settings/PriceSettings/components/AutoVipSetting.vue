<template>
  <div class="row justify-between items-center">
    <h4>تنظیمات VIP</h4>
    <QBtn color="primary" round unelevated outline @click="refetchSetting">
      <IconRefresh size="16" />
    </QBtn>
  </div>
  <div class="row q-mt-md">
    <div class="col-12 container bg-grey-3 rounded-borders q-pa-md q-my-md">
      <IconProgressAlert class="text-grey-8" stroke="2.5" />
      <span class="q-mr-xs text-grey-8 text-subtitle2">
        هر یک ساعت سیستم بیمارهایی که طرح درمان های آن ها فعال و دارای بیعانه باشند و مبلغ کل آن ها
        از مبلغ تعیین شده بیشتر باشد را وی ای پی خواهد کرد. در صورت عودت بیعانه، وی ای پی برداشته
        خواهد شد
      </span>
    </div>
    <div class="col-12 container bg-grey-3 rounded-borders q-pa-md">
      <IconProgressAlert class="text-grey-8" stroke="2.5" />
      <span class="q-mr-xs text-grey-8 text-subtitle2">
        با تغییر این تنظیمات، کاربرانی که در حال حاضر وی ای پی شده اند تغییری نخواهند کرد.
      </span>
    </div>
  </div>
  <QForm class="q-pa-sm" @submit.prevent="submitForm">
    <QInnerLoading :showing="isLoading || isRefetching || isPending">
      <QSpinnerGears size="50px" color="primary" />
    </QInnerLoading>
    <div class="row q-col-gutter-md justify-start items-end q-mt-md">
      <div class="col-md-6 col-12">
        <CurrencyField
          :model-value="settingData?.price || 0"
          label="مبلغ"
          :error="!!errors.price"
          :error-message="errors.price || null"
          @update:model-value="(e) => handleChange('price', e)"
        />
      </div>
      <div class="col-md-3 col-12">
        <QBtn
          unelevated
          :loading="isLoading || isRefetching || isPending"
          color="primary"
          size="medium"
          type="submit"
        >
          ذخیره تنظیمات
        </QBtn>
      </div>
    </div>
  </QForm>
</template>

<script setup>
import { IconRefresh, IconProgressAlert } from '@tabler/icons-vue'
import { computed, ref } from 'vue'
import { useApiGetSettings, useApiSaveSetting } from '@/modules/Settings'
import { object, number } from 'yup'
import useYup from '@/composables/use-yup'
import { useQueryClient } from '@tanstack/vue-query'
import CurrencyField from '@/components/Form/CurrencyField'
import { Notif } from '@/data/services/notification-service'

const key = 'treatmentPlanPriceForVip'
const updatedSettingData = ref(null)
const queryClient = useQueryClient()
const { data: initialSettingData, isLoading, refetch, isRefetching } = useApiGetSettings(key)
const settingData = computed(() => updatedSettingData.value || initialSettingData.value || {})
const { mutate, isPending } = useApiSaveSetting()

const validationSchema = object().shape({
  price: number().nullable().required('لطفا مبلغ را وارد کنید'),
})
const { validate, validateAt, errors } = useYup(validationSchema)
const handleChange = (field, value) => {
  let finalValue = value

  // Handle currency fields
  if (field === 'price') {
    finalValue =
      value === null || value === undefined || value === '' || Number.isNaN(Number(value))
        ? null
        : Number(value)
  }

  updatedSettingData.value = { ...settingData.value, [field]: finalValue }
  validateAt(field, finalValue)
}
const refetchSetting = () => {
  updatedSettingData.value = null
  refetch()
}
const submitForm = async () => {
  const { isValid, payload } = await validate(settingData.value)
  if (!isValid) return
  mutate(
    { body: payload, key },
    {
      onSuccess: async (res) => {
        await queryClient.invalidateQueries({
          queryKey: [key],
        })
        Notif.success(res.message)
      },
    }
  )
}
</script>
