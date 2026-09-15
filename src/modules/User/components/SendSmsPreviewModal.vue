<template>
  <QDialog :model-value="visible" class="dialog-preview" @update:model-value="$emit('close')">
    <QCard>
      <QForm class="dialog-preview__form" @submit.prevent="handleSubmit">
        <QCardSection class="dialog-preview__form-content">
          <p class="dialog-preview__message">{{ data.message }}</p>
        </QCardSection>
        <QCardSection class="dialog-preview__form-footer">
          <QBtn
            :loading="sendSmsToMobileLoading"
            type="danger"
            label="بازگشت"
            color="grey"
            @click="closeForm"
          />
          <QBtn
            color="primary"
            label="ارسال پیام"
            type="sumbit"
            :loading="sendSmsToMobileLoading"
            :disabled="sendSmsToMobileLoading"
          />
        </QCardSection>
      </QForm>
    </QCard>
  </QDialog>
</template>
<script setup>
import { useSendSmsToMobileMutation } from '@/modules/User/query'
import { handleError } from '@/utils/error-handler'
import { Notif } from '@/data/services/notification-service'
import { toRefs } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object,
    default: () => ({
      mobile: null,
      message: null,
    }),
  },
})
const emits = defineEmits(['close'])
const { visible, data } = toRefs(props)

const { mutate: sendSmsToMobile, isPending: sendSmsToMobileLoading } = useSendSmsToMobileMutation()
const closeForm = () => {
  emits('close', false)
}
const handleSubmit = () => {
  sendSmsToMobile(
    {
      mobile: data.value.mobile,
      message: data.value.message,
    },
    {
      onSuccess: (response) => {
        Notif.success(response.message)
        emits('close')
      },
      onError: (e) => {
        handleError(e)
        sendSmsToMobileLoading.value = false
        emits('close')
      },
    }
  )
}
</script>
<style scoped lang="scss">
.dialog-preview {
  &__form {
    gap: map-get($space-md, x);
    background-color: white;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    display: flex;
    width: 360px;
  }

  &__form-content {
    justify-content: center;
    flex-direction: column;
    align-items: center;
    display: flex;
    gap: 10px;
  }

  &__message {
    font-weight: map-get($subtitle2, weight);
    font-size: map-get($subtitle2, size);
    text-align: justify;
    color: grey;
    margin: 0px;
    white-space: pre-line;
  }
  &__form-footer {
    justify-content: space-evenly;
    align-items: center;
    padding-top: 0px;
    display: flex;
    width: 100%;
  }
}
</style>
