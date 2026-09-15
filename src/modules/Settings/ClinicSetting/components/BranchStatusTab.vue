<template>
  <div class="branch-status">
    <div class="branch-status__form">
      <div class="branch-status__field branch-status__field--status">
        <SelectField
          v-model="form.status"
          label="وضعیت فعلی شعبه"
          placeholder="انتخاب کنید"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          variant="outline"
          :disable="isSubmitting || isStatusOptionsLoading"
        />
      </div>
      <div class="branch-status__field branch-status__field--contract">
        <PersianDate v-model="form.contractDate" label="تاریخ قرارداد" :disable="isSubmitting" />
      </div>
      <div class="branch-status__field branch-status__field--activation">
        <PersianDate
          v-model="form.activationDate"
          label="تاریخ فعال‌سازی"
          :disable="isSubmitting"
        />
      </div>
    </div>

    <div class="branch-status__history">
      <div
        class="branch-status__history-header"
        role="button"
        tabindex="0"
        @click="historyExpanded = !historyExpanded"
        @keyup.enter="historyExpanded = !historyExpanded"
      >
        <Typography variant="heading" size="h6" weight="semibold">تاریخچه تغییرات</Typography>
        <IconChevronUp
          :size="20"
          class="branch-status__history-toggle"
          :class="{ 'branch-status__history-toggle--collapsed': !historyExpanded }"
        />
      </div>

      <QSlideTransition>
        <div v-show="historyExpanded">
          <div
            v-if="isHistoryLoading"
            class="branch-status__history-state branch-status__history-state--loading"
          >
            <QSpinnerTail color="primary" size="32px" />
          </div>

          <div
            v-else-if="historyError"
            class="branch-status__history-state branch-status__history-state--error"
          >
            <Typography variant="body" size="3" color="red">
              خطا در دریافت تاریخچه تغییرات
            </Typography>
            <Button variant="outline" color="primary" text="تلاش مجدد" @click="refreshHistory" />
          </div>

          <div
            v-else-if="history.length === 0"
            class="branch-status__history-state branch-status__history-state--empty"
          >
            <QImg width="160px" :src="NoData" />
            <Typography variant="body" size="3" color="grey">
              هنوز تغییری برای این شعبه ثبت نشده است.
            </Typography>
          </div>

          <div v-else class="branch-status__history-table">
            <template v-for="item in history" :key="item.id">
              <div class="branch-status__history-field">
                <div class="branch-status__history-field-top">
                  <span class="branch-status__history-icon-wrap">
                    <IconCalendarEvent :size="16" class="branch-status__history-field-icon" />
                  </span>
                  <Typography variant="body" size="4" weight="semibold">
                    {{ item.fieldLabel }}
                  </Typography>
                </div>
                <Typography variant="caption" color="grey" class="branch-status__history-time">
                  {{ item.createdAt }}
                </Typography>
              </div>

              <div class="branch-status__history-by">
                <Typography variant="caption" color="grey">توسط</Typography>
                <Typography variant="caption" weight="medium">{{ item.userName }}</Typography>
              </div>

              <p class="branch-status__history-desc">
                از
                <span class="branch-status__history-desc-value">
                  {{ item.oldValue || '—' }}
                </span>
                به
                <span class="branch-status__history-desc-value">
                  {{ item.newValue || '—' }}
                </span>
                .تغییر کرده است
              </p>
            </template>
          </div>
        </div>
      </QSlideTransition>
    </div>
  </div>
</template>

<script setup>
import { ref, toRef } from 'vue'
import { IconChevronUp, IconCalendarEvent } from '@tabler/icons-vue'
import NoData from '@/assets/images/noData.svg'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import SelectField from '@/base/SelectField'
import PersianDate from '@/components/Form/PersianDate'
import { useBranchStatus } from '../composables/use-branch-status'
import { Notif } from '@/data/services/notification-service'

const props = defineProps({
  branchId: {
    type: [String, Number],
    default: null,
  },
  branch: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['saved'])

const {
  form,
  statusOptions,
  isStatusOptionsLoading,
  hasChanges,
  isSubmitting,
  submit,
  reset,
  history,
  isHistoryLoading,
  historyError,
  refreshHistory,
} = useBranchStatus(toRef(props, 'branchId'), toRef(props, 'branch'))

const historyExpanded = ref(true)

const handleSubmit = async () => {
  const result = await submit()
  if (result.busy || result.noOp) return
  if (result && result.cancelled) return
  Notif.success(result.message || 'تغییرات وضعیت شعبه با موفقیت ذخیره شد', { position: 'top' })
  emit('saved')
}

defineExpose({ submit: handleSubmit, hasChanges, isSubmitting, reset })
</script>

<style scoped lang="scss">
.branch-status {
  display: flex;
  flex-direction: column;
  gap: map-get($space-lg, x);

  &__form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      'status .'
      'contract activation';
    gap: map-get($space-md, x);
    align-items: start;
  }

  &__field {
    display: flex;
    flex-direction: column;

    &--status {
      grid-area: status;
    }

    &--contract {
      grid-area: contract;
    }

    &--activation {
      grid-area: activation;
    }
  }

  &__history {
    display: flex;
    flex-direction: column;
    gap: map-get($space-sm, x);
    background-color: $grey-1;
    border-radius: 8px;
    padding: map-get($space-md, x);
  }

  &__history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
  }

  &__history-toggle {
    color: $grey-7;
    transition: transform 0.2s ease;

    &--collapsed {
      transform: rotate(180deg);
    }
  }

  &__history-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: map-get($space-sm, x);
    padding: map-get($space-lg, x) 0;
    text-align: center;

    &--loading {
      min-height: 120px;
    }
  }

  &__history-table {
    position: relative;
    display: grid;
    grid-template-columns: max-content max-content 1fr;
    align-items: start;
    column-gap: map-get($space-lg, x);
    margin-top: map-get($space-sm, x);
  }

  &__history-table > * {
    padding-block: map-get($space-sm, x);
  }

  // vertical line threading through the calendar icons, connecting each entry
  &__history-table::before {
    content: '';
    position: absolute;
    top: 12px;
    bottom: 12px;
    right: 12px;
    width: 1px;
    background-color: $grey-4;
  }

  &__history-icon-wrap {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    background-color: $grey-1;
  }

  &__history-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    white-space: nowrap;
  }

  &__history-field-top {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__history-field-icon {
    color: $grey-6;
    flex-shrink: 0;
  }

  &__history-by {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  &__history-time {
    display: block;
    padding-right: $spacing-xl;
  }

  &__history-desc {
    margin: 0;
    color: $grey-6;
    font-size: map-get($body2, size);
    line-height: 1.8;
  }

  &__history-desc-value {
    color: $grey-9;
    font-weight: map-get($h6, weight);

    &--new {
      color: $primary;
    }
  }
}
</style>
