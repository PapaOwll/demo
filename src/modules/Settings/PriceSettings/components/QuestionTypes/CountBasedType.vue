<template>
  <QForm class="q-col-gutter-md">
    <div class="col-12 flex q-gutter-sm">
      <div class="col-md-4 col-12">
        <NumberField :model-value="unitCount" label="تعداد" @update:model-value="updateCount" />
      </div>
      <div class="col-md-6 col-12">
        <CurrencyField
          :model-value="unitPrice || 0"
          label="قیمت واحد"
          @update:model-value="updatePrice"
        />
      </div>
    </div>

    <div v-if="previewItems.length > 1" class="col-12 q-mt-md">
      <QExpansionItem icon="visibility" label="پیش‌نمایش قیمت‌ها" header-class="text-primary">
        <div class="q-pa-md">
          <div v-for="(item, i) in previewItems" :key="i" class="row q-mb-sm">
            <div class="col-6">
              <Typography variant="body" size="4">{{ item.title }} عدد:</Typography>
            </div>
            <div class="col-6">
              <Typography variant="body" size="4" weight="bold">
                {{ generatePriceFormat(item.price) }}
              </Typography>
            </div>
          </div>
        </div>
      </QExpansionItem>
    </div>
  </QForm>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { generatePriceFormat } from '@/utils/formatter'
import { convertToEnNumber } from '@/utils/convert-check-digits'
import NumberField from '@/components/Form/NumberField'
import CurrencyField from '@/components/Form/CurrencyField'
import Typography from '@/base/Typography'

const props = defineProps({
  question: {
    type: Array,
    required: true,
  },
  questionIndex: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['updateItem'])

const unitCount = ref(1)
const unitPrice = ref(0)

const initializeValues = () => {
  if (props.question && props.question.length > 0) {
    unitCount.value = Number(props.question.at(-1).title) || 1
    unitPrice.value = Number(props.question.at(0).price) || 0
  }
}

onMounted(() => {
  initializeValues()
})

watch(
  () => props.question,
  (newQuestion) => {
    if (newQuestion && newQuestion.length > 0) {
      const newCount = Number(newQuestion.at(-1).title) || 1
      const newPrice = Number(newQuestion.at(0).price) || 0

      if (unitCount.value !== newCount) {
        unitCount.value = newCount
      }
      if (unitPrice.value !== newPrice) {
        unitPrice.value = newPrice
      }
    }
  },
  { deep: true, immediate: true }
)

const previewItems = computed(() => {
  const count = unitCount.value || 1
  const price = unitPrice.value || 0

  return Array.from({ length: count }, (_, i) => ({
    title: String(i + 1),
    price: price * (i + 1),
  }))
})

const updateCount = (value) => {
  const count = convertToEnNumber(value)
  unitCount.value = count
  emit('updateItem', {
    questionIndex: props.questionIndex,
    itemIndex: 0,
    field: 'title',
    value: String(count),
  })
}

const updatePrice = (value) => {
  const price = convertToEnNumber(value)
  unitPrice.value = price
  emit('updateItem', {
    questionIndex: props.questionIndex,
    itemIndex: 0,
    field: 'price',
    value: price,
  })
}
</script>
