<template>
  <div class="multi-week" dir="rtl">
    <div class="multi-week__scroll">
      <div class="multi-week__header">
        <div class="multi-week__doc-corner" />
        <div v-for="day in weekDays" :key="day.date" class="multi-week__col-hdr">
          <span
            class="multi-week__col-hdr-inner"
            :class="{ 'multi-week__col-hdr-inner--today': day.isToday }"
          >
            <template v-if="!day.isToday">
              <Typography
                variant="body"
                size="4"
                weight="medium"
                color="grey"
                class="multi-week__hdr-num"
              >
                {{ day.dayNumber }}
              </Typography>
              <Typography variant="caption" color="grey" class="multi-week__hdr-name">
                - {{ day.dayName }}
              </Typography>
            </template>
            <template v-else>
              <div class="multi-week__today-circle">{{ day.dayNumber }}</div>
              <Typography
                variant="caption"
                color="blue"
                weight="bold"
                class="multi-week__hdr-name multi-week__today-name"
              >
                - {{ day.dayName }}
              </Typography>
            </template>
          </span>
        </div>
      </div>

      <Transition :name="transitDir">
        <div :key="currentDate" class="multi-week__body">
          <template v-for="doc in sortedDoctors" :key="doc.id">
            <div class="multi-week__doc-label">
              <div
                class="multi-week__doc-card"
                :class="`multi-week__doc-card--color-${doc.color}`"
                @click.stop="$emit('select-doctor', doc.id)"
              >
                <Typography variant="body" size="3" weight="medium" class="multi-week__doc-name">
                  {{ doc.name }}
                </Typography>
                <Typography variant="body" size="4" weight="medium" class="multi-week__doc-count">
                  <IconUsers :size="14" />
                  <span>
                    {{ doc.totalBookingsCount }}
                  </span>
                </Typography>
              </div>
            </div>
            <div
              v-for="day in weekDays"
              :key="`${doc.id}-${day.date}`"
              class="multi-week__cell"
              :class="{
                'multi-week__cell--today-col': day.isToday,
                'multi-week__cell--disabled': !isDoctorWorkingDay(doc.id, day.dow),
              }"
              @click="
                isDoctorWorkingDay(doc.id, day.dow) && $emit('day-click', { doctor: doc, day })
              "
            >
              <SlotCard
                v-if="sessionOn(doc.id, day.date)"
                :slot-data="sessionOn(doc.id, day.date).slot"
                :color="doc.color"
                @click="$emit('day-click', { doctor: doc, day })"
              />
            </div>
          </template>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Typography from '@/base/Typography'
import SlotCard from './SlotCard'
import { IconUsers } from '@tabler/icons-vue'

const props = defineProps({
  weekDays: { type: Array, default: () => [] },
  currentDate: { type: [Date, String, Object], required: true },
  transitDir: { type: String, default: '' },
  doctors: { type: Array, default: () => [] },
  sessions: { type: Array, default: () => [] },
  doctorsWorkingHours: { type: Object, default: () => ({}) },
})
defineEmits(['day-click', 'select-doctor'])

const sortedDoctors = computed(() =>
  [...props.doctors].sort((a, b) => (b.totalBookingsCount ?? 0) - (a.totalBookingsCount ?? 0))
)

function sessionOn(doctorId, date) {
  return props.sessions.find((s) => s.doctorId === doctorId && s.date === date) ?? null
}

function isDoctorWorkingDay(doctorId, dow) {
  const wh = props.doctorsWorkingHours[doctorId]
  if (!wh || wh.length === 0) return true
  return wh.some((w) => w.dayOfWeek === dow)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/calendar/transitions';
@use '@/assets/styles/calendar/color-variants';

$doc-col-width: 152px;
$grid-cols: $doc-col-width repeat(7, minmax(128px, 1fr));

.multi-week {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &__scroll {
    flex: 1;
    overflow: auto;
  }

  &__header {
    display: grid;
    grid-template-columns: $grid-cols;
    position: sticky;
    top: 0;
    z-index: 10;
    background: #fff;
    border-bottom: 0.5px solid $grey-4;
  }

  &__doc-corner {
    height: 52px;
    position: sticky;
    right: 0;
    z-index: 11;
    background: #fff;
    border-left: 0.5px solid $grey-4;
  }

  &__col-hdr {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 0;
    border-right: 0.5px solid $grey-3;
    border-left: 0.5px solid $grey-3;
  }

  &__col-hdr-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    padding: $spacing-xs;
    border-radius: $radius-xs;
    user-select: none;

    &--today {
      background: rgba($blue-7, 0.06);
      width: 98%;
      height: 100%;
    }
  }

  &__hdr-name {
    display: inline-block;
  }

  &__hdr-num {
    display: inline-block;
  }

  &__today-name {
    color: $blue-7;
  }

  &__today-circle {
    width: 28px;
    height: 28px;
    background: $blue-7;
    color: #fff;
    border-radius: $radius-round;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 500;
  }

  &__body {
    display: grid;
    grid-template-columns: $grid-cols;
  }

  &__doc-label {
    height: 108px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-xs;
    border-bottom: 0.5px solid $grey-3;
    border-left: 0.5px solid $grey-4;
    position: sticky;
    right: 0;
    z-index: 5;
    background: #fff;
    box-sizing: border-box;
  }

  &__doc-card {
    width: 100%;
    height: 100%;
    border-radius: 10px;
    border: 1px solid transparent;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: $spacing-sm;
    cursor: pointer;

    @include color-variants.apply;
  }

  &__doc-name {
    align-self: flex-start;
  }

  &__doc-count {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    background: #fff;
    border-radius: $radius-xl;
    padding: $spacing-xxs $spacing-md;
    align-self: flex-end;

    span {
      color: $dark;
    }
  }

  &__cell {
    height: 108px;
    border-right: 0.5px solid $grey-3;
    border-bottom: 0.5px solid $grey-3;
    padding: $spacing-xs;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: #fff;
    transition: background 0.1s;

    &:hover {
      background: $grey-1;
    }

    &--today-col {
      background: rgba($blue-7, 0.03);
    }

    &--disabled {
      background: $grey-2;
      cursor: not-allowed;
      opacity: 0.5;
    }
  }
}
</style>
