<template>
  <Modal
    :model-value="visible"
    :title="isEditMode ? 'ویرایش شیوه آشنایی' : 'شیوه آشنایی جدید'"
    width="32rem"
    @close="handleClose"
  >
    <QForm class="intro-form" @submit.prevent="submitForm">
      <div class="intro-form__content">
        <div class="intro-form__guide">
          <button type="button" class="intro-form__guide-header" @click="toggleGuide">
            <span class="intro-form__guide-header-title">
              <IconBulb :size="'20'" stroke="1.8" />
              <Typography variant="body" size="3" weight="semibold">راهنمای استفاده</Typography>
            </span>

            <component
              :is="isGuideOpen ? IconChevronUp : IconChevronDown"
              :size="'18'"
              stroke="1.8"
            />
          </button>

          <QSlideTransition>
            <div v-show="isGuideOpen" class="intro-form__guide-body">
              <div class="intro-form__guide-step">
                <Typography variant="body" size="4" weight="medium">
                  ۱. از لینک زیر آیکون مورد نظرتون رو انتخاب کنین.
                </Typography>
              </div>
              <a
                class="intro-form__guide-link"
                href="https://tabler.io/icons"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://tabler.io/icons
              </a>

              <div class="intro-form__guide-step">
                <Typography variant="body" size="4" weight="medium">
                  ۲. روی اسم آیکون کلیک کنین تا متن کپی بشه. مثل تصویری که براتون پایین صفحه گذاشتیم
                </Typography>
              </div>

              <div class="intro-form__guide-step">
                <Typography variant="body" size="4" weight="medium">
                  ۳. حالا فقط کافیه که متن کپی شده رو این پایین جایگذاری کنین.
                </Typography>
                <button
                  type="button"
                  class="intro-form__guide-illustration"
                  @click="openImagePreview"
                >
                  <img
                    :src="`${import.meta.env.BASE_URL}img/intro-v2.png`"
                    alt="راهنمای جایگذاری آیکون"
                  />
                  <IconArrowsMaximize size="32" class="intro-form__guide-illustration-zoom" />
                </button>
              </div>
            </div>
          </QSlideTransition>
        </div>

        <div class="intro-form__icon-row">
          <div class="intro-form__icon-preview">
            <QSpinnerDots v-if="isIconsLoading" size="20px" color="primary" />
            <component
              :is="resolvedIcon"
              v-else-if="resolvedIcon"
              :size="'22'"
              class="intro-form__icon-preview-svg"
            />
            <IconQuestionMark v-else :size="'22'" class="text-grey-5" />
          </div>
          <TextField
            class="intro-form__icon-input"
            :model-value="localData.icon"
            variant="outline"
            placeholder="نام آیکون که کپی کردی"
            :error="!!errors.icon"
            :error-message="errors.icon ?? null"
            @update:model-value="(e) => handleChange('icon', e)"
          />
        </div>
        <div class="intro-form__divider" />
        <TextField
          :model-value="localData.faTitle"
          label="نام فارسی"
          required
          variant="outline"
          placeholder="مثلا اینستاگرام"
          :error="!!errors.faTitle"
          :error-message="errors.faTitle ?? null"
          @update:model-value="(e) => handleChange('faTitle', e)"
        />
        <TextField
          :model-value="localData.enTitle"
          label="نام انگلیسی"
          variant="outline"
          placeholder="مثلا instagram"
          :error="!!errors.enTitle"
          :error-message="errors.enTitle ?? null"
          @update:model-value="(e) => handleChange('enTitle', e)"
        />
        <div class="intro-form__divider" />
      </div>

      <div class="intro-form__actions">
        <Button
          variant="outline"
          color="red"
          type="button"
          text="انصراف"
          :is-loading="isPending"
          @click="handleClose"
        />
        <Button
          variant="filled"
          color="light-blue"
          type="submit"
          :text="isEditMode ? 'ویرایش شیوه آشنایی' : 'ساخت شیوه آشنایی'"
          :is-loading="isPending"
          :is-disabled="isSubmitDisabled"
        />
      </div>
    </QForm>
  </Modal>

  <Modal
    :model-value="isImagePreviewOpen"
    :show-header="false"
    width="42rem"
    @close="isImagePreviewOpen = false"
    @update:model-value="isImagePreviewOpen = $event"
  >
    <img
      :src="`${import.meta.env.BASE_URL}img/intro-v2.png`"
      alt="راهنمای جایگذاری آیکون"
      class="intro-form__image-preview-img"
    />
  </Modal>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { QForm, QSlideTransition, QSpinnerDots } from 'quasar'
import {
  IconChevronUp,
  IconChevronDown,
  IconBulb,
  IconQuestionMark,
  IconArrowsMaximize,
} from '@tabler/icons-vue'
import { object, string } from 'yup'
import Modal from '@/base/Modal'
import Button from '@/base/Button'
import TextField from '@/base/TextField'
import Typography from '@/base/Typography'
import useYup from '@/composables/use-yup'
import { useTablerIcons } from '@/composables/use-tabler-icons'
import { useQueryClient } from '@tanstack/vue-query'
import {
  useCreateIntroductionMethodMutation,
  useUpdateIntroductionMethodMutation,
} from '@/modules/Settings/query/index'
import { Notif } from '@/data/services/notification-service'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'success'])
const queryClient = useQueryClient()

const isEditMode = computed(() => !!props.data)

const defaultData = () => ({ id: null, faTitle: '', enTitle: '', icon: '' })
const localData = ref(defaultData())

const isGuideOpen = ref(true)
const toggleGuide = () => {
  isGuideOpen.value = !isGuideOpen.value
}

const isImagePreviewOpen = ref(false)
const openImagePreview = () => {
  isImagePreviewOpen.value = true
}

const validationSchema = object().shape({
  /* eslint-disable no-useless-escape */
  faTitle: string()
    .required('نام فارسی الزامی است')
    .matches(
      /^[\d\s_\u0600-\u06FF\u200C\u2013\u2014\-]+$/,
      'نام فارسی فقط می‌تواند حروف و اعداد فارسی باشد'
    ),
  enTitle: string()
    .nullable()
    .matches(/^[\s\w\-]*$/, 'نام انگلیسی فقط می‌تواند حروف انگلیسی باشد'),
  /* eslint-enable no-useless-escape */
  icon: string().nullable(),
})

const { validate, validateAt, errors, resetErrors } = useYup(validationSchema)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      localData.value = props.data ? { ...defaultData(), ...props.data } : defaultData()
      isGuideOpen.value = !isEditMode.value
      resetErrors()
    }
  },
  { immediate: true }
)

const handleChange = (field, value) => {
  localData.value = { ...localData.value, [field]: value }
  validateAt(field, value)
}

const isSubmitDisabled = computed(
  () => !localData.value.faTitle?.trim() || !localData.value.icon?.trim()
)

// --- Icon preview handling -------------------------------------------------
const { loadIcons, resolveIcon } = useTablerIcons()

const isIconsLoading = ref(true)
onMounted(async () => {
  await loadIcons()
  isIconsLoading.value = false
})

const resolvedIcon = computed(() => resolveIcon(localData.value.icon))

// --- Mutations ---------------------------------------------------------
const { mutate: createMethod, isPending: createPending } = useCreateIntroductionMethodMutation()
const { mutate: updateMethod, isPending: updatePending } = useUpdateIntroductionMethodMutation()

const isPending = computed(() => createPending.value || updatePending.value)

const refreshList = async () => {
  await queryClient.invalidateQueries({ queryKey: ['introduction-methods'] })
  await queryClient.refetchQueries({ queryKey: ['introduction-methods'] })
}

const handleClose = () => {
  emit('close')
}

const handleMutationSuccess = async (response) => {
  Notif.success(response?.message || 'عملیات موفقیت آمیز بود')
  await refreshList()
  localData.value = defaultData()
  resetErrors()
  emit('success')
  handleClose()
}

const submitForm = async () => {
  const { isValid, payload } = await validate(localData.value, {
    abortEarly: false,
    stripUnknown: true,
  })
  if (!isValid) return

  const mutateData = {
    faTitle: payload.faTitle,
    enTitle: payload.enTitle || '',
    icon: payload.icon || '',
  }

  if (localData.value.id) {
    updateMethod({ id: localData.value.id, ...mutateData }, { onSuccess: handleMutationSuccess })
  } else {
    createMethod({ ...mutateData }, { onSuccess: handleMutationSuccess })
  }
}
</script>

<style lang="scss" scoped>
.intro-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;

  &__content {
    display: flex;
    flex-direction: column;
    gap: $spacing-xl;
  }

  &__guide {
    background: $blue-1;
    border-radius: $radius-md;
    padding: $spacing-md $spacing-lg;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__guide-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: $dark-8;

    svg {
      color: $dark-6;
      flex-shrink: 0;
      margin-bottom: 5px;
    }
  }

  &__guide-header-title {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    color: $dark;
  }

  &__guide-body {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__guide-step {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;

    p {
      color: $grey-8;
    }
  }

  &__guide-link {
    color: $primary;
    text-decoration: underline;
    white-space: nowrap;
    font-size: 13px;
    direction: ltr;
  }

  &__guide-illustration {
    flex-shrink: 0;
    padding: 0;
    border: 1px solid $grey-3;
    border-radius: $radius-sm;
    overflow: hidden;
    cursor: pointer;
    background: $white;
    position: relative;

    img {
      display: block;
      width: 48px;
      height: 48px;
      object-fit: cover;
    }
  }

  &__guide-illustration-zoom {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 32px;
    height: 32px;
    z-index: 2;
    color: $white;
  }

  &__divider {
    border: 1px solid $grey-2;
    width: 100%;
  }

  &__icon-row {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__icon-input {
    flex: 1;
    min-width: 0;

    :deep(input) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      direction: ltr;
      text-align: right;
    }
  }

  &__icon-preview {
    width: 44px;
    height: 44px;
    border-radius: $radius-sm;
    border: 1px solid $grey-3;
    background: $white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__icon-preview-svg {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;

    :deep(svg) {
      width: 100%;
      height: 100%;
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: $spacing-lg;
  }

  &__image-preview-img {
    max-width: 100%;
    max-height: 80vh;
    border-radius: $radius-md;
    object-fit: contain;
    margin-top: 2.5rem;
  }
}
</style>
