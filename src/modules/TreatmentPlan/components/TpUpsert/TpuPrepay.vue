<template>
  <div class="tp-prepay">
    <div>
      <QCardActions class="tp-prepay__top" @click.self="expanded = !expanded">
        <span @click="expanded = !expanded">بیعانه</span>

        <QSpace />

        <QBtn
          color="grey"
          round
          flat
          dense
          :icon="expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
          @click="expanded = !expanded"
        />
      </QCardActions>

      <QSlideTransition>
        <div v-show="expanded">
          <div class="text-subtitle2">
            <div class="tp-prepay__form">
              <CurrencyField
                :model-value="treatmentData?.prepay || 0"
                class="tp-prepay__input"
                placeholder="مبلغ بیعانه"
                dense
                :disable="!!isExtradited || !!isCompletedTp || !props.isEditMode"
                @update:model-value="onChangePrepay"
              />
              <!--              <QInput-->
              <!--                :model-value="generatePriceFormat(treatmentData?.prepay || 0)"-->
              <!--                class="tp-prepay__input"-->
              <!--                placeholder="مبلغ بیعانه"-->
              <!--                outlined-->
              <!--                dense-->
              <!--                suffix="تومان"-->
              <!--                :disable="!!isExtradited || !!isCompletedTp || !props.isEditMode"-->
              <!--                @update:model-value="(e) => onChangePrepay(convertToEnNumber(e))"-->
              <!--              />-->
            </div>
          </div>
        </div>
      </QSlideTransition>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

import { useTpProvider } from '../../composables/use-tp-provider'
import { useTpStatus } from '../../composables/use-tp-status'
import CurrencyField from '@/components/Form/CurrencyField'

const props = defineProps({
  isEditMode: {
    type: Boolean,
    default: true,
  },
})

const { treatmentData, updateTreatment } = useTpProvider(['treatmentData', 'updateTreatment'])

const expanded = ref(false)
const { isCompletedTp } = useTpStatus(treatmentData)

const isExtradited = computed(() => treatmentData?.value?.extraditionAt)

const onChangePrepay = (value) => {
  updateTreatment({ prepay: value })
}
</script>

<style lang="scss" scoped>
.tp-prepay {
  border: 1px solid $grey-3;
  border-radius: 0.5rem;
  background-color: $grey-1 !important;
  &__top {
    cursor: pointer;
  }

  &__form {
    padding: map-get($space-sm, x);

    margin-top: 1rem;
  }

  &__input {
    margin-bottom: 0.25rem;
  }
}
</style>
