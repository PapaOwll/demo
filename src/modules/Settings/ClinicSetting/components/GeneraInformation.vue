<template>
  <div class="branches-form">
    <QInnerLoading :showing="isCreateBranchPending || isUpdateBranchPending">
      <QSpinnerGears size="50px" color="primary" />
    </QInnerLoading>

    <QForm :disable="loading" @submit.prevent="submitForm">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <QInput
            v-model="form.name"
            outlined
            clearable
            label="نام شعبه"
            placeholder="نام شعبه"
            :disable="loading"
            :error="!!errors?.name"
            :error-message="errors?.name || null"
            @update:model-value="(value) => handleChangeFieldValue('name', value)"
          />
        </div>
        <div class="col-12 col-md-6">
          <QInput
            v-model="phoneInput"
            outlined
            clearable
            label="شماره تماس (شماره ها را با , از هم جدا کنید)"
            placeholder="شماره تماس شعبه"
            type="tel"
            :disable="loading"
            :error="isPhoneNumberInvalid || !!errors?.['data.phone']"
            :error-message="
              isPhoneNumberInvalid
                ? 'شماره تماس باید مقدار عددی باشد'
                : errors?.['data.phone'] || null
            "
            @update:model-value="handlePhoneInput"
          />
        </div>
        <div class="col-12">
          <QInput
            v-model="form.data.address"
            outlined
            type="textarea"
            label="آدرس شعبه"
            placeholder="آدرس شعبه"
            :disable="loading"
            rows="3"
            :error="!!errors?.['data.address']"
            :error-message="errors?.['data.address'] || null"
            @update:model-value="(value) => handleChangeFieldValue('data.address', value)"
          />
        </div>
        <div class="col-12">
          <QInput
            v-model="form.data.location"
            outlined
            type="textarea"
            label="لوکیشن شعبه"
            placeholder="لوکیشن شعبه"
            :disable="loading"
            rows="3"
            :error="!!errors?.['data.location']"
            :error-message="errors?.['data.location'] || null"
            @update:model-value="(value) => handleChangeFieldValue('data.location', value)"
          />
        </div>
      </div>
    </QForm>
  </div>
</template>

<script setup>
import { computed, ref, toRefs, watch } from 'vue'
import { string, object, array } from 'yup'
import { pickBy, identity, cloneDeep } from '@/utils/lodash-utils'
import { useApiCreateBranch, useApiUpdateBranch } from '@/modules/Settings/ClinicSetting/query'
import useYup from '@/composables/use-yup'
import { Notif } from '@/data/services/notification-service'

const validationSchema = object().shape({
  name: string().required('نام شعبه الزامی است'),
  data: object().shape({
    phone: array().min(1, 'حداقل یک شماره تماس الزامی است'),
    address: string().required('آدرس شعبه الزامی است'),
    location: string().nullable(),
  }),
})

const { validate, validateAt, errors } = useYup(validationSchema)
const emits = defineEmits(['close', 'afterSubmit', 'saved'])
const props = defineProps({
  editValue: {
    type: Object,
    default: () => ({}),
  },
})

const { editValue } = toRefs(props)
const isPhoneNumberInvalid = ref(false)
const phoneInput = ref('')

const form = ref({
  name: '',
  data: {
    phone: [],
    address: '',
    location: '',
  },
})

const handleChangeFieldValue = (field, value) => {
  if (field.includes('.')) {
    const [parent, child] = field.split('.')
    form.value[parent][child] = value
  } else {
    form.value[field] = value
  }
  validateAt(field, value)
}

const handlePhoneInput = (value) => {
  phoneInput.value = value
  if (!value) {
    isPhoneNumberInvalid.value = false
    form.value.data.phone = []
    validateAt('data.phone', [])
    return
  }

  const cleanValue = value.replace(/[^\d,]*/g, '')
  phoneInput.value = cleanValue
  isPhoneNumberInvalid.value = !/^\d+(,\d+)*$/.test(cleanValue)

  if (!isPhoneNumberInvalid.value) {
    const phoneArray = cleanValue.split(',').filter((item) => item.trim() !== '')
    form.value.data.phone = phoneArray
    validateAt('data.phone', phoneArray)
  }
}
const resetForm = () => {
  form.value = {
    name: '',
    data: {
      phone: [],
      address: '',
      location: '',
    },
  }
  phoneInput.value = ''
  isPhoneNumberInvalid.value = false
  errors.value = {}
}

const initializeForm = () => {
  if (editValue?.value?.id) {
    const editData = cloneDeep(editValue.value)
    if (!editData.data) {
      editData.data = {
        phone: [],
        address: '',
        location: '',
      }
    }
    form.value = pickBy(editData, identity)
    if (Array.isArray(form.value.data?.phone)) {
      phoneInput.value = form.value.data.phone.join(',')
    } else if (form.value.data?.phone) {
      phoneInput.value = form.value.data.phone.toString()
    } else {
      phoneInput.value = ''
    }
  } else {
    resetForm()
  }
}

const { mutate: createBranch, isPending: isCreateBranchPending } = useApiCreateBranch()
const { mutate: updateBranch, isPending: isUpdateBranchPending } = useApiUpdateBranch()
const loading = computed(() => isCreateBranchPending.value || isUpdateBranchPending.value)

const submitForm = async () => {
  const { isValid, payload } = await validate(form.value)
  if (!isValid) return

  if (editValue?.value?.id) {
    updateBranch(
      { ...payload, id: editValue.value.id },
      {
        onSuccess: (response) => {
          emits('saved')
          Notif.success(response.message)
        },
      }
    )
  } else {
    createBranch(
      { ...payload },
      {
        onSuccess: (response) => {
          emits('afterSubmit')
          Notif.success(response.message)
        },
      }
    )
  }
}

// Initialize form when component mounts or editValue changes
watch(editValue, initializeForm, { immediate: true, deep: true })

// Expose methods for parent component
defineExpose({
  submitForm,
  isPhoneNumberInvalid,
})
</script>

<style scoped lang="scss">
.branches-form {
  width: 100%;
}
</style>
