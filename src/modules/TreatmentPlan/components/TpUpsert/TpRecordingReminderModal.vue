<template>
  <!-- Draft Reminder Modal -->
  <QDialog v-model="recordingReminders.showDraftReminder.value" persistent>
    <QCard class="tprm">
      <QCardSection class="tprm__header">
        <div class="tprm__title">{{ draftTitle }}</div>
      </QCardSection>

      <QCardSection class="tprm__content">
        <div class="tprm__description">{{ draftMessage }}</div>
      </QCardSection>

      <QCardActions class="tprm__actions">
        <QBtn
          outline
          no-caps
          color="primary"
          class="tprm__btn"
          label="ضبط نمی کنم!"
          @click="handleDismissDraft"
        />
        <QBtn unelevated no-caps color="red-7" class="tprm__btn" @click="handleStartRecording">
          <template #default>
            <IconMicrophone :size="24" />
            {{ draftButtonLabel }}
          </template>
        </QBtn>
      </QCardActions>
    </QCard>
  </QDialog>

  <!-- Recording Reminder Modal -->
  <QDialog v-model="recordingReminders.showRecordingReminder.value" persistent>
    <QCard class="tprm">
      <QCardSection class="tprm__header">
        <div class="tprm__title">{{ recordingTitle }}</div>
      </QCardSection>

      <QCardSection class="tprm__content">
        <div class="tprm__description">{{ recordingMessage }}</div>
      </QCardSection>

      <QCardActions class="tprm__actions">
        <QBtn
          unelevated
          no-caps
          class="tprm__btn"
          color="primary"
          label="نه هنوز"
          @click="handleDismissRecording"
        />
        <QBtn
          outline
          no-caps
          class="tprm__btn"
          color="red-7"
          :label="recordingButtonLabel"
          @click="handleStopRecording"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
<script setup>
import { watch, computed } from 'vue'
import { IconMicrophone } from '@tabler/icons-vue'
import { useTpStatus } from '../../composables/use-tp-status'
import { useRecordingReminders } from '../../composables/use-recording-reminders'
import { useTpProvider } from '../../composables/use-tp-provider'
import { TREATMENT_PLAN_STEP } from '../../constants/enums'

const treatmentData = useTpProvider('treatmentData')
const recordingReminders = useRecordingReminders()
const { backendStepNumber } = useTpStatus(treatmentData)

watch(
  backendStepNumber,
  (stepNumber) => {
    if (stepNumber === TREATMENT_PLAN_STEP.DRAFT) {
      recordingReminders.startDraftReminderTimer()
    } else {
      recordingReminders.clearDraftReminderTimer()
    }
  },
  { immediate: true }
)

const scrollToRecording = () => {
  setTimeout(() => {
    const recordingElement = document.querySelector('.ar')
    if (recordingElement) {
      recordingElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 300)
}

const handleStartRecording = async () => {
  recordingReminders.showDraftReminder.value = false
  await recordingReminders.triggerToggleRecording()
  scrollToRecording()
}

const handleStopRecording = async () => {
  recordingReminders.showRecordingReminder.value = false
  await recordingReminders.triggerToggleRecording()
  scrollToRecording()
}

const handleDismissDraft = () => {
  recordingReminders.showDraftReminder.value = false
}

const handleDismissRecording = () => {
  recordingReminders.showRecordingReminder.value = false
}

const draftTitle = computed(() => 'داخل جلسه‌ای؟')
const draftMessage = computed(() => 'فراموش نکن جلسه رو ضبط کنی.')
const draftButtonLabel = computed(() => 'شروع ضبط')

const recordingTitle = computed(() => 'جلسه تموم شد؟')
const recordingMessage = computed(() => 'یادت نره جلسه رو قطع کنی.')
const recordingButtonLabel = computed(() => 'قطع کردن ضبط')
</script>

<style lang="scss" scoped>
.tprm {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: flex-start;
  padding: 0 20px;
  gap: 16px;
  width: 348px;
  min-height: 188px;
  background: #ffffff;
  border-radius: 16px;

  &__header {
    padding: 20px 0 0 !important;
    width: 100%;
  }

  &__title {
    display: flex;
    font-weight: 500;
    font-size: 20px;
    color: #424242;
  }

  &__description {
    font-weight: 500;
    font-size: 16px;
    color: #616161;
  }

  &__actions {
    display: flex;
    padding: 24px 0 !important;
    width: 100%;
  }

  &__btn {
    height: 40px;
    flex: 1;
    line-height: 24px;
  }
}
</style>
