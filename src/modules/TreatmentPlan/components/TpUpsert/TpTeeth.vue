<template>
  <QCard class="tpt" flat>
    <QCardSection>
      <QSeparator />
      <TpTeethHelpBox />
      <TpuComparisonBtn v-if="currentStepNumber > TREATMENT_PLAN_STEP.DRAFT" />
      <div class="tpt__group--top">
        <div v-if="!isDisabledMouth">
          <QBtnToggle
            v-model="topTeeth"
            class="tpt__teeth-toggle"
            no-caps
            :rounded="true"
            unelevated
            bordered
            toggle-color="primary"
            color="white"
            text-color="primary"
            :options="topTeethOptions"
          />
        </div>
      </div>
      <div class="tpt__content">
        <svg
          id="teethSVG"
          viewBox="0 0 757 335"
          xmlns="http://www.w3.org/2000/svg"
          :class="{ 'tpt__mouth--disabled': isDisabledMouth }"
        >
          <!-- Status patterns -->
          <defs>
            <!-- Draft only - light blue -->
            <pattern id="draftPattern" patternUnits="userSpaceOnUse" width="20" height="20">
              <rect width="20" height="20" fill="#E3F2FD" />
            </pattern>

            <!-- Proposed only - blue -->
            <pattern id="proposedPattern" patternUnits="userSpaceOnUse" width="20" height="20">
              <rect width="20" height="20" fill="#BBDEFB" />
            </pattern>

            <!-- Draft + Proposed - half light blue & blue -->
            <linearGradient id="draftProposedPattern" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="50%" style="stop-color: #e3f2fd; stop-opacity: 1" />
              <stop offset="50%" style="stop-color: #bbdefb; stop-opacity: 1" />
            </linearGradient>
          </defs>

          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M664.391 77.986L620.365 192.964C620.365 192.964 573.049 297.839 370.214 288.945C204.972 281.7 172.575 231.809 152.082 200.962C129.782 167.395 86.042 79.986 86.042 79.986C86.042 79.986 61.742 49.18 162.088 59.986C262.434 70.792 503.294 62.986 503.294 62.986C503.294 62.986 686.948 32.372 664.391 77.986Z"
            fill="#F6979C"
          />

          <!-- Regular teeth paths -->
          <path
            v-for="tooth of teeth"
            :key="tooth?.id"
            :d="tooth?.path"
            :class="['tpt__tooth-svg', getToothClass(tooth?.id)]"
            :fill="getToothFill(tooth?.id)"
            @click="onSelectTooth(tooth?.id)"
          />

          <path
            v-for="tooth of teeth"
            :key="tooth?.id"
            style="pointer-events: none"
            :d="tooth?.numberPath"
            class="tpt__tooth-svg-number"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M378.247 302.863C378.247 302.863 378.681 301.795 326.339 302.863C273.997 303.931 216.2 283.051 191.379 263.2C166.558 243.349 127.479 182.966 107.379 143.377C87.279 103.788 43.331 56.06 39.431 51.4C35.531 46.74 36.471 41.8 41.319 42.962C46.167 44.124 75.019 53.932 101.719 53.932C128.419 53.932 143.468 32 247.062 32C338.923 32 368.815 56.471 368.815 56.471C368.815 56.471 379.926 62.655 388.829 56.471C388.829 56.471 425.336 31.998 510.502 31.998C614.034 32 629.07 53.937 655.756 53.937C682.442 53.937 711.277 44.125 716.122 42.966C720.967 41.807 721.906 46.748 718.008 51.405C714.11 56.062 670.177 103.8 650.1 143.391C630.023 182.982 590.963 243.377 566.155 263.226C541.347 283.075 483.586 303.958 431.276 302.89C378.966 301.822 379.4 302.89 379.4 302.89C379.02 302.982 378.622 302.973 378.247 302.863ZM111.745 110.98C104.282 89.644 114.745 76.406 114.745 76.406C114.745 76.406 120.461 70.286 134.757 74.417C149.053 78.548 158.648 83.947 180.785 90.341C202.922 96.735 259.614 105.089 273.841 106.255C289.362 107.528 358.786 112.686 378.904 109.98C379.237 109.948 379.571 109.948 379.904 109.98C400.022 112.686 470.447 107.528 485.968 106.255C500.195 105.089 556.887 96.735 579.024 90.341C601.161 83.947 610.756 78.547 625.052 74.417C639.348 70.287 645.064 76.406 645.064 76.406C653.415 85.76 647.064 104.981 647.064 104.981C647.064 104.981 626.594 166.801 611.042 184.965C595.49 203.129 575.092 222.288 528 232.956C480.908 243.624 414.591 258.956 379.911 258.956H377.911C343.231 258.956 275.916 243.629 228.821 232.956C181.726 222.283 161.321 203.129 145.771 184.965C136.256 173.853 124.901 146.399 117.518 126.759C112.829 114.3 113.4 115.7 111.745 110.98Z"
            fill="#DF3F3B"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M378 327.906C378 327.906 378.46 326.641 322.934 327.906C267.408 329.171 206.093 304.434 179.76 280.92C153.427 257.406 111.967 185.863 90.653 138.961C69.339 92.059 22.7 35.51 18.566 29.993C14.432 24.476 15.426 18.623 20.566 19.993C25.706 21.363 56.316 32.993 84.643 32.993C112.97 32.993 128.933 7 238.831 7C336.283 7 367.993 35.992 367.993 35.992C367.993 35.992 379.781 43.318 389.225 35.992C389.225 35.994 427.954 7 518.3 7C628.135 7 644.086 32.995 672.4 32.995C700.714 32.995 731.3 21.37 736.439 19.995C741.578 18.62 742.575 24.476 738.439 29.995C734.303 35.514 687.697 92.067 666.395 138.974C645.093 185.881 603.659 257.431 577.342 280.947C551.025 304.463 489.748 329.203 434.255 327.937C378.762 326.671 379.222 327.937 379.222 327.937C378.82 328.046 378.396 328.036 378 327.906V327.906ZM103.825 104.454C96.125 81.168 106.925 66.721 106.925 66.721C106.925 66.721 112.825 60.042 127.567 64.55C142.309 69.058 152.21 74.95 175.044 81.93C197.878 88.91 256.355 98.03 271.03 99.298C287.04 100.687 358.65 106.316 379.401 103.363C379.744 103.329 380.09 103.329 380.433 103.363C401.185 106.316 473.826 100.687 489.833 99.298C504.509 98.025 562.985 88.908 585.819 81.93C608.653 74.952 618.55 69.058 633.296 64.55C648.042 60.042 653.938 66.721 653.938 66.721C662.55 76.93 656 97.907 656 97.907C656 97.907 634.885 165.378 618.845 185.207C602.805 205.036 581.758 225.94 533.18 237.584C484.602 249.228 416.2 265.95 380.429 265.95H378.365C342.593 265.95 273.159 249.222 224.581 237.579C176.003 225.936 154.957 205.026 138.917 185.202C129.103 173.073 117.39 143.111 109.775 121.676C104.943 108.075 105.527 109.6 103.825 104.454Z"
            fill="#EE534F"
          />
        </svg>
        <g
          v-if="isShowSelectServe && !isLoading && !isError && !isPending"
          class="tpt__select-serve"
        >
          <text
            class="tpt__select-serve-text"
            x="50%"
            y="50%"
            dominant-baseline="middle"
            text-anchor="middle"
          >
            لطفا ابتدا یک خدمت انتخاب کنید
          </text>
        </g>
        <g v-if="isError" class="tpt__error">
          <QBtn v-bind="{ loading: isFetching }" color="negative" @click="refetch">تلاش مجدد</QBtn>
        </g>
      </div>

      <div class="tpt__group--bottom">
        <div v-if="!isDisabledMouth">
          <QBtnToggle
            v-model="bottomTeeth"
            class="tpt__teeth-toggle"
            no-caps
            rounded
            unelevated
            toggle-color="primary"
            color="white"
            text-color="primary"
            :options="bottomTeethOptions"
          />
        </div>
      </div>
    </QCardSection>
  </QCard>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed, ref, watch } from 'vue'
import { teethSVG } from '../../constants/teeth-svg'
import { groupBottomTeeth, groupTopTeeth, teethGroupItem } from '../../constants/teeth'
import { TREATMENT_PLAN_STEP, QUESTION_TYPE } from '../../constants/enums'
import { useGetTreatmentPlanByIdQuery } from '../../query'
import { useTpProvider } from '../../composables/use-tp-provider'
import { convertShowableToothToTooth, deduplicateTeeth } from '../../utils/teeth'
import { useTpStatus } from '../../composables/use-tp-status'
import { useTpPermissions } from '../../composables/use-tp-permissions'
import TpTeethHelpBox from './TpTeethHelpBox'
import TpuComparisonBtn from './TpuComparisonBtn'

const route = useRoute()
const treatmentPlanId = route.params?.id
const { canEditTreatmentPlan } = useTpPermissions()
const { updateTeeth, treatmentData, selectedServe } = useTpProvider([
  'updateTeeth',
  'treatmentData',
  'selectedServe',
])

const { currentStepNumber } = useTpStatus(treatmentData)
const { isLoading, refetch, isError, isPending, isFetching } =
  useGetTreatmentPlanByIdQuery(treatmentPlanId)

const topTeethOptions = computed(() => [
  { label: '0', value: 0 },
  { label: '4', value: 4 },
  { label: '6', value: 6 },
  { label: '8', value: 8 },
  { label: '12', value: 12 },
  { label: 'نیم فک بالا', value: 14 },
])

const bottomTeethOptions = computed(() => [
  { label: '0', value: 0 },
  { label: '4', value: 4 },
  { label: '6', value: 6 },
  { label: '8', value: 8 },
  { label: '12', value: 12 },
  { label: 'نیم فک پایین', value: 14 },
])

const teeth = computed(() =>
  [...teethSVG].reverse().map((tooth, i) => ({
    id: i + 1,
    path: tooth.path,
    numberPath: tooth?.numberPath,
  }))
)

// TODO: rethink when back is ready
const selectedServeTeeth = computed(
  () =>
    treatmentData?.value?.teeth?.find(
      (item) => item?.serve.serveId === selectedServe?.value?.serveId
    ) || null
)
const isShowSelectServe = computed(() => !selectedServe?.value)

const getToothStatus = (toothId) => {
  if (!selectedServeTeeth.value) return []

  const teethData = selectedServeTeeth.value?.serve?.teeth

  if (!teethData) return []

  const toothData = teethData.find((tooth) => convertShowableToothToTooth(tooth) === toothId)

  if (!toothData) return []

  const statuses = []
  if (toothData.isDraft) statuses.push('draft')
  if (toothData.isProposed) statuses.push('proposed')

  return statuses
}

const getToothClass = (toothId) => {
  const isSelected = selectedServeTeeth.value?.teeth?.includes(toothId)
  const statuses = getToothStatus(toothId)

  const classes = []

  if (isSelected) {
    classes.push('tpt__tooth-svg--selected')
  }

  statuses.forEach((status) => {
    classes.push(`tpt__tooth-svg--${status}`)
  })

  return classes.join(' ')
}

const getToothFill = (toothId) => {
  const statuses = getToothStatus(toothId)

  if (statuses.length === 0) return 'white'

  if (statuses.length === 1) {
    if (statuses.includes('draft')) return 'url(#draftPattern)'
    if (statuses.includes('proposed')) return 'url(#proposedPattern)'
  }

  if (statuses.length === 2 && statuses.includes('draft') && statuses.includes('proposed')) {
    return 'url(#draftProposedPattern)'
  }

  return 'white'
}

const isDisabledMouth = computed(
  () =>
    isShowSelectServe.value ||
    !selectedServe?.value?.questions?.some(
      (q) => q.type === QUESTION_TYPE.PER_TEETH || q.type === QUESTION_TYPE.MULTIPLE
    )
)

const selectedTopTeeth = computed(
  () => selectedServeTeeth.value?.teeth?.filter((_t) => _t < 15) || []
)

const selectedBottomTeeth = computed(
  () => selectedServeTeeth.value?.teeth?.filter((_t) => _t >= 15) || []
)

const changeGroupSelect = (groupTeeth, position) => {
  const existingFilteredTeeth =
    selectedServeTeeth.value?.teeth?.filter((_t) => (position === 'top' ? _t >= 15 : _t < 15)) || []

  const groupTeethToAdd =
    position === 'top' ? groupTopTeeth[groupTeeth] : groupBottomTeeth[groupTeeth]

  const newTeeth = deduplicateTeeth([...existingFilteredTeeth, ...groupTeethToAdd])

  updateTeeth(
    selectedServeTeeth.value
      ? {
          ...selectedServeTeeth.value,
          total: newTeeth.length,
          teeth: newTeeth,
        }
      : {
          total: newTeeth.length,
          teeth: newTeeth,
          serve: selectedServe?.value,
        }
  )
}

const topTeeth = computed({
  get() {
    const topTeethLength = selectedTopTeeth.value.length

    if (!teethGroupItem.includes(topTeethLength)) {
      return null
    }

    if (topTeethLength === 0) {
      return 0
    }

    return groupTopTeeth[topTeethLength]?.every((_t) => selectedTopTeeth.value.includes(_t))
      ? topTeethLength
      : null
  },
  set(value) {
    changeGroupSelect(value, 'top')
  },
})

const bottomTeeth = computed({
  get() {
    const bottomTeethLength = selectedBottomTeeth.value.length

    if (!teethGroupItem.includes(bottomTeethLength)) {
      return null
    }

    if (bottomTeethLength === 0) {
      return 0
    }

    return groupBottomTeeth[bottomTeethLength]?.every((_t) =>
      selectedBottomTeeth.value.includes(_t)
    )
      ? bottomTeethLength
      : null
  },
  set(value) {
    changeGroupSelect(value, 'bottom')
  },
})

const onSelectTooth = (toothId) => {
  if (isDisabledMouth.value) return
  const apiTeeth = selectedServeTeeth.value?.serve?.teeth
  if (apiTeeth && !canEditTreatmentPlan) return

  const isRemoveAction = selectedServeTeeth.value?.teeth?.includes(toothId)

  let newTeeth
  if (selectedServeTeeth.value) {
    newTeeth = isRemoveAction
      ? selectedServeTeeth.value?.teeth?.filter((id) => id !== toothId) || []
      : deduplicateTeeth([...(selectedServeTeeth.value?.teeth || []), toothId])
  } else {
    newTeeth = [toothId]
  }

  updateTeeth(
    selectedServeTeeth.value
      ? {
          ...selectedServeTeeth.value,
          total: newTeeth.length,
          teeth: newTeeth,
        }
      : {
          total: 1,
          teeth: newTeeth,
          serve: selectedServe?.value,
        }
  )
}

const loading = ref(null)

watch(
  () => isPending?.value,
  (isPendingValue) => {
    if (treatmentPlanId && isPendingValue && !loading.value) {
      loading.value = true
    } else if (!isPendingValue && loading.value) {
      loading.value = false
    }
  }
)
</script>

<style lang="scss" scoped>
.tpt {
  margin-top: 1rem;
  text-align: center;
  position: relative;

  &__group--top {
    margin-bottom: 2rem;
    padding-top: 2rem;
    height: 40px;
    display: flex;
    flex-direction: row-reverse;
    justify-content: center;
    align-items: center;
  }

  &__teeth-toggle {
    border: 2px solid $grey-4;
    border-radius: 5px;
  }

  &__group--bottom {
    margin-top: 2rem;
    padding-bottom: 2rem;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    direction: rtl;
  }

  &__content {
    width: 100%;
    max-width: 1000px;
    text-align: center;
    margin: auto;
    position: relative;
  }

  &__tooth-svg {
    cursor: pointer;
    transition: all 0.4s;
    color: $white;
    //fill: currentColor;
    stroke-width: 2;
    stroke: $white;
    z-index: 999;

    &--draft {
      color: $blue-2;
      stroke: $white;
    }

    &--proposed {
      color: $blue-3;
      stroke: $white;
    }

    &--selected {
      stroke: $blue-8;
    }
  }

  &__tooth-svg--active {
    color: $blue-2;
    stroke: $white;
  }

  &__tooth-svg-number {
    cursor: pointer;
    transition: all 0.4s;
    color: $blue-8;
    fill: currentColor;
    stroke-width: 2;
  }

  &__mouth--disabled {
    filter: blur(10px);
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    align-content: center;
    justify-content: center;
    justify-items: center;
  }

  &__select-serve {
    z-index: 2;
    position: absolute;
    color: $primary;
    top: 35%;
    right: 30%;
    padding: 3rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(5.6px);
    -webkit-backdrop-filter: blur(5.6px);
    border: 1px solid rgba(255, 255, 255, 0.89);
  }

  &__select-serve-text {
    z-index: 2;
    font-family: 'IranSans', serif;
    font-size: 24px;
  }

  &__error {
    z-index: 2;
    position: absolute;
    color: $primary;
    top: 35%;
    right: 40%;
    padding: 3rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(5.6px);
    -webkit-backdrop-filter: blur(5.6px);
    border: 1px solid rgba(255, 255, 255, 0.89);
  }
}

@include media-breakpoint-down(sm) {
  .tpt {
    :deep(.q-card__section) {
      padding: 0 !important;
    }
  }

  .tpt__select-serve {
    z-index: 9999;
    position: absolute;
    color: $primary;
    top: 0;
    right: 0;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(5.6px);
    -webkit-backdrop-filter: blur(5.6px);
    border: 1px solid rgba(255, 255, 255, 0.89);
  }
}
</style>
