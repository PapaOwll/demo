<template>
  <QForm class="q-col-gutter-md">
    <template v-for="(item, i) of question" :key="i">
      <div class="col-12 flex q-gutter-sm">
        <QInput
          v-model="item.title"
          label="عنوان آیتم"
          outlined
          clearable
          clear-icon="clear"
          @update:model-value="(e) => updateItem(i, 'title', e)"
        />
        <CurrencyField
          :model-value="item.price"
          label="قیمت"
          @update:model-value="(e) => updateItem(i, 'price', e)"
        />
        <QBtn
          color="negative"
          class="rounded-borders q-px-lg"
          outline
          unelevated
          label="حذف"
          @click="deleteItem(item, i)"
        />
      </div>
    </template>

    <div class="col-12">
      <QBtn color="positive" outline @click="$emit('addItem')">
        <IconPlus class="q-mr-xs" />
        افزودن آیتم
      </QBtn>
    </div>
  </QForm>
</template>

<script setup>
import { IconPlus } from '@tabler/icons-vue'
import CurrencyField from '@/components/Form/CurrencyField'

const props = defineProps({
  question: Object,
  questionIndex: Number,
})

const emit = defineEmits(['deleteItem', 'addItem', 'updateItem'])

const updateItem = (index, field, value) => {
  emit('updateItem', {
    questionIndex: props.questionIndex,
    itemIndex: index,
    field,
    value,
  })
}

const deleteItem = (serve, index) => {
  emit('deleteItem', {
    serve,
    questionIndex: props.questionIndex,
    itemIndex: index,
  })
}
</script>
