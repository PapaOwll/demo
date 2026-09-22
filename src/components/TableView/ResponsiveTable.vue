<template>
  <QTable
    v-if="!isMobile"
    v-bind="$attrs"
    :rows="rows"
    :columns="columns"
    :row-key="rowKey"
    :loading="loading"
  >
    <template v-for="name in cellSlotNames()" :key="name" #[`body-${name}`]="scope">
      <QTd :props="scope">
        <slot
          :name="name"
          :row="scope.row"
          :col="scope.col"
          :value="scope.value"
          :row-index="scope.rowIndex"
        />
      </QTd>
    </template>

    <template v-for="name in tableSlotNames()" :key="name" #[name]="scope">
      <slot :name="name" v-bind="scope ?? {}" />
    </template>
  </QTable>

  <TableViewCard
    v-else
    v-bind="$attrs"
    :rows="rows"
    :columns="columns"
    :row-key="rowKey"
    :user-columns="userColumns"
    :is-expandable="isExpandable"
    :primary-columns="primaryColumns"
    :loading="loading"
  >
    <template v-for="name in cardSlotNames()" :key="name" #[name]="scope">
      <slot :name="name" v-bind="scope ?? {}" />
    </template>
  </TableViewCard>
</template>

<script setup lang="ts" generic="Row extends Record<string, unknown>">
import { useSlots } from 'vue'
import type { QTableColumn } from 'quasar'
import TableViewCard from '@/components/TableView/TableViewCard'
import { useIsMobile } from '@/composables/use-is-mobile'

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

withDefaults(defineProps<Props>(), {
  rows: () => [],
  columns: () => [],
  rowKey: 'id',
  userColumns: () => ['userFullName', 'name'],
  isExpandable: false,
  primaryColumns: () => [],
  loading: false,
})

const CARD_ONLY_SLOTS = ['card-item', 'card-header']
const CARD_SLOT_NAMES = new Set(['no-data', 'bottom', 'loading', ...CARD_ONLY_SLOTS])

const slots = useSlots()
const isMobile = useIsMobile()

const cellSlotNames = (): string[] => Object.keys(slots).filter((name) => name.startsWith('cell-'))

const tableSlotNames = (): string[] =>
  Object.keys(slots).filter((name) => !name.startsWith('cell-') && !CARD_ONLY_SLOTS.includes(name))

const cardSlotNames = (): string[] =>
  Object.keys(slots).filter((name) => name.startsWith('cell-') || CARD_SLOT_NAMES.has(name))
</script>
