<template>
  <QChip
    v-if="contactStatus?.lastContactAt"
    class="status-chip"
    color="white"
    :class="setStatusColor"
  >
    <QTooltip class="bg-black text-white text-caption">
      {{ contactStatus?.resultTitle || contactStatus?.lastContactResultTitle || 'بدون وضعیت' }}
    </QTooltip>
    <IconPhone width="16" height="16" />
    {{ lastContactTime }}
  </QChip>
  <span v-else>
    <QChip color="grey-3" class="status-chip">بدون وضعیت</QChip>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { IconPhone } from '@tabler/icons-vue'
import { convertToJalaliWithTime, toJalaali } from '@/utils/date-utils'

const props = defineProps({
  contactStatus: {
    type: Object,
    default: () => ({}),
  },
})
const contactStatus = computed(() => props.contactStatus)
const setStatusColor = computed(() => {
  const resultId = contactStatus.value?.lastContactResultId
  if (resultId === 20) {
    return 'last-contact-success'
  }
  if (resultId === 1) {
    return 'last-contact-danger'
  }
  if (resultId === 7 || resultId === 11) {
    return 'last-contact-get-call-later'
  }
  return 'last-contact-none'
})

const lastContactTime = computed(() => {
  const date = contactStatus.value?.lastContactAt
  if (!date) return ''

  const currentDate = new Date()
  const currentYear = toJalaali(currentDate).jy
  const dateYear = toJalaali(new Date(date)).jy

  if (currentYear === dateYear) {
    return convertToJalaliWithTime(date, 'jDD jMMMM | HH:mm')
  }
  return convertToJalaliWithTime(date, 'jD jMMMM jYYYY | HH:mm')
})
</script>

<style scoped lang="scss">
.status-chip {
  padding: 0.5rem 1rem;
  border-radius: $radius-2xl;
}

.last-contact-success {
  color: #509950;
  border: 1px solid #d1fad1;
  background-color: $green-light !important;
}

.last-contact-get-call-later {
  color: #775dd0;
  border: 1px solid #775dd0;
}

.last-contact-danger {
  color: #ff586e;
  border: 1px solid #ff586e;
}

.last-contact-none {
  color: rgb(124, 124, 124);
  border: 1px solid rgb(124, 124, 124);
}
</style>
