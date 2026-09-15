<template>
  <div class="row items-center q-gutter-xs">
    <div>
      <IconCoin width="24" height="24" :class="prepayStatus.color" stroke="1.5" />
      <QTooltip class="bg-black text-white text-caption">
        {{ prepayStatus.title }}
      </QTooltip>
    </div>
    <div>
      <IconAddressBook
        width="24"
        :class="user.hasTreatmentPlan ? 'text-positive' : 'text-info'"
        stroke="1.5"
      />
      <QTooltip class="bg-black text-white text-caption">
        {{ user.hasTreatmentPlan ? 'طرح درمان دارد' : 'طرح درمان ندارد' }}
      </QTooltip>
    </div>
    <div>
      <IconFileTypeDoc
        width="24"
        :class="user.hasFile ? 'text-positive' : 'text-info'"
        stroke="1.5"
      />
      <QTooltip class="bg-black text-white text-caption">
        {{ user.hasFile ? 'مدارک دارد' : 'مدارک ندارد' }}
      </QTooltip>
    </div>
    <div class="icon-wrapper">
      <QTooltip class="bg-black text-white text-caption">
        {{ `${user.contactCount} تماس ` }}
      </QTooltip>
      <IconPhone width="24" :class="user.contactCount > 0 ? 'text-blue' : 'text-secondary'" />
      <QBadge v-if="user.contactCount > 0" floating color="amber" :label="user.contactCount" />
    </div>
    <div class="icon-wrapper">
      <QTooltip class="bg-black text-white text-caption">
        {{ `${user.taskCount} وظیفه - ${user.activeTaskCount} وظیفه فعال` }}
      </QTooltip>
      <IconChecklist
        name="today"
        size="24px"
        :class="user?.activeTaskCount > 0 ? 'text-positive' : 'text-info'"
        width="24"
      />
      <QBadge
        v-if="user?.activeTaskCount > 0"
        class="q-badge--floating"
        :label="user.activeTaskCount > 0 ? user.activeTaskCount : ''"
        color="red"
        rounded
      />
    </div>
    <div class="icon-wrapper">
      <QTooltip class="bg-black text-white text-caption">
        بتا ({{ getBranchLabel(user.betaUser?.branch?.id) }})
      </QTooltip>
      <IconBeta width="24" :class="user?.isBeta ? 'text-positive' : 'text-info'" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  IconAddressBook,
  IconCoin,
  IconFileTypeDoc,
  IconPhone,
  IconChecklist,
  IconBeta,
} from '@tabler/icons-vue'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import { getBranchLabel } from '@/utils/branch-utils'

const props = defineProps(['user'])

const generatePriceFormat = (amount) => {
  if (!amount) return 'نامشخص'
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
const generateDate = (date) => {
  if (!date) return 'نامشخص'
  return convertToJalaliWithTime(date, 'HH:mm jYYYY/jMM/jDD')
}
const prepayStatus = computed(() => {
  const { activeTreatmentPlan } = props.user
  if (activeTreatmentPlan) {
    if (!activeTreatmentPlan.extraditionAt && activeTreatmentPlan.prepayAt) {
      return {
        title: `${generatePriceFormat(activeTreatmentPlan.prepay)} تومان | ${generateDate(activeTreatmentPlan.prepayAt)}`,
        color: 'text-amber',
      }
    }
    if (activeTreatmentPlan.extraditionAt) {
      return { title: 'عودت داده شده', color: 'text-negative' }
    }
    if (!activeTreatmentPlan.extraditionAt && !activeTreatmentPlan.prepayAt) {
      return { title: 'بیعانه ندارد', color: 'text-secondary' }
    }
  }
  return { title: 'بیعانه ندارد', color: 'text-secondary' }
})
</script>

<style scoped lang="scss">
.stats-tooltip {
  background-color: $black !important;
  color: $white;
  font-size: map-get($subtitle2, size);
}

.icon-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  .q-badge--floating {
    top: -10px;
    right: -8px;
  }
}
</style>
