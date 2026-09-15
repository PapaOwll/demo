<template>
  <div class="feedback-header">
    <div class="feedback-header__right">
      <div class="feedback-header__message-icon">
        <IconMessage2 :size="30" stroke="1" />
      </div>
      <div class="feedback-header__title-box">
        <div class="feedback-header__title">
          بازخورد {{ feedbackData?.id || '1' }}
          <span v-if="feedbackData?.shown_name || feedbackData?.shownName" class="q-mr-sm">
            - {{ feedbackData?.shown_name || feedbackData?.shownName }}
          </span>
        </div>
        <div class="feedback-header__subtitle-row">
          <div class="feedback-header__subtitle">
            {{
              feedbackData?.created_at
                ? convertToJalaliWithTime(feedbackData.created_at, 'jYYYY/jM/jD')
                : '۱۴۰۴/۴/۶'
            }}
          </div>

          <div
            :class="`feedback-header__status-chip feedback-header__status-chip--${FEEDBACK_STATUS_COLORS[feedbackData?.isApproved]}`"
          >
            <span>{{ FEEDBACK_STATUS_LABELS[feedbackData?.isApproved] }}</span>
          </div>

          <div class="feedback-header__rating-chip">
            <IconStar
              :class="feedbackData?.rating === 5 ? 'star-filled' : 'star-empty'"
              :size="20"
            />
            {{ feedbackData?.rating || '-' }}
          </div>

          <div class="feedback-header__type-chip">
            <span>
              {{
                feedbackData?.feedbackType?.name ||
                FEEDBACK_TYPE_OPTIONS.find(
                  (t) =>
                    t.value === feedbackData?.feedback_type_id ||
                    t.value === feedbackData?.feedbackTypeId ||
                    t.value === feedbackData?.feedbackType?.id
                )?.label ||
                'نوع بازخورد'
              }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <QSpace />

    <div class="feedback-header__action-buttons">
      <template v-if="isEditMode">
        <QBtn
          unelevated
          color="positive"
          class="feedback-header__save-btn"
          :loading="isUpdating"
          @click="$emit('save')"
        >
          <template #default>
            <IconCheck :size="18" class="q-ml-xs" />
            <span>ذخیره</span>
          </template>
        </QBtn>
        <QBtn
          unelevated
          color="grey-7"
          class="feedback-header__cancel-btn"
          :disable="isUpdating"
          @click="$emit('cancel')"
        >
          <template #default>
            <IconX :size="18" class="q-ml-xs" />
            <span>انصراف</span>
          </template>
        </QBtn>
      </template>
      <template v-else>
        <QBtn unelevated color="grey-7" class="feedback-header__edit-btn" @click="$emit('edit')">
          <template #default>
            <IconEdit :size="18" class="q-ml-xs" />
            <span>ویرایش</span>
          </template>
        </QBtn>
        <QBtn
          v-if="!feedbackData?.isApproved"
          unelevated
          color="primary"
          label="انتشار بازخورد"
          class="feedback-header__publish-btn"
          :loading="isAccepting"
          @click="$emit('accept')"
        />
        <QBtn
          v-else
          unelevated
          color="warning"
          label="رد بازخورد"
          class="feedback-header__reject-btn"
          :loading="isRejecting"
          @click="$emit('reject')"
        />
      </template>
    </div>

    <QBtn
      color="grey"
      round
      flat
      dense
      :icon="expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
      class="q-mx-lg"
      @click="$emit('toggle-expand')"
    />
  </div>
</template>

<script setup>
import { IconMessage2, IconStar, IconEdit, IconCheck, IconX } from '@tabler/icons-vue'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import { FEEDBACK_TYPE_OPTIONS, FEEDBACK_STATUS_LABELS, FEEDBACK_STATUS_COLORS } from '../constant'

defineProps({
  feedbackData: {
    type: Object,
    default: null,
  },
  isEditMode: {
    type: Boolean,
    default: false,
  },
  isUpdating: {
    type: Boolean,
    default: false,
  },
  isAccepting: {
    type: Boolean,
    default: false,
  },
  isRejecting: {
    type: Boolean,
    default: false,
  },
  expanded: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['edit', 'save', 'cancel', 'accept', 'reject', 'toggle-expand'])
</script>

<style lang="scss" scoped>
.feedback-header {
  cursor: pointer;
  padding: 0 !important;
  align-items: center;
  display: flex;
  flex-wrap: nowrap;
  gap: 1rem;

  &__right {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;
  }

  &__message-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 20%;
    background: white;
    color: #5f6368;
  }

  &__action-buttons {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  &__publish-btn {
    background: #1976d2;
    color: white;
    border-radius: 8px;
    padding: 0 1.5rem;
    height: 40px;
    font-weight: 600;
    font-size: 0.9375rem;
  }

  &__reject-btn {
    background: #f59e0b;
    color: white;
    border-radius: 8px;
    padding: 0 1.5rem;
    height: 40px;
    font-weight: 600;
    font-size: 0.9375rem;
  }

  &__status-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;

    &--green {
      background-color: rgba($green, 0.1);
      color: $green;
      border-color: $green;
    }

    &--red {
      background-color: rgba($red, 0.1);
      color: $red;
      border-color: $red;
    }

    &--gray {
      background-color: rgba($grey-6, 0.1);
      color: #808080;
      border-color: #808080;
    }
  }

  &__rating-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    background: $amber-1;
    border: 1px solid $amber-4;
    border-radius: 8px;
    padding: 0.375rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: $amber-8;

    .star-filled {
      color: $amber-8;
      fill: $amber-8;
    }

    .star-empty {
      color: $amber-8;
    }
  }

  &__type-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    background: $blue-1;
    border: 1px solid $blue-4;
    border-radius: 8px;
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: $blue-8;
  }

  &__edit-btn,
  &__save-btn,
  &__cancel-btn {
    border-radius: 8px;
    padding: 0 1.5rem;
    height: 40px;
    font-weight: 600;
    font-size: 0.9375rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  &__title-box {
    text-align: right;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.3;
  }

  &__subtitle-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.125rem;
    flex-wrap: wrap;
  }

  &__subtitle {
    font-size: 0.875rem;
    color: #6b7280;
  }
}

@media (max-width: 768px) {
  .feedback-header {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 0.75rem;

    &__message-icon {
      padding: 0.5rem;
      background: white;
    }

    &__right {
      justify-content: space-between;
      width: 100%;
    }

    &__title-box {
      order: -1;
    }

    &__action-buttons {
      justify-content: space-between;
      width: 100%;
      margin-top: 0.75rem;
    }
  }
}
</style>
