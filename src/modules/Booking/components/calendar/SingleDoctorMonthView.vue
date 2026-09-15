<template>
  <div class="single-month" dir="rtl">
    <div class="single-month__day-names">
      <div v-for="name in DAY_NAMES" :key="name" class="single-month__day-name">
        <span
          class="single-month__day-name-label"
          :class="{ 'single-month__day-name-label--active': name === todayDayName }"
        >
          {{ name }}
        </span>
      </div>
    </div>

    <Transition :name="transitDir">
      <div :key="currentDate" class="single-month__month-grid">
        <div v-for="(week, wi) in monthWeeks" :key="wi" class="single-month__week-row">
          <div
            v-for="day in week"
            :key="day.date"
            class="single-month__cell"
            :class="{
              'single-month__cell--out-of-month': !day.isCurrentMonth,
              'single-month__cell--today': day.isToday,
              'single-month__cell--vacation': day.isVacation,
            }"
            @click="onDayClick(day)"
          >
            <div class="single-month__cell-top">
              <Typography
                variant="body"
                size="4"
                weight="medium"
                class="single-month__day-num"
                :class="{ 'single-month__day-num--circle': day.isToday }"
              >
                {{ day.dayNumber }}
              </Typography>
              <Typography
                v-if="day.vacationTitle"
                variant="caption"
                color="red"
                class="single-month__vac-label"
              >
                {{ day.vacationTitle }}
              </Typography>
            </div>

            <SlotCard
              v-if="sessionFor(day.date)"
              :slot-data="sessionFor(day.date).slot"
              :color="doctorColor"
              @click="onSlotClick(sessionFor(day.date))"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { DAY_NAMES, getJalaliDayName } from '../../composables/useCalendar'
import Typography from '@/base/Typography'
import SlotCard from './SlotCard'

const props = defineProps({
  monthWeeks: { type: Array, default: () => [] },
  currentDate: { type: [Date, String, Object], required: true },
  transitDir: { type: String, default: '' },
  sessions: { type: Array, default: () => [] },
  doctorColor: { type: String, default: 'blue' },
  today: { type: [Date, String], required: true },
})
const emit = defineEmits(['day-click', 'slot-click', 'go-week', 'go-day'])

function onSlotClick(session) {
  emit('slot-click', session)
  emit('go-day', session.date)
}

function onDayClick(day) {
  emit('day-click', day)
  emit('go-day', day.date)
}

const todayDayName = computed(() => getJalaliDayName(props.today))

function sessionFor(date) {
  return props.sessions.find((s) => s.date === date) ?? null
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/calendar/transitions';

.single-month {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__day-names {
    display: grid;
    grid-template-columns: repeat(7, minmax(120px, 1fr));
    background: #fff;
    border-bottom: 0.5px solid $grey-4;
    flex-shrink: 0;
  }

  &__day-name {
    padding: 4px 0;
    font-size: 12px;
    font-weight: 500;
    color: $grey-6;
    text-align: center;
    border-left: 0.5px solid $grey-3;
    display: flex;
    align-items: center;
    justify-content: center;

    &:last-child {
      border-left: none;
    }
  }

  &__day-name-label {
    padding: $spacing-xs;
    border-radius: $radius-xs;
    user-select: none;

    &--active {
      color: $blue-7;
      background: $blue-1;
      width: 98%;
    }
  }

  &__month-grid {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }

  &__week-row {
    display: grid;
    grid-template-columns: repeat(7, minmax(120px, 1fr));
    flex: 1;
    border-bottom: 0.5px solid $grey-4;
    min-height: 130px;
  }

  &__cell {
    border-left: 0.5px solid $grey-4;
    padding: $spacing-xxs;
    cursor: pointer;
    background: #fff;
    transition: background 0.1s;
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow: hidden;

    &:last-child {
      border-left: none;
    }

    &:hover {
      background: $grey-1;
    }

    &--out-of-month {
      background: $grey-2;

      .single-month__day-num {
        color: $grey-5;
      }
    }

    &--vacation {
      background: $red-1;
    }
  }

  &__cell-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  &__day-num {
    min-width: 26px;
    height: 26px;
    border-radius: $radius-round;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &--circle {
      background: $blue-7;
      color: #fff;
    }
  }

  &__vac-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 65%;
  }
}
</style>
