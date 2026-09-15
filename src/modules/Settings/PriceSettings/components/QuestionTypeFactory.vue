<template>
  <component
    :is="getQuestionComponent(props.question.type)"
    :question="items"
    :question-index="questionIndex"
    @delete-item="handleDeleteItem"
    @add-item="handleAddItem"
    @update-item="handleUpdateItem"
  />
  <hr />
</template>

<script setup>
import { defineAsyncComponent, reactive, watch, nextTick } from 'vue'
import { useQuestionTypes } from '@/composables/use-question-types'

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

const emit = defineEmits(['deleteItem', 'addItem', 'updateItem', 'itemsChanged'])

const { initializeItems, handleItemUpdate, addNewItem, removeItem, validateItems } =
  useQuestionTypes()

const getInitialItems = () => {
  if (props.question.items && props.question.items.length > 0) {
    return props.question.items
  }
  return initializeItems(props.question)
}

const items = reactive(getInitialItems())

watch(
  () => props.question.items,
  (newItems) => {
    if (newItems && Array.isArray(newItems) && newItems.length > 0) {
      items.splice(0, items.length, ...newItems)
    } else if (!newItems || newItems.length === 0) {
      const defaultItems = initializeItems(props.question)
      items.splice(0, items.length, ...defaultItems)
    }
  },
  { deep: true }
)

watch(
  items,
  (newItems) => {
    emit('itemsChanged', {
      questionIndex: props.questionIndex,
      items: [...newItems],
    })
  },
  { deep: true }
)

const questionComponents = {
  1: defineAsyncComponent(() => import('./QuestionTypes/BrandPriceType')),
  2: defineAsyncComponent(() => import('./QuestionTypes/BooleanType')),
  3: defineAsyncComponent(() => import('./QuestionTypes/CountBasedType')),
  4: defineAsyncComponent(() => import('./QuestionTypes/TeethType')),
  5: defineAsyncComponent(() => import('./QuestionTypes/JawType')),
  6: defineAsyncComponent(() => import('./QuestionTypes/QuadrantType')),
  7: defineAsyncComponent(() => import('./QuestionTypes/BrandPriceType')),
  // Type 8 (PRICE_LIST) was merged into type 7 (SIMPLE_MULTIPLE)
}

const getQuestionComponent = (type) => {
  return questionComponents[type] || questionComponents[1]
}

const handleUpdateItem = async (updateData) => {
  const updatedItems = handleItemUpdate(items, updateData, props.question.type)

  items.splice(0, items.length, ...updatedItems)

  await nextTick()

  emit('updateItem', {
    ...updateData,
    items: [...updatedItems],
    isValid: validateItems(updatedItems, props.question.type),
  })
}

const handleAddItem = () => {
  const updatedItems = addNewItem(items, props.question)
  items.splice(0, items.length, ...updatedItems)

  emit('addItem', {
    questionIndex: props.questionIndex,
    items: [...updatedItems],
  })
}

const handleDeleteItem = (deleteData) => {
  // Don't remove the item here - let the parent handle confirmation first
  emit('deleteItem', {
    ...deleteData,
    removeFromUI: () => {
      // This callback will be called only after confirmation
      const updatedItems = removeItem(items, deleteData.itemIndex)
      items.splice(0, items.length, ...updatedItems)
    },
  })
}
</script>
