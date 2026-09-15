<template>
  <div class="utpt">
    <div class="utpt__container">
      <div class="utpt__header">
        <QTabs
          v-model="tab"
          dense
          active-color="primary"
          indicator-color="primary"
          narrow-indicator
          align="left"
          class="utpt__nav"
        >
          <QTab name="general" label="اطلاعات کلی" />
          <!--          <QTab name="treatment-plans" label="شرح درمان" />-->
          <QTab name="notes" label="توضیحات" />
          <QTab name="doctor-review" label="بررسی پزشکی" />
        </QTabs>

        <QSeparator color="grey-6" />
      </div>

      <QTabPanels v-model="tab" animated class="utpt__panels">
        <QTabPanel name="general" class="utpt__panel">
          <div class="utpt__general">
            <div class="col-12 col-sm-4">
              <div class="utpt__section-title">ارزیابی مالی</div>

              <div class="utpt__financial-evaluation">
                <div class="utpt__checkboxes">
                  <div class="col-md-6 col-12">
                    <QCheckbox :model-value="!!plan.creditStatus" disable label="اعتبارسنجی" />
                  </div>
                  <div class="col-md-6 col-12">
                    <QCheckbox
                      :model-value="(plan.prepay && plan.prepay > 0) || false"
                      disable
                      label="بیعانه"
                    />
                    <QTooltip
                      v-if="plan.prepay && plan.prepay > 0"
                      class="text-subtitle2 bg-yellow-7 text-black"
                    >
                      {{ generatePriceFormat(plan.prepay) }}
                    </QTooltip>
                  </div>
                  <div class="col-md-6 col-12">
                    <QCheckbox
                      :model-value="
                        (plan.financialFiles && plan.financialFiles.length > 0) || false
                      "
                      disable
                      label="مدرک مالی"
                    />
                  </div>
                  <div class="col-md-6 col-12">
                    <QCheckbox :model-value="!!plan.consent" disable label="رضایتنامه" />
                  </div>
                </div>
              </div>
            </div>
            <div class="col-12 col-sm-8">
              <div class="utpt__section-title">جزئیات پرداخت</div>

              <div class="utpt__payment-details">
                <div v-for="item in paymentDetails" :key="item.label" class="utpt__payment-item">
                  <div class="utpt__payment-label">
                    {{ item.label }}
                  </div>
                  <div class="utpt__payment-value">
                    {{ item.value }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </QTabPanel>

        <!--        <QTabPanel name="treatment-plans" class="utpt__panel">-->
        <!--          <UserTpDescription :plan="plan" />-->
        <!--        </QTabPanel>-->

        <QTabPanel name="notes" class="utpt__panel">
          <div class="utpt__notes">
            <div class="utpt__notes-content">
              <div v-if="plan.description" class="utpt__notes-text">
                {{ plan.description }}
              </div>
              <div v-else class="utpt__notes-empty">توضیحاتی وجود ندارد.</div>
            </div>
            <QSeparator
              v-if="plan.voices && plan.voices.length > 0"
              spaced="md"
              color="secondary"
            />
            <div class="utpt__voices">
              <AudioRecorder :voices="plan.voices || []" :recordable="false" />
            </div>
          </div>
        </QTabPanel>
        <QTabPanel name="doctor-review" class="utpt__panel">
          <DoctorReview :plan="plan" />
        </QTabPanel>
      </QTabPanels>
    </div>
  </div>
</template>
<script setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue'
// import UserTpDescription from './UserTpDescription'
import { generatePriceFormat } from '@/utils/formatter'

const AudioRecorder = defineAsyncComponent(() => import('@/components/AudioRecorder'))
const DoctorReview = defineAsyncComponent(
  () => import('@/modules/User/components/UserDetails/UserDetailsComponents/UserTp/DoctorReview')
)

const { plan } = defineProps({
  plan: {
    type: Object,
    default: () => ({}),
  },
})
const emit = defineEmits(['toggle:review'])
const tab = ref('general')

const paymentDetails = computed(() => [
  {
    label: 'تعداد اقساط',
    value: plan.installmentCount || 0,
  },
  {
    label: 'مبلغ اقساط',
    value: plan.installment?.id
      ? generatePriceFormat(plan.installment_price || plan.installmentPrice)
      : 'نقد',
  },
  {
    label: 'پیش پرداخت',
    value:
      plan?.prepayment && plan?.prepayment > 0 ? generatePriceFormat(plan.prepayment) : 'ندارد',
  },
  {
    label: 'مبلغ کل',
    value: generatePriceFormat(plan.totalCost),
  },
])

watch(
  () => tab.value,
  (newVal) => {
    if (newVal === 'doctor-review') {
      emit('toggle:review', { visible: true, id: plan.id })
    } else emit('toggle:review', { visible: false, id: plan.id })
  }
)
</script>
<style scoped lang="scss">
.utpt {
  padding: $spacing-md;

  &__container {
    gap: $spacing-md;
    display: flex;
    flex-direction: column;
  }

  &__panels {
    background-color: transparent !important;
    width: 100%;
  }

  &__panel {
    padding: 0;
  }

  &__general {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: $spacing-md;
    margin-bottom: $spacing-sm;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  &__section-title {
    margin-bottom: $spacing-xs;
    font-weight: bold;
  }

  &__financial-evaluation {
    padding: $spacing-sm;
    background-color: white;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__checkboxes {
    display: flex;
    gap: 0 $spacing-3xl;
    font-weight: 500;
    flex: 0 0 90%;
    font-size: map-get($body2, size);
    flex-wrap: wrap;
    justify-content: start;
  }

  &__payment-details {
    padding: $spacing-sm;
    background-color: white;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: $spacing-md;
    min-height: 80px;
  }

  &__payment-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 120px;
  }

  &__payment-label {
    font-size: map-get($subtitle1, size);
    font-weight: 500;
    margin-bottom: $spacing-xs;
    white-space: nowrap;
    color: $grey-6;
  }

  &__payment-value {
    font-size: map-get($subtitle1, size);
    font-weight: 500;
  }

  &__description {
    &-content {
      font-size: map-get($h6, size);
    }
  }

  &__notes {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    margin-bottom: $spacing-sm;
    background-color: white;

    &-content {
      padding: $spacing-md;
      background-color: white;
      min-height: 120px;
      border-radius: 8px;
    }

    &-text {
      font-size: map-get($body2, size);
    }

    &-empty {
      color: $grey-6;
    }
  }
  &__voices {
    background-color: $white;
    padding: 0 $spacing-md $spacing-md $spacing-md;
    border-radius: 8px;
  }
}
</style>
