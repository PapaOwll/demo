<template>
  <div class="booking-calendar">
    <PersianCalendar />
  </div>
</template>

<script setup>
import PersianCalendar from '../components/PersianCalendar'
</script>

<style scoped>
.booking-calendar {
  margin: -16px;
  height: calc(100vh - 74px);
}
</style>
