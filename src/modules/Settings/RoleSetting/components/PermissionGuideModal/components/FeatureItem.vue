<template>
  <div class="feature-item">
    <QCard flat bordered class="q-mb-sm">
      <QCardSection class="q-pa-md">
        <div class="row items-start q-gutter-md">
          <div class="col">
            <div class="row items-baseline q-gutter-sm q-mb-sm">
              <Typography variant="body" size="2" weight="bold">{{ feature.title }}</Typography>
              <QIcon
                v-if="feature.warning"
                name="warning"
                color="red"
                size="20px"
                class="cursor-pointer"
              >
                <QTooltip class="text-weight-bold text-subtitle2 text-white bg-black">
                  {{ feature.warning }}
                </QTooltip>
              </QIcon>
            </div>

            <!-- Description -->
            <Typography
              v-if="feature.description"
              variant="body"
              size="3"
              color="grey"
              class="q-mb-sm"
            >
              {{ feature.description }}
            </Typography>

            <div class="row q-gutter-xs q-mb-sm">
              <PermissionTag
                v-for="(permission, index) in feature.permissions"
                :key="index"
                :permission="permission"
                :complexity="feature.complexity"
                :show-tooltip="true"
              />
            </div>

            <div v-if="feature.note" class="row items-center q-gutter-xs q-mt-xs">
              <QIcon name="info" size="16px" color="grey" />
              <Typography variant="body" size="3" color="grey">
                {{ feature.note }}
              </Typography>
            </div>
          </div>
        </div>
      </QCardSection>
    </QCard>
  </div>
</template>

<script setup>
import Typography from '@/base/Typography'
import PermissionTag from './PermissionTag'

defineProps({
  feature: {
    type: Object,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.feature-item {
  /* No specific styles needed for read-only mode */
}
</style>
