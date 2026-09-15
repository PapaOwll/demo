<template>
  <div class="booking-print">
    <div v-if="canPrint" class="booking-print__toolbar">
      <Button color="light-blue" :left-icon="IconPrinter" text="چاپ" @click="onPrint" />
    </div>

    <template v-if="hasParams">
      <div v-if="isLoading" class="booking-print__standalone-state">
        <QSpinner color="grey-7" size="32px" />
        <Typography variant="body" size="3" color="grey">در حال بارگذاری نوبت‌ها…</Typography>
      </div>

      <div v-else-if="isError" class="booking-print__standalone-state">
        <Typography variant="body" size="3" color="red">خطا در دریافت اطلاعات</Typography>
        <Button variant="outline" color="grey" size="sm" text="تلاش مجدد" @click="refetch" />
      </div>

      <div v-else class="booking-print__sheet">
        <table class="booking-print__table">
          <thead>
            <tr class="booking-print__brand-row">
              <th colspan="7">
                <div class="booking-print__header">
                  <div class="booking-print__brand">
                    <img :src="logoUrl" alt="سرینا" class="booking-print__logo" />
                  </div>

                  <Typography variant="heading" size="h4" class="booking-print__title">
                    لیست نوبت‌های امروز
                  </Typography>

                  <div class="booking-print__meta">
                    <Typography variant="caption" class="booking-print__meta-item">
                      <span class="booking-print__meta-label">تاریخ:</span>
                      {{ displayDate || '—' }}
                    </Typography>
                    <Typography variant="caption" class="booking-print__meta-item">
                      <span class="booking-print__meta-label">پزشک:</span>
                      {{ doctorLabel || '—' }}
                    </Typography>
                  </div>
                </div>
              </th>
            </tr>
            <tr class="booking-print__col-row">
              <th class="booking-print__col-index">#</th>
              <th>نام بیمار</th>
              <th class="booking-print__col-time">تاریخ و ساعت نوبت</th>
              <th class="booking-print__col-doc">شماره پرونده</th>
              <th class="booking-print__col-phone">شماره تماس</th>
              <th class="booking-print__col-services">خدمات</th>
              <th class="booking-print__col-note">توضیحات تکمیلی</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="totalBookingsCount === 0">
              <td colspan="7" class="booking-print__empty-row">
                <Typography variant="body" size="3" color="grey">
                  نوبتی برای این روز ثبت نشده است.
                </Typography>
              </td>
            </tr>
            <template v-else>
              <tr v-for="(booking, index) in sortedBookings" :key="booking.id">
                <td class="booking-print__col-index">{{ index + 1 }}</td>
                <td>{{ getCustomerName(booking) || '—' }}</td>
                <td class="booking-print__col-time">{{ getBookingTimeRange(booking).time }}</td>
                <td class="booking-print__col-doc">{{ booking.docNumber || '—' }}</td>
                <td class="booking-print__col-phone" dir="ltr">
                  {{ booking.user?.mobile || '—' }}
                </td>
                <td class="booking-print__col-services">{{ getServicesLabel(booking) }}</td>
                <td class="booking-print__col-note">{{ booking.description || '—' }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </template>

    <div v-else class="booking-print__standalone-state">
      <Typography variant="body" size="3" color="grey">تاریخ یا پزشک انتخاب نشده است.</Typography>
      <Button
        variant="outline"
        color="grey"
        size="sm"
        text="بازگشت به تقویم"
        @click="$router.push({ name: 'calendar' })"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { QSpinner } from 'quasar'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import { IconPrinter } from '@tabler/icons-vue'
import { getTablerIcon } from '@/utils/icon-loader'
import { convertToJalali } from '@/utils/date-utils'
import { getCustomerName, getBookingTimeRange } from '../utils/bookingDisplay'
import { useBookingDayBookingsQuery } from '../query'
import { useGetUserMiniByIdQuery } from '@/modules/User/query'

const route = useRoute()

const logoUrl = getTablerIcon('sitra-logo')

const hasParams = computed(() => !!route.query.date && !!route.query.doctor)

const doctorId = computed(() => route.query.doctor || null)

const { data: doctorData } = useGetUserMiniByIdQuery(doctorId, {
  enabled: computed(() => !!doctorId.value),
})

const filters = computed(() => {
  const { date } = route.query
  const { doctor } = route.query
  if (!date || !doctor) return {}
  return {
    'filter[assign_to]': doctor,
    'filter[booking_at_after]': `${date} 00:00:00`,
    'filter[booking_at_before]': `${date} 23:59:59`,
  }
})

const { data: bookings, isLoading, isError, refetch } = useBookingDayBookingsQuery(filters)

const sortedBookings = computed(() => {
  const items = bookings.value ?? []
  return [...items].sort((a, b) => new Date(a.bookingAt) - new Date(b.bookingAt))
})

const totalBookingsCount = computed(() => sortedBookings.value.length)

const canPrint = computed(
  () => hasParams.value && !isLoading.value && !isError.value && totalBookingsCount.value > 0
)

function onPrint() {
  window.print()
}

const displayDate = computed(() => {
  const { date } = route.query
  return date ? convertToJalali(date, 'jdddd jD jMMMM jYYYY') : ''
})

const doctorLabel = computed(() => {
  const assignTo = sortedBookings.value?.[0]?.assignTo
  if (assignTo) {
    return `${assignTo.firstName || ''} ${assignTo.name || ''}`.trim()
  }
  const doctor = doctorData.value
  if (doctor) {
    return `${doctor.firstName || ''} ${doctor.name || ''}`.trim()
  }
  return doctorId.value ? `#${doctorId.value}` : ''
})

function getServicesLabel(booking) {
  const serves = booking?.serves ?? []
  if (serves.length === 0) return '—'
  return serves
    .map((s) => s.title)
    .filter(Boolean)
    .join('، ')
}
</script>

<style scoped lang="scss">
.booking-print {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-lg;
  padding: $spacing-lg 0;

  &__toolbar {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    justify-content: flex-end;
    width: 297mm;
    max-width: 100%;
    margin-bottom: $spacing-sm;
  }

  &__sheet {
    width: 297mm;
    max-width: 100%;
    min-height: 210mm;
    background: $white;
    padding: 16mm;
  }

  &__header {
    display: flex;
    align-items: center;
    flex-direction: row-reverse;
    justify-content: space-between;
    padding-bottom: $spacing-lg;
    margin-bottom: $spacing-md;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    order: 3;
  }

  &__logo {
    height: 32px;
    width: auto;
  }

  &__brand-name {
    font-weight: 700;
  }

  &__title {
    order: 2;
    text-align: center;
    align-self: center;
    flex: 1;
    font-size: 18px;
    font-weight: 600;
  }

  &__meta {
    order: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-xs;
  }

  &__meta-label {
    color: #80807e;
    font-weight: 500;
    margin-left: $spacing-xs;
    font-size: 12px;
  }

  &__meta-item {
    font-size: 12px;
  }

  &__standalone-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    min-height: 200px;
    text-align: center;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    color: $dark-text;

    td,
    .booking-print__col-row th {
      border: 1px solid $default-disabled-border;
      padding: 14px 8px;
      text-align: right;
      vertical-align: top;
      word-break: break-word;
    }

    .booking-print__col-row th {
      background: #f0f0f0;
      font-weight: 700;
      text-align: center;
      padding: $spacing-sm;
    }

    .booking-print__brand-row th {
      border: none;
      padding: 0;
      text-align: right;
    }

    tbody tr:nth-child(even) td {
      background: $grey-1;
    }

    tr {
      break-inside: avoid;
    }

    .booking-print__empty-row {
      text-align: center;
      padding: $spacing-xl $spacing-sm;
      color: #80807e;
    }
  }

  &__col-index {
    width: 40px;
    text-align: center;
    white-space: nowrap;
  }

  &__col-time {
    width: 90px;
    white-space: nowrap;
    text-align: center;
  }

  &__col-doc {
    width: 90px;
    text-align: center;
    white-space: nowrap;
  }

  &__col-phone {
    width: 110px;
    text-align: center;
  }

  &__col-services {
    width: 22%;
  }

  &__col-note {
    width: 24%;
    text-align: justify !important;
  }
}
</style>

<style lang="scss">
@media print {
  @page {
    size: A4 landscape;
    margin: 0;
    padding-top: 25px;
  }

  body {
    margin: 0;
  }

  body * {
    visibility: hidden;
  }

  .booking-print,
  .booking-print * {
    visibility: visible;
  }

  .booking-print__toolbar {
    display: none !important;
  }

  .booking-print {
    padding: 0;
    gap: 0;

    &__sheet {
      width: 100%;
      min-height: auto;

      padding: 0 12mm 12mm;

      margin-top: -25px;
    }

    &__table {
      thead {
        display: table-header-group;
      }

      .booking-print__col-row th {
        background: #f0f0f0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      tbody tr:nth-child(even) td {
        background: $grey-1 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  }
}
</style>
