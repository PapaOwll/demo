<template>
  <QCard class="user-financial-transactions">
    <QCardSection class="user-financial-transactions__header">
      <div>
        <QAvatar
          rounded
          :class="['user-financial-transactions__header-avatar', statusModifier.class]"
        >
          <component
            :is="statusModifier.icon"
            v-if="data.method.slug !== 'cheque'"
            height="24"
            width="24"
          />
          <QImg
            v-else-if="data.isSettled === true"
            :src="TransactionIconOne"
            alt="transactionIconOne"
            width="24px"
          />
          <QImg
            v-else-if="data.isSettled === false"
            :src="TransactionIconTwo"
            alt="transactionIconTwo"
            width="24px"
          />
          <QImg v-else :src="TransactionIconThree" alt="transactionIconThree" width="24px" />
        </QAvatar>
        <QCardSection class="user-financial-transactions__header-content">
          <p>{{ data.amount.toLocaleString() }} تومان</p>
          <div class="user-financial-transactions__header-content-section-one">
            <p>{{ data?.createdDt?.split(' ')[1].slice(0, 5) }}</p>
            <p>-</p>
            <template v-if="data.method?.title">
              <p>{{ data.method?.title }}</p>
            </template>
            <template v-if="data?.bank?.title">
              <p>-</p>
              <p>{{ data?.bank?.title }}</p>
            </template>
          </div>
        </QCardSection>
      </div>
      <div class="user-financial-transactions__header-content-section-two">
        <QChip
          :class="[
            statusModifier.class,
            'user-financial-transactions__header-content-section-two-chipStatus',
          ]"
        >
          {{ statusModifier.text }}
        </QChip>
        <!-- <IconEye
          class="text-grey-7 cursor-pointer"
          width="24"
          height="24"
          stroke="2"
          @click="handleShowDialog(data)"
        /> -->
        <IconPencil
          class="text-grey-7 cursor-pointer"
          width="24"
          height="24"
          stroke="2"
          @click="handleShowDialog(data)"
        />
      </div>
    </QCardSection>

    <QCardSection
      v-if="data?.description || data.method?.slug === 'cheque'"
      class="user-financial-transactions__bottom"
    >
      <div
        v-if="data.method?.slug === 'cheque'"
        class="user-financial-transactions__bottom-section-one"
      >
        <div class="col-6">
          <p>شماره چک</p>
          <p>{{ data?.chequeNum || 'نامشخص' }}</p>
        </div>
      </div>

      <div class="user-financial-transactions__bottom-section-two">
        <template v-if="data?.description || !data.method?.slug === 'beta'">
          <p>توضیحات</p>
          <div>
            <p class="text-right">
              {{ data?.description }}
            </p>
          </div>
        </template>
        <p v-else class="text-center">توضیحی برای این تراکنش ننوشتی!</p>
      </div>
    </QCardSection>
    <!-- <QCardSection v-if="data.method?.slug === 'beta'">
      <div class="user-financial-transactions__bottom-section-three">
        <div>
          <p>تاریخ سررسید</p>
          <p>test</p>
        </div>
        <div>
          <p>حساب داری بتا</p>
          <p>{{ data.user.name }}</p>
        </div>
      </div>
    </QCardSection> -->
    <FileDialog
      :dialog="state.dialog"
      :loading="isPending"
      @close-dialog="state.dialog.status = false"
      @accept-change="handelUpdateTransaction"
    />
  </QCard>
</template>

<script setup>
import TransactionIconThree from '@/assets/images/transactionIconThree.svg'
import TransactionIconOne from '@/assets/images/transactionIconOne.svg'
import TransactionIconTwo from '@/assets/images/transactionIconTwo.svg'
import FileDialog from './UserFinancialTransactionsFileDialog'
import { useUpdateTransaction } from '@/modules/User/query'
import { IconPencil } from '@tabler/icons-vue'
import { computed, reactive } from 'vue'
import { Notif } from '@/data/services/notification-service'
import { createAsyncIconComponent } from '@/utils/icon-loader'

const { mutate, isPending } = useUpdateTransaction()
const emit = defineEmits(['updateTransaction'])

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  userId: {
    type: Number,
    required: false,
    default: null,
  },
})

const state = reactive({
  dialog: {
    status: false,
    data: false,
  },
})

const statusModifier = computed(() => {
  const { method = {}, balanceType, isSettled } = props.data
  const { slug } = method

  let resolvedType

  if (slug === 'cheque') {
    if (isSettled === true) {
      resolvedType = 'credit'
    } else if (isSettled === false) {
      resolvedType = 'debit-cheque'
    } else {
      resolvedType = 'null'
    }
  }
  resolvedType = slug === 'beta' ? 'beta' : balanceType
  const styleMap = {
    credit: 'credit',
    debit: 'debit',
    'debit-cheque': 'debit-cheque',
    null: 'null',
    beta: 'beta',
  }

  const iconMap = {
    'promissory-note': 'IconReportMoney',
    gateway: 'IconDeviceMobileDollar',
    'card-to-card': 'IconCreditCard',
    cheque: 'IconCashBanknotePlus',
    cash: 'IconCashBanknotePlus',
    deposit: 'IconDatabaseDollar',
    pose: 'IconReceipt2',
    beta: 'IconXboxB',
  }

  const textMap = {
    credit: {
      default: 'واریز‌‌‌‌‌‌ شد',
      cheque: 'پاس شد',
      'promissory-note': 'تحویل داده شد',
      deposit: 'تراکنش موفق',
    },
    debit: {
      default: 'عودت وجه',
      'promissory-note': 'برگردانده شد',
    },
    'debit-cheque': {
      cheque: 'نامشخص',
    },
    beta: {
      default: 'بدون وضعیت',
    },
    null: {
      cheque: 'سررسیدنشده',
    },
  }

  return {
    class: `status--${styleMap[resolvedType]}`,
    icon: createAsyncIconComponent(iconMap[slug] || 'IconAlertCircle'),
    text: textMap[resolvedType]?.[slug] ?? textMap[resolvedType]?.default ?? 'نامشخص',
  }
})

const handleShowDialog = (data) => {
  state.dialog.status = true
  state.dialog.data = data
}

const handelUpdateTransaction = (description) => {
  const { id, isSettled } = props.data

  mutate(
    {
      id,
      data: {
        isSettled,
        description,
      },
    },
    {
      onSuccess: () => {
        const updated = {
          ...props.data,
          description,
        }
        emit('updateTransaction', updated)
        state.dialog.status = false
        Notif.success('با موفقیت انجام شد')
      },
      onError: () => {
        Notif.error('تغییرات اعمال نشد')
      },
    }
  )
}
</script>

<style lang="scss" scoped>
.user-financial-transactions {
  margin-bottom: map-get($space-sm, x);
  margin-right: map-get($space-sm, x);
  padding: map-get($space-md, x);
  gap: map-get($space-md, x);
  background-color: $grey-1;
  flex-direction: column;
  align-items: center;
  box-shadow: none;
  width: 100%;
}

.user-financial-transactions__header {
  justify-content: space-between;
  align-items: center;
  flex-wrap: noWrap;
  display: flex;
  padding: 0px;
  margin: 0;
  width: 100%;
}

.user-financial-transactions__header > div {
  display: flex;
}

.user-financial-transactions__header-avatar {
  margin-left: map-get($space-sm, x);
}

.user-financial-transactions__header-content {
  flex-direction: column;
  display: flex;
  padding: 0px;
}

.user-financial-transactions__header-content > p {
  font-weight: map-get($subtitle1, weight);
  font-size: map-get($subtitle1, size);
  margin: 0px;
}

.user-financial-transactions__header-content-section-one {
  gap: map-get($space-xs, x);
  align-items: center;
  margin-bottom: 0px;
  color: $grey-6;
  display: flex;
}

.user-financial-transactions__header-content-section-one > p {
  margin: 0px;
}

.user-financial-transactions__header-content-section-two {
  gap: map-get($space-sm, x);
  align-items: center;
  display: flex;
}

.user-financial-transactions__header-content-section-two-chipStatus {
  border-radius: $generic-border-radius;
  text-align: center;
}

.user-financial-transactions__bottom {
  margin-top: map-get($space-md, x);
  row-gap: map-get($space-sm, x);
  gap: map-get($space-sm, x);
  flex-wrap: noWrap;
  display: flex;
  padding: 0px;
  width: 100%;
}

.user-financial-transactions__bottom-text {
  height: 80px;
}

.user-financial-transactions__bottom-section-one {
  border-radius: $generic-border-radius;
  justify-content: space-between;
  padding: map-get($space-md, x);
  background-color: $white;
  display: flex;
  width: 100%;
}

.user-financial-transactions__bottom-section-one p:first-of-type {
  font-weight: map-get($body2, weight);
  font-size: map-get($body2, size);
  color: $grey-6;
  margin: 0;
}

.user-financial-transactions__bottom-section-one p:last-of-type {
  font-weight: map-get($body1, weight);
  font-size: map-get($body1, size);
  margin: 0;
  margin-top: map-get($space-xs, x);
}

.user-financial-transactions__bottom-section-two {
  border-radius: $generic-border-radius;
  padding: map-get($space-md, x);
  background-color: $white;
  justify-content: center;
  flex-direction: column;
  display: flex;
  width: 100%;
}

.user-financial-transactions__bottom-section-two :has(> p:only-child) {
  font-weight: map-get($body2, weight);
  font-size: map-get($body2, size);
  text-align: center;
  color: $grey-5;
  margin: 0;
}

.user-financial-transactions__bottom-section-two > p:first-of-type {
  font-weight: map-get($body2, weight);
  font-size: map-get($body2, size);
  color: $grey;
}

.user-financial-transactions__bottom-section-two > div p {
  font-weight: map-get($body2, weight);
  font-size: map-get($body2, size);
  margin-bottom: 0;
  color: $grey-9;
}

.user-financial-transactions__bottom-section-two > p:last-of-type {
  font-weight: map-get($body2, weight);
  font-size: map-get($body2, size);
  color: $grey-5;
  margin: 0;
}

.user-financial-transactions__bottom-section-two div {
  margin-top: map-get($space-xs, x);
  align-items: center;
  margin-bottom: 0px;
  display: flex;
}

.user-financial-transactions__bottom-section-three {
  justify-content: start;
  gap: $spacing-lg;
  border-radius: $generic-border-radius;
  padding: map-get($space-md, x);
  background-color: $white;
  flex-direction: row;
  display: flex;
  width: 100%;
}

.user-financial-transactions__bottom-section-three p:first-of-type {
  color: $grey-6;
  width: 190px;
  font-size: 14px;
  font-weight: 400;
}
.user-financial-transactions__bottom-section-three p:last-of-type {
  font-weight: map-get($body2, weight);
  font-size: 20px;
  color: $grey-9;
}

.status--credit {
  background-color: $green-1;
  color: $green-6;
  border: 1px solid #c8e6c9;
}
.status--debit {
  background-color: $orange-1;
  color: $orange-6;
  border: 1px solid #ffe0b2;
}
.status--debit-cheque {
  background-color: $grey-1;
  color: $grey-6;
  border: 1px solid $grey-6;
}
.status--null {
  background-color: white;
  color: $grey-6;
  border: 1px solid #f5f5f5;
}
.status--beta {
  background-color: white;
  color: $grey-6;
}
</style>
