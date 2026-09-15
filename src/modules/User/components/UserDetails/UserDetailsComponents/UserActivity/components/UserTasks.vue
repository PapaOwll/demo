<template>
  <div class="flex justify-end">
    <QBtn flat color="primary" label="تازه سازی لیست" @click="refetch" />
  </div>
  <div v-if="userTasksData?.length > 0" class="activity-card-container">
    <QInfiniteScroll :offset="0" :scroll-target="scrollTargetRef" @load="loadNextPage">
      <template #loading>
        <div class="row justify-center q-my-md">
          <template v-if="isFetchingNextPage">
            <QSpinnerDots color="primary" size="lg" />
          </template>
        </div>
      </template>
      <QTimeline color="blue-grey-3">
        <QTimelineEntry
          v-for="(task, index) in userTasksData"
          :key="index"
          :subtitle="convertToJalali(task.dueDate)"
        >
          <div>
            <ActivityCard>
              <template #title>
                <div class="row items-end q-gutter-xs q-pa-sm">
                  <QAvatar
                    square
                    class="rounded-borders"
                    :color="taskStatus[index].iconColor"
                    :text-color="taskStatus[index].iconTextColor"
                  >
                    <IconClipboard size="24" />
                  </QAvatar>
                  <div class="flex column">
                    <span>{{ task.title }}</span>
                    <span>{{ formatDate(task.dueDate, 'HH:mm') }}</span>
                  </div>
                </div>
              </template>
              <template #actions>
                <div class="flex q-gutter-xs">
                  <QBtn
                    v-if="task.status === 2"
                    color="primary"
                    class="q-px-lg"
                    rounded
                    label="اتمام وظیفه"
                    @click="() => openTaskForm(task)"
                  />
                  <QBtn
                    v-if="task.status === 2"
                    color="negative"
                    outline
                    class="q-px-lg"
                    rounded
                    label="حذف وظیفه"
                    @click="() => deleteTask(task.id)"
                  />
                  <QBtn v-if="task.status === 2" flat round @click="() => openTaskForm(task)">
                    <IconPencil />
                  </QBtn>
                  <QChip
                    v-if="task.status === 1"
                    outline
                    square
                    class="chips-success q-ml-md"
                    label="انجام شد"
                  />
                </div>
              </template>
              <template #right-content>
                <QCard flat class="details-box">
                  <div class="row justify-between text-body1">
                    <div class="col-md-6 col-auto flex column">
                      <span class="text-grey">مسئول</span>
                      <span class="text-body1">{{ task.assigneeName }}</span>
                    </div>
                    <div class="col-md-6 col-auto flex column">
                      <span class="text-grey">ایجاد کننده</span>
                      <span class="text-body1">{{ task.createdBy }}</span>
                    </div>
                  </div>
                  <QSeparator spaced color="grey" />
                  <div class="row justify-between text-body1">
                    <div class="col-md-6 col-auto flex column">
                      <span class="text-grey text-bold">تاریخ سررسید</span>
                      <span>{{ convertToJalali(task.dueDate) }}</span>
                    </div>
                    <div class="col-md-6 col-auto flex column">
                      <span class="text-grey text-bold">اولویت</span>
                      <QChip
                        outline
                        square
                        class="chips-warning priority-chips"
                        :label="task.taskPriority[0]?.title"
                      />
                    </div>
                  </div>
                </QCard>
              </template>
              <template #left-content>
                <QCard flat class="details-box">
                  <p v-if="task.description" class="text-body2 text-bold q-ma-none text-grey">
                    توضیحات
                  </p>
                  <div v-if="task.description" class="q-pa-xs text-body2 text-grey-9">
                    {{ task.description }}
                  </div>
                  <div v-else class="row column justify-center items-center">
                    <IconInfoCircle
                      stroke="{1}"
                      class="exclamation-mark"
                      color="silver"
                      size="48"
                    />
                    <span class="text-body2">توضیحی برای این وظیفه ننوشتی</span>
                    <QBtn
                      class="q-mt-sm"
                      rounded
                      outline
                      color="primary"
                      @click="openTaskForm(task)"
                    >
                      افزودن توضیحات
                    </QBtn>
                  </div>
                </QCard>
              </template>
            </ActivityCard>
          </div>
        </QTimelineEntry>
      </QTimeline>
      <div v-if="!hasNextPage" class="row justify-center text-caption text-grey">
        اطلاعات دیگری جهت نمایش وجود ندارد
      </div>
    </QInfiniteScroll>
  </div>
  <div v-else class="row column items-center q-mt-xl full-width full-height text-h5">
    <QInnerLoading :showing="isLoading || isPending" class="q-mx-auto q-my-auto">
      <QSpinnerTail color="primary" size="50px" />
    </QInnerLoading>
    <img src="@/assets/images/noData.svg" alt="noData" class="q-mt-xl" />
    <span>اطلاعاتی وجود ندارد</span>
  </div>
  <TaskForm :visible="taskModalVisible" :edit-value="taskData" @close="toggleTaskModal" />
</template>

<script setup>
import { computed, ref, defineAsyncComponent, watchEffect } from 'vue'
import { useTaskInfinityQuery } from '@/modules/Task'
import { convertToJalali, formatDate } from '@/utils/date-utils'
import { IconClipboard, IconInfoCircle, IconPencil } from '@tabler/icons-vue'
import useDisclosure from '@/composables/use-disclosure'
import TaskForm from '@/modules/Task/components/TaskForm'
import { useApiDeleteTask } from '@/modules/Task/query'
import { useQueryClient } from '@tanstack/vue-query'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import { useGetEnumsQuery } from '@/modules/User/query'

const ActivityCard = defineAsyncComponent(
  () =>
    import('@/modules/User/components/UserDetails/UserDetailsComponents/UserActivity/components/ActivityCard')
)

const queryClient = useQueryClient()
const props = defineProps({
  // eslint-disable-next-line vue/require-default-prop
  propData: Number,
})
const filters = ref({
  'filter[user_id]': props.propData,
  sort: '-due_date',
})

const scrollTargetRef = ref(null)
const taskData = ref(null)
const priorityEnum = ref('TaskPriorityEnum')
const enabled = computed(() => !!props.propData)
const {
  data: tasksData,
  isLoading,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
  refetch,
} = useTaskInfinityQuery(filters, { enabled })
const { data: taskPriorityEnums } = useGetEnumsQuery(priorityEnum)
const taskEnums = computed(() =>
  taskPriorityEnums.value
    ? Object.keys(taskPriorityEnums.value).map((it) => ({
        title: taskPriorityEnums.value[it].faTitle,
        id: taskPriorityEnums.value[it].id,
      }))
    : []
)
const userTasksData = computed(() => {
  const pages = tasksData.value?.pages || []
  return pages?.flatMap((pageData) => {
    return pageData.data.items.map((item) => ({
      ...item,
      taskPriority: taskEnums.value?.filter((enums) => enums?.id === item?.priority),
    }))
  })
})
const taskStatus = computed(() =>
  userTasksData.value?.map((item) =>
    item.status === 1
      ? {
          color: 'activity-card_active',
          iconColor: 'green-1',
          iconTextColor: 'positive',
        }
      : item.status === 2
        ? {
            color: 'activity-card_unknown',
            iconColor: 'white',
            iconTextColor: 'secondary',
          }
        : {
            color: 'activity-card_deactivate',
            iconColor: 'red-1',
            iconTextColor: 'negative',
          }
  )
)
const loadNextPage = async (_, done) => {
  if (!hasNextPage.value) {
    done(false)
    return
  }
  await fetchNextPage()
  done()
}
const [taskModalVisible, { toggle: toggleTaskModal }] = useDisclosure()
const openTaskForm = (data) => {
  taskData.value = data
  toggleTaskModal()
}
const updateTable = async () => {
  await queryClient.invalidateQueries({ queryKey: ['task', 'all-tasks'] })
  Notif.success('لیست بروزرسانی شد')
}
const { mutate: deleteUserTask, isPending } = useApiDeleteTask()

const deleteTask = (id) => {
  confirmDialog(
    'توجه!',
    'آیا از حذف این وظیفه اطمیان دارید؟',
    () => {
      deleteUserTask(id, {
        onSuccess: (response) => {
          Notif.success(response.message)
          updateTable()
        },
      })
    },
    {
      ok: {
        label: 'تایید',
        color: 'negative',
        flat: true,
      },
      iconName: 'delete',
      persistent: true,
    }
  )
}

watchEffect(() => props.propData, refetch())
</script>

<style scoped lang="scss">
.priority-chips {
  max-width: 70px !important;
  text-align: center;
  padding: 2px 10px;
}
</style>
