<template>
  <div class="utc-container">
    <!-- Error state -->
    <QBanner v-if="error" class="bg-negative text-white q-mb-md">
      خطا در بارگذاری طرح‌های درمان
    </QBanner>

    <div v-if="showSkeleton" class="utc-container__skeleton">
      <div class="row q-col-gutter-xs">
        <div class="col-12">
          <QSkeleton type="rect" height="48px" class="q-mb-md full-width" />
        </div>
      </div>
      <div class="row q-col-gutter-xs q-pa-sm full-width">
        <section class="col-auto col-grow">
          <div class="utc">
            <div class="utc__item">
              <div class="utc__content">
                <Typography variant="caption" color="grey">ایجاد کننده</Typography>
                <QSkeleton type="text" width="90px" />
              </div>
              <div class="utc__content">
                <QSkeleton type="rect" width="56px" height="26px" />
              </div>
              <div class="utc__content">
                <QSkeleton type="rect" width="104px" height="32px" />
              </div>
            </div>
          </div>
        </section>
        <section class="col-auto col-grow">
          <div class="utc">
            <div class="utc__item">
              <div class="utc__content">
                <Typography variant="caption" color="grey">کیف پول</Typography>
                <QSkeleton type="text" width="80px" />
              </div>
              <div class="utc__content">
                <Typography variant="caption" color="grey">مبلغ طرح درمان</Typography>
                <QSkeleton type="text" width="80px" />
              </div>
              <div class="utc__content">
                <Typography variant="caption" color="grey">مبلغ خدمات دریافتی</Typography>
                <QSkeleton type="text" width="80px" />
              </div>
              <div class="utc__content">
                <Typography variant="caption" color="grey">بدهی</Typography>
                <QSkeleton type="rect" width="70px" height="26px" />
              </div>
            </div>
          </div>
        </section>
        <section class="col-auto col-grow">
          <div class="utc">
            <div class="utc__item">
              <div class="utc__basic">
                <Typography variant="body" size="4">عکس های رادیولوژی</Typography>
                <QSkeleton type="rect" width="50px" height="50px" />
              </div>
            </div>
          </div>
        </section>
        <section class="col-auto col-grow">
          <div class="utc">
            <div class="utc__item">
              <div class="utc__basic">
                <Typography variant="body" size="4">سابقه بیماری</Typography>
                <QSkeleton type="rect" width="70px" height="26px" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="sortedTreatmentPlans.length === 0" class="utc__empty">
      <Typography variant="body" color="grey" class="text-center q-pa-md">
        هیچ طرح درمانی یافت نشد
      </Typography>
    </div>

    <div v-else>
      <div class="row q-col-gutter-xs">
        <div class="col-12">
          <QTabs
            v-model="activeTab"
            align="left"
            class="q-mb-md treatmentPlan__tabs"
            active-color="primary"
            indicator-color="primary"
            @update:model-value="handleChangeTab"
          >
            <QTab
              v-for="(tp, index) in sortedTreatmentPlans"
              :key="tp.id"
              :name="index"
              :label="'طرح درمان ' + (index + 1)"
            />
          </QTabs>
        </div>
        <QTabPanels v-model="activeTab" animated class="full-width">
          <QTabPanel
            v-for="(tp, index) in sortedTreatmentPlans"
            :key="tp.id"
            :name="index"
            class="q-pa-none"
          >
            <div class="row q-col-gutter-xs q-pa-sm full-width">
              <section class="col-auto col-grow">
                <div class="utc">
                  <div class="utc__item">
                    <div class="utc__content">
                      <Typography variant="caption" color="grey">ایجاد کننده</Typography>
                      <Typography variant="body" size="4">
                        {{ getCreatorName(tp.createdBy) }}
                      </Typography>
                    </div>
                    <div class="utc__content">
                      <!-- <Typography variant="caption" color="grey">وضعیت</Typography> -->
                      <QBadge
                        :class="['utc__status', `utc__status-${getStatusProps(tp.status).color}`]"
                        :label="getStatusProps(tp.status).label"
                      />
                    </div>
                    <!-- <div class="utc__content">
                      <Typography variant="caption" color="grey">شناسه طرح درمان</Typography>
                      <Typography variant="body" size="4">{{ tp.id }}</Typography>
                    </div> -->
                    <div class="utc__content">
                      <Button
                        variant="flat"
                        color="blue"
                        text="مشاهده طرح"
                        size="sm"
                        :left-icon="IconChevronLeft"
                        @click="openTpPanel(tp.id)"
                      />
                    </div>
                  </div>
                </div>
              </section>
              <section class="col-auto col-grow">
                <div
                  class="utc relative-position"
                  :class="['utc--clickable', isDebuted ? 'utc-debtor' : '']"
                >
                  <QInnerLoading :showing="isTotalCreditLoading" size="sm" />
                  <div class="utc__item">
                    <div class="utc__content">
                      <Typography variant="caption" color="grey">کیف پول</Typography>
                      <Typography variant="body" size="4" color="dark">
                        {{ totalBalanceAmount }}
                      </Typography>
                    </div>
                    <div class="utc__content">
                      <Typography variant="caption" color="grey">مبلغ طرح درمان</Typography>
                      <Typography variant="body" size="4" color="dark">
                        {{ generatePriceFormat(tp.totalCost) }}
                      </Typography>
                    </div>
                    <div class="utc__content">
                      <Typography variant="caption" color="grey">مبلغ خدمات دریافتی</Typography>
                      <Typography variant="body" size="4" color="dark">
                        {{ generatePriceFormat(totalCredit?.performedServesPrice) }}
                      </Typography>
                    </div>
                    <div class="utc__content">
                      <Typography variant="caption" color="grey">بدهی</Typography>
                      <QBadge
                        v-if="isDebuted"
                        color="negative"
                        class="q-pa-xs"
                        outline
                        rounded
                        :label="generatePriceFormat(debutedAmount)"
                      />
                      <QBadge
                        v-else
                        color="grey"
                        class="q-py-xs q-px-md"
                        outline
                        rounded
                        label="ندارد"
                      />
                    </div>

                    <div class="utc__beta-row">
                      <div v-if="tp.userIsBeta" class="utc__beta-badge">
                        <IconBeta size="16" />
                        <span>دارای بتا</span>
                      </div>

                      <IconChevronLeft
                        class="text-dark utc__beta-action"
                        @click="showFinancialDetails"
                      />
                    </div>
                  </div>
                </div>
              </section>
              <section class="col-auto col-grow">
                <div class="utc">
                  <div class="utc__item">
                    <div
                      class="utc__basic"
                      :class="{ 'utc__basic--disabled': userRadiologyFiles.length === 0 }"
                      @click="showRadiologyFiles"
                    >
                      <Typography variant="body" size="4">عکس های رادیولوژی</Typography>
                      <Button
                        variant="flat"
                        color="white"
                        :is-disabled="userRadiologyFiles.length === 0"
                        @click="showRadiologyFiles"
                      >
                        <template #default>
                          <img
                            v-if="userRadiologyFiles.length < 2"
                            :src="radiologySingle"
                            width="50px"
                            alt=""
                          />
                          <img
                            v-if="userRadiologyFiles.length > 1"
                            :src="radiologyMulti"
                            width="50px"
                            alt=""
                          />
                        </template>
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
              <section class="col-auto col-grow">
                <div class="utc">
                  <div class="utc__item">
                    <div
                      class="utc__basic"
                      :class="{ 'utc__basic--disabled': !hasDisease }"
                      @click="showDiseaseInfo"
                    >
                      <Typography variant="body" size="4">سابقه بیماری</Typography>
                      <Button
                        v-if="hasDisease"
                        variant="flat"
                        is-icon-only
                        color="grey"
                        :left-icon="IconChevronLeft"
                        @click="showDiseaseInfo"
                      />
                      <QBadge
                        v-if="!hasDisease"
                        color="grey"
                        label="ندارد"
                        rounded
                        class="q-py-sm q-px-md"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </QTabPanel>
        </QTabPanels>
      </div>
    </div>
  </div>

  <ImagePreviewModal v-model="showImagesPreview" :images="userRadiologyFiles">
    <template #extra-actions>
      <div class="utc__upload-btn" @click="openUploadDialog">
        <IconPlus size="20" />
        <Typography variant="body" size="3" color="dark">افزودن</Typography>
      </div>
    </template>
  </ImagePreviewModal>
  <UserRadiologyUploader
    ref="uploaderRef"
    :user-id="userId"
    default-type="user.opg"
    :allowed-types="['user.opg', 'user.cbct', 'user.docs']"
    @upload-complete="handleUploadComplete"
  />
  <UserDiseaseDialog v-model:visible="showDiseaseDialog" :data="diseaseInfo" />
  <TpPermanentPanel
    :visible="showTpPanel"
    :tp-id="selectedTpId"
    @update:visible="showTpPanel = $event"
  />
  <FinancialDetailsDialog
    v-model:visible="showFinancialDialog"
    :credit-data="creditData"
    :treatment-plan="sortedTreatmentPlans[activeTab] ?? {}"
    :total-cost="sortedTreatmentPlans[activeTab]?.totalCost"
    :treatment-plan-id="currentTreatmentPlanId"
  />
</template>
<script setup>
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import { IconChevronLeft, IconBeta, IconPlus } from '@tabler/icons-vue'
import radiologySingle from '@/assets/images/radiology1.png'
import radiologyMulti from '@/assets/images/radiology2.png'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import {
  useGetTreatmentPlanTotalCreditQuery,
  useTreatmentPlanInfinityQuery,
} from '@/modules/TreatmentPlan/query/index'
import { TREATMENT_PLAN_ACTIVE_STATUS } from '@/modules/TreatmentPlan/constants/enums'
import { getCreatorName } from '@/modules/TreatmentPlan/utils/creator'
import { generatePriceFormat } from '@/utils/formatter'
import { useGetFilesByType, useGetMedicalInfoQuery } from '@/modules/User/query/index'
import { FILE_TYPE_ENUM } from '@/modules/User/enums/fileTypeEnums'
import { useIsMobile } from '@/composables/use-is-mobile'
import UserRadiologyUploader from '@/modules/User/components/UserDetails/UserDetailsComponents/UserMedicalDocs/components/UserRadiologyUploader'

const emits = defineEmits(['change:tab', 'plans-ready'])
const props = defineProps({
  userData: {
    type: [Array, Object],
    default: () => {},
  },
  medicalInfo: {
    type: [Array, Object],
    default: () => {},
  },
})

const ImagePreviewModal = defineAsyncComponent(
  () => import('@/components/common/ImagePreviewModal')
)
const UserDiseaseDialog = defineAsyncComponent(() => import('./UserDiseasesDialog'))
const TpPermanentPanel = defineAsyncComponent(
  () => import('@/modules/TreatmentPlan/components/TpDescription/TpPermanentPanel')
)
const FinancialDetailsDialog = defineAsyncComponent(() => import('./FinancialDetailsDialog'))

const activeTab = ref(0)
const showImagesPreview = ref(false)
const showDiseaseDialog = ref(false)
const showFinancialDialog = ref(false)
const showTpPanel = ref(false)
const selectedTpId = ref(null)
const isMobile = useIsMobile()
const userId = computed(() => props.userData?.userId || props.userData?.user?.id)
const tpQueryEnabled = computed(() => {
  const id = userId.value
  return id !== undefined && id !== null && id !== ''
})
const userDiseaseEnabled = computed(() => !!userId.value)

const filters = computed(() => ({
  'filter[user_id]': userId.value,
}))

const {
  data: tpData,
  isSuccess,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
  error,
} = useTreatmentPlanInfinityQuery(filters, {
  enabled: tpQueryEnabled,
  refetchOnMount: true,
  staleTime: 30_000,
})

const plansReady = computed(() => isSuccess.value || !!error.value)

watch(
  plansReady,
  (ready) => {
    if (ready) emits('plans-ready')
  },
  { immediate: true }
)

const allTreatmentPlans = computed(() => {
  if (!tpData.value?.pages) return []
  return tpData.value.pages.flatMap((page) => page?.data?.items ?? [])
})

const sortedTreatmentPlans = computed(() => {
  if (allTreatmentPlans.value.length === 0) return []
  return [...allTreatmentPlans.value].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA
  })
})

const { data: files, isLoading: isMedicalInfoFilesLoading } = useGetFilesByType(
  userId,
  FILE_TYPE_ENUM.MEDICAL,
  {
    enabled: () => !!userId.value,
    staleTime: 30_000,
  }
)
const userRadiologyFiles = computed(
  () =>
    files.value?.items.filter(
      (file) => file.status?.id === 15 || file.status?.slug === 'verified'
    ) || []
)

const { data: diseaseInfo, isLoading: isLoadingdisease } = useGetMedicalInfoQuery(userId, {
  enabled: () => userDiseaseEnabled.value,
  staleTime: 30_000,
})

const hasDisease = computed(() => diseaseInfo.value?.diseases?.length > 0)

const currentTreatmentPlanId = computed(() => {
  const plans = sortedTreatmentPlans.value
  if (!plans?.length || activeTab.value >= plans.length) return null
  return plans[activeTab.value]?.id ?? null
})

const creditEnabled = computed(() => !!currentTreatmentPlanId.value)

const { data: totalCredit, isLoading: isTotalCreditLoading } = useGetTreatmentPlanTotalCreditQuery(
  currentTreatmentPlanId,
  {
    enabled: () => creditEnabled.value,
  }
)

const creditData = computed(() => totalCredit.value ?? {})
const isDebuted = computed(() => creditData.value?.balance < 0)
const debutedAmount = computed(() =>
  creditData.value?.balance < 0 ? Math.abs(creditData.value.balance) : 0
)

const initialLoadComplete = ref(false)
watch(
  [plansReady, isTotalCreditLoading, isMedicalInfoFilesLoading, isLoadingdisease],
  ([ready, credit, filesLoading, disease]) => {
    if (ready && !credit && !filesLoading && !disease) initialLoadComplete.value = true
  },
  { immediate: true }
)

const showSkeleton = computed(() => !initialLoadComplete.value)

const totalBalanceAmount = computed(() =>
  creditData.value?.credit < 0
    ? generatePriceFormat(Math.abs(creditData.value?.credit), '-')
    : generatePriceFormat(creditData.value.credit)
)

// The details drawer is desktop-only: on mobile the add-description sheet
// takes the whole screen, so the panel must never open there.
const openTpPanel = (tpId) => {
  if (isMobile.value) return
  selectedTpId.value = tpId
  showTpPanel.value = true
}

const closeTpPanel = () => {
  showTpPanel.value = false
}

defineExpose({ openTpPanel, closeTpPanel })

const getStatusProps = (status) => {
  switch (status) {
    case TREATMENT_PLAN_ACTIVE_STATUS.ACTIVE: {
      return { label: 'فعال', color: 'active' }
    }
    case TREATMENT_PLAN_ACTIVE_STATUS.COMPLETED: {
      return { label: 'پایان یافته', color: 'completed' }
    }
    case TREATMENT_PLAN_ACTIVE_STATUS.INACTIVE: {
      return { label: 'غیرفعال', color: 'inactive' }
    }
    default: {
      return { label: 'غیرفعال', color: 'inactive' }
    }
  }
}
const uploaderRef = ref(null)

const showRadiologyFiles = () => {
  if (!userRadiologyFiles.value || userRadiologyFiles.value.length === 0) {
    uploaderRef.value?.openUploadDialog()
    return
  }
  showImagesPreview.value = true
}

const openUploadDialog = () => {
  uploaderRef.value?.openUploadDialog()
}

const handleUploadComplete = () => {
  showImagesPreview.value = true
}

const showDiseaseInfo = () => {
  if (diseaseInfo.value?.diseases?.length === 0) return
  showDiseaseDialog.value = true
}

const showFinancialDetails = () => {
  showFinancialDialog.value = true
}

const handleChangeTab = () => {
  emits('change:tab', sortedTreatmentPlans.value[activeTab.value]?.id)
}

watch(hasNextPage, async (hasNext) => {
  if (hasNext && !isFetchingNextPage.value) {
    await fetchNextPage()
  }
})

watch(
  sortedTreatmentPlans,
  (plans) => {
    if (plans.length > 0) {
      const activeIndex = plans.findIndex((tp) => tp.isActive === true)
      if (activeIndex !== -1) {
        activeTab.value = activeIndex
        emits('change:tab', sortedTreatmentPlans.value[activeTab.value]?.id)
      }
    }
  },
  { immediate: true }
)
</script>
<style scoped lang="scss">
.treatmentPlan__tabs {
  border-bottom: 1px solid #eeeeee;
}
.utc-container {
  width: 100%;

  &__skeleton {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    padding: $spacing-sm 0;
  }
}

.utc {
  width: 100%;
  border: 1px solid $grey-3;
  border-radius: $radius-md;
  padding: $spacing-md $spacing-sm;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  transition: all 0.3s ease-in-out;
  &:hover {
    border-color: $light-blue-filled;
  }
  &-debtor {
    background-color: $red-light;
    border: 1px solid $red-4;
    transition: all 0.3s ease-in-out;

    &:hover {
      border-color: $red-outline-hover;
      transition: all 0.3s ease-in-out;
    }
  }

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
    cursor: not-allowed;
    filter: grayscale(100%);
  }

  &__item {
    display: flex;
    flex-wrap: balance;
    padding: $spacing-sm;
    width: 100%;
    gap: $spacing-md;
    align-items: center;
    justify-content: space-between;
    min-height: 50px;

    @include media-breakpoint-down(sm) {
      flex-wrap: wrap;
    }
  }

  &__content {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    align-items: flex-start;
    padding: 0 $spacing-md;
  }

  &__basic {
    width: 100%;
    height: 100%;
    display: flex;
    gap: $spacing-md;
    align-items: center;
    justify-content: space-between;
    padding: 0 $spacing-md;
    cursor: pointer;
    transition: all 0.3s ease-in-out;

    &--disabled {
      opacity: 0.6;
      cursor: not-allowed;
      // pointer-events: none;
      filter: grayscale(80%);
    }

    &:hover:not(&--disabled) {
      background-color: $grey-1;
      border-radius: $radius-sm;
    }
  }

  &__status {
    border-radius: $radius-lg;
    padding: $spacing-sm $spacing-md;
    &-active {
      background-color: $green-1;
      color: $green-6;
    }
    &-completed {
      background-color: $red-1;
      color: $red-6;
    }
    &-inactive {
      background-color: $grey-1;
      color: $grey-6;
    }
  }

  &__empty {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: $spacing-lg;
  }

  &__beta-row {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    @include media-breakpoint-down(sm) {
      margin-inline-start: auto;
    }
  }

  &__beta-badge {
    border-radius: $radius-2xl;
    background-color: rgba($dark-5, $opacity-light);
    color: $dark-5;
    padding: $spacing-xxs $spacing-sm;
    font-size: $spacing-sm + $spacing-xs;
    font-weight: 500;
    display: flex;
    align-items: center;
  }

  &__beta-action {
    cursor: pointer;
  }

  &__upload-btn {
    display: flex;
    align-items: center;
    gap: $spacing-xxs;
    background-color: $white;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-lg;
    cursor: pointer;
    margin-left: auto;
    transition: background-color 0.2s ease;
    position: absolute;
    bottom: 17%;
    left: 2.5%;

    &:hover {
      background-color: $grey-1;
    }
  }
}
.divider {
  width: 0.1px;
  background-color: $grey-3;
}
</style>
