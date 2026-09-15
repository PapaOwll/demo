<template>
  <div class="relative-position">
    <div class="row justify-end items-center">
      <QBtn
        color="primary"
        square
        flat
        :disable="isPending || isLoading || isFetching"
        @click="addNewMessage"
      >
        <IconPlus size="16px" />
        افزودن پیام جدید
      </QBtn>
    </div>
    <QForm @submit.prevent="saveData">
      <QScrollArea class="scroll-area" :thumb-style="{ width: '0' }">
        <QExpansionItem
          v-for="(item, index) in messagesArray"
          :key="item.id"
          class="item"
          :class="{ 'item--expanded': item.expanded }"
          @show="setExpanded(index, true)"
          @hide="setExpanded(index, false)"
        >
          <template #header>
            <div class="item__header">
              <div class="item__header-section">
                <QAvatar
                  v-if="!item.isEditing"
                  color="white"
                  square
                  text-color="grey"
                  class="rounded-borders"
                >
                  <IconClipboardText />
                </QAvatar>
                <div class="item__header-section--title">
                  <Typography v-if="!item.isEditing" variant="caption" color="grey" size="4">
                    عنوان پیام
                  </Typography>
                  <QInput
                    v-if="item.isEditing"
                    v-model="item.title"
                    outlined
                    label="عنوان پیام"
                    class="edit-input"
                    @click.stop
                    @update:model-value="updateMessage(index)"
                  />
                  <Typography v-else variant="body" size="3" color="grey">
                    {{ item.title || ' پیام جدید' }}
                  </Typography>
                </div>
              </div>
              <div class="item__header-actions">
                <Button
                  v-if="item.isEditing"
                  variant="outline"
                  color="light-blue"
                  type="button"
                  text="ذخیره"
                  @click.stop="toggleEdit(index)"
                />
                <Button
                  v-else
                  variant="flat"
                  is-icon-only
                  :left-icon="IconPencil"
                  color="blue"
                  size="lg"
                  type="button"
                  @click.stop="toggleEdit(index)"
                />
                <Button
                  variant="flat"
                  is-icon-only
                  :left-icon="IconTrash"
                  color="red"
                  size="lg"
                  type="button"
                  @click.stop="removeMessage(index)"
                />
              </div>
            </div>
          </template>
          <template #default>
            <div class="item__content row items-center q-col-gutter-sm">
              <div class="col-md-10">
                <Typography variant="caption" color="grey" size="4" class="q-mt-xs">
                  توضیحات پیام
                </Typography>
                <QInput
                  v-model="item.info"
                  outlined
                  class="edit-input"
                  type="textarea"
                  rows="3"
                  :disable="!item.isEditing"
                  @click.stop
                  @update:model-value="updateMessage(index)"
                />
              </div>
              <div class="col-md-2 column items-start justify-between q-gutter-sm">
                <Typography variant="body" size="3" color="dark">ارسال پیام در</Typography>
                <QBtnGroup class="q-gutter-sm" unelevated>
                  <QBtn
                    square
                    class="q-pa-sm"
                    :disable="!item.isEditing"
                    :flat="!isSelected(item.channels, 'telegram')"
                    :outline="!!isSelected(item.channels, 'telegram')"
                    :color="isSelected(item.channels, 'telegram') ? undefined : 'blue-8'"
                    :class="isSelected(item.channels, 'telegram') && 'chips-primary'"
                    @click="updateAvailableChannels('telegram', index)"
                  >
                    <IconBrandTelegram size="24px" />
                  </QBtn>
                  <QBtn
                    square
                    class="q-pa-sm"
                    :disable="!item.isEditing"
                    :flat="!isSelected(item.channels, 'whatsapp')"
                    :outline="!!isSelected(item.channels, 'whatsapp')"
                    :color="isSelected(item.channels, 'whatsapp') ? undefined : 'green-8'"
                    :class="isSelected(item.channels, 'whatsapp') && 'chips-success'"
                    @click="updateAvailableChannels('whatsapp', index)"
                  >
                    <IconBrandWhatsapp size="24px" />
                  </QBtn>
                  <QBtn
                    square
                    class="q-pa-sm"
                    :disable="!item.isEditing"
                    :flat="!isSelected(item.channels, 'sms')"
                    :outline="!!isSelected(item.channels, 'sms')"
                    :color="isSelected(item.channels, 'sms') ? undefined : 'grey-8'"
                    :class="isSelected(item.channels, 'sms') && 'chips-info'"
                    @click="updateAvailableChannels('sms', index)"
                  >
                    <IconMessage size="24px" />
                  </QBtn>
                </QBtnGroup>
              </div>
              <div class="col-md-12">
                <QInput
                  :ref="(el) => setInputRef(el, index)"
                  v-model="messagesArray[index].message"
                  :model-value="item.message"
                  rows="5"
                  outlined
                  type="textarea"
                  class="message-input"
                  :disable="!item.isEditing"
                  @update:model-value="updateMessage(index)"
                />
              </div>
            </div>
            <div v-if="item.isEditing" class="row">
              <ul>
                <QChip
                  v-for="(tag, tagIndex) in quickMessageTag"
                  :key="tagIndex"
                  clickable
                  outline
                  text-color="blue-6"
                  class="q-ma-xs cursor-pointer"
                  @click="handleAddTagToInput(tag.value, item, index)"
                >
                  {{ tag.title }}
                </QChip>
                <QChip
                  :key="index"
                  clickable
                  style="cursor: pointer"
                  outline
                  color="warning"
                  type="warning"
                  @click="handleAddTagToInput('%0A', item, index, false)"
                >
                  سر خط↪
                </QChip>
              </ul>
            </div>
          </template>
        </QExpansionItem>
      </QScrollArea>
    </QForm>

    <QInnerLoading :showing="isPending || isLoading || isFetching">
      <QSpinnerTail color="primary" size="2em" />
    </QInnerLoading>
  </div>
</template>

<script setup>
import { ref, watch, toRaw, toRefs, onMounted } from 'vue'
import { useApiGetSettings, useApiSaveSetting } from '@/modules/Settings'
import {
  IconPlus,
  IconMessage,
  IconBrandWhatsapp,
  IconBrandTelegram,
  IconPencil,
  IconTrash,
  IconClipboardText,
} from '@tabler/icons-vue'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import { quickMessageTag } from '@/modules/Settings/GeneralSettings/enums/enums'
import { useInsertTag } from '@/composables/handle-message-params'
import { Notif, confirmDialog } from '@/data/services/notification-service'

const SETTING_KEY = 'quickMessages'
const props = defineProps(['submit', 'refresh'])
const { submit, refresh } = toRefs(props)
const emits = defineEmits(['afterSubmit', 'afterRefresh'])
const inputRefs = ref([])
const messagesObject = ref({
  messages: {},
})
const messagesArray = ref([])
const {
  data: initialMessages,
  isLoading,
  isFetching,
  refetch: refetchQuickMessages,
} = useApiGetSettings(SETTING_KEY)
const setInputRef = (el, index) => {
  if (el) {
    inputRefs.value[index] = el
  }
}
const { insertTag } = useInsertTag(inputRefs)
const handleAddTagToInput = (value, item, index, hasBracket = true) => {
  insertTag(value, item, index, hasBracket, inputRefs)
}

const removeMessage = (index) => {
  if (String(index)) {
    confirmDialog(
      'حذف پیام فوری',
      'از حذف پیام اطمینان دارید؟',
      () => {
        const { id } = messagesArray.value[index]
        delete messagesObject.value.messages[id]
        messagesArray.value.splice(index, 1)
        Notif.success('پیام حذف شد')
      },
      {
        ok: { label: 'تایید', flat: true, color: 'positive' },
        cancel: { label: 'انصراف', flat: true, color: 'negative' },
      }
    )
  }
}
const updateMessage = (index) => {
  const { id, message, title, info } = messagesArray.value[index]
  messagesObject.value.messages[id] = { message, title, info }
}

const updateAvailableChannels = (channelName, index) => {
  const { id, message, title, info } = messagesArray.value[index]
  const { channels } = messagesArray.value[index]
  const channelArray = Array.isArray(channels) ? channels : ['sms', 'telegram', 'whatsapp']
  const newChannels = channelArray?.includes(channelName)
    ? channelArray.filter((val) => channelName !== val)
    : [...channels, channelName]
  messagesObject.value.messages[id] = { message, title, info, channels: newChannels }
  messagesArray.value[index] = { ...messagesArray.value[index], channels: newChannels }
}

const addNewMessage = () => {
  // Ensure messagesObject is initialized
  if (!messagesObject.value.messages) {
    messagesObject.value.messages = {}
  }
  const existingKeys = Object.keys(messagesObject.value.messages)
  const maxNum = existingKeys.reduce((max, key) => {
    const num = Number.parseInt(key.replace('msg', ''), 10)
    return !Number.isNaN(num) && num > max ? num : max
  }, 0)
  const newId = `msg${maxNum + 1}`
  const newMessage = {
    id: newId,
    message: '',
    title: '',
    info: '',
    isEditing: true,
    expanded: false,
  }
  messagesObject.value.messages[newId] = { message: '', title: '', info: '' }
  messagesArray.value.unshift(newMessage)
}
const toggleEdit = (index) => {
  if (messagesArray.value[index].isEditing) {
    updateMessage(index)
  }
  messagesArray.value[index].isEditing = !messagesArray.value[index].isEditing
}

const { mutate, isPending } = useApiSaveSetting(SETTING_KEY)

const saveData = () => {
  const { messages } = toRaw(messagesObject.value)
  mutate(
    { body: { messages }, key: 'quickMessages' },
    {
      onSuccess: (response) => {
        Notif.success(response.message)
        refetchQuickMessages()
      },
    }
  )
  emits('afterSubmit')
}
watch(
  () => submit.value,
  (value) => {
    if (value) saveData()
  }
)
watch(
  () => refresh.value,
  (value) => {
    if (value) {
      refetchQuickMessages()
      emits('afterRefresh')
    }
  }
)

watch(
  initialMessages,
  (newData) => {
    if (newData) {
      messagesObject.value.messages = toRaw(newData)
      messagesArray.value = Object.entries(newData).map(([id, msg]) => {
        return {
          id,
          ...msg,
          isEditing: false,
          expanded: false,
        }
      })
    }
  },
  { immediate: true }
)

const isSelected = (channels, key) => {
  if (!channels) return true
  return channels?.includes(key)
}

const setExpanded = (index, value) => {
  const item = messagesArray.value[index]
  if (item) {
    item.expanded = value
  }
}
onMounted(() => {
  messagesObject.value.messages = toRaw(initialMessages.value)
  messagesArray.value = initialMessages.value
    ? Object.entries(initialMessages.value).map(([id, msg]) => {
        return {
          id,
          ...msg,
          isEditing: false,
          expanded: false,
        }
      })
    : []
})
</script>

<style lang="scss" scoped>
:deep(.el-input__inner) {
  padding: 5px 15px;
}

.message-input {
  width: 100%;
  margin: 1rem 0;
}

.edit-input {
  width: 100%;
  :deep(.q-field__control) {
    background-color: white !important;
    border-radius: 8px !important;
  }
  &__disabled {
    background-color: $grey-2;
    border: 1px solid $grey-3;
    border-radius: 8px;
    padding: 24px;
  }
}

.scroll-area {
  height: 60dvh;
}
:deep(.q-expansion-item--popup > .q-expansion-item__container) {
  border: none !important;
  border-radius: 8px !important;
}
:deep(.q-item) {
  width: 100%;
  display: flex !important;
  justify-content: space-between;
}
:deep(.q-item:hover, .q-hoverable:hover) {
  .q-focus-helper {
    background: none !important;
    border-radius: 8px !important;
  }
}
.item {
  transition: all 0.7s ease;
  padding: 24px;
  background-color: $grey-1;
  border: 1px solid $grey-4;
  margin-bottom: 20px;
  border-radius: 8px;

  &__header {
    width: 100%;
    display: flex !important;
    align-items: center;
    justify-content: space-between !important;
    &-section {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;

      &--title {
        width: 80%;
        display: flex;
        flex-direction: column;
      }
    }
    &-actions {
      display: flex;
      align-items: center;
    }
  }
  &__label {
    display: flex;
    justify-content: start;
    align-items: center;
    width: 100%;
  }

  &__content {
    margin-top: 12px;
    padding: 0 24px;
  }

  &__info {
    color: $grey-8;
    font-size: 14px;
    margin-right: 4rem;
  }
}
.item:not(.item--expanded):hover {
  transition: all 0.7s ease;
  border: 1px solid $grey-8;
}
</style>
