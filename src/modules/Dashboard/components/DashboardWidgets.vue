<template>
  <div class="dashboard-widgets">
    <div class="dashboard-widgets__item">
      <QCard class="dashboard-widgets__card">
        <QLinearProgress
          v-if="isLoading"
          indeterminate
          color="primary"
          class="dashboard-widgets__loading"
        />
        <span class="dashboard-widgets__icon dashboard-widgets__icon--success">
          <IconUser :size="40" />
        </span>
        <QCardSection class="dashboard-widgets__content">
          <p class="dashboard-widgets__label">کاربران جدید</p>
          <h2 class="dashboard-widgets__value">{{ data?.usersWidget?.cols[0]?.value }}</h2>
          <div class="dashboard-widgets__details">
            <h3 class="dashboard-widgets__detail dashboard-widgets__detail--primary">
              {{ data?.usersWidget?.cols[1]?.value }} {{ data?.usersWidget?.cols[1]?.label }}
            </h3>
            <h4 class="dashboard-widgets__detail dashboard-widgets__detail--secondary">
              {{ data?.usersWidget?.cols[2]?.value }} {{ data?.usersWidget?.cols[2]?.label }}
            </h4>
          </div>
        </QCardSection>
      </QCard>
    </div>
    <div class="dashboard-widgets__item">
      <QCard class="dashboard-widgets__card">
        <QLinearProgress
          v-if="isLoading"
          indeterminate
          color="primary"
          class="dashboard-widgets__loading"
        />
        <span class="dashboard-widgets__icon dashboard-widgets__icon--info">
          <IconPhone :size="40" />
        </span>
        <QCardSection class="dashboard-widgets__content">
          <p class="dashboard-widgets__label">تماس ها</p>
          <h2 class="dashboard-widgets__value">{{ data?.contactsResultWidget?.cols[0]?.value }}</h2>
          <div class="dashboard-widgets__details">
            <h3 class="dashboard-widgets__detail dashboard-widgets__detail--primary">
              {{ data?.contactsResultWidget?.cols[1]?.value }}
              {{ data?.contactsResultWidget?.cols[1]?.label }}
            </h3>
          </div>
        </QCardSection>
      </QCard>
    </div>
    <div class="dashboard-widgets__item">
      <QCard class="dashboard-widgets__card">
        <QLinearProgress
          v-if="isLoading"
          indeterminate
          color="primary"
          class="dashboard-widgets__loading"
        />
        <span class="dashboard-widgets__icon dashboard-widgets__icon--primary">
          <IconCalendar :size="40" />
        </span>
        <QCardSection class="dashboard-widgets__content">
          <p class="dashboard-widgets__label">نوبت ها</p>
          <h2 class="dashboard-widgets__value">{{ data?.bookingWidget?.cols[0]?.value }}</h2>
        </QCardSection>
      </QCard>
    </div>
    <div class="dashboard-widgets__item">
      <QCard class="dashboard-widgets__card">
        <QLinearProgress
          v-if="isLoading"
          indeterminate
          color="primary"
          class="dashboard-widgets__loading"
        />
        <span class="dashboard-widgets__icon dashboard-widgets__icon--warning">
          <IconChecklist :size="40" />
        </span>
        <QCardSection class="dashboard-widgets__content">
          <p class="dashboard-widgets__label">وظایف</p>
          <h2 class="dashboard-widgets__value">{{ data?.taskWidget?.cols[0]?.value }}</h2>
        </QCardSection>
      </QCard>
    </div>
    <!-- <template v-if="sitakLoading">
      <div v-for="(_, index) in 4" :key="index" class="dashboard-widgets__item">
        <QCard class="dashboard-widgets__card">
          <QLinearProgress indeterminate color="primary" class="dashboard-widgets__loading" />
          <QCardSection class="dashboard-widgets__content dashboard-widgets__content--skeleton" />
        </QCard>
      </div>
    </template>
    <div v-for="(item, index) in sitakReportData" :key="index" class="dashboard-widgets__item">
      <QCard class="dashboard-widgets__card">
        <span
          :class="[
            'dashboard-widgets__icon',
            `dashboard-widgets__icon--${item?.cols[0]?.meta?.color || 'warning'}`,
          ]"
        >
          <IconPhone :size="40" />
        </span>
        <QCardSection class="dashboard-widgets__content">
          <p class="dashboard-widgets__label">
            {{ item?.cols[0].label }}
            <QTooltip v-if="item.description" :label="item.description">
              <IconInfoCircle :size="18" />
            </QTooltip>
          </p>
          <h2 class="dashboard-widgets__value">{{ item?.cols[0]?.value }}</h2>
        </QCardSection>
      </QCard>
    </div> -->
  </div>
</template>

<script setup>
import { IconUser, IconPhone, IconCalendar, IconChecklist } from '@tabler/icons-vue'
import { useGetWidgetQuery } from '../query'
import { computed } from 'vue'

const props = defineProps({
  start: {
    type: String,
    default: null,
  },
  end: {
    type: String,
    default: null,
  },
})

const filters = computed(() => {
  return {
    reports: 'contacts_result_widget,users_widget,task_widget,booking_widget',
    'filter[startDate]': props.start || undefined,
    'filter[endDate]': props.end || undefined,
  }
})
// const reportSitakFilters = computed(() => ({
//   reports:
//     'sitra_useful_input_per_total_call,sitra_sum_useful_input_call,sitra_avg_call_duration,sitra_sum_output_call_duration,sitra_avg_output_call_duration,sitra_widget_call,sitra_useful_call,sitra_call_per_useful,sitra_input_call,sitra_input_useful_call',
//   'filter[startDate]': props.start || undefined,
//   'filter[endDate]': props.end || undefined,
// }))

const { data, isLoading } = useGetWidgetQuery(filters)
// const { data: sitakReportData, isLoading: sitakLoading } = useGetWidgetQuery(reportSitakFilters)
</script>

<style scoped lang="scss">
@use 'sass:color';

@mixin card-icon-variant($color: $primary) {
  box-shadow:
    0 4px 20px 0 rgba(0, 0, 0, 0.14),
    0 7px 10px -5px rgba($color, 0.4);
  background: linear-gradient(60deg, $color, color.adjust($color, $lightness: 10%));
}

.dashboard-widgets {
  display: flex;
  flex-wrap: wrap;
  margin: -0.75rem;

  &__item {
    flex: 0 0 25%;
    max-width: 25%;
    padding: 0.75rem;

    @media (max-width: $breakpoint-md) {
      flex: 0 0 100%;
      max-width: 100%;
    }
  }

  &__card {
    position: relative;
    overflow: visible;
    margin-top: 15px;
    min-height: 200px;
  }

  &__loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
  }

  &__icon {
    position: absolute;
    top: -15px;
    left: 10px;
    border-radius: 3px;
    background-color: $grey-6;
    padding: 10px;
    color: $white;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 66px;
    height: 66px;

    &--primary {
      @include card-icon-variant($primary);
    }

    &--warning {
      @include card-icon-variant($warning);
    }

    &--success {
      @include card-icon-variant($green);
    }

    &--info {
      @include card-icon-variant($info);
    }

    &--danger {
      @include card-icon-variant($negative);
    }
  }

  &__content {
    padding: 1rem;

    &--skeleton {
      min-height: 100px;
    }
  }

  &__label {
    font-size: 0.875rem;
    margin-bottom: 0;
    color: $grey-7;
  }

  &__value {
    font-size: 2rem;
    margin: 1.25rem 0 0 0;
    font-weight: 500;
    color: $grey-9;
  }

  &__details {
    display: flex;
    margin-top: 1rem;
  }

  &__detail {
    font-size: 0.75rem;
    margin: 0;

    &--primary {
      color: $pink-6;
    }

    &--secondary {
      color: $purple-6;
      margin-right: auto;
    }
  }
}
</style>
