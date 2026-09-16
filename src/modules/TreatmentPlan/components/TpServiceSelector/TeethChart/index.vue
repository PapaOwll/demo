<template>
  <div class="teeth-chart">
    <div class="half-jaws">
      <section v-for="halfJaw in halfJaws" :key="halfJaw.key" class="half-jaw">
        <Typography variant="body" size="3" weight="semibold" class="half-jaw__title">
          {{ halfJaw.title }}
        </Typography>

        <div class="half-jaw__rows">
          <div v-for="(row, index) in halfJaw.rows" :key="index" class="teeth-grid">
            <ToothItem
              v-for="tooth in row"
              :key="tooth.id"
              :tooth-id="tooth.id"
              :tooth-number="tooth.number"
              :is-implant="isImplant"
              :model-value="isToothSelected(tooth.id)"
              :disabled="isToothDisabled(tooth.id)"
              @update:model-value="handleToothClick(tooth.id)"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
// import { QBtnToggle } from 'quasar'
import ToothItem from './ToothItem'
import Typography from '@/base/Typography'
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

const toTeeth = (row) => Object.entries(row).map(([id, number]) => ({ id: Number(id), number }))

// teethRows lists each jaw right-quadrant-first (ids 1-7 / 15-21) and already
// numbers those quadrants 7 -> 1; the left quadrants (ids 8-14 / 22-28) number
// 1 -> 7.
const upperTeeth = toTeeth(teethRows.upper)
const lowerTeeth = toTeeth(teethRows.lower)

// Two half-jaw blocks, each holding the upper row above the lower row of the
// same side, mirrored around the midline so the front teeth (number 1) of
// both sides face each other: the right block reads 1 -> 7 left-to-right and
// the left block 1 -> 7 right-to-left. The right block comes first in the
// DOM: .half-jaws is row-reverse, so it sits on the right when the blocks fit
// side by side and wraps to the top line when they do not.
const halfJaws = [
  {
    key: 'right',
    title: 'نیم فک راست',
    rows: [upperTeeth.slice(0, 7).reverse(), lowerTeeth.slice(0, 7).reverse()],
  },
  {
    key: 'left',
    title: 'نیم فک چپ',
    rows: [upperTeeth.slice(7).reverse(), lowerTeeth.slice(7).reverse()],
  },
]

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

// LTR keeps the 7 -> 1 reading order and the row-reverse anchoring
// deterministic under the app-wide RTL direction. row-reverse pins the first
// DOM block (right half-jaw) to the right when both blocks fit on one line —
// matching the quadrant sides of the previous full-arch chart — and wraps it
// to the first (top) line once they no longer fit.
.half-jaws {
  direction: ltr;
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: wrap;
  justify-content: center;
  gap: $spacing-lg $spacing-xl;
}

.half-jaw {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding: $spacing-md;
  border: 1px solid $grey-3;
  border-radius: $radius-md;

  &__title {
    // Only the layout container is LTR; the Persian title itself stays RTL.
    direction: rtl;
    text-align: center;
  }

  &__rows {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }
}

// 7 columns capped at the 48px tooth size: tracks share the available width
// and shrink on narrow screens instead of overflowing the dialog.
.teeth-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 48px));
  gap: $spacing-sm;
}
</style>
