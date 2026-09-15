<template>
  <div class="teeth-chart">
    <!--    <div class="jaw-selector">-->
    <!--      <QBtnToggle-->
    <!--        v-model="upperTeeth"-->
    <!--        no-caps-->
    <!--        rounded-->
    <!--        unelevated-->
    <!--        bordered-->
    <!--        toggle-color="primary"-->
    <!--        color="white"-->
    <!--        text-color="primary"-->
    <!--        :options="upperJawOptions"-->
    <!--        :disable="disabled"-->
    <!--        class="tpt__teeth-toggle"-->
    <!--      />-->
    <!--    </div>-->

    <div class="jaw">
      <div class="teeth-guide">
        <!--        <div class="teeth-guide__item">-->
        <!--          <Typography variant="body" size="3" weight="semibold">بالا چپ</Typography>-->
        <!--          <Typography variant="caption" size="4" color="grey">Upper Left</Typography>-->
        <!--        </div>-->
        <!--        <div class="teeth-guide__item">-->
        <!--          <Typography variant="body" size="3" weight="semibold">بالا راست</Typography>-->
        <!--          <Typography variant="caption" size="4" color="grey">Upper Right</Typography>-->
        <!--        </div>-->
      </div>
      <div class="teeth-grid">
        <div class="teeth-grid__extra" />
        <ToothItem
          v-for="tooth in upperJaw"
          :key="tooth.id"
          :tooth-id="tooth.id"
          :tooth-number="tooth.number"
          :is-implant="isImplant"
          :model-value="isToothSelected(tooth.id)"
          :disabled="isToothDisabled(tooth.id)"
          @update:model-value="handleToothClick(tooth.id)"
        />
      </div>
      <div class="teeth-grid">
        <div class="teeth-grid__extra" />
        <ToothItem
          v-for="tooth in lowerJaw"
          :key="tooth.id"
          :tooth-id="tooth.id"
          :tooth-number="tooth.number"
          :is-implant="isImplant"
          :model-value="isToothSelected(tooth.id)"
          :disabled="isToothDisabled(tooth.id)"
          @update:model-value="handleToothClick(tooth.id)"
        />
      </div>
      <div class="teeth-guide">
        <!--        <div class="teeth-guide__item">-->
        <!--          <Typography variant="body" size="4" weight="semibold">پایین چپ</Typography>-->
        <!--          <Typography variant="caption" size="4" color="grey">Lower Left</Typography>-->
        <!--        </div>-->
        <!--        <div class="teeth-guide__item">-->
        <!--          <Typography variant="body" size="4" weight="semibold">پایین راست</Typography>-->
        <!--          <Typography variant="caption" size="4" color="grey">Lower Right</Typography>-->
        <!--        </div>-->
      </div>
    </div>

    <!--    <div class="jaw-selector">-->
    <!--      <QBtnToggle-->
    <!--        v-model="lowerTeeth"-->
    <!--        no-caps-->
    <!--        rounded-->
    <!--        unelevated-->
    <!--        bordered-->
    <!--        toggle-color="primary"-->
    <!--        color="white"-->
    <!--        text-color="primary"-->
    <!--        :options="lowerJawOptions"-->
    <!--        :disable="disabled"-->
    <!--        class="tpt__teeth-toggle"-->
    <!--      />-->
    <!--    </div>-->
  </div>
</template>

<script setup>
import { computed } from 'vue'
// import { QBtnToggle } from 'quasar'
import ToothItem from './ToothItem'
import {
  teethRows,
  // groupTopTeeth,
  // groupBottomTeeth,
  // teethGroupItem,
} from '../../../constants/teeth'
// import { deduplicateTeeth } from '@/modules/TreatmentPlan/utils/teeth'

const props = defineProps({
  selectedTeeth: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  isImplant: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-tooth', 'quick-select'])

const swapHalves = (row) => {
  const entries = Object.entries(row).map(([id, number]) => ({ id: Number(id), number }))
  const mid = entries.length / 2
  return [...entries.slice(mid).reverse(), ...entries.slice(0, mid).reverse()]
}

const upperJaw = computed(() => swapHalves(teethRows.upper))
const lowerJaw = computed(() => swapHalves(teethRows.lower))

// const upperJawOptions = computed(() => [
//   { label: '0', value: 0 },
//   { label: '4', value: 4 },
//   { label: '6', value: 6 },
//   { label: '8', value: 8 },
//   { label: '12', value: 12 },
//   { label: 'نیم فک بالا', value: 14 },
// ])
//
// const lowerJawOptions = computed(() => [
//   { label: '0', value: 0 },
//   { label: '4', value: 4 },
//   { label: '6', value: 6 },
//   { label: '8', value: 8 },
//   { label: '12', value: 12 },
//   { label: 'نیم فک پایین', value: 14 },
// ])

// const selectedUpperTeeth = computed(() => props.selectedTeeth.filter((t) => t < 15))
// const selectedLowerTeeth = computed(() => props.selectedTeeth.filter((t) => t >= 15))

const selectedTeethLookup = computed(() => {
  const lookup = {}
  props.selectedTeeth.forEach((toothId) => {
    lookup[toothId] = true
  })
  return lookup
})

const isToothSelected = (toothId) => !!selectedTeethLookup.value[toothId]

// const changeGroupSelect = (groupTeeth, position) => {
//   const existingFilteredTeeth =
//     position === 'upper' ? selectedLowerTeeth.value : selectedUpperTeeth.value
//
//   const groupTeethToAdd =
//     position === 'upper' ? groupTopTeeth[groupTeeth] : groupBottomTeeth[groupTeeth]
//
//   const newTeeth = deduplicateTeeth([...existingFilteredTeeth, ...groupTeethToAdd])
//
//   emit('quick-select', newTeeth)
// }

const isToothDisabled = () => {
  return props.disabled
}

const handleToothClick = (toothId) => {
  if (!isToothDisabled()) {
    emit('toggle-tooth', toothId)
  }
}

// const upperTeeth = computed({
//   get() {
//     const upperTeethLength = selectedUpperTeeth.value.length
//
//     if (!teethGroupItem.includes(upperTeethLength)) {
//       return null
//     }
//
//     if (upperTeethLength === 0) {
//       return 0
//     }
//
//     return groupTopTeeth[upperTeethLength]?.every((_t) => selectedUpperTeeth.value.includes(_t))
//       ? upperTeethLength
//       : null
//   },
//   set(value) {
//     changeGroupSelect(value, 'upper')
//   },
// })
//
// const lowerTeeth = computed({
//   get() {
//     const lowerTeethLength = selectedLowerTeeth.value.length
//
//     if (!teethGroupItem.includes(lowerTeethLength)) {
//       return null
//     }
//
//     if (lowerTeethLength === 0) {
//       return 0
//     }
//
//     return groupBottomTeeth[lowerTeethLength]?.every((_t) => selectedLowerTeeth.value.includes(_t))
//       ? lowerTeethLength
//       : null
//   },
//   set(value) {
//     changeGroupSelect(value, 'lower')
//   },
// })
</script>

<style lang="scss" scoped>
.teeth-chart {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.jaw-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-md;
  border-radius: $radius-md;
  margin: 0 auto;
}

.jaw {
  direction: ltr;
  border-radius: $radius-md;
  padding: $spacing-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: $spacing-md;

  &__title {
    margin-bottom: $spacing-lg;
    text-align: center;
  }
}

.teeth-grid {
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  grid-template-rows: 1fr;
  grid-column-gap: $spacing-md;
  gap: $spacing-sm;
  justify-items: center;

  &__extra {
    grid-area: 1/ 8 / 2/ 9;
  }
}

.selection-info {
  text-align: center;
  padding: $spacing-sm;
  background-color: $grey-1;
  border-radius: $radius-sm;
}

.tooth-item {
  position: relative;
  width: 48px;
  height: 48px;
  border: 2px solid $grey-4;
  border-radius: $radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: white;

  &:hover:not(.disabled) {
    border-color: $light-blue-filled;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.tpt {
  margin-top: 1rem;
  text-align: center;
  position: relative;

  &__teeth-toggle {
    border: 2px solid $grey-4;
    border-radius: 5px;
  }
}

.teeth-guide {
  width: 100%;
  display: flex;
  align-items: center;
  &__item {
    width: 50%;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    justify-content: center;
    align-items: center;
  }
}
</style>
