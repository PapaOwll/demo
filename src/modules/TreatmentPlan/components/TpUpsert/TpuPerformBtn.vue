<template>
  <QBtn
    v-if="
      currentStepNumber === TREATMENT_PLAN_STEP.PERFORMED &&
      mode !== TREATMENT_PLAN_MODE.DRAFT &&
      isBranchHasTpPerform
    "
    :loading="isPerformPending"
    color="positive"
    @click="onPerform"
  >
    تایید و ثبت شرح درمان
  </QBtn>
</template>

<script setup>
import { useTpPerform } from '../../composables/use-tp-perform'
import { useTpProvider } from '../../composables/use-tp-provider'
import { useTpStatus } from '../../composables/use-tp-status'
import { TREATMENT_PLAN_STEP, TREATMENT_PLAN_MODE } from '../../constants/enums'
import { useBranchTpPerform } from '../../composables/use-branch-tp-perform'

const props = defineProps({
  itemList: { type: Array, default: () => [] },
})

const treatmentData = useTpProvider('treatmentData')
const { performTpAction, isPerformPending } = useTpPerform()
const { currentStepNumber, mode } = useTpStatus(treatmentData)
const { isBranchHasTpPerform } = useBranchTpPerform()
const onPerform = () => {
  performTpAction(props.itemList)
}
</script>
