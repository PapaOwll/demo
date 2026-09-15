<template>
  <div class="intro-method-card">
    <div class="intro-method-card__left">
      <div class="intro-method-card__icon-wrap">
        <component
          :is="iconComponent"
          v-if="iconComponent"
          :size="'22'"
          class="intro-method-card__icon"
        />
        <IconQuestionMark v-else :size="'22'" class="text-grey-6" />
      </div>
      <div class="intro-method-card__titles">
        <Typography variant="body" size="2" weight="semibold">
          {{ method.faTitle || '-' }}
        </Typography>
        <Typography v-if="method.enTitle" variant="caption" color="grey">
          {{ method.enTitle }}
        </Typography>
      </div>
    </div>

    <div class="intro-method-card__actions">
      <IconPencil :size="'16'" stroke="1.8" class="intro-method-card__action-btn" @click="onEdit" />
      <IconTrash
        :size="'16'"
        stroke="1.8"
        class="intro-method-card__action-btn intro-method-card__action-btn--red"
        @click="onDelete"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
// import { QToggle, QTooltip } from 'quasar'
import { IconPencil, IconTrash, IconQuestionMark } from '@tabler/icons-vue'
import Typography from '@/base/Typography'
import { useTablerIcons } from '@/composables/use-tabler-icons'

const props = defineProps({
  method: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['edit', 'delete', 'toggle'])

function onEdit() {
  emit('edit', props.method)
}

function onDelete() {
  emit('delete', props.method.id)
}

const { loadIcons, resolveIcon } = useTablerIcons()
loadIcons()

const iconComponent = computed(() => resolveIcon(props.method.icon))
</script>

<style scoped lang="scss">
.intro-method-card {
  background: $grey-1;
  border-radius: $radius-md;
  padding: $spacing-lg $spacing-xl;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
  min-height: 72px;

  &__left {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-items: flex-end;
    text-align: right;
  }

  &__icon-wrap {
    width: 40px;
    height: 40px;
    background: $white;
    border-radius: $radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid $grey-3;
  }

  &__icon {
    color: $grey-7;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-shrink: 0;
  }

  &__action-btn {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $dark-6;
    transition:
      background 0.15s,
      transform 0.1s;

    &:active {
      transform: scale(0.93);
    }

    &--red {
      color: $red-6;
    }
  }

  &__tooltip {
    max-width: 220px;
    text-align: right;
    line-height: 1.6;
  }
}
</style>
