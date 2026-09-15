<template>
  <div class="row q-gutter-sm umsg">
    <div ref="messagesContainerRef" class="col-md-8 col-12 umsg__messages-container">
      <QInnerLoading :showing="isTabLoading || (getUserConversationsLoading && !hasMessages)">
        <QSpinnerTail color="primary" />
      </QInnerLoading>

      <QScrollArea ref="scrollAreaRef" class="umsg__scroll-area" @scroll="onScroll">
        <div class="umsg__messages-list">
          <div v-if="isFetchingNextPage || isFakeLoading" class="umsg__loading-older">
            <QSpinnerDots size="30px" color="primary" />
            <span class="text-grey-6">در حال بارگذاری پیام‌های قبلی...</span>
          </div>
          <QInnerLoading :showing="isTabLoading || (getUserConversationsLoading && !hasMessages)">
            <QSpinnerDots size="50px" color="primary" />
          </QInnerLoading>
          <template v-for="(group, index) in groupedMessages" :key="index">
            <div class="umsg__date-separator">
              <div class="umsg__date-separator-line" />
              <span class="umsg__date-separator-text">
                {{ group.date }}
                <template v-if="activeTab === 'all' && group.channelInfo">
                  <span class="umsg__date-divider">|</span>
                  <component
                    :is="getChannelIcon(group.channelInfo.icon)"
                    v-if="isIconComponent(group.channelInfo.icon)"
                    class="text-primary"
                    :size="16"
                  />
                  <img
                    v-else-if="group.channelInfo.icon"
                    :src="getChannelIcon(group.channelInfo.icon)"
                    alt="logo"
                    class="umsg__channel-icon"
                  />
                  <span class="umsg__channel-title">{{ group.channelInfo.title }}</span>
                </template>
              </span>
              <div class="umsg__date-separator-line" />
            </div>

            <div
              v-for="message in group.messages"
              :key="message.id"
              class="umsg__message-wrapper"
              :class="{
                'umsg__message-wrapper--admin': message.isAdmin,
                'umsg__message-wrapper--user': !message.isAdmin,
              }"
            >
              <div class="umsg__message-bubble">
                <div class="umsg__message-content">{{ message.message }}</div>
                <div class="umsg__message-time">{{ formatDate(message.createdAt, 'HH:mm') }}</div>
              </div>
            </div>
          </template>

          <div v-if="!hasMessages && !getUserConversationsLoading" class="umsg__empty">
            <IconMessage2 :size="48" class="text-grey-5" />
            <span class="text-grey-6">پیامی یافت نشد</span>
          </div>
        </div>
      </QScrollArea>
    </div>

    <div ref="channelsContainerRef" class="col-md-3 col-12 umsg__container">
      <QInnerLoading :showing="getChannelLoading">
        <QSpinnerTail color="primary" />
      </QInnerLoading>
      <QTabs
        v-model="activeTab"
        class="channels-tabs"
        active-class="channels__selected"
        indicator-color="transparent"
        vertical
        @update:model-value="onTabChange"
      >
        <QTab class="channels" name="all">
          <span class="channels__title">
            <IconBorderAll />
            همه
          </span>
        </QTab>
        <QTab
          v-for="channel in allChannels"
          :key="channel.id"
          :name="channel.slug"
          class="channels"
        >
          <span class="channels__title">
            <component
              :is="getChannelIcon(channel.metadata?.icon)"
              v-if="isIconComponent(channel.metadata?.icon)"
            />
            <img
              v-else-if="channel.metadata?.icon"
              :src="getChannelIcon(channel.metadata?.icon)"
              alt="logo"
            />
            {{ channel?.title }}
          </span>
        </QTab>
      </QTabs>
    </div>
  </div>
</template>

<script setup>
import {
  useGetConversationChannels,
  useGetUserConversationInfinityQuery,
} from '@/modules/User/query/index'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watchEffect, watch } from 'vue'
import { createAsyncIconComponent } from '@/utils/icon-loader'
import { IconBorderAll, IconMessage2 } from '@tabler/icons-vue'
import { convertToJalali, formatDate, formatJalali } from '@/utils/date-utils'
import { useQueryClient } from '@tanstack/vue-query'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import { MOCK_CHANNELS, mockGetUserConversations } from '@/mocks/user-details/conversations'

const props = defineProps({
  propData: { type: Number, default: null },
})

const queryClient = useQueryClient()
const activeTab = ref('all')
const filters = ref({
  'filter[source]': '',
})
const userId = computed(() => props.propData)
const isMounted = ref(true)
const isTabLoading = ref(false)
const messagesContainerRef = ref(null)
const channelsContainerRef = ref(null)
const scrollAreaRef = ref(null)
const isInitialLoad = ref(true)
const previousScrollHeight = ref(0)
const isFakeLoading = ref(false)

const { data: channels, isLoading: getChannelLoading } = useGetConversationChannels({
  enabled: () => !!userId.value,
  ...(ENABLE_USER_DETAIL_MOCKS ? { queryFn: () => MOCK_CHANNELS } : {}),
})
const allChannels = computed(() => channels.value?.items || [])

const syncContainerHeights = () => {
  if (channelsContainerRef.value && messagesContainerRef.value) {
    const channelsHeight = channelsContainerRef.value.offsetHeight
    if (channelsHeight > 0) {
      messagesContainerRef.value.style.maxHeight = `${channelsHeight}px`
    }
  }
}

const {
  data: conversations,
  isLoading: getUserConversationsLoading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useGetUserConversationInfinityQuery(userId, filters, {
  enabled: () => !!userId.value && isMounted.value,
  ...(ENABLE_USER_DETAIL_MOCKS ? { queryFn: () => mockGetUserConversations(filters.value) } : {}),
})

const loadNextPage = async () => {
  if (!hasNextPage.value || isFetchingNextPage.value || isFakeLoading.value) return

  const scrollContainer = scrollAreaRef.value?.getScrollTarget()
  if (scrollContainer) {
    previousScrollHeight.value = scrollContainer.scrollHeight
  }

  isFakeLoading.value = true

  await new Promise((resolve) => {
    setTimeout(resolve, 500)
  })

  await fetchNextPage()

  isFakeLoading.value = false
}

const scrollToBottom = () => {
  nextTick(() => {
    const scrollContainer = scrollAreaRef.value?.getScrollTarget()
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  })
}

const maintainScrollPosition = () => {
  nextTick(() => {
    const scrollContainer = scrollAreaRef.value?.getScrollTarget()
    if (scrollContainer && previousScrollHeight.value > 0) {
      const newScrollHeight = scrollContainer.scrollHeight

      scrollContainer.scrollTop = newScrollHeight - previousScrollHeight.value
      previousScrollHeight.value = 0
    }
  })
}

const onScroll = (info) => {
  const scrollTop = info.verticalPosition
  const threshold = 50

  if (
    scrollTop <= threshold &&
    hasNextPage.value &&
    !isFetchingNextPage.value &&
    !isFakeLoading.value
  ) {
    loadNextPage()
  }
}

const allMessages = computed(() => {
  const pages = conversations.value?.pages || []
  return pages.flatMap((pageData) => {
    return pageData?.data?.items || []
  })
})

const hasMessages = computed(() => allMessages.value.length > 0)

const getChannelBySlug = (slug) => {
  const channel = allChannels.value.find((ch) => ch.slug === slug)
  if (channel) {
    return {
      title: channel?.title,
      icon: channel?.source?.metadata?.icon || channel.metadata?.icon,
    }
  }
  return null
}

const formatDateForGrouping = (dateString) => {
  if (!dateString) return ''
  try {
    return formatJalali(dateString, 'jYYYY') === formatJalali(new Date(), 'jYYYY')
      ? convertToJalali(dateString, 'jDD jMMMM')
      : convertToJalali(dateString, 'jYYYY/jMM/jDD')
  } catch {
    return ''
  }
}

const groupedMessages = computed(() => {
  const messages = [...allMessages.value]

  messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const groups = []
  let currentGroup = null

  messages.forEach((message) => {
    const messageDate = formatDateForGrouping(message.createdAt)
    const messageSlug = message?.source?.slug || message.slug

    const groupKey = activeTab.value === 'all' ? `${messageSlug}-${messageDate}` : messageDate

    if (!currentGroup || currentGroup.key !== groupKey) {
      currentGroup = {
        key: groupKey,
        date: messageDate,
        slug: messageSlug,
        channelInfo: getChannelBySlug(messageSlug),
        messages: [],
      }
      groups.push(currentGroup)
    }

    currentGroup.messages.push(message)
  })

  return groups
})

const onTabChange = async (tabName) => {
  isTabLoading.value = true
  isInitialLoad.value = true

  // Update filters
  filters.value =
    tabName === 'all'
      ? {
          'filter[source]': '',
        }
      : {
          'filter[source]': tabName,
        }

  // Remove cached data for this query to get fresh data
  await queryClient.invalidateQueries({
    queryKey: ['user', 'conversation'],
    exact: false,
  })

  isTabLoading.value = false
}

const getChannelIcon = (iconName) => {
  if (!iconName) return null
  return createAsyncIconComponent(iconName)
}

const isIconComponent = (iconName) => {
  if (!iconName) return false
  const icon = createAsyncIconComponent(iconName)
  return icon && typeof icon !== 'string'
}

onBeforeUnmount(() => {
  isMounted.value = false
})

onMounted(() => {
  nextTick(() => {
    syncContainerHeights()
  })
})

watch(
  () => allChannels.value,
  () => {
    nextTick(() => {
      syncContainerHeights()
    })
  }
)

watch(
  () => allMessages.value,
  (newMessages, oldMessages) => {
    if (!newMessages?.length) return

    if (isInitialLoad.value && !getUserConversationsLoading.value) {
      isInitialLoad.value = false
      scrollToBottom()
    } else if (oldMessages?.length && newMessages.length > oldMessages.length) {
      maintainScrollPosition()
    }
  },
  { deep: true }
)

watchEffect(
  () => getUserConversationsLoading.value,
  (loading) => {
    if (!loading && isInitialLoad.value && hasMessages.value) {
      isInitialLoad.value = false
      scrollToBottom()
    }
  }
)
</script>

<style scoped lang="scss">
.umsg {
  margin: 1rem auto;

  &__container {
    background-color: $grey-1;
    border-radius: 10px;
    border: 1px solid $grey-2;
    padding: map-get($space-sm, 'x');
  }

  &__messages-container {
    background-color: $grey-1;
    border-radius: 10px;
    border: 1px solid $grey-2;
    padding: map-get($space-sm, 'x');
    display: flex;
    flex-direction: column;
    min-height: 300px;
    max-height: 500px;
  }

  &__scroll-area {
    flex: 1;
    height: 100%;
  }

  &__messages-list {
    display: flex;
    flex-direction: column;
    padding: map-get($space-sm, 'x');
    width: 100%;
    overflow-x: hidden;
  }

  &__date-separator {
    display: flex;
    align-items: center;
    margin: map-get($space-md, 'x') 0;
    gap: map-get($space-sm, 'x');
  }

  &__date-separator-line {
    flex: 1;
    height: 0;
    background-color: $grey-4;
  }

  &__date-separator-text {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: $grey-8;
    background-color: $grey-2;
    padding: 4px 12px;
    border-radius: 12px;
    white-space: nowrap;
  }

  &__channel-icon {
    width: 16px;
    height: 16px;
    object-fit: contain;
    color: $primary;
  }

  &__channel-title {
    font-weight: bold;
    color: $primary;
  }

  &__date-divider {
    color: $grey-5;
    margin: 0 4px;
  }

  &__message-wrapper {
    display: flex;
    width: 100%;
    margin-bottom: map-get($space-sm, 'x');

    &--admin {
      justify-content: flex-start;

      .umsg__message-bubble {
        background-color: $blue-1;
        border: 1px solid $blue-2;
        border-radius: 12px 12px 4px 12px;
      }
    }

    &--user {
      justify-content: flex-end;

      .umsg__message-bubble {
        background-color: white;
        border: 1px solid $grey-3;
        border-radius: 12px 12px 12px 4px;
      }
    }
  }

  &__message-bubble {
    max-width: 70%;
    padding: map-get($space-sm, 'x') map-get($space-md, 'x');
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  &__message-content {
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  &__message-time {
    font-size: 11px;
    color: $grey-6;
    text-align: left;
    margin-top: 4px;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: map-get($space-xl, 'x');
    gap: map-get($space-sm, 'x');
  }

  &__loading-older {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: map-get($space-sm, 'x');
    padding: map-get($space-md, 'x');
  }
}

.channels {
  width: 100%;
  background: white;
  border-radius: 8px;
  border: 1px solid $grey-3;
  padding: map-get($space-md, x);
  justify-content: start;
  color: $grey-7;
  &__title {
    display: flex !important;
    gap: 10px;
    align-items: center;
  }

  &__selected {
    background-color: $blue-1;
    border: 1px solid $blue-3;
    color: $blue-6 !important;
  }
}

:deep(.q-tabs__content) {
  display: flex !important;
  flex-direction: column !important;
  gap: 10px !important;
}
</style>
