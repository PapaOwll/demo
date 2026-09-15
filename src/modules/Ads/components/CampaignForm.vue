<template>
  <QDialog
    :model-value="visible"
    @update:model-value="closeForm"
    @escape-key="closeForm"
    @before-hide="closeForm"
  >
    <QCard class="campaign-form">
      <QInnerLoading :showing="isLoading" class="q-mx-auto q-my-auto">
        <QSpinnerGears size="50px" color="primary" />
      </QInnerLoading>

      <QCardSection class="campaign-form__header">
        <div class="campaign-form__header-content">
          <QIcon name="campaign" size="2rem" color="primary" />
          <span class="campaign-form__title">
            {{ campaignId ? 'ویرایش کمپین' : 'افزودن کمپین' }}
          </span>
        </div>
        <QBtn flat round dense icon="close" color="grey-7" @click="closeForm" />
      </QCardSection>

      <QSeparator />

      <QForm @submit.prevent="submitForm">
        <QCardSection class="campaign-form__content">
          <div class="campaign-form__row">
            <div class="campaign-form__field">
              <QInput
                v-model="campaignData.title"
                label="عنوان *"
                outlined
                clearable
                :error="!!errors.title"
                :error-message="errors.title"
                class="campaign-form__input"
                @update:model-value="(value) => handleChange('title', value)"
              />
            </div>
            <div class="campaign-form__field">
              <QInput
                v-model="campaignData.slug"
                label="شناسه *"
                outlined
                clearable
                :error="!!errors.slug"
                :error-message="errors.slug"
                class="campaign-form__input"
                @update:model-value="(value) => handleChange('slug', value)"
              />
            </div>
          </div>
          <div class="campaign-form__row">
            <div class="campaign-form__field campaign-form__field--half">
              <PersianDate
                :model-value="campaignData.startedAt"
                label="تاریخ شروع"
                :error="!!errors.startedAt"
                :error-message="errors.startedAt"
                @update:model-value="(value) => handleChange('startedAt', value)"
              />
            </div>
            <div class="campaign-form__field campaign-form__field--half">
              <PersianDate
                :model-value="campaignData.endedAt"
                label="تاریخ پایان"
                :error="!!errors.endedAt"
                :error-message="errors.endedAt"
                @update:model-value="(value) => handleChange('endedAt', value)"
              />
            </div>
          </div>

          <div class="campaign-form__field">
            <QInput
              v-model="campaignData.description"
              label="توضیحات"
              type="textarea"
              outlined
              rows="4"
              :error="!!errors.description"
              :error-message="errors.description"
              class="campaign-form__textarea"
              @update:model-value="(value) => handleChange('description', value)"
            />
          </div>
        </QCardSection>

        <QSeparator />

        <QCardActions class="campaign-form__actions">
          <QBtn flat label="انصراف" color="grey-7" :disable="isLoading" @click="closeForm" />
          <QBtn
            type="submit"
            unelevated
            label="ثبت"
            icon-right="save"
            color="primary"
            :loading="isLoading"
            :disable="isLoading"
          />
        </QCardActions>
      </QForm>
    </QCard>
  </QDialog>
</template>

<script setup>
import { toRefs, ref, computed } from 'vue'
import { Notif } from '@/data/services/notification-service'
import { camelize } from '@/utils/convert-to-camel-snake'
import useYup from '@/composables/use-yup'
import { object, string } from 'yup'
import { useCreateCampaignMutation, useUpdateCampaignMutation } from '@/modules/Ads/query'
import { useQueryClient } from '@tanstack/vue-query'
import PersianDate from '@/components/Form/PersianDate'
import { formatDate } from '@/utils/date-utils'

const props = defineProps({
  visible: Boolean,
  editValue: {},
})

const emits = defineEmits(['close', 'afterSubmit'])
const { visible } = toRefs(props)
const queryClient = useQueryClient()

const updatedCampaignData = ref(null)
const campaignData = computed(() => updatedCampaignData.value || camelize(props.editValue) || {})
const campaignId = computed(() => campaignData.value.id)

const validationSchema = object().shape({
  title: string().required('عنوان الزامی است'),
  slug: string().nullable(),
  description: string().nullable(),
  startedAt: string().nullable(),
  endedAt: string().nullable(),
})

const { validate, validateAt, errors } = useYup(validationSchema)
const { mutate: createCampaign, isPending: createCampaignPending } = useCreateCampaignMutation()
const { mutate: updateCampaign, isPending: updateCampaignPending } = useUpdateCampaignMutation()

const isLoading = computed(() => createCampaignPending.value || updateCampaignPending.value)

const handleChange = (field, value) => {
  updatedCampaignData.value = { ...campaignData.value, [field]: value }
  validateAt(field, value)
}
const successCallback = (data) => {
  queryClient.invalidateQueries({
    queryKey: ['campaign', 'all-campaigns'],
  })
  Notif.success(data.message || 'عملیات با موفقیت انجام شد')
  updatedCampaignData.value = null
  emits('afterSubmit')
}
const submitForm = async () => {
  const { isValid, payload } = await validate(campaignData.value)
  if (!isValid) return

  const form = {
    ...payload,
    startedAt: formatDate(payload.startedAt) ?? undefined,
    endedAt: formatDate(payload.endedAt) ?? undefined,
  }

  if (props.editValue?.id) {
    updateCampaign(
      { ...form, id: props.editValue?.id },
      {
        onSuccess: successCallback,
      }
    )
  } else {
    createCampaign(form, {
      onSuccess: successCallback,
    })
  }
}

const closeForm = () => {
  updatedCampaignData.value = null
  emits('close', false)
}
</script>

<style scoped lang="scss">
.campaign-form {
  min-width: 35rem;
  max-width: 40rem;
  border-radius: 0.5rem;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
  }

  &__header-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1976d2;
  }

  &__content {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__row {
    display: flex;
    gap: 1rem;
  }

  &__field {
    display: flex;
    flex-direction: column;
    flex: 0.5;

    &--half {
      flex: 1;
    }
  }

  &__input,
  &__textarea {
    width: 100%;
  }

  &__actions {
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
}

// Responsive design
@media (max-width: 768px) {
  .campaign-form {
    min-width: 20rem;
    max-width: 95vw;
    margin: 1rem;

    &__header {
      padding: 1rem;
    }

    &__content {
      padding: 1rem;
      gap: 1rem;
    }

    &__row {
      flex-direction: column;
      gap: 1rem;
    }

    &__actions {
      padding: 1rem;
      flex-direction: column-reverse;

      .q-btn {
        width: 100%;
      }
    }
  }
}

@media (max-width: 480px) {
  .campaign-form {
    min-width: 18rem;

    &__header {
      padding: 0.75rem;
    }

    &__title {
      font-size: 1rem;
    }

    &__content {
      padding: 0.75rem;
    }

    &__actions {
      padding: 0.75rem;
    }
  }
}
</style>
