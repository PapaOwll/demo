<template>
  <BaseModal
    :model-value="visible"
    :show-header="false"
    :show-close="false"
    content-class="user-details-modal-inner"
    background-color="#f5f5f5"
    transition-show="slide-down"
    transition-hide="slide-up"
    :width="modalWidth"
    :transition-duration="400"
    class="user-details-modal"
    @close="handleCloseDialog"
  >
    <Suspense>
      <template #default>
        <div class="user-dialog__container">
          <div class="user-dialog__info">
            <UserDetailsInfoCard :user-info="userData" @close="updateTable" />
          </div>
          <div class="user-dialog__tabs">
            <UserDetailsTabs :user-data="userData" :tab-index="tabId" @close="handleCloseDialog" />
          </div>
          <QInnerLoading :showing="isLoading">
            <QSpinnerBars color="primary" size="60px" class="q-mx-auto q-my-auto" />
          </QInnerLoading>
        </div>
      </template>
      <template #fallback>
        <div class="user-dialog__suspense-fallback">
          <QSpinnerBars color="primary" size="50px" />
        </div>
      </template>
    </Suspense>
  </BaseModal>
</template>

<script setup>
import { computed, toRefs, defineAsyncComponent } from 'vue'
import { useQuasar } from 'quasar'
import BaseModal from '@/base/Modal'
import { useGetUserMiniByIdQuery } from '@/modules/User/query'

const UserDetailsInfoCard = defineAsyncComponent(
  () => import('@/modules/User/components/UserDetails/UserDetailsInfoCard')
)
const UserDetailsTabs = defineAsyncComponent(
  () => import('@/modules/User/components/UserDetails/UserDetailsTabs')
)

const emits = defineEmits(['close', 'updateTable'])

const props = defineProps({
  visible: { type: Boolean, default: false },
  userId: { type: Number, default: null },
  tabId: { type: [Number, String], default: 0 },
})
const { visible, userId } = toRefs(props)

const $q = useQuasar()
// Progressive width scale - the modal holds a lot of data, so it grows with
// the viewport but is capped via CSS (max-width) so it stays usable on huge screens.
const modalWidth = computed(() => {
  const w = $q.screen.width
  if (w < 600) return '95vw' // phones
  if (w < 1024) return '92vw' // small tablets / laptops
  if (w < 1440) return '88vw' // desktops
  if (w < 1920) return '96vw' // large desktops
  return '78vw' // extra large
})

const enabled = computed(() => !!visible.value && !!userId.value)

const { data, isLoading } = useGetUserMiniByIdQuery(userId, { enabled })

const userData = computed(() => data.value)
const handleCloseDialog = () => {
  emits('close', false)
}
const updateTable = () => {
  handleCloseDialog()
  emits('updateTable')
}
</script>

<style lang="scss" scoped>
.user-details-modal {
  :deep(.modal) {
    --modal-radius: #{$radius-xl};
    --modal-bg-color: #{$grey-2};
    max-width: 1700px;
    overflow: hidden;
  }

  :deep(.modal__body) {
    overflow-x: hidden;
  }
}

.user-dialog {
  &__container {
    display: flex;
    gap: $spacing-lg;
    height: 78dvh;
    overflow: hidden;
  }

  &__info {
    flex: 0 0 24%;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  &__tabs {
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  &__suspense-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 300px;
  }
}

@media (min-width: 1024px) {
  .user-dialog__container {
    height: 88dvh;
  }
}

@media (max-width: 1023px) {
  .user-dialog {
    &__container {
      flex-direction: column;
      overflow-y: auto;
    }

    &__info,
    &__tabs {
      flex: none;
      width: 100%;
      // No independent scroll when stacked - let the container scroll.
      overflow: visible;
    }
  }
}
</style>
