<template>
  <div class="col-md-12 q-mb-md">
    <QBtn
      v-if="getPerms('setting', 'update', true, 'pricing') && question"
      color="primary"
      outline
      unelevated
      size="lg"
      :label="question.title"
      style="min-width: 250px"
      class="q-mb-md"
    >
      <IconChevronDown class="q-ml-xs" />
      <QMenu auto-close transition-show="jump-down" transition-hide="jump-up" fit>
        <QList style="min-width: 100px">
          <QItem>
            <QItemSection class="flex justify-start">
              <QBtn color="primary" outline unelevated @click="$emit('edit')">
                <IconEdit class="q-ml-sm" />
                <span>ویرایش عنوان</span>
              </QBtn>
            </QItemSection>
          </QItem>
          <QItem>
            <QItemSection>
              <QBtn color="negative" outline unelevated @click="$emit('delete')">
                <IconTrash class="q-ml-sm" />
                <span>حذف عنوان</span>
              </QBtn>
            </QItemSection>
          </QItem>
        </QList>
      </QMenu>
    </QBtn>
    <Typography v-else variant="heading" size="h6" class="q-title">
      {{ question.title }}
    </Typography>
  </div>
</template>

<script setup>
import { getPerms } from '@/utils/get-perms'
import { IconEdit, IconTrash, IconChevronDown } from '@tabler/icons-vue'
import Typography from '@/base/Typography'

defineProps({
  question: {
    type: Object,
    default: null,
  },
})

defineEmits(['edit', 'delete'])
</script>
<style scoped lang="scss">
.q-title {
  border: 1px solid $dark;
  border-radius: $radius-md;
  width: max-content;
  padding: $spacing-md $spacing-lg;
}
</style>
