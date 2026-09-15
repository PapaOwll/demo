<template>
  <div class="user-medical-document">
    <QInnerLoading :showing="isLoading">
      <QSpinnerDots size="50px" color="primary" />
    </QInnerLoading>

    <QCard flat class="medical-form__card">
      <QCardSection class="medical-form__header">
        <div class="medical-form__header-content">
          <QBtn color="primary" rounded outline :loading="isSubmitPending" @click="toggleEditMode">
            <IconPencil />
            <span class="q-mx-sm">
              {{ isEditMode ? 'ذخیره' : 'ویرایش' }}
            </span>
          </QBtn>
        </div>
      </QCardSection>

      <QCardSection class="medical-form__content">
        <QForm class="medical-form__form" @submit.prevent="submitForm">
          <div class="row q-col-gutter-md">
            <div :class="medicalData?.diseases?.length > 0 ? 'col-md-6 col-12' : 'col-12'">
              <div class="medical-form__field">
                <label for="diseases" class="medical-form__field-label">سابقه بیماری</label>
                <QSelect
                  id="diseases"
                  :model-value="medicalData?.diseases"
                  placeholder="انتخاب کنید"
                  multiple
                  use-chips
                  use-input
                  input-debounce="0"
                  clearable
                  :options="diseasesList"
                  option-value="id"
                  option-label="name"
                  emit-value
                  map-options
                  outlined
                  :disable="!isEditMode"
                  @update:model-value="(e) => updateValue('diseases', e)"
                />
                <div v-if="errors.diseases" class="medical-form__field-error">
                  <QIcon name="info" size="xs" />
                  {{ errors.diseases }}
                </div>
              </div>
            </div>
            <div :class="medicalData?.diseases?.length > 0 ? 'col-md-6 col-12' : 'hidden'">
              <div class="medical-form__field">
                <label for="otherDisease" class="medical-form__field-label">بیماری های دیگر</label>
                <QInput
                  id="otherDisease"
                  :model-value="medicalData?.otherDisease"
                  placeholder="بیماری های دیگر..."
                  outlined
                  :disable="!isEditMode"
                  @update:model-value="(e) => updateValue('otherDisease', e)"
                />
                <div v-if="errors.otherDisease" class="medical-form__field-error">
                  <QIcon name="info" size="xs" />
                  {{ errors.otherDisease }}
                </div>
              </div>
            </div>
            <div :class="medicalData?.medicationHistory ? 'col-12 col-md-6' : 'col-12'">
              <div class="medical-form__field">
                <label for="medicationHistory" class="medical-form__field-label">
                  سابقه مصرف دارو ( گذشته و حال )
                </label>
                <QSelect
                  id="medicationHistory"
                  :model-value="medicalData?.medicationHistory"
                  placeholder="انتخاب کنید"
                  clearable
                  :options="medicationOptions"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  outlined
                  :disable="!isEditMode"
                  @update:model-value="(e) => updateMedicalHistory('medicationHistory', e)"
                />
                <div v-if="errors.medicationHistory" class="medical-form__field-error">
                  <QIcon name="info" size="xs" />
                  {{ errors.medicationHistory }}
                </div>
              </div>
            </div>
            <div
              v-if="medicalData?.medicationHistory"
              :class="medicalData?.medicationHistory ? 'col-12 col-md-6' : 'hidden'"
            >
              <div class="medical-form__field">
                <label for="consumedMedications" class="medical-form__field-label">
                  نام داروهای مصرفی
                </label>
                <QInput
                  id="consumedMedications"
                  :model-value="medicalData?.consumedMedications"
                  placeholder="یادداشت کنید ..."
                  outlined
                  :disable="!isEditMode"
                  @update:model-value="(e) => updateValue('consumedMedications', e)"
                />
                <div v-if="errors.consumedMedications" class="medical-form__field-error">
                  <QIcon name="info" size="xs" />
                  {{ errors.consumedMedications }}
                </div>
              </div>
            </div>
          </div>
          <div class="row q-col-gutter-md">
            <div :class="medicalData?.tobaccoAlcoholUse ? 'col-12 col-md-6' : 'col-12'">
              <div class="medical-form__field">
                <label for="tobaccoAlcoholUse" class="medical-form__field-label">
                  سابقه مصرف دخانیات یا الکل
                </label>
                <QSelect
                  id="tobaccoAlcoholUse"
                  :model-value="medicalData?.tobaccoAlcoholUse"
                  placeholder="انتخاب کنید"
                  clearable
                  :options="smokingAlcoholHistoryOptions"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  outlined
                  :disable="!isEditMode"
                  @update:model-value="(e) => updateTobaccoAlcoholUse('tobaccoAlcoholUse', e)"
                />
                <div v-if="errors.tobaccoAlcoholUse" class="medical-form__field-error">
                  <QIcon name="info" size="xs" />
                  {{ errors.tobaccoAlcoholUse }}
                </div>
              </div>
            </div>
            <div
              v-if="medicalData?.tobaccoAlcoholUse"
              :class="medicalData?.tobaccoAlcoholUse ? 'col-12 col-md-6' : 'hidden'"
            >
              <div class="medical-form__field">
                <label for="consumedMedicationsAmount" class="medical-form__field-label">
                  مقدار و نوع مصرف
                </label>
                <QInput
                  id="consumedMedicationsAmount"
                  :model-value="medicalData.consumedMedicationsAmount"
                  placeholder="یادداشت کنید..."
                  outlined
                  :disable="!isEditMode"
                  @update:model-value="(e) => updateValue('consumedMedicationsAmount', e)"
                />
                <div v-if="errors.consumedMedicationsAmount" class="medical-form__field-error">
                  <QIcon name="info" size="xs" />
                  {{ errors.consumedMedicationsAmount }}
                </div>
              </div>
            </div>
          </div>
        </QForm>
      </QCardSection>
    </QCard>
  </div>
</template>

<script setup>
import { IconPencil } from '@tabler/icons-vue'
import { array, boolean, object, string } from 'yup'
import { useGetDiseasesQuery } from '@/data/services/dr-serita/query/index'
import { useGetMedicalInfoQuery, useUpdateMedicalInfo } from '@/modules/User/query/index'
import useYup from '@/composables/use-yup'
import { computed, ref } from 'vue'
import { Notif } from '@/data/services/notification-service'
import { useQueryClient } from '@tanstack/vue-query'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import { MOCK_DISEASES, mockGetMedicalInfo } from '@/mocks/user-details/medical'

const props = defineProps({
  propData: {
    type: Number,
    default: null,
  },
})

const queryClient = useQueryClient()
const updatedMedicalData = ref(null)
const isEditMode = ref(false)
const userId = computed(() => props.propData)
const validationSchema = object().shape({
  diseases: array().nullable().default(null),
  otherDisease: string().nullable().default(null),
  medicationHistory: boolean().nullable().default(null),
  tobaccoAlcoholUse: boolean().nullable().default(null),
  consumedMedications: string().nullable().default(null),
  consumedMedicationsAmount: string().nullable().default(null),
})
const medicationOptions = [
  { value: true, label: 'بله' },
  { value: false, label: 'خیر' },
]

const smokingAlcoholHistoryOptions = [
  { value: true, label: 'بله' },
  { value: false, label: 'خیر' },
]
const { data: diseasesList } = useGetDiseasesQuery({
  ...(ENABLE_USER_DETAIL_MOCKS ? { queryFn: () => MOCK_DISEASES } : {}),
})
const { mutate: updateMedicalInfo, isPending: isSubmitPending } = useUpdateMedicalInfo()
const { data: medicalInfo, isLoading } = useGetMedicalInfoQuery(userId, {
  select: ({ data }) => ({
    diseases: data.diseases?.map(({ id }) => id) || [],
    otherDisease: data.info?.otherDisease,
    medicationHistory: data.info?.medicationHistory,
    tobaccoAlcoholUse: data.info?.tobaccoAlcoholUse,
    consumedMedications: data.info?.consumedMedications,
    consumedMedicationsAmount: data.info?.consumedMedicationsAmount,
  }),
  enabled: !!userId.value,
  ...(ENABLE_USER_DETAIL_MOCKS ? { queryFn: () => mockGetMedicalInfo() } : {}),
})
const medicalData = computed(() => updatedMedicalData.value || medicalInfo.value || {})

const { validateAt, errors } = useYup(validationSchema)
const updateValue = (field, value) => {
  updatedMedicalData.value = { ...medicalData.value, [field]: value }
  validateAt(field, value)
}

const updateMedicalHistory = (field, value) => {
  updateValue(field, value)
  if (!value) {
    updatedMedicalData.value = { ...medicalData.value, consumedMedications: null }
  }
}
const submitForm = () => {
  updateMedicalInfo(
    { userId: userId.value, ...medicalData.value },
    {
      onSuccess: (data) => {
        Notif.success(data.message || 'اطلاعات پزشکی با موفقیت ثبت شد')
        queryClient.invalidateQueries({ queryKey: ['user', 'medical-info', userId] })
        isEditMode.value = false
        updatedMedicalData.value = null
      },
    }
  )
}

const toggleEditMode = () => {
  if (isEditMode.value) {
    submitForm()
  } else {
    isEditMode.value = true
  }
}

const updateTobaccoAlcoholUse = (field, value) => {
  updateValue(field, value)
  if (!value) {
    updatedMedicalData.value = { ...medicalData.value, consumedMedicationsAmount: null }
  }
}
</script>

<style scoped lang="scss">
.medical-form {
  &__dialog {
    .q-dialog__inner {
      padding: 16px;
    }
  }

  &__card {
    width: 100%;
    margin: 0 auto;
  }

  &__header {
    padding: 1rem 1.5rem 0.5rem;
    border-bottom: 1px solid $grey-4;

    &-content {
      display: flex;
      justify-content: end;
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

      &:hover {
        color: $grey-8;
      }
    }
  }

  &__content {
    padding: 1.5rem;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &-label {
      color: $grey-8;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    &-error {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: $negative;
      font-size: 0.75rem;
      margin-top: 0.25rem;

      .q-icon {
        font-size: 0.875rem;
      }
    }
  }

  &__actions {
    padding: 0.5rem 1.5rem 1.5rem;
    border-top: 1px solid $grey-4;
    display: flex;
    justify-content: end;
    gap: 0.75rem;

    .q-btn {
      min-width: 120px;
      font-weight: 500;
    }
  }
}

// Override Quasar select and input styles
.medical-form .q-field {
  &--outlined {
    .q-field__control {
      border-radius: 8px;
    }
  }

  &__label {
    color: $grey-7;
    font-size: 0.875rem;
  }

  &__input {
    color: $grey-9;
  }
}

.medical-form .q-select {
  .q-field__native {
    color: $grey-9;
  }
}

// Chip styles for multiple select
.medical-form .q-chip {
  background-color: $grey-3;
  color: $grey-8;
  font-size: 0.75rem;

  .q-chip__icon {
    color: $grey-6;

    &:hover {
      color: $grey-8;
    }
  }
}
</style>
