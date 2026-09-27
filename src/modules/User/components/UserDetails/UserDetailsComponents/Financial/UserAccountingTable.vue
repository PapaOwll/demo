<template>
  <QTable
    class="uac-table quasar-table"
    flat
    :rows="items"
    :columns="columns"
    row-key="autoid"
    :rows-per-page-options="[0]"
    hide-bottom
  >
    <template #body="scope">
      <QTr :key="String(scope.row.autoid)" class="uac-table__row q-tr--no-hover">
        <QTd class="uac-table__cell uac-table__cell-date">
          <Typography variant="caption" weight="medium">
            {{ getDayLabel(scope.row.eventAt) }}
          </Typography>
          <Typography variant="caption" class="uac-table__time">
            {{ getTimeLabel(scope.row.eventAt) }}
          </Typography>
        </QTd>
        <QTd
          class="uac-table__cell uac-table__cell-title"
          @mouseenter="scheduleTooltip(scope.row, 'title', $event)"
          @mouseleave="hideTooltip"
        >
          <div class="uac-table__title-wrap">
            <Typography variant="body" size="4" weight="semibold" class="uac-table__title">
              {{ getTransactionTitle(scope.row) }}
            </Typography>
            <Badge
              v-if="getChequeTypeLabel(scope.row.chequeType)"
              variant="outline"
              is-rounded
              :color="getChequeTypeColor(scope.row.chequeType)"
              :label="getChequeTypeLabel(scope.row.chequeType)"
            />
          </div>
          <QTooltip
            v-if="tooltipRow === scope.row && tooltipField === 'title'"
            v-model="tooltipVisible"
            anchor="top middle"
            self="bottom middle"
            :offset="[8, 8]"
            :content-style="{
              maxWidth: '320px',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.6,
            }"
          >
            {{ getTransactionTitle(scope.row) }}
          </QTooltip>
        </QTd>
        <QTd class="uac-table__cell uac-table__cell-amount">
          <div class="uac-table__amounts">
            <Typography
              v-if="hasAmount(scope.row.inAmount)"
              variant="body"
              size="4"
              weight="semibold"
              class="uac-table__amount uac-table__amount--in"
            >
              {{ formatNumber(scope.row.inAmount) + ' +' }}
              <Typography variant="caption" class="uac-table__amount-unit">تومان</Typography>
            </Typography>
            <Typography
              v-if="hasAmount(scope.row.outAmount)"
              variant="body"
              size="4"
              weight="bold"
              class="uac-table__amount"
              :class="
                scope.row.type === 'service'
                  ? 'uac-table__amount--service'
                  : 'uac-table__amount--out'
              "
            >
              {{ formatNumber(scope.row.outAmount) + ' -' }}
              <Typography variant="caption" class="uac-table__amount-unit">تومان</Typography>
            </Typography>
            <Typography
              v-if="!hasAmount(scope.row.inAmount) && !hasAmount(scope.row.outAmount)"
              variant="body"
              size="4"
              class="uac-table__missing"
            >
              {{ missingLabel }}
            </Typography>
          </div>
        </QTd>
        <QTd class="uac-table__cell uac-table__cell-balance">
          <div class="uac-table__balance-wrap">
            <div class="uac-table__balance-row">
              <Typography variant="body" size="4" weight="medium" class="uac-table__balance">
                {{ formatBalanceNumber(scope.row.userBalanceCum) }}
              </Typography>
              <Typography variant="caption" class="uac-table__balance-unit">تومان</Typography>
            </div>
            <Badge
              variant="outline"
              is-rounded
              :color="balanceTypeColors[resolveBalanceType(scope.row)]"
              :label="getBalanceTypeLabel(scope.row)"
            />
          </div>
        </QTd>
        <QTd
          class="uac-table__cell uac-table__cell-desc"
          @mouseenter="scheduleTooltip(scope.row, 'description')"
          @mouseleave="hideTooltip"
        >
          <Typography variant="caption" class="uac-table__description">
            {{ scope.row.description || missingLabel }}
          </Typography>
          <QTooltip
            v-if="tooltipRow === scope.row && tooltipField === 'description'"
            v-model="tooltipVisible"
            anchor="top middle"
            self="bottom middle"
            :offset="[8, 8]"
            :content-style="{
              maxWidth: '320px',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.6,
            }"
          >
            {{ scope.row.description }}
          </QTooltip>
        </QTd>
        <QTd class="uac-table__cell uac-table__cell-actions">
          <div class="uac-table__actions">
            <Button
              is-icon-only
              is-rounded
              variant="flat"
              color="grey"
              type="button"
              size="sm"
              :left-icon="isExpanded(scope.row) ? IconChevronUp : IconChevronDown"
              :aria-label="isExpanded(scope.row) ? 'بستن جزئیات' : 'نمایش جزئیات'"
              @click="toggleExpand(scope.row)"
            />
            <Button
              v-if="canDeleteRow(scope.row)"
              is-icon-only
              is-rounded
              variant="flat"
              color="red"
              type="button"
              size="sm"
              :left-icon="IconTrash"
              aria-label="حذف چک"
              @click="emits('delete-check', scope.row)"
            />
          </div>
        </QTd>
      </QTr>
      <QTr
        v-if="isExpanded(scope.row)"
        :key="String(scope.row.autoid) + '-detail'"
        class="uac-table__detail-row q-tr--no-hover"
      >
        <QTd colspan="6">
          <div class="uac-table__detail-grid">
            <div
              v-for="field in getTransactionDetailFields(scope.row)"
              :key="field.key"
              class="uac-table__detail-item"
              :class="{ 'uac-table__detail-item--wide': field.key === 'description' }"
            >
              <Typography variant="caption" class="uac-table__detail-label">
                {{ field.label }}
              </Typography>
              <Typography variant="body" size="4" weight="medium" class="uac-table__detail-value">
                {{ field.display }}
              </Typography>
            </div>
          </div>
        </QTd>
      </QTr>
    </template>
  </QTable>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { IconChevronDown, IconChevronUp, IconTrash } from '@tabler/icons-vue'
import type { QTableColumn } from 'quasar'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import Badge from '@/base/Badge'
import { convertToJalali } from '@/utils/date-utils'
import { numberSeparator } from '@/utils/formatter'
import {
  balanceTypeColors,
  chequeTypeColors,
  chequeTypeLabels,
} from '@/modules/User/enums/financialEnums'
import {
  getBalanceTypeLabel,
  getTransactionDetailFields,
  getTransactionTitle,
  resolveBalanceType,
  type UserAccountingItem,
} from '@/modules/User/composables/use-accounting-view'

interface Props {
  items: UserAccountingItem[]
  canDeleteCheque?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canDeleteCheque: false,
})

const emits = defineEmits<{
  'delete-check': [item: UserAccountingItem]
}>()

const missingLabel = '—'

const columns: QTableColumn[] = [
  { name: 'date', label: 'تاریخ/ساعت', field: 'eventAt', align: 'left' },
  { name: 'title', label: 'شرح', field: 'mtGroupNameFa', align: 'left' },
  { name: 'amount', label: 'مبلغ', field: 'inAmount', align: 'left' },
  { name: 'balance', label: 'مانده', field: 'userBalanceCum', align: 'left' },
  {
    name: 'description',
    label: 'توضیحات',
    field: 'description',
    align: 'left',
    classes: 'uac-table__cell-desc',
    headerClasses: 'uac-table__cell-desc',
  },
  { name: 'actions', label: 'عملیات', field: 'autoid', align: 'left' },
]

const expandedKeys = ref(new Set<string>())

const TOOLTIP_DELAY_MS = 700
const tooltipRow = ref<UserAccountingItem | null>(null)
const tooltipField = ref<'title' | 'description' | null>(null)
const tooltipVisible = ref(false)
let tooltipTimer: ReturnType<typeof setTimeout> | null = null

const hideTooltip = () => {
  if (tooltipTimer) {
    clearTimeout(tooltipTimer)
    tooltipTimer = null
  }
  tooltipVisible.value = false
  tooltipRow.value = null
  tooltipField.value = null
}

const scheduleTooltip = (
  row: UserAccountingItem,
  field: 'title' | 'description',
  event?: MouseEvent
) => {
  hideTooltip()
  const text = field === 'description' ? row.description : getTransactionTitle(row)
  if (!text) return
  if (field === 'title' && event?.currentTarget instanceof HTMLElement) {
    const titleEl = event.currentTarget.querySelector('.uac-table__title')
    if (titleEl && titleEl.scrollWidth <= titleEl.clientWidth) return
  }
  tooltipRow.value = row
  tooltipField.value = field
  tooltipTimer = setTimeout(() => {
    tooltipVisible.value = true
  }, TOOLTIP_DELAY_MS)
}

onBeforeUnmount(hideTooltip)

const rowKeyOf = (item: UserAccountingItem) => String(item.autoid)

const isExpanded = (item: UserAccountingItem) => expandedKeys.value.has(rowKeyOf(item))

const toggleExpand = (item: UserAccountingItem) => {
  const key = rowKeyOf(item)
  if (expandedKeys.value.has(key)) {
    expandedKeys.value.delete(key)
  } else {
    expandedKeys.value.add(key)
  }
}

const hasAmount = (amount?: string | number) => Number(amount) > 0

const formatNumber = (value?: string | number) => {
  if (value === null || value === undefined || value === '') return missingLabel
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return missingLabel
  return numberSeparator(numeric)
}

const formatBalanceNumber = formatNumber

const canDeleteRow = (item: UserAccountingItem) =>
  item.enumerationSlug === 'cheque' && hasAmount(item.inAmount) && props.canDeleteCheque

const getChequeTypeLabel = (type?: string) =>
  (type && chequeTypeLabels[type] ? `چک ${chequeTypeLabels[type]}` : '') as string

const getChequeTypeColor = (type?: string) => (type && chequeTypeColors[type]) || 'grey'

const getDayLabel = (dateStr?: string) =>
  dateStr ? convertToJalali(dateStr, 'jYYYY/jMM/jDD') : missingLabel

const getTimeLabel = (dateStr?: string) =>
  dateStr ? convertToJalali(dateStr, 'jdddd HH:mm') : missingLabel
</script>

<style lang="scss" scoped>
.uac-table {
  width: 100%;

  :deep(.q-table__middle) {
    max-height: calc(60vh - 2rem);
    overflow: auto;
    overscroll-behavior: contain;
  }

  :deep(thead tr:first-child th) {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  &__cell {
    vertical-align: middle;
  }

  &__cell-date {
    min-width: 110px;
  }

  &__time {
    display: block;
    color: $grey-6;
    text-align: start;
    margin-top: 2px;
  }

  &__title-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    min-width: 0;
  }

  &__title {
    color: $grey-10;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }

  &__cell-amount {
    white-space: nowrap;
  }

  &__amounts {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  &__amount {
    display: inline-flex;
    align-items: baseline;
    gap: 3px;
    font-size: 15px;
    font-weight: 700;
    white-space: nowrap;
    letter-spacing: -0.2px;
    direction: rtl;
    padding: 2px 8px;
    border-radius: 6px;

    &--in {
      color: $green-9;
      background-color: $green-1;
    }

    &--out {
      color: $red-9;
      background-color: $red-1;
    }

    &--service {
      color: $orange-9;
      background-color: $orange-1;
    }
  }

  &__amount-unit {
    font-size: 10px;
    font-weight: 400;
    color: inherit;
  }

  &__missing {
    color: $grey-5;
  }

  &__balance-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  &__balance-row {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  &__balance {
    color: $grey-8;
    white-space: nowrap;
    direction: ltr;
  }

  &__balance-unit {
    color: $grey-5;
    font-size: 10px;
  }

  &__cell-desc {
    max-width: 220px;
  }

  &__description {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: $grey-7;
    white-space: normal;
    word-break: break-word;
    line-height: 1.6;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  &__detail-row :deep(td) {
    background: rgba($blue, 0.05);
    white-space: normal !important;
  }

  &__detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 12px 16px;
  }

  &__detail-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    &--wide {
      grid-column: 1 / -1;
    }
  }

  &__detail-label {
    color: $grey-6;
  }

  &__detail-value {
    color: $grey-10;
    word-break: break-word;
  }

  @media (max-width: 719px) {
    :deep(.uac-table__cell-desc) {
      display: none;
    }
  }

  @media (max-width: 559px) {
    :deep(.uac-table__cell-date) {
      display: none;
    }
  }
}
</style>
