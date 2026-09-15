<template>
  <div class="user-beta-installments">
    <div
      :class="[
        'user-beta-installments__notice',
        isUserInfoIncomplete
          ? 'user-beta-installments__notice-warning'
          : 'user-beta-installments__notice-info',
      ]"
    >
      <IconAlertSquareRounded />
      <Typography
        variant="body"
        size="4"
        :color="isUserInfoIncomplete ? 'amber' : 'blue'"
        weight="medium"
      >
        {{
          isUserInfoIncomplete
            ? 'برای استفاده از بتا، اطلاعات کاربر (کد ملی و تاریخ تولد) را تکمیل کنید.'
            : 'قبل از ثبت بتا، از صحت اطلاعات کاربر مطمئن شوید'
        }}
      </Typography>
    </div>
    <div class="user-beta-installments__user-card">
      <div v-if="!showUserSearch" class="user-beta-installments__user-card-main">
        <div class="user-beta-installments__user-display">
          <QAvatar color="indigo-1" text-color="indigo-3" icon="person" size="52px" />

          <div class="user-beta-installments__user-info">
            <Typography variant="body" size="3" weight="semibold">
              {{
                currentUser?.firstName && currentUser?.name
                  ? `${currentUser?.firstName} ${currentUser?.name}`
                  : currentUser?.name || 'بدون نام'
              }}
            </Typography>

            <Typography variant="caption" color="grey">
              {{ userMobile }}
            </Typography>
          </div>
        </div>
        <QSeparator vertical inset />

        <div class="user-beta-installments__user-meta">
          <div class="user-beta-installments__user-meta-item">
            <Typography variant="caption" color="grey">
              {{ currentUser?.isForeignNational ? 'شناسه:' : 'کدملی:' }}
            </Typography>
            <Typography variant="caption" weight="medium">
              {{ userNationalCode }}
            </Typography>
          </div>
          <div class="user-beta-installments__user-meta-item">
            <Typography variant="caption" color="grey">تاریخ تولد</Typography>
            <Typography variant="caption" weight="medium">
              {{ userBirthday }}
            </Typography>
          </div>
        </div>

        <div class="user-beta-installments__spacer" />

        <div class="user-beta-installments__user-actions">
          <Button
            variant="flat"
            color="light-blue"
            text="تغییر کاربر"
            :left-icon="IconRefresh"
            class="user-beta-installments__change-user-btn"
            @click="openUserSearch"
          />
        </div>
      </div>

      <div v-else class="user-beta-installments__search-mode">
        <SelectField
          v-model="selectedUserIdTemp"
          :options="userOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          use-input
          input-debounce="300"
          :loading="userLoading"
          label="جستجوی کاربر"
          outlined
          dense
          clearable
          @filter="filterUsers"
        >
          <template #no-option>
            <QItem>
              <QItemSection class="text-grey">هیچ کاربری یافت نشد</QItemSection>
            </QItem>
          </template>
        </SelectField>

        <div class="user-beta-installments__search-actions">
          <Button
            :is-icon-only="true"
            variant="flat"
            color="light-blue"
            :left-icon="IconX"
            @click="cancelUserSearch"
          />
          <Button
            :is-icon-only="true"
            color="green"
            :left-icon="IconCheck"
            :disabled="!selectedUserIdTemp"
            @click="confirmUserSelection"
          />
        </div>
      </div>
    </div>

    <div class="user-beta-installments__fields">
      <CurrencyField v-model="totalAmount" label="مبلغ کل" :error-message="errors.totalAmount" />

      <EnumSelect
        v-model="contractType"
        enum-key="BetaContractTypeEnum"
        label="قرارداد"
        :error-message="errors.contractType"
      />

      <TextField
        v-model="installmentCount"
        type="number"
        label="تعداد اقساط"
        variant="outline"
        :error="!!errors.installmentCount"
        :error-message="errors.installmentCount"
      />

      <PersianDate
        v-model="firstDueDate"
        label="تاریخ شروع بازپرداخت"
        :error="!!errors.firstDueDate"
        :dense="false"
        :error-message="errors.firstDueDate"
      />
    </div>

    <div class="user-beta-installments__summary">
      <div class="user-beta-installments__summary-item">
        <Typography variant="body" size="4" color="grey">مبلغ هر قسط</Typography>
        <Typography v-if="!isSummaryLoading" variant="body" size="2" weight="semibold">
          {{ generatePriceFormat(Math.floor(displayedAmountPerInstallment)) }}
        </Typography>
        <QSkeleton v-else type="text" width="100px" class="q-mb-sm" />
      </div>

      <div class="user-beta-installments__summary-item">
        <Typography variant="body" size="4" color="grey">تاریخ بازپرداخت ماهانه</Typography>
        <template v-if="!isSummaryLoading">
          <Typography variant="body" size="3" weight="medium">
            از {{ displayedRepaymentDates.start }} تا {{ displayedRepaymentDates.end }}
          </Typography>
        </template>
        <QSkeleton v-else type="text" width="150px" />
      </div>
    </div>

    <div class="user-beta-installments__actions">
      <Button
        color="light-blue"
        text="ثبت تراکنش"
        :is-loading="isSubmitting"
        class="user-beta-installments__submit-btn"
        @click="handleSubmit"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Notif } from '@/data/services/notification-service'
import { useQueryClient } from '@tanstack/vue-query'
import { IconRefresh, IconX, IconCheck, IconAlertSquareRounded } from '@tabler/icons-vue'
import { convertToEnNumber } from '@/utils/convert-check-digits'
import { addToDate, convertToJalali, formatDate } from '@/utils/date-utils'
import { useCreateBetaInstallmentsMutation, useGetUserByIdQuery } from '@/modules/User/query'
import { apiGetUsers } from '@/modules/User/api'
import { handleError } from '@/utils/error-handler'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import CurrencyField from '@/components/Form/CurrencyField'
import PersianDate from '@/components/Form/PersianDate'
import SelectField from '@/base/SelectField'
import EnumSelect from '@/components/Form/EnumSelect'
import TextField from '@/base/TextField'
import { generatePriceFormat } from '@/utils/formatter'

const props = defineProps({
  propData: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['submit'])

const queryClient = useQueryClient()
const userId = computed(() => props.propData)

const betaUserId = ref(userId.value)
const totalAmount = ref(null)
const contractType = ref(null)
const firstDueDate = ref('')
const installmentCount = ref(null)
const showUserSearch = ref(false)
const userOptions = ref([])
const userLoading = ref(false)
const selectedUserIdTemp = ref(null)
const errors = ref({})

// Summary loading state
const isSummaryLoading = ref(false)
const displayedAmountPerInstallment = ref(0)
const displayedRepaymentDates = ref({ start: '---', end: '---' })
let summaryTimeout = null

const { data: currentUserOriginal } = useGetUserByIdQuery(userId, true)
const { data: currentUserBeta } = useGetUserByIdQuery(betaUserId, !!betaUserId.value)

const currentUser = computed(() => {
  return betaUserId.value && betaUserId.value !== userId.value
    ? currentUserBeta.value
    : currentUserOriginal.value
})

const { mutateAsync: createBetaInstallments, isPending: isSubmitting } =
  useCreateBetaInstallmentsMutation()

const formatJalaliDate = (date) => {
  return convertToJalali(date, 'jYYYY/jMM/jDD') || '---'
}

const userMobile = computed(() => {
  const mobile = currentUser.value?.mobile
  if (!mobile) return '---'
  return String(mobile).startsWith('0') ? String(mobile) : `0${mobile}`
})

const userNationalCode = computed(() => {
  return currentUser.value?.nationalCode || '---'
})

const userBirthday = computed(() => {
  const birthday = currentUser.value?.birthday || currentUser.value?.birthDate
  if (!birthday) return '---'
  return formatJalaliDate(birthday)
})

const isUserInfoIncomplete = computed(() => {
  return (
    !currentUser.value?.nationalCode ||
    (!currentUser.value?.birthday && !currentUser.value?.birthDate)
  )
})

const installmentCountNumber = computed(() => Number(installmentCount.value) || 0)

const effectiveInstallmentCount = computed(() => {
  return installmentCountNumber.value >= 2 ? installmentCountNumber.value : 1
})

const amountPerInstallment = computed(() => {
  if (!totalAmount.value) return 0
  return totalAmount.value / effectiveInstallmentCount.value
})

const repaymentDateRange = computed(() => {
  if (!firstDueDate.value) {
    return {
      start: '---',
      end: '---',
    }
  }

  const startDate = new Date(firstDueDate.value)
  const endDate = addToDate(startDate, effectiveInstallmentCount.value - 1, 'months')

  return {
    start: formatJalaliDate(startDate),
    end: formatJalaliDate(endDate),
  }
})

// Watch for changes and update summary with 1-second delay
watch(
  [amountPerInstallment, repaymentDateRange],
  ([newAmount, newDates]) => {
    isSummaryLoading.value = true

    if (summaryTimeout) {
      clearTimeout(summaryTimeout)
    }

    summaryTimeout = setTimeout(() => {
      displayedAmountPerInstallment.value = newAmount
      displayedRepaymentDates.value = newDates
      isSummaryLoading.value = false
    }, 1000)
  },
  { immediate: true }
)

const filterUsers = async (val, update, abort) => {
  const q = convertToEnNumber(val?.trim() || '')
  if (q.length < 2) {
    update(() => {
      userOptions.value = []
    })
    return
  }

  const filter = {}
  let key = 'filter[name]'
  let searchVal = q
  if (/\d/.test(q)) {
    key = 'filter[mobile]'
    searchVal = q.replace(/^(0|98|\+98)/, '')
  }
  filter[key] = searchVal

  userLoading.value = true
  try {
    const response = await apiGetUsers(filter)
    const items = response?.data?.items || []
    update(() => {
      userOptions.value = items.map((item) => ({
        label: `${item?.name || 'بدون نام'} / ${item.mobile}`,
        value: item.id,
        rawData: item,
      }))
      userLoading.value = false
    })
  } catch {
    abort()
    userLoading.value = false
  }
}

const openUserSearch = () => {
  selectedUserIdTemp.value = null
  showUserSearch.value = true
}

const confirmUserSelection = () => {
  if (!selectedUserIdTemp.value) return

  betaUserId.value = selectedUserIdTemp.value
  showUserSearch.value = false
  errors.value.betaUserId = null
}

const cancelUserSearch = () => {
  selectedUserIdTemp.value = null
  showUserSearch.value = false
}

const calculateInstallments = () => {
  const count = effectiveInstallmentCount.value
  const total = Number(totalAmount.value) || 0
  const amount = Math.floor(total / count)
  const remaining = total - amount * (count - 1)

  const installments = []
  let currentDate = new Date(firstDueDate.value)

  for (let i = 0; i < count; i += 1) {
    installments.push({
      amount: i === count - 1 ? remaining : amount,
      due_date: formatDate(currentDate, 'YYYY-MM-DD'),
    })
    currentDate = addToDate(currentDate, 1, 'months')
  }

  return installments
}

const handleSubmit = async () => {
  errors.value = {}

  if (!totalAmount.value) {
    errors.value.totalAmount = 'مبلغ کل الزامی است'
    Notif.warning('لطفا مبلغ کل را وارد کنید')
    return
  }

  if (!firstDueDate.value) {
    errors.value.firstDueDate = 'تاریخ سررسید الزامی است'
    Notif.warning('لطفا تاریخ سررسید را انتخاب کنید')
    return
  }

  if (!betaUserId.value) {
    errors.value.betaUserId = 'انتخاب کاربر الزامی است'
    Notif.warning('لطفا کاربر را انتخاب کنید')
    return
  }

  if (
    installmentCount.value &&
    (installmentCountNumber.value < 2 || installmentCountNumber.value > 100)
  ) {
    errors.value.installmentCount = 'تعداد اقساط باید بین ۲ تا ۱۰۰ باشد'
    Notif.warning('تعداد اقساط باید بین ۲ تا ۱۰۰ باشد')
    return
  }

  try {
    const installments = calculateInstallments()

    await createBetaInstallments({
      userId: userId.value,
      betaUserId: betaUserId.value,
      installments,
      betaContractTypeId: contractType.value,
    })

    await queryClient.invalidateQueries({
      queryKey: ['user', 'transactions'],
    })

    Notif.success('اقساط بتا با موفقیت ثبت شد')

    emit('submit')
  } catch (error) {
    handleError(error)
  }
}
</script>

<style scoped lang="scss">
.user-beta-installments {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__notice {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid;
    border-radius: 10px;
    padding: 10px 12px;
  }

  &__notice-info {
    background-color: #eaf4ff;
    border-color: #b9d8f8;
    color: $blue-8;
  }

  &__notice-warning {
    background-color: $amber-1;
    color: $amber-8;
    border-color: $amber-2;
  }

  &__user-card {
    border: 1px solid #e2e6ee;
    border-radius: 12px;
    padding: 12px 14px;
  }

  &__search-mode {
    display: flex;
    flex-direction: row;
    align-items: end;
    gap: 8px;

    .q-select {
      flex: 1;
      min-width: 0;
    }
  }

  &__search-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  &__user-card-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  &__spacer {
    flex: 1;
  }

  &__user-actions {
    flex-shrink: 0;
  }

  &__change-user-btn {
    :deep(.button) {
      padding: 0;
      min-height: 30px;
    }
  }

  &__user-display {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__user-info {
    text-align: right;
    min-width: 0;
  }

  &__user-meta {
    display: flex;
    align-items: center;
    gap: 40px;
    margin-top: 2px;
    margin-bottom: 2px;

    :deep(.q-separator--vertical) {
      height: 28px;
      background-color: #d7dce6;
    }
  }

  &__user-meta-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__fields {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  &__input {
    :deep(.q-field__control) {
      border-radius: 10px;
      min-height: 56px;
    }
  }

  &__summary {
    background-color: #f2f3f5;
    border-radius: 12px;
    padding: 16px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  &__summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 6px;
  }

  &__submit-btn {
    min-width: 120px;
  }
}

@media (max-width: 768px) {
  .user-beta-installments {
    &__fields {
      grid-template-columns: 1fr;
    }

    &__summary {
      grid-template-columns: 1fr;
    }
  }
}
</style>
