<template>
  <div class="tp-visit-type">
    <div>
      <QCardActions class="tp-visit-type__top" @click.self="expanded = !expanded">
        <span @click="expanded = !expanded">نوع ویزیت</span>

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
            <div class="tp-visit-type__form">
              <div class="tp-visit-type__radio-group">
                <QRadio
                  v-for="option in visitTypeOptions"
                  :key="option.value"
                  :model-value="visitType"
                  :val="option.value"
                  @update:model-value="onChangeVisitType"
                >
                  <template #default>
                    <div class="tp-visit-type__radio-content">
                      <span class="tp-visit-type__radio-label">{{ option.label }}</span>
                      <component :is="option.icon" :size="20" class="tp-visit-type__radio-icon" />
                    </div>
                  </template>
                </QRadio>
              </div>
            </div>
          </div>
        </div>
      </QSlideTransition>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { IconBuilding, IconDeviceDesktop } from '@tabler/icons-vue'
import { useTpProvider } from '../../composables/use-tp-provider'
import { VISIT_TYPE } from '../../constants/enums'

const { updateTreatment, treatmentData } = useTpProvider(['updateTreatment', 'treatmentData'])

const expanded = ref(true)

const visitTypeOptions = computed(() => [
  {
    value: VISIT_TYPE.IN_PERSON,
    label: 'حضوری',
    icon: IconBuilding,
  },
  {
    value: VISIT_TYPE.ONLINE,
    label: 'آنلاین',
    icon: IconDeviceDesktop,
  },
])

const visitType = computed(() => treatmentData?.value?.visitType)

const onChangeVisitType = (value) => {
  updateTreatment({ visitType: value })
}

// Set default value to IN_PERSON if not already set
onMounted(() => {
  if (!visitType.value) {
    updateTreatment({ visitType: VISIT_TYPE.IN_PERSON })
  }
})
</script>

<style lang="scss" scoped>
.tp-visit-type {
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

  &__radio-group {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    gap: 1rem;
  }

  &__radio-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 1rem;
  }

  &__radio-label {
    flex: 1;
    color: $grey-8;
    font-size: 0.875rem;
  }

  &__radio-icon {
    flex-shrink: 0;
    color: $primary;
  }
}
</style>
