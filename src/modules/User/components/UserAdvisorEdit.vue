<template>
  <BaseModal
    :model-value="visible"
    title="ویرایش گروهی کاربران"
    width="700px"
    @close="emits('close', { selectedUser: null })"
  >
    <QForm class="advisor-edit__content">
      <div>
        <AdvisorSelect
          v-model="formData.advisorId"
          :dense="false"
          :user-role="['advisor', 'advisor_and_online_visit']"
          :error-message="errors.advisorId"
          label="انتخاب مشاور جدید"
          @update:model-value="(e) => validateField('advisorId', e)"
        />
      </div>
      <div class="relative-position">
        <QTable
          :rows="data"
          :columns="tableColumns"
          row-key="id"
          flat
          bordered
          virtual-scroll
          class="user-data-table"
          :rows-per-page-options="[0]"
        />
        <QInnerLoading :showing="isPending">
          <QSpinnerGears color="primary" size="40px" />
        </QInnerLoading>
      </div>
    </QForm>
    <template #footer>
      <QBtn
        outline
        unelevated
        color="grey"
        label="انصراف"
        :loading="isPending"
        @click="emits('close', { selectedUser: null })"
      />
      <QBtn
        color="primary"
        unelevated
        label="ثبت"
        type="submit"
        :loading="isPending"
        @click.prevent="submit"
      />
    </template>
  </BaseModal>
</template>

<script setup>
import BaseModal from '@/base/Modal'
import { computed, reactive, toRefs, watch } from 'vue'
import AdvisorSelect from '@/components/Form/AdvisorSelect'
import useYup from '@/composables/use-yup'
import { object, string } from 'yup'
import { useBatchUpdateMutation } from '@/modules/User/query/index'
import { Notif } from '@/data/services/notification-service'
import { useQueryClient } from '@tanstack/vue-query'

const emits = defineEmits(['close', 'submit'])
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Array,
    default: () => [],
  },
})

const { visible, data } = toRefs(props)
const queryClient = useQueryClient()

const formData = reactive({
  advisorId: null,
})

const validationSchema = object().shape({
  advisorId: string()
    .required('لطفا کارشناس را انتخاب کنید')
    .typeError('لطفا کارشناس را انتخاب کنید'),
  userIds: string().required('کاربران را مشخص نمایید'),
})
const { validate, validateAt, errors } = useYup(validationSchema)

const validateField = (field, value) => {
  formData[field] = value
  validateAt(field, value)
}

const userIds = computed(() => {
  return data.value?.map((user) => user.id) || []
})

const tableColumns = computed(() => [
  {
    name: 'id',
    label: 'شناسه',
    align: 'left',
    field: 'id',
  },
  {
    name: 'name',
    label: 'نام/نام خانوادگی',
    align: 'center',
    field: (row) => `${row.firstName || ''} ${row.name || ''}`,
    classes: 'auto-width',
  },
  {
    name: 'mobile',
    label: 'شماره همراه',
    align: 'center',
    field: 'mobile',
  },
  {
    name: 'advisor',
    label: 'مشاور فعلی',
    align: 'center',
    field: (row) => row?.advisor?.name,
  },
])

const { mutate, isPending } = useBatchUpdateMutation()

const submit = async () => {
  const isValid = await validate({
    advisorId: formData.advisorId,
    userIds: userIds.value,
  })

  if (isValid) {
    mutate(
      {
        advisorId: formData.advisorId,
        cancelAdvise: false,
        users: userIds.value,
      },
      {
        onSuccess: (response) => {
          Notif.success(response.message)
          queryClient.invalidateQueries({ queryKey: ['user', 'all-users'] })
          emits('close', { selectedUser: null })
        },
      }
    )
  }
}

watch(visible, (newValue) => {
  if (!newValue) {
    formData.advisorId = null
  }
})
</script>

<style scoped lang="scss">
.advisor-edit__content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.user-data-table {
  padding: $spacing-lg;
  height: 400px;
}
</style>
