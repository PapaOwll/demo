<template>
  <QForm class="q-col-gutter-md">
    <div class="q-mb-md">
      <span class="text-h6 text-primary">قیمت بر اساس تعداد دندان</span>
    </div>

    <template v-for="(item, i) of question" :key="i">
      <div class="col-12 flex q-gutter-sm items-center">
        <div class="col-md-3 col-12">
          <QChip :label="getTeethLabel(i)" color="primary" text-color="white" size="md" />
        </div>
        <div class="col-md-5 col-12 q-gutter-sm">
          <CurrencyField
            :model-value="item.price"
            :label="`قیمت ${getTeethLabel(i)}`"
            @update:model-value="(e) => updatePrice(i, e)"
          />
        </div>
      </div>
    </template>
  </QForm>
</template>

<script setup>
import { convertToEnNumber } from '@/utils/convert-check-digits'
import CurrencyField from '@/components/Form/CurrencyField'

const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
  questionIndex: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['updateItem'])
const getTeethLabel = (index) => {
  const labels = ['دندان 1', 'دندان 2', 'دندان 3', 'دندان 4', 'دندان 5', 'دندان 6', 'دندان 7']
  return labels[index]
}

const updatePrice = (index, formattedValue) => {
  const numericValue = convertToEnNumber(formattedValue)
  emit('updateItem', {
    questionIndex: props.questionIndex,
    itemIndex: index,
    field: 'price',
    value: numericValue,
  })
}
</script>
