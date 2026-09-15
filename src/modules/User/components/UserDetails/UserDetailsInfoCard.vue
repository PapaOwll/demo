<template>
  <div class="row user-details">
    <div class="row user-details__card-identification">
      <div class="col-md-2 col-12">
        <div class="relative-position">
          <img
            class="user-details__card-identification__avatar"
            :class="{ 'user-details__card-identification__vip': userData?.isVip }"
            :src="userData?.avatar?.path || defaultAvatar"
            alt="عکس پروفایل"
          />
          <span v-if="userData?.isVip" class="user-details__card-identification__vip--badge">
            VIP
          </span>
        </div>
      </div>
      <div class="col-md-9 col-12">
        <div class="row username">
          {{ username }}
          <QTooltip anchor="top middle" self="bottom middle" :offset="[10, 10]">
            {{ username }}
          </QTooltip>
        </div>
        <div class="row user-details__card-identification__national-code">
          <span>
            {{ userData?.isForeignNational ? 'کد فراگیر/ فیدا/ پاسپورت' : 'کد ملی' }}
          </span>
          <div
            class="flex items-center"
            @click="() => copyContactNumber(`${userData?.nationalCode}`)"
          >
            <span>{{ userData?.nationalCode }}</span>
          </div>
        </div>
        <div class="row user-details__card-identification__national-code">
          <span>شناسه کاربر</span>
          <div
            class="row user-details__card-user-id"
            @click="() => copyContactNumber(`${userData?.id}`)"
          >
            <span>{{ userData?.id }}</span>
          </div>
        </div>
      </div>
      <div class="user-details__card-identification__tags col-12 flex items-end">
        <QInnerLoading :showing="saveTagsPending" class="q-mx-auto q-my-auto">
          <QSpinnerBars color="primary" size="xl" />
        </QInnerLoading>
        <QChip
          v-for="tag in userData?.tags || []"
          :key="tag.id"
          class="user-details__card-identification__tag"
          :label="tag.name"
          outline
        />
        <QChip
          icon="add"
          clickable
          color="secondary"
          class="user-details__add-tag"
          text-color="grey-8"
          label=""
          outline
        >
          <QMenu v-model="showTagsDropdown">
            <QList style="min-width: 200px">
              <QInnerLoading :showing="saveTagsPending" class="q-mx-auto q-my-auto">
                <QSpinnerIos color="primary" size="xl" />
              </QInnerLoading>
              <QItem v-for="tag in tagsList" :key="tag.id" clickable @click="toggleUserTag(tag)">
                <QItemSection side>
                  <QCheckbox
                    :model-value="isTagSelected(tag.id)"
                    @update:model-value="toggleUserTag(tag)"
                  />
                </QItemSection>
                <QItemSection>
                  <QItemLabel>{{ tag.name }}</QItemLabel>
                </QItemSection>
                <QItemSection side>
                  <div
                    class="tag-color-indicator"
                    :style="{ backgroundColor: tag.color ?? '#1976d2' }"
                  />
                </QItemSection>
              </QItem>
            </QList>
          </QMenu>
        </QChip>
        <span class="">
          <IconInfoHexagon size="20" />
          <QTooltip class="text-subtitle2 bg-black">
            برای اعمال برچسب های کاربر، تنها کافیست آن ها را انتخاب کنید
          </QTooltip>
        </span>
      </div>
    </div>
    <div class="divider" />
    <div class="row user-details__card-call-section">
      <div
        class="col-md-4 col-12 flex column q-col-gutter-xs"
        @click="() => copyContactNumber(`0${userData?.mobile}`)"
      >
        <span v-if="userData?.mobile" class="border-copy">
          {{ `0${userData?.mobile}` }}
        </span>
        <span v-else>ثبت نشده</span>
        <p>موبایل اول</p>
      </div>
      <div class="col-md-7 flex q-gutter-sm justify-end col-12">
        <QBtn
          color="green-5"
          class="call-action_btn"
          @click="() => makePhoneCall(0 + userData?.mobile)"
        >
          <IconPhone width="20" />
        </QBtn>
      </div>
      <template v-if="userData?.tel">
        <div class="col-md-4 col-12 flex column q-col-gutter-xs">
          <span class="border-copy" @click="() => copyContactNumber(`0${userData?.tel}`)">
            {{ `0${userData?.tel}` }}
          </span>
          <p>موبایل دوم</p>
        </div>
        <div class="col-md-7 flex q-gutter-sm justify-end col-12">
          <QBtn
            color="green-5"
            outline
            class="call-action_btn"
            @click="() => makePhoneCall(0 + userData?.tel)"
          >
            <IconPhone size="20" />
          </QBtn>
        </div>
      </template>
      <template v-if="userData?.landlinePhone">
        <div class="col-md-4 col-12 flex column q-col-gutter-xs">
          <span class="border-copy" @click="() => copyContactNumber(userData?.landlinePhone)">
            {{ userData?.landlinePhone }}
          </span>
          <p>تلفن ثابت</p>
        </div>
        <div class="col-md-7 col-12 flex justify-end q-gutter-sm">
          <QBtn
            outline
            class="call-action_btn"
            color="green-5"
            @click="() => makePhoneCall(userData?.landlinePhone)"
          >
            <IconPhone size="20" />
          </QBtn>
        </div>
      </template>
    </div>
    <div class="divider" />
    <div class="row user-details__card-advisor">
      <div class="advisor__info">
        <div>
          <IconUser class="user-details__card-advisor_icon" size="28" />
          <span>{{ userData?.advisor?.name || ' بدون مشاور' }}</span>
        </div>
        <div class="advisor__info-divider" />
        <span>مشاور</span>
      </div>
      <div class="advisor__info">
        <div>
          <IconUser class="user-details__card-advisor_icon" size="28" />
          <span>{{ userData?.owners?.name || ' بدون مشاور' }}</span>
        </div>
        <div class="advisor__info-divider" />
        <span>مشاور نوبت دهی</span>
      </div>
      <div class="username advisor__info">
        <div>
          <IconUser class="user-details__card-advisor_icon" size="28" />
          <span>
            {{ userData?.roomAdvisors?.map((_rm) => _rm?.name).join(',') || ' بدون مشاور' }}
          </span>
        </div>
        <div class="advisor__info-divider" />
        <span>مشاور اتاق مشاوره</span>
        <QTooltip anchor="top end" self="bottom middle" :offset="[10, 10]">
          <span>
            {{ userData?.roomAdvisors?.map((_rm) => _rm?.name).join(',') || ' بدون مشاور' }}
          </span>
        </QTooltip>
      </div>
    </div>
    <div class="divider" />
    <div class="row user-details__card-send-message">
      <div class="col-md-12 col-12">
        <SelectField
          transition-show="jump-up"
          transition-hide="jump-up"
          :model-value="messageContent"
          :options="quickMessages"
          option-label="title"
          option-value="message"
          variant="outline"
          map-options
          clearable
          palceholder="پیام خود را انتخاب کنید"
          :loading="quickMessagesLoading"
          @popup-show="quickMessagesOpened = true"
          @update:model-value="(e) => handleMessageContent(e)"
        >
          <!-- <template #no-option>اطلاعاتی وجود ندارد</template> -->
          <!-- <template #append>
            <QIcon
              v-if="messageContent.title"
              name="close"
              class="cursor-pointer"
              @click.stop.prevent="() => handleMessageContent(null)"
            />
          </template> -->
          <template #startSection>
            <IconMessage2 class="message-icon" />
          </template>
          <template #option="scope">
            <QItem v-bind="scope.itemProps">
              <QItemSection>
                <QItemLabel>{{ scope.opt.title }}</QItemLabel>
              </QItemSection>
              <QItemSection side>
                <div class="row items-center q-gutter-sm justify-end">
                  <IconCopy size="20" @click="copyDefaultMessage(scope.opt.message)" />
                  <span>
                    <IconProgressAlert size="20" />
                    <QTooltip
                      anchor="bottom middle"
                      :offset="[10, 10]"
                      class="text-body2 bg-black text-white"
                    >
                      {{ scope.opt.info }}
                    </QTooltip>
                  </span>
                </div>
              </QItemSection>
            </QItem>
          </template>
        </SelectField>
      </div>
      <div class="col-md-12 col-12">
        <div>
          <QBtnToggle
            v-model="mobileNumber"
            class="mobile-toggle"
            ttoggle-color="primary"
            color="white"
            text-color="gray-700"
            clearable
            spread
            unelevated
            :options="[
              { label: 'موبایل اول', value: userData?.mobile, disabled: !userData?.mobile },
              { label: 'موبایل دوم', value: userData?.tel, disabled: !userData?.tel },
            ]"
            @update:model-value="(e) => handleMobileNumberChange(e)"
          />
        </div>
        <div class="user-details__card-send-message_social-buttons">
          <QBtn
            flat
            dense
            color="blue-6"
            class="social-button"
            @click="() => sendMessage('telegram')"
          >
            <IconBrandTelegram size="24" />
          </QBtn>
          <QBtn
            flat
            dense
            color="green-6"
            class="social-button"
            @click="() => sendMessage('whatsapp')"
          >
            <IconBrandWhatsappFilled size="24" class="text-color-6" />
          </QBtn>
          <QBtn dense flat color="grey-6" class="social-button" @click="() => sendMessage('sms')">
            <IconMessage size="24" />
          </QBtn>
        </div>
      </div>
    </div>
    <div class="divider" />
    <div class="status-card">
      <!-- <div class="row status-card__header">
        <span>وضعیت و خدمات</span>
      </div> -->
      <div class="row q-col-gutter-sm">
        <div class="status-card__template">
          <div class="col-md-3 col-12 status-card__template-title">
            <span>آخرین وضعیت</span>
          </div>
          <div class="divider" />
          <div class="col-md-9 col-12 status-card__template-content">
            <UserLastStatus :user-last-status="userData?.lastStatus" />
          </div>
        </div>
        <div class="status-card__template">
          <div class="col-md-5 col-12 status-card__template-title">
            <span>آخرین تماس</span>
          </div>
          <div class="divider" />
          <div class="col-md-7 col-12 status-card__template-content">
            <UserLastContact :contact-status="userData?.lastContact" />
          </div>
        </div>
      </div>
    </div>
    <div v-if="resetUserEnabled" class="deactivate-user">
      <QSeparator spaced color="grey-6" />
      <div class="row items-center">
        <div class="col-md-12 col-12">
          <QBtn
            class="deactivate-user__button"
            :loading="isPending"
            color="red-5"
            @click="() => (showUserResetDialog = true)"
          >
            <span><IconCircleDashedX size="20" /></span>
            <span>غیرفعال کردن {{ userData?.name }}</span>
          </QBtn>
          <QDialog v-model="showUserResetDialog" persistent>
            <QCard>
              <QCardSection class="row items-baseline">
                <QAvatar icon="info" color="negative" text-color="white" />
                <span class="q-ml-sm">
                  آیا از غیر فعال کردن کاربر {{ userData?.name }} اطمینان دارید؟
                </span>
              </QCardSection>

              <QCardActions align="right">
                <QBtn v-close-popup flat label="انصراف" color="negative" />
                <QBtn
                  flat
                  label="تایید"
                  color="primary"
                  @click="() => resetUserDataHistory(userId)"
                />
              </QCardActions>
            </QCard>
          </QDialog>
        </div>
      </div>
    </div>
    <SendSmsPreviewModal
      v-if="sendSmsModalVisible"
      :visible="sendSmsModalVisible"
      :data="{ mobile: mobileNumber, message: normalizedMsg }"
      @close="closeModal"
    />
    <TaskForm
      v-if="taskFormVisible"
      :visible="taskFormVisible"
      :prefilled-user="userData"
      :prefilled-description="taskFormDescription"
      @close="closeTaskForm"
      @submitted="closeTaskForm"
    />
  </div>
</template>

<script setup>
import SendSmsPreviewModal from '@/modules/User/components/SendSmsPreviewModal'
import {
  IconCopy,
  IconProgressAlert,
  IconBrandTelegram,
  IconBrandWhatsappFilled,
  IconInfoHexagon,
  IconMessage,
  IconCircleDashedX,
  IconMessage2,
  IconPhone,
  IconUser,
} from '@tabler/icons-vue'
import UserLastStatus from '@/modules/User/components/UserLastStatus'
import UserLastContact from '@/modules/User/components/UserLastContact'
import { computed, ref, watch, toRef } from 'vue'
import defaultAvatar from '@/assets/images/layout/avatar.png'
import { useUserStore } from '@/store/user'
import { normalizedMessage } from '@/utils/normalized-quick-messages'
import { copyToClipboard } from '@/utils/copy-to-clipboard'
import { getPerms } from '@/utils/get-perms'
import useDisclosure from '@/composables/use-disclosure'
import TaskForm from '@/modules/Task/components/TaskForm'
import SelectField from '@/base/SelectField'

import {
  useApiGetUserQuickMessages,
  useRecreateMutation,
  useApiSaveUserTags,
} from '@/modules/User/query'
import { handleError } from '@/utils/error-handler'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import { useGetTagsQuery } from '@/modules/Settings/query/index'
import { useQueryClient } from '@tanstack/vue-query'

const props = defineProps({
  userInfo: {},
})
const emits = defineEmits(['close'])
const normalizedMsg = ref('')

const queryClient = useQueryClient()
const userData = computed(() => props.userInfo || {})
const userId = computed(() => userData.value?.id)
const username = computed(() => {
  const firstName = userData.value?.firstName?.trim() || ''
  const lastName = userData.value?.name?.trim() || ''
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName

  if (!fullName) {
    return 'بدون نام'
  }

  if (userData.value?.gender === 'male') {
    return `آقای ${fullName}`
  }
  if (userData.value?.gender === 'female') {
    return `خانم ${fullName}`
  }

  return fullName
})
const mobileNumber = ref(undefined)
watch(
  () => userData.value?.mobile,
  (val) => {
    if (val) mobileNumber.value = val
  },
  { immediate: true }
)
const showUserResetDialog = ref(false)
const showTagsDropdown = ref(false)
const messageContent = ref({
  title: '',
  message: '',
  channels: [],
})
const quickMessagesOpened = ref(false)
const { userData: userStore } = useUserStore()
const { data: messages, isLoading: quickMessagesLoading } = useApiGetUserQuickMessages(
  toRef(() => userId.value),
  {
    enabled: computed(() => !!userId.value && quickMessagesOpened.value),
  }
)
const { data: tags } = useGetTagsQuery()
const { mutate: saveUserTags, isPending: saveTagsPending } = useApiSaveUserTags()
const { mutate: resetUser, isPending } = useRecreateMutation()

const [sendSmsModalVisible, { toggle: toggleSendSmsModal }] = useDisclosure()
const [taskFormVisible] = useDisclosure()
const taskFormDescription = ref('')
const pendingMessagePlatform = ref(null)

const tagsList = computed(() => tags.value?.items || [])
const quickMessages = computed(() => (messages.value ? Object.values(messages.value) : []))

const resetUserEnabled = computed(
  () => getPerms('user', 'recreate') && userData.value?.role?.id !== 6
)
const handleMessageContent = (e) => {
  messageContent.value.title = e?.title || null
  messageContent.value.message = e?.message || null
  messageContent.value.channels = e?.channels || []
}
const handleMobileNumberChange = (mobile) => {
  mobileNumber.value = mobile
}
const makePhoneCall = (phone) => {
  if (!phone) return

  const phoneStr = String(phone)
  const processedPhone = phoneStr.startsWith('021')
    ? phoneStr.slice(3)
    : phoneStr.startsWith('21')
      ? phoneStr.slice(2)
      : phoneStr

  window.open(`tel:${processedPhone}`, '_blank')
}

const platformNames = {
  telegram: 'تلگرام',
  whatsapp: 'واتساپ',
  sms: 'پیامک',
}

const showTaskConfirmDialog = () => {
  confirmDialog(
    'ثبت وظیفه',
    'پیام ارسالی به عنوان وظیفه انجام شده ثبت بشه؟',
    () => {
      const platformName =
        platformNames[pendingMessagePlatform.value] || pendingMessagePlatform.value
      taskFormDescription.value = `پیگیری: ${messageContent.value?.title || 'بدون عنوان'}\n\nاطلاع رسانی از طریق: ${platformName}`
      taskFormVisible.value = true
    },
    {
      ok: {
        label: 'بله',
        color: 'positive',
        flat: true,
      },
      persistent: true,
    },
    () => {
      pendingMessagePlatform.value = null
    }
  )
}

const sendMessage = (platform) => {
  if (!mobileNumber.value) {
    Notif.warning('شماره موبایل را انتخاب کنید')
    return
  }
  let url = ''

  if (!messageContent.value?.message) {
    Notif.warning('پیام مدنظر خود را انتخاب کنید')
    return
  }
  const message = normalizedMessage({
    text: messageContent.value?.message,
    user: userStore?.user,
    target: true,
  })

  switch (platform) {
    case 'telegram': {
      url = `tg://resolve?phone=98${mobileNumber.value}&text=${message}`
      break
    }
    case 'whatsapp': {
      url = `whatsapp://send?text=${message}&phone=98${mobileNumber.value}`
      break
    }
    case 'sms': {
      const messageWithCancelOption = `${messageContent.value?.message}%0Aلغو ۱۱`

      normalizedMsg.value = normalizedMessage({
        text: messageWithCancelOption,
        user: userStore?.user,
        target: false,
      })
      sendSmsModalVisible.value = true
      break
    }

    default: {
      Notif.warning('متدی برای ارسال انتخاب نشده است')
    }
  }
  if (platform === 'sms') {
    pendingMessagePlatform.value = platform
    showTaskConfirmDialog()
  } else {
    window.open(url, '_blank')
    pendingMessagePlatform.value = platform
    showTaskConfirmDialog()
  }
}

const closeTaskForm = () => {
  taskFormVisible.value = false
  taskFormDescription.value = ''
  pendingMessagePlatform.value = null
}
const copyContactNumber = (data) => {
  try {
    copyToClipboard(data)
    Notif.info('کپی شد')
  } catch {
    Notif.error('خطا در کپی متن')
  }
}
const copyDefaultMessage = (text) => {
  try {
    copyToClipboard(text, userStore?.user)
    Notif.info('کپی شد')
  } catch {
    Notif.error('خطا در کپی متن')
  }
}
const resetUserDataHistory = (id) => {
  resetUser(
    { id },
    {
      onSuccess: (response) => {
        Notif.success(response.message)
        emits('close')
      },
      onError: (e) => {
        handleError(e.errors.message)
        isPending.value = false
      },
    }
  )
}
const closeModal = () => {
  toggleSendSmsModal()
  normalizedMsg.value = ''
}

const isTagSelected = (tagId) => {
  return userData.value?.tags?.some((tag) => tag.id === tagId) || false
}

const toggleUserTag = (tag) => {
  const currentTags = userData.value?.tags || []
  const isSelected = isTagSelected(tag.id)

  const updatedTags = isSelected
    ? currentTags.filter((t) => t.id !== tag.id)
    : [...currentTags, tag]

  saveUserTags(
    {
      userId: userId.value,
      tagIds: updatedTags.map((t) => t.id),
    },
    {
      onSuccess: () => {
        userData.value.tags = updatedTags
        Notif.success('تگ‌ها با موفقیت بروزرسانی شد')
        queryClient.invalidateQueries({ queryKey: ['user', userId] })
      },
    }
  )
}

// const checkDisabled = (channels, key) => {
//   if (!channels || !Array.isArray(channels)) return false
//   return !channels?.includes(key)
// }
// :disabled="checkDisabled(messageContent.channels, 'whatsapp')"
//    :disabled="checkDisabled(messageContent.channels, 'sms')"
//           :disabled="checkDisabled(messageContent.channels, 'telegram')"
</script>

<style scoped lang="scss">
@import '@/assets/styles/colors';

:deep(.el-radio-button__inner) {
  width: 100px !important;
  text-align: center;
}

.user-details {
  min-height: 100%;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: $white;
  color: $gray-text;
  padding: 16px;
  border-radius: 8px;

  &__card {
    display: flex !important;
    justify-content: flex-start;
    align-items: center;

    &-user-id {
      gap: 10px;
      background-color: #fff;
      width: 100%;
      border-radius: 4px;
      align-items: baseline;
      justify-content: start;
      cursor: pointer;
    }

    &-identification {
      column-gap: 12px;
      background-color: #fff;
      width: 100%;
      border-radius: 4px;
      align-items: center;
      font-weight: bold;

      &__national-code {
        font-weight: normal;
        margin-top: 2px;
        color: #979797;
        justify-content: space-between;
        span {
          font-size: 12px;
        }
        div {
          border-bottom: 1px dashed $body;
          color: $body;
          width: max-content;
        }
      }

      &__tags {
        display: flex;
        margin-top: 12px;
        font-size: 14px;
        font-weight: 500;
        padding-bottom: 16px;
      }
      &__tag {
        color: $blue-grey-8;
        border-color: $default-disabled-border;
      }
      &__avatar {
        border-radius: 10px;
        max-width: 52px;
        border: 1px solid $blue-grey-6;
        font-weight: lighter;
        text-align: center;
        max-height: 52px;
        position: relative;
      }

      &__vip {
        border: 2px solid $amber-6;
        position: relative;

        &--badge {
          position: absolute;
          bottom: 0;
          right: 9%;
          background-color: #fc0;
          border-radius: 10px;
          color: white;
          font-weight: bold;
          margin: 0;
          padding: 0 10px;
        }
      }
    }

    &-call-section {
      justify-content: space-between;
      gap: 10px;
      background-color: #fff;
      width: 100%;
      padding: 16px 0;
      border-radius: 4px;
      align-items: center;

      p {
        color: $grey-text;
        font-size: 12px;
        margin: 0;
        font-weight: 600;
      }

      span {
        color: $body;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
      }
    }

    &-advisor {
      gap: 10px;
      background-color: #fff;
      width: 100%;
      padding: 16px 0;
      border-radius: 4px;
      align-items: start;
      display: flex;
      flex-direction: column;

      .advisor__info {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: space-between;
        word-wrap: nowrap;
        flex-wrap: nowrap;
        gap: $spacing-sm;

        & div {
          display: flex;
          align-items: center;
          gap: $spacing-sm;
        }

        &-divider {
          flex-grow: 1;
          border: 1px dashed #bdbdbd;
        }
      }

      &_icon {
        color: $dark-text;
        background-color: $dark-light;
        padding: 5px;
        border-radius: 50%;
        width: 32px;
        height: 32px;
      }
    }

    &-send-message {
      background-color: white;
      width: 100%;
      display: flex;
      gap: 12px;
      padding: 16px 0;
      :deep(.selectfield--md .selectfield__qselect .q-field__marginal) {
        padding-left: 3px !important;
      }
      :deep(.selectfield--md .selectfield__qselect .q-field__control) {
        padding-right: 3px !important;
      }
      &_social-buttons {
        display: flex;
        align-items: center;
        gap: 9.6px;
        margin-top: 8px;

        .social-button {
          width: 40px !important;
          height: 40px !important;
          padding: 0;
          margin: 0;
          border-radius: 6px;
        }

        .social-button:disabled {
          opacity: 0.3;
        }
      }
    }
  }
  &__add-tag {
    position: relative;
    border-radius: $radius-2xl;
    border-color: transparent;
  }

  .user-details__add-tag::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: 1px;
    border-radius: inherit;

    background: repeating-linear-gradient(
      90deg,
      $default-disabled-border 0 5px,
      transparent 5px 10px
    );

    -webkit-mask:
      linear-gradient($default-disabled-border 0 0) content-box,
      linear-gradient($default-disabled-border 0 0);

    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }
}

.divider {
  border: 1px solid $default-disabled-border;
  width: 100%;
  margin: 0 auto;
}
.border-copy {
  border-bottom: 1px dashed $body;
}

.status-card {
  width: 100%;
  min-height: 80px;
  background-color: #fff;
  border-radius: 4px;
  padding-top: 16px;

  &__header {
    width: 100%;
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #ecf5ff;
    color: #1a73e8;
    font-weight: bold;
    border-top-right-radius: 4px;
    border-top-left-radius: 4px;
    margin-bottom: 8px;
  }

  &__template {
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: space-between;
    padding: 6px 10px;
    margin: 0 !important;
    gap: 8px;

    &-title {
      display: flex;
      justify-content: start;
    }

    &-content {
      display: flex;
      justify-content: end;
      text-align: end;
    }
  }
}

.deactivate-user {
  width: 100%;
  // Pin to the bottom of the info card (.user-details is a flex column).
  // Without this the section floats up when the content above is short.
  margin-top: auto;

  &__button {
    width: 100%;
    border-radius: 4px;
    display: flex;
    justify-content: end;
    align-items: center;

    span {
      margin-right: 5px;
    }
  }
}

.username {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  width: 200px;
}

.mobile-toggle {
  border-radius: 4px;
  background-color: $grey-light;
}

.tag-color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #ddd;
}

@media (max-width: 768px) {
  .user-details__card-identification__vip {
    &--badge {
      right: 2.5%;
    }
  }
}

.call-action_btn {
  width: 70px !important;
  height: 40px !important;
  border-radius: 100px !important;
}
</style>
