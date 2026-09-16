<template>
  <Modal
    :model-value="visible"
    title="جزییات طرح درمان"
    seamless
    :position="drawerPosition"
    :transition-show="drawerTransitionShow"
    :transition-hide="drawerTransitionHide"
    :transition-duration="700"
    :width="drawerWidth"
    card-class="tpp-drawer"
    @update:model-value="emit('update:visible', $event)"
  >
    <QScrollArea class="tpp-drawer__body">
      <div class="tpp-drawer__content">
        <Banner
          v-if="isTpError"
          class="tpp-drawer__banner"
          type="error"
          size="sm"
          title="خطا در بارگذاری طرح درمان"
        />

        <div v-if="isTpLoading" class="tpp-drawer__loading">
          <QSkeleton v-for="n in 4" :key="n" type="rect" height="120px" animation="fade" />
        </div>

        <div v-else-if="!isTpError && isEmptyPlan" class="tpp-drawer__empty" role="status">
          <IconDental size="40" class="text-grey-4" />
          <Typography variant="body" size="3" weight="bold">طرح درمانی ثبت نشده است</Typography>
        </div>

        <template v-else>
          <div class="tpp-drawer__meta">
            <Typography variant="caption" color="grey">شماره طرح درمان</Typography>
            <div class="tpp-drawer__meta-values">
              <Typography variant="body" size="4" weight="semibold">{{ tpId }}</Typography>
              <Badge
                variant="light"
                is-rounded
                :color="planStatus.badgeColor"
                :label="planStatus.label"
              />
            </div>
          </div>

          <div class="tpp-drawer__meta">
            <Typography variant="caption" color="grey">ایجاد کننده</Typography>
            <Typography variant="body" size="4">{{ creatorName }}</Typography>
          </div>

          <TpProvider mode="view" :treatment-plan-id="tpId">
            <TpuServicesListEdit
              :item-list="itemList"
              :calculate-item-price="calculateItemPrice"
              :is-edit="false"
              :is-expandable="false"
              :show-price="canViewCost"
              :show-title="false"
            />
          </TpProvider>
        </template>
      </div>
    </QScrollArea>
  </Modal>
</template>

<script setup>
import { computed } from 'vue'
import { QScrollArea, QSkeleton } from 'quasar'
import { IconDental } from '@tabler/icons-vue'
import Typography from '@/base/Typography'
import Modal from '@/base/Modal'
import Badge from '@/base/Badge'
import Banner from '@/base/Banner'
import TpProvider from '@/modules/TreatmentPlan/providers/TpProvider'
import TpuServicesListEdit from '@/modules/TreatmentPlan/components/TpUpsert/TpuServicesListEdit'
import { useGetServeItemsQuery, useGetTreatmentPlanByIdQuery } from '@/modules/TreatmentPlan/query'
import { getSelectedTeethAndServices } from '@/modules/TreatmentPlan/utils/teeth'
import { calculateItemPrice } from '@/modules/TreatmentPlan/utils/pricing'
import { useTpStatus } from '@/modules/TreatmentPlan/composables/use-tp-status'
import { getCreatorName } from '@/modules/TreatmentPlan/utils/creator'
import { getPerms } from '@/utils/get-perms'
import { TREATMENT_PLAN_STATUS_OPTIONS } from '@/modules/TreatmentPlan/constants/enums'
import { useIsMobile } from '@/composables/use-is-mobile'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  tpId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['update:visible'])
const isQueryEnabled = computed(() => props.visible && !!props.tpId)

const isMobile = useIsMobile()
const drawerPosition = computed(() => (isMobile.value ? 'top' : 'right'))
const drawerWidth = computed(() => (isMobile.value ? '100%' : '30dvw'))
const drawerTransitionShow = computed(() => (isMobile.value ? 'slide-down' : 'slide-left'))
const drawerTransitionHide = computed(() => (isMobile.value ? 'slide-up' : 'slide-right'))

const {
  data: tpData,
  isLoading: isTpLoading,
  isError: isTpError,
} = useGetTreatmentPlanByIdQuery(
  computed(() => props.tpId),
  { enabled: isQueryEnabled }
)

const { data: serveItems } = useGetServeItemsQuery(
  computed(() => ({ treatmentPlanId: props.tpId })),
  { enabled: isQueryEnabled }
)

const { backendStepNumber } = useTpStatus(tpData)

const itemList = computed(() =>
  getSelectedTeethAndServices(tpData, serveItems, backendStepNumber.value)
)

const isEmptyPlan = computed(() => !(tpData.value?.items?.length || tpData.value?.teeth?.length))

const creatorName = computed(() => getCreatorName(tpData.value?.createdBy, '—'))

const planStatus = computed(() => {
  const matched = TREATMENT_PLAN_STATUS_OPTIONS.find((option) => option.id === tpData.value?.status)
  return matched || { label: 'غیرفعال', badgeColor: 'grey' }
})

const canViewCost = computed(() => getPerms('treatment-plan', 'manage', false))
</script>

<style lang="scss">
.tpp-drawer {
  // Inline side anchoring + gap is owned by the base Modal drawer styles.
  height: 92dvh;
  border-radius: $radius-lg !important;

  &__body {
    flex: 1;
    min-height: 0;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: $spacing-sm;
  }

  &__banner {
    width: 100%;
  }

  &__loading {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    padding: $spacing-3xl $spacing-md;
    min-height: 300px;
    border: 1px solid $grey-3;
    border-radius: $radius-sm;
    text-align: center;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    padding: $spacing-sm;
    background: $white;
    border: 1px solid $grey-3;
    border-radius: $radius-sm;

    &-values {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: $spacing-xs;
    }
  }
}

// Mobile fallback only: the panel never opens on mobile (guarded in
// UserTpCard.openTpPanel) — these styles just keep the sheet sane if it is
// already open when the viewport shrinks below the lg breakpoint. The
// .q-dialog__inner prefix out-ranks Quasar's forced full-width rule on xs.
@include media-breakpoint-down(md) {
  .q-dialog__inner .tpp-drawer {
    margin: $spacing-md;
    width: calc(100% - #{$spacing-md * 2}) !important;
    height: 38dvh;
  }
}
</style>
