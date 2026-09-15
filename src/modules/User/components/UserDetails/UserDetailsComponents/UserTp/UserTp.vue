<template>
  <QScrollArea class="scroll-area" :thumb-style="thumbStyle">
    <div class="user-treatment-plan">
      <div class="user-treatment-plan__container">
        <div class="row items-center justify-between q-mb-md">
          <div class="col flex items-center">
            <Typography
              variant="heading"
              size="h6"
              weight="bold"
              class="q-my-none q-mb-sm user-treatment-plan__title"
            >
              طرح درمان
            </Typography>
            <QBtn
              flat
              round
              dense
              icon="refresh"
              class="user-treatment-plan__header-icon q-ml-sm"
              @click="updateTable"
            />
            <RouterLink :to="{ name: 'treatment-plan-list', query: queryParams }" target="_blank">
              <QBtn
                flat
                round
                dense
                icon="open_in_new"
                class="user-treatment-plan__header-icon q-ml-sm"
              />
            </RouterLink>
          </div>
        </div>

        <div v-if="isLoading && !userTreatmentPlanData?.length" class="row justify-center q-pa-xl">
          <QSpinnerDots size="50px" color="primary" />
        </div>

        <div v-else class="row q-col-gutter-md">
          <div v-for="plan in userTreatmentPlanData" :key="plan.id" class="col-12">
            <QCard
              class="user-treatment-plan__card"
              :class="{
                'user-treatment-plan__card--draft': plan.isDraft && !plan.isProposed,
              }"
            >
              <QCardSection class="q-pb-xs">
                <div class="row items-center">
                  <div class="col">
                    <div class="row text-subtitle text-weight-bold items-center">
                      <span>طرح درمان {{ plan.id }}</span>
                    </div>
                    <div class="text-caption text-grey-6">
                      {{ plan?.createdBy?.firstName || '' }} {{ plan?.createdBy?.name || '' }} -
                      {{
                        plan.createdAt ? convertToJalaliWithTime(plan.createdAt) : 'تاریخ نامشخص'
                      }}

                      <QBadge
                        v-if="getStepStatus(plan)"
                        :style="getBadgeStyle(getStepStatus(plan).color)"
                        :label="getStepStatus(plan).label"
                        class="q-pa-sm q-mr-sm custom-badge"
                      />
                      <QBadge
                        v-if="getVisitTypeStatus(plan)"
                        :style="getVisitTypeBadgeStyle()"
                        :label="getVisitTypeStatus(plan).label"
                        class="q-pa-sm q-mr-sm custom-badge"
                      />
                    </div>
                  </div>
                  <div class="row q-mb-sm">
                    <div class="col-auto row items-center">
                      <QBtn
                        v-if="cbctBtnVisible.visible && cbctBtnVisible.id === plan.id"
                        outline
                        color="primary"
                        label="عکس CBCT"
                        rounded
                        @click="showCbctFiles"
                      />
                      <QCardActions align="right" class="q-pt-none">
                        <UserTpDropDown
                          :plan="plan"
                          :edit-treatment-plan="editTreatmentPlan"
                          :update-table="updateTable"
                        />
                      </QCardActions>
                    </div>
                  </div>
                </div>
              </QCardSection>

              <QCardSection class="q-pt-xs">
                <UserTpTabs :plan="plan" @toggle:review="showCbctBtn($event)" />
              </QCardSection>
            </QCard>
          </div>
        </div>

        <div
          v-if="userTreatmentPlanData?.length"
          class="user-treatment-plan__load-more row justify-center"
        >
          <QBtn
            :loading="isFetchingNextPage"
            :disable="!hasNextPage"
            outline
            color="primary"
            @click="loadNextPage"
          >
            <template v-if="hasNextPage">
              نمایش موارد بیشتر
              <QIcon name="keyboard_arrow_down" class="q-ml-xs" />
            </template>
            <template v-else>مورد بیشتری وجود ندارد</template>
          </QBtn>
        </div>

        <div
          v-if="!isLoading && (!userTreatmentPlanData || userTreatmentPlanData.length === 0)"
          class="user-treatment-plan__empty row justify-center q-pa-xl"
        >
          <div class="col-12 text-center">
            <QIcon
              name="search_off"
              size="64px"
              color="grey-5"
              class="user-treatment-plan__empty-icon q-mb-md"
            />
            <div class="user-treatment-plan__empty-title text-h6 text-grey-6 q-mb-sm">
              هیچ طرح درمانی یافت نشد
            </div>
            <div class="user-treatment-plan__empty-text text-body2 text-grey-5">
              هنوز طرح درمانی برای این کاربر ثبت نشده است
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="info-section">
      <IconInfoHexagon />
      <span class="q-mr-sm" style="font-size: 12px">
        تمامی مبالغ با احتساب تخفیف محاسبه شده اند
      </span>
    </div>

    <ImagePreviewModal v-model="showImagePreview" :images="userCbctFiles" />
  </QScrollArea>
</template>

<script setup>
import { computed, ref } from 'vue'
import Typography from '@/base/Typography'
import { useTreatmentPlanInfinityQuery } from '@/modules/TreatmentPlan/query/index'
import { useQueryClient } from '@tanstack/vue-query'
import UserTpTabs from '@/modules/User/components/UserDetails/UserDetailsComponents/UserTp/UserTpTabs'
import UserTpDropDown from '@/modules/User/components/UserDetails/UserDetailsComponents/UserTp/UserTpDropDown'
import ImagePreviewModal from '@/components/common/ImagePreviewModal'
import { IconInfoHexagon } from '@tabler/icons-vue'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import { useGetUserDocumentFile } from '@/modules/User/query'
import { Notif } from '@/data/services/notification-service'
import { VISIT_TYPE, TREATMENT_PLAN_STATUS } from '@/modules/TreatmentPlan/constants/enums'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import { mockGetTreatmentPlans } from '@/mocks/user-details/treatment-plan'

const props = defineProps({
  propData: {
    type: Number,
    default: null,
  },
  tabId: {
    type: Number,
    default: null,
  },
})

const thumbStyle = {
  borderRadius: '5px',
  backgroundColor: '#027be3',
  width: '5px',
  opacity: '0.75',
}
const queryClient = useQueryClient()

const filters = ref({
  'filter[user_id]': props.propData,
})
const cbctBtnVisible = ref({
  visible: false,
  id: null,
})
const showImagePreview = ref(false)

const enabled = computed(() => !!props.propData)
const {
  data: treatmentPlanData,
  isLoading,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
} = useTreatmentPlanInfinityQuery(filters, {
  enabled,
  ...(ENABLE_USER_DETAIL_MOCKS
    ? { queryFn: ({ pageParam }) => mockGetTreatmentPlans(pageParam) }
    : {}),
})

const userTreatmentPlanData = computed(() => {
  return treatmentPlanData.value?.pages?.flatMap((pageData) => {
    return pageData.data.items.map((item) => ({
      ...item,
      creator: item?.createdBy?.name,
      installmentCount: item?.installment?.month,
    }))
  })
})

const getStepStatus = (plan) => {
  if (plan.isDraft && !plan.isPerformed && !plan.isProposed) {
    return {
      label: 'پیش نویس',
      color: 'orange',
    }
  }

  if (plan.status === TREATMENT_PLAN_STATUS.COMPLETED) {
    return {
      label: 'طرح درمان تمام شده',
      color: 'grey-6',
    }
  }

  if (plan.status === TREATMENT_PLAN_STATUS.PERFORMED) {
    return {
      label: 'طرح درمان فعال',
      color: 'positive',
    }
  }

  return {
    label: 'طرح درمان غیرفعال',
    color: 'grey-6',
  }
}

const getVisitTypeStatus = (plan) => {
  if (!plan.visitType) return null

  if (plan.visitType.id === VISIT_TYPE.IN_PERSON) {
    return {
      label: 'حضوری',
      color: 'grey-6',
    }
  }
  if (plan.visitType.id === VISIT_TYPE.ONLINE) {
    return {
      label: 'آنلاین',
      color: 'grey-6',
    }
  }
  return null
}

const getBadgeStyle = (color) => {
  const colorMap = {
    primary: '#1976d2',
    secondary: '#26a69a',
    positive: '#21ba45',
    negative: '#c10015',
    info: '#31ccec',
    warning: '#f2c037',
    grey: '#757575',
    'grey-6': '#757575',
    orange: '#ff9800',
  }

  const baseColor = colorMap[color] || color

  return {
    backgroundColor: `${baseColor}15`,
    border: `1px solid ${baseColor}80`,
    color: baseColor,
  }
}

const getVisitTypeBadgeStyle = () => {
  return {
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    color: '#757575',
  }
}

const { data: userDocument } = useGetUserDocumentFile(props.propData, {
  enabled: cbctBtnVisible.value,
})
const userCbctFiles = computed(
  () => userDocument.value?.items?.filter((file) => file.type === 'user.cbct') || []
)

const loadNextPage = () => {
  if (!hasNextPage.value) return
  fetchNextPage()
}

const updateTable = async () => {
  await queryClient.invalidateQueries({
    queryKey: ['treatment-plan', 'all-treatment-plans', filters],
  })
  Notif.success('لیست بروزرسانی شد')
}

const editTreatmentPlan = (plan) => {
  const treatmentPlanVersion = plan.version
  treatmentPlanVersion === 1
    ? window.open(`/treatment-plan?userId=${plan.user.id}&id=${plan.id}&mode=edit`, '_blank')
    : window.open(`/treatment-plan/edit/${plan.id}`, '_blank')
}

const queryParams = computed(() => {
  const query = {}
  Object.keys(filters.value).forEach((key) => {
    const newKey = key.replace('filter[', '').replace(']', '')
    query[newKey] = filters.value[key]
  })
  return query
})

const showCbctBtn = (e) => {
  cbctBtnVisible.value.visible = e.visible
  cbctBtnVisible.value.id = e.id
}

const showCbctFiles = () => {
  if (!userCbctFiles.value || userCbctFiles.value.length === 0) {
    Notif.warning('فایلی وجود ندارد')
    return
  }
  showImagePreview.value = true
}
</script>

<style lang="scss" scoped>
.scroll-area {
  height: 75dvh;
}

.user-treatment-plan {
  -webkit-user-select: none;
  -webkit-user-drag: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  &__container {
    height: 100%;
  }

  &__title {
    margin: map-get($space-sm, x);
  }

  &__card {
    transition: all 0.3s ease;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid $grey-4;
    background-color: $grey-1;
    box-shadow: none;
    margin-bottom: map-get($space-md, x);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &--draft {
      border-left: 4px solid $blue-2;
    }
  }

  &__view-icon {
    cursor: pointer;
    color: $grey-6;
    transition: color 0.3s ease;

    &:hover {
      color: $primary;
    }
  }

  &__view-btn {
    border-radius: 8px;
  }

  &__financial-info {
    background: $grey-1;
    border-radius: 8px;
  }

  &__header-icon {
    color: $grey-6;
    transition: 0.3s all;
    cursor: pointer;
    margin-right: map-get($space-sm, x);

    &:hover {
      color: $primary;
    }
  }

  &__empty {
    &-icon {
      opacity: 0.7;
    }

    &-title {
      font-weight: map-get($h6, weight);
      font-size: map-get($h6, size);
      color: $grey-7;
      margin: 0;
    }

    &-text {
      font-weight: map-get($subtitle1, weight);
      font-size: map-get($subtitle1, size);
      color: $grey-6;
      opacity: 0.8;
    }
  }

  &__load-more {
    margin-top: map-get($space-lg, x);
    text-align: center;
  }
}

.custom-badge {
  border-radius: 8px;
  font-weight: 500;
}

.table-icon {
  color: $grey-6;
  transition: 0.3s all;
  cursor: pointer;
  margin-right: map-get($space-sm, x);

  &:hover {
    color: $primary;
  }
}

.info-section {
  width: 100%;
  background-color: $grey-3;
  padding: 0.5rem;
  border-radius: 12px;
  margin: 10px auto;
}
@media (max-width: 768px) {
  .user-treatment-plan__card {
    margin-bottom: map-get($space-md, x);
  }
}
</style>
