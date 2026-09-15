<template>
  <QDialog v-model="internalShow" persistent @before-hide="handleCancel">
    <QCard class="afm">
      <QInnerLoading :showing="isSubmitting">
        <QSpinnerTail color="primary" size="lg" />
      </QInnerLoading>

      <div class="afm__header">
        <Typography variant="heading" size="h6">
          {{ editMode ? 'ویرایش اعلان' : 'افزودن اعلان جدید' }}
        </Typography>
        <Button variant="flat" color="grey" :is-disabled="isSubmitting" @click="handleCancel">
          <IconX />
        </Button>
      </div>

      <div class="afm__content">
        <QForm @submit.prevent="handleSubmit">
          <div class="row q-col-gutter-md">
            <div class="col-12 q-mb-md">
              <div class="row items-center justify-between">
                <Typography variant="body" size="4" weight="medium">تاریخ اعتبار اعلان</Typography>
                <QToggle
                  :model-value="formData.enableDateRange"
                  color="green"
                  @update:model-value="updateField('enableDateRange', $event)"
                />
              </div>
            </div>

            <div v-if="formData.enableDateRange" class="col-12">
              <Typography variant="body" size="4" weight="medium" class="q-mb-sm">
                بازه‌ی ارسال اعلان رو انتخاب کنین
              </Typography>
              <PersianDateRange
                :model-value="{
                  from: formData.startsAt,
                  to: formData.expiresAt,
                }"
                label="بازه تاریخ رو مشخص کنین"
                outlined
                clearable
                class="q-mt-md"
                :error="!!errors.startsAt || !!errors.expiresAt"
                :error-message="errors.startsAt || errors.expiresAt"
                @update:model-value="
                  (value) => {
                    updateField('startsAt', value?.from || null)
                    updateField('expiresAt', value?.to || null)
                  }
                "
              />
            </div>

            <div class="col-12">
              <QInput
                :model-value="formData.title"
                outlined
                label="عنوان اعلان"
                placeholder="عنوان اعلان را وارد کنید"
                :error="!!errors.title"
                :error-message="errors.title"
                @update:model-value="updateField('title', $event)"
                @blur="validateField('title')"
              />
            </div>

            <div class="col-12">
              <QInput
                :model-value="formData.text"
                outlined
                type="textarea"
                rows="4"
                label="متن پیام"
                placeholder="متن پیام را وارد کنید"
                :error="!!errors.text"
                :error-message="errors.text"
                @update:model-value="updateField('text', $event)"
                @blur="validateField('text')"
              />
            </div>

            <div class="col-12">
              <BranchSelect
                :model-value="formData.branch_ids"
                label="شعب‌ها"
                :multiple="true"
                :error-message="errors.branch_ids"
                :error="!!errors.branch_ids"
                @update:model-value="updateField('branch_ids', $event)"
                @blur="validateField('branch_ids')"
              />
            </div>
          </div>
        </QForm>
      </div>

      <div class="afm__actions">
        <Button
          variant="outline"
          color="red"
          :is-disabled="isSubmitting"
          text="انصراف"
          @click="handleCancel"
        />
        <Button
          variant="filled"
          color="blue"
          :is-loading="isSubmitting"
          text="ذخیره"
          @click="handleSubmit"
        />
      </div>
    </QCard>
  </QDialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import BranchSelect from '@/components/Form/BranchSelect'
import PersianDateRange from '@/components/Form/PersianDateRange'
import { IconX } from '@tabler/icons-vue'
import useYup from '@/composables/use-yup'
import { announcementSchema } from '../schema/announcement'
import { useApiCreateAnnouncement, useApiUpdateAnnouncement } from '../query'
import { Notif } from '@/data/services/notification-service'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  announcement: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:show', 'success'])

const internalShow = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const editMode = computed(() => !!props.announcement)

const formData = ref({
  title: '',
  text: '',
  branch_ids: [],
  enableDateRange: false,
  startsAt: null,
  expiresAt: null,
  isActive: true,
})

const { validate, validateAt, errors, resetErrors } = useYup(announcementSchema)

const updateField = (field, value) => {
  formData.value[field] = value
  if (errors.value[field]) {
    errors.value[field] = null
  }
}

const validateField = async (field) => {
  await validateAt(field, formData.value[field])
}

const resetForm = () => {
  formData.value = {
    title: '',
    text: '',
    branch_ids: [],
    enableDateRange: false,
    startsAt: null,
    expiresAt: null,
    isActive: true,
  }
  resetErrors()
}

const createAnnouncementMutation = useApiCreateAnnouncement({
  onSuccess: () => {
    Notif.success('اعلان با موفقیت افزوده شد', { position: 'top' })
    resetForm()
    internalShow.value = false
    emit('success')
  },
  onError: (error) => {
    Notif.error(error.response?.data?.message || 'خطا در ذخیره اعلان', { position: 'top' })
  },
})

const updateAnnouncementMutation = useApiUpdateAnnouncement({
  onSuccess: () => {
    Notif.success('اعلان با موفقیت ویرایش شد', { position: 'top' })
    resetForm()
    internalShow.value = false
    emit('success')
  },
  onError: (error) => {
    Notif.error(error.response?.data?.message || 'خطا در بروزرسانی اعلان', { position: 'top' })
  },
})

const isSubmitting = computed(
  () => createAnnouncementMutation.isPending.value || updateAnnouncementMutation.isPending.value
)

const handleCancel = () => {
  if (!isSubmitting.value) {
    resetForm()
    internalShow.value = false
  }
}

const handleSubmit = async () => {
  const validation = await validate(formData.value)

  if (!validation.isValid) {
    Notif.warning('لطفا تمام فیلدهای الزامی را پر کنید', { position: 'top' })
    return
  }

  try {
    await (editMode.value && props.announcement?.id
      ? updateAnnouncementMutation.mutateAsync({
          id: props.announcement.id,
          title: formData.value.title,
          text: formData.value.text,
          branch_ids: formData.value.branch_ids,
          starts_at: formData.value.startsAt || null,
          expires_at: formData.value.expiresAt || null,
          is_active: formData.value.isActive,
        })
      : createAnnouncementMutation.mutateAsync({
          title: formData.value.title,
          text: formData.value.text,
          branch_ids: formData.value.branch_ids,
          starts_at: formData.value.startsAt || null,
          expires_at: formData.value.expiresAt || null,
          is_active: formData.value.isActive,
        }))
  } catch {
    // Error is handled in mutation callbacks
  }
}

watch(
  () => props.announcement,
  (newData) => {
    if (newData) {
      formData.value = {
        title: newData.title || '',
        text: newData.text || '',
        branch_ids: newData.branches?.map((b) => b.id) || [],
        enableDateRange: !!(newData.startsAt || newData.expiresAt),
        startsAt: newData.startsAt || null,
        expiresAt: newData.expiresAt || null,
        isActive: newData.isActive ?? true,
      }
    } else {
      resetForm()
    }
  },
  { immediate: true, deep: true }
)

watch(internalShow, (newValue) => {
  if (newValue && !props.announcement) {
    // Reset form when opening for create
    resetForm()
  } else if (!newValue) {
    resetForm()
  }
})

watch(internalShow, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script>

<style scoped lang="scss">
.afm {
  width: 100%;
  max-width: 500px;
  padding: 24px;
  border-radius: 12px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  &__content {
    margin: 1rem 0;
    max-height: 70vh;
    overflow-x: hidden;
    overflow-y: auto;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    margin-top: 1rem;
  }
}
</style>
