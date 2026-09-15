<template>
  <div class="tpa">
    <template v-if="mode === 'edit'">
      <div class="tpa__header">
        <div class="tpa__header-content">
          <div v-if="isActive" class="tpa__active">
            <QBtn class="tpa__inactive-button" color="green" outline :loading="loadingList" disable>
              طرح درمان فعال است
            </QBtn>
          </div>
          <div v-else-if="!isCompletedTp && isSuccessActive" class="tpa__inactive">
            <QBtn
              v-if="canActivateTreatmentPlan()"
              class="tpa__inactive-button"
              color="primary"
              :loading="loadingList"
              @click="onActivateTreatment"
            >
              فعال کردن طرح درمان
            </QBtn>
          </div>
        </div>
        <div v-if="canCompleteTreatmentPlan || treatmentData?.prepayAt" class="tpa__header-actions">
          <QBtn flat round size="sm" color="primary">
            <IconDotsVertical />
            <QMenu class="tpa__menu">
              <QList class="tpa__menu-list">
                <QItem
                  v-if="mode === 'edit' && treatmentData?.prepayAt"
                  v-close-popup
                  clickable
                  class="tpa__menu-item tpa__menu-item--prepay"
                  :class="{ 'tpa__menu-item--returned': treatmentData?.extraditionAt }"
                  @click="onExtraditePrepay"
                >
                  <QItemSection avatar>
                    <QIcon name="keyboard_return" color="pink-7" />
                  </QItemSection>
                  <QItemSection>
                    {{ treatmentData?.extraditionAt ? 'بیعانه عودت داده شده' : 'عودت بیعانه' }}
                  </QItemSection>
                </QItem>
                <QItem
                  v-if="canCompleteTreatmentPlan"
                  v-close-popup
                  clickable
                  class="tpa__menu-item tpa__menu-item--complete"
                  @click="onCompleteTreatmentPlan"
                >
                  <QItemSection avatar>
                    <IconCheck size="20" />
                  </QItemSection>
                  <QItemSection>اتمام طرح درمان</QItemSection>
                </QItem>
              </QList>
            </QMenu>
          </QBtn>
        </div>
      </div>

      <div v-if="isActive" class="tpa__description">
        این طرح درمان برای این کاربر فعال است و در نوبت دهی انجام کار و گزارشها استفاده می شود. ممکن
        است. ویرایش بخش هایی از طرح درمان در زمان انجام خدمات امکان پذیر نباشد.
      </div>

      <div
        v-else-if="!isCompletedTp && isSuccessActive && activeTreatment?.id"
        class="tpa__description"
      >
        <div>
          این کاربر طرح درمان فعال دیگری دارد
          <RouterLink
            class="tpa__inactive-link"
            :to="{
              path: '/treatment-plan/treatment-plan-list',
              query: { userId, userMobile },
            }"
            target="_blank"
          >
            مشاهده طرح درمان های کاربر
          </RouterLink>
        </div>
        <div class="tpa__inactive-subtitle">
          با فعال کردن طرح درمان این طرح درمان به عنوان پلن درمانی شخص انتخاب خواهد شد و در نوبت دهی
          انجام کار و گزارش ها استفاده خواهد شد
        </div>
      </div>
    </template>

    <div v-if="isCompletedTp && !isActive">
      <QChip class="tpa__complete" color="negative" outline>طرح درمان جاری پایان یافته است</QChip>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed, watch } from 'vue'
import { handleError } from '@/utils/error-handler'
import { formatDate } from '@/utils/date-utils'
import { useTpProvider } from '../../composables/use-tp-provider'
import { TREATMENT_PLAN_STATUS } from '../../constants/enums'
import {
  useGetTreatmentPlanByIdQuery,
  useActivateTreatmentPlanMutation,
  useGetUserActivateTreatmentPlanQuery,
  useCompleteTreatmentPlanMutation,
  useTransmissionTreatmentPlanPrepayMutation,
  useExtraditePrepayMutation,
} from '../../query'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import { useTpPermissions } from '../../composables/use-tp-permissions'
import { useTpStatus } from '../../composables/use-tp-status'
import { IconCheck, IconDotsVertical } from '@tabler/icons-vue'

const { treatmentData, updateTreatment } = useTpProvider(['treatmentData', 'updateTreatment'])
const { mode, isCompletedTp } = useTpStatus(treatmentData)
const route = useRoute()

const { canActivateTreatmentPlan, canCloseTreatmentPlan } = useTpPermissions()
const { isSuccess } = useGetTreatmentPlanByIdQuery(route.params?.id)
const { mutate: completeTreatmentPlan } = useCompleteTreatmentPlanMutation()
const { mutate: transmissionTreatmentPlanPrepay, isPending: isPendingTransmissionPrepay } =
  useTransmissionTreatmentPlanPrepayMutation()
const { mutate: extradite } = useExtraditePrepayMutation()

const isActive = computed(() => treatmentData?.value?.isActive)

const userId = computed(() => isSuccess.value && !isActive.value && treatmentData?.value?.user?.id)
const userMobile = computed(
  () => isSuccess.value && !isActive.value && treatmentData.value?.user?.mobile
)

const treatmentPlanId = route.params?.id
const enabled = computed(() => !!userId.value)

const { mutate: activateTreatmentPlan, isPending } = useActivateTreatmentPlanMutation()
const { data: activeTreatment, isSuccess: isSuccessActive } = useGetUserActivateTreatmentPlanQuery(
  userId,
  { enabled }
)
const loadingList = computed(() => isPendingTransmissionPrepay.value || isPending.value)
const hasAnotherActivePlan = computed(() => activeTreatment.value?.id)
const canCompleteTreatmentPlan = computed(
  () =>
    isActive.value &&
    !isCompletedTp.value &&
    canCloseTreatmentPlan() &&
    treatmentData?.value?.isPerformed
)
const activeTp = () => {
  activateTreatmentPlan(treatmentPlanId, {
    onSuccess: () => {
      Notif.success('طرح درمان با موفقیت فعال شد')
      updateTreatment({ isActive: true })
    },
    onError: (e) => handleError(e, { glitchtipLog: false, showToast: true }),
  })
}
const transmissionPrepay = () => {
  confirmDialog(
    'انتقال بیعانه',
    'آیا با انتقال بیعانه کاربر بر روی این طرح درمان موافق هستین؟',
    () => {
      transmissionTreatmentPlanPrepay(
        { originId: activeTreatment.value?.id, destinationId: treatmentPlanId },
        {
          onSuccess: () => {
            Notif.success('بیعانه با موفقیت فعال انتقال یافت')
            window.location.reload()
          },
          onError: (err) => handleError(err),
        }
      )
    },
    {
      ok: { label: 'انتقال بیعانه', flat: true, color: 'warning' },
      cancel: { label: 'افزودن بیعانه', flat: true, color: 'primary' },
      persistent: true,
    }
  )
}

const askForFillPrepay = () => {
  confirmDialog(
    'توجه!',
    'مبلغ بیعانه بایستی قبل از فرایند درمان پر شود. در صورتی که بیعانه دریافت شده است وارد کنید در غیر این صورت طرح درمان را بدون بیعانه فعال کنید',
    () => {
      if (activeTreatment.value?.prepay) {
        transmissionPrepay()
      } else {
        activeTp()
      }
    },
    {
      ok: { label: 'فعال کردن طرح درمان بدون بیعانه', flat: true, color: 'primary' },
      cancel: { label: 'افزودن بیعانه', flat: true, color: 'negative' },
      persistent: true,
    }
  )
}

const onActivateTreatment = () => {
  if (hasAnotherActivePlan?.value) {
    confirmDialog(
      'توجه!',
      `شما در حال تغییر طرح درمان فعال این شخص هستید.
 با این کار ممکنه ابهاماتی با دیگر واحدها به وجود بیاید.
  برای اطلاعات بیشتر  از انجام این کار مطمئن هستید؟ <br />
  <a href='/treatment-plan/treatment-plan-list/?userId=${userId.value}&userMobile=${userMobile.value}' target='_blank'>
  مشاهده طرح درمان های کاربر
  </a>.`,
      () => {
        if (treatmentData?.value?.prepay) {
          activeTp()
        } else {
          askForFillPrepay()
        }
      },
      {
        icon: 'alert',
        html: true,
        ok: { label: 'تغییر طرح درمان فعال', flat: true, color: 'primary' },
        cancel: { label: 'انصراف', flat: true, color: 'negative' },
        persistent: true,
      }
    )
  } else {
    activateTreatmentPlan(treatmentPlanId, {
      onSuccess: () => {
        Notif.success('طرح درمان با موفقیت فعال شد')
        updateTreatment({ isActive: true })
      },
      onError: (e) => handleError(e, { glitchtipLog: false, showToast: true }),
    })
  }
}

const onCompleteTreatmentPlan = () => {
  try {
    confirmDialog(
      'اتمام طرح درمان',
      `آیا از اتمام طرح درمان کاربر "${treatmentData?.value?.user?.name}" مطمئن هستید؟`,
      () => {
        completeTreatmentPlan(treatmentData?.value?.id, {
          onSuccess: () => {
            Notif.success('طرح درمان با موفقیت پایان یافت')
            updateTreatment({ status: TREATMENT_PLAN_STATUS.COMPLETED })
            updateTreatment({ isActive: false })
          },
          onError: (e) => {
            handleError(e, { glitchtipLog: false, showToast: true })
          },
        })
      },
      {
        html: true,
        persistent: true,
        ok: { label: 'اتمام طرح درمان', flat: true, color: 'primary' },
        cancel: { label: 'انصراف', flat: true, color: 'negative' },
      }
    )
  } catch (error) {
    handleError(error, { glitchtipLog: false, showToast: false })
  }
}

const onExtraditePrepay = () => {
  confirmDialog(
    'عودت بیعانه',
    'آیا از عودت بیعانه مطمئن هستید؟',
    () => {
      extradite(
        {
          id: treatmentData?.value?.id,
          extraditionAt: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
        },
        {
          onSuccess: () => {
            updateTreatment({ extraditionAt: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss') })
            Notif.success('بیعانه با موفقیت عودت داده شد')
          },
          onError: (e) => {
            handleError(e, { glitchtipLog: false, showToast: true })
          },
        }
      )
    },
    {
      ok: { label: 'عودت', flat: true, color: 'primary' },
      cancel: { label: 'انصراف', flat: true, color: 'negative' },
      persistent: true,
    }
  )
}

watch(
  () => route.query,
  (value) => {
    if (value['show-activate-modal'] === 'true') onActivateTreatment()
  }
)
</script>

<style lang="scss" scoped>
.tpa {
  &__header {
    display: flex;
    align-items: flex-start;
    flex-direction: row-reverse;
    gap: map-get($space-sm, x);
  }

  &__header-content {
    flex: 1;
  }

  &__header-actions {
    display: flex;
    align-items: center;
    align-self: center;
  }

  &__active {
    font-size: map-get($caption, size);
  }

  &__inactive {
    font-size: map-get($body2, size);
  }

  &__description {
    margin-top: map-get($space-md, x);
    font-size: map-get($caption, size);
  }

  &__inactive-content {
    margin-top: map-get($space-md, x);
  }

  &__inactive-button {
    width: 100%;
    margin-top: map-get($space-sm, x);
    margin-bottom: map-get($space-sm, x);
  }

  &__inactive-link {
    font-weight: map-get($subtitle1, weight);
    color: $grey-9;
  }

  &__inactive-subtitle {
    font-size: map-get($caption, size);
    margin-top: map-get($space-xs, x);
  }

  &__complete {
    width: 100%;
    padding: map-get($space-lg, x);
    margin-top: map-get($space-md, x);
  }

  &__complete-action {
    margin-top: map-get($space-sm, x);
    width: 100%;
    font-size: map-get($caption, size);
    text-align: justify;
  }

  &__menu {
    min-width: 250px;
  }

  &__menu-list {
    padding: map-get($space-xs, x);
  }

  &__menu-item {
    border-radius: 8px;
    margin-bottom: map-get($space-xs, x);
    padding: map-get($space-sm, x) map-get($space-md, x);
    transition: all 0.2s ease;
    white-space: nowrap;

    &:last-child {
      margin-bottom: 0;
    }

    &--prepay {
      background-color: #ffe6f0;
      color: #d81b60;

      &:hover {
        background-color: #ffcce0;
      }

      &.tpa__menu-item--returned {
        opacity: 0.8;
      }
    }

    &--complete {
      background-color: #e3f2fd;
      color: #1976d2;

      &:hover {
        background-color: #bbdefb;
      }
    }

    :deep(.q-item__section--avatar) {
      min-width: 32px;
    }

    :deep(.q-icon) {
      font-size: 20px;
    }
  }
}
</style>
