<template>
  <div class="relative-position">
    <QForm @submit.prevent="saveData">
      <div class="row q-col-gutter-sm">
        <div class="col-md-6 col-12">
          <QSelect
            :model-value="smsPanelData.sendSms"
            label="ارسال پیامک خودکار"
            :options="sendAutomaticSms"
            option-label="name"
            option-value="id"
            clearable
            outlined
            map-options
            clear-icon="clear"
            :errors="!!errors.sendSms"
            :error-message="errors.sendSms || null"
            @update:model-value="(e) => handleChange('sendSms', e?.id)"
          />
        </div>
        <div class="col-md-6 col-12">
          <QInput
            :model-value="smsPanelData.from"
            label="شماره خط ارسالی"
            clearable
            clear-icon="clear"
            outlined
            :error="!!errors?.from"
            :error-message="errors?.from || null"
            @update:model-value="(e) => handleChange('from', e)"
          />
        </div>
        <div class="col-md-6 col-12">
          <QInput
            :model-value="smsPanelData.key"
            type="textarea"
            rows="2"
            outlined
            clearable
            clear-icon="clear"
            label="کد دسترسی پنل پیامک (Api Key)"
            :error="!!errors?.key"
            :error-message="errors?.key || null"
            @update:model-value="(e) => handleChange('key', e)"
          />
        </div>
        <div class="col-md-6 col-12">
          <QInput
            :model-value="smsPanelData.sendSmsUrl"
            type="textarea"
            outlined
            clear-icon="clear"
            clearable
            rows="2"
            label="(send_sms_url)"
            @update:model-value="(e) => handleChange('sendSmsUrl', e)"
          />
        </div>
      </div>
    </QForm>

    <QInnerLoading :showing="isLoading || isFetching || isPending">
      <QSpinnerTail color="primary" size="2em" />
    </QInnerLoading>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useApiGetSettings, useApiSaveSetting } from '@/modules/Settings'
import { useQueryClient } from '@tanstack/vue-query'
import { object, string, boolean } from 'yup'
import useYup from '@/composables/use-yup'
import { Notif } from '@/data/services/notification-service'

const props = defineProps(['submit', 'refresh'])
const emits = defineEmits(['afterSubmit', 'afterRefresh'])
const queryClient = useQueryClient()
const updatedSmsPanelData = ref(null)
const sendAutomaticSms = ref([
  { id: true, name: 'فعال' },
  { id: false, name: 'غیر فعال' },
])

const validationSchema = object().shape({
  sendSms: boolean().default(false),
  from: string().required('شماره خط ارسالی را وارد کنید'),
  key: string().required('کد دسترسی پنل را وارد کنید'),
  sendSmsUrl: string().required('مقدار Url الزامیست'),
})
const { data: smsChannelData, isLoading, isFetching } = useApiGetSettings('smsChannel')
const initialData = computed(() => smsChannelData.value)
const smsPanelData = computed(() => updatedSmsPanelData.value || initialData.value || [])

const { validate, validateAt, errors } = useYup(validationSchema)
const handleChange = (field, value) => {
  updatedSmsPanelData.value = { ...smsPanelData.value, [field]: value }
  validateAt(field, value)
}

const { mutate, isPending } = useApiSaveSetting('smsChannel')
const refreshData = () => {
  queryClient.invalidateQueries({ queryKey: ['setting', 'smsChannel'] })
  Notif.success('لیست بروزرسانی شد')
}

const saveData = async () => {
  const { isValid, payload } = await validate(smsPanelData.value)
  if (!isValid) return
  mutate(
    { body: payload, key: 'smsChannel' },
    {
      onSuccess: (response) => {
        Notif.success(response?.message)
      },
    },
    emits('afterSubmit')
  )
}
watch(
  () => props.submit.value,
  (value) => {
    if (value) saveData()
  }
)
watch(
  () => props.refresh,
  (value) => {
    if (value) {
      refreshData()
      emits('afterRefresh')
    }
  }
)
</script>
