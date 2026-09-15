<template>
  <div class="multi-month" dir="rtl">
    <div class="multi-month__day-names">
      <div
        v-for="name in DAY_NAMES"
        :key="name"
        class="multi-month__day-name"
        :class="{ 'multi-month__day-name--active': name === todayDayName }"
      >
        {{ name }}
      </div>
    </div>

    <Transition :name="transitDir">
      <div :key="currentDate" class="multi-month__month-grid">
        <div v-for="(week, wi) in monthWeeks" :key="wi" class="multi-month__week-row">
          <div
            v-for="day in week"
            :key="day.date"
            class="multi-month__cell"
            :class="{
              'multi-month__cell--out-of-month': !day.isCurrentMonth,
              'multi-month__cell--today': day.isToday,
              'multi-month__cell--vacation': day.isVacation,
            }"
            @click="$emit('day-click', day)"
          >
            <div class="multi-month__cell-top">
              <Typography
                variant="body"
                size="4"
                weight="medium"
                class="multi-month__day-num"
                :class="{ 'multi-month__day-num--circle': day.isToday }"
              >
                {{ day.dayNumber }}
              </Typography>
              <Typography
                v-if="day.vacationTitle"
                variant="caption"
                color="red"
                class="multi-month__vac-label"
              >
                {{ day.vacationTitle }}
              </Typography>
            </div>

            <div class="multi-month__sessions">
              <SlotCard
                v-for="session in sessionsOnDate(day.date)"
                :key="session.id"
                :slot-data="session.slot"
                :color="doctorColor(session.doctorId)"
                :doctor-name="getDoctorName(session.doctorId)"
                @click="onSlotCardClick(session)"
              />
            </div>
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
  today: { type: [Date, String], required: true },
  doctors: { type: Array, default: () => [] },
  sessions: { type: Array, default: () => [] },
})
const emit = defineEmits(['day-click', 'slot-click', 'select-doctor'])

function onSlotCardClick(session) {
  emit('select-doctor', session.doctorId)
}

const todayDayName = computed(() => getJalaliDayName(props.today))

function sessionsOnDate(date) {
  return props.sessions.filter((s) => s.date === date)
}

function doctorColor(doctorId) {
  return props.doctors.find((d) => d.id === doctorId)?.color ?? 'blue'
}

function getDoctorName(doctorId) {
  return props.doctors.find((d) => d.id === doctorId)?.name ?? ''
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/calendar/transitions';

.multi-month {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__day-names {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: #fff;
    border-bottom: 0.5px solid $grey-4;
    flex-shrink: 0;
  }

  &__day-name {
    padding: 10px 0;
    font-size: 12px;
    font-weight: 500;
    color: $grey-6;
    text-align: center;
    border-left: 0.5px solid $grey-3;

    &:last-child {
      border-left: none;
    }

    &--active {
      color: $blue-7;
    }
  }

  &__month-grid {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  &__week-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    flex: 1;
    border-bottom: 0.5px solid $grey-4;
    min-height: 130px;
  }

  &__cell {
    border-left: 0.5px solid $grey-4;
    padding: $spacing-sm;
    cursor: pointer;
    background: #fff;
    transition: background 0.1s;
    display: flex;
    flex-direction: column;
    gap: 5px;
    overflow-y: auto;

    &:last-child {
      border-left: none;
    }

    &:hover {
      background: $grey-1;
    }

    &--out-of-month {
      background: $grey-2;

      .multi-month__day-num {
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

  &__sessions {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    overflow-y: auto;
  }
}
</style>
