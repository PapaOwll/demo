<template>
  <div class="error-test-page">
    <ErrorSimulator />
  </div>
</template>

<script setup>
import ErrorSimulator from '@/components/ErrorSimulator'
</script>

<style lang="scss" scoped>
.error-test-page {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  padding: 2rem;
}
</style>
