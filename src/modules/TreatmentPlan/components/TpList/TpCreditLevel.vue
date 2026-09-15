<template>
  <QDialog
    :model-value="visible"
    :auto-close="false"
    transition-hide="jump-up"
    transition-show="jump-down"
    persistent
    @before-show="onOpenForm"
    @update:model-value="emit('update:visible', $event)"
    @escape-key="closeForm"
  >
    <QCard class="credit-level-modal__card">
      <QCardSection class="credit-level-modal__header">
        <div class="credit-level-modal__title">
          <QIcon name="verified_user" size="24px" class="q-mr-sm" />
          <span class="text-h6">اعتبارسنجی طرح درمان</span>
        </div>
        <QBtn flat round dense icon="close" :disable="isLoading" @click="closeForm" />
      </QCardSection>
      <QSeparator />
      <QCardSection>
        <QForm ref="formRef" @submit.prevent="submitForm">
          <QInnerLoading :showing="isLoading">
            <QSpinnerGears size="50px" color="primary" />
          </QInnerLoading>

          <div class="credit-level-modal__content row q-col-gutter-md">
            <div class="col-md-6 col-12">
              <QCard flat class="credit-level-modal__info-card">
                <QCardSection>
                  <div class="credit-level-modal__patient-info">
                    <QIcon name="person" size="20px" class="q-mr-xs" />
                    <span class="text-body2">
                      این اعتبارسنجی برای طرح درمان
                      <a :href="editValue.publicLink" target="_blank">
                        <strong>{{ editValue.id }}</strong>
                      </a>
                      به نام
                      <strong>{{ editValue.user.firstName + ' ' + editValue.user.name }}</strong>
                      با شماره تماس
                      <strong>{{ editValue.user.mobile ?? editValue.user.tel }}</strong>
                      با کد ملی
                      <strong>{{ editValue.user.nationalCode || 'ثبت نشده' }}</strong>
                      است.
                    </span>
                  </div>
                </QCardSection>
              </QCard>

              <div class="credit-level-modal__status-section q-mt-md">
                <div class="text-subtitle2 q-mb-md">وضعیت کلی اعتبارسنجی</div>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <QSelect
                      :model-value="creditLevelData?.creditStatus"
                      outlined
                      :options="creditStatusEnums"
                      map-options
                      label="وضعیت کلی"
                      option-label="title"
                      option-value="id"
                      :error="!!errors?.creditStatus"
                      :error-message="errors?.creditStatus"
                      :loading="isEnumsLoading"
                      :disable="isLoading"
                      @update:model-value="(e) => handleChange('creditStatus', e?.id ?? null)"
                    />
                  </div>
                  <div class="col-12">
                    <QInput
                      :model-value="creditLevelData.creditDescription"
                      outlined
                      clearable
                      label="توضیحات کلی"
                      type="textarea"
                      rows="3"
                      :disable="isLoading"
                      @update:model-value="(e) => handleChange('creditDescription', e)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-6 col-12">
              <div class="credit-level-modal__credits-section">
                <div class="credit-level-modal__credits-header">
                  <div class="text-subtitle2">فهرست اعتبارسنجی‌ها</div>
                  <QBtn
                    color="positive"
                    outline
                    icon="person_add"
                    label="افزودن فرد"
                    size="sm"
                    :disable="isLoading"
                    @click="addCredit"
                  />
                </div>
                <QList bordered separator class="credit-level-modal__credits-list">
                  <template v-for="(credit, index) in creditLevelData?.credits || []" :key="index">
                    <QExpansionItem class="credit-level-modal__credit-item">
                      <template #header>
                        <div class="full-width row items-center justify-between">
                          <div class="credit-level-modal__credit-header">
                            <QIcon name="person" size="18px" class="q-mr-xs" />
                            <span class="text-body2">
                              {{ credit.firstName || 'نام' }}
                              {{ credit.lastName || 'نام خانوادگی' }}
                            </span>
                            <QChip
                              :color="creditStatus(credit.status).color"
                              text-color="white"
                              size="sm"
                              class="q-ml-sm"
                            >
                              {{ creditStatus(credit.status).text }}
                            </QChip>
                          </div>
                          <QBtn
                            v-if="index > 0"
                            flat
                            round
                            dense
                            color="negative"
                            icon="delete"
                            size="sm"
                            :disable="isLoading"
                            @click.stop="removeCredit(index)"
                          >
                            <QTooltip>حذف فرد</QTooltip>
                          </QBtn>
                        </div>
                      </template>
                      <template #default>
                        <QCard flat>
                          <QCardSection>
                            <div class="credit-level-modal__credit-form row q-col-gutter-md">
                              <div class="col-md-6 col-12">
                                <QInput
                                  :model-value="creditLevelData.credits[index].firstName"
                                  outlined
                                  clearable
                                  label="نام *"
                                  :readonly="index === 0"
                                  :disable="isLoading"
                                  :error="!!errors?.credits?.[index]?.firstName"
                                  :error-message="errors?.credits?.[index]?.firstName"
                                  @update:model-value="(e) => handleChange('firstName', e, index)"
                                />
                              </div>
                              <div class="col-md-6 col-12">
                                <QInput
                                  :model-value="creditLevelData.credits[index].lastName"
                                  outlined
                                  clearable
                                  label="نام خانوادگی *"
                                  :readonly="index === 0"
                                  :disable="isLoading"
                                  :error="!!errors?.credits?.[index]?.lastName"
                                  :error-message="errors?.credits?.[index]?.lastName"
                                  @update:model-value="(e) => handleChange('lastName', e, index)"
                                />
                              </div>
                              <div class="col-md-6 col-12">
                                <QInput
                                  :model-value="creditLevelData.credits[index].nationalCode"
                                  label="کد ملی *"
                                  outlined
                                  :readonly="index === 0"
                                  clearable
                                  :disable="isLoading"
                                  :error="!!errors?.credits?.[index]?.nationalCode"
                                  :error-message="errors?.credits?.[index]?.nationalCode"
                                  @update:model-value="
                                    (e) => handleChange('nationalCode', e, index)
                                  "
                                />
                              </div>
                              <div class="col-md-6 col-12">
                                <QInput
                                  :model-value="creditLevelData.credits[index].phoneNumber"
                                  label="شماره موبایل *"
                                  outlined
                                  :readonly="index === 0"
                                  clearable
                                  :disable="isLoading"
                                  :error="!!errors?.credits?.[index]?.phoneNumber"
                                  :error-message="errors?.credits?.[index]?.phoneNumber"
                                  @update:model-value="(e) => handleChange('phoneNumber', e, index)"
                                />
                              </div>
                              <div class="col-md-6 col-12">
                                <QSelect
                                  :model-value="creditLevelData.credits[index].level"
                                  label="سطح اعتبار *"
                                  clearable
                                  outlined
                                  map-options
                                  :options="creditLevelEnums"
                                  option-label="title"
                                  option-value="id"
                                  :loading="isEnumsLoading"
                                  :disable="isLoading"
                                  :error="!!errors?.credits?.[index]?.level"
                                  :error-message="errors?.credits?.[index]?.level"
                                  @update:model-value="
                                    (e) => handleChange('level', e?.id ?? null, index)
                                  "
                                />
                              </div>
                              <div class="col-md-6 col-12">
                                <QSelect
                                  :model-value="creditLevelData.credits[index]?.status"
                                  outlined
                                  :options="creditStatusEnums"
                                  map-options
                                  label="وضعیت اعتبار *"
                                  option-label="title"
                                  option-value="id"
                                  :loading="isEnumsLoading"
                                  :disable="isLoading"
                                  :error="!!errors?.credits?.[index]?.status"
                                  :error-message="errors?.credits?.[index]?.status"
                                  @update:model-value="
                                    (e) => handleChange('status', e?.id ?? null, index)
                                  "
                                />
                              </div>
                              <div class="col-12">
                                <QInput
                                  :model-value="creditLevelData.credits[index]?.description"
                                  label="توضیحات"
                                  outlined
                                  clearable
                                  type="textarea"
                                  rows="2"
                                  :disable="isLoading"
                                  @update:model-value="(e) => handleChange('description', e, index)"
                                />
                              </div>
                              <div class="col-12">
                                <div class="text-caption q-mb-sm">اسناد و مدارک:</div>
                                <BaseUploader
                                  v-model:files="creditLevelFiles"
                                  :max-file-size="1048576 * 2.7"
                                  :accept="'.jpg, .jpeg, .png, .pdf, image/*'"
                                  multiple
                                  enum-type="credit-level"
                                  :disable="isLoading"
                                />
                              </div>
                            </div>
                          </QCardSection>
                        </QCard>
                      </template>
                    </QExpansionItem>
                  </template>
                </QList>
              </div>
            </div>
          </div>
        </QForm>
      </QCardSection>

      <QCardActions align="center" class="q-pt-none">
        <QBtn
          label="انصراف"
          :loading="isLoading"
          color="grey"
          outline
          :disable="isLoading"
          @click="closeForm"
        />
        <QBtn
          label="ثبت اعتبارسنجی"
          :loading="isLoading"
          color="primary"
          type="submit"
          icon="save"
          :disable="isLoading"
          @click="submitForm"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>

<script setup>
import { computed, toRefs, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { object, string, array, number } from 'yup'
import { useUpdateCreditLevelMutation } from '@/modules/TreatmentPlan/query'
import { cloneDeep } from '@/utils/lodash-utils'
import { handleError } from '@/utils/error-handler'
import { useGetEnumsQuery } from '@/modules/User/query'
import useYup from '@/composables/use-yup'
import BaseUploader from '@/components/Form/BaseUploader/BaseUploader'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import { TREATMENT_PLAN_STATUS } from '../../constants/enums'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  editValue: {
    type: Object,
    default: () => ({}),
  },
})
const emit = defineEmits(['update:visible', 'submitted'])
const { visible, editValue } = toRefs(props)
const queryClient = useQueryClient()
const formRef = ref(null)
const activeCredit = ref('0')
const creditLevelStatusEnumRef = ref('CreditLevelStatusEnum')
const creditLevelEnumRef = ref('CreditLevelEnum')
const updateCreditLevelData = ref(null)

const initialData = computed(() => editValue.value || [])
const creditLevelData = computed(() => updateCreditLevelData.value || initialData.value || [])
const validationSchema = object().shape({
  creditStatus: string(),
  creditExpirationDate: string().nullable(),
  creditDescription: string().nullable(),
  credits: array().of(
    object().shape({
      firstName: string().required('فیلد نام الزامیست.'),
      lastName: string().required('فیلد نام خانوادگی الزامیست.'),
      nationalCode: string().required('فیلد کد ملی الزامیست.'),
      phoneNumber: string().required('فیلد موبایل الزامیست.'),
      level: string().required('فیلد سطح الزامیست.'),
      status: string().required('فیلد وضعیت سطح اجباریست'),
      description: string().nullable(),
      fileIds: array().of(number()),
    })
  ),
})
const { validate, validateAt, errors } = useYup(validationSchema)
const handleChange = (field, value, index) => {
  if (!updateCreditLevelData.value) {
    updateCreditLevelData.value = cloneDeep(creditLevelData.value)
  }

  if (index !== undefined && index !== null) {
    if (!updateCreditLevelData.value.credits) {
      updateCreditLevelData.value.credits = []
    }
    if (!updateCreditLevelData.value.credits[index]) {
      updateCreditLevelData.value.credits[index] = {}
    }
    updateCreditLevelData.value.credits[index][field] = value
    validateAt(`credits[${index}].${field}`, value)
  } else {
    updateCreditLevelData.value[field] = value
    validateAt(field, value)
  }
}
const { data: creditLevelStatusEnum, isLoading: statusEnumsLoading } =
  useGetEnumsQuery(creditLevelStatusEnumRef)
const { data: creditLevelEnum, isLoading: levelEnumsLoading } = useGetEnumsQuery(creditLevelEnumRef)
const { mutate: updateCreditLevel, isPending: updateCreditLevelLoading } =
  useUpdateCreditLevelMutation()

const isEnumsLoading = computed(() => statusEnumsLoading.value || levelEnumsLoading.value)
const isLoading = computed(() => updateCreditLevelLoading.value || isEnumsLoading.value)

const creditStatusEnums = computed(() =>
  creditLevelStatusEnum.value
    ? Object.keys(creditLevelStatusEnum.value).map((it) => ({
        title: creditLevelStatusEnum.value[it].faTitle,
        id: creditLevelStatusEnum.value[it].id,
      }))
    : []
)
const creditLevelEnums = computed(() =>
  creditLevelEnum.value
    ? Object.keys(creditLevelEnum.value).map((it) => ({
        title: creditLevelEnum.value[it].faTitle,
        id: creditLevelEnum.value[it].id,
      }))
    : []
)

const creditStatus = (status) => {
  switch (status) {
    case 1: {
      return {
        text: 'معتبر',
        color: 'positive',
      }
    }
    case 2: {
      return {
        text: 'نامعتبر',
        color: 'negative',
      }
    }
    case 3: {
      return {
        text: 'نامشخص',
        color: 'warning',
      }
    }
    default: {
      return {
        text: 'نامشخص',
        color: 'info',
      }
    }
  }
}
const creditLevelFiles = computed({
  get() {
    return cloneDeep(creditLevelData.value.credits[activeCredit.value]?.files) || []
  },
  set(value) {
    handleChange(`credits[${activeCredit.value}].files`, value)
  },
})

const onOpenForm = () => {
  if (editValue.value.credit?.length) {
    const credits = editValue.value.credit.map((credit) => ({ ...credit, ...credit?.data }))
    handleChange('credits', credits)
  } else {
    // first credit have to be user of treatment plan
    handleChange('creditStatus', 3)
    const credits = [
      {
        firstName: editValue.value.user?.firstName,
        lastName: editValue.value.user?.name,
        phoneNumber: editValue.value.user?.mobile,
        nationalCode: editValue.value.user?.nationalCode,
        status: TREATMENT_PLAN_STATUS.PERFORMED,
        level: 16,
      },
    ]
    handleChange('credits', credits)
  }
}

const closeForm = () => {
  if (isLoading.value) {
    Notif.warning('لطفا منتظر تکمیل عملیات بمانید')
    return
  }

  updateCreditLevelData.value = null
  activeCredit.value = '0'

  if (formRef.value) {
    formRef.value.resetValidation()
  }

  emit('update:visible', false)
}

const addCredit = () => {
  if (isLoading.value) {
    Notif.warning('لطفا منتظر تکمیل عملیات بمانید')
    return
  }

  const newCredit = {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    nationalCode: '',
    status: 3,
    level: 16,
    description: '',
    files: [],
  }

  handleChange('credits', [...creditLevelData.value.credits, newCredit])
  activeCredit.value = creditLevelData.value.credits.length - 1

  Notif.info('فرد جدید به لیست اضافه شد')
}

const removeCredit = (index) => {
  if (isLoading.value) {
    Notif.warning('لطفا منتظر تکمیل عملیات بمانید')
    return
  }

  if (index === 0) {
    Notif.warning('فرد اصلی قابل حذف نیست')
    return
  }

  confirmDialog(
    'تأیید حذف',
    'آیا از حذف این فرد اطمینان دارید؟',
    () => {
      const updatedCredits = [...creditLevelData.value.credits]
      updatedCredits.splice(index, 1)
      handleChange('credits', updatedCredits)

      Notif.success('فرد با موفقیت حذف شد')
    },
    {
      cancel: { label: 'انصراف', color: 'grey', outline: true },
      ok: { label: 'حذف', color: 'negative' },
      persistent: true,
    }
  )
}

const submitForm = async () => {
  try {
    const { isValid, payload } = await validate(creditLevelData.value)

    if (!isValid) {
      Notif.warning('لطفا خطاهای فرم را بررسی و اصلاح کنید', { timeout: 4000 })
      return
    }

    const form = {
      id: creditLevelData.value?.id,
      ...payload,
    }

    updateCreditLevel(form, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({
          queryKey: ['user', 'user-document', creditLevelData.value.user?.id],
        })

        Notif.success(res?.message || 'اعتبارسنجی با موفقیت ثبت شد', { timeout: 3000 })

        closeForm()
        emit('submitted')
      },
      onError: (error) => {
        handleError(error)
        Notif.error('خطا در ثبت اعتبارسنجی', { timeout: 5000 })
      },
    })
  } catch (error) {
    Notif.error(`خطا در ارسال فرم: ${error.message || 'خطای غیرمنتظره'}`, { timeout: 5000 })
  }
}
</script>

<style scoped lang="scss">
.credit-level-modal {
  &__card {
    width: 1250px;
    max-width: 95vw;
    max-height: 95vh;
    overflow-y: auto;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background-color: $grey-1;
    border-bottom: 1px solid $grey-4;
  }

  &__title {
    display: flex;
    align-items: center;
    color: $primary;
    font-weight: 600;
  }

  &__content {
    padding: 0;
  }

  &__info-card {
    background-color: $grey-1;
    border-radius: 8px;
    border: 1px solid $grey-4;
  }

  &__patient-info {
    display: flex;
    align-items: flex-start;
    line-height: 1.6;

    a {
      color: $primary;
      text-decoration: none;
      font-weight: 600;

      &:hover {
        text-decoration: underline;
      }
    }

    strong {
      color: $dark;
      font-weight: 600;
      margin: 0 4px;
    }
  }

  &__status-section {
    .text-subtitle2 {
      color: $primary;
      font-weight: 600;
      border-bottom: 2px solid $primary;
      padding-bottom: 4px;
      display: inline-block;
    }
  }

  &__credits-section {
    height: 100%;
  }

  &__credits-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 16px;
    background-color: $grey-1;
    border-radius: 8px;
    border: 1px solid $grey-4;

    .text-subtitle2 {
      color: $primary;
      font-weight: 600;
      margin: 0;
    }
  }

  &__credits-list {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    max-height: 60vh;
    overflow-y: auto;
  }

  &__credit-item {
    border-bottom: 1px solid $grey-4;

    &:last-child {
      border-bottom: none;
    }

    .q-expansion-item__header {
      padding: 16px;
      background-color: $white;
      min-height: 64px;

      &:hover {
        background-color: $grey-1;
      }
    }
  }

  &__credit-header {
    display: flex;
    align-items: center;
    flex: 1;
  }

  &__credit-form {
    background-color: $grey-1;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid $grey-3;
  }
}

.q-chip {
  font-weight: 500;
  border-radius: 16px;

  &.bg-positive {
    background-color: $positive !important;
    color: $white !important;
  }

  &.bg-negative {
    background-color: $negative !important;
    color: $white !important;
  }

  &.bg-warning {
    background-color: $warning !important;
    color: $white !important;
  }

  &.bg-info {
    background-color: $info !important;
    color: $white !important;
  }
}

.q-field {
  &.q-field--readonly {
    .q-field__control {
      background-color: $grey-2;
      opacity: 0.7;
    }

    .q-field__native {
      color: $grey-7;
    }
  }

  &.q-field--error {
    .q-field__messages {
      color: $negative;
      font-weight: 500;
    }
  }

  &.q-field--disabled {
    opacity: 0.6;
  }
}

.q-inner-loading {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  z-index: 1000;
}

.q-btn {
  &.q-btn--disabled {
    opacity: 0.5;
  }

  &.q-btn--loading {
    .q-btn__content {
      opacity: 0.7;
    }
  }
}

.q-card {
  &.credit-level-modal__info-card {
    transition: box-shadow 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
}

.q-list {
  .q-expansion-item {
    transition: background-color 0.2s ease;

    &__header {
      transition: all 0.2s ease;
    }

    &--expanded {
      .q-expansion-item__header {
        background-color: $grey-2;
      }
    }
  }
}

.q-separator {
  opacity: 0.3;
}

@media (max-width: 1024px) {
  .credit-level-modal {
    &__card {
      width: 100%;
      max-width: 100vw;
      height: 100vh;
      max-height: 100vh;
      border-radius: 0;
    }

    &__header {
      padding: 12px 16px;
    }

    &__content {
      .col-md-6 {
        flex: 100%;
        max-width: 100%;
      }
    }

    &__credits-list {
      max-height: 50vh;
    }
  }
}

@media (max-width: 768px) {
  .credit-level-modal {
    &__credits-header {
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }

    &__patient-info {
      flex-direction: column;
      gap: 8px;

      .q-icon {
        align-self: flex-start;
      }
    }

    &__credit-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .q-chip {
        align-self: flex-start;
      }
    }

    &__credit-form {
      padding: 12px;

      .col-md-6 {
        flex: 100%;
        max-width: 100%;
      }
    }

    &__status-section {
      margin-top: 20px;
    }
  }

  // Stack form fields vertically on mobile
  .q-field {
    margin-bottom: 16px;
  }
}

@media (max-width: 480px) {
  .credit-level-modal {
    &__header {
      padding: 8px 12px;

      .text-h6 {
        font-size: 1rem;
      }
    }

    &__status-section,
    &__credits-section {
      padding: 0 8px;
    }

    &__patient-info {
      .text-body2 {
        font-size: 0.875rem;
        line-height: 1.5;
      }
    }

    &__credits-header {
      padding: 8px 12px;

      .text-subtitle2 {
        font-size: 0.875rem;
      }
    }

    &__credit-form {
      padding: 8px;
    }
  }

  // Smaller form elements on very small screens
  .q-field {
    .q-field__control {
      min-height: 40px;
    }
  }

  .q-btn {
    min-height: 36px;
    font-size: 0.875rem;
  }

  .q-chip {
    font-size: 0.75rem;
    padding: 4px 8px;
  }
}

@media print {
  .credit-level-modal {
    &__card {
      width: 100%;
      max-width: none;
      box-shadow: none;
      border: 1px solid $grey-4;
    }

    &__header {
      background-color: transparent !important;
      border-bottom: 2px solid $primary;
    }

    // Hide interactive elements when printing
    .q-btn,
    .q-inner-loading {
      display: none !important;
    }
  }
}

.body--dark {
  .credit-level-modal {
    &__info-card {
      background-color: $dark-page;
      border-color: $grey-8;
    }

    &__credits-header {
      background-color: $dark-page;
      border-color: $grey-8;
    }

    &__credit-form {
      background-color: $dark-page;
      border-color: $grey-8;
    }
  }
}

.q-expansion-item {
  .q-expansion-item__content {
    transition: all 0.3s ease;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
