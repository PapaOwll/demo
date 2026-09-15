<template>
  <div class="bg-grey-1 rounded-borders">
    <div class="row items-center full-width justify-between">
      <!-- Title Slot -->
      <div class="flex items-center justify-center">
        <slot name="title" />
      </div>
      <!-- Actions Slot -->
      <slot name="actions" />
    </div>

    <!-- Content Slot -->
    <div>
      <QCardSection
        v-if="$slots['left-content'] || $slots['right-content'] || $slots['full-width']"
        class="bg-grey-1 rounded-borders q-pt-none"
      >
        <div class="row q-col-gutter-sm">
          <div v-if="$slots['right-content']" class="col-md-6 col-12">
            <!-- Left Content Slot -->
            <slot name="right-content" />
          </div>
          <div v-if="$slots['left-content']" class="col-md-6 col-12">
            <!-- Right Content Slot -->
            <slot name="left-content" />
          </div>
          <div v-if="$slots['full-width']" class="col-md-12 col-12">
            <!-- Right Content Slot -->
            <slot name="full-width" />
          </div>
        </div>
      </QCardSection>
    </div>
  </div>
</template>

<script setup></script>
<style></style>
