<template>
  <div class="relative-position">
    <QForm @submit.prevent="saveData">
      <QScrollArea class="scroll-area" :thumb-style="{ width: '0' }">
        <QExpansionItem v-for="(item, index) in form.messages" :key="index" class="item" popup>
          <template #header>
            <div class="item__label">
              <QCheckbox v-model="item.autoSend" class="q-mt-sm" />
              <span class="text-body2">{{ item.title }}</span>
            </div>
          </template>
          <template #default>
            <span class="item__info">
              <IconInfoCircle size="20px" />
              {{ item.info }}
            </span>
            <div class="row justify-center items-center">
              <div class="col-10 q-my-md">
                <QInput
                  :ref="(el) => setInputRef(el, index)"
                  v-model="item.message"
                  outlined
                  clearable
                  clear-icon="clear"
                  rows="9"
                  type="textarea"
                />
              </div>
              <div class="col-12">
                <QChip
                  v-for="(tag, tagIndex) in bookingDueMsg"
                  id="tag"
                  :key="tagIndex"
                  clickable
                  class="q-mx-xs"
                  color="primary"
                  outline
                  @click="handleAddTagToInput(tag.value, item, index)"
                >
                  {{ tag.title }}
                </QChip>
              </div>
            </div>
          </template>
        </QExpansionItem>
      </QScrollArea>
    </QForm>

    <QInnerLoading :showing="isLoading || isFetching || isPending">
      <QSpinnerTail color="primary" size="2em" />
    </QInnerLoading>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, toRaw, toRefs, watch } from 'vue'
import { bookingDueMsg } from '@/modules/Settings/GeneralSettings/enums/enums'
import { useApiGetSettings, useApiSaveSetting } from '@/modules/Settings'
import { useInsertTag } from '@/composables/handle-message-params'
import { IconInfoCircle } from '@tabler/icons-vue'
import { Notif } from '@/data/services/notification-service'

const props = defineProps(['submit', 'refresh'])
const { submit, refresh } = toRefs(props)
const emits = defineEmits(['afterSubmit', 'afterRefresh'])
const form = ref({
  messages: {},
})
const inputRefs = ref([])

const {
  data: messages,
  isLoading,
  isFetching,
  refetch: getMessages,
} = useApiGetSettings('messages')

const initialData = computed(() => messages.value)

const { mutate, isPending } = useApiSaveSetting('messages', {
  requestOptions: { hadSnakize: false },
})
const setInputRef = (el, index) => {
  if (el) {
    inputRefs.value[index] = el
  }
}
const { insertTag } = useInsertTag(inputRefs)
const handleAddTagToInput = (value, item, index) => {
  insertTag(value, item, index, inputRefs)
}

const saveData = () => {
  const body = form.value
  mutate(
    { body, key: 'messages' },
    {
      onSuccess: (response) => {
        Notif.success(response.message)
      },
    }
  )
  emits('afterSubmit')
}

watch(
  () => submit.value,
  async (value) => {
    if (value) saveData()
  }
)
watch(
  () => refresh.value,
  (value) => {
    if (value) {
      getMessages()
      emits('afterRefresh')
    }
  }
)
watch(
  initialData,
  (newData) => {
    if (newData) {
      form.value.messages = toRaw(newData)
    }
  },
  { immediate: true }
)
onMounted(() => {
  form.value.messages = toRaw(initialData.value)
})
</script>

<style scoped lang="scss">
.float-right-checkbox {
  .el-checkbox {
    float: right;
    margin-right: 0;
    margin-top: 14px;
  }
}

.item {
  &__label {
    display: flex;
    justify-content: start;
    align-items: center;
    width: 100%;
  }

  &__info {
    color: $grey-8;
    font-size: 14px;
    margin-right: 4rem;
  }
}

.scroll-area {
  height: 60dvh;
}
</style>
