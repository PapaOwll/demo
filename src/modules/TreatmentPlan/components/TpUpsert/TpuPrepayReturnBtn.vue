<template>
  <div class="test">
    <QBtn
      :loading="isLoadingExtradited"
      class="tp-prepay__extradition-button"
      unelevated
      no-caps
      :class="
        treatmentData.extraditionAt
          ? 'tp-prepay__extradition-button--returned'
          : 'tp-prepay__extradition-button--pending'
      "
      :disabled="isExtradited || isCompletedTp"
      @click="onExtraditePrepay"
    >
      <template v-if="treatmentData.extraditionAt">
        <QIcon name="keyboard_return" size="sm" class="q-mr-sm" />
      </template>
      {{ isExtradited ? 'عودت بیعانه' : 'عودت بیعانه' }}
    </QBtn>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useTpProvider } from '../../composables/use-tp-provider'
import { formatDate } from '@/utils/date-utils'
import { handleError } from '@/utils/error-handler'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import { useExtraditePrepayMutation } from '../../query'
import { useTpStatus } from '../../composables/use-tp-status'

const { treatmentData, updateTreatment } = useTpProvider(['treatmentData', 'updateTreatment'])
const { isCompletedTp } = useTpStatus(treatmentData)

const {
  mutate: extradite,
  isSuccess: isSuccessExtradited,
  isLoading: isLoadingExtradited,
} = useExtraditePrepayMutation()

const isExtradited = computed(
  () => treatmentData?.value?.extraditionAt || isSuccessExtradited.value
)
const onExtraditePrepay = async () => {
  confirmDialog(
    'عودت بیعانه',
    'آیا از عودت بیعانه مطمئن هستید؟',
    () => {
      extradite(
        {
          id: treatmentData?.value?.id,
          extraditionAt: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
        },
        {
          onSuccess: () => {
            updateTreatment({ extraditionAt: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss') })
            Notif.success('بیعانه با موفقیت عودت داده شد')
          },
          onError: (e) => {
            handleError(e, { glitchtipLog: false, showToast: true })
          },
        }
      )
    },
    {
      ok: { label: 'عودت' },
      persistent: true,
    }
  )
}
</script>

<style lang="scss" scoped>
.tp-prepay__extradition-button {
  margin: 0;
  white-space: nowrap;
  width: 100%;
  font-size: map-get($body2, size);

  &--returned {
    background-color: #ffe6f0 !important;
    color: #d81b60 !important;

    &:hover {
      background-color: #ffcce0 !important;
    }
  }

  &--pending {
    background-color: #e3f2fd !important;
    color: #1976d2 !important;

    &:hover {
      background-color: #bbdefb !important;
    }
  }
}

.test {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}
</style>
