<template>
  <div class="tpc">
    <Provider mode="create">
      <TpHeader :show-back="true" :show-refresh="true" />
      <div class="row q-col-gutter-md">
        <div class="col-md-9 col-12" :class="isMobileScreen ? 'col-md-12' : 'col-md-9'">
          <div class="tpc__main">
            <TpServeItems />
            <TpTeeth v-if="!isOrthopedic()" />
            <TpServeOptions />
          </div>
        </div>
        <div class="col-md-3 col-12" :class="isMobileScreen ? 'col-md-12' : 'col-md-3'">
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
import TpServeOptions from '../components/TpUpsert/TpServeOptions'
import TpServeItems from '@/modules/TreatmentPlan/components/TpUpsert/TpServeItems'

const isMobileScreen = useIsMobile()
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
