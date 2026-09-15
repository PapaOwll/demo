<template>
  <div class="tpd">
    <QCardActions class="tpd__top" @click.self="expanded = !expanded">
      <span @click="expanded = !expanded">توضیحات</span>
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
      <div v-if="expanded">
        <QInput
          :rows="4"
          class="tpd__input"
          type="textarea"
          placeholder="توضیحات"
          outlined
          dense
          :model-value="publicDescription"
          @change="(val) => updateTreatment({ publicDescription: val })"
        />
      </div>
    </QSlideTransition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useTpProvider } from '../../composables/use-tp-provider'

const { treatmentData, updateTreatment } = useTpProvider(['treatmentData', 'updateTreatment'])
const expanded = ref(true)
const publicDescription = computed(() => treatmentData?.value?.publicDescription)
</script>

<style scoped lang="scss">
.tpd {
  background-color: $grey-1;
  border: 1px solid $grey-3;
  padding: map-get($space-sm, x);
  border-radius: 8px !important;
  &__top {
    cursor: pointer;
    padding: 0 !important;
  }
  &__input {
    margin-top: 0.5rem;
    border-radius: 16px !important;
    background-color: white !important;
  }
}
</style>
