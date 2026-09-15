<template>
  <Transition name="popup">
    <div v-if="modelValue" class="ai-summary-popup">
      <div class="ai-summary-popup__overlay" @click="close" />
      <div class="ai-summary-popup__card">
        <div class="ai-summary-popup__header">
          <div class="ai-summary-popup__header-right">
            <div class="ai-summary-popup__type-label">
              {{ typeLabel }}
            </div>
            <Transition name="text-fade" mode="out-in">
              <div :key="currentTitle" class="ai-summary-popup__title">
                <span>{{ currentTitle }}</span>
              </div>
            </Transition>
            <Transition name="text-fade" mode="out-in">
              <div :key="currentSubtitle" class="ai-summary-popup__subtitle">
                {{ currentSubtitle }}
              </div>
            </Transition>
          </div>
          <Transition name="button-fade">
            <QBtn
              v-if="showUpdateButton"
              color="white"
              text-color="purple-5"
              unelevated
              :loading="updating"
              @click="$emit('update')"
            >
              {{ buttonText }}
            </QBtn>
            <QBtn
              v-else-if="showRefreshButton"
              color="white"
              text-color="purple-5"
              unelevated
              :loading="loading"
              @click="$emit('refresh')"
            >
              {{ refreshButtonText }}
            </QBtn>
          </Transition>
        </div>
        <Transition name="content-fade" mode="out-in">
          <div v-if="!hideContent" class="ai-summary-popup__content">
            <Transition name="text-fade" mode="out-in">
              <div v-if="showSkeleton" key="skeleton" class="ai-summary-popup__skeleton">
                <QSkeleton type="text" width="100%" />
                <QSkeleton type="text" width="90%" class="q-mt-sm" />
                <QSkeleton type="text" width="95%" class="q-mt-sm" />
                <QSkeleton type="text" width="60%" class="q-mt-sm" />
              </div>
              <div v-else-if="summary" :key="summary" class="ai-summary-popup__text">
                {{ summary }}
              </div>
              <div v-else key="empty" class="ai-summary-popup__empty">خلاصه‌ای موجود نیست</div>
            </Transition>
          </div>
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  updating: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: '',
  },
  summary: {
    type: String,
    default: '',
  },
  newChatsCount: {
    type: Number,
    default: 0,
  },
  type: {
    type: String,
    default: 'chat',
    validator: (value) => ['chat', 'call'].includes(value),
  },
  error: {
    type: Boolean,
    default: false,
  },
})

const typeLabel = computed(() => (props.type === 'call' ? 'خلاصه تماس‌ها' : 'خلاصه پیام‌ها'))

const emit = defineEmits(['update:modelValue', 'update', 'refresh'])

const chatMessages = {
  loading: {
    titles: [
      'سلام سلام!',
      'یه لحظه صبر کن...',
      'دارم فکر می‌کنم...',
      'صبر کن ببینم...',
      'داریم میاریم!',
      'یه ثانیه...',
      'الان آماده میشه!',
    ],
    subtitles: [
      'در حال بارگذاری...',
      'الان میارمش...',
      'یه کم صبر کن...',
      'دارم جمع‌بندی می‌کنم...',
      'چند لحظه دیگه حاضره!',
    ],
  },
  inProgress: {
    titles: [
      'این یکم قدیمیه!',
      'داره آپدیت میشه!',
      'نسخه قبلی رو می‌بینی!',
      'یه آپدیت در راهه!',
      'خبر خوب دارم!',
    ],
    subtitles: [
      'این خلاصه قبلیه، یه آپدیت جدید داره میاد!',
      'داریم خلاصه جدید رو آماده می‌کنیم، فعلا این رو ببین!',
      'یه نسخه جدید در راهه، می‌تونی رفرش کنی!',
      'این قدیمیه ولی به‌زودی آپدیت میشه!',
      'خلاصه جدید داره آماده میشه، صبر کن یا رفرش بزن!',
    ],
  },
  generating: {
    titles: [
      'داره آماده میشه!',
      'یه لحظه صبر کن...',
      'دارم روش کار می‌کنم!',
      'کمی صبر کن...',
      'در حال پردازش...',
    ],
    subtitles: [
      'یه آپدیت جدید داره میاد برات!',
      'دارم خلاصه رو آماده می‌کنم...',
      'یکم طول می‌کشه، می‌تونی رفرش کنی!',
      'به‌زودی آماده میشه!',
    ],
  },
  hasNewChats: {
    titles: ['سلام سلام!', 'یه خبرایی هست!', 'خبر جدید داریم!', 'آپدیت داریم!', 'چیز جدید اومده!'],
    subtitles: [
      'فقط این برای قبل هستش... میخوای برات آپدیتش کنم؟!',
      'چت‌های جدید داریم، آپدیت کنم؟',
      'یه سری چت جدید اومده، بزنم؟',
      'این یکم قدیمیه... آپدیتش کنم؟',
      'چیزای جدید هست، میخوای اضافه کنم؟',
    ],
  },
  upToDate: {
    titles: [
      'بفرما!',
      'اینم خلاصه‌ات!',
      'چیزایی که خوبه بدونی از این قراره...',
      'تمومه!',
      'بفرمایید...',
      'خلاصه آماده‌ست!',
      'اینم از این!',
    ],
    subtitles: [
      'خلاصه به‌روز است',
      'امیدوارم به کارت بیاد :)',
      'همه چی آپدیته!',
      'این آخرین وضعیته',
      'چیز جدیدی نیست',
      'همین الان آپدیت شده!',
      'تازه‌ترین اطلاعات اینجاست',
    ],
  },
  noChats: {
    titles: ['هنوز چتی نداریم!', 'اینجا خالیه!', 'چتی نیست!', 'سلام!'],
    subtitles: [
      'هنوز چتی با این کاربر انجام نشده',
      'وقتی چت جدید اومد خبرت می‌کنم!',
      'فعلا چیزی برای خلاصه کردن نیست',
      'منتظر اولین چت هستم',
      'چتی وجود نداره که خلاصه کنم',
    ],
  },
  error: {
    titles: ['اوه اوه!', 'یه مشکلی پیش اومد!', 'خطا!', 'متأسفم!'],
    subtitles: [
      'مشکلی در دریافت خلاصه پیش اومد، دوباره تلاش کن!',
      'نتونستم خلاصه رو بیارم، یه بار دیگه امتحان کن!',
      'یه خطایی رخ داد، لطفا دوباره تلاش کن!',
      'ارتباط با سرور برقرار نشد، رفرش کن!',
    ],
  },
}

const callMessages = {
  loading: {
    titles: [
      'سلام سلام!',
      'یه لحظه صبر کن...',
      'دارم فکر می‌کنم...',
      'صبر کن ببینم...',
      'داریم میاریم!',
      'یه ثانیه...',
      'الان آماده میشه!',
    ],
    subtitles: [
      'در حال بارگذاری...',
      'الان میارمش...',
      'یه کم صبر کن...',
      'دارم جمع‌بندی می‌کنم...',
      'چند لحظه دیگه حاضره!',
    ],
  },
  inProgress: {
    titles: [
      'این یکم قدیمیه!',
      'داره آپدیت میشه!',
      'نسخه قبلی رو می‌بینی!',
      'یه آپدیت در راهه!',
      'خبر خوب دارم!',
    ],
    subtitles: [
      'این خلاصه قبلیه، یه آپدیت جدید داره میاد!',
      'داریم خلاصه جدید رو آماده می‌کنیم، فعلا این رو ببین!',
      'یه نسخه جدید در راهه، می‌تونی رفرش کنی!',
      'این قدیمیه ولی به‌زودی آپدیت میشه!',
      'خلاصه جدید داره آماده میشه، صبر کن یا رفرش بزن!',
    ],
  },
  generating: {
    titles: [
      'داره آماده میشه!',
      'یه لحظه صبر کن...',
      'دارم روش کار می‌کنم!',
      'کمی صبر کن...',
      'در حال پردازش...',
    ],
    subtitles: [
      'یه آپدیت جدید داره میاد برات!',
      'دارم خلاصه رو آماده می‌کنم...',
      'یکم طول می‌کشه، می‌تونی رفرش کنی!',
      'به‌زودی آماده میشه!',
    ],
  },
  hasNewChats: {
    titles: ['سلام سلام!', 'یه خبرایی هست!', 'خبر جدید داریم!', 'آپدیت داریم!', 'چیز جدید اومده!'],
    subtitles: [
      'فقط این برای قبل هستش... میخوای برات آپدیتش کنم؟!',
      'تماس‌های جدید داریم، آپدیت کنم؟',
      'یه سری تماس جدید اومده، بزنم؟',
      'این یکم قدیمیه... آپدیتش کنم؟',
      'چیزای جدید هست، میخوای اضافه کنم؟',
    ],
  },
  upToDate: {
    titles: [
      'بفرما!',
      'اینم خلاصه‌ات!',
      'چیزایی که خوبه بدونی از این قراره...',
      'تمومه!',
      'بفرمایید...',
      'خلاصه آماده‌ست!',
      'اینم از این!',
    ],
    subtitles: [
      'خلاصه به‌روز است',
      'امیدوارم به کارت بیاد :)',
      'همه چی آپدیته!',
      'این آخرین وضعیته',
      'چیز جدیدی نیست',
      'همین الان آپدیت شده!',
      'تازه‌ترین اطلاعات اینجاست',
    ],
  },
  noChats: {
    titles: ['هنوز تماسی نداریم!', 'اینجا خالیه!', 'تماسی نیست!', 'سلام!'],
    subtitles: [
      'هنوز تماسی با این کاربر انجام نشده',
      'وقتی تماس جدید اومد خبرت می‌کنم!',
      'فعلا چیزی برای خلاصه کردن نیست',
      'منتظر اولین تماس هستم',
      'تماسی وجود نداره که خلاصه کنم',
    ],
  },
  error: {
    titles: ['اوه اوه!', 'یه مشکلی پیش اومد!', 'خطا!', 'متأسفم!'],
    subtitles: [
      'مشکلی در دریافت خلاصه پیش اومد، دوباره تلاش کن!',
      'نتونستم خلاصه رو بیارم، یه بار دیگه امتحان کن!',
      'یه خطایی رخ داد، لطفا دوباره تلاش کن!',
      'ارتباط با سرور برقرار نشد، رفرش کن!',
    ],
  },
}

const messages = computed(() => (props.type === 'call' ? callMessages : chatMessages))

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)]

const currentTitle = ref('')
const currentSubtitle = ref('')
const initialLoading = ref(false)
let initialLoadingTimer = null

const showSkeleton = computed(() => props.loading || props.updating || initialLoading.value)

const isGenerating = computed(() => props.status === 'in_progress' && !props.summary)

const hideContent = computed(() => props.status === 'no_chats' || isGenerating.value || props.error)

const updateMessages = () => {
  let messageGroup
  const msgs = messages.value
  if (showSkeleton.value) {
    messageGroup = msgs.loading
  } else if (props.error) {
    messageGroup = msgs.error
  } else if (props.status === 'no_chats') {
    messageGroup = msgs.noChats
  } else if (isGenerating.value) {
    messageGroup = msgs.generating
  } else if (props.status === 'in_progress') {
    messageGroup = msgs.inProgress
  } else if (props.newChatsCount > 0) {
    messageGroup = msgs.hasNewChats
  } else {
    messageGroup = msgs.upToDate
  }
  currentTitle.value = getRandomItem(messageGroup.titles)
  currentSubtitle.value = getRandomItem(messageGroup.subtitles)
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      initialLoading.value = true
      updateMessages()
      initialLoadingTimer = setTimeout(() => {
        initialLoading.value = false
        updateMessages()
      }, 2000)
    } else {
      clearTimeout(initialLoadingTimer)
    }
  }
)

onBeforeUnmount(() => {
  clearTimeout(initialLoadingTimer)
})

watch(
  () => props.loading,
  (isLoading, wasLoading) => {
    if (wasLoading && !isLoading) updateMessages()
  }
)

watch(
  () => props.error,
  (isError) => {
    if (isError) updateMessages()
  }
)

const close = () => {
  emit('update:modelValue', false)
}

const showUpdateButton = computed(() => {
  if (props.loading) return false
  return props.newChatsCount > 0
})

const showRefreshButton = computed(() => {
  if (props.loading || props.updating) return false
  return props.error || (props.status === 'in_progress' && props.summary)
})

const buttonText = 'آره، آپدیتش کن!'
const refreshButtonText = 'رفرش کن!'
</script>

<style scoped lang="scss">
.ai-summary-popup {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  z-index: 6000;

  &__overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: transparent;
    z-index: -1;
  }

  &__card {
    --border-width: 2px;

    position: relative;
    width: 592px;
    max-width: 90vw;
    background-color: $grey-1;
    border-radius: 16px;
    padding: 4px 5px;

    &::after {
      content: '';
      position: absolute;
      top: calc(-1 * var(--border-width));
      left: calc(-1 * var(--border-width));
      height: calc(100% + var(--border-width) * 2);
      width: calc(100% + var(--border-width) * 2);
      background: linear-gradient(
        60deg,
        #f79533,
        #f37055,
        #ef4e7b,
        #a166ab,
        #5073b8,
        #1098ad,
        #07b39b,
        #6fba82
      );
      border-radius: calc(16px + var(--border-width));
      z-index: -1;
      animation: animatedgradient 3s ease alternate infinite;
      background-size: 300% 300%;
    }
  }

  @keyframes animatedgradient {
    0% {
      background-position: 0% 50%;
    }

    50% {
      background-position: 100% 50%;
    }

    100% {
      background-position: 0% 50%;
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px;
    gap: 12px;
  }

  &__header-right {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__type-label {
    font-size: 11px;
    color: $grey-6;
    font-weight: 500;
    margin-bottom: 2px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;
    color: $grey-9;
  }

  &__subtitle {
    font-size: 12px;
    color: $grey-7;
  }

  &__content {
    max-height: 250px;
    min-height: 130px;
    overflow-y: auto;
    margin: 0 16px 16px;
    padding: 12px;
    background-color: $white;
    border-radius: 8px;
    white-space: pre-wrap;
    line-height: 1.7;
    font-size: 13px;
    color: $grey-8;
  }

  &__empty {
    text-align: center;
    color: $grey-6;
  }

  &__skeleton,
  &__text {
    width: 100%;
  }
}

// Popup open/close transition
.popup-enter-active {
  animation: popup-in 0.3s ease-out;
}

.popup-leave-active {
  animation: popup-out 0.2s ease-in;
}

@keyframes popup-in {
  0% {
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes popup-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  100% {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
}

// Text fade transition
.text-fade-enter-active {
  transition: all 0.25s ease-out;
}

.text-fade-leave-active {
  transition: all 0.15s ease-in;
}

.text-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.text-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

// Content fade transition
.content-fade-enter-active {
  transition: all 0.3s ease-out;
}

.content-fade-leave-active {
  transition: all 0.2s ease-in;
}

.content-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.content-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

// Button fade transition
.button-fade-enter-active {
  transition: all 0.25s ease-out;
}

.button-fade-leave-active {
  transition: all 0.15s ease-in;
}

.button-fade-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.button-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
