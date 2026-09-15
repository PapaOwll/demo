<template>
  <div class="tpu">
    <div class="tpu__top">
      <div class="tpu__user">
        <IconUser stroke="2" :size="35" />
        <div>
          <div>
            {{ `${user?.firstName || ''} ${user?.name || ''}` }}
          </div>
          <div>{{ user?.mobile ? `0${user?.mobile}` : '' }}</div>
        </div>
      </div>
      <div />
    </div>
  </div>
</template>

<script setup>
// TODO: user change action
import { computed } from 'vue'
import { IconUser } from '@tabler/icons-vue'
import { useTpProvider } from '../../composables/use-tp-provider'

const treatmentData = useTpProvider('treatmentData')
const user = computed(() => treatmentData?.value?.user)
</script>

<style lang="scss" scoped>
.tpu {
  &__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  &__btn {
    text-decoration: none;
  }
}
</style>
