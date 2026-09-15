<template>
  <div class="feature-list">
    <div v-if="category" class="q-mb-md">
      <Typography variant="heading" size="h5" class="q-mb-sm">{{ category.title }}</Typography>
      <Typography variant="body" size="3" color="grey">{{ category.description }}</Typography>
    </div>

    <div v-else class="text-center q-pa-xl text-grey-7">
      <QIcon name="category" size="48px" color="grey-4" />
      <Typography variant="body" size="3" color="grey" class="q-mt-md">
        لطفاً یک دسته‌بندی را انتخاب کنید
      </Typography>
    </div>

    <div v-if="category" class="features-container">
      <FeatureItem
        v-for="feature in category.features"
        :key="feature.id"
        :feature="feature"
        :read-only="readOnly"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Typography from '@/base/Typography'
import FeatureItem from './FeatureItem'

const props = defineProps({
  categories: {
    type: Array,
    required: true,
  },
  selectedCategoryId: {
    type: String,
    default: null,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
})

const category = computed(() => {
  if (!props.selectedCategoryId) return null
  return props.categories.find((c) => c.id === props.selectedCategoryId)
})
</script>

<style lang="scss" scoped>
.feature-list {
  .features-container {
    max-height: calc(100vh - 400px);
    overflow-y: auto;
  }
}
</style>
