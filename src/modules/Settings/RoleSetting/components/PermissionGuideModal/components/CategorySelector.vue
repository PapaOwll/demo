<template>
  <div class="category-selector">
    <Typography variant="heading" size="h6" class="q-mb-md">دسته‌بندی‌ها</Typography>

    <QList separator padding>
      <QItem
        v-for="category in categories"
        :key="category.id"
        clickable
        :class="{ 'active-category': isActive(category.id) }"
        @click="handleCategoryClick(category.id)"
      >
        <QItemSection avatar>
          <QIcon :name="category.icon" :color="isActive(category.id) ? 'primary' : 'grey-7'" />
        </QItemSection>

        <QItemSection>
          <QItemLabel :class="{ 'text-weight-bold': isActive(category.id) }">
            {{ category.title }}
          </QItemLabel>
          <QItemLabel caption>{{ category.description }}</QItemLabel>
        </QItemSection>

        <QItemSection side>
          <QChip
            :label="category.features.length"
            color="grey-3"
            text-color="grey-8"
            size="sm"
            outline
          />
        </QItemSection>
      </QItem>
    </QList>
  </div>
</template>

<script setup>
import Typography from '@/base/Typography'

const props = defineProps({
  categories: {
    type: Array,
    required: true,
  },
  selectedCategoryId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['select-category'])

const isActive = (categoryId) => {
  return props.selectedCategoryId === categoryId
}

const handleCategoryClick = (categoryId) => {
  emit('select-category', categoryId)
}
</script>

<style lang="scss" scoped>
.category-selector {
  .active-category {
    background-color: $blue-1;
    border-right: 3px solid $primary;
  }
}
</style>
