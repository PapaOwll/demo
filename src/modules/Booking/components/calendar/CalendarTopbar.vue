<template>
  <header class="calendar-topbar" dir="rtl">
    <div class="calendar-topbar__start">
      <div class="calendar-topbar__nav">
        <QBtn class="calendar-topbar__period-label" flat dense no-caps :label="displayLabel">
          <QPopupProxy
            ref="datePopup"
            transition-show="scale"
            transition-hide="scale"
            :offset="[0, 10]"
            anchor="bottom left"
            self="top left"
          >
            <QDate
              v-model="tempDate"
              :first-day-of-week="6"
              mask="YYYY/MM/DD"
              color="primary"
              today-btn
              calendar="persian"
              :navigation-min-year-month="'1300/01'"
              :navigation-max-year-month="'1450/12'"
              @update:model-value="onDateSelect"
            />
          </QPopupProxy>
        </QBtn>
        <button class="calendar-topbar__nav-btn" :disabled="!canGoPrev" @click="$emit('prev')">
          <IconChevronRight :size="24" />
        </button>
        <button class="calendar-topbar__nav-btn" :disabled="!canGoNext" @click="$emit('next')">
          <IconChevronLeft :size="24" />
        </button>
      </div>

      <div v-if="selectedDoctorId !== null" class="calendar-topbar__select-wrap">
        <SelectField
          :model-value="viewMode"
          :options="viewModeOptions"
          emit-value
          map-options
          dense
          outlined
          @update:model-value="(val) => emit('update:viewMode', val)"
        />
      </div>

      <Button
        v-if="!isTodayVisible"
        class="calendar-topbar__today-btn"
        variant="filled"
        color="light-blue"
        size="sm"
        text="امروز"
        :is-loading="todayLoading"
        @click="onTodayClick"
      />

      <SelectField
        :model-value="null"
        :options="searchResults"
        :search-fn="onSearchFilter"
        :loading="isSearching"
        :option-disable="(opt) => !opt.assignTo?.id"
        use-input
        hide-dropdown-icon
        clearable
        placeholder="جستجوی بیمار"
        emit-value
        map-options
        option-value="id"
        :option-label="() => ''"
        popup-content-class="calendar-topbar__search-dropdown"
        class="calendar-topbar__search"
        @update:model-value="onSelectBooking"
      >
        <template #startSection>
          <IconSearch :size="14" />
        </template>
        <template #option="{ opt, itemProps }">
          <QItem
            v-bind="itemProps"
            class="calendar-topbar__search-option"
            :class="{ 'calendar-topbar__search-option--disabled': !opt.assignTo?.id }"
          >
            <QItemSection>
              <div class="calendar-topbar__search-option-name">
                {{ getCustomerName(opt) }}
              </div>
              <div class="calendar-topbar__search-option-info">
                <span>{{ opt?.user?.mobile }}</span>
                <span v-if="opt?.docNumber" class="calendar-topbar__search-option-doc">
                  شماره پرونده: {{ opt.docNumber }}
                </span>
                <span v-if="opt?.assignTo" class="calendar-topbar__search-option-doctor">
                  {{ getDoctorName(opt) }}
                </span>
              </div>
              <div v-if="opt.bookingAt" class="calendar-topbar__search-option-time">
                {{ formatBookingDate(opt.bookingAt) }} - {{ formatBookingTime(opt.bookingAt) }}
              </div>
            </QItemSection>
          </QItem>
        </template>
        <template #no-option>
          <div v-if="isSearching" class="calendar-topbar__search-loading">
            <QSpinner color="primary" size="20px" />
            <span>در حال جستجو...</span>
          </div>
          <div
            v-else-if="searchResults.length === 0 && hasSearched"
            class="calendar-topbar__search-no-option"
          >
            نوبتی یافت نشد
          </div>
        </template>
      </SelectField>

      <div class="calendar-topbar__select-wrap">
        <SelectField
          :model-value="selectedDoctorId"
          :options="[
            { label: 'همه دکترها', value: 'all', colorKey: 'gray' },
            ...doctors.map((d) => ({
              label: d.name,
              value: d.id,
              colorKey: d.color || 'gray',
            })),
          ]"
          emit-value
          map-options
          dense
          outlined
          menu-anchor="bottom middle"
          menu-self="top middle"
          :display-value="selectedDoctorLabel"
          @update:model-value="(val) => emit('select-doctor', val === 'all' ? null : val)"
        >
          <template #startSection>
            <span
              class="calendar-topbar__doctor-box"
              :class="`calendar-topbar__doctor-box--color-${selectedDoctorColorKey}`"
            />
          </template>
          <template #option="{ opt, itemProps }">
            <QItem v-bind="itemProps">
              <QItemSection side>
                <span
                  class="calendar-topbar__doctor-box"
                  :class="`calendar-topbar__doctor-box--color-${opt.colorKey}`"
                />
              </QItemSection>
              <QItemSection>
                <QItemLabel>{{ opt.label }}</QItemLabel>
              </QItemSection>
            </QItem>
          </template>
        </SelectField>
      </div>
      <Button
        v-if="canPrint"
        class="calendar-topbar__print-btn"
        variant="outline"
        color="primary"
        size="md"
        :right-icon="IconPrinter"
        text="پرینت نوبت"
        @click="openPrintModal"
      />
    </div>

    <div class="calendar-topbar__end">
      <TabItem
        v-model="selectedTab"
        :group="[
          { label: 'نوبت دکتر', value: 'doctor' },
          { label: 'نوبت مشاور', value: 'adviser' },
        ]"
      />
    </div>

    <PrintAppointmentModal
      v-model="printModalVisible"
      :default-date="gregorianCurrentDate"
      :submit-fn="handlePrintSubmit"
    />
  </header>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { IconChevronLeft, IconChevronRight, IconSearch, IconPrinter } from '@tabler/icons-vue'
import SelectField from '@/base/SelectField'
import Button from '@/base/Button'
import TabItem from '@/base/TabItem'
import PrintAppointmentModal from './PrintAppointmentModal'
import { apiGetVisitUsers } from '@/modules/Booking/api'
import { convertToEnNumber } from '@/utils/convert-check-digits'
import { convertToJalali, convertToGregorian } from '@/utils/date-utils'
import { getPerms } from '@/utils/get-perms'
import { getCustomerName, getDoctorName, formatTimeHHMM } from '../../utils/bookingDisplay'

const router = useRouter()

const props = defineProps({
  displayLabel: { type: String, required: true },
  viewMode: { type: String, required: true },
  doctors: { type: Array, default: () => [] },
  selectedDoctorId: { type: Number, default: null },
  canGoPrev: { type: Boolean, default: true },
  canGoNext: { type: Boolean, default: true },
  isTodayVisible: { type: Boolean, default: true },
  selectedTab: { type: String, default: 'doctor' },
  currentDate: { type: [String, Date], required: true },
})

const selectedDoctorLabel = computed(() => {
  if (props.selectedDoctorId === null) {
    return 'همه دکترها'
  }
  const selectedDoctor = props.doctors.find((d) => d.id === props.selectedDoctorId)
  return selectedDoctor ? selectedDoctor.name : ''
})

const selectedDoctorColorKey = computed(() => {
  if (props.selectedDoctorId === null) return 'gray'
  const doc = props.doctors.find((d) => d.id === props.selectedDoctorId)
  return doc?.color || 'gray'
})

const viewModeOptions = computed(() => {
  const allOptions = [
    { label: 'روز', value: 'day' },
    { label: 'هفته', value: 'week' },
    { label: 'ماه', value: 'month' },
  ]
  if (props.selectedDoctorId === null) {
    return allOptions.filter((opt) => opt.value !== 'day' && opt.value !== 'month')
  }
  return allOptions
})

const emit = defineEmits([
  'prev',
  'next',
  'today',
  'update:viewMode',
  'select-doctor',
  'update:selectedTab',
  'select-date',
  'select-booking',
])

const selectedTab = ref(props.selectedTab || 'doctor')
const datePopup = ref(null)
const tempDate = ref(null)
const todayLoading = ref(false)
const searchResults = ref([])
const isSearching = ref(false)
const hasSearched = ref(false)

const canPrint = computed(() => getPerms('booking', 'view'))
const printModalVisible = ref(false)

const gregorianCurrentDate = computed(() => {
  if (!props.currentDate) return ''
  return convertToGregorian(String(props.currentDate).replace(/-/g, '/'), 'YYYY-MM-DD')
})

function openPrintModal() {
  printModalVisible.value = true
}

function handlePrintSubmit(payload) {
  const resolved = router.resolve({
    name: 'booking-print',
    query: {
      date: payload.date,
      doctor: String(payload.doctorId),
    },
  })
  window.open(resolved.href, '_blank', 'noopener')
}

function formatBookingDate(dateValue) {
  return convertToJalali(dateValue, 'jD jMMMM jYYYY')
}

function formatBookingTime(dateValue) {
  return formatTimeHHMM(dateValue)
}

const onSearchFilter = async (val, update, abort) => {
  const q = convertToEnNumber(val?.trim() || '')
  const isNumeric = /\d/.test(q)

  // For numeric input (potential doc_number), allow search from 1 char
  // For text (name search), keep minimum 5 chars
  if (isNumeric ? q.length === 0 : q.length < 5) {
    update(() => {
      searchResults.value = []
      hasSearched.value = false
    })
    return
  }

  isSearching.value = true

  try {
    if (isNumeric) {
      const numericValue = q.replace(/^(0|98|\+98)/, '')

      // Try doc_number first
      const docResponse = await apiGetVisitUsers({
        'filter[doc_number]': q,
        'filter[type]': 2,
        per_page: 20,
      })
      let items = docResponse?.data?.items || []

      // If no results from doc_number, fall back to mobile search
      if (items.length === 0) {
        const mobileResponse = await apiGetVisitUsers({
          'filter[user.mobile]': numericValue,
          'filter[type]': 2,
          per_page: 20,
        })
        items = mobileResponse?.data?.items || []
      }

      update(() => {
        searchResults.value = items
        isSearching.value = false
        hasSearched.value = true
      })
    } else {
      // Name search
      const response = await apiGetVisitUsers({
        'filter[user_full_name]': q,
        'filter[type]': 2,
        per_page: 20,
      })
      const items = response?.data?.items || []

      update(() => {
        searchResults.value = items
        isSearching.value = false
        hasSearched.value = true
      })
    }
  } catch {
    abort()
    isSearching.value = false
  }
}

const onSelectBooking = (bookingId) => {
  if (!bookingId) return
  const booking = searchResults.value.find((b) => b.id === bookingId)
  if (!booking) return
  emit('select-booking', booking)
}

watch(
  () => props.selectedTab,
  (newVal) => {
    selectedTab.value = newVal
  }
)

watch(selectedTab, (newVal) => {
  emit('update:selectedTab', newVal)
})

watch(
  () => datePopup.value?.showing,
  (isShowing) => {
    if (isShowing && props.currentDate) {
      const [year, month, day] = props.currentDate.split('-')
      tempDate.value = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
    }
  }
)

function onDateSelect() {
  if (tempDate.value) {
    const [year, month, day] = tempDate.value.split('/')
    emit('select-date', `${year}-${Number(month)}-${Number(day)}`)
    datePopup.value?.hide()
  }
}

function onTodayClick() {
  todayLoading.value = true
  setTimeout(() => {
    todayLoading.value = false
    emit('today')
  }, 600)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/calendar/color-variants';

.calendar-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md 20px;
  background: #fff;
  border-bottom: 0.5px solid $grey-4;
  flex-shrink: 0;
  gap: $spacing-md;

  &__start,
  &__end {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    min-width: 315px;
  }

  &__period-label {
    font-size: 13px;
    font-weight: 500;
    color: #111827;
    white-space: nowrap;
    min-width: 155px;
    text-align: center;
    cursor: pointer;
    min-width: 180px;

    &:hover {
      color: $blue-7;
    }
  }

  &__doctor-box {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid transparent;
    flex-shrink: 0;

    @include color-variants.apply;
  }

  &__nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    cursor: pointer;
    color: $grey-6;
    transition: background 0.15s;

    &:hover {
      background: $grey-1;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__search {
    min-width: 200px;

    :deep(.q-field__control) {
      height: 36px;
      min-height: 36px;
    }

    :deep(.q-field__native) {
      padding: 0;
    }

    :deep(.q-field__marginal) {
      height: 36px;
    }
  }

  &__search-option {
    padding: 8px 12px;
    min-height: auto;
    border-radius: 4px;

    &:hover {
      background-color: #e3f2fd;
    }

    &--disabled {
      opacity: 0.5;
      pointer-events: none;
    }
  }

  &__search-option-name {
    font-weight: 500;
    font-size: 13px;
    color: #111827;
  }

  &__search-option-info {
    display: flex;
    gap: 8px;
    font-size: 12px;
    color: #6b7280;
    margin-top: 2px;
  }

  &__search-option-doctor {
    color: #1976d2;
  }

  &__search-option-doc {
    color: #059669;
    font-weight: 500;
  }

  &__search-option-time {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 2px;
  }

  &__search-loading,
  &__search-no-option {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    font-size: 13px;
    color: #6b7280;
  }

  &__print-btn {
    flex-shrink: 0;
    margin-top: $spacing-xs;
  }
}
</style>

<style lang="scss">
.calendar-topbar__search-dropdown {
  border-radius: 8px !important;
  box-shadow: 0 0 6px 1px rgba(0, 0, 0, 0.1) !important;
  padding: 8px !important;
  margin-top: 4px !important;
  min-width: 280px !important;
  max-height: 250px !important;

  .q-virtual-scroll__content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
