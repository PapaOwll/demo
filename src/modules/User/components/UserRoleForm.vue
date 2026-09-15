<template>
  <QDialog
    :model-value="visible"
    persistent
    transition-show="scale"
    transition-hide="scale"
    class="user-role-form__dialog"
    @update:model-value="closeForm"
    @before-show="onOpenForm"
    @close="closeForm"
    @escape-key="closeForm"
  >
    <QCard class="user-role-form__card">
      <QCardSection class="user-role-form__header">
        <div class="user-role-form__header-content">
          <h5 class="user-role-form__header-title">ویرایش نقش کاربر</h5>
          <QBtn flat round icon="close" class="user-role-form__header-close" @click="closeForm" />
        </div>
      </QCardSection>
      <QCardSection class="user-role-form__content">
        <QForm
          class="user-role-form__form"
          :class="{ 'user-role-form__form--disabled': isPending }"
          @submit.prevent="submitForm"
        >
          <div class="user-role-form__field">
            <QSelect
              v-model="formData.roleId"
              :options="roles"
              option-value="id"
              option-label="faTitle"
              emit-value
              map-options
              outlined
              label="نقش"
              placeholder="نقش را انتخاب کنید"
              :disable="isPending"
              :error="!!errors.roleId"
              :error-message="errors.roleId"
              class="user-role-form__select"
            />
          </div>

          <div class="user-role-form__actions">
            <QBtn
              type="submit"
              color="primary"
              outline
              :loading="isPending"
              class="user-role-form__submit-btn"
            >
              ثبت
            </QBtn>
            <QBtn
              color="warning"
              outline
              :disable="isPending"
              class="user-role-form__cancel-btn"
              @click="closeForm"
            >
              انصراف
            </QBtn>
          </div>
        </QForm>
      </QCardSection>
    </QCard>
  </QDialog>
</template>

<script setup>
import { toRefs, computed, reactive } from 'vue'
import { object, number } from 'yup'
import useYup from '@/composables/use-yup'
import { Notif } from '@/data/services/notification-service'
import { pickBy, identity } from '@/utils/lodash-utils'
import { useGetUserByRoleQuery, useUpdateUserRoleMutation } from '@/modules/User/query'
import { useQueryClient } from '@tanstack/vue-query'
import { handleError } from '@/utils/error-handler'

const props = defineProps({
  visible: Boolean,
  editValue: {
    type: Object,
    default: () => ({}),
  },
})

const emits = defineEmits(['close', 'afterSubmit'])
const { visible, editValue } = toRefs(props)
const queryClient = useQueryClient()

const { data: allRoles } = useGetUserByRoleQuery()
const roles = computed(() => allRoles.value?.items)

const formData = reactive({
  roleId: null,
})

const schema = object().shape({
  roleId: number().required('نقش الزامیست'),
})

const { validate, errors } = useYup(schema)

const closeForm = () => {
  emits('close', false)
}
const onOpenForm = () => {
  const data = pickBy(editValue?.value, identity)
  formData.roleId = data?.role?.id || null
}
const { mutate: updateRole, isPending } = useUpdateUserRoleMutation()
const submitForm = async () => {
  const validationResult = await validate(formData)

  if (!validationResult.isValid) {
    return
  }

  updateRole(
    { id: editValue.value.id, ...formData },
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ['user'] })
        Notif.success(response.message)
        closeForm()
      },
      onError: (error) => {
        handleError(error)
      },
    }
  )
}
</script>

<style lang="scss" scoped>
.user-role-form {
  &__dialog {
    :deep(.q-dialog__inner) {
      padding: 16px;
    }
  }

  &__card {
    min-width: 400px;
    max-width: 500px;
    border-radius: 12px;
  }

  &__header {
    padding: 16px 20px 0 20px;
  }

  &__header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__header-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: $grey-8;
  }

  &__header-close {
    color: $grey-6;

    &:hover {
      color: $grey-8;
    }
  }

  &__content {
    padding: 20px;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 20px;

    &--disabled {
      opacity: 0.6;
      pointer-events: none;
    }
  }

  &__field {
    width: 100%;
  }

  &__select {
    :deep(.q-field__control) {
      height: 48px;
    }

    :deep(.q-field__label) {
      font-weight: 500;
      color: $grey-7;
    }
  }

  &__actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 8px;
  }

  &__submit-btn {
    min-width: 80px;
    height: 40px;
    font-weight: 500;
  }

  &__cancel-btn {
    min-width: 80px;
    height: 40px;
    font-weight: 500;
  }
}
</style>
