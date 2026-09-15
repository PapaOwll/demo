<template>
  <QDialog
    :model-value="visible"
    transition-hide="jump-up"
    :auto-close="false"
    transition-show="jump-down"
    persistent
    @before-show="onOpenForm"
    @update:model-value="emit('update:visible', $event)"
    @escape-key="closeForm"
  >
    <QCard flat class="attach-file-modal__card">
      <QCardSection class="attach-file-modal__header">
        <div class="attach-file-modal__title">
          <QIcon name="attach_file" size="24px" class="q-mr-sm" />
          <span class="text-h6">ویرایش اسناد مالی</span>
        </div>
        <QBtn flat round dense icon="close" @click="closeForm" />
      </QCardSection>
      <QSeparator />
      <QCardSection>
        <QForm ref="formRef" @submit.prevent="submitForm">
          <QInnerLoading :showing="isLoading">
            <QSpinnerGears size="50px" color="primary" />
          </QInnerLoading>
          <div class="attach-file-modal__add-section">
            <QBtn
              color="positive"
              outline
              icon="add"
              label="افزودن چک جدید"
              :disable="isLoading"
              @click="addFile"
            />
          </div>

          <div class="attach-file-modal__content">
            <QList bordered separator class="attach-file-modal__list">
              <template v-for="(file, index) in files" :key="index">
                <QExpansionItem class="full-width">
                  <template #header>
                    <div class="full-width row items-center justify-between">
                      <div v-if="file.data.isCheque" class="text-body2">
                        <span>
                          {{
                            `چک ${convertToJalali(file.data.date)} به مبلغ ${generatePriceFormat(file.data.amount)}`
                          }}
                        </span>
                        <QChip
                          v-if="file.data.isCheque"
                          class="q-mr-md"
                          :class="file.data.confirmation ? 'chips-success' : 'chips-error'"
                        >
                          {{ file.data.confirmation ? 'معتبر' : 'نامعتبر' }}
                        </QChip>
                      </div>
                      <div v-else>بقیه اسناد مالی</div>
                      <QBtn
                        flat
                        round
                        dense
                        color="negative"
                        icon="delete"
                        size="sm"
                        :disable="isLoading"
                        @click.stop="removeFile(index)"
                      >
                        <QTooltip>حذف چک</QTooltip>
                      </QBtn>
                    </div>
                  </template>
                  <template #default>
                    <QCard>
                      <QCardSection>
                        <div class="row q-col-gutter-sm">
                          <div class="col-md-6 col-12">
                            <QSelect
                              :id="`${files[index]}-bank`"
                              outlined
                              label="بانک"
                              :model-value="files[index].data.bankId"
                              clearable
                              map-options
                              :options="bankData?.items"
                              option-label="title"
                              option-value="id"
                              @update:model-value="
                                (e) => handleChange('bankId', e?.id || null, index)
                              "
                            />
                          </div>
                          <div class="col-md-6 col-12">
                            <QInput
                              outlined
                              clearable
                              :model-value="files[index].data.number"
                              label="شماره چک"
                              :error="!!filesErrors[`files[${index}].number`]"
                              :error-message="filesErrors[`files[${index}].number`]"
                              @update:model-value="(e) => handleChange('number', e, index)"
                            />
                          </div>
                        </div>
                        <div class="row q-col-gutter-sm q-my-md">
                          <div class="col-md-4 col-12">
                            <PersianDate
                              :model-value="files[index].data.date"
                              label="تاریخ"
                              @update:model-value="(e) => (files[index].data.date = e)"
                            />
                          </div>
                          <div class="col-md-4 col-12">
                            <QInput
                              :model-value="files[index].data.amount"
                              label="مبلغ"
                              outlined
                              clearable
                              @update:model-value="(e) => handleChange('amount', e, index)"
                            />
                          </div>
                          <div class="col-md-4 col-12 self-end">
                            <QToggle
                              :model-value="files[index].data.confirmation"
                              checked-icon="check"
                              color="green"
                              label="تایید چک"
                              left-label
                              unchecked-icon="clear"
                              @update:model-value="(e) => handleChange('confirmation', e, index)"
                            />
                            <div
                              v-if="filesErrors[`files[${index}].confirmation`]"
                              class="text-negative text-caption q-mt-xs"
                            >
                              <QIcon name="error" size="16px" class="q-mr-xs" />
                              {{ filesErrors[`files[${index}].confirmation`] }}
                            </div>
                          </div>
                        </div>
                        <div class="row">
                          <div class="col-12">
                            <BaseUploader
                              enum-type="treatment-plan.financial"
                              :max-file-size="1048576 * 2.7"
                              :accept="'.jpg, image/*, .pdf, application/pdf'"
                              auto-upload
                              :multiple="false"
                              @update:model-value="(e) => chequeFileUploaded(e, index)"
                            />

                            <div
                              v-if="filesErrors[`files[${index}].id`]"
                              class="text-negative text-caption q-mt-xs"
                            >
                              <QIcon name="error" size="16px" class="q-mr-xs" />
                              {{ filesErrors[`files[${index}].id`] }}
                            </div>
                            <a v-if="files[index].path" :href="files[index].path" target="_blank">
                              مشاهده فایل
                            </a>
                          </div>
                        </div>
                      </QCardSection>
                    </QCard>
                  </template>
                </QExpansionItem>
              </template>
              <QExpansionItem label="بقیه اسناد مالی">
                <QCard>
                  <QCardSection>
                    <div class="col-12">
                      <BaseUploader
                        enum-type="treatment-plan.financial"
                        :max-file-size="1048576 * 2.7"
                        :accept="'.jpg, image/*, .pdf, application/pdf'"
                        auto-upload
                        @update:model-value="(e) => nonChequeFileUploaded(e)"
                      />

                      <div
                        v-if="filesErrors.files && otherFiles.length === 0"
                        class="text-negative text-caption q-mt-xs"
                      >
                        <QIcon name="error" size="16px" class="q-mr-xs" />
                        {{ filesErrors.files }}
                      </div>
                      <div v-for="(item, i) in otherFiles" :key="i">
                        <a :href="item.path" target="_blank">مشاهده فایل {{ i + 1 }}</a>
                      </div>
                    </div>
                  </QCardSection>
                </QCard>
              </QExpansionItem>
            </QList>
          </div>
          <div class="col-12">
            <div
              v-if="getPerms('treatment-plan', 'update', true, 'treatmentPlanFinancial')"
              class="row q-my-md q-col-gutter-md items-center"
            >
              <div class="col-md-3 col-12">
                <div>
                  <QToggle
                    :model-value="editValue.financialConfirmation"
                    color="positive"
                    checked-icon="check"
                    unchecked-icon="clear"
                    label="مالی بسته شد"
                    left-label
                    @update:model-value="
                      (e) => confirmationHandleChange('financialConfirmation', e)
                    "
                  />
                </div>
              </div>
              <div class="col-md-9 col-12">
                <QInput
                  name="financialConfirmationDescription"
                  outlined
                  type="textarea"
                  rows="2"
                  :model-value="editValue.financialConfirmationDescription"
                  placeholder="توضیحات"
                  clearable
                  @update:model-value="
                    (e) => confirmationHandleChange('financialConfirmationDescription', e)
                  "
                />
                <div
                  v-if="confirmationErrors.financialConfirmationDescription"
                  class="text-negative text-caption q-mt-xs"
                >
                  <QIcon name="error" size="16px" class="q-mr-xs" />
                  {{ confirmationErrors.financialConfirmationDescription }}
                </div>
              </div>
            </div>
          </div>
          <QCardActions align="center" class="q-pt-md">
            <QBtn
              :loading="isLoading"
              color="grey"
              outline
              label="انصراف"
              :disable="isLoading"
              @click="closeForm"
            />
            <QBtn
              :loading="isLoading"
              color="primary"
              type="submit"
              label="ثبت اطلاعات"
              icon="save"
              :disable="isLoading"
            />
          </QCardActions>
        </QForm>
      </QCardSection>
    </QCard>
  </QDialog>
</template>

<script setup>
import { toRefs, ref, computed } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import {
  useUpdateConfirmationFinancialMutation,
  useUpdateFinancialFileMutation,
} from '@/modules/TreatmentPlan/query'
import { useGetBanksQuery } from '@/modules/User/query'
import { camelize } from '@/utils/convert-to-camel-snake'
import useYup from '@/composables/use-yup'
import { confirmationValidationSchema, filesValidationSchema } from '@/modules/TreatmentPlan/schema'
import { getPerms } from '@/utils/get-perms'
import { handleError } from '@/utils/error-handler'
import PersianDate from '@/components/Form/PersianDate'
import BaseUploader from '@/components/Form/BaseUploader/BaseUploader'
import { convertToJalali } from '@/utils/date-utils'
import { Notif, confirmDialog } from '@/data/services/notification-service'

const props = defineProps({
  visible: {
    default: false,
    type: Boolean,
  },
  editValues: {
    type: Object,
    default: () => {},
  },
})
const emit = defineEmits(['update:visible', 'afterSubmit'])
const files = ref([])
const otherFiles = ref([])
const formRef = ref(null)
const { visible } = toRefs(props)
const editValue = ref({})
const queryClient = useQueryClient()

const enabled = computed(() => !!visible.value)
const { data: bankData, isLoading: banksLoading } = useGetBanksQuery({ enabled })
const { mutate: updateFinancialFile, isPending: updateFinancialFileLoading } =
  useUpdateFinancialFileMutation()
const { mutate: updateConfirmation, isPending: updateConfirmationLoading } =
  useUpdateConfirmationFinancialMutation()

const isLoading = computed(
  () => updateFinancialFileLoading.value || updateConfirmationLoading.value || banksLoading.value
)

const {
  validate: filesValidate,
  validateAt: filesValidateAt,
  errors: filesErrors,
} = useYup(filesValidationSchema)
const {
  validate: confirmationValidate,
  validateAt: confirmationValidateAt,
  errors: confirmationErrors,
} = useYup(confirmationValidationSchema)
const handleChange = (field, value, index) => {
  if (index || index === 0) {
    files.value[index].data[field] = value
    filesValidateAt(`files[${index}].${field}`, value)
  } else {
    editValue.value[field] = value
    filesValidateAt(field, value)
  }
}
const confirmationHandleChange = (field, value) => {
  editValue.value[field] = value
  confirmationValidateAt(field, value)
}
const activeTab = ref(0)
const closeForm = () => {
  if (isLoading.value) {
    Notif.warning('لطفا منتظر تکمیل عملیات بمانید')
    return
  }

  files.value = []
  otherFiles.value = []
  editValue.value = {}

  if (formRef.value) {
    formRef.value.resetValidation()
  }

  emit('update:visible', false)
}
const onOpenForm = () => {
  files.value = []
  otherFiles.value = []
  if (props.visible) {
    editValue.value = camelize(props.editValues)

    if (editValue.value.id) {
      const [otherChequesFile, chequesFile] = editValue.value.financialFiles.reduce(
        ([nonCheques, cheques], file) => {
          const nonChequeFileData = file.additionalData
          if (!nonChequeFileData.data) {
            nonChequeFileData.data = {}
          }
          if (file.additionalData.data?.isCheque) {
            cheques.push({
              ...file,
              data: {
                id: file.id,
                confirmation: !!nonChequeFileData.status,
                description: nonChequeFileData.description,
                ...nonChequeFileData?.data,
              },
            })
          } else {
            nonChequeFileData.data.isCheque = false
            nonCheques.push({
              ...file,
              data: {
                id: file.id,
                confirmation: !!nonChequeFileData.status,
                description: nonChequeFileData.description,
                ...nonChequeFileData?.data,
              },
            })
          }
          return [nonCheques, cheques]
        },
        [[], []]
      )
      files.value = chequesFile
      otherFiles.value = otherChequesFile
    }
  }
}
const generatePriceFormat = (amount) => {
  if (!amount) return 'نامشخص'
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
const chequeFileUploaded = (file, index) => {
  try {
    if (!file?.data?.[0]?.id) {
      throw new Error('فایل آپلود شده معتبر نیست')
    }

    const fileId = file.data[0].id
    files.value[index] = { ...file.data[0], ...files.value[index] }
    files.value[index].data.id = fileId
    handleChange('id', fileId, index)

    Notif.success('فایل با موفقیت آپلود شد')

    filesValidate()
  } catch (error) {
    Notif.error(error.message || 'خطا در آپلود فایل')
  }
}
const nonChequeFileUploaded = (file) => {
  try {
    if (!file?.id) {
      throw new Error('فایل آپلود شده معتبر نیست')
    }

    otherFiles.value.push({ ...file, data: { id: file.id, isCheque: false } })

    Notif.success('سند مالی با موفقیت آپلود شد')

    filesValidate()
  } catch (error) {
    Notif.error(error.message || 'خطا در آپلود سند مالی')
  }
}
const addFile = () => {
  if (isLoading.value) {
    Notif.warning('لطفا منتظر تکمیل عملیات بمانید')
    return
  }

  const newFile = {
    id: null,
    amount: null,
    date: new Date().toISOString().slice(0, 10),
    confirmation: false,
    isCheque: true,
    number: null,
    bankId: null,
  }
  files.value.push({ data: newFile })
  activeTab.value = files.value.length - 1

  Notif.info('چک جدید اضافه شد')
}

const removeFile = (index) => {
  if (isLoading.value) {
    Notif.warning('لطفا منتظر تکمیل عملیات بمانید')
    return
  }

  confirmDialog(
    'تأیید حذف',
    'آیا از حذف این چک اطمینان دارید؟',
    () => {
      files.value.splice(index, 1)
      Notif.success('چک با موفقیت حذف شد')
    },
    {
      cancel: { label: 'انصراف', color: 'grey', outline: true },
      ok: { label: 'حذف', color: 'negative' },
      persistent: true,
    }
  )
}
const submitConfirmation = async () => {
  const confirmForm = {
    financialConfirmation: editValue.value.financialConfirmation,
    financialConfirmationDescription: editValue.value.financialConfirmationDescription,
  }
  const { isValid: confirmIsValid, payload: confirmationPayload } =
    await confirmationValidate(confirmForm)
  if (!confirmIsValid) return
  updateConfirmation(
    { id: editValue.value.id, ...confirmationPayload },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['user', 'user-document', editValue.value.user?.id],
        })
        emit('afterSubmit')
        closeForm()
        Notif.success('تایید نهایی با موفقیت انجام شد', { timeout: 3000 })
      },
      onError: (error) => {
        handleError(error)
        Notif.error('خطا در تایید نهایی', { timeout: 5000 })
      },
    }
  )
}
const submitForm = async () => {
  if (isLoading.value) {
    Notif.warning('لطفا منتظر تکمیل عملیات بمانید')
    return
  }

  try {
    const filesForm = {
      files: [...files.value, ...otherFiles.value].flatMap((f) => f.data),
    }

    const { isValid: filesIsValid, payload: filesPayload } = await filesValidate(filesForm)

    if (!filesIsValid) {
      Notif.warning('لطفا خطاهای فرم را بررسی و اصلاح کنید', { timeout: 4000 })
      return
    }

    updateFinancialFile(
      { id: editValue.value.id, ...filesPayload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ['user', 'user-document', editValue.value.user?.id],
          })

          Notif.success('اسناد مالی با موفقیت ثبت شد', { timeout: 3000 })

          if (getPerms('treatment-plan', 'update', true, 'treatmentPlanFinancial')) {
            submitConfirmation()
          } else {
            emit('afterSubmit')
            closeForm()
          }
        },
        onError: (error) => {
          handleError(error)
          Notif.error('خطا در ثبت اسناد مالی', { timeout: 5000 })
        },
      }
    )
  } catch {
    /* empty */
  }
}
</script>

<style scoped lang="scss">
.attach-file-modal {
  &__card {
    width: 900px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background-color: $grey-1;
  }

  &__title {
    display: flex;
    align-items: center;
    color: $primary;
    font-weight: 600;
  }

  &__add-section {
    margin-bottom: 16px;
    padding: 12px;
    background-color: $grey-1;
    border-radius: 8px;
  }

  &__content {
    margin-bottom: 24px;
  }

  &__list {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .q-expansion-item {
      border-bottom: 1px solid $grey-4;

      &:last-child {
        border-bottom: none;
      }

      &__header {
        padding: 16px;
        background-color: $white;
        min-height: 60px;

        &:hover {
          background-color: $grey-1;
        }
      }
    }

    .q-card {
      box-shadow: none;
      border-radius: 0;
    }
  }
}

.chips-success {
  background-color: $positive !important;
  color: $white !important;
}

.chips-error {
  background-color: $negative !important;
  color: $white !important;
}

.q-field__error {
  &.show {
    opacity: 1;
    transform: translateY(0);
  }

  &.hide {
    opacity: 0;
    transform: translateY(-4px);
  }
}

@media (max-width: 768px) {
  .attach-file-modal {
    &__card {
      width: 100%;
      max-width: 100vw;
      margin: 0;
      border-radius: 0;
    }

    &__header {
      padding: 12px 16px;
    }
  }
}
</style>
