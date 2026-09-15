<template>
  <div class="tph">
    <div class="tph__right">
      <IconArrowRight
        v-if="props.showBack"
        stroke="2"
        class="tph__right-back-icon"
        @click="onBack"
      />
      <img :src="logo" alt="Sitra Panel" />
      <span v-if="props.showPreviewUser">پیش نمایش طرح درمان</span>
      <span v-else-if="isDraft">پیش نویس طرح درمان</span>
      <span v-else>پنل تعیین قیمت</span>
    </div>
    <div class="tph__action">
      <div class="tph__action">
        <div v-if="showPreviewUser" class="tph__action-user">
          <TppUser />
        </div>
        <div v-else class="tph__action-user">
          <TreatmentPlanUser />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { IconArrowRight } from '@tabler/icons-vue'
import TreatmentPlanUser from './TpUser'
import TppUser from '../TpPreview/TppUser'
import { useTpStatus } from '../../composables/use-tp-status'

const props = defineProps({
  showBack: {
    type: Boolean,
    default: false,
  },
  showRefresh: {
    type: Boolean,
    default: false,
  },
  showPreviewUser: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()
const { isDraft: isDraftComposable } = useTpStatus()
const isDraft = props.showPreviewUser ? null : isDraftComposable

const logo = computed(
  () =>
    JSON.parse(localStorage.getItem('crm-theme-settings'))?.logo ||
    'https://api.cdn.sitracrm.ir/franchise/_logo/default/app-icon.png'
)

const onBack = () => {
  if (props.showPreviewUser) {
    router.push('/treatment-plan/treatment-plan-list')
  } else {
    router.push('/treatment-plan/treatment-plan-list')
  }
}
</script>

<style lang="scss" scoped>
.tph {
  background-color: $white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  min-height: 3rem;

  &__right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;

    &-back-icon {
      cursor: pointer;
      margin: 0.5rem;
    }

    img {
      width: 4rem;
    }
  }

  &__action {
    display: flex;
    align-items: center;

    gap: 0.5rem;
  }
}
</style>
