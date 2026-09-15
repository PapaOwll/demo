<template>
  <div class="appointment-popup-trigger" @click.stop>
    <AppointmentCard
      :booking="booking"
      :color="color"
      :column-index="columnIndex"
      :column-count="columnCount"
      :side-by-side="sideBySide"
      :text-position="textPosition"
    />
    <QPopupProxy
      ref="popupRef"
      transition-show="scale"
      transition-hide="scale"
      :max-height="'none'"
      :max-width="'none'"
    >
      <div class="ap" @click.stop>
        <div class="ap__body">
          <div class="ap__section">
            <Typography variant="body" size="4" weight="medium" color="grey" class="ap__label">
              اطلاعات مراجع
            </Typography>
            <div class="ap__patient-row">
              <Typography
                variant="body"
                size="2"
                weight="bold"
                color="dark"
                class="ap__patient-name"
              >
                {{ customerName }}
              </Typography>
              <Typography
                v-if="booking?.cbctStatus === 'has'"
                variant="body"
                size="4"
                weight="medium"
                class="ap__badge-red"
              >
                CBCT
              </Typography>
            </div>
          </div>

          <div class="ap__section ap__section--date">
            <Typography variant="body" size="4" weight="medium" color="grey" class="ap__label">
              تاریخ نوبت
            </Typography>
            <div class="ap__date-row">
              <Typography variant="body" size="3" weight="semibold" color="dark">
                {{ bookingDateJalali }}
              </Typography>
              <IconCalendar :size="24" class="ap__icon" />
            </div>
            <div v-if="bookingTime" class="ap__time-row">
              <div class="ap__time-range">
                <Typography variant="body" size="2" weight="medium" color="dark-2">
                  {{ bookingTime }}
                </Typography>
                <Typography variant="body" size="4" color="grey">تا</Typography>
                <Typography variant="body" size="2" weight="medium" color="dark-2">
                  {{ bookingEndTime }}
                </Typography>
              </div>
              <div class="ap__divider-v" />
              <Typography variant="body" size="4" weight="medium" class="ap__badge-blue">
                {{ durationLabel }}
              </Typography>
            </div>
          </div>

          <div class="ap__section ap__section--cols">
            <div class="ap__col">
              <Typography variant="body" size="4" weight="medium" color="grey" class="ap__label">
                دکتر
              </Typography>
              <div class="ap__col-value-row">
                <Typography variant="body" size="3" weight="semibold" color="dark">
                  {{ doctorName }}
                </Typography>
                <IconUserSquareRounded :size="24" class="ap__icon" />
              </div>
            </div>

            <div class="ap__col-divider" />
            <div class="ap__col">
              <Typography variant="body" size="4" weight="medium" color="grey" class="ap__label">
                نوع مراجعه
              </Typography>
              <div class="ap__col-value-row">
                <Typography variant="body" size="3" weight="semibold" color="dark">
                  {{ visitTypeLabel }}
                </Typography>
                <IconClipboard :size="24" class="ap__icon" />
              </div>
            </div>
          </div>

          <div class="ap__section ap__section--services">
            <Typography variant="body" size="4" weight="medium" color="grey" class="ap__label">
              خدمات
            </Typography>
            <div class="ap__service-badges">
              <Typography
                v-for="serve in servesList"
                :key="serve.id"
                variant="body"
                size="4"
                weight="medium"
                class="ap__badge-blue"
              >
                {{ serve.title }}
              </Typography>
            </div>
          </div>
        </div>

        <div class="ap__footer">
          <Button
            variant="filled"
            color="light-blue"
            is-full-width
            :right-icon="IconArrowLeft"
            text="جزئیات نوبت"
            @click="goToDetail"
          />
        </div>
      </div>
    </QPopupProxy>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { convertToJalali } from '@/utils/date-utils'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import {
  getCustomerName,
  getBookingTimeRange,
  getDoctorName,
  getVisitTypeLabel,
} from '../../utils/bookingDisplay'
import {
  IconArrowLeft,
  IconCalendar,
  IconClipboard,
  IconUserSquareRounded,
} from '@tabler/icons-vue'
import AppointmentCard from './AppointmentCard'

const props = defineProps({
  booking: {
    type: Object,
    default: null,
  },
  color: {
    type: String,
    default: 'blue',
  },
  columnIndex: {
    type: Number,
    default: 0,
  },
  columnCount: {
    type: Number,
    default: 1,
  },
  sideBySide: {
    type: Boolean,
    default: false,
  },
  textPosition: {
    type: String,
    default: 'top',
  },
})

const emit = defineEmits(['detail'])

const popupRef = ref(null)

const customerName = computed(() => getCustomerName(props.booking))

const bookingDateJalali = computed(() => {
  if (!props.booking?.bookingAt) return ''
  return convertToJalali(props.booking.bookingAt, 'jdddd، jD jMMMM، jYYYY')
})

const bookingTime = computed(() => getBookingTimeRange(props.booking).time)

const bookingEndTime = computed(() => getBookingTimeRange(props.booking).endTime)

const durationLabel = computed(() => {
  if (!bookingTime.value || !bookingEndTime.value) return ''
  const [h1, m1] = bookingTime.value.split(':').map(Number)
  const [h2, m2] = bookingEndTime.value.split(':').map(Number)
  const diffMin = Math.abs(h2 * 60 + m2 - h1 * 60 - m1)
  if (diffMin < 60) return `${diffMin} دقیقه`
  const hours = Math.floor(diffMin / 60)
  const mins = diffMin % 60
  return mins ? `${hours} ساعت ${mins} دقیقه` : `${hours} ساعت`
})

const doctorName = computed(() => getDoctorName(props.booking))

const visitTypeLabel = computed(() => getVisitTypeLabel(props.booking?.type))

const servesList = computed(() => props.booking?.serves ?? [])

function goToDetail() {
  if (!props.booking) return
  emit('detail', props.booking)
  popupRef.value?.hide()
}
</script>

<style scoped lang="scss">
.appointment-popup-trigger {
  width: 100%;
}

.ap {
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 16px;
  width: 345px;
  background: $white;
  border: 1px solid $grey-3;
  box-shadow: 0 4px 12px rgba(105, 117, 134, 0.25);
  border-radius: 12px;

  &__body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  &__section {
    display: flex;
    flex-direction: column;
    padding: 8px;
    gap: 8px;
    width: 100%;
    background: #f6f6f6;
    border: 1px solid $grey-3;
    border-radius: 8px;

    &--date {
      gap: 12px;
    }

    &--cols {
      flex-direction: row;
      align-items: flex-start;
      gap: 16px;
    }

    &--services {
      gap: 4px;
    }
  }

  &__label {
    width: 100%;
  }

  &__patient-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  &__badge-red {
    background: #ffebee;
    border-radius: 8px;
    padding: 4px 10px;
    color: #f44336;
    white-space: nowrap;
  }

  &__date-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
  }

  &__icon {
    color: #9e9e9e;
    flex-shrink: 0;
  }

  &__time-row {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  &__badge-blue {
    background: rgba(0, 85, 255, 0.1);
    border-radius: 8px;
    padding: 4px 10px;
    color: #0055ff;
    white-space: nowrap;
  }

  &__divider-v {
    width: 1px;
    height: 28px;
    background: $grey-4;
    flex-shrink: 0;
  }

  &__time-range {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex: 1;
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  &__col-divider {
    width: 1px;
    background: $grey-4;
    align-self: stretch;
  }

  &__col-value-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 1px;
  }

  &__service-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  }

  &__footer {
    width: 100%;
  }
}

:deep(.q-menu) {
  max-height: none !important;
  overflow: visible !important;
}
</style>
