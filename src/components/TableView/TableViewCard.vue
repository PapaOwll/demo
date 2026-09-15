<template>
  <div class="table-view-card" :class="$attrs.class" :style="$attrs.style">
    <slot v-if="rows.length === 0 && loading" name="loading" />
    <slot v-else-if="rows.length === 0" name="no-data" />

    <template v-if="isExpandable">
      <div
        v-for="(row, rowIndex) in rows"
        :key="rowKeyOf(row, rowIndex)"
        class="table-view-card__item"
      >
        <QExpansionItem
          :model-value="isExpanded(rowKeyOf(row, rowIndex))"
          expand-icon-toggle
          hide-expand-icon
        >
          <template #header="{ expanded }">
            <div class="table-view-card__header-fields">
              <slot name="card-header" :row="row" :row-index="rowIndex" :columns="columns">
                <template v-for="col in headerFields" :key="col.name">
                  <div
                    v-if="!expanded || col.name !== ACTIONS_COLUMN"
                    class="table-view-card__field"
                  >
                    <Typography variant="caption" color="body">{{ col.label }}</Typography>
                    <slot
                      v-if="hasCellSlot(col)"
                      :name="`cell-${col.name}`"
                      :row="row"
                      :col="col"
                      :value="getSlotValue(row, col)"
                      :row-index="rowIndex"
                    />
                    <UserMenu
                      v-else-if="userColumns.includes(col.name) && getUserValue(row, col)"
                      :user="getUserValue(row, col)"
                    />
                    <Typography v-else variant="body" size="4">
                      {{ getCellValue(row, col) }}
                    </Typography>
                  </div>
                </template>
              </slot>
            </div>
          </template>

          <QCard flat>
            <QCardSection>
              <div v-for="col in detailFields" :key="col.name" class="table-view-card__field">
                <Typography variant="caption" color="grey">{{ col.label }}</Typography>
                <slot
                  v-if="hasCellSlot(col)"
                  :name="`cell-${col.name}`"
                  :row="row"
                  :col="col"
                  :value="getSlotValue(row, col)"
                  :row-index="rowIndex"
                />
                <UserMenu
                  v-else-if="userColumns.includes(col.name) && getUserValue(row, col)"
                  :user="getUserValue(row, col)"
                />
                <Typography v-else variant="body" size="4">{{ getCellValue(row, col) }}</Typography>
              </div>
            </QCardSection>
          </QCard>
        </QExpansionItem>

        <Button
          variant="outline"
          is-full-width
          :text="isExpanded(rowKeyOf(row, rowIndex)) ? 'نمایش کمتر' : 'نمایش بیشتر'"
          @click="toggleExpand(rowKeyOf(row, rowIndex))"
        />
      </div>
    </template>

    <template v-else>
      <QCard
        v-for="(row, rowIndex) in rows"
        :key="String(row[rowKey] ?? rowIndex)"
        flat
        class="table-view-card__item"
      >
        <slot name="card-item" :row="row" :row-index="rowIndex" :columns="columns">
          <QCardSection>
            <div v-for="col in primaryFields" :key="col.name" class="table-view-card__field">
              <Typography variant="caption" color="grey">{{ col.label }}</Typography>
              <slot
                v-if="hasCellSlot(col)"
                :name="`cell-${col.name}`"
                :row="row"
                :col="col"
                :value="getSlotValue(row, col)"
                :row-index="rowIndex"
              />
              <UserMenu
                v-else-if="userColumns.includes(col.name) && getUserValue(row, col)"
                :user="getUserValue(row, col)"
              />
              <Typography v-else variant="body" size="4">{{ getCellValue(row, col) }}</Typography>
            </div>
          </QCardSection>
        </slot>
      </QCard>
    </template>

    <slot v-if="$slots.bottom" name="bottom" />
  </div>
</template>

<script setup lang="ts" generic="Row extends Record<string, unknown>">
import { computed, ref, useSlots } from 'vue'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import UserMenu from '@/components/UserMenu'
import type { QTableColumn } from 'quasar'

defineOptions({ inheritAttrs: false })

interface Props {
  rows?: Row[]
  columns?: QTableColumn<Row>[]
  rowKey?: string
  userColumns?: string[]
  isExpandable?: boolean
  primaryColumns?: string[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rows: () => [],
  columns: () => [],
  rowKey: 'id',
  userColumns: () => ['userFullName', 'name'],
  isExpandable: false,
  primaryColumns: () => [],
  loading: false,
})

const slots = useSlots()

const ACTIONS_COLUMN = 'actions'

// Controlled expansion state: the header is display-only (no chevron), each
// card toggles through its own full-width footer button
const expandedKeys = ref(new Set<string>())

const rowKeyOf = (row: Row, rowIndex: number): string => String(row[props.rowKey] ?? rowIndex)

const isExpanded = (key: string): boolean => expandedKeys.value.has(key)

const toggleExpand = (key: string): void => {
  const next = new Set(expandedKeys.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedKeys.value = next
}

const primaryFieldNames = computed(() => new Set([...props.userColumns, ...props.primaryColumns]))

const primaryFields = computed(() => {
  if (!props.isExpandable) return props.columns
  return props.columns.filter((col) => primaryFieldNames.value.has(col.name))
})

const detailFields = computed(() => {
  if (!props.isExpandable) return []
  const rest = props.columns.filter(
    (col) => !primaryFieldNames.value.has(col.name) && col.name !== ACTIONS_COLUMN
  )
  const actions = props.columns.find((col) => col.name === ACTIONS_COLUMN)
  return actions ? [...rest, actions] : rest
})

const headerFields = computed(() => {
  return props.columns.filter(
    (col) => primaryFieldNames.value.has(col.name) || col.name === ACTIONS_COLUMN
  )
})

const resolveFieldValue = (row: Row, col: QTableColumn<Row>): unknown => {
  return typeof col.field === 'function' ? col.field(row) : row[col.field ?? col.name]
}

const getSlotValue = (row: Row, col: QTableColumn<Row>): unknown => {
  const value = resolveFieldValue(row, col)
  return typeof col.format === 'function' ? col.format(value, row) : value
}

const getCellValue = (row: Row, col: QTableColumn<Row>): unknown => {
  const value = getSlotValue(row, col)
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object' && 'title' in value) return value.title || '—'
  return value
}

const getUserValue = (row: Row, col: QTableColumn<Row>): Record<string, unknown> | null => {
  const value = resolveFieldValue(row, col)
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

const hasCellSlot = (col: QTableColumn<Row>): boolean => {
  return typeof slots[`cell-${col.name}`] === 'function'
}
</script>

<style scoped lang="scss">
.table-view-card {
  border: none !important;
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;

  &__item {
    width: 100%;
    padding: $spacing-sm;
    border: 1px solid $grey-4;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    :deep(.q-item) {
      padding: 0.5rem 0.75rem;
    }
  }

  &__header-fields {
    width: 100%;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    align-items: start;
    justify-content: space-between;

    .table-view-card__field {
      border-bottom: none;
    }
  }

  &__field {
    width: 100%;
    display: flex;
    flex-grow: 2;
    align-items: center;
    border-bottom: 1px solid $default-border !important;
    justify-content: space-between;
    gap: $spacing-md;
    padding: $spacing-md $spacing-xs;
    border-bottom: 1px dashed $grey-3;

    &:last-child {
      border-bottom: none !important;
      justify-self: end;
    }
  }
}
</style>
