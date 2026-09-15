<template>
  <SelectField
    :model-value="modelValue"
    :label="label"
    :placeholder="placeholder"
    :options="userOptions"
    option-label="label"
    option-value="value"
    :emit-value="emitValue"
    :map-options="emitValue"
    variant="outline"
    clearable
    use-input
    :hide-dropdown-icon="dropDownIcon"
    :multiple="multiple"
    :loading="userLoading"
    :error="!!errorMessage || null"
    :error-message="errorMessage"
    :disable="disable"
    v-bind="$attrs"
    :search-fn="filterUsers"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur')"
  >
    <template #option="{ opt, itemProps }">
      <QItem v-bind="itemProps">
        <QItemSection>
          <QItemLabel>
            {{
              opt.rawData
                ? `${opt.rawData.firstName || ''} ${opt.rawData.name || 'بدون نام'} / ${opt.rawData.mobile}/ ${opt.rawData.docNumber || ''}`
                : opt.label
            }}
          </QItemLabel>
          <QItemLabel v-if="opt.rawData" caption class="text-grey-6">
            {{ opt.rawData.advisor?.name || 'بدون مشاور' }}
          </QItemLabel>
        </QItemSection>
      </QItem>
    </template>

    <template #no-option>
      <QItem class="text-center">
        <QItemSection class="text-grey">هیچ کاربری یافت نشد</QItemSection>
      </QItem>
    </template>
  </SelectField>
</template>

<script setup>
import { computed } from 'vue'
import SelectField from '@/base/SelectField'
import { useUserSearch } from '@/composables/use-user-search'
import { convertToEnNumber } from '@/utils/convert-check-digits'
import { addFallbackOption } from '@/utils/select-fallback-option'

const props = defineProps({
  modelValue: {
    type: [String, Number, Array, Object],
    default: null,
  },
  label: {
    type: String,
    default: 'کاربر',
  },
  placeholder: {
    type: String,
    default: 'انتخاب کاربر',
  },
  errorMessage: {
    type: String,
    default: null,
  },
  disable: {
    type: Boolean,
    default: false,
  },
  dropDownIcon: {
    type: Boolean,
    default: false,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  displayLabel: {
    type: String,
    default: null,
  },
  emitValue: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['update:modelValue', 'blur'])

const { users, userLoading, searchUsers } = useUserSearch()

const userOptions = computed(() => {
  const items = (users.value?.items || []).map((item) => ({
    label: `${item?.firstName || ''} ${item?.name || 'بدون نام'} / ${item.mobile}/ ${item.docNumber || ''}`,
    value: item.id,
    rawData: item,
  }))
  addFallbackOption(items, props.modelValue, 'name', props.displayLabel, !!users.value)
  return items
})

const filterUsers = (val, update) => {
  const q = convertToEnNumber(val?.trim() || '')

  if (q.length < 2) {
    update(() => {})
    return
  }

  update(() => {
    searchUsers(q)
  })
}
</script>
