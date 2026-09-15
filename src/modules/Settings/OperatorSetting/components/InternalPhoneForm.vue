<template>
  <QDialog
    :model-value="visible"
    transition-show="scale"
    transition-hide="scale"
    @escape-key="closeForm"
    @update:model-value="closeForm"
    @close="closeForm"
  >
    <QCard class="internal-phone-form" style="min-width: 500px">
      <QInnerLoading :showing="loading">
        <QSpinnerGears size="50px" color="primary" />
      </QInnerLoading>
      <QCardSection class="internal-phone-form__header">
        <div class="row items-center justify-between">
          <h5 class="internal-phone-form__title">
            {{ editValue ? 'ویرایش داخلی مشاور' : 'افزودن داخلی مشاور' }}
          </h5>
          <QBtn flat round dense icon="close" @click="closeForm" />
        </div>
      </QCardSection>

      <QCardSection>
        <QForm @submit.prevent="submitForm">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-6 col-12">
              <QInput
                :model-value="internalPhoneData.number"
                label="شماره داخلی"
                outlined
                clearable
                clear-icon="clear"
                :error="!!errors.number"
                :error-message="errors.number"
                @update:model-value="
                  (val) => handleChange('number', convertToEnNumber(val) || null)
                "
              />
            </div>
            <div class="col-md-6 col-12">
              <AdvisorSelect
                :model-value="internalPhoneData?.userId"
                :error="!!errors.userId"
                :error-message="errors.userId"
                :user-role="internalPhoneRoles"
                :dense="false"
                @update:model-value="(e) => handleChange('userId', e)"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-md-6 col-12">
              <QBtn color="grey-6" class="full-width" outline @click="closeForm">انصراف</QBtn>
            </div>
            <div class="col-md-6 col-12">
              <QBtn
                type="submit"
                color="primary"
                class="full-width"
                unelevated
                :loading="loading"
                :disable="loading"
              >
                ثبت
              </QBtn>
            </div>
          </div>
        </QForm>
      </QCardSection>
    </QCard>
  </QDialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import useYup from '@/composables/use-yup'
import { object, number } from 'yup'
import {
  createInternalPhone,
  updateInternalPhone,
} from '@/modules/Settings/OperatorSetting/api/internal-phone'
import { handleError } from '@/utils/error-handler'
import AdvisorSelect from '@/components/Form/AdvisorSelect'
import { convertToEnNumber } from '@/utils/convert-check-digits'
import { Notif } from '@/data/services/notification-service'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  editValue: {
    type: Object,
    default: null,
  },
})

const emits = defineEmits(['close', 'updateTable'])

const internalPhoneRoles = computed(() => [
  'advisor',
  'super_admin',
  'secretary',
  'writer',
  'coordinator',
  'doctor',
  'validator',
  'presenter',
  'financial',
  'support',
  'admin',
  'online_visit',
  'advisor_and_online_visit',
])
const loading = ref(false)
const updatedPhoneData = ref(null)
const initialData = computed(() => {
  if (!props.editValue) return null
  return {
    ...props.editValue,
    userId: props.editValue.userId ?? props.editValue.user?.id,
  }
})
const internalPhoneData = computed(() => updatedPhoneData.value || initialData.value || [])
const validationSchema = object({
  userId: number().required('انتخاب مشاور الزامیست'),
  number: number()
    .required('مقدار شماره الزامیست')
    .typeError('مقدار الزامی و باید بصورت عددی باشد'),
})

const { validate, errors, validateAt } = useYup(validationSchema)
const handleChange = (field, value) => {
  updatedPhoneData.value = { ...internalPhoneData.value, [field]: value }
  validateAt(field, value)
}

const closeForm = () => {
  updatedPhoneData.value = null
  emits('close')
}

const submitForm = async () => {
  const { isValid, payload } = await validate(internalPhoneData.value)
  console.log('internalPhoneData==>', isValid, internalPhoneData.value)

  if (!isValid) return

  loading.value = true

  try {
    if (props.editValue) {
      const res = await updateInternalPhone(props.editValue.id, payload)
      Notif.success(res?.message, { position: 'top' })
    } else {
      const res = await createInternalPhone(payload)
      Notif.success(res.data.message, { position: 'top' })
    }
    emits('close')
    emits('updateTable')
  } catch (error) {
    handleError(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.internal-phone-form {
  &__header {
    background-color: $grey-2;
    padding: 16px 24px;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: $grey-8;
  }
}
</style>
