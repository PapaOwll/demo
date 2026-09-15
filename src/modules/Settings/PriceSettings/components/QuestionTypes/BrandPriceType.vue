<template>
  <template v-for="(item, i) of question" :key="i">
    <div class="row items-center q-col-gutter-md q-my-sm">
      <div class="col-md-5 col-grow">
        <TextField
          v-model="item.title"
          variant="outlined"
          label="نام برند"
          clearable
          @update:model-value="(e) => updateItem(i, 'title', e)"
        />
      </div>
      <div class="col-md-5 col-grow">
        <CurrencyField
          :model-value="item.price"
          label="قیمت"
          @update:model-value="(e) => updateItem(i, 'price', e)"
        />
      </div>
      <div class="col-md-2 col-grow self-end">
        <Button variant="outline" color="red" text="حذف" @click="deleteItem(item, i)" />
      </div>
    </div>
  </template>

  <div class="col-12">
    <Button
      variant="outline"
      color="green"
      :left-icon="IconPlus"
      text="افزودن آیتم"
      @click="$emit('addItem')"
    />
  </div>
</template>

<script setup>
import { IconPlus } from '@tabler/icons-vue'
import CurrencyField from '@/components/Form/CurrencyField'
import TextField from '@/base/TextField'
import Button from '@/base/Button'

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
