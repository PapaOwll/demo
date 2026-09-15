<template>
  <QCard flat class="batch-import">
    <QCardSection class="batch-import__header q-pa-none">
      <QChip square color="white" text-color="black" class="batch-import__title">
        افزودن گروهی کاربران
      </QChip>
    </QCardSection>

    <QCardSection class="batch-import__content">
      <div class="batch-import__stepper">
        <div class="batch-import__step-container">
          <div class="batch-import__step" :class="{ 'batch-import__step--active': active >= 1 }">
            <IconFileUpload size="24" />
          </div>
          <span
            class="batch-import__step-title"
            :class="{ 'batch-import__step-title--active': active >= 1 }"
          >
            آپلود
          </span>
        </div>

        <QSeparator
          class="batch-import__separator"
          :class="{ 'batch-import__separator--active': active >= 2 }"
        />

        <div class="batch-import__step-container">
          <div class="batch-import__step" :class="{ 'batch-import__step--active': active >= 2 }">
            <IconFilterCog size="24" />
          </div>
          <span
            class="batch-import__step-title"
            :class="{ 'batch-import__step-title--active': active >= 2 }"
          >
            توزیع
          </span>
        </div>

        <QSeparator
          class="batch-import__separator"
          :class="{ 'batch-import__separator--active': active >= 3 }"
        />

        <div class="batch-import__step-container">
          <div class="batch-import__step" :class="{ 'batch-import__step--active': active >= 3 }">
            <IconListCheck size="24" />
          </div>
          <span
            class="batch-import__step-title"
            :class="{ 'batch-import__step-title--active': active >= 3 }"
          >
            نتیجه
          </span>
        </div>
      </div>

      <div class="batch-import__steps-content">
        <BiAddNumbers
          v-if="active === 1"
          @result="numberResults"
          @next="nextStep"
          @file-id="setFileId"
        />
        <DistributionNumbers
          v-if="active === 2"
          :numbers="numbers"
          :file-id="fileId"
          @result="distributionResults"
          @next="nextStep"
          @back="previousStep"
        />
        <ImportResult v-if="active === 3" :result="distribution" :defectives="defectiveNumbers" />
      </div>
    </QCardSection>
  </QCard>
</template>

<script setup>
import { ref } from 'vue'
import BiAddNumbers from '../components/BatchImport/BiAddNumbers'
import DistributionNumbers from '../components/BatchImport/DistributionNumbers'
import ImportResult from '../components/BatchImport/ImportResult'
import { IconFileUpload, IconFilterCog, IconListCheck } from '@tabler/icons-vue'

const active = ref(1)
const numbers = ref(null)
const fileId = ref(null)
const distribution = ref(null)
const defectiveNumbers = ref(null)

const numberResults = (result) => {
  numbers.value = result
}

const setFileId = (file) => {
  fileId.value = file
}

const distributionResults = (result) => {
  distribution.value = result
}

const nextStep = (shouldNext) => {
  if (shouldNext && active.value < 3) {
    active.value += 1
  }
}

const previousStep = () => {
  if (active.value > 1) {
    active.value -= 1
  }
}
</script>

<style scoped lang="scss">
.batch-import {
  padding: 1rem;
  max-width: 50rem;
  margin: 0 auto;

  &__header {
    text-align: center;
    margin-bottom: 2rem;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
  }

  &__content {
    padding: 0;
  }

  &__stepper {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
    padding: 1rem 0;
  }

  &__step-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    min-width: 6rem;
  }

  &__step {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: 2px solid #1976d2;
    color: #1976d2;
    background-color: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    cursor: pointer;

    &--active {
      background-color: #1976d2;
      color: white;
      border-color: #1976d2;
    }
  }

  &__step-title {
    font-size: 0.75rem;
    font-weight: 500;
    color: #666;
    text-align: center;
    transition: color 0.3s ease;

    &--active {
      color: #1976d2;
      font-weight: 600;
    }
  }

  &__separator {
    flex: 1;
    height: 2px;
    background-color: #e0e0e0;
    margin: 0 1rem;
    transition: background-color 0.3s ease;

    &--active {
      background-color: #1976d2;
    }
  }

  &__steps-content {
    min-height: 20rem;
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: #fafafa;
  }
}

// Responsive design
@media (max-width: 768px) {
  .batch-import {
    padding: 0.5rem;

    &__stepper {
      padding: 0.5rem 0;
    }

    &__step-container {
      min-width: 4rem;
    }

    &__step {
      width: 2rem;
      height: 2rem;
    }

    &__step-title {
      font-size: 0.625rem;
    }

    &__separator {
      margin: 0 0.5rem;
    }

    &__steps-content {
      padding: 0.5rem;
      min-height: 15rem;
    }
  }
}

@media (max-width: 480px) {
  .batch-import {
    &__step-container {
      min-width: 3rem;
    }

    &__step {
      width: 1.75rem;
      height: 1.75rem;
    }

    &__separator {
      margin: 0 0.25rem;
    }
  }
}
</style>
