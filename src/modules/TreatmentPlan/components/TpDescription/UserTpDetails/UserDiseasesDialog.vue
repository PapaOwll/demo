<template>
  <Modal
    :model-value="visible"
    :show-header="false"
    :show-close="false"
    transition-show="slide-down"
    transition-hide="slide-up"
    :width="isMobile ? '100%' : 400"
    @update:model-value="$emit('update:visible', $event)"
  >
    <QInnerLoading :showing="!medicalInfo">
      <QSpinnerTail />
    </QInnerLoading>
    <div class="ud">
      <div class="form-header">
        <Typography variant="heading" size="h6">سابقه بیماری</Typography>
        <Button
          variant="flat"
          color="dark"
          is-rounded
          is-icon-only
          :left-icon="IconX"
          @click="$emit('update:visible', false)"
        />
      </div>
      <div class="ud__content">
        <div class="ud__content-card">
          <Typography variant="caption">نام بیماری</Typography>
          <Typography
            v-for="disease in medicalInfo?.diseases"
            :key="disease.id"
            variant="body"
            weight="bold"
            size="4"
          >
            {{ disease?.name }}
            <Typography v-if="medicalInfo.diseases.length > 1" variant="caption">,</Typography>
          </Typography>
        </div>
        <div class="ud__content-card">
          <Typography variant="caption">مصرف دارو</Typography>
          <Typography variant="body" weight="bold" size="4">
            {{ medicalInfo?.consumedMedicationsAmount || 'ثبت نشده' }}
          </Typography>
        </div>
        <div class="ud__content-card">
          <Typography variant="caption">مصرف دخانیات یا الکل</Typography>
          <Typography variant="body" weight="bold" size="4">
            {{ medicalInfo?.tobaccoAlcoholUse || 'ثبت نشده' }}
          </Typography>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import Modal from '@/base/Modal'
import { IconX } from '@tabler/icons-vue'
import { computed } from 'vue'
import { useIsMobile } from '@/composables/use-is-mobile'

defineEmits(['update:visible'])

const props = defineProps({
  visible: Boolean,
  data: {
    type: Object,
    // null while the parent query loads — drives the QInnerLoading spinner.
    default: null,
  },
})

const isMobile = useIsMobile()

const medicalInfo = computed(() => props.data)
</script>

<style scoped lang="scss">
.ud {
  width: 100%;

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: $spacing-2xl;
    gap: $spacing-md;
    &-card {
      width: 100%;
      min-height: 70px;
      border: 1px solid $grey-4;
      border-radius: $radius-md;
      padding: $spacing-md;
      display: flex;
      flex-direction: column;
      align-items: start;
      justify-content: space-between;
    }
  }
}
</style>
