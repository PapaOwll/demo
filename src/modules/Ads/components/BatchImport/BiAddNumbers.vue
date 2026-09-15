<template>
  <div>
    <QTabs
      v-model="activeTab"
      align="right"
      indicator-color="teal"
      @update:model-value="handleClick"
    >
      <QTab name="manual">
        <div class="row q-gutter-xs">
          <IconPencilPlus class="text-teal" />
          <span>به صورت دستی</span>
        </div>
      </QTab>
      <QTab name="byExcel">
        <div class="row q-gutter-xs">
          <IconFileTypeXls class="text-teal" />
          <span>با فایل اکسل"</span>
        </div>
      </QTab>
    </QTabs>
    <QTabPanels v-model="activeTab" animated>
      <QTabPanel name="manual">
        <div class="justify-between items-center">
          <div class="col-md-6 col-auto">
            <label class="q-my-md">
              برای افزودن گروهی کاربران شماره موبایل آن‌ها را وارد کنید.
            </label>
          </div>
        </div>
        <div class="col-md-6 col-auto tabs__content">
          <QInput
            :model-value="batchImportForm?.numbers"
            label="شماره موبایل"
            outlined
            clearable
            type="textarea"
            rows="5"
            @update:model-value="(e) => handelChange('numbers', e)"
          />
          <QChip color="amber" square class="alert">
            <div class="hint">
              <IconAlertTriangle width="18" />
              <span>
                برای تایید شماره موبایل، آن ها را با
                <IconWand stroke="{1}" size="20" />
                مرتب کنید.
              </span>
            </div>
          </QChip>
        </div>
      </QTabPanel>
      <QTabPanel name="byExcel">
        <div class="col-md-6 col-auto">
          <div class="col-md-12 col-auto">
            <BaseUploader
              :max-file-size="1048576 * 10"
              :accept="'.xlsx, .xls'"
              enum-type="user.import"
              :disable="isPending"
              auto-upload
              @update:model-value="getUploadedFileName"
            />
          </div>
        </div>
        <div class="row">
          <div class="col-md-12 col-auto">
            <QChip square class="alert">
              <div class="hint">
                <IconAlertTriangle width="18" />
                <span>فایل حتما باید دارای ستون های زیر باشد:</span>
              </div>
              <span class="hint-desc">موبایل | نام | نام خانوادگی | استان | شهر</span>
            </QChip>
            <div class="row q-mt-sm">
              <a :href="sampleXlsxUrl" download class="download-link">
                <IconDownload size="16" />
                <span>دانلود فایل نمونه</span>
              </a>
            </div>
          </div>
        </div>
      </QTabPanel>
    </QTabPanels>
    <div class="row q-gutter-sm justify-end">
      <QBtn
        v-if="activeTab === 'manual'"
        color="secondary"
        glossy
        outline
        :disable="!batchImportForm?.numbers"
        :loading="isPending"
        @click="reformatNumbers"
      >
        <QTooltip class="text-body2">
          {{ !batchImportForm?.numbers ? 'ابتدا شماره ها را وارد کنید' : 'مرتب سازی شماره ها' }}
        </QTooltip>
        <IconWand size="20" />
      </QBtn>
      <QBtn color="primary" :loading="isPending" :disable="disabledStep" @click="submit">
        ثبت اطلاعات
      </QBtn>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const sampleXlsxUrl = `${import.meta.env.BASE_URL}files/sample.xlsx`

import {
  IconPencilPlus,
  IconAlertTriangle,
  IconWand,
  IconFileTypeXls,
  IconDownload,
} from '@tabler/icons-vue'
import { object, string, number } from 'yup'
import { extractValidPhoneNumbers } from '@/utils/extract-valid-phone-numbers'
import BaseUploader from '@/components/Form/BaseUploader/BaseUploader'
import { useCheckImportFileMutation } from '@/modules/Ads/query'
import { Notif } from '@/data/services/notification-service'
import useYup from '@/composables/use-yup'

const fileId = ref(null)
const activeTab = ref('manual')
const numbers = ref(null)
const batchImportForm = ref(null)
const emits = defineEmits(['result', 'next', 'fileId'])

const validationSchema = object().shape({
  numbers: string(),
  fileId: number(),
})
const { validate, validateAt } = useYup(validationSchema)
const handelChange = (field, value) => {
  batchImportForm.value = { ...batchImportForm.value, [field]: value }
  validateAt(field, value)
}
const disabledStep = computed(() => {
  if (activeTab.value === 'manual') {
    return !batchImportForm.value?.numbers
  }
  return !fileId.value
})

const convertTextArea = () => {
  const result = extractValidPhoneNumbers(batchImportForm.value?.numbers)
  if (result.alreadyFormatted) {
    Notif.warning('شماره ها در حال حاضر در فرمت درستی هستند')
  }
  numbers.value = result.formatted
  handelChange('numbers', numbers.value)
}
const reformatNumbers = () => {
  setTimeout(() => {
    convertTextArea()
  }, 1000)
}
const handleClick = (tab) => {
  activeTab.value = tab
}
const getUploadedFileName = (fileName) => {
  fileId.value = fileName.data[0]?.id
  handelChange('fileId', fileId.value)
}
const { mutate: checkImportedFile, isPending } = useCheckImportFileMutation()
const submit = async () => {
  const { isValid, payload } = await validate(batchImportForm.value)
  if (!isValid) return
  if (activeTab.value === 'byExcel') {
    checkImportedFile(
      { fileId: payload?.fileId },
      {
        onSuccess: (res) => {
          Notif.success(res.message)
          emits('result', res.data)
          emits('fileId', fileId.value)
          emits('next', true)
        },
      }
    )
  } else {
    checkImportedFile(
      {
        numbers: payload?.numbers.split('\n'),
      },
      {
        onSuccess: (res) => {
          Notif.success(res.message)
          emits('result', res.data)
          emits('next', true)
        },
      }
    )
  }
}
</script>

<style scoped lang="scss">
.tabs {
  width: 100%;
  padding: 0;

  &__content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

.hint {
  display: flex;
  gap: 10px;

  &-desc {
    margin: 0 2.5em;
    color: grey;
    font-size: 14px;
  }
}

.alert {
  background-color: $amber-1 !important;
  color: $amber-9 !important;
}

.download-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: $teal;
  text-decoration: none;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: rgba(0, 128, 128, 0.1);
    text-decoration: none;
  }

  svg {
    flex-shrink: 0;
  }
}
</style>
