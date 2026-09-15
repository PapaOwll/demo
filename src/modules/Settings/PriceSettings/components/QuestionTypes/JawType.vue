<template>
  <QForm class="q-col-gutter-md">
    <div class="q-mb-md">
      <span class="text-h6 text-primary">قیمت بر اساس نوع فک</span>
    </div>

    <template v-for="(item, i) of question" :key="i">
      <div class="col-12 flex q-gutter-sm items-center q-mb-md">
        <div class="col-md-6 col-12">
          <div class="flex items-center q-gutter-sm">
            <span class="text-body1 text-weight-medium">{{ item.title }}</span>
          </div>
        </div>
        <div class="col-md-6 col-12">
          <CurrencyField
            :model-value="item.price"
            :label="`قیمت ${item.title}`"
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
const updatePrice = (index, value) => {
  const formattedValue = convertToEnNumber(value)
  emit('updateItem', {
    questionIndex: props.questionIndex,
    itemIndex: index,
    field: 'price',
    value: formattedValue,
  })
}
</script>
