<template>
  <BaseModal
    v-model="isVisible"
    title="درخواست عودت"
    :width="activeTab === 'check' ? '57rem' : '32rem'"
  >
    <TabItem
      v-model="activeTab"
      :group="tabItems"
      style-type="underline"
      align="start"
      style="border-bottom: 1px solid #eeeeee"
    />

    <QTabPanels v-model="activeTab" animated>
      <QTabPanel name="cash">
        <div class="refund-cash">
          <TextField
            v-model="cashForm.sheba"
            label="شماره شبا"
            required
            maxlength="24"
            variant="outline"
            :error="!!shebaError"
            :error-message="shebaError"
            @update:model-value="onShebaChange"
          >
            <template #endSection>
              <span class="refund-cash__sheba-prefix">IR</span>
            </template>
          </TextField>
          <Typography variant="caption" color="grey" class="refund-cash__sheba-hint">
            شماره شبا باید به نام دارنده طرح درمان باشد
          </Typography>

          <SelectField
            v-model="cashForm.returnType"
            label="نوع عودت"
            required
            variant="outline"
            :options="returnTypeOptions"
            emit-value
            map-options
            option-label="label"
            option-value="value"
            placeholder="انتخاب کنید"
            @update:model-value="onReturnTypeChange"
          />

          <CurrencyField
            v-model="cashForm.amount"
            label="مبلغ پرداختی"
            required
            :disable="isAmountDisabled"
            :min="1000"
            suffix="تومان"
            :error-message="amountError"
            :error="!!amountError"
          />

          <TextField
            v-model="cashForm.description"
            type="textarea"
            label=""
            variant="outline"
            placeholder="توضیحات"
            autogrow
          />
        </div>
      </QTabPanel>

      <QTabPanel name="check">
        <div class="refund-check">
          <Typography variant="body" size="4" color="gray-700">
            برای عودت چک، بعد از انتخاب چک مورد نظر مدرک مرتبط با آن را بارگذاری کنید
          </Typography>

          <div v-if="checksLoading" class="refund-check__loading">
            <QSpinnerTail color="primary" size="2em" />
          </div>

          <div v-else-if="checks.length === 0" class="refund-check__empty">
            <Typography variant="caption" color="grey">چکی برای این کاربر ثبت نشده است</Typography>
          </div>

          <div v-else class="refund-check__list">
            <div
              v-for="check in checks"
              :key="check.id"
              class="refund-check__card"
              :class="{ 'refund-check__card--selected': selectedCheckId === check.id }"
              @click="selectedCheckId = check.id"
            >
              <Checkbox
                :model-value="selectedCheckId === check.id"
                @update:model-value="selectedCheckId = check.id"
              />
              <div class="refund-check__card-info">
                <div class="refund-check__card-row">
                  <Typography variant="body" size="2" weight="semibold" color="dark">
                    {{ formatChequeAmount(check.amount) }} تومان
                  </Typography>
                  <Typography variant="body" size="4" color="grey">
                    شماره چک - {{ check.cheque_number || check.chequeNumber }}
                  </Typography>
                </div>
                <div class="refund-check__card-row">
                  <div class="refund-check__card-detail">
                    <Typography variant="caption" weight="medium">بانک صادرکننده :</Typography>
                    <Typography v-if="check.bank" variant="caption" color="grey">
                      {{ check.bank?.title }}
                    </Typography>
                  </div>
                  <div class="refund-check__card-detail">
                    <Typography variant="caption" weight="medium">تاریخ سررسید</Typography>
                    <Typography variant="caption" color="grey">
                      {{ formatDueDate(check.due_date || check.dueDate) }}
                    </Typography>
                  </div>
                  <div class="refund-check__card-detail">
                    <Typography variant="caption" weight="medium">شناسه صیادی</Typography>
                    <Typography variant="caption" color="grey">
                      {{ check.sayadNumber || check.sayad_number }}
                    </Typography>
                  </div>
                </div>
                <div
                  v-if="
                    check.bank_branch_title ||
                    check.bank_branch_code ||
                    check.account_number ||
                    check.account_holder
                  "
                  class="refund-check__card-row"
                >
                  <div v-if="check.bank_branch_title" class="refund-check__card-detail">
                    <Typography variant="caption" weight="medium">نام شعبه بانک</Typography>
                    <Typography variant="caption" color="grey">
                      {{ check.bank_branch_title }}
                    </Typography>
                  </div>
                  <div v-if="check.bank_branch_code" class="refund-check__card-detail">
                    <Typography variant="caption" weight="medium">کد شعبه</Typography>
                    <Typography variant="caption" color="grey">
                      {{ check.bank_branch_code }}
                    </Typography>
                  </div>
                  <div v-if="check.account_holder" class="refund-check__card-detail">
                    <Typography variant="caption" weight="medium">صاحب حساب</Typography>
                    <Typography variant="caption" color="grey">
                      {{ check.account_holder }}
                    </Typography>
                  </div>
                  <div v-if="check.account_number" class="refund-check__card-detail">
                    <Typography variant="caption" weight="medium">شماره حساب</Typography>
                    <Typography variant="caption" color="grey">
                      {{ check.account_number }}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <TextField
            v-model="checkForm.description"
            type="textarea"
            label="توضیحات"
            variant="outline"
            placeholder="توضیحات"
            autogrow
          />
        </div>
      </QTabPanel>
    </QTabPanels>

    <template #footer>
      <div class="refund-footer">
        <Button
          variant="filled"
          color="light-blue"
          text="ثبت عودت"
          is-full-width
          :is-loading="isSubmitting"
          @click="handleSubmit"
        />
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Notif } from '@/data/services/notification-service'
import BaseModal from '@/base/Modal'
import TabItem from '@/base/TabItem'
import TextField from '@/base/TextField'
import Checkbox from '@/base/Checkbox'
import SelectField from '@/base/SelectField'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import CurrencyField from '@/components/Form/CurrencyField'
import { convertToJalali } from '@/utils/date-utils'
import { numberSeparator } from '@/utils/formatter'
import { apiGetEnums, apiGetUserCheques, apiCreateRefundRequest } from '@/modules/User/api'
import { apiGetUserActivateTreatmentPlan } from '@/modules/TreatmentPlan/api'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import {
  mockRefundEnums,
  mockGetUserCheques,
  mockCreateRefundRequest,
} from '@/mocks/user-details/financial'

const fetchEnumsFn = ENABLE_USER_DETAIL_MOCKS
  ? async () => ({ data: mockRefundEnums })
  : (params) => apiGetEnums(params)

const fetchUserChequesFn = ENABLE_USER_DETAIL_MOCKS
  ? () => mockGetUserCheques()
  : (userId) => apiGetUserCheques(userId)

const fetchActiveTpFn = ENABLE_USER_DETAIL_MOCKS
  ? async () => ({
      data: { id: 7101, pre_pay: 5_000_000, pre_payment: 5_000_000, prepay: 5_000_000 },
    })
  : (userId) => apiGetUserActivateTreatmentPlan(userId)

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const activeTab = ref('cash')
const selectedCheckId = ref(null)
const isSubmitting = ref(false)
const activeTp = ref(null)

const cashForm = ref({
  sheba: '',
  returnType: '',
  amount: '',
  description: '',
})

const checkForm = ref({
  description: '',
})

const tabItems = [
  { label: 'عودت وجه نقدی', value: 'cash' },
  { label: 'عودت چک', value: 'check' },
]

const returnTypeOptions = ref([])
const refundTypeEnum = ref({})
const refundReferenceTypeEnum = ref({})

const checks = ref([])
const checksLoading = ref(false)

const shebaError = computed(() => {
  const digits = cashForm.value.sheba.replace(/\D/g, '')
  if (cashForm.value.sheba && digits.length !== 24) {
    return 'شماره شبا باید 24 رقم باشد'
  }
  return ''
})

const amountError = computed(() => {
  const numericAmount = Number(String(cashForm.value.amount).replace(/,/g, ''))
  if (cashForm.value.amount && numericAmount < 1000) {
    return 'مبلغ نباید کمتر از ۱٬۰۰۰ تومان باشد'
  }
  return ''
})

function onShebaChange(val) {
  cashForm.value.sheba = val.replace(/\D/g, '')
}

const isAmountDisabled = computed(() => {
  return (
    cashForm.value.returnType === 'TREATMENT_PLAN_PREPAY' ||
    cashForm.value.returnType === 'TREATMENT_PLAN_PREPAYMENT'
  )
})

async function onReturnTypeChange(val) {
  cashForm.value.amount = ''

  if (val === 'TREATMENT_PLAN_PREPAY' || val === 'TREATMENT_PLAN_PREPAYMENT') {
    if (!props.userId) return
    try {
      const res = await fetchActiveTpFn(props.userId)
      activeTp.value = res?.data || res

      if (val === 'TREATMENT_PLAN_PREPAY') {
        cashForm.value.amount =
          activeTp.value?.pre_pay ?? activeTp.value?.prepay ?? activeTp.value?.pre_pay_amount ?? ''
      } else if (val === 'TREATMENT_PLAN_PREPAYMENT') {
        cashForm.value.amount =
          activeTp.value?.pre_payment ??
          activeTp.value?.prepayment ??
          activeTp.value?.pre_payment_amount ??
          ''
      }
    } catch (error) {
      console.error('Error fetching active treatment plan:', error)
    }
  }
}

async function fetchEnums() {
  try {
    const res = await fetchEnumsFn({
      enums: 'RefundRequestTypeEnum,RefundReferenceTypeEnum,RefundRequestStatusEnum',
    })

    const data = res?.data || res

    refundTypeEnum.value = data?.RefundRequestTypeEnum || data?.refundRequestTypeEnum || {}
    refundReferenceTypeEnum.value =
      data?.RefundReferenceTypeEnum || data?.refundReferenceTypeEnum || {}

    const allRefTypes = Object.values(refundReferenceTypeEnum.value).map((item) => ({
      value: item.en_title || item.enTitle,
      label: item.fa_title || item.faTitle,
    }))

    const customOption = { value: 'CUSTOM', label: 'سفارشی' }

    returnTypeOptions.value = [
      ...allRefTypes.filter((item) => item.value !== 'USER_INSTALLMENT_CHEQUE'),
      customOption,
    ]
  } catch (error) {
    console.error('Error fetching enums:', error)
  }
}

async function fetchUserCheques() {
  if (!props.userId) return
  checksLoading.value = true
  selectedCheckId.value = null
  try {
    const res = await fetchUserChequesFn(props.userId)
    checks.value = res?.data?.items || res?.data || []
  } catch (error) {
    console.error('Error fetching user cheques:', error)
    checks.value = []
  } finally {
    checksLoading.value = false
  }
}

function formatDueDate(date) {
  if (!date) return '---'
  return convertToJalali(date, 'jYYYY/jMM/jDD') || '---'
}

function formatChequeAmount(amount) {
  return numberSeparator(amount || 0)
}

function getReferenceTypeId(returnType) {
  const entry = Object.values(refundReferenceTypeEnum.value).find(
    (item) => item.enTitle === returnType || item.en_title === returnType
  )
  return entry?.id || null
}

async function submitCashRefund() {
  if (!props.userId) {
    Notif.error('شناسه کاربر یافت نشد')
    return
  }
  if (shebaError.value) {
    Notif.error(shebaError.value)
    return
  }
  if (!cashForm.value.returnType) {
    Notif.error('نوع عودت را انتخاب کنید')
    return
  }

  const isPrepayType =
    cashForm.value.returnType === 'TREATMENT_PLAN_PREPAY' ||
    cashForm.value.returnType === 'TREATMENT_PLAN_PREPAYMENT'

  if (isPrepayType && !cashForm.value.amount) {
    Notif.error('طرح درمان فعال پیش پرداختی ندارد.')
    return
  }

  if (amountError.value || !cashForm.value.amount) {
    Notif.error(amountError.value || 'مبلغ الزامی است')
    return
  }

  const cashTypeId = refundTypeEnum.value.cash?.id
  if (!cashTypeId) {
    Notif.error('خطا در شناسایی نوع عودت')
    return
  }

  const { returnType } = cashForm.value
  const isTreatmentPlanType =
    returnType === 'TREATMENT_PLAN_PREPAY' || returnType === 'TREATMENT_PLAN_PREPAYMENT'

  const payload = {
    user_id: props.userId,
    sheba: cashForm.value.sheba,
    amount: Number(String(cashForm.value.amount).replace(/,/g, '')),
    type_id: cashTypeId,
    description: cashForm.value.description || undefined,
  }

  if (isTreatmentPlanType) {
    payload.reference_id = activeTp.value?.id || null
    payload.reference_type_id = getReferenceTypeId(returnType)
  } else if (returnType === 'CUSTOM') {
    payload.reference_id = null
    payload.reference_type_id = null
  } else {
    payload.reference_id = null
    payload.reference_type_id = null
  }

  isSubmitting.value = true
  try {
    const submitRefundFn = ENABLE_USER_DETAIL_MOCKS
      ? mockCreateRefundRequest
      : apiCreateRefundRequest
    await submitRefundFn(payload)
    Notif.success('درخواست عودت وجه نقد با موفقیت ثبت شد')
    isVisible.value = false
    emit('submit')
  } catch (error) {
    Notif.error(error?.response?.data?.message || 'خطا در ثبت درخواست عودت')
  } finally {
    isSubmitting.value = false
  }
}

async function submitCheckRefund() {
  if (!props.userId) {
    Notif.error('شناسه کاربر یافت نشد')
    return
  }
  if (!selectedCheckId.value) {
    Notif.error('چک مورد نظر را انتخاب کنید')
    return
  }

  const chequeTypeId = refundTypeEnum.value.cheque?.id
  if (!chequeTypeId) {
    Notif.error('خطا در شناسایی نوع عودت')
    return
  }

  const selectedCheque = checks.value.find((c) => c.id === selectedCheckId.value)
  const userInstallmentTypeId = getReferenceTypeId('USER_INSTALLMENT_CHEQUE')

  const payload = {
    user_id: props.userId,
    type_id: chequeTypeId,
    amount: selectedCheque?.amount || null,
    reference_id: selectedCheque?.id || null,
    reference_type_id: userInstallmentTypeId || null,
    description: checkForm.value.description || undefined,
  }

  isSubmitting.value = true
  try {
    const submitRefundFn = ENABLE_USER_DETAIL_MOCKS
      ? mockCreateRefundRequest
      : apiCreateRefundRequest
    await submitRefundFn({
      ...payload,
      // extra display data for the persisted mock request (ignored by real API)
      reference: ENABLE_USER_DETAIL_MOCKS
        ? {
            bank: selectedCheque?.bank?.title,
            sayyadi: selectedCheque?.sayadNumber || selectedCheque?.sayad_number,
            checkNumber: selectedCheque?.chequeNumber || selectedCheque?.cheque_number,
            dueDate: selectedCheque?.dueDate || selectedCheque?.due_date,
            amount: selectedCheque?.amount,
          }
        : undefined,
    })
    Notif.success('درخواست عودت چک با موفقیت ثبت شد')
    isVisible.value = false
    emit('submit')
  } catch (error) {
    Notif.error(error?.response?.data?.message || 'خطا در ثبت درخواست عودت')
  } finally {
    isSubmitting.value = false
  }
}

async function handleSubmit() {
  if (isSubmitting.value) return
  await (activeTab.value === 'cash' ? submitCashRefund() : submitCheckRefund())
}

watch(isVisible, (val) => {
  if (val) {
    activeTab.value = 'cash'
    selectedCheckId.value = null
    cashForm.value = { sheba: '', returnType: '', amount: '', description: '' }
    checkForm.value = { description: '' }
    activeTp.value = null
    fetchEnums()
  }
})

watch(activeTab, (tab) => {
  if (tab === 'check') {
    fetchUserCheques()
  }
})
</script>

<style scoped lang="scss">
.refund-cash {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;

  &__sheba-prefix {
    padding: 0 10px;
    font-size: 13px;
    font-weight: 600;
    color: $grey-7;
  }

  &__sheba-hint {
    margin-top: -8px;
  }
}

.refund-check {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;

  &__loading,
  &__empty {
    display: flex;
    justify-content: center;
    padding: 32px 0;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__card {
    border: 1.5px solid $grey-4;
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    background-color: rgba($grey-6, 0.1);
    transition:
      border-color 0.2s,
      background 0.2s;

    &:hover {
      border-color: $light-blue-6;
    }

    &--selected {
      border-color: $light-blue-6;
    }
  }

  &__card-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 0;
    background-color: $white;
    padding: 12px 16px;
    border-radius: $radius-sm;
  }

  &__card-row {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  &__card-detail {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
  }

  &__card-checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid $grey-4;
    border-radius: 5px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      border-color 0.2s,
      background 0.2s;
    background: #fff;

    svg {
      width: 12px;
      height: 12px;
      color: #fff;
    }
  }

  &__card--selected &__card-checkbox {
    border-color: $light-blue-6;
  }
}

.refund-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
