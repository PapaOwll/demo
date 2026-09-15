<template>
  <QDialog
    :model-value="visible"
    @update:model-value="closeForm"
    @escape-key="closeForm"
    @before-hide="closeForm"
  >
    <QCard class="coordinator-form">
      <div class="form-header">
        <h5>{{ coordinatorData.ownerId ? 'ویرایش کارشناس' : 'افزودن کارشناس' }}</h5>
        <QBtn fab-mini flat @click="closeForm">
          <IconX />
        </QBtn>
      </div>
      <QSeparator spaced="md" />

      <QForm class="q-pa-md" @submit.prevent="onSubmit">
        <div class="q-mb-md">
          <AdvisorSelect
            :model-value="coordinatorData.ownerId"
            :user-role="['coordinator']"
            label="کارشناس نوبت دهی"
            placeholder="کارشناس نوبت دهی را انتخاب کنید"
            :error="!!errors.ownerId"
            :error-message="errors.ownerId"
            outlined
            :dense="false"
            @update:model-value="(value) => handleChange('ownerId', value)"
          />
        </div>

        <div class="row justify-center q-gutter-sm q-mt-md">
          <QBtn color="orange" outline :loading="isPending" size="md" @click="closeForm">
            انصراف
          </QBtn>
          <QBtn type="submit" color="primary" outline :loading="isPending" size="md">ثبت</QBtn>
        </div>
      </QForm>
    </QCard>
  </QDialog>
</template>

<script setup>
import { computed, ref, toRefs, watch } from 'vue'
import { Notif } from '@/data/services/notification-service'
import { object, string, number } from 'yup'
import useYup from '@/composables/use-yup'
import { cloneDeep } from '@/utils/lodash-utils'
import AdvisorSelect from '@/components/Form/AdvisorSelect'
import { useSetCoordinator } from '@/modules/Booking'
import { useQueryClient } from '@tanstack/vue-query'
import { handleError } from '@/utils/error-handler'
import { IconX } from '@tabler/icons-vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  editValue: { type: Object, default: () => null },
  userId: { type: Number, default: null },
})

const emits = defineEmits(['close', 'afterSubmit'])
const { visible } = toRefs(props)
const queryClient = useQueryClient()

const updatedCoordinatorData = ref(null)

// Form validation schema
const validationSchema = object().shape({
  ownerId: string().required('کارشناس الزامیست'),
  userIds: number().nullable(),
})

const { validate, validateAt, errors } = useYup(validationSchema)

const initialCoordinatorData = computed(() => props.editValue || {})
const coordinatorData = computed(
  () => updatedCoordinatorData.value ?? initialCoordinatorData.value ?? {}
)

const handleChange = (field, value) => {
  updatedCoordinatorData.value = { ...coordinatorData.value, [field]: value }
  validateAt(field, value)
}

const closeForm = () => {
  emits('close', false)
  updatedCoordinatorData.value = null
}

const { mutate, isPending } = useSetCoordinator()

const onSubmit = async () => {
  const { isValid, payload } = await validate(coordinatorData.value)
  if (!isValid) return
  mutate(
    { ownerId: payload?.ownerId, userIds: [payload?.userIds] },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['booking-users'] })
        Notif.success(data.message)
        emits('afterSubmit')
      },
      onError: (error) => {
        handleError(error)
      },
    }
  )
}

watch(
  () => props.editValue,
  (newValue) => {
    if (props.visible && newValue) {
      const data = cloneDeep(newValue)
      updatedCoordinatorData.value = {
        ownerId: data?.userOwner?.id || null,
        userIds: data?.id || null,
      }
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.coordinator-form {
  width: 400px;
  max-width: 90vw;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;

  h5 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: $grey-8;
  }
}
</style>
