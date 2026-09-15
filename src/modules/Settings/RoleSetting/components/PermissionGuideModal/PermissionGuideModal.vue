<template>
  <QDialog
    :model-value="show"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="handleUpdateShow"
  >
    <QCard class="permission-guide-modal">
      <QCardSection class="bg-primary text-white">
        <div class="row items-center justify-between">
          <Typography variant="heading" size="h5" color="white">راهنمای تنظیم دسترسی</Typography>
          <Button
            variant="flat"
            color="dark"
            :is-icon-only="true"
            :left-icon="IconX"
            @click="handleClose"
          />
        </div>
        <Typography variant="body" size="3" color="white" class="q-mt-sm">
          این راهنما به شما کمک می‌کند تا دسترسی‌های هر بخش را بهتر درک کنید
        </Typography>
      </QCardSection>

      <QCardSection class="q-pa-none">
        <div class="row no-wrap">
          <div class="col-auto category-selector-panel">
            <CategorySelector
              :categories="categories"
              :selected-category-id="selectedCategoryId"
              @select-category="setSelectedCategory"
            />
          </div>

          <div class="col feature-list-panel">
            <FeatureList
              :categories="categories"
              :selected-category-id="selectedCategoryId"
              :read-only="true"
            />
          </div>
        </div>
      </QCardSection>

      <QCardSection class="row justify-end q-pa-md bg-grey-1">
        <Button variant="outline" color="dark" text="بستن" @click="handleClose" />
      </QCardSection>
    </QCard>
  </QDialog>
</template>

<script setup>
import { computed } from 'vue'
import { IconX } from '@tabler/icons-vue'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import CategorySelector from './components/CategorySelector'
import FeatureList from './components/FeatureList'
import { usePermissionGuide } from './composables/use-permission-guide'

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  currentModules: {
    type: Array,
    required: true,
  },
  aclStructure: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:show'])

const { selectedCategoryId, categories, setSelectedCategory } = usePermissionGuide(
  () => props.currentModules,
  computed(() => props.aclStructure)
)

const handleUpdateShow = (value) => {
  emit('update:show', value)
}

const handleClose = () => {
  emit('update:show', false)
}
</script>

<style lang="scss" scoped>
.permission-guide-modal {
  width: 100%;
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  border-radius: $radius-md;

  .category-selector-panel {
    width: 320px;
    border-right: 1px solid $grey-4;
    background-color: $grey-1;
    overflow-y: auto;
  }

  .feature-list-panel {
    padding: 16px;
    overflow-y: auto;
  }
}
</style>
