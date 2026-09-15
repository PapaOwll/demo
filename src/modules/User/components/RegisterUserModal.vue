<template>
  <QDialog :model-value="visible" persistent @update:model-value="$emit('close')">
    <QCard class="register-user-modal">
      <QCardSection class="register-user-modal__header">
        <div class="register-user-modal__title">ثبت نام کاربر جدید</div>
        <QBtn
          flat
          round
          dense
          icon="close"
          class="register-user-modal__close-btn"
          @click="$emit('close')"
        />
      </QCardSection>

      <QCardSection class="register-user-modal__content">
        <QForm class="register-user-modal__form" @submit.prevent="submit">
          <div class="register-user-modal__row">
            <div class="register-user-modal__col register-user-modal__col--full">
              <QInput
                :model-value="formData.mobile"
                label="موبایل"
                placeholder="موبایل"
                outlined
                dense
                :error="!!errors.mobile"
                :error-message="errors.mobile"
                class="register-user-modal__input"
                @update:model-value="
                  (value) => updateField('mobile', convertToEnNumber(value).replace(/[^0-9]/g, ''))
                "
                @blur="validateField('mobile')"
              />
            </div>
          </div>

          <div class="register-user-modal__row">
            <div class="register-user-modal__col register-user-modal__col--half">
              <QInput
                :model-value="formData.firstName"
                label="نام"
                placeholder="نام"
                outlined
                dense
                :error="!!errors.firstName"
                :error-message="errors.firstName"
                class="register-user-modal__input"
                @update:model-value="(value) => updateField('firstName', value)"
                @blur="validateField('firstName')"
              />
            </div>
            <div class="register-user-modal__col register-user-modal__col--half">
              <QInput
                :model-value="formData.name"
                label="نام خانوادگی"
                placeholder="نام خانوادگی"
                outlined
                dense
                :error="!!errors.name"
                :error-message="errors.name"
                class="register-user-modal__input"
                @update:model-value="(value) => updateField('name', value)"
                @blur="validateField('name')"
              />
            </div>
          </div>

          <div class="register-user-modal__row">
            <div class="register-user-modal__col register-user-modal__col--half">
              <QSelect
                :model-value="formData.gender"
                label="جنسیت"
                outlined
                dense
                :options="genderOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                clearable
                :error="!!errors.gender"
                :error-message="errors.gender"
                class="register-user-modal__input"
                @update:model-value="(value) => updateField('gender', value)"
                @blur="validateField('gender')"
              />
            </div>
            <div class="register-user-modal__col register-user-modal__col--half">
              <QInput
                :model-value="formData.birthday"
                label="تاریخ تولد"
                placeholder="انتخاب تاریخ تولد"
                outlined
                dense
                :readonly="false"
                :error="!!errors.birthday"
                :error-message="errors.birthday"
                class="register-user-modal__input cursor-pointer"
                @keydown.prevent
              >
                <template #append>
                  <QIcon name="event" class="cursor-pointer" />
                </template>
                <QPopupProxy cover transition-show="scale" transition-hide="scale">
                  <QDate
                    v-model="formData.birthday"
                    mask="jYYYY/jMM/jDD"
                    locale="fa"
                    calendar="persian"
                    today-btn
                    :options="dateOptions"
                    @update:model-value="handleDateChange"
                  >
                    <div class="row items-center justify-end q-pt-sm">
                      <QBtn v-close-popup label="بستن" color="primary" flat />
                    </div>
                  </QDate>
                </QPopupProxy>
              </QInput>
            </div>
          </div>

          <div class="register-user-modal__row">
            <div class="register-user-modal__col register-user-modal__col--half">
              <IntroductionMethodSelect
                :model-value="formData.methodOfIntroduction"
                :error-message="errors.methodOfIntroduction"
                :enabled="enabled"
                class="register-user-modal__input"
                @update:model-value="(value) => updateField('methodOfIntroduction', value)"
                @blur="validateField('methodOfIntroduction')"
              />
            </div>
            <div class="register-user-modal__col register-user-modal__col--half">
              <AdvisorSelect
                :model-value="formData.advisorId"
                :error-message="errors.advisorId"
                placeholder="جستجو در مشاوران..."
                class="register-user-modal__input"
                @update:model-value="(value) => updateField('advisorId', value)"
                @blur="validateField('advisorId')"
              />
            </div>
          </div>

          <div class="register-user-modal__row">
            <div class="register-user-modal__col register-user-modal__col--full">
              <QInput
                :model-value="formData.description"
                label="توضیحات"
                placeholder="توضیحات"
                type="textarea"
                outlined
                dense
                rows="3"
                :error="!!errors.description"
                :error-message="errors.description"
                class="register-user-modal__input"
                @update:model-value="(value) => updateField('description', value)"
                @blur="validateField('description')"
              />
            </div>
          </div>

          <div class="register-user-modal__actions">
            <QBtn
              label="انصراف"
              color="grey"
              flat
              class="register-user-modal__btn register-user-modal__btn--cancel"
              @click="$emit('close')"
            />
            <QBtn
              label="ثبت نام"
              color="primary"
              type="submit"
              :loading="isCreatingUser"
              class="register-user-modal__btn register-user-modal__btn--submit"
            />
          </div>
        </QForm>
      </QCardSection>
    </QCard>
  </QDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { object, string } from 'yup'
import { useQueryClient } from '@tanstack/vue-query'
import useYup from '@/composables/use-yup'
import { useCreateUserMutation } from '../query'
import { handleError } from '@/utils/error-handler'
import { convertToEnNumber } from '@/utils/convert-check-digits'
import { convertToJalali, convertToGregorian } from '@/utils/date-utils'
import IntroductionMethodSelect from '@/components/Form/IntroductionMethodSelect'
import AdvisorSelect from '@/components/Form/AdvisorSelect'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'afterSubmit'])

const queryClient = useQueryClient()

const genderOptions = [
  { label: 'آقا', value: 'male' },
  { label: 'خانم', value: 'female' },
  { label: 'نامشخص', value: 'unknown' },
]

const initialFormData = {
  firstName: '',
  name: '',
  birthday: '',
  methodOfIntroduction: '',
  advisorId: '',
  gender: '',
  description: '',
  mobile: '',
}

const formData = ref({ ...initialFormData })
const validationSchema = object().shape({
  firstName: string(),
  name: string(),
  birthday: string(),
  methodOfIntroduction: string().required('شیوه آشنایی الزامیست'),
  advisorId: string().required('مشاور الزامیست'),
  gender: string(),
  description: string(),
  mobile: string()
    .required('شماره موبایل الزامیست')
    .test('mobile-validation', 'شماره را به صورت 9xxxxxxxxx وارد کنید', (value) => {
      if (!value) return false
      const cleanedNumber = convertToEnNumber(value).replace(/^(0|98|\+98)/, '')
      return /^9\d{9}$/.test(cleanedNumber)
    }),
})

const { validate, validateAt, errors, setError } = useYup(validationSchema)
const { mutate: createUser, isPending: isCreatingUser } = useCreateUserMutation()

const enabled = computed(() => props.visible)

const updateField = (fieldName, value) => {
  formData.value[fieldName] = value
}

const validateField = async (fieldName) => {
  await validateAt(fieldName, formData.value[fieldName])
}

const dateOptions = (date) => {
  const today = convertToJalali(new Date().toISOString().split('T')[0].replace(/-/g, '/'))
  return date <= today
}

const handleDateChange = (value) => {
  formData.value.birthday = value
}

const resetForm = () => {
  formData.value = { ...initialFormData }
  Object.keys(errors.value).forEach((key) => {
    errors.value[key] = null
  })
}

const submit = async () => {
  const result = await validate(formData.value)

  if (result.isValid) {
    const backendData = {
      firstName: formData.value.firstName,
      name: formData.value.name,
      mobile: formData.value.mobile,
      gender: formData.value.gender,
      birthday: convertToGregorian(formData.value.birthday),
      methodOfIntroduction: formData.value.methodOfIntroduction,
      advisorId: formData.value.advisorId,
      description: formData.value.description,
    }

    createUser(backendData, {
      onSuccess: async (response) => {
        await queryClient.invalidateQueries({
          queryKey: ['user', 'all-users'],
        })
        emit('afterSubmit', response.data)
      },
      onError: (error) => {
        handleError(error)
        if (error.response?.data?.data) {
          Object.keys(error.response.data.data).forEach((field) => {
            setError(field, error.response.data.data[field])
          })
        }
      },
    })
  }
}

watch(
  () => props.visible,
  (newVal, oldVal) => {
    if (oldVal === true && newVal === false) {
      resetForm()
    }
  }
)
</script>

<script>
export default {
  components: {
    IntroductionMethodSelect,
    AdvisorSelect,
  },
}
</script>

<style lang="scss" scoped>
.register-user-modal {
  min-width: 600px;
  max-width: 800px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid $gray-300;
  }

  &__title {
    font-size: 18px;
    font-weight: bold;
    color: $black-2;
  }

  &__close-btn {
    color: $gray-600;
  }

  &__content {
    padding: 24px;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__row {
    display: flex;
    gap: 16px;
    width: 100%;
  }

  &__col {
    flex: 1;

    &--full {
      flex: 1;
    }

    &--half {
      flex: 0.5;
    }
  }

  &__input {
    width: 100%;
  }

  &__actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid $gray-300;
  }

  &__btn {
    min-width: 100px;

    &--cancel {
      color: $gray-600;
    }

    &--submit {
      color: $white;
    }
  }
}

@media (max-width: 768px) {
  .register-user-modal {
    min-width: 90vw;

    &__row {
      flex-direction: column;
      gap: 12px;
    }

    &__col {
      &--half {
        flex: 1;
      }
    }
  }
}
</style>
