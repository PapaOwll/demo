<template>
  <div class="tpc">
    <Provider :key="providerKey" mode="edit">
      <TpRecordingReminderModal />

      <TpHeader :show-back="true" />
      <div class="row q-col-gutter-sm">
        <div :class="isMobileScreen ? 'col-12' : isSideBarOpen ? 'col-5' : 'col-9'">
          <div class="tpc__main">
            <TpTopStepper />
            <TpServeItems />
            <TpTeeth v-if="!isOrthopedic()" />
            <TpServeOptions />

            <TpuInstallment v-if="hasFinancialPerms()" />
            <TpuCheque v-if="hasFinancialPerms()" />
            <Hint v-if="hasFinancialPerms()" />
          </div>
        </div>
        <div :class="isMobileScreen ? 'col-12' : 'col-3'">
          <div>
            <TpPricing :is-edit-mode="true" :can-edit-services="true" />
          </div>
        </div>
      </div>
    </Provider>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Notif } from '@/data/services/notification-service'
import { useIsMobile } from '@/composables/use-is-mobile'
import { isOrthopedic } from '@/utils/tenant-utils'
import TpHeader from '../components/TpUpsert/TpHeader'
import Hint from '../components/TpUpsert/TpHint'
import TpTeeth from '../components/TpUpsert/TpTeeth'
import TpuCheque from '../components/TpUpsert/TpuCheque'
import TpPricing from '../components/TpUpsert/TpPricing'
import Provider from '../providers/TpProvider'
import TpuInstallment from '../components/TpUpsert/TpuInstallment'
import TpServeOptions from '../components/TpUpsert/TpServeOptions'
import TpTopStepper from '../components/TpUpsert/TpTopStepper'
import { useTpPermissions } from '../composables/use-tp-permissions'
import TpServeItems from '../components/TpUpsert/TpServeItems'
import TpRecordingReminderModal from '../components/TpUpsert/TpRecordingReminderModal'
import { useGetTreatmentPlanByIdQuery } from '../query'
import { TREATMENT_PLAN_STATUS } from '../constants/enums'

const route = useRoute()
const router = useRouter()
const isMobileScreen = useIsMobile()
const isSideBarOpen = ref(false)
const { hasFinancialPerms } = useTpPermissions()
const providerKey = computed(() => `provider-${route.params?.id || 'new'}`)

const { data: treatmentPlanData } = useGetTreatmentPlanByIdQuery(route.params?.id)

watch(
  treatmentPlanData,
  (plan) => {
    if (plan && plan.status === TREATMENT_PLAN_STATUS.PERFORMED && plan.canEditActive === false) {
      Notif.error('بازه ویرایش این طرح درمان به پایان رسیده است')
      router.back()
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.tpc {
  padding: 1rem;
  &__sidebar {
    &--icon {
      position: fixed;
      right: 2%;
      bottom: 50%;
    }
  }
  &__main {
    > div {
      margin-bottom: 0.5rem;
    }
  }
}
</style>
