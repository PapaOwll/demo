<template>
  <BaseModal
    :model-value="visible"
    backdrop-filter="blur(1px)"
    transition-show="jump-down"
    transition-hide="jump-down"
    width="720px"
    :title="contactId ? 'ویرایش تماس' : 'افزودن تماس'"
    @close="closeForm"
  >
    <QForm class="contact-form" @submit.prevent="submitForm">
      <div class="row q-col-gutter-sm">
        <div class="col-12 col-md-6">
          <UserSelectField
            :model-value="contactData.user?.id"
            :display-label="
              contactData.user
                ? `${contactData.user.firstName || ''} ${contactData.user.name || ''} / ${contactData.user.mobile || ''}`.trim()
                : null
            "
            :disable="!!contactData?.id"
            :error-message="errors?.user"
            :error="!!errors?.user"
            @update:model-value="(e) => changeUser({ id: e })"
          />
        </div>
        <div class="col-12 col-md-6">
          <ContactResultSelect
            :model-value="contactData.resultId"
            label="نتیجه"
            clearable
            :error-message="errors?.resultId"
            :error="!!errors?.resultId"
            @update:model-value="(e) => handleChange('resultId', e)"
          />
        </div>
        <div class="col-12 col-md-6">
          <BranchSelect
            lazy
            :display-label="contactData?.branch?.name"
            :model-value="contactData.branch?.id"
            label="شعبه"
            clearable
            :error="!!errors?.branch"
            :error-message="errors?.branch"
            @update:model-value="(e) => handleChange('branch', e ? { id: e } : null)"
          />
        </div>
        <div class="col-12">
          <ServeSelect
            lazy
            mini-serve-service
            :model-value="
              Array.isArray(contactData?.serves)
                ? contactData.serves.map((s) => (typeof s === 'object' ? s?.id : s))
                : contactData?.serves
            "
            multiple
            chips
            label="خدمات"
            :error-message="errors?.serves"
            :error="!!errors?.serves"
            @update:model-value="
              (e) =>
                handleChange(
                  'serves',
                  (Array.isArray(e) ? e : e ? [e] : []).map((id) => ({ id }))
                )
            "
          />
        </div>
      </div>
      <div v-if="userServes.length > 0" class="row items-baseline contact-form__tp-serves">
        <p class="contact-form__tp-label">خدمات طرح درمان:</p>
        <QChip
          v-for="serve in userServes"
          :key="serve.id"
          color="secondary"
          class="contact-form__tp-chip"
          outline
          clickable
          @click="addServe(serve)"
        >
          {{ serve.title || serve.serveTitle || '-' }}
          <QInnerLoading :showing="loadingList">
            <QSpinnerTail color="primary" size="1em" />
          </QInnerLoading>
        </QChip>
      </div>
      <div class="row contact-form__field-row">
        <div class="col-12">
          <TextField
            :model-value="contactData.description"
            type="textarea"
            rows="3"
            variant="outline"
            clearable
            label="توضیحات"
            @update:model-value="(e) => handleChange('description', e)"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md">
        <div class="col-12">
          <Checkbox
            class="contact-form__checkbox"
            :model-value="contactData.addTask || addTask"
            label="افزودن وظیفه"
            @update:model-value="(e) => handleChange('addTask', e)"
          >
            <QInnerLoading :showing="loadingList">
              <QSpinnerTail color="primary" size="1em" />
            </QInnerLoading>
          </Checkbox>
        </div>
      </div>
      <div class="row contact-form__status-divider">
        <div class="col-12 col-md-5 self-start">
          <QSeparator spaced="lg" color="secondary" />
        </div>
        <div class="col-12 col-md-2 self-end">
          <p class="contact-form__status-title">وضعیت کاربر</p>
        </div>
        <div class="col-12 col-md-5 self-start">
          <QSeparator spaced="lg" color="secondary" />
        </div>
      </div>
      <div class="row q-col-gutter-md contact-form__status-fields">
        <div class="col-12 col-md-6">
          <StatusSelect
            lazy
            :display-label="contactData?.status?.title || userData?.lastStatus?.title"
            label="وضعیت"
            :model-value="contactData.status || userData?.lastStatus"
            :error="!!errors?.status"
            :error-message="errors?.status"
            @update:model-value="(e) => handleChange('status', e)"
          />
        </div>
        <div class="col-12 col-md-6">
          <TextField
            :model-value="contactData.statusDescription"
            label="شرح وضیعت"
            variant="outline"
            clearable
            @update:model-value="(e) => handleChange('statusDescription', e)"
          />
        </div>
      </div>
      <div class="row justify-center contact-form__actions">
        <Button
          color="amber"
          variant="outline"
          :is-loading="loadingList"
          text="انصراف"
          @click="closeForm"
        />
        <Button
          color="primary"
          variant="outline"
          :is-loading="loadingList"
          text="ثبت"
          @click="submitForm"
        />
      </div>
    </QForm>
  </BaseModal>
  <TaskForm
    :visible="taskFormVisible"
    :prefilled-user="userInfo"
    @submitted="afterSubmitTaskForm"
    @close="taskFormVisible = false"
  />
</template>

<script setup>
import { computed, ref, toRefs, watch } from 'vue'
import { object, number, string, array, boolean } from 'yup'
import { useQueryClient } from '@tanstack/vue-query'
import TaskForm from '@/modules/Task/components/TaskForm'
import { useApiCreateContact, useApiUpdateContact, useContactQuery } from '@/modules/Contact/query'
import { handleError } from '@/utils/error-handler'
import { useGetUserByIdMutation } from '@/modules/User/query'
import { useApiGetMinimalServe } from '@/modules/Settings/index'
import { Notif } from '@/data/services/notification-service'
import useYup from '@/composables/use-yup'
import BaseModal from '@/base/Modal'
import TextField from '@/base/TextField'
import Button from '@/base/Button'
import Checkbox from '@/base/Checkbox'
import BranchSelect from '@/components/Form/BranchSelect'
import UserSelectField from '@/components/Form/UserSelectField'
import StatusSelect from '@/components/Form/StatusSelect'
import ServeSelect from '@/components/Form/ServeSelect'
import ContactResultSelect from '@/components/Form/ContactResultSelect'

const props = defineProps({
  visible: Boolean,
  editValue: {
    type: Object,
    default: () => {},
  },
  userId: { type: [Number, String, Object], default: null },
})
const queryClient = useQueryClient()
const emits = defineEmits(['close', 'submitted'])

const { visible } = toRefs(props)
const taskFormVisible = ref(false)
const updatedContactData = ref(null)
const userData = ref(null)
const userInfo = ref(null)
const loadedUserId = ref(null)

const userServeIds = computed(() => {
  const serves = userData.value?.serves
  if (!Array.isArray(serves) || serves.length === 0) return []
  if (typeof serves[0] === 'number') return serves
  return []
})
const { data: minimalServesData } = useApiGetMinimalServe(
  {},
  { enabled: computed(() => userServeIds.value.length > 0) }
)
const userServes = computed(() => {
  const serves = userData.value?.serves
  if (!Array.isArray(serves) || serves.length === 0) return []
  if (typeof serves[0] === 'object') return serves
  const allServes = minimalServesData.value?.items || []
  return userServeIds.value.map((id) => allServes.find((s) => s.id === id)).filter(Boolean)
})

const editId = computed(() => props.editValue?.id || null)
const editPlaceholder = computed(() => props.editValue || undefined)
const { data: fetchedContact, isLoading: isContactFetchLoading } = useContactQuery(
  editId,
  editPlaceholder
)

const initialContactData = computed(() => fetchedContact.value || props.editValue || {})
const contactData = computed(() => updatedContactData.value || initialContactData.value || {})
const contactId = computed(() => contactData.value?.id)
const addTask = computed(() => JSON.parse(localStorage.getItem('addTaskFlag')) || false)

const { mutate: loadUser, isPending: getUserPending } = useGetUserByIdMutation()

const { mutate: contactUpdate, isPending: isContactUpdatePending } = useApiUpdateContact()
const { mutate: contactCreate, isPending: isContactCreatePending } = useApiCreateContact()

const loadingList = computed(
  () =>
    isContactFetchLoading.value ||
    getUserPending.value ||
    isContactUpdatePending.value ||
    isContactCreatePending.value
)

const validationSchema = object().shape({
  user: object()
    .shape({
      id: number(),
    })
    .required('کاربر را انتخاب کنید'),
  resultId: number().required('نتیجه تماس را وارد کنید'),
  type: number().default(1).required('نوع تماس را وارد کنید'),
  status: number().default(1).required('وضعیت کاربر را مشخص کنید'),
  branch: object()
    .shape({
      id: number(),
    })
    .required('شعبه را وارد کنید'),
  serves: array().nullable(),
  description: string().nullable(),
  statusDescription: string().nullable(),
  addTask: boolean().default(false).nullable(),
})
const { validate, validateAt, errors } = useYup(validationSchema)

const handleChange = (field, value) => {
  updatedContactData.value = { ...contactData.value, [field]: value }
  validateAt(field, value)
}
const changeUser = (user, skipValidation = false) => {
  if (user?.id) {
    handleChange('user', user)
    if (loadedUserId.value !== user.id) {
      loadedUserId.value = user.id
      loadUser(user.id, {
        onSuccess: ({ data }) => {
          userData.value = data
          handleChange('status', data.lastStatus?.id)
          handleChange('statusDescription', data?.statusDescription)
        },
        onError: (e) => {
          handleError(e)
        },
      })
    }
  } else if (!skipValidation) {
    handleChange('user', null)
  }
}
const addServe = (newServe) => {
  const currentServes = contactData.value.serves || []
  const newId = typeof newServe === 'object' ? newServe.id : newServe
  const exists = currentServes.some((s) => (typeof s === 'object' ? s.id : s) === newId)
  if (exists) return

  handleChange('serves', [...currentServes, { id: newId }])
}
const closeForm = () => {
  emits('close')
  updatedContactData.value = null
  loadedUserId.value = null
}
const afterSubmitTaskForm = () => {
  taskFormVisible.value = false
  emits('submitted')
}
const submitForm = async () => {
  const { isValid, payload } = await validate(contactData.value)
  if (!isValid) return
  const data = {
    ...payload,
    branchId: payload.branch?.id || null,
    userId: payload.user?.id ?? userData.value?.id,
    serves: Array.isArray(payload.serves)
      ? payload.serves.map((s) => (typeof s === 'object' ? s?.id : s))
      : payload.serves,
  }
  if (contactId.value) {
    contactUpdate(
      { id: contactId.value, ...data },
      {
        onSuccess: async (response) => {
          await queryClient.invalidateQueries({
            queryKey: ['contact'],
          })
          Notif.success(response.message)
          if (data.addTask) {
            userInfo.value = response?.data?.user || response?.user
            taskFormVisible.value = true
          }
          emits('submitted')
          closeForm()
        },
      }
    )
  } else {
    contactCreate(data, {
      onSuccess: async (response) => {
        await queryClient.invalidateQueries({
          queryKey: ['contact'],
        })
        Notif.success(response.message)
        if (data.addTask) {
          userInfo.value = response?.data?.user
          taskFormVisible.value = true
        }
        emits('submitted')
        closeForm()
      },
    })
  }
}

watch(
  () => initialContactData.value?.user,
  (value) => {
    userData.value = null
    changeUser(value, true)
  },
  {
    immediate: true,
  }
)
</script>

<style scoped lang="scss">
.contact-form {
  &__option {
    min-width: 350px;
  }

  &__tp-serves {
    margin-top: $spacing-md;
    margin-bottom: $spacing-md;
  }

  &__tp-label {
    font-size: 14px;
    color: $grey-6;
    margin-top: $spacing-sm;
  }

  &__tp-chip {
    position: relative;
    margin-left: $spacing-xs;
    margin-right: $spacing-xs;
    box-shadow: none;
  }

  &__field-row {
    margin-top: $spacing-md;
    margin-bottom: $spacing-md;
  }

  &__checkbox {
    position: relative;
  }

  &__status-title {
    font-weight: bold;
  }

  &__status-fields {
    margin-bottom: $spacing-md;
  }

  &__actions {
    gap: $spacing-sm;
  }
}
</style>
