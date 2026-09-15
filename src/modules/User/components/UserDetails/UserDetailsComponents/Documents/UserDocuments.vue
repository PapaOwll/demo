<template>
  <QCard class="q-pa-md" flat>
    <div class="flex items-baseline q-gutter-sm">
      <h5>مدارک کاربر</h5>
      <QBtn round size="sm" outline @click="updateTable">
        <IconReload />
      </QBtn>
    </div>
    <template v-for="(type, typeIndex) in typeEnums" :key="typeIndex">
      <QInnerLoading :showing="isLoading" class="q-mx-auto q-my-auto">
        <QSpinnerTail color="primary" size="50px" />
      </QInnerLoading>
      <div v-if="hasImagesOfType(type.name)">
        <div>
          <QChip square size="lg" :label="type.label" class="chips-primary" />
        </div>
        <QCard class="img-card">
          <template v-for="(image, index) in getImagesOfType(type.name)" :key="index">
            <div class="img-card__item" :class="imgTypeStyle(type.name)">
              <img
                class="document-image"
                :src="generateOtherFileData(image).path"
                :alt="type.name"
                @click="
                  isNonImageFile(image)
                    ? downloadFile(image)
                    : showImageLightBox(getImagesOfType(type.name), image)
                "
              />
              <QChip
                :class="statusLabelClass(image.status)"
                :label="image.status?.title ?? 'تعیین نشده'"
              />
            </div>
            <div class="img-card__status">
              <QSelect
                v-model="image.status"
                :options="statusList"
                map-options
                emit-value
                hide-selected
                option-value="id"
                option-label="title"
                label="تعیین وضعیت مدرک"
                outlined
                :loading="isLoading || isPending || getStatus"
                :disable="isLoading || isPending"
                @update:model-value="(e) => handleToggleChange(image, e)"
              />
            </div>
          </template>
        </QCard>
      </div>
    </template>
    <ImageCarouselLightBox
      :imgs="selectedTypeImages"
      :index="indexRef"
      :visible="visibleRef"
      @close="visibleRef = false"
    />
  </QCard>
</template>

<script setup>
import ImageCarouselLightBox from '@/components/ImageCarousel'
import { computed, ref } from 'vue'
import {
  useGetFileStatusQuery,
  useGetUserDocumentFile,
  useVerifiedDocumentFileMutation,
} from '@/modules/User/query'
import { typeEnums } from '@/modules/User/enums/typeEnums'
import excelDownloadImage from '@/assets/images/misc/excel-download.png'
import pdfDownloadImage from '@/assets/images/misc/pdf-download.png'
import { IconReload } from '@tabler/icons-vue'
import { useQueryClient } from '@tanstack/vue-query'
import { Notif } from '@/data/services/notification-service'

const queryClient = useQueryClient()
const props = defineProps({
  propData: { type: Number, default: null },
})
const indexRef = ref(0)
const visibleRef = ref(false)
const selectedTypeImages = ref([])

const { data: userDocument, isLoading } = useGetUserDocumentFile(props.propData)
const { data: statuses, isLoading: getStatus } = useGetFileStatusQuery()
const { mutate, isPending } = useVerifiedDocumentFileMutation()
const userDocuments = computed(() => userDocument.value?.items || [])
const statusList = computed(() => statuses.value || [])
const imgTypeStyle = (type) => {
  if (['user.avatar', 'user.opg', 'user.cbct'].includes(type)) {
    return 'full-width'
  }
  return ''
}
const statusLabelClass = (status) =>
  status
    ? status?.id === 15
      ? 'chips-success'
      : status?.id === 14
        ? 'text-secondary'
        : 'chips-error'
    : 'text-secondary'
const isPdfFile = (file) =>
  file.format === 'pdf' ||
  String(file.path || '')
    .toLowerCase()
    .endsWith('.pdf')
const isXlsxFile = (file) =>
  file.format === 'xlsx' ||
  String(file.path || '')
    .toLowerCase()
    .endsWith('.xlsx')
const isNonImageFile = (file) => isPdfFile(file) || isXlsxFile(file)
const showImageLightBox = (files, file) => {
  const images = files.filter((_f) => !isNonImageFile(_f))
  selectedTypeImages.value = images.map((_t) => ({ ..._t, src: _t.path }))
  indexRef.value = Math.max(
    0,
    images.findIndex((_f) => _f.id === file.id)
  )
  visibleRef.value = true
}
const handleToggleChange = (image, value) => {
  mutate(
    {
      id: image?.id,
      statusId: value,
    },
    {
      onSuccess: async (response) => {
        await queryClient.invalidateQueries({ queryKey: [response?.data?.userId] })
        Notif.success(response.message)
      },
    }
  )
}
const hasImagesOfType = (type) => {
  return userDocuments.value && userDocuments.value.some((image) => image.type === type)
}
const getImagesOfType = (type) => {
  return userDocuments.value.filter((image) => image.type === type)
}
const generateOtherFileData = (file) => {
  if (isXlsxFile(file)) {
    return {
      path: excelDownloadImage,
    }
  }

  if (isPdfFile(file)) {
    return {
      path: pdfDownloadImage,
    }
  }

  return {
    path: file.path,
  }
}
const downloadFile = (file) => {
  window.open(file.path)
}
const updateTable = async () => {
  await queryClient.invalidateQueries({ queryKey: ['user', 'user-document', props.propData] })
  Notif.success('لیست بروزرسانی شد')
}
</script>

<style scoped lang="scss">
.document-image {
  cursor: pointer;
  width: 50px;
  height: 50px;
  border: 1px solid gray;
}

.document-image:hover {
  opacity: 0.7;
}
.img-card {
  display: flex;
  padding: 1rem;
  gap: 1rem;
  margin: 1rem 0;
  &__item {
    background-color: $grey-1;
    width: 100%;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &__status {
    display: flex;
    align-items: center;
    justify-content: start;
    gap: 1rem;
  }
}
.table_docs {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
