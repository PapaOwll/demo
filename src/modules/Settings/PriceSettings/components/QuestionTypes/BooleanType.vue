<template>
  <QForm class="q-col-gutter-md">
    <template v-for="(item, i) of question" :key="i">
      <div class="col-12 flex q-gutter-sm items-center">
        <div class="col-4">
          <span class="text-body1 text-weight-medium">{{ item.title }}</span>
        </div>
        <div class="col-6">
          <CurrencyField
            :model-value="item.price"
            label="قیمت"
            @update:model-value="(e) => updatePrice(i, 'price', e)"
          />
        </div>
      </div>
    </template>
  </QForm>
</template>

<script setup>
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

const updatePrice = (index, field, value) => {
  emit('updateItem', {
    questionIndex: props.questionIndex,
    itemIndex: index,
    field,
    value,
  })
}
</script>
