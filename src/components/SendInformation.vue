<template>
  <QDialog
    :model-value="visible"
    persistent
    class="send-information__dialog"
    @update:model-value="$emit('close')"
    @show="onOpenForm"
  >
    <QCard class="send-information__card">
      <QCardSection class="send-information__header">
        <div class="send-information__header-content">
          <h5 class="send-information__header-title">ارسال مشخصات کاربر</h5>
          <QBtn
            flat
            round
            dense
            icon="close"
            class="send-information__header-close"
            @click="closeForm"
          />
        </div>
      </QCardSection>
      <QCardSection class="send-information__content">
        <QForm
          class="send-information__form"
          :class="{ 'send-information__form--disabled': isLoading || isPending }"
          @submit.prevent="submitForm"
        >
          <div class="send-information__message">
            <span>
              ارسال مشخصات کلینیک به :
              <strong class="send-information__username">
                {{ userName }}
              </strong>
            </span>
          </div>

          <div class="send-information__field">
            <label for="branchId" class="send-information__field-label">
              شعبه
              <span class="send-information__field-required">*</span>
            </label>
            <QSelect
              id="branchId"
              :disable="isLoading || isPending"
              use-input
              input-debounce="0"
              clearable
              placeholder="شعبه"
              :model-value="selectedBranch?.branchId"
              :options="branches"
              option-value="id"
              option-label="name"
              emit-value
              map-options
              outlined
              @update:model-value="(e) => handleChange('branchId', e)"
            />
            <div v-if="errors.branchId" class="send-information__field-error">
              <QIcon name="info" size="xs" />
              {{ errors.branchId }}
            </div>
          </div>
        </QForm>
      </QCardSection>

      <QCardActions class="send-information__actions">
        <QBtn color="warning" outline :loading="isPending" :disable="isPending" @click="closeForm">
          انصراف
        </QBtn>
        <QBtn
          color="primary"
          type="submit"
          :loading="isPending"
          :disable="isPending"
          @click="submitForm"
        >
          ثبت
        </QBtn>
      </QCardActions>
    </QCard>
  </QDialog>
</template>

<script setup>
import { ref, toRefs, computed } from 'vue'
import { object, string } from 'yup'
import { useApiGetBranches } from '@/modules/Settings/ClinicSetting/query'
import useYup from '@/composables/use-yup'
import { useApiSendClinicInfo } from '@/modules/User/query'
import { handleError } from '@/utils/error-handler'
import { Notif } from '@/data/services/notification-service'

const props = defineProps({
  visible: Boolean,
  editValue: {},
})

const { editValue, visible } = toRefs(props)

const emits = defineEmits(['closeForm'])
const enabled = computed(() => !!visible.value)
const { data, isLoading } = useApiGetBranches({ enabled })
const branches = computed(() => data.value?.items)
const updatedSelectedBranch = ref(null)
const initialBranch = computed(() => ({ branchId: null, userId: editValue.value.id }))
const selectedBranch = computed(() => updatedSelectedBranch.value || initialBranch.value || {})
const userName = computed(() =>
  editValue.value?.firstName
    ? `${editValue.value?.firstName} ${editValue.value?.name}`
    : editValue.value?.name
)
const validationSchema = object().shape({
  branchId: string().required().typeError('لطفا شعبه خود را انتخاب کنید'),
  userId: string(),
})
const { validate, validateAt, errors } = useYup(validationSchema)
const handleChange = (field, value) => {
  updatedSelectedBranch.value = { ...initialBranch.value, [field]: value }
  validateAt(field, value)
}
const onOpenForm = () => {
  // Reset form state when dialog opens
  updatedSelectedBranch.value = null
}

const closeForm = () => {
  emits('closeForm', false)
}
const { mutate: sendClinicInfo, isPending } = useApiSendClinicInfo()
const submitForm = async () => {
  const { isValid, payload } = await validate(selectedBranch.value)
  if (!isValid) return
  const form = {
    branch_id: payload.branchId,
    user_id: payload.userId,
  }
  sendClinicInfo(
    { ...form },
    {
      onSuccess: (response) => {
        Notif.success(response.message || 'مشخصات با موفقیت ارسال شد')
        closeForm()
      },
      onError: (error) => {
        Notif.error(error?.message || 'خطا در ارسال مشخصات')
        handleError(error)
      },
    }
  )
}
</script>

<style lang="scss" scoped>
.send-information {
  &__dialog {
    .q-dialog__inner {
      padding: 16px;
    }
  }

  &__card {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }

  &__header {
    padding: 1rem 1.5rem 0.5rem;

    &-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    &-title {
      margin: 0;
      color: $grey-9;
      font-size: 1.25rem;
      font-weight: 600;
    }

    &-close {
      color: $grey-6;
    }
  }

  &__content {
    padding: 1rem 1.5rem;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &--disabled {
      opacity: 0.6;
      pointer-events: none;
    }
  }

  &__message {
    margin-bottom: 1rem;

    span {
      color: $grey-7;
      font-size: 0.9rem;
    }
  }

  &__username {
    color: $grey-9 !important;
    font-weight: 600 !important;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &-label {
      color: $grey-7;
      font-size: 0.875rem;
      font-weight: 500;
    }

    &-required {
      color: $negative;
      margin-left: 0.25rem;
    }

    &-error {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: $negative;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }
  }

  &__actions {
    padding: 0.5rem 1.5rem 1.5rem;
    display: flex;
    justify-content: center;
    gap: 0.5rem;

    .q-btn {
      min-width: 100px;
    }
  }
}
</style>
