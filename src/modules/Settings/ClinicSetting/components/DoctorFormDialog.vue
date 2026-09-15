<template>
  <QDialog v-model="internalShow" @before-hide="handleCancel">
    <QCard class="dfd">
      <div class="dfd__header">
        <Typography variant="heading" size="h6">
          {{ editMode ? 'ویرایش پزشک' : 'افزودن پزشک' }}
        </Typography>
        <Button variant="flat" color="grey" :is-disabled="isSubmitting" @click="handleCancel">
          <IconX />
        </Button>
      </div>

      <div class="dfd__content">
        <QForm @submit.prevent="handleSubmit">
          <div>
            <AdvisorSelect
              :model-value="formData.doctorId"
              label="انتخاب پزشک"
              placeholder=""
              :user-role="['doctor']"
              :dense="false"
              :error-message="errors.doctorId"
              :error="!!errors.doctorId"
              @update:model-value="updateField('doctorId', $event)"
              @blur="validateField('doctorId')"
            />
            <QToggle
              class="dfd__toggle"
              :model-value="formData.isDefault"
              left-label
              dense
              label="پزشک به عنوان پزشک نسخه انتخاب شود"
              @update:model-value="updateField('isDefault', $event)"
            />
          </div>
        </QForm>
      </div>

      <div class="dfd__actions">
        <Button
          variant="outline"
          color="red"
          :is-disabled="isSubmitting"
          text="انصراف"
          @click="handleCancel"
        />
        <Button
          variant="filled"
          color="blue"
          :is-loading="isSubmitting"
          text="ذخیره"
          @click="handleSubmit"
        />
      </div>
    </QCard>
  </QDialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import { IconX } from '@tabler/icons-vue'
import AdvisorSelect from '@/components/Form/AdvisorSelect'
import useYup from '@/composables/use-yup'
import { doctorSchema } from '../schema/doctorSchema'
import { useApiSetBranchDoctorMutation } from '../query'
import { handleError } from '@/utils/error-handler'
import { Notif } from '@/data/services/notification-service'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  branchId: {
    type: [Number, String],
    required: true,
  },
  editData: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:show', 'success'])

const internalShow = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const editMode = computed(() => !!props.editData)

const formData = ref({
  doctorId: '',
  isDefault: false,
  taminUsername: '',
})

const { validate, validateAt, errors, resetErrors } = useYup(doctorSchema)

const updateField = (field, value) => {
  formData.value[field] = value
  if (errors.value[field]) {
    errors.value[field] = null
  }
}

const validateField = async (field) => {
  await validateAt(field, formData.value[field])
}

const resetForm = () => {
  formData.value = {
    doctorId: '',
    isDefault: false,
    taminUsername: '',
  }
  resetErrors()
}

const setDoctorMutation = useApiSetBranchDoctorMutation({
  onSuccess: () => {
    Notif.success(editMode.value ? 'پزشک با موفقیت ویرایش شد' : 'پزشک با موفقیت افزوده شد', {
      position: 'top',
    })
    resetForm()
    internalShow.value = false
    emit('success')
  },
})

const isSubmitting = computed(() => setDoctorMutation.isPending.value)

const handleCancel = () => {
  if (!isSubmitting.value) {
    resetForm()
    internalShow.value = false
  }
}

const handleSubmit = async () => {
  const validation = await validate(formData.value)

  if (!validation.isValid) {
    Notif.warning('لطفا تمام فیلدهای الزامی را پر کنید', {
      position: 'top',
    })
    return
  }

  try {
    const payload = {
      branchId: props.branchId,
      doctorId: formData.value.doctorId,
      isDefault: formData.value.isDefault,
      taminUsername: formData.value.taminUsername,
    }

    if (editMode.value && props.editData?.id) {
      payload.branchDoctorId = props.editData.id
    }

    await setDoctorMutation.mutateAsync(payload)
  } catch (error) {
    handleError(error)
  }
}

watch(
  () => props.editData,
  (newData) => {
    if (newData) {
      formData.value = {
        doctorId: newData.userId || newData.user?.id || '',
        isDefault: !!newData.isDefault,
        taminUsername: newData?.taminUsername || '',
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

watch(internalShow, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script>

<style scoped lang="scss">
.dfd {
  min-width: 450px;
  padding: 24px;
  border-radius: 12px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  &__content {
    margin: 1rem 0;
  }

  &__toggle {
    border: 1px solid $grey-4;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    padding: 8px;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    margin-top: 1rem;
  }
}
</style>
