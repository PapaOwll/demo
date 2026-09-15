<template>
  <div class="row q-col-gutter-sm">
    <template v-for="item in visibleItems" :key="item.name">
      <div
        class="col-md-2 col-md-grow col-12"
        :class="{ 'filter-builder__toggle-wrapper': item.type === 'toggle' }"
      >
        <div v-if="item.type === 'toggle'" class="filter-builder__toggle-box">
          <Typography variant="body" size="3" weight="bold">{{ item.title }}</Typography>
          <component
            :is="getComponent(item)"
            :model-value="formValues[item.name]"
            v-bind="getComponentProps(item)"
            @update:model-value="(val) => handleInput(item, val)"
          />
        </div>
        <component
          :is="getComponent(item)"
          v-else
          :model-value="formValues[item.name]"
          v-bind="getComponentProps(item)"
          @update:model-value="(val) => handleInput(item, val)"
        />
      </div>
    </template>
    <QExpansionItem
      v-if="hiddenItems.length > 0"
      v-model="expanded"
      expand-icon-toggle
      :header-style="{ display: 'none' }"
      expand-icon="none"
    >
      <div class="row q-col-gutter-sm">
        <div
          v-for="item in hiddenItems"
          :key="item.name"
          class="col-md-2 col-md-grow col-12"
          :class="{ 'filter-builder__toggle-wrapper': item.type === 'toggle' }"
        >
          <div v-if="item.type === 'toggle'" class="filter-builder__toggle-box">
            <Typography variant="body" size="3" weight="bold">{{ item.title }}</Typography>
            <component
              :is="getComponent(item)"
              :model-value="formValues[item.name]"
              v-bind="getComponentProps(item)"
              @update:model-value="(val) => handleInput(item, val)"
            />
          </div>
          <component
            :is="getComponent(item)"
            v-else
            :model-value="formValues[item.name]"
            v-bind="getComponentProps(item)"
            @update:model-value="(val) => handleInput(item, val)"
          />
        </div>
      </div>
    </QExpansionItem>
  </div>
  <div class="row justify-between q-my-sm">
    <div class="flex items-center q-gutter-sm">
      <Button
        v-if="hiddenItems.length > 0"
        variant="outline"
        color="light-blue"
        :left-icon="IconAdjustmentsHorizontal"
        :text="expanded ? 'بستن' : 'همه فیلتر ها'"
        @click="expanded = !expanded"
      />
      <Button
        variant="flat"
        color="grey"
        size="md"
        :left-icon="IconSettings"
        is-icon-only
        is-rounded
      >
        <QMenu anchor="bottom right" self="top right" :offset="[0, 4]">
          <div class="q-pa-sm" style="min-width: 220px">
            <div class="q-mb-sm q-px-sm">
              <Typography variant="caption" color="grey" weight="medium">نمایش فیلترها</Typography>
            </div>
            <QList dense>
              <QItem
                v-for="item in props.items"
                :key="item.name"
                clickable
                @click="toggleFilterVisibility(item.name)"
              >
                <QItemSection side>
                  <CheckboxField
                    :model-value="isFilterVisible(item.name)"
                    dense
                    @update:model-value="() => toggleFilterVisibility(item.name)"
                  />
                </QItemSection>
                <QItemSection>
                  <Typography variant="body" size="4">{{ item.title }}</Typography>
                </QItemSection>
              </QItem>
            </QList>
          </div>
        </QMenu>
      </Button>
      <template v-if="props.loadTotalCount || props.totalCount">
        <Button
          v-if="props.loadTotalCount"
          variant="outline"
          color="grey"
          size="sm"
          is-icon-only
          is-rounded
          :left-icon="IconSum"
          :is-loading="props.isTotalCountLoading"
          @click="props.loadTotalCount"
        />

        <QChip v-if="props.totalCount != null" color="grey-3" square>
          {{ props.totalCount }} {{ props.totalLabel }}
        </QChip>
      </template>
      <slot name="totalCount" />
    </div>

    <div class="filter-actions">
      <slot
        name="actions"
        :apply="applyFilter"
        :reset="resetFilter"
        :has-active-filters="hasActiveFilters"
      />
      <Button
        v-if="hasActiveFilters"
        variant="outline"
        color="red"
        text="حذف تغییرات"
        @click="resetFilter"
      />
      <Button variant="filled" color="blue" text="اعمال تغییرات" @click="applyFilter" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { QCheckbox, QMenu, QList, QItem, QItemSection, QChip } from 'quasar'
import { useRoute } from 'vue-router'
import TextField from '@/base/TextField'
import SelectField from '@/base/SelectField'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import PersianDate from '@/components/Form/PersianDate'
import { IconAdjustmentsHorizontal, IconSettings, IconSum } from '@tabler/icons-vue'
import CheckboxField from '@/base/Checkbox'
import ToggleField from '@/base/Toggle'

const STORAGE_PREFIX = 'crm-persist-filter-visibility'

const props = defineProps({
  items: { type: Array, required: true },
  formValues: { type: Object, required: true },
  hasActiveFilters: { type: Boolean, default: false },
  handleInput: { type: Function, required: true },
  applyFilters: { type: Function, required: true },
  resetFilters: { type: Function, required: true },
  storageKey: { type: String, default: undefined },
  totalCount: { type: Number, default: undefined },
  totalLabel: { type: String, default: undefined },
  isTotalCountLoading: { type: Boolean, default: false },
  loadTotalCount: { type: Function, default: null },
})

const emit = defineEmits(['apply', 'reset'])

const route = useRoute()
const expanded = ref(false)
const MAX_VISIBLE_ITEMS = 6

const resolvedStorageKey = computed(() => {
  const key = props.storageKey || route.name || route.path
  return `${STORAGE_PREFIX}-${key}`
})

const filterVisibility = ref({})

const loadVisibility = () => {
  try {
    const stored = localStorage.getItem(resolvedStorageKey.value)
    filterVisibility.value = stored ? JSON.parse(stored) : {}
  } catch {
    filterVisibility.value = {}
  }
}

const saveVisibility = () => {
  localStorage.setItem(resolvedStorageKey.value, JSON.stringify(filterVisibility.value))
}

const isFilterVisible = (name) => {
  return filterVisibility.value[name] !== false
}

const toggleFilterVisibility = (name) => {
  filterVisibility.value[name] = filterVisibility.value[name] === false
  saveVisibility()
}

const activeItems = computed(() => props.items.filter((item) => isFilterVisible(item.name)))
const visibleItems = computed(() => activeItems.value.slice(0, MAX_VISIBLE_ITEMS))
const hiddenItems = computed(() => activeItems.value.slice(MAX_VISIBLE_ITEMS))

onMounted(() => {
  loadVisibility()
})

const resetFilter = () => {
  emit('reset')
}

const applyFilter = () => {
  const filteredValues = {}

  Object.entries(props.formValues).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          const validValues = value.filter((v) => v !== null && v !== undefined && v !== '')
          if (validValues.length > 0) {
            filteredValues[key] = validValues
          }
        }
      } else {
        filteredValues[key] = value
      }
    }
  })

  emit('apply', { ...filteredValues })
}

const getComponent = (item) => {
  switch (item?.type) {
    case 'text': {
      return TextField
    }
    case 'number': {
      return TextField
    }
    case 'select': {
      return SelectField
    }
    case 'date': {
      return PersianDate
    }
    case 'component': {
      return item.component
    }
    case 'checkbox': {
      return QCheckbox
    }
    case 'toggle': {
      return ToggleField
    }
    default: {
      return TextField
    }
  }
}

const getComponentProps = (item) => {
  const commonProps = {
    label: item.title,
    outlined: true,
    dense: true,
    clearable: true,
  }
  switch (item.type) {
    case 'text': {
      return {
        ...commonProps,
        type: 'text',
        onkeydown: (key) => (key.key === 'Enter' ? applyFilter() : undefined),
      }
    }
    case 'number': {
      return {
        ...commonProps,
        type: 'text',
        onkeydown: (key) => (key.key === 'Enter' ? applyFilter() : undefined),
      }
    }
    case 'select': {
      return {
        ...commonProps,
        variant: 'outline',
        options: item.options?.value || item.options,
        multiple: item.multiple ?? false,
        useInput: true,
        useChips: item.multiple,
        inputDebounce: 400,
        mapOptions: true,
        optionLabel: (opt) => opt.label,
        optionValue: (opt) => opt.value,
        emitValue: true,
      }
    }
    case 'date': {
      return {
        ...commonProps,
        withTime: true,
        format: item.dateFormat,
      }
    }
    case 'checkbox': {
      return {
        ...commonProps,
        label: item.title,
        val: false,
        indeterminateValue: null,
        trueValue: item.value ?? 1,
        leftLabel: true,
      }
    }
    case 'toggle': {
      return {
        label: '',
      }
    }
    case 'component': {
      return {
        ...commonProps,
        variant: 'outline',
        enumKey: item?.enumKey ?? null,
        slug: item?.slug ?? null,
        multiple: item.multiple ?? false,
        useChips: item.multiple ?? false,
        inputDebounce: 400,
        mapOptions: true,
        emitValue: true,
        userRole: item.userRole,
        lazy: true,
      }
    }
    default: {
      return commonProps
    }
  }
}
</script>

<style scoped lang="scss">
:deep(.q-expansion-item__content) {
  overflow: hidden;
}
.filter-actions {
  display: flex;
  justify-content: end;
  align-items: center;
  flex-grow: 1;
  gap: 0.75rem;
  padding: 8px 16px;

  &__spacer {
    flex: 1;
  }
}
.filter-builder__toggle-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.filter-builder__toggle-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 22px;
  padding: 8px 12px;
  border: 1px solid $grey-3;
  border-radius: $radius-sm;
}
</style>
