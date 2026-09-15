<template>
  <div class="row">
    <h5 class="q-ma-none">برچسب ها</h5>
  </div>
  <div v-if="tagList.length > 0" class="tags">
    <QChip
      v-for="tag in tagList"
      :key="tag.id"
      outline
      removable
      clickable
      class="col-md-2 tags__box"
      @remove="handleRemoveTag(tag.id)"
      @click.stop="handleEditTag(tag)"
    >
      <div class="tags__dot" :style="{ backgroundColor: tag.color || '#1976d2' }" />

      <span>{{ tag.name }}</span>
    </QChip>
    <QChip outline clickable class="col-md-2 tags__box tags__box--add" @click="handleAddTag">
      <QIcon name="add" size="20px" />
      <span>افزودن برچسب جدید</span>
    </QChip>
  </div>
  <QInnerLoading v-else-if="loadingList" :showing="loadingList">
    <QSpinnerGears size="50px" color="primary" />
  </QInnerLoading>

  <div v-else class="tags__no-data">
    <span class="text-subtitle1">هنوز برچسبی ایجاد نشده</span>
    <span class="text-subtitle2 text-grey-5 text-center">
      برای دسته بندی و فیلتر کردن بهتر آیتم ها، برچسب های دلخواه
      <br />
      خودت رو اضافه کن
    </span>
    <QChip
      color="primary"
      text-color="white"
      square
      clickable
      class="col-md-2 rounded-borders q-pa-lg text-subtitle1"
      @click="handleAddTag"
    >
      <IconSquareRoundedPlus class="q-ml-sm" />
      <span>افزودن برچسب جدید</span>
    </QChip>
  </div>

  <QDialog v-model="showDialog" persistent>
    <QCard style="min-width: 400px">
      <QCardSection>
        <div class="text-h6">{{ isEditMode ? 'ویرایش برچسب' : 'افزودن برچسب جدید' }}</div>
      </QCardSection>

      <QCardSection class="q-pt-none">
        <QInput
          v-model="tagInfo.name"
          label="نام برچسب"
          outlined
          autofocus
          :rules="[(val) => !!val || 'نام برچسب الزامی است']"
          @keyup.enter="() => handleSaveTag(tagInfo)"
        />
        <div class="q-mt-md">
          <label class="text-subtitle2 q-mb-sm">رنگ برچسب</label>
          <div class="row q-gutter-sm q-mt-xs">
            <QBtn
              v-for="color in colorsList"
              :key="color.color"
              round
              flat
              size="md"
              :class="{ 'color-selected': tagInfo.color === color.color }"
              @click="tagInfo.color = color.color"
            >
              <div class="tags__color-picker" :style="{ backgroundColor: color.color }" />
            </QBtn>
          </div>
        </div>
      </QCardSection>

      <QCardActions align="left" class="text-primary">
        <QBtn flat label="انصراف" :loading="loadingList" @click="closeDialog" />
        <QBtn
          flat
          label="ذخیره"
          :loading="loadingList"
          :disable="!tagInfo.name"
          @click="() => handleSaveTag(tagInfo)"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
<script setup>
import { ref, watch, toRefs, computed, reactive } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import {
  useGetTagsQuery,
  useApiGetSettings,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} from '@/modules/Settings/query/index'
import { IconSquareRoundedPlus } from '@tabler/icons-vue'
import { Notif, confirmDialog } from '@/data/services/notification-service'

const props = defineProps({
  submit: {
    type: Boolean,
    default: false,
  },
  refresh: {
    type: Boolean,
    default: false,
  },
  branchId: {
    type: [String, Number],
    default: undefined,
  },
})
const { refresh } = toRefs(props)
const emits = defineEmits(['afterSubmit', 'afterRefresh'])
const queryClient = useQueryClient()

const { data: tags, isLoading } = useGetTagsQuery()
const { data: colors } = useApiGetSettings('colors')

const showDialog = ref(false)
const tagInfo = reactive({
  id: '',
  name: '',
  color: '',
})
const isEditMode = ref(false)
const currentTagIndex = ref(null)

const tagList = computed(() => {
  return tags.value?.items || []
})

const colorsList = computed(
  () =>
    colors.value?.colors?.map((color) => {
      return { name: color?.name, color: color?.hex }
    }) || []
)
const refreshData = () => {
  queryClient.invalidateQueries({ queryKey: ['tags', 'all-tags'] })
  Notif.success('لیست بروزرسانی شد')
}

const closeDialog = () => {
  showDialog.value = false
  tagInfo.id = null
  tagInfo.name = null
  tagInfo.color = '#1976d2'
  isEditMode.value = false
}

const handleAddTag = () => {
  isEditMode.value = false

  currentTagIndex.value = null
  showDialog.value = true
}

const handleEditTag = (tag) => {
  isEditMode.value = true
  tagInfo.id = tag.id ?? null
  tagInfo.name = tag.name
  tagInfo.color = tag.color || '$primary'

  showDialog.value = true
}

const { mutate: saveTag, isPending: createTagLoading } = useCreateTagMutation()
const { mutate: updateTag, isPending: updateTagLoading } = useUpdateTagMutation()
const { mutate: deleteTag, isPending: deleteTagLoading } = useDeleteTagMutation()

const loadingList = computed(
  () =>
    createTagLoading.value || updateTagLoading.value || deleteTagLoading.value || isLoading.value
)
const handleRemoveTag = (id) => {
  confirmDialog(
    'حذف برچسب',
    'آیا از حذف این برچسب اطمینان دارید؟',
    () => {
      deleteTag(id, {
        onSuccess: (response) => {
          Notif.success(response.message)
          refreshData()
        },
      })
    },
    {
      cancel: {
        label: 'انصراف',
        flat: true,
      },
      ok: {
        label: 'حذف',
        flat: true,
        color: 'negative',
      },
      persistent: true,
    }
  )
}

const handleSaveTag = () => {
  if (!tagInfo.name) return
  const data = {
    name: tagInfo.name,
    color: tagInfo.color,
  }

  if (tagInfo.id) {
    updateTag(
      { id: tagInfo.id, ...data },
      {
        onSuccess: (response) => {
          Notif.success(response.message || 'عملیات موفقیت آمیز بود')
          refreshData()
          closeDialog()
        },
      }
    )
  } else {
    saveTag(
      { ...data },
      {
        onSuccess: (response) => {
          Notif.success(response.message || 'عملیات موفقیت آمیز بود')
          refreshData()
          closeDialog()
        },
      }
    )
  }
}

watch(
  () => refresh.value,
  (value) => {
    if (value) {
      refreshData()
      emits('afterRefresh')
    }
  }
)
</script>
<style scoped lang="scss">
.tags {
  margin-top: 1rem;
  display: flex;
  gap: 4px;
  flex-grow: 1;
  justify-content: start;
  align-items: center;
  flex-wrap: wrap;
  &__box {
    border: 1px solid $grey-6;
    padding: 1.2rem 1rem;
    display: flex !important;
    min-width: 215px;
    font-size: 12px;
    border-radius: 6px;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: $primary;
      background-color: rgba($primary, 0.05);
    }

    &--add {
      border-style: dashed;
      border-color: $grey-5;
      color: $grey-7;

      &:hover {
        border-color: $primary;
        color: $primary;
        background-color: rgba($primary, 0.05);
      }
    }
  }
  &__dot-wrapper {
    margin-left: 5px;
    padding: 0;
    min-width: auto;
  }

  &__dot {
    width: 20px;
    height: 20px;
    margin-left: 10px;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }
    &-items {
      padding: 0 !important;
    }
  }

  &__color-option {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid transparent;
  }

  &__color-picker {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid transparent;
  }

  &__no-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
}

.color-selected {
  .tags__color-picker {
    border: 2px solid $primary;
    box-shadow: 0 0 0 2px rgba($primary, 0.2);
  }
}
</style>
