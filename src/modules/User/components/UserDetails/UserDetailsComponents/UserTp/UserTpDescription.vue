<template>
  <div class="user-treatment-plan-description">
    <div class="treatment-plan-cards">
      <div class="treatment-plan-card">
        <div class="treatment-plan-card__header">
          <div class="treatment-plan-card__date">
            <span>کشیدن دندان (۱۴۰۴)</span>
          </div>
          <div class="treatment-plan-card__time">
            <QIcon name="delete" size="sm" color="negative" />
            ۱۲:۳۱
          </div>
        </div>

        <div class="treatment-plan-card__content">
          <div class="treatment-plan-sections">
            <!-- Cost Section  -->
            <div class="treatment-plan-section">
              <div class="treatment-plan-section__title">هزینه</div>
              <div class="cost-breakdown">
                <div class="cost-item">
                  <span class="cost-label">مبلغ قابل پرداخت</span>
                  <span class="cost-value">۳۳,۰۰۰,۰۰۰ تومان</span>
                </div>
                <div class="cost-item total">
                  <span class="cost-label">مبلغ کل</span>
                  <span class="cost-value">۳۳,۰۰۰,۰۰۰ تومان</span>
                </div>
              </div>
            </div>

            <!-- Tooth Chart Section -->
            <div class="treatment-plan-section">
              <div class="treatment-plan-section__title">دندان‌ها</div>
              <div class="tooth-chart">
                <div class="tooth-grid">
                  <div
                    v-for="tooth in treatmentTeethSecond"
                    :key="tooth.id"
                    class="tooth-box-wrapper"
                  >
                    <div class="tooth-box" :class="getToothBoxClass(tooth.type)">
                      <div class="tooth-box__content">
                        <div class="tooth-box__number">{{ tooth.number }}</div>
                      </div>
                    </div>
                    <div class="tooth-box-wrapper_type text-body2 text-weight-regular">
                      {{ tooth.type.toUpperCase() }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Staff Section -->
            <div class="treatment-plan-section">
              <div class="treatment-plan-section__header">
                <div class="treatment-plan-section__title">نفرات</div>
                <div class="treatment-plan-card__expand-btn">
                  <QBtn flat round icon="expand_more" size="sm" />
                </div>
              </div>

              <div class="treatment-plan-staff">
                <div class="staff-member">
                  <QAvatar size="32px">
                    <img src="https://cdn.quasar.dev/img/avatar2.jpg" />
                  </QAvatar>
                  <div class="staff-info">
                    <div class="staff-name">طاهره رحمانی</div>
                    <div class="staff-role">تنظیم کننده</div>
                  </div>
                </div>
                <div class="staff-member">
                  <QAvatar size="32px">
                    <img src="https://cdn.quasar.dev/img/avatar3.jpg" />
                  </QAvatar>
                  <div class="staff-info">
                    <div class="staff-name">شفیعی</div>
                    <div class="staff-role">پزشک</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// const { plan } = defineProps({
//   plan: {
//     type: Object,
//     default: () => ({}),
//   },
// })

const treatmentTeethSecond = [
  { id: 1, type: 'tr', number: 4 },
  { id: 2, type: 'tr', number: 4 },
  { id: 3, type: 'bl', number: 5 },
  { id: 4, type: 'br', number: 6 },
  { id: 5, type: 'br', number: 7 },
  { id: 6, type: 'tl', number: 3 },
]

const getToothBoxClass = (type) => {
  return `tooth-box--${type}`
}
</script>

<style scoped lang="scss">
.user-treatment-plan-description {
  .treatment-plan-cards {
    display: flex;
    flex-direction: column;
    gap: map-get($space-md, x);
  }

  .treatment-plan-card {
    background: white;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    overflow: hidden;

    &__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: map-get($space-sm, x) map-get($space-md, x);
    }

    &__date,
    &__time {
      display: flex;
      align-items: center;
      gap: map-get($space-xs, x);
      font-size: map-get($body2, size);
      color: $grey-7;
    }

    &__content {
      position: relative;
      padding: map-get($space-md, x);
      border: 1px solid #e0e0e0;
      margin: map-get($space-md, x);
      border-radius: 8px;
    }
  }

  .treatment-plan-sections {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: map-get($space-lg, x);

    @media (max-width: 968px) {
      grid-template-columns: 1fr;
      gap: map-get($space-md, x);
    }
  }

  .treatment-plan-section {
    &__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: map-get($space-xs, x);
    }
    &__title {
      font-weight: 600;
      font-size: map-get($subtitle1, size);
      margin-bottom: map-get($space-sm, x);
      color: $grey-8;
    }
  }

  // Staff Section
  .treatment-plan-staff {
    display: flex;
    gap: map-get($space-sm, x);
  }

  .staff-member {
    display: flex;
    align-items: center;
    gap: map-get($space-sm, x);
  }

  .staff-info {
    display: flex;
    flex-direction: column;
  }

  .staff-name {
    font-weight: 500;
    font-size: map-get($body2, size);
  }

  .staff-role {
    font-size: map-get($caption, size);
    color: $grey-6;
  }

  // Tooth Chart
  .tooth-chart {
    display: flex;
    flex-direction: column;
    gap: map-get($space-xs, x);
    align-items: center;
  }

  .tooth-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(30px, 1fr));
    gap: map-get($space-sm, x);
    max-width: 400px;
  }
  .tooth-box-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    &__type {
      line-height: 1;
      margin: 50px;
      color: $grey-6;
      font-size: map-get($caption, size);
      text-align: center;
    }
  }
  .tooth-box {
    width: 25px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    background-color: $blue-1;
    color: $blue-6;

    &__content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      width: 100%;
      height: 100%;
    }

    &__number {
      font-size: 14px;
      font-weight: 700;
      line-height: 1;
    }

    &--tr,
    &--tl,
    &--bl,
    &--br {
      &::before {
        content: '';
        position: absolute;
        width: calc(100% - 1px);
        height: calc(100% - 1px);
      }
    }

    &--tr::before {
      top: 1px;
      right: 1px;
      border-top: 2px solid $blue-6;
      border-right: 2px solid $blue-6;
    }

    &--tl::before {
      top: 1px;
      left: 1px;
      border-top: 2px solid $blue-6;
      border-left: 2px solid $blue-6;
    }

    &--bl::before {
      bottom: 1px;
      left: 1px;
      border-bottom: 2px solid $blue-6;
      border-left: 2px solid $blue-6;
    }

    &--br::before {
      bottom: 1px;
      right: 1px;
      border-bottom: 2px solid $blue-6;
      border-right: 2px solid $blue-6;
    }
  }

  // Cost Section
  .cost-breakdown {
    display: flex;
    gap: map-get($space-sm, x);
  }

  .cost-item {
    display: flex;
    flex-direction: column;
    gap: map-get($space-xs, x);
  }

  .cost-label {
    font-size: map-get($caption, size);
    color: $grey-6;
  }

  .cost-value {
    font-size: map-get($body2, size);
    font-weight: 500;
    color: $grey-8;
  }
}
</style>
