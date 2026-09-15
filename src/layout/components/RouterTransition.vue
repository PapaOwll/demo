<template>
  <Transition name="fade" mode="out-in">
    <div :key="routeKey" class="router-transition-wrapper">
      <slot />
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const routeKey = computed(() => route.path)
</script>

<style scoped lang="scss">
.router-transition-wrapper {
  width: 100%;
  height: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
