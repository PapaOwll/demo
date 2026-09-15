<template>
  <QBanner
    v-if="announcement && announcement.title && !isDismissed"
    class="announcement-banner"
    :style="bannerStyle"
  >
    <div class="announcement-banner__content">
      <div class="announcement-banner__text">
        <Typography variant="body" size="3" weight="medium" color="white">
          {{ announcement.title }}
        </Typography>
        <Typography v-if="announcement?.text" variant="body" size="2" color="white">
          {{ announcement?.text }}
        </Typography>
      </div>
      <Button
        v-if="announcement.buttonText"
        variant="flat"
        color="white"
        :text="announcement.buttonText"
        class="announcement-banner__button"
        @click="handleButtonClick"
      />
      <Button
        v-if="showDismissButton"
        variant="flat"
        color="grey"
        class="announcement-banner__dismiss"
        :is-loading="isDismissing"
        @click="handleDismiss"
      >
        <IconX />
      </Button>
    </div>
  </QBanner>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import { IconX } from '@tabler/icons-vue'

const DISMISSED_KEY = 'crm-dismissed-announcements'

const props = defineProps({
  announcement: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['dismiss'])
const router = useRouter()

const loadDismissedIds = () => {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

const saveDismissedIds = (ids) => {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]))
  } catch {
    // Ignore storage errors
  }
}

const dismissedIds = ref(loadDismissedIds())
const isDismissing = ref(false)

const showDismissButton = computed(() => {
  return props.announcement.isCancelable !== false
})

const isDismissed = computed(() => {
  if (showDismissButton.value) {
    return dismissedIds.value.has(props.announcement.id)
  }
  return false
})

const bannerStyle = computed(() => {
  const gradient = props.announcement?.gradient

  if (!gradient || !Array.isArray(gradient) || gradient.length < 2) {
    return { background: 'linear-gradient(90deg, #3b4cca 0%, #6a3093 100%)' }
  }

  return { background: `linear-gradient(90deg, ${gradient[0]} 0%, ${gradient[1]} 100%)` }
})

const handleButtonClick = () => {
  const { buttonLink } = props.announcement

  if (!buttonLink) return

  // Check if the link is an external URL
  const isExternalLink = /^https?:\/\//.test(buttonLink)

  if (isExternalLink) {
    // Open external links in a new tab
    window.open(buttonLink, '_blank')
  } else {
    // Navigate to internal routes
    router.push(buttonLink)
  }
}

const handleDismiss = () => {
  isDismissing.value = true
  setTimeout(() => {
    dismissedIds.value.add(props.announcement.id)
    saveDismissedIds(dismissedIds.value)
    emit('dismiss')
  }, 2000)
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/colors';
@import '@/assets/styles/mixins';

.announcement-banner {
  padding: 8px 0;
  min-height: 56px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  border-radius: 12px;
  position: relative;
  &__content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    width: 100%;
    max-width: 100%;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: center;
    align-items: center;
  }

  &__button {
    flex-shrink: 0;
    border: 1px solid white !important;
    border-radius: 8px !important;
    padding: 8px 20px !important;

    &:hover {
      background: rgba(255, 255, 255, 0.1) !important;
    }
  }

  &__dismiss {
    flex-shrink: 0;
    color: white !important;
    opacity: 0.8;
    position: absolute;
    top: 10px;
    left: 5px;

    &:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.1) !important;
    }
  }

  @include media-breakpoint-down(sm) {
    padding: 12px 16px;
    min-height: 60px;
    margin-bottom: 12px;

    &__content {
      gap: 12px;
    }

    &__text {
      gap: 2px;
    }

    &__button {
      padding: 6px 16px !important;
      font-size: 14px !important;
    }
  }
}
</style>
