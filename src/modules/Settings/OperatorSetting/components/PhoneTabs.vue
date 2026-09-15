<template>
  <QCard flat class="q-pa-md">
    <QCardSection class="row q-col-gutter-sm items-center justify-between q-pa-none">
      <div class="col-9 flex q-gutter-xs items-center">
        <QChip square color="white" text-color="black" class="text-h6">شماره داخلی کارمندان</QChip>
        <QBtn fab-mini flat unelevated :loading="loadingList" @click="updateTable">
          <IconRefresh class="text-grey" />
        </QBtn>
      </div>

      <div class="col-md-3 col-12 flex justify-end">
        <QBtn
          v-if="getPerms('setting', 'add', true, 'operatorSetting')"
          outline
          flat
          color="primary"
          @click="() => openInternalPhoneForm()"
        >
          <IconPlus />
          افزودن شماره
        </QBtn>
      </div>

      <div class="col-12">
        <FilterBuilder
          :items="phoneTabsFilters"
          :form-values="formValues"
          :has-active-filters="hasActiveFilters"
          :handle-input="handleInput"
          :apply-filters="applyFilters"
          :reset-filters="resetFilters"
          :total-count="totalInternalPhone"
          total-label="شماره داخلی"
          :is-total-count-loading="isTotalCountLoading"
          :load-total-count="onLoadTotalCount"
          @apply="onFilterApply"
          @reset="onFilterReset"
        />
      </div>
    </QCardSection>

    <QTable
      :rows="internalPhoneData"
      :columns="phoneTabsColumns"
      :loading="loadingList"
      row-key="id"
      :no-data-label="null"
      class="quasar-table"
      flat
      :rows-per-page-options="[0]"
    >
      <template #loading>
        <QInnerLoading size="40px" color="primary" />
        <div class="phone-tabs__no-data">
          <QSpinnerTail color="primary" size="lg" />
          <span>درحال بارگذاری اطلاعات...</span>
        </div>
      </template>

      <template #no-data>
        <div
          v-if="internalPhoneData?.length === 0 && !loadingList"
          class="flex column justify-center items-center q-mx-auto"
        >
          <img src="@/assets/images/noData.svg" alt="no-data" />
          <span class="text-h6 text-grey-7">اطلاعاتی یافت نشد</span>
        </div>
      </template>

      <template #body-cell-id="scope">
        <QTd :props="scope">
          <QChip outline color="grey-6" square>
            {{ scope.row.id }}
          </QChip>
        </QTd>
      </template>

      <template #body-cell-user="scope">
        <QTd :props="scope">
          <UserMenu :user="scope.row" @update-table="updateTable" />
        </QTd>
      </template>

      <template #body-cell-number="scope">
        <QTd :props="scope">
          <QChip color="primary" square text-color="white">
            {{ scope.row.number }}
          </QChip>
        </QTd>
      </template>

      <template #body-cell-actions="scope">
        <QTd :props="scope">
          <div class="phone-tabs__actions">
            <QBtn
              v-if="getPerms('setting', 'update', true, 'operatorSetting')"
              flat
              round
              color="primary"
              @click="openInternalPhoneForm(scope.row)"
            >
              <IconEdit size="20" />
              <QTooltip>ویرایش</QTooltip>
            </QBtn>
            <QBtn
              v-if="getPerms('setting', 'delete', true, 'operatorSetting')"
              flat
              round
              color="negative"
              @click="handleDelete(scope.row)"
            >
              <IconTrash size="20" />
              <QTooltip>حذف</QTooltip>
            </QBtn>
          </div>
        </QTd>
      </template>

      <template #bottom>
        <div class="full-width flex justify-center items-center">
          <QBtn
            v-if="hasNextPage"
            color="primary"
            outline
            unelevated
            label="مشاهده موارد بیشتر..."
            :loading="isFetchingNextPage"
            :disable="!hasNextPage"
            @click="loadNextPage"
          />
          <span v-else class="text-grey-6">مورد بیشتری وجود ندارد</span>
        </div>
      </template>
    </QTable>
  </QCard>

  <InternalPhoneForm
    :visible="internalPhoneFormVisible"
    :edit-value="internalPhoneRow"
    @close="closeInternalPhoneForm"
    @update-table="updateTable"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { IconPlus, IconRefresh, IconEdit, IconTrash } from '@tabler/icons-vue'
import { useGetTotalInternalPhoneCountMutation, useInternalPhoneInfinityQuery } from '../query'
import InternalPhoneForm from '@/modules/Settings/OperatorSetting/components/InternalPhoneForm'
import { deleteInternalPhone } from '@/modules/Settings/OperatorSetting/api/internal-phone'
import { handleError } from '@/utils/error-handler'
import { getPerms } from '@/utils/get-perms'
import UserMenu from '@/components/UserMenu'
import FilterBuilder from '@/components/FilterBuilder/FilterBuilder'
import { useHandleFilters } from '@/composables/use-handle-filters'
import { phoneTabsColumns, phoneTabsFilters } from '../constants'
import { Notif, confirmDialog } from '@/data/services/notification-service'

const queryClient = useQueryClient()

const internalPhoneFormVisible = ref(false)
const totalInternalPhone = ref(null)
const internalPhoneRow = ref(null)

const { formValues, hasActiveFilters, handleInput, applyFilters, resetFilters, apiFilters } =
  useHandleFilters()

const {
  data: internalPhonesData,
  isLoading,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
} = useInternalPhoneInfinityQuery(apiFilters)

const internalPhoneData = computed(() => {
  return (
    internalPhonesData.value?.pages?.flatMap((pageData) => {
      return pageData?.items.map((item) => ({
        ...item,
        firstName: item?.user?.firstName,
        name: item?.user?.name,
        mobile: item?.user?.mobile,
      }))
    }) || []
  )
})

const { mutate: totalCount, isPending: isTotalCountLoading } =
  useGetTotalInternalPhoneCountMutation()

const loadingList = computed(() => isLoading.value || isFetchingNextPage.value)

const onLoadTotalCount = () => {
  totalInternalPhone.value = null
  isTotalCountLoading.value = true
  totalCount(apiFilters, {
    onSuccess: (data) => {
      totalInternalPhone.value = data?.data?.count
      isTotalCountLoading.value = false
    },
    onError: (e) => {
      handleError(e.errors.message)
      isTotalCountLoading.value = false
    },
  })
}

const loadNextPage = () => {
  if (!hasNextPage.value) return
  fetchNextPage()
}

const updateTable = () => {
  queryClient.invalidateQueries({ queryKey: ['internal-phone', 'all-internal-phones'] })
  Notif.success('لیست بروزرسانی شد')
}

const openInternalPhoneForm = (data) => {
  internalPhoneRow.value = data
  internalPhoneFormVisible.value = true
}

const closeInternalPhoneForm = () => {
  internalPhoneFormVisible.value = false
}

const onFilterApply = (filteredValues) => {
  totalInternalPhone.value = null
  applyFilters(filteredValues)
  queryClient.invalidateQueries({ queryKey: ['internal-phone', 'all-internal-phones'] })
}

const onFilterReset = () => {
  totalInternalPhone.value = null
  resetFilters()
  queryClient.invalidateQueries({ queryKey: ['internal-phone', 'all-internal-phones'] })
}

const handleDelete = (row) => {
  confirmDialog(
    'حذف داخلی مشاور',
    'این مورد حذف شود؟',
    () => {
      deleteInternalPhone(row.id)
        .then((res) => {
          Notif.success(res.data.message, { position: 'top' })
        })
        .catch((error) => {
          Notif.error(error.errors.message, { position: 'top' })
        })
        .finally(() => {
          updateTable()
        })
    },
    {
      cancel: {
        label: 'انصراف',
        color: 'grey-6',
        flat: true,
      },
      ok: {
        label: 'حذف',
        color: 'negative',
      },
      persistent: true,
    }
  )
}
</script>

<style scoped lang="scss">
.phone-tabs {
  &__no-data {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    width: 100%;
    min-height: 200px;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
  }
}

.quasar-table {
  :deep(.q-table__bottom) {
    padding: 16px;
  }
}
</style>
