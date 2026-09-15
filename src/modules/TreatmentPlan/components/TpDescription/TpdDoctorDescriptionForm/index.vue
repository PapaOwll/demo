<template>
  <div class="tpdd">
    <QInnerLoading :showing="loading">
      <QSpinnerTail size="50px" color="primary" />
    </QInnerLoading>

    <div v-for="(page, index) in pages" :key="index" class="page-container">
      <div class="row full-width items-center justify-center">
        <div class="tpdd__header">
          <img :src="logo" alt="logo" />
          <Typography variant="body" size="3" weight="semibold">فرم شرح درمان روزانه</Typography>
          <div class="tpdd__header-item">
            <Typography variant="body" size="4">نام پزشک</Typography>
            <div class="tppd__header-item doctor">
              <Typography variant="body" size="4" weight="semibold">
                {{ doctorInfo?.name }}
              </Typography>
            </div>
          </div>
          <div class="tpdd__header-date">
            <Typography variant="body" size="4">تاریخ:</Typography>
            <Typography variant="caption">
              {{ convertToJalaliWithTime(doctorInfo?.date, 'jYYYY٫jMM٫jDD') }}
            </Typography>
          </div>
          <div class="tpdd__header-pages">
            <Typography variant="body" size="4">صفحه:</Typography>
            <Typography variant="caption">{{ page.number }}</Typography>
            <Typography variant="body" size="4">از</Typography>
            <Typography variant="caption">{{ totalPages }}</Typography>
          </div>
        </div>

        <div class="tpdd__table">
          <QTable
            flat
            :rows="page.data"
            :columns="tableColumns"
            :rows-per-page-options="[0]"
            row-key="index"
          >
            <template #no-data>
              <div
                class="column q-gutter-lg q-my-md full-width justify-center items-center q-pa-lg"
              >
                <Typography variant="heading" size="h6">
                  اطلاعاتی برای "{{ doctorInfo?.name }}" برای این تاریخ ثبت نشده است!
                </Typography>
                <Button text="بازگشت به نوبت ها" @click="router.push({ name: 'booking' })" />
              </div>
            </template>
            <template #body-cell-index="scope">
              <QTd :props="scope">
                {{ (page.number - 1) * 8 + scope.rowIndex + 1 }}
              </QTd>
            </template>

            <template #body-cell-hasVisit="scope">
              <QTd class="text-center" :props="scope">
                <QCheckbox class="border-box" :model-value="false" />
              </QTd>
            </template>

            <template #body-cell-patientDetails="scope">
              <QTd :props="scope">
                <div class="patientDetails">
                  <div class="patientDetails__time">
                    <span>-</span>
                  </div>
                  <div><QCheckbox class="border-box" :model-value="false" /></div>
                </div>
              </QTd>
            </template>

            <template #body-cell-tpServices="scope">
              <QTd :props="scope">
                <div v-for="item in scope.row.items" :key="item.isProposed" class="patientDetails">
                  <Typography variant="caption" weight="bold">
                    {{ `${item.serveTitle} / ${item.serveItemTitle}` }}
                  </Typography>
                </div>
              </QTd>
            </template>

            <template #body-cell-nonTpServices="scope">
              <QTd :props="scope">
                <div v-for="item in scope.row.items" :key="item.isProposed" class="patientDetails">
                  <div v-for="t in item?.teeth" :key="t" :class="['teeth', `teeth__${t.position}`]">
                    {{ t.number }}
                  </div>
                </div>
              </QTd>
            </template>

            <template #bottom>
              <div class="tpdd__bottom">
                <div v-if="page.number === totalPages" class="tpdd__bottom-total">
                  <Typography variant="caption">تعداد کل بیماران:</Typography>
                  <Typography variant="caption">{{ rows.length }} بیمار</Typography>
                </div>
                <div
                  v-if="totalPages > 2 || page.number === totalPages"
                  class="tpdd__bottom-signatures"
                >
                  <div>
                    <Typography variant="caption">امضا پزشک</Typography>
                  </div>
                  <div>
                    <Typography variant="caption">متصدی فرم</Typography>
                  </div>
                  <div>
                    <Typography variant="caption">دستیارها</Typography>
                  </div>
                  <div>
                    <Typography variant="caption">بایگانی</Typography>
                  </div>
                  <div>
                    <Typography variant="caption">سرپرست بایگانی</Typography>
                  </div>
                </div>
              </div>
            </template>
          </QTable>
        </div>
      </div>
      <div class="page-break" />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import logo from '@/assets/images/Logo 2.png'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import { useRouter } from 'vue-router'

const router = useRouter()
const props = defineProps({
  loading: Boolean,
  data: {
    type: Object,
    default: () => ({}),
  },
  records: {
    type: Array,
    default: () => [],
  },
})

const hasHandledAction = ref(false)

const doctorInfo = computed(() => {
  return props.data || {}
})

const rows = computed(() => {
  return props.records || []
})

const ROWS_PER_PAGE = 8

const totalPages = computed(() => {
  return Math.ceil(rows.value.length / ROWS_PER_PAGE) || 1
})

const pages = computed(() => {
  const result = []
  for (let i = 0; i < totalPages.value; i += 1) {
    result.push({
      number: i + 1,
      data: rows.value.slice(i * ROWS_PER_PAGE, (i + 1) * ROWS_PER_PAGE),
    })
  }
  return result
})

const tableColumns = [
  {
    name: 'index',
    label: '#',
    field: 'index',
    align: 'center',
  },
  {
    name: 'name',
    label: 'نام بیمار',
    field: 'name',
    align: 'left',
  },
  {
    name: 'docNumber',
    field: 'docNumber',
    label: 'شماره پرونده',
    align: 'center',
  },
  {
    name: 'hasVisit',
    label: 'ویزیت',
    align: 'center',
  },
  {
    name: 'tpServices',
    label: 'خدمات انجام شده',
    align: 'left',
  },
  {
    name: 'nonTpServices',
    label: 'واحد / ناحیه خدمات درمان',
    align: 'left',
  },
  {
    name: 'description',
    label: 'توضیحات تکمیلی',
    align: 'left',
  },
  {
    name: 'assistants',
    label: 'دستیارها',
    align: 'left',
  },
  {
    name: 'patientDetails',
    label: 'ساعت ورود و خروج / چک پرونده بـیمار',
    align: 'left',
  },
]

/*
 * Print Implementation:
 * Uses CSS @media print queries to handle print styling
 * - Hides loading spinners and scrollbars (lines 361-405)
 * - Removes margins/padding for clean output
 * - Ensures page breaks work correctly
 * - Maintains print color accuracy
 *
 * This approach is consistent with TpCreditLevel.vue and avoids
 * popup blocker issues associated with window.open() approach.
 */

watch(
  () => [props.loading, rows.value],
  ([isLoading, records]) => {
    if (!isLoading && !hasHandledAction.value) {
      hasHandledAction.value = true

      if (records.length > 0) {
        // Wait for DOM to fully render before printing
        nextTick(() => {
          setTimeout(() => {
            window.print()
          }, 500)
        })
      }
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.tpdd {
  width: 842pt;
  background: #fff;

  .page-container {
    width: 100%;
    min-height: 100dvh;
    page-break-after: always;
    position: relative;
  }

  &__header {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 2fr 5fr 1fr 2fr;
    grid-column-gap: $spacing-md;
    padding: $spacing-2xl;
    &-item {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-sm;
    }
    .doctor {
      display: flex;
      align-items: end;
      min-width: 240px;
      border: 1px solid $grey-4;
      padding: $spacing-xs $spacing-lg;
      border-radius: $radius-md;
    }
    &-date {
      display: flex;
      align-items: flex-end;
      gap: $spacing-sm;
    }
    &-pages {
      display: flex;
      align-items: flex-end;
      justify-self: flex-end;
      gap: $spacing-sm;
    }
  }
  &__table {
    width: 100%;
    padding: $spacing-sm $spacing-xl;
    :deep(.q-table) {
      th {
        background-color: $grey-light !important;
        font-size: 11px !important;
        font-weight: normal;
        max-height: 22px !important;
        border: 1px solid $grey-4 !important;
      }
      td {
        font-size: 10px !important;
        padding: 6px !important;
        border: 1px solid $grey-4 !important;
        height: 52px !important;
        max-height: 52px !important;
        min-height: 52px !important;
      }
    }
  }
  &__bottom {
    width: 100%;
    padding: $spacing-md;
    display: flex;
    flex-direction: column;
    gap: $spacing-xl;
    &-total {
      width: 32.66%;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: $spacing-sm;
      padding: $spacing-sm $spacing-xl;
      margin: 0 auto;
      border: 1px solid $grey-6;
      border-radius: $radius-md;
    }
    &-signatures {
      width: 100%;
      display: grid;
      grid-template-columns: 2fr 2fr 4fr 2fr 2fr;
      gap: $spacing-sm;
    }
  }
}

.border-box {
  :deep(.q-checkbox__bg) {
    border: 1px solid $grey-5 !important;
    border-radius: $radius-xs;
    background-color: transparent !important;
  }
}

.patientDetails {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  gap: $spacing-md;
  &__time {
    width: 70%;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
  }
}

.page-break {
  display: none;
}

@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  // Hide loading spinner when printing
  .q-inner-loading {
    display: none !important;
  }

  // Remove margins and padding from body
  body {
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  // Hide any scrollbars
  body::-webkit-scrollbar,
  html::-webkit-scrollbar {
    display: none;
  }

  // Ensure the form takes full width
  .tpdd {
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
  }

  // Show page breaks
  .page-break {
    display: block;
    page-break-after: always;
  }

  // Ensure checkboxes are visible
  .border-box {
    :deep(.q-checkbox__bg) {
      border: 1px solid $grey-5 !important;
      background-color: transparent !important;
    }
  }
}
</style>
