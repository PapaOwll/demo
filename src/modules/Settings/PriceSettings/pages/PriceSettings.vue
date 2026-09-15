<template>
  <div class="psd">
    <Typography variant="heading" size="h5">محاسبه هزینه</Typography>
    <div class="flex justify-end items-end q-gutter-sm">
      <Button
        v-if="showButton"
        is-icon-only
        is-rounded
        variant="outline"
        aria-label="بارگذاری مجدد"
        :is-loading="isPendingList || isLoading"
        :left-icon="IconRefresh"
        @click="refresh"
      />
      <Button
        v-if="showButton"
        type="button"
        :is-loading="isPendingList || isLoading"
        text="ذخیره تنظیمات"
        @click="saveSetting"
      />
    </div>
    <QSplitter v-model="splitterModel" separator-class="bg-white" class="psd__serves">
      <template #before>
        <QTabs v-model="activeTab" vertical indicator-color="transparent" class="psd__serves-tab">
          <QScrollArea class="psd__serves-scroll" :thumb-style="thumbStyle" :bar-style="barStyle">
            <QTab
              v-for="(serve, index) of allTabs"
              :key="serve.id"
              :name="index"
              :label="serve.title"
              class="psd__serves-tab-item"
              :class="{ 'active-tab': activeTab === index }"
            />
          </QScrollArea>
        </QTabs>
      </template>
      <template #after>
        <QTabPanels v-model="activeTab" animated vertical class="psd__serves-panel">
          <QTabPanel v-for="(tab, index) of allTabs" :key="index" :name="index">
            <QScrollArea
              :thumb-style="{ width: 0 }"
              :bar-style="{ width: 0 }"
              style="height: 75dvh; width: 100%"
            >
              <div class="row">
                <Button
                  v-if="getPerms('setting', 'add', true, 'pricing') && !tab.component"
                  variant="outline"
                  color="green"
                  type="button"
                  class="q-mb-md"
                  :left-icon="IconPencilPlus"
                  text="افزودن عنوان"
                  @click="() => openQuestionForm(tab, null)"
                />
              </div>

              <div
                v-for="(question, qIndex) in tab.questions"
                :key="qIndex"
                class="q-mb-lg q-pr-md"
              >
                <QuestionHeader
                  :question="question"
                  @edit="() => openQuestionForm(tab, question)"
                  @delete="() => deleteQuestion(question)"
                />

                <QuestionTypeFactory
                  :question="question"
                  :question-index="qIndex"
                  @delete-item="deleteQuestionItem"
                  @add-item="() => addItem(question)"
                  @update-item="handleChange"
                  @items-changed="handleItemsChanged"
                />
              </div>

              <Component :is="tab.component" v-if="tab.component" />
            </QScrollArea>
          </QTabPanel>
        </QTabPanels>
      </template>
      <QInnerLoading :showing="isPendingList">
        <QSpinnerGears color="primary" size="48px" />
      </QInnerLoading>
    </QSplitter>
  </div>

  <QuestionForm
    :visible="questionFormDialog"
    :edit-value="selectedServeData"
    @update-table="refresh"
    @close="closeQuestionForm"
  />
</template>

<script setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import QuestionForm from '@/modules/Settings/PriceSettings/components/QuestionForm'
import { getPerms } from '@/utils/get-perms'
import {
  useApiGetServes,
  useDeleteQuestionItemMutation,
  useDeleteQuestionMutation,
  useUpdateQuestionItemMutation,
} from '@/modules/Settings/query'
import { useQueryClient } from '@tanstack/vue-query'
import { handleError } from '@/utils/error-handler'
import { IconPencilPlus, IconRefresh } from '@tabler/icons-vue'
import QuestionTypeFactory from '@/modules/Settings/PriceSettings/components/QuestionTypeFactory'
import QuestionHeader from '@/modules/Settings/PriceSettings/components/QuestionHeader'
import { cloneDeep } from '@/utils/lodash-utils'
import { useQuestionTypes } from '@/composables/use-question-types'
import { useUnsavedChangesGuard } from '@/composables/use-unsave-changes'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import { Notif, confirmDialog } from '@/data/services/notification-service'

const queryClient = useQueryClient()
const questionFormDialog = ref(false)
const hasUnsavedChanges = ref(false)
const selectedServeData = ref(null)
const activeTab = ref(0)
const updatedServesData = ref(null)
const splitterModel = ref(15)

const barStyle = {
  borderRadius: '9px',
  backgroundColor: '#027be3',
  width: '9px',
  opacity: 0.2,
}

const thumbStyle = {
  borderRadius: '5px',
  backgroundColor: '#027be3',
  width: '5px',
  opacity: 0.75,
}

const { data: allServes, isLoading } = useApiGetServes()
const { prepareItemsForQuestion, handleItemUpdate, processItemsForSave, validateItems } =
  useQuestionTypes()

const serveData = computed(() => updatedServesData.value || allServes.value?.items || [])

const selectedServeQuestions = computed(() => updatedServesData.value?.[activeTab.value])

const allTabs = computed(() => [
  ...serveData.value,
  {
    name: -1,
    title: 'تنظیمات اقساط',
    component: defineAsyncComponent(() => import('../components/InstallmentSetting')),
  },
  {
    name: -2,
    title: 'تنظیمات  VIP',
    component: defineAsyncComponent(() => import('../components/AutoVipSetting')),
  },
  {
    name: -3,
    title: 'تنظیمات تخفیف و بیعانه',
    component: defineAsyncComponent(() => import('../components/DiscountSetting')),
  },
])

const showButton = computed(() => {
  const hasPermission = getPerms('setting', 'add', true, 'pricing')
  const currentTab = allTabs.value[activeTab.value]
  const isServeDataTab = currentTab && !currentTab.component
  return hasPermission && isServeDataTab
})

const refresh = async () => {
  await queryClient.invalidateQueries({ queryKey: ['serves'] })
  hasUnsavedChanges.value = false
  Notif.success('لیست بروزرسانی شد')
}

const openQuestionForm = (serve, question) => {
  selectedServeData.value = { serve, question }
  questionFormDialog.value = true
}

const closeQuestionForm = () => {
  selectedServeData.value = null
  questionFormDialog.value = false
}

const markChanged = () => {
  hasUnsavedChanges.value = true
}

const addItem = (question) => {
  const newItem = {
    title: '',
    price: 0,
    isActive: true,
    isPublic: true,
    serveIndustryId: question.serveIndustryId,
    serveIndustryQuestionId: question.id,
  }
  markChanged()
  updatedServesData.value = updatedServesData.value.map((serve) => {
    const qIndex = serve.questions.findIndex((q_) => q_.id === question.id)

    if (qIndex !== -1) {
      const oldItems = serve.questions[qIndex].items || []

      const updatedQuestions = [...serve.questions]
      updatedQuestions[qIndex] = {
        ...updatedQuestions[qIndex],
        items: [...oldItems, newItem],
      }

      return {
        ...serve,
        questions: updatedQuestions,
      }
    }

    return serve
  })
}

const handleChange = (updateData) => {
  const { questionIndex, itemIndex, items } = updateData
  const serve = updatedServesData.value[activeTab.value]

  if (!serve || !serve.questions || !serve.questions[questionIndex]) {
    return
  }

  const question = serve.questions[questionIndex]

  if (items && Array.isArray(items)) {
    serve.questions[questionIndex] = {
      ...question,
      items: [...items],
    }
  } else if (question.items && question.items[itemIndex]) {
    const currentItems = [...question.items]

    const updatedItems = handleItemUpdate(currentItems, updateData, question.type)

    serve.questions[questionIndex] = {
      ...question,
      items: updatedItems,
    }
  }

  markChanged()
}

const handleItemsChanged = (data) => {
  const { questionIndex, items } = data
  const serve = updatedServesData.value[activeTab.value]

  if (serve && serve.questions && serve.questions[questionIndex]) {
    serve.questions[questionIndex] = {
      ...serve.questions[questionIndex],
      items: [...items],
    }
    markChanged()
  }
}

const { mutate: deleteServeItem, isPending: deleteServeItemPending } =
  useDeleteQuestionItemMutation()
const { mutate: deleteQuestions, isPending: deleteQuestionPending } = useDeleteQuestionMutation()

const deleteQuestion = (question) => {
  confirmDialog(
    'حذف عنوان!',
    'با حذف عنوان تمامی آیتم ها نیز پاک خواهند شد. آیا از حذف اطمینان دارید؟',
    () => {
      deleteQuestions(question.id, {
        onSuccess: (response) => {
          queryClient.invalidateQueries({ queryKey: ['serves'] })
          Notif.success(response.message)
        },
      })
    },
    {
      ok: {
        label: 'تایید',
        color: 'primary',
        flat: true,
      },
      cancel: {
        label: 'انصراف',
        color: 'negative',
        flat: true,
      },
      persistent: true,
    }
  )
}

const deleteQuestionItem = (questionItem) => {
  if (questionItem.serve && questionItem.serve.id) {
    confirmDialog(
      'توجه!',
      `آیا از حذف آیتم مورد نظر اطمینان دارید؟`,
      () => {
        deleteServeItem(
          {
            serveId: questionItem?.serve?.serveIndustryId,
            serveItemId: questionItem?.serve?.id,
          },
          {
            onSuccess: async (response) => {
              // Call the removeFromUI callback to update the UI
              if (questionItem.removeFromUI) {
                questionItem.removeFromUI()
              }
              await refresh()
              Notif.success(response.message)
            },
            onError: (error) => {
              handleError(error)
            },
          }
        )
      },
      {
        ok: {
          label: 'تایید',
          color: 'primary',
          flat: true,
        },
        cancel: {
          label: 'انصراف',
          color: 'negative',
          flat: true,
        },
        persistent: true,
      }
    )
  } else {
    // For new items that haven't been saved to server yet
    confirmDialog(
      'توجه!',
      `آیا از حذف آیتم مورد نظر اطمینان دارید؟`,
      () => {
        // Remove from local state and call UI callback
        const serve = updatedServesData.value[activeTab.value]
        const question = serve?.questions?.[questionItem.questionIndex]
        if (question?.items) {
          question.items = question.items.filter((_, idx) => idx !== questionItem.itemIndex)
          markChanged()
        }

        // Also call the removeFromUI callback to sync with the component
        if (questionItem.removeFromUI) {
          questionItem.removeFromUI()
        }
      },
      {
        ok: {
          label: 'تایید',
          color: 'primary',
          flat: true,
        },
        cancel: {
          label: 'انصراف',
          color: 'negative',
          flat: true,
        },
        persistent: true,
      }
    )
  }
}

const { mutate: updateServeItem, isPending: updateServeItemPending } =
  useUpdateQuestionItemMutation()

const validateBeforeSave = () => {
  let invalid = false

  updatedServesData.value.some((serve) => {
    return serve.questions.some((question) => {
      if (!validateItems(question.items, question.type)) {
        Notif.error(`سوال "${question.title}" دارای آیتم‌های نامعتبر است`)
        invalid = true
        return true
      }

      return question.items.some((item) => {
        if (!item.title?.toString().trim()) {
          Notif.error('عنوان نمی‌تواند خالی باشد')
          invalid = true
          return true
        }
        if (item.price < 0) {
          Notif.error('قیمت نمی‌تواند منفی باشد')
          invalid = true
          return true
        }
        return false
      })
    })
  })

  return !invalid
}

const saveSetting = () => {
  if (!validateBeforeSave()) return
  selectedServeQuestions.value?.questions?.forEach((el) => {
    return processItemsForSave(el)
  })
  if (selectedServeQuestions.value?.id) {
    updateServeItem(
      { id: selectedServeQuestions.value.id, ...selectedServeQuestions.value },
      {
        onSuccess: async (response) => {
          await refresh()
          Notif.success(response.message)
        },
      }
    )
  }
}
const isPendingList = computed(
  () => deleteServeItemPending.value || deleteQuestionPending.value || updateServeItemPending.value
)

watch(
  allServes,
  (val) => {
    if (val?.items) {
      const preparedData = val.items.map((serve) => ({
        ...serve,
        questions: serve.questions.map((question) => ({
          ...question,
          items: prepareItemsForQuestion(question),
        })),
      }))

      updatedServesData.value = cloneDeep(preparedData)
    }
  },
  { immediate: true }
)
useUnsavedChangesGuard(hasUnsavedChanges)

watch(
  () => activeTab.value,
  (val) => {
    if (!val) return
    markChanged()
  }
)
</script>

<style scoped lang="scss">
.psd {
  width: 100%;
  padding: $spacing-2xl;
  &__serves {
    margin-top: $spacing-lg;
    width: 100%;
    border: 1px solid $default-border;
    border-radius: $radius-lg;
    &-tab {
      background: $grey-2;
      height: 100%;
      &-item {
        //margin: 10px;
        padding: $spacing-md;
        justify-content: start;
        align-items: center;
      }
    }
    &-scroll {
      height: 80dvh;
      width: 100%;
      position: relative;
    }
    &-panel {
      padding: $spacing-md;
    }
  }
}

.price-setting-card {
  margin: auto;
  width: 1100px;
  max-width: 80dvw;
  border-radius: 8px;
}

.active-tab {
  background-color: $light-blue-light-hover;
  color: $light-blue-filled;
  border: 1px solid $primary-filled;
  border-radius: $radius-sm;
  margin: $spacing-md;
  padding: 0 $spacing-md;
}
</style>
