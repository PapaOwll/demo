<template>
  <div>
    <div v-if="isObligationsLoading" class="uol__loading">
      <QInnerLoading :showing="isObligationsLoading" class="q-mx-auto q-my-auto">
        <QSpinnerTail color="primary" size="100px" />
      </QInnerLoading>
    </div>

    <div v-else-if="obligationItems.length > 0" class="uol__content">
      <QInfiniteScroll
        class="uol__scroll"
        scroll-target=".uol__scroll"
        :offset="120"
        @load="handleObligationsLoadMore"
      >
        <UserObligationItem
          v-for="item in obligationItems"
          :key="item.id"
          :item="item"
          @delete="showDeleteDialog"
          @update-installment-status="onUpdateInstallmentStatus"
        />

        <template #loading>
          <QSpinnerDots
            v-if="isObligationsFetchingNextPage"
            class="text-center"
            color="primary"
            size="lg"
          />
        </template>
      </QInfiniteScroll>
    </div>

    <QCard v-else class="uol__no-data">
      <QImg :src="TransactionNoData" alt="TransactionNoData" width="188px" />
      <QCardSection class="uol__no-data-content">
        <p>هنوز تعهد پرداختی ثبت نشده!</p>
        <p>اولین تعهد پرداخت بعد از ایجاد اینجا قابل مشاهده‌ست.</p>
      </QCardSection>
    </QCard>

    <BaseModal
      v-model="deleteDialog.show"
      title="حذف تعهد پرداخت"
      :loading="deleteMutation.isPending.value"
      width="32rem"
      @close="deleteDialog.show = false"
    >
      <Typography variant="body" size="3" color="grey" class="text-center q-pb-sm">
        آیا از حذف این تعهد پرداخت مطمئن هستید؟
      </Typography>
      <template #footer>
        <Button variant="flat" color="grey" text="انصراف" @click="deleteDialog.show = false" />
        <Button variant="filled" color="red" text="تایید حذف" @click="confirmDelete" />
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import TransactionNoData from '@/assets/images/transactionNoData.svg'
import {
  useDeleteBetaInstallmentsMutation,
  useUpdateInstallmentStatusMutation,
} from '@/modules/User/query'
import { useUserObligations } from '@/modules/User/composables/use-user-obligations'
import { computed, reactive } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { Notif } from '@/data/services/notification-service'
import UserObligationItem from './UserObligationItem'
import BaseModal from '@/base/Modal'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import {
  mockDeleteBetaInstallments,
  mockUpdateInstallmentStatus,
} from '@/mocks/user-details/financial'

const queryClient = useQueryClient()
const deleteDialog = reactive({ show: false, item: null })

const props = defineProps({
  userInfo: {
    type: Object,
    required: false,
    default: () => ({}),
  },
})

const {
  state: obligationsState,
  isFetchingNextPage: isObligationsFetchingNextPage,
  fetchNextPage: fetchObligationsNextPage,
  hasNextPage: hasObligationsNextPage,
  isLoading: isObligationsLoading,
} = useUserObligations(props.userInfo?.id, [145, 144])

const obligationItems = computed(() => obligationsState.items)

const handleObligationsLoadMore = async (index, done) => {
  if (!hasObligationsNextPage?.value || isObligationsFetchingNextPage?.value) {
    done(false)
    return
  }
  await fetchObligationsNextPage()
  done()
}

const deleteMutation = useDeleteBetaInstallmentsMutation({
  ...(ENABLE_USER_DETAIL_MOCKS ? { mutationFn: mockDeleteBetaInstallments } : {}),
  onSuccess: () => {
    deleteDialog.show = false
    queryClient.invalidateQueries({ queryKey: ['user', 'payment-obligations'] })
    Notif.success('تعهد پرداخت با موفقیت حذف شد')
  },
})

const updateStatusMutation = useUpdateInstallmentStatusMutation(
  ENABLE_USER_DETAIL_MOCKS ? { mutationFn: mockUpdateInstallmentStatus } : {}
)

const confirmDelete = () => {
  if (!deleteDialog.item) return
  const installmentIds = deleteDialog.item.installments?.map((inst) => inst.id) || []
  deleteMutation.mutate(installmentIds)
}

const onUpdateInstallmentStatus = async (installmentId, newStatusId) => {
  try {
    await updateStatusMutation.mutateAsync({ id: installmentId, statusId: newStatusId })
    queryClient.invalidateQueries({ queryKey: ['user', 'payment-obligations'] })
    queryClient.invalidateQueries({ queryKey: ['user', 'accounting'] })
    Notif.success('وضعیت قسط با موفقیت تغییر کرد')
  } catch {
    // error handled by mutation's onError
  }
}

function showDeleteDialog(item) {
  deleteDialog.item = item
  deleteDialog.show = true
}
</script>

<style lang="scss" scoped>
.uol {
  &__loading {
    overflow: hidden;
    height: 500px;
    width: 100%;
  }

  &__content {
    height: 60vh;
    overflow: auto;
  }

  &__scroll {
    padding: 0 4px 120px 0;
    overflow-y: auto;
    height: 100%;

    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: $grey-4;
      border-radius: 10px;

      &:hover {
        background: $grey-5;
      }
    }
  }

  &__no-data {
    justify-content: center;
    flex-direction: column;
    align-items: center;
    box-shadow: none;
    height: 500px;
    display: flex;
    width: 100%;
  }

  &__no-data-content {
    margin-top: map-get($space-md, x);
    justify-content: center;
    flex-direction: column;
    align-items: center;
    display: flex;
    padding: 0;
    width: 100%;

    > p:first-of-type {
      font-weight: map-get($h6, weight);
      font-size: map-get($h6, size);
      color: $grey-8;
      margin: 0;
    }

    > p:last-of-type {
      font-weight: map-get($subtitle1, weight);
      font-size: map-get($subtitle1, size);
      margin-top: map-get($space-sm, x);
      color: $grey-6;
    }
  }
}
</style>
