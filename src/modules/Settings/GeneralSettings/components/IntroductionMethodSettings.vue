<template>
  <div class="intro-settings">
    <QInnerLoading :showing="isLoading">
      <QSpinnerGears size="50" color="primary" />
    </QInnerLoading>

    <div class="intro-settings__title-row">
      <Typography variant="heading" size="h6">شیوه آشنایی</Typography>
      <Button
        variant="filled"
        color="light-blue"
        :right-icon="IconPlus"
        text="شیوه آشنایی جدید"
        @click="openCreateModal"
      />
    </div>

    <div v-if="methodList.length > 0 && !isError" class="intro-settings__cards">
      <IntroductionMethodCard
        v-for="method in methodList"
        :key="method.id"
        :method="method"
        @edit="openEditModal"
        @delete="handleRemoveMethod"
        @toggle="handleToggleStatus"
      />
    </div>

    <div v-if="isFetchingNextPage" class="intro-settings__loading">
      <QSpinnerGears size="40" color="primary" />
    </div>

    <div ref="sentinelRef" class="intro-settings__sentinel" />

    <div v-if="isError && !isLoading" class="intro-settings__no-data">
      <Typography variant="heading" size="h6">خطا در دریافت اطلاعات</Typography>
      <Typography variant="body" size="3" color="grey">
        دریافت لیست شیوه‌های آشنایی ناموفق بود.
      </Typography>
      <Button variant="outline" color="red" text="تلاش مجدد" @click="refetch" />
    </div>

    <div v-else-if="methodList.length === 0 && !isLoading" class="intro-settings__no-data">
      <div class="intro-settings__no-data-icon">
        <IconUsers :size="'28'" stroke="1.6" class="text-grey-6" />
      </div>
      <Typography variant="body" size="3" color="grey">
        هنوز شیوه‌ی آشنایی‌ای اضافه نکردی
      </Typography>
      <Button
        variant="filled"
        color="light-blue"
        :right-icon="IconPlus"
        text="شیوه آشنایی جدید"
        @click="openCreateModal"
      />
    </div>
  </div>

  <IntroductionMethodFormModal :visible="isModalOpen" :data="selectedMethod" @close="closeModal" />

  <Modal
    width="32rem"
    :model-value="isDeleteModalOpen"
    title="حذف شیوه آشنایی"
    persistent
    @close="closeDeleteModal"
  >
    <div class="intro-settings__delete">
      <Typography variant="body" size="3" color="grey">
        آیا از حذف این مورد اطمینان دارید؟
      </Typography>
      <div class="intro-settings__delete-actions">
        <Button
          variant="outline"
          color="red"
          text="انصراف"
          :is-loading="isDeletePending"
          @click="closeDeleteModal"
        />
        <Button
          variant="filled"
          color="red"
          text="حذف"
          :is-loading="isDeletePending"
          @click="confirmDelete"
        />
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { computed, ref, toRefs, watch, onUnmounted, nextTick } from 'vue'
import { QInnerLoading, QSpinnerGears } from 'quasar'
import { IconPlus, IconUsers } from '@tabler/icons-vue'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import Modal from '@/base/Modal'
import useDisclosure from '@/composables/use-disclosure'
import IntroductionMethodFormModal from './IntroductionMethodFormModal'
import IntroductionMethodCard from './IntroductionMethodCard'
import {
  useGetIntroductionMethodsInfinityQuery,
  useDeleteIntroductionMethodMutation,
  useUpdateIntroductionMethodMutation,
} from '@/modules/Settings/query/index'
import { useQueryClient } from '@tanstack/vue-query'
import { Notif } from '@/data/services/notification-service'

const props = defineProps({
  submit: { type: Boolean, default: false },
  refresh: { type: Boolean, default: false },
  branchId: { type: [String, Number], default: undefined },
})
const { refresh } = toRefs(props)
const emits = defineEmits(['afterSubmit', 'afterRefresh'])
const queryClient = useQueryClient()

const {
  data: methods,
  isLoading,
  isError,
  refetch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useGetIntroductionMethodsInfinityQuery()
const { mutate: deleteMethod, isPending: isDeletePending } = useDeleteIntroductionMethodMutation()
const { mutate: toggleStatus } = useUpdateIntroductionMethodMutation()

const [isModalOpen, { open: openModal, close: closeDisclosure }] = useDisclosure()
const selectedMethod = ref(null)

const [isDeleteModalOpen, { open: openDeleteModal, close: closeDeleteDisclosure }] = useDisclosure()
const deleteTargetId = ref(null)

const methodList = computed(() => {
  const items = methods.value?.pages?.flatMap((page) => page?.items || []) || []
  return [...items].sort((a, b) => (a?.id ?? 0) - (b?.id ?? 0))
})

const sentinelRef = ref(null)
let observer = null

const setupObserver = () => {
  if (observer) observer.disconnect()
  if (!sentinelRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage?.value && !isFetchingNextPage?.value) {
        fetchNextPage()
      }
    },
    { rootMargin: '0px 0px 200px 0px' }
  )
  observer.observe(sentinelRef.value)
}

watch(methodList, () => nextTick(setupObserver))

onUnmounted(() => {
  if (observer) observer.disconnect()
})

const openCreateModal = () => {
  selectedMethod.value = null
  openModal()
}

const openEditModal = (method) => {
  selectedMethod.value = { ...method }
  openModal()
}

const closeModal = () => {
  closeDisclosure()
  selectedMethod.value = null
}

const closeDeleteModal = () => {
  closeDeleteDisclosure()
  deleteTargetId.value = null
}

const handleRemoveMethod = (id) => {
  deleteTargetId.value = id
  openDeleteModal()
}

const handleDeleteSuccess = async (response) => {
  Notif.success(response?.message || 'عملیات موفقیت آمیز بود')
  await queryClient.invalidateQueries({ queryKey: ['introduction-methods'] })
  closeDeleteModal()
}

const confirmDelete = () => {
  if (!deleteTargetId.value) return
  deleteMethod(deleteTargetId.value, { onSuccess: handleDeleteSuccess })
}

const handleToggleStatus = (method, value) => {
  toggleStatus(
    { id: method.id, isActive: value },
    {
      onSuccess: (response) => {
        Notif.success(response?.message || 'عملیات موفقیت آمیز بود')
        queryClient.invalidateQueries({ queryKey: ['introduction-methods'] })
      },
      onError: () => {
        Notif.error('بروزرسانی وضعیت ناموفق بود')
      },
    }
  )
}

const onReload = async () => {
  await queryClient.invalidateQueries({ queryKey: ['introduction-methods'] })
  emits('afterRefresh')
}

watch(
  () => refresh.value,
  (value) => {
    if (value) onReload()
  }
)
</script>

<style scoped lang="scss">
.intro-settings {
  width: 100%;
  direction: rtl;

  &__title-row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 $spacing-md $spacing-lg;
  }

  &__cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-md;
    padding: 0 $spacing-sm;
  }

  &__no-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-md;
    padding: $spacing-3xl;
    min-height: 300px;
  }

  &__no-data-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: $grey-1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: $spacing-lg;
  }

  &__sentinel {
    height: 1px;
  }

  &__delete {
    display: flex;
    flex-direction: column;
    gap: $spacing-xl;
    padding: $spacing-md $spacing-lg $spacing-sm;
  }

  &__delete-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: $spacing-lg;
  }
}

@media (max-width: 768px) {
  .intro-settings__cards {
    grid-template-columns: 1fr;
  }
}
</style>
