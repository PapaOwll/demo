<template>
  <QCard flat class="container q-pa-md">
    <QCardSection>
      <QForm @submit.prevent="submitForm">
        <div class="row items-center">
          <div class="col-md-8 col-12">
            <span class="text-h6">تنظیمات کلینیک</span>
          </div>
          <div class="col-md-4 col-12 flex justify-end items-center q-pa-none q-gutter-sm">
            <QBtn :loading="isPending" color="primary" outline round @click="updateTable">
              <IconRefresh />
            </QBtn>
            <QBtn
              v-if="getPerms('setting', 'update', true, 'clinicSetting')"
              :loading="isPending"
              color="primary"
              class="q-py-sm"
              rounded
              @click="submitForm"
            >
              ذخیره تنظیمات
            </QBtn>
          </div>
        </div>
        <div class="row q-col-gutter-md q-my-md">
          <div class="col-md-6 col-12">
            <QInput
              :model-value="clinicInfo.name"
              clearable
              outlined
              label="نام کلینیک"
              :error="!!errors?.name"
              :error-message="errors?.name || null"
              @update:model-value="(e) => handleChangeFieldValue('name', e)"
            />
          </div>
          <div class="col-md-6 col-12">
            <QInput
              :model-value="clinicInfo.instagram"
              outlined
              clearable
              label="اینستاگرام"
              :error="!!errors?.instagram"
              :error-message="errors?.instagram || null"
              @update:model-value="(e) => handleChangeFieldValue('instagram', e)"
            />
          </div>
        </div>

        <div class="row q-my-md q-col-gutter-md">
          <div class="col-12">
            <QBtn
              v-if="getPerms('setting', 'add', true, 'generalSetting')"
              outline
              color="positive"
              class="float-right"
              @click="openBranchForm"
            >
              افزودن شعبه
            </QBtn>
          </div>
          <div class="col-12">
            <QTable
              flat
              :rows="branchesListItems"
              :columns="tableColumns"
              :rows-per-page-options="[0]"
              class="quasar-table"
              :no-data-label="null"
              row-key="id"
            >
              <template #body-cell-action="scope">
                <QTd :props="scope">
                  <div class="q-gutter-sm">
                    <QBtn
                      v-if="getPerms('setting', 'update', true, 'clinicSetting')"
                      outline
                      round
                      color="primary"
                      @click="openBranchForm(scope.row)"
                    >
                      <IconEdit />
                    </QBtn>
                    <!--                    <QBtn-->
                    <!--                      v-if="getPerms('setting', 'delete', true, 'clinicSetting')"-->
                    <!--                      outline-->
                    <!--                      round-->
                    <!--                      color="negative"-->
                    <!--                      @click="deleteBranch(scope.row)"-->
                    <!--                    >-->
                    <!--                      <IconTrash />-->
                    <!--                    </QBtn>-->
                  </div>
                </QTd>
              </template>
            </QTable>
          </div>
          <div class="col-12 bg-grey-3 rounded-borders q-pa-md q-mt-md">
            <label class="q-item__label q-mb-md" for="uploader">لوگوی کلینیک:</label>
            <BaseUploader
              id="uploader"
              :max-file-size="1048576 * 10"
              :accept="'image/jpeg,image/png'"
              enum-type="clinic.icon"
              label="لوگوی کلینیک"
              :disable="isPending"
              auto-upload
              @update:model-value="(e) => handleLogoUploader(e)"
            />
            <div
              v-if="errors.iconFileId"
              class="v-field__error"
              :class="errors.iconFileId ? 'show' : 'hide'"
            >
              <i class="ic-u_info-circle" />
              {{ errors.iconFileId }}
            </div>

            <a
              v-if="clinicInfo.icon?.path && !isPending"
              :href="clinicInfo.icon.path"
              target="_blank"
            >
              مشاهده
            </a>
          </div>
          <QInnerLoading :showing="isLoading || isPending">
            <QSpinnerGears size="50px" color="primary" />
          </QInnerLoading>
        </div>
      </QForm>
    </QCardSection>
    <BranchesTabs
      :visible="showBranchesForm"
      :edit-value="branchData"
      @after-submit="afterSubmitBranch"
      @saved="onBranchSaved"
      @close="closeBranchForm"
    />
  </QCard>
</template>

<script setup>
import BranchesTabs from '@/modules/Settings/ClinicSetting/components/BranchesTabs'
import { ref, computed } from 'vue'
import { IconRefresh, IconEdit } from '@tabler/icons-vue'
import { string, object, number } from 'yup'
import {
  useApiGetBranches,
  useApiGetIndustrySetting,
  useApiSetClinicSetting,
} from '@/modules/Settings/ClinicSetting/query'
import { getPerms } from '@/utils/get-perms'
import { useQueryClient } from '@tanstack/vue-query'
import useYup from '@/composables/use-yup'
import BaseUploader from '@/components/Form/BaseUploader/BaseUploader'
import { Notif } from '@/data/services/notification-service'

const queryClient = useQueryClient()
const showBranchesForm = ref(false)
const branchData = ref(null)
const updatedClinicData = ref(null)
const { data: branchesListData, isLoading } = useApiGetBranches()

const branchesListItems = computed(() => {
  return (
    branchesListData.value?.items?.map((item) => ({
      ...item,
      id: item.id,
      name: item.name,
      address: item.data?.address,
      location: item?.data?.location,
      phone: item?.data?.phone.toString(),
    })) || []
  )
})

const { data: initialClinicInfo } = useApiGetIndustrySetting()
const clinicInfo = computed(() => updatedClinicData.value || initialClinicInfo.value || {})

const updateTable = () => {
  queryClient.invalidateQueries({ queryKey: ['setting', 'industry-setting'] })
  queryClient.invalidateQueries({ queryKey: ['setting', 'industry-branches'] })
}

const openBranchForm = (data) => {
  showBranchesForm.value = true
  branchData.value = data
}

const validationSchema = object().shape({
  name: string().required().typeError('فیلد نام الزامیست'),
  instagram: string(),
  icon: object().shape({
    id: number(),
  }),
})
const { validate, validateAt, errors } = useYup(validationSchema)

const handleChangeFieldValue = (field, value) => {
  updatedClinicData.value = { ...initialClinicInfo.value, [field]: value }
  validateAt(field, value)
}

const handleLogoUploader = (file) => {
  handleChangeFieldValue('icon', file.data[0])
}
const afterSubmitBranch = () => {
  showBranchesForm.value = false
  branchData.value = null
  updateTable()
}
const onBranchSaved = () => {
  updateTable()
}
const closeBranchForm = () => {
  showBranchesForm.value = false
  branchData.value = {}
}
const { mutate: saveClinicSetting, isPending } = useApiSetClinicSetting()
const submitForm = async () => {
  const { isValid, payload } = await validate(clinicInfo.value)
  if (!isValid) return
  const form = {
    instagram: payload.instagram,
    name: payload.name,
    iconFileId: payload.icon.id,
  }
  saveClinicSetting(
    { data: form },
    {
      onSuccess: (response) => {
        Notif.success(response?.message)
        updateTable()
      },
    }
  )
}

const tableColumns = [
  {
    label: 'نام شعبه',
    name: 'name',
    field: 'name',
    align: 'left',
  },
  {
    label: 'آدرس شعبه',
    name: 'address',
    field: 'address',
    align: 'left',
    classes: 'branch-cell',
  },
  {
    label: 'شماره تماس',
    name: 'phone',
    field: 'phone',
    align: 'left',
    classes: 'branch-cell',
  },
  {
    label: 'لوکیشن',
    name: 'location',
    field: 'location',
    align: 'left',
    classes: 'branch-cell',
  },
  {
    label: '',
    name: 'action',
    align: 'right',
  },
]
</script>

<style lang="scss" scoped>
.container {
  width: 80dvw;
  margin: auto;
}
:deep(.branch-cell) {
  max-width: 200px !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
