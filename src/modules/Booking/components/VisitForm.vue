<template>
  <BaseModal
    :model-value="visible"
    width="720px"
    :title="visitId ? 'ویرایش مراجعه' : 'افزودن مراجعه'"
    :loading="isBookingFetchLoading || isCreateVisitPending || isUpdateVisitPending"
    @close="closeForm"
    @before-show="handleDialogOpen"
    @before-hide="closeForm"
  >
    <QForm class="visit-form" @submit.prevent="submitForm">
      <div class="row q-col-gutter-sm">
        <div class="col-12">
          <ServeSelect
            mini-serve-service
            :model-value="
              Array.isArray(visitFormData.serves)
                ? visitFormData.serves.map((s) => s?.id ?? s)
                : visitFormData.serves
            "
            label="خدمات"
            chips
            multiple
            :error="errors?.serves ? !!errors?.serves : null"
            :error-message="errors?.serves"
            @update:model-value="
              (e) =>
                handleChange(
                  'serves',
                  (Array.isArray(e) ? e : e ? [e] : []).map((id) => ({ id }))
                )
            "
          />
          <div v-if="visitFormData.serves" class="row items-baseline">
            <p class="visit-form__serves-label">خدمات نوبت:</p>
            <QChip
              v-for="serve in initialVisitData?.serves || []"
              :key="serve.id"
              square
              outline
              clickable
              color="secondary"
              class="visit-form__serves-chip"
              @click="() => addServe(serve)"
            >
              {{ serve.title }}
            </QChip>
          </div>
        </div>
        <div class="col-12 col-md-6">
          <TextField
            variant="outline"
            label="شماره پرونده*"
            clearable
            :model-value="visitFormData.docNumber"
            :error="!!errors?.docNumber"
            :error-message="errors?.docNumber"
            @update:model-value="(e) => handleChange('docNumber', convertToEnNumber(e))"
          />
        </div>
        <div class="col-12 col-md-6">
          <TextField
            variant="outline"
            label="کدملی*"
            clearable
            :model-value="visitFormData?.nationalCode || visitFormData?.user?.nationalCode"
            :error="!!errors?.nationalCode"
            :error-message="errors?.nationalCode"
            @update:model-value="(e) => handleChange('nationalCode', convertToEnNumber(e))"
            @load="(e) => handleChange('nationalCode', e)"
          />
        </div>
        <div class="col-12">
          <TextField
            variant="outline"
            label="توضیحات"
            type="textarea"
            :rows="2"
            clearable
            :model-value="visitDescription"
            @update:model-value="(e) => handleChange('description', e)"
          />
        </div>
        <div v-if="activeTreatment?.prepayAt" class="visit-form__alert">
          <div class="row items-center visit-form__alert-content">
            <IconAlertSquareRounded size="24" />
            <span class="visit-form__alert-text">
              این کاربر برای طرح درمان
              <a :href="activeTreatment?.publicLink" target="_blank">
                {{ activeTreatment?.id }}
              </a>
              مبلغ {{ generatePriceFormat(activeTreatment?.prepay) }} بیعانه پرداخت کرده است.
              <span v-if="activeTreatment?.extraditionAt">(عودت داده شده)</span>
            </span>
          </div>
        </div>
        <div class="col-12">
          <BaseUploader
            :max-file-size="1048576 * 2.7"
            :accept="'.jpg, image/*'"
            enum-type="visit.files"
            auto-upload
            multiple
            @update:model-value="(e) => handleFileUploaded(e)"
          />
          <div v-if="visitFiles.length > 0" class="visit-form__files">
            <div v-for="(file, index) in visitFiles" :key="index" class="visit-form__file-link">
              <a :href="file?.path" target="_blank" class="visit-form__file-anchor">
                مشاهده فایل {{ index + 1 }}
              </a>
            </div>
          </div>
        </div>
        <div class="row justify-center items-center visit-form__actions">
          <Button variant="outline" color="amber" text="انصراف" @click="closeForm" />
          <Button variant="outline" color="light-blue" text="ثبت" type="submit" />
        </div>
      </div>
    </QForm>
  </BaseModal>
</template>

<script setup>
import { ref, toRefs, computed } from 'vue'
import { string, array, object, number } from 'yup'
import { IconAlertSquareRounded } from '@tabler/icons-vue'
import { handleError } from '@/utils/error-handler'
import { useGetUserActivateTreatmentPlanQuery } from '@/modules/TreatmentPlan/query/index'
import {
  useCreateVisitMutation,
  useUpdateVisitMutation,
  useBookingQuery,
} from '@/modules/Booking/query'
import { useQueryClient } from '@tanstack/vue-query'
import useYup from '@/composables/use-yup'
import BaseUploader from '@/components/Form/BaseUploader/BaseUploader'
import { Notif } from '@/data/services/notification-service'
import ServeSelect from '@/components/Form/ServeSelect'
import { convertToEnNumber } from '@/utils/convert-check-digits'
import TextField from '@/base/TextField'
import Button from '@/base/Button'
import BaseModal from '@/base/Modal'

const props = defineProps({
  visible: Boolean,
  editValue: {},
})

const emits = defineEmits(['close', 'onSubmit'])
const { visible, editValue } = toRefs(props)
const queryClient = useQueryClient()
const updatedVisitData = ref(null)
const files = ref([])

const editBookingId = computed(() => props.editValue?.id || null)
const editBookingPlaceholder = computed(() => props.editValue || undefined)
const { data: fetchedBooking, isLoading: isBookingFetchLoading } = useBookingQuery(
  editBookingId,
  editBookingPlaceholder
)

const initialVisitData = computed(() => fetchedBooking.value || editValue.value || [])
const visitFormData = computed(() => updatedVisitData.value || initialVisitData.value || [])
const visitId = computed(() => visitFormData.value?.visit?.id || null)
const userId = computed(() => props.editValue?.user?.id)
const enabled = computed(() => !!userId.value && !!visible.value)
const visitFiles = computed(() => initialVisitData.value?.visit?.files || [])
const visitDescription = computed(
  () => visitFormData.value.description || initialVisitData.value?.visit?.description || null
)
const { data: activeTreatment } = useGetUserActivateTreatmentPlanQuery(userId, { enabled })

const validationSchema = object().shape({
  docNumber: number()
    .typeError('باید مقدار عددی باشد')
    .required()
    .transform((_, value) => {
      return value ? Number(value) : null
    }),
  serves: array()
    .of(
      object().shape({
        id: number()
          .required('خدمات کاربر را انتخاب کنید')
          .typeError('خدمات کاربر را انتخاب کنید')
          .test('is-valid-id', 'خدمات کاربر الزامیست', (value) => {
            return !!value
          }),
      })
    )
    .required('خدمات کاربر را انتخاب کنید'),
  bookingId: number(),
  description: string().nullable(),
  userId: string(),
  fileIds: array().of(
    object().shape({
      id: number(),
    })
  ),
  nationalCode: string()
    .nullable()
    .matches(/^\d*$/, 'مقدار باید عدد باشد')
    .test('nationalCode-max-length', function (value) {
      if (!value) return true
      const maxLength = 10
      const message = 'کدملی حداکثر 10 رقم است'
      return value.length <= maxLength || this.createError({ message })
    }),
})
const { validate, validateAt, errors } = useYup(validationSchema)
const handleChange = (field, value) => {
  updatedVisitData.value = { ...visitFormData.value, [field]: value }
  validateAt(field, value)
}
const handleFileUploaded = (file) => {
  files.value.push({ ...files.value, ...file.data[0] })
  handleChange('fileIds', files.value)
}
const handleDialogOpen = () => {
  files.value = [...visitFiles.value]
}
const closeForm = () => {
  updatedVisitData.value = null
  files.value = []
  errors.value = {}
  emits('close', false)
}

const addServe = (newServe) => {
  const currentServes = visitFormData.value.serves || []

  const exists = currentServes.some((serve) =>
    typeof serve === 'object' ? serve.id === newServe.id : serve === newServe.id
  )
  if (exists) return

  handleChange('serves', [...currentServes, { id: newServe.id }])
}
const generatePriceFormat = (amount) => {
  if (!amount) return 'نامشخص'
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const { mutate: createVisit, isPending: isCreateVisitPending } = useCreateVisitMutation()
const { mutate: updateVisit, isPending: isUpdateVisitPending } = useUpdateVisitMutation()
const submitForm = async () => {
  const { isValid, payload } = await validate(visitFormData.value)
  if (!isValid) return
  const body = {
    ...payload,
    nationalCode: payload?.nationalCode || visitFormData.value?.user?.nationalCode,
    bookingId: payload?.id || visitFormData.value?.id,
    userId: payload.userId,
    serves: payload.serves ? payload.serves.map((s) => s.id) : [],
    fileIds: payload.fileIds ? payload.fileIds.map((f) => f.id) : [],
    prepay: false,
    price: 0,
    extradition: false,
  }
  if (visitId.value) {
    updateVisit(
      { ...body, id: visitId.value },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ['booking'] })

          Notif.success(data.message)
          emits('close')
        },
        onError: (error) => {
          handleError(error)
        },
      }
    )
  } else {
    createVisit(body, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['booking'] })
        Notif.success(data.message)
        emits('close')
      },
      onError: (error) => {
        handleError(error)
      },
    })
  }
}
</script>

<style scoped lang="scss">
.visit-form {
  &__serves-label {
    font-size: 14px;
    line-height: 1.5;
  }

  &__serves-chip {
    margin-left: $spacing-sm;
    margin-right: $spacing-sm;
    margin-top: $spacing-sm;
    margin-bottom: $spacing-sm;
  }

  &__alert {
    width: 100%;
  }

  &__alert-content {
    background-color: $grey-2;
  }

  &__alert-text {
    margin-right: $spacing-sm;
    font-size: 12px;
  }

  &__files {
    margin-top: $spacing-xs;
  }

  &__file-link {
    margin-top: $spacing-xs;
    margin-bottom: $spacing-xs;
  }

  &__file-anchor {
    color: $green-6;
  }

  &__actions {
    gap: $spacing-sm;
    width: 100%;
  }
}
</style>
