<template>
  <QCard flat bordered class="tpt">
    <QCardSection>
      <QInnerLoading :showing="isPending" />
      <div class="tpt__content">
        <svg
          id="teethSVG"
          :class="{ 'tpt__mouth--disabled': isLoading || isError || isPending }"
          viewBox="0 0 757 335"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M664.391 77.986L620.365 192.964C620.365 192.964 573.049 297.839 370.214 288.945C204.972 281.7 172.575 231.809 152.082 200.962C129.782 167.395 86.042 79.986 86.042 79.986C86.042 79.986 61.742 49.18 162.088 59.986C262.434 70.792 503.294 62.986 503.294 62.986C503.294 62.986 686.948 32.372 664.391 77.986Z"
            fill="#F6979C"
          />
          <path
            v-for="tooth of teeth"
            :key="tooth?.id"
            :d="tooth?.path"
            :class="[
              'tpt__tooth-svg',
              { 'tpt__tooth-svg--active': selectedServeTeeth?.teeth?.includes(tooth?.id) },
            ]"
            :fill="
              selectedServeTeeth?.teeth?.includes(tooth?.id) ? 'rgba(252,85,107,0.64)' : 'white'
            "
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
          <QBtn color="negative" :loading="isFetching" @click="refetch">تلاش مجدد</QBtn>
        </g>
      </div>
    </QCardSection>
  </QCard>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { teethSVG } from '../../constants/teeth-svg'
import { useTpProvider } from '../../composables/use-tp-provider'
import { useGetTreatmentPlanByKeyQuery } from '../../query'

const route = useRoute()

const { isLoading, refetch, isError, isPending, isFetching } = useGetTreatmentPlanByKeyQuery(
  route.params?.key
)

const { treatmentData, selectedServe } = useTpProvider(['treatmentData', 'selectedServe'])

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
      (item) => item?.serve.serveId === selectedServe.value?.serveId
    ) || null
)

const isShowSelectServe = computed(() => !selectedServe.value)
</script>

<style lang="scss" scoped>
.tpt {
  margin-top: 1rem;
  text-align: center;

  &__group--top {
    margin-bottom: 2rem;
    height: 40px;
  }

  &__group--bottom {
    margin-top: 2rem;
    height: 40px;
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
    fill: currentColor;
    stroke-width: 2;
    stroke: $white;
    z-index: 999;
  }

  &__tooth-svg--active {
    color: $blue-2;
    stroke: $white;
  }

  &__tooth-svg-number {
    cursor: pointer;
    transition: all 0.4s;
    color: $info;
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
