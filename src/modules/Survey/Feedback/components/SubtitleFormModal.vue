<template>
  <QDialog v-model="isOpen" transition-show="slide-up" transition-hide="slide-down">
    <QCard class="subtitle-form-modal">
      <!-- Header -->
      <QCardSection class="subtitle-form-modal__header">
        <div class="subtitle-form-modal__header-content">
          <div class="text-h6">
            {{
              mode === 'create'
                ? 'افزودن زیرنویس جدید'
                : mode === 'edit'
                  ? 'ویرایش زیرنویس'
                  : 'مشاهده زیرنویس'
            }}
          </div>
          <QBtn flat round dense icon="close" @click="closeModal" />
        </div>
      </QCardSection>

      <QSeparator />

      <!-- Loading State -->
      <QCardSection v-if="isLoading && mode !== 'create'" class="subtitle-form-modal__loading">
        <QSpinnerTail color="primary" size="3rem" />
        <span>در حال بارگذاری...</span>
      </QCardSection>

      <!-- Error State -->
      <QCardSection v-else-if="error && mode !== 'create'" class="subtitle-form-modal__error">
        <IconAlertCircle class="text-negative" size="3rem" />
        <span>{{ error?.message || 'خطا در بارگذاری داده' }}</span>
        <QBtn color="primary" label="تلاش مجدد" @click="refetch" />
      </QCardSection>

      <!-- Form -->
      <QCardSection v-else class="subtitle-form-modal__body">
        <QForm ref="formRef" @submit="handleSubmit">
          <div class="subtitle-form-modal__form">
            <!-- Text Field -->
            <div class="subtitle-form-modal__field">
              <label class="subtitle-form-modal__label">متن زیرنویس: *</label>
              <QInput
                v-model="formData.text"
                outlined
                type="textarea"
                rows="4"
                placeholder="متن زیرنویس را وارد کنید"
                :readonly="mode === 'show'"
                :rules="[(val) => !!val || 'متن زیرنویس الزامی است']"
                class="subtitle-form-modal__input"
              />
            </div>

            <!-- Sort Order Field -->
            <div class="subtitle-form-modal__field">
              <label class="subtitle-form-modal__label">ترتیب نمایش: *</label>
              <QInput
                v-model.number="formData.sortOrder"
                outlined
                type="number"
                min="0"
                placeholder="ترتیب نمایش"
                :readonly="mode === 'show'"
                :rules="[
                  (val) =>
                    (val !== null && val !== undefined && val >= 0) ||
                    'ترتیب نمایش الزامی است و باید بزرگتر یا مساوی صفر باشد',
                ]"
                class="subtitle-form-modal__input"
              />
            </div>

            <!-- Is Active Toggle -->
            <div class="subtitle-form-modal__field subtitle-form-modal__field--toggle">
              <label class="subtitle-form-modal__label">وضعیت:</label>
              <QToggle
                v-model="formData.isActive"
                :disable="mode === 'show'"
                color="positive"
                :label="formData.isActive ? 'فعال' : 'غیرفعال'"
              />
            </div>
          </div>
        </QForm>
      </QCardSection>

      <QSeparator />

      <!-- Actions -->
      <QCardActions align="right" class="subtitle-form-modal__actions">
        <QBtn flat label="بستن" color="grey-7" @click="closeModal" />
        <QBtn
          v-if="mode !== 'show'"
          unelevated
          :label="mode === 'create' ? 'ایجاد' : 'ذخیره تغییرات'"
          color="primary"
          :loading="isSubmitting"
          @click="handleSubmit"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Notif } from '@/data/services/notification-service'
import { IconAlertCircle } from '@tabler/icons-vue'
import { useTvSubtitle, useCreateTvSubtitle, useUpdateTvSubtitle } from '../query/subtitle'
import { handleError } from '@/utils/error-handler'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  subtitleId: {
    type: [String, Number],
    default: null,
  },
  mode: {
    type: String,
    default: 'create', // 'create', 'edit', 'show'
    validator: (value) => ['create', 'edit', 'show'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue', 'success'])

const formRef = ref(null)

// Form data
const formData = ref({
  text: '',
  sortOrder: 0,
  isActive: true,
})

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Fetch subtitle data when editing or showing
const subtitleIdRef = ref(props.subtitleId)
const {
  data: subtitleResponse,
  isLoading,
  error,
  refetch,
} = useTvSubtitle(subtitleIdRef, {
  enabled: computed(() => props.mode !== 'create' && !!props.subtitleId),
})

const subtitleData = computed(() => subtitleResponse.value?.data || null)

// Mutations
const { mutate: createSubtitle, isPending: isCreating } = useCreateTvSubtitle()
const { mutate: updateSubtitle, isPending: isUpdating } = useUpdateTvSubtitle()

const isSubmitting = computed(() => isCreating.value || isUpdating.value)

// Watch for subtitle data changes
watch(
  subtitleData,
  (newData) => {
    if (newData && props.mode !== 'create') {
      formData.value = {
        text: newData.text || '',
        sortOrder: newData.sortOrder ?? newData.sort_order ?? 0,
        isActive: newData.isActive ?? newData.is_active ?? true,
      }
    }
  },
  { immediate: true }
)

// Watch for subtitleId changes
watch(
  () => props.subtitleId,
  (newId) => {
    subtitleIdRef.value = newId
  }
)

// Reset form when modal opens in create mode
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && props.mode === 'create') {
      formData.value = {
        text: '',
        sortOrder: 0,
        isActive: true,
      }
    }
  }
)

const closeModal = () => {
  isOpen.value = false
}

const handleSubmit = async () => {
  if (props.mode === 'show') return

  // Validate form
  const isValid = await formRef.value?.validate()
  if (!isValid) return

  // Prepare data for API
  const apiData = {
    text: formData.value.text,
    is_active: formData.value.isActive,
    sort_order: formData.value.sortOrder ?? 0,
  }

  if (props.mode === 'create') {
    createSubtitle(apiData, {
      onSuccess: () => {
        Notif.success('زیرنویس با موفقیت ایجاد شد')
        emit('success')
        closeModal()
      },
      onError: (err) => {
        handleError(err)
      },
    })
  } else if (props.mode === 'edit') {
    updateSubtitle(
      {
        id: props.subtitleId,
        data: apiData,
      },
      {
        onSuccess: () => {
          Notif.success('زیرنویس با موفقیت ویرایش شد')
          emit('success')
          closeModal()
        },
        onError: (err) => {
          handleError(err)
        },
      }
    )
  }
}
</script>

<style scoped lang="scss">
.subtitle-form-modal {
  width: 90vw;
  max-width: 600px;

  &__header {
    padding: 1rem 1.5rem;
    background: white;

    &-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .text-h6 {
      margin: 0;
      font-weight: 600;
      color: $grey-9;
    }
  }

  &__loading,
  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem;
    min-height: 300px;
  }

  &__body {
    padding: 1.5rem;
    background: $grey-1;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &--toggle {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  &__label {
    font-size: 0.9375rem;
    font-weight: 600;
    color: $grey-8;
  }

  &__input {
    width: 100%;
  }

  &__actions {
    padding: 1rem 1.5rem;
    background: white;
    gap: 0.5rem;
  }
}

@media (max-width: 768px) {
  .subtitle-form-modal {
    width: 95vw;
  }
}
</style>
