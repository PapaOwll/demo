<template>
  <div class="tpc">
    <Provider mode="edit">
      <TpHeader :show-back="true" />
      <div class="row q-col-gutter-md">
        <div class="col-md-9 col-12" :class="isMobileScreen ? 'col-12' : 'col-9'">
          <div class="tpc__main">
            <TpTopStepper />
            <TpServeItems />
            <TpTeeth v-if="!isOrthopedic()" />
            <TpServeOptions />
          </div>
        </div>
        <div class="col-md-3 col-12" :class="isMobileScreen ? 'col-12' : 'col-3'">
          <div>
            <TpPricing />
          </div>
        </div>
      </div>
    </Provider>
  </div>
</template>

<script setup>
import { useIsMobile } from '@/composables/use-is-mobile'
import { isOrthopedic } from '@/utils/tenant-utils'
import TpHeader from '../components/TpUpsert/TpHeader'
import TpTeeth from '../components/TpUpsert/TpTeeth'
import TpPricing from '../components/TpUpsert/TpPricing'
import Provider from '../providers/TpProvider'
import TpTopStepper from '../components/TpUpsert/TpTopStepper'
import TpServeOptions from '../components/TpUpsert/TpServeOptions'
import TpServeItems from '@/modules/TreatmentPlan/components/TpUpsert/TpServeItems'

const isMobileScreen = useIsMobile()
</script>

<style lang="scss" scoped>
.tpc {
  &__sidebar {
    background: $white;
    padding: 0.5rem;
    border-radius: 0.5rem;

    .show-modal {
      font-size: 15px;
    }

    &--icon {
      position: fixed;
      right: 2%;
      bottom: 50%;
    }
  }

  &__main {
    > div {
      margin-bottom: 1rem;
    }
  }
}
</style>
