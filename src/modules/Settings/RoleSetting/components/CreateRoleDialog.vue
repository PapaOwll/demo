<template>
  <QDialog v-model="internalShow" persistent @before-hide="handleCancel">
    <QCard style="min-width: 500px">
      <QCardSection>
        <div class="text-h6">افزودن نقش جدید</div>
      </QCardSection>

      <QCardSection class="q-pt-none">
        <QForm @submit.prevent="handleSubmit">
          <div class="q-gutter-md">
            <QInput
              v-model="formData.faTitle"
              label="عنوان فارسی"
              outlined
              autofocus
              :error="!!errors.faTitle"
              :error-message="errors.faTitle"
              :disable="isSubmitting"
              @blur="validateField('faTitle')"
            >
              <template #prepend>
                <QIcon name="title" />
              </template>
            </QInput>

            <QInput
              v-model="formData.title"
              label="عنوان انگلیسی (برای شناسایی سیستمی)"
              outlined
              placeholder="custom_admin"
              hint="فقط حروف کوچک انگلیسی و آندرلاین (_)"
              :error="!!errors.title"
              :error-message="errors.title"
              :disable="isSubmitting"
              @blur="validateField('title')"
            >
              <template #prepend>
                <QIcon name="code" />
              </template>
            </QInput>

            <QSelect
              v-model="formData.parentRoleId"
              :options="parentRoleOptions"
              label="نقش والد (اختیاری)"
              outlined
              clearable
              emit-value
              map-options
              option-value="value"
              option-label="label"
              hint="دسترسی‌ها از نقش والد کپی خواهند شد"
              :disable="isSubmitting"
            >
              <template #prepend>
                <QIcon name="account_tree" />
              </template>
            </QSelect>
          </div>
        </QForm>
      </QCardSection>

      <QCardActions align="left" class="text-primary">
        <QBtn flat label="انصراف" :disable="isSubmitting" @click="handleCancel" />
        <QBtn
          flat
          label="ذخیره"
          :loading="isSubmitting"
          :disable="!isFormValid"
          @click="handleSubmit"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCreateRole } from '../query'
import { createRoleSchema } from '../schema'
import useYup from '@/composables/use-yup'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  roles: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:show', 'success'])

const internalShow = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const formData = ref({
  title: '',
  faTitle: '',
  parentRoleId: null,
})

const { validate, validateAt, errors, resetErrors } = useYup(createRoleSchema)
const createRoleMutation = useCreateRole()

const isSubmitting = computed(() => createRoleMutation.isPending.value)

const parentRoleOptions = computed(() => {
  if (!props.roles || props.roles.length === 0) {
    return []
  }

  return props.roles.map((role) => ({
    label: role.faTitle || role.fa_title || role.title,
    value: role.id,
  }))
})

const isFormValid = computed(() => {
  // Basic check for button enable - full validation happens on submit
  return formData.value.title.trim() !== '' && formData.value.faTitle.trim() !== ''
})

const validateField = async (field) => {
  await validateAt(field, formData.value[field])
}

const resetForm = () => {
  formData.value = {
    title: '',
    faTitle: '',
    parentRoleId: null,
  }
  resetErrors()
}

const handleCancel = () => {
  if (!isSubmitting.value) {
    resetForm()
    internalShow.value = false
  }
}

const handleSubmit = async () => {
  const validation = await validate(formData.value)
  if (!validation.isValid) return

  try {
    const payload = {
      title: formData.value.title.trim(),
      fa_title: formData.value.faTitle.trim(),
    }

    if (formData.value.parentRoleId) {
      payload.parent_role_id = formData.value.parentRoleId
    }

    const response = await createRoleMutation.mutateAsync(payload)
    const newRoleId = response?.data?.data?.id

    resetForm()
    internalShow.value = false

    emit('success', newRoleId)
  } catch {
    // Error handling is done in the mutation
  }
}

watch(internalShow, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script>

<style lang="scss" scoped>
// No custom styles needed - using Quasar defaults
</style>
