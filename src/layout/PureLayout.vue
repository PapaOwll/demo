<template>
  <div class="pure-layout">
    <div class="container">
      <div class="q-mx-auto">
        <OfflineWrapper>
          <RouterView />
        </OfflineWrapper>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import OfflineWrapper from '@/components/OfflineWrapper'
</script>

<style lang="scss" scoped>
.pure-layout {
  background-color: $gray-200;
  min-height: 100vh;
}
</style>
