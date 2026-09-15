<template>
  <QCard class="tp-top-stepper" flat>
    <QCardSection class="tp-top-stepper__container">
      <template v-if="isLoading">
        <template v-for="(step, index) in skeletonSteps" :key="index">
          <div class="tp-top-stepper__step">
            <QSkeleton type="circle" size="40px" />
            <QSkeleton type="text" :width="step.labelWidth" />
          </div>
          <div
            v-if="index < skeletonSteps.length - 1"
            class="tp-top-stepper__connector tp-top-stepper__connector--skeleton"
          >
            <QSkeleton type="text" width="100%" height="2px" />
          </div>
        </template>
      </template>
      <template v-else>
        <div
          class="tp-top-stepper__step"
          :class="{
            'tp-top-stepper__step--active': currentStepNumber >= TREATMENT_PLAN_STEP.DRAFT,
            'tp-top-stepper__step--completed': currentStepNumber > TREATMENT_PLAN_STEP.DRAFT,
          }"
        >
          <div class="tp-top-stepper__step-circle">
            <IconCheck
              v-if="currentStepNumber > TREATMENT_PLAN_STEP.DRAFT"
              icon="tabler:check"
              size="25"
            />
            <span v-else>۱</span>
          </div>
          <div class="tp-top-stepper__step-label">پیش نویس</div>
        </div>

        <div
          class="tp-top-stepper__connector"
          :class="{
            'tp-top-stepper__connector--active': currentStepNumber > TREATMENT_PLAN_STEP.DRAFT,
          }"
        />

        <div
          class="tp-top-stepper__step"
          :class="{
            'tp-top-stepper__step--active': currentStepNumber >= TREATMENT_PLAN_STEP.PROPOSED,
            'tp-top-stepper__step--completed': currentStepNumber > TREATMENT_PLAN_STEP.PROPOSED,
          }"
        >
          <div class="tp-top-stepper__step-circle">
            <IconCheck
              v-if="currentStepNumber > TREATMENT_PLAN_STEP.PROPOSED"
              icon="tabler:check"
              size="25"
            />
            <span v-else>۲</span>
          </div>
          <div class="tp-top-stepper__step-label">
            طرح درمان

            <span
              v-if="!!isDraft && currentStepNumber === 1 && canCreateTreatmentPlan()"
              class="tp-top-stepper__step-approve-btn"
              @click="goToEditTreatmentPlan"
            >
              <QTooltip>انتقال پیش‌نویس به طرح درمان</QTooltip>
              <QSpinner v-if="isNavigating" color="primary" size="18px" />
              <IconInfoCircleFilled v-else stroke="1.5" size="18" />
              {{ isNavigating ? 'در حال انتقال...' : 'انتقال پیش‌نویس به طرح درمان' }}
            </span>

            <span
              v-else-if="!!isDraftPage && currentStepNumber > 1 && canCreateTreatmentPlan()"
              class="tp-top-stepper__step-approve-btn"
              @click="goToEditTreatmentPlan"
            >
              <QTooltip>ویرایش طرح درمان</QTooltip>
              <QSpinner v-if="isNavigating" color="primary" size="18px" />
              <IconInfoCircleFilled v-else stroke="1.5" size="18" />
              {{ isNavigating ? 'در حال انتقال...' : 'ویرایش طرح درمان' }}
            </span>

            <span v-else-if="!isDraft" class="tp-top-stepper__step-approved-btn">
              <IconCheck icon="tabler:check" size="16" />
              انتقال داده شد
            </span>
          </div>
        </div>
      </template>
    </QCardSection>
  </QCard>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useTpProvider } from '../../composables/use-tp-provider'
import { useRouter } from 'vue-router'
import { IconInfoCircleFilled, IconCheck } from '@tabler/icons-vue'
import { QSkeleton, QSpinner } from 'quasar'
import { useTpPermissions } from '../../composables/use-tp-permissions'
import { useTpStatus } from '../../composables/use-tp-status'
import { TREATMENT_PLAN_STEP } from '../../constants/enums'

const router = useRouter()
const treatmentData = useTpProvider('treatmentData')
const { currentStepNumber } = useTpStatus(treatmentData)

const { canCreateTreatmentPlan } = useTpPermissions()

const isNavigating = ref(false)
const isDraft = computed(() => treatmentData?.value?.isDraft)
const isDraftPage = computed(() => router.currentRoute.value.path.includes('draft'))
const isLoading = computed(
  () => currentStepNumber.value === null || currentStepNumber.value === undefined
)
const skeletonSteps = computed(() => [
  { name: 'پیش نویس', labelWidth: '60px' },
  { name: 'طرح درمان', labelWidth: '80px' },
])

const goToEditTreatmentPlan = () => {
  isNavigating.value = true
  router.push(`/treatment-plan/edit/${treatmentData?.value?.id}`)
}
</script>

<style lang="scss" scoped>
.tp-top-stepper {
  user-select: none;

  &__container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: map-get($space-xl, x);
    direction: rtl;
    padding: map-get($space-md, x) !important;
  }

  &__step {
    display: flex;
    align-items: center;
    gap: map-get($space-sm, x);

    &--active {
      .tp-top-stepper__step-circle {
        background-color: $blue-1;
        color: $blue-8;
        border-color: $blue-1;
      }

      .tp-top-stepper__step-label {
        color: $primary;
        font-weight: map-get($h6, weight);
      }
    }

    &--completed {
      .tp-top-stepper__step-circle {
        background-color: $green-1;
        border-color: $green-1;
        color: $green-8;
      }

      .tp-top-stepper__step-label {
        color: $green-8;
      }
    }
  }

  &__step-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $grey-3;
    font-weight: map-get($subtitle1, weight);
    font-size: map-get($subtitle1, size);
    border: 2px solid $grey-3;
    transition: all 0.3s ease;
  }

  &__step-label {
    font-size: map-get($subtitle1, size);
    font-weight: map-get($subtitle1, weight);
    white-space: nowrap;
    transition: color 0.3s ease;
  }

  &__step-approve-btn {
    margin-top: map-get($space-xs, x);
    gap: map-get($space-xs, x);
    align-items: center;
    display: flex;
    font-size: map-get($caption, size);
    font-weight: map-get($caption, weight);
    color: $primary;
    cursor: pointer;
    text-decoration: underline;
  }
  &__step-approved-btn {
    margin-top: map-get($space-xs, x);
    gap: map-get($space-xs, x);
    align-items: center;
    display: flex;
    font-size: map-get($caption, size);
    font-weight: map-get($caption, weight);
    background-color: $primary;
    color: $white;
    padding: map-get($space-xs, x) map-get($space-sm, x);
    border-radius: map-get($space-xl, x);
  }

  &__connector {
    flex: 1;
    height: 2px;
    background-color: $grey-1;
    min-width: 60px;
    transition: background-color 0.3s ease;

    &--active {
      background-color: $green-2;
    }

    &--skeleton {
      background-color: transparent;
      display: flex;
      align-items: center;
    }
  }

  @media (max-width: 1024px) {
    &__container {
      gap: map-get($space-lg, x);
    }

    &__step-label {
      font-size: map-get($body2, size);
    }

    &__connector {
      min-width: 50px;
    }
  }

  @media (max-width: $breakpoint-sm-max) {
    padding: map-get($space-sm, x);

    &__container {
      gap: map-get($space-md, x);
      flex-wrap: nowrap;
      overflow-x: auto;
      padding: map-get($space-xs, x) 0;
    }

    &__step {
      flex-shrink: 0;
      min-width: fit-content;
    }

    &__connector {
      min-width: 30px;
      flex-shrink: 0;
    }

    &__step-circle {
      width: 35px;
      height: 35px;
      font-size: map-get($caption, size);
    }

    &__step-label {
      font-size: map-get($caption, size);
      white-space: nowrap;
    }

    &__step-approve-btn {
      font-size: map-get($overline, size);
      margin-top: map-get($space-xs, x);
    }

    &__step-approved-btn {
      font-size: map-get($overline, size);
      margin-top: map-get($space-xs, x);
      padding: map-get($space-xs, x) map-get($space-xs, x);
    }
  }

  @media (max-width: 480px) {
    padding: map-get($space-xs, x);

    &__container {
      gap: map-get($space-sm, x);
    }

    &__step {
      flex-direction: column;
      text-align: center;
      gap: map-get($space-xs, x);
    }

    &__connector {
      min-width: 20px;
      align-self: flex-start;
      margin-top: 20px;
    }

    &__step-circle {
      width: 30px;
      height: 30px;
      font-size: map-get($overline, size);
    }

    &__step-label {
      font-size: map-get($overline, size);
      line-height: 1.2;
    }

    &__step-approve-btn,
    &__step-approved-btn {
      font-size: 10px;
      margin-top: map-get($space-xs, x);
    }

    &__step-approve-btn {
      flex-direction: column;
      gap: 2px;
    }
  }

  @media (max-width: 360px) {
    &__container {
      flex-direction: column;
      gap: map-get($space-md, x);
    }

    &__connector {
      display: none;
    }

    &__step {
      width: 100%;
      justify-content: center;
      position: relative;

      &:not(:last-child)::after {
        content: '';
        position: absolute;
        bottom: -#{map-get($space-sm, x)};
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: map-get($space-md, x);
        background-color: $grey-1;
      }

      &.tp-top-stepper__step--active:not(:last-child)::after,
      &.tp-top-stepper__step--completed:not(:last-child)::after {
        background-color: $green-2;
      }
    }

    &__step-circle {
      width: 40px;
      height: 40px;
      font-size: map-get($caption, size);
    }

    &__step-label {
      font-size: map-get($caption, size);
    }
  }
}
</style>
