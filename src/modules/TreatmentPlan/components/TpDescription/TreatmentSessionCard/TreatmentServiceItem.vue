<template>
  <div class="tpd-service">
    <Typography variant="body" size="3" weight="medium" color="dark">
      {{ row.serveIndustryTitle || '-' }}
    </Typography>
    <div class="tpd-service__fields-row">
      <div class="tpd-service__fields-main">
        <div class="tpd-service__field tpd-service__field--2col">
          <Typography variant="caption" color="grey">زمان ثبت</Typography>
          <Typography variant="body" size="3" weight="medium" color="dark">
            {{ convertToJalali(row.performedAt, ' jdddd - jYYYY/jMM/jDD') || '-' }}
          </Typography>
        </div>

        <div class="tpd-service__field">
          <Typography variant="caption" color="grey">هزینه</Typography>
          <Typography v-if="canViewCost" variant="body" size="3" weight="medium">
            {{ numberSeparator(row.priceWithProfit || 0) }} تومان
          </Typography>
          <Typography v-else variant="body" size="3" color="grey">---</Typography>
        </div>

        <div v-if="row.questionTitle" class="tpd-service__field tpd-service__field--2col">
          <Typography variant="caption" color="grey">خدمات ویژه</Typography>
          <div class="tpd-service__special-services">
            <Typography variant="body" size="3" weight="medium" color="dark">
              {{ row.questionTitle || '-' }}
            </Typography>
            <Typography variant="body" color="dark">- {{ row.itemTitle || '-' }}</Typography>
          </div>
        </div>

        <div v-if="toothNumbers && toothNumbers.length > 0" class="tpd-service__field--2col">
          <Typography variant="caption" color="grey">چارت دندان</Typography>
          <div class="tpd-service__teeth">
            <div
              v-for="(tooth, index) in toothNumbers"
              :key="index"
              class="teeth"
              :class="`teeth__${tooth.toothPosition}`"
            >
              {{ tooth.numbers }}
            </div>
          </div>
        </div>
      </div>

      <div class="tpd-service__actions">
        <component
          :is="isExpanded ? IconEyeClosed : IconEye"
          v-if="row.description"
          size="20"
          class="tpd-service__action-icon"
          @click="$emit('toggleExpand', row?.id)"
        />

        <!-- <IconPencil size="20" class="tpd-service__action-icon" /> -->

        <IconTrash
          v-if="getPerms('user', 'manage', false, undefined)"
          size="20"
          class="tpd-service__action-icon tpd-service__action-icon--danger"
          @click="$emit('delete', row)"
        />
      </div>
    </div>

    <div v-if="isExpanded && row.description" class="tpd-service__description">
      <Typography variant="body" size="4" color="blue-grey" weight="semibold">توضیحات</Typography>
      <Typography variant="body" size="4" color="dark" weight="semibold">
        {{ row.description || '' }}
      </Typography>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IconEye, IconEyeClosed, IconTrash } from '@tabler/icons-vue'
import Typography from '@/base/Typography'
import { numberSeparator } from '@/utils/formatter'
import { getPerms } from '@/utils/get-perms'

const props = defineProps({
  row: { type: Object, required: true },
  canViewCost: { type: Boolean, default: false },
  convertToJalali: { type: Function, required: true },
  getExactToothNumbers: { type: Function, required: true },
  isExpanded: { type: Boolean, default: false },
})

defineEmits(['toggleExpand', 'delete'])

const toothNumbers = computed(() => props.getExactToothNumbers(props.row))
</script>

<style scoped lang="scss">
@use 'sass:color';

.tpd-service {
  padding: $spacing-lg;
  background-color: $white;
  border-radius: $radius-sm;
  border: 1px solid $grey-1;
  margin-top: 12px;

  &__fields-row {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: start;
    gap: $spacing-md;
    border: 1px solid $grey-3;
    border-radius: $radius-xs;
    margin-top: $spacing-xs;
    padding: $spacing-lg;
  }

  &__fields-main {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: $spacing-lg;
    align-items: start;
  }

  &__field {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-xs;
    min-width: 0;

    &--2col {
      grid-column: span 2;
    }

    &--3col {
      grid-column: span 3;
    }
  }

  &__special-services {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    @include media-breakpoint-down(sm) {
      flex-wrap: wrap;
    }
  }

  &__teeth {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    justify-content: flex-start;
    padding-top: $spacing-xs;
  }

  &__actions {
    display: flex;
    gap: $spacing-xxs;
    align-items: center;
    justify-content: flex-end;
  }

  &__action-icon {
    color: $grey-5;
    cursor: pointer;

    &:hover {
      color: $grey-7;
    }

    &--danger {
      color: $red;

      &:hover {
        color: color.adjust($red, $lightness: -10%);
      }
    }
  }

  &__description {
    padding: $spacing-md;
    background: $grey-1;
    border-top: 1px solid $grey-2;
    border-radius: $radius-xs;
    margin-top: $spacing-md;
    width: 100%;
  }
}
</style>
