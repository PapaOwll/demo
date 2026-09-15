<template>
  <div class="user-selected-serves">
    <div v-if="userSelectedServes.length > 0" class="user-selected-serves__list">
      <QChip
        v-for="item in userSelectedServes"
        :key="item.id"
        color="warning"
        text-color="white"
        class="user-selected-serves__chip"
      >
        {{ item.title }}
      </QChip>
    </div>
    <div v-else class="user-selected-serves__empty">
      <QChip color="grey-6" text-color="white" class="user-selected-serves__chip--empty">
        بدون خدمت
      </QChip>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGetServesQuery } from '@/modules/User/query'

const props = defineProps({
  selectedServes: {
    type: Object,
    default: () => ({}),
  },
})

const { data: allServes } = useGetServesQuery()
const serves = computed(() => allServes.value?.items ?? [])

const userSelectedServes = computed(() => {
  const { selectedServes } = props
  if (!selectedServes || !Array.isArray(selectedServes)) {
    return []
  }
  return serves.value.filter((serve) => selectedServes.includes(serve.id))
})
</script>

<style lang="scss" scoped>
.user-selected-serves {
  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__empty {
    display: flex;
  }

  &__chip {
    margin: 4px;
    padding: 8px 12px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 14px;
  }

  &__chip--empty {
    margin: 4px;
    padding: 8px 12px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 14px;
    opacity: 0.8;
  }
}
</style>
