<template>
  <div class="tpc">
    <Provider mode="preview">
      <TpHeader show-preview-user />
      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-12 col-md-9">
          <div class="tpc__main">
            <TppServeItems />
            <TppTeeth v-if="!isOrthopedic()" />
            <TppCheque />
          </div>
        </div>
        <div class="col-12 col-md-3">
          <TppPricing />
        </div>
      </div>
    </Provider>
  </div>
</template>

<script setup>
import { isOrthopedic } from '@/utils/tenant-utils'
import TpHeader from '../components/TpUpsert/TpHeader'
import TppTeeth from '../components/TpPreview/TppTeeth'
import TppCheque from '../components/TpPreview/TppCheque'
import TppPricing from '../components/TpPreview/TppPricing'
import Provider from '../providers/TpProvider'
import TppServeItems from '../components/TpPreview/TppServeItems'
</script>

<style lang="scss" scoped>
.tpc {
  padding: 1rem;

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
    display: flex;
    flex-direction: column;

    :deep(.q-card) {
      height: auto;
    }
  }
}

@include media-breakpoint-down(sm) {
  .tpc {
    padding: 0.75rem;

    &__main {
      gap: 0.75rem;
    }
  }
}
</style>
