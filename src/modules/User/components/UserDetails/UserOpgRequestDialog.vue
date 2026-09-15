<template>
  <QDialog :model-value="visible" @update:model-value="emits('close')" @escape-key="emits('close')">
    <QCard flat class="opg">
      <div class="opg__wrap">
        <span class="text-h6">ثبت درخواست OPG</span>
        <QBtn fab-mini unelevated flat @click="emits('close')">
          <IconX />
        </QBtn>
      </div>
      <div v-if="!userData?.nationalCode" class="opg__form">
        <span class="opg__form-label">برای ثبت درخواست، کد ملی بیمار را وارد کنید</span>
        <QInput
          v-model="nationalCode"
          outlined
          clearable
          :rules="[
            (val) => !!val || '* شناسه ملی کاربر را وارد کنید',
            (val) => val.length === 10 || 'شناسه ملی باید ۱۰ رقم باشد',
          ]"
          clear-icon="clear"
          label="کد ملی بیمار"
        />
      </div>
      <div v-else class="opg__form">
        <p class="text-subtitle1">
          درخواست عکس OPG برای کاربر
          <strong class="text-primary">{{ userData?.name }}</strong>
          با شماره ملی
          <strong class="text-primary">{{ userData?.nationalCode }}</strong>
          ثبت شود؟
        </p>
      </div>
      <QSeparator spaced />
      <div class="flex justify-end q-gutter-sm">
        <QBtn
          outline
          color="negative"
          class="rounded-borders q-px-xl"
          label="انصراف"
          :loading="isPending"
          @click="emits('close')"
        />
        <QBtn
          unelevated
          color="primary"
          class="rounded-borders q-px-xl"
          :disable="!nationalCode"
          :label="!userData.nationalCode ? 'ذخیره' : 'ارسال'"
          :loading="isPending"
          @click="onSendOpgRequest"
        />
      </div>
    </QCard>
  </QDialog>
</template>
<script setup>
import { ref, watch } from 'vue'
import { IconX } from '@tabler/icons-vue'
import { useApiSendOpgRequest } from '@/modules/User/query/index'
import { convertToEnNumber } from '@/utils/convert-check-digits'
import { Notif } from '@/data/services/notification-service'
import { useQueryClient } from '@tanstack/vue-query'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  userData: {
    type: Object,
    default: null,
  },
})
const emits = defineEmits(['close'])

const queryClient = useQueryClient()

const nationalCode = ref('')

watch(
  () => props.userData?.nationalCode,
  (val) => {
    nationalCode.value = val || ''
  },
  { immediate: true }
)

const { mutate: sendOpgRequest, isPending } = useApiSendOpgRequest()
const onSendOpgRequest = () => {
  sendOpgRequest(
    {
      id: props.userData?.id,
      nationalCode:
        convertToEnNumber(nationalCode.value) || convertToEnNumber(props.userData?.nationalCode),
    },
    {
      onSuccess: (response) => {
        Notif.success(response.message, {
          caption: 'درخواست OPG کاربر ارسال شد.',
          timeout: 5000,
        })
        queryClient.invalidateQueries({ queryKey: ['users', 'all-users'] })
        emits('close')
      },
    }
  )
}
</script>
<style scoped lang="scss">
.opg {
  padding: 1.25rem 1.5rem;
  width: 25dvw;
  border-radius: 12px;

  &__wrap {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  &__form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1.5rem auto;
    &-label {
      font-size: map-get($subtitle1, size) !important;
      color: $grey-8;
    }
  }
}
@media (max-width: 768px) {
  .opg {
    width: 100dvw;
  }
}
@media (max-width: 1024px) {
  .opg {
    width: 100dvw;
  }
}
</style>
