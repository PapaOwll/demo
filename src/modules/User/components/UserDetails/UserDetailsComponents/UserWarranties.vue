<template>
  <QScrollArea class="scroll-area" :thumb-style="thumbStyle">
    <div class="user-warranties">
      <div class="user-warranties__container">
        <div class="row items-center justify-between q-mb-md">
          <div class="col flex items-center">
            <Typography variant="heading" size="h5" class="user-warranties__title q-mb-sm">
              ضمانتنامه‌ها
            </Typography>
            <Button
              variant="flat"
              color="dark"
              :is-icon-only
              :left-icon="IconRefresh"
              is-rounded
              @click="refreshList"
            />
          </div>
        </div>

        <div v-if="isLoading && !userWarrantiesData?.length" class="row justify-center q-pa-xl">
          <QSpinnerDots size="50px" color="primary" />
        </div>

        <div v-else class="user-warranties__content">
          <div v-if="!userWarrantiesData || userWarrantiesData.length === 0" class="no-data">
            <Typography variant="heading" size="h6">
              <QImg :src="noData" class="q-mb-md" />
              اطلاعاتی موجود نیست!
            </Typography>
            <Typography variant="caption">
              هنوز ضمانتنامه‌ای برای این کاربر صادر نشده است!
            </Typography>
          </div>

          <div v-else class="user-warranties__list">
            <div v-for="warranty in userWarrantiesData" :key="warranty.id" class="utpw__card">
              <div class="utpw__card-avatar">
                <QAvatar square>
                  <IconClipboardCheck stroke="2.5" />
                </QAvatar>
              </div>
              <div class="utpw__card-title">
                <Typography variant="body" size="3" weight="semibold">
                  {{ warranty.serve?.title }}
                </Typography>
                <Typography variant="body" size="4">
                  {{ warranty.question?.title }} - {{ warranty.serveItem?.title }}
                </Typography>
                <Typography
                  v-for="toothGroup in groupTeethByPosition(warranty.teeth)"
                  :key="toothGroup.position"
                  variant="caption"
                  color="dark"
                >
                  دندان شماره {{ toothGroup.numbers.join('، ') }} ({{ toothGroup.position }})
                </Typography>
              </div>
              <div class="utpw__card-month">
                <Typography variant="body" size="3" color="grey" weight="semibold">
                  مدت ضمانت
                </Typography>
                <Typography
                  v-if="warrantyYear(warranty.expiryDate) > LIFE_TIME_YEAR"
                  variant="body"
                >
                  <Badge label="مادام العمر" variant="outline" />
                </Typography>
                <Typography v-else variant="body" size="4" weight="semibold">
                  {{ convertToJalali(warranty.expiryDate) }}
                </Typography>
              </div>

              <QSpace />
              <div class="utpw__toggle">
                <QInnerLoading :showing="updatingWarrantyId === warranty.id">
                  <QSpinnerTail size="48px" color="primary" />
                  <Typography variant="caption">
                    در حال انجام عملیات...لطفا منتظر بمانید!
                  </Typography>
                </QInnerLoading>
                <QToggle
                  v-if="getPerms('treatment-plan', 'update', true, 'treatmentPlanFinancial')"
                  :model-value="warranty.isActive"
                  :label="warranty.isActive ? 'فعال' : 'غیرفعال'"
                  @update:model-value="(e) => updateWarrantyStatus(warranty, e)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="info-section">
      <IconInfoHexagon />
      <span class="q-mr-sm" style="font-size: 12px">
        تمامی ضمانتنامه‌های فعال کاربر در این لیست نمایش داده می‌شوند
      </span>
    </div>
  </QScrollArea>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import Typography from '@/base/Typography'
import Badge from '@/base/Badge'
import { IconClipboardCheck, IconInfoHexagon, IconRefresh } from '@tabler/icons-vue'
import { convertToJalali } from '@/utils/date-utils'
import { getPerms } from '@/utils/get-perms'
import noData from '@/assets/images/noData.svg'
import Button from '@/base/Button'
import { useGetUserWarrantiesQuery, useUpdateUserWarrantyMutation } from '@/modules/User/query'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import {
  mockGetUserWarranties,
  mockUpdateUserWarrantyStatus,
} from '@/mocks/user-details/warranties'

const props = defineProps({
  propData: {
    type: Number,
    default: null,
  },
})

const LIFE_TIME_YEAR = 1500

const queryClient = useQueryClient()

const thumbStyle = {
  borderRadius: '5px',
  backgroundColor: '#027be3',
  width: '5px',
  opacity: '0.75',
}

const userId = computed(() => props.propData)

const { data: warrantiesData, isLoading } = useGetUserWarrantiesQuery(userId, {
  ...(ENABLE_USER_DETAIL_MOCKS ? { queryFn: () => mockGetUserWarranties(userId.value) } : {}),
})

const userWarrantiesData = computed(() => warrantiesData.value?.warranties || [])

const warrantyYear = (date) => {
  return convertToJalali(date, 'jYYYY')
}
/**
 * Groups teeth by their position for warranty display
 * @param {Array<{position: string, number: number|number[]}>} teeth - Array of teeth objects
 * @returns {Array<{position: string, numbers: number[]}>} Grouped teeth with sorted numbers
 */
const groupTeethByPosition = (teeth) => {
  if (!teeth || teeth.length === 0) return []

  const groups = {}
  teeth.forEach((tooth) => {
    if (!tooth.position || !tooth.number) return

    if (!groups[tooth.position]) {
      groups[tooth.position] = new Set()
    }

    if (Array.isArray(tooth.number)) {
      tooth.number.forEach((num) => groups[tooth.position].add(num))
    } else {
      groups[tooth.position].add(tooth.number)
    }
  })

  return Object.entries(groups)
    .map(([position, numbersSet]) => ({
      position,
      numbers: [...numbersSet].sort((a, b) => a - b),
    }))
    .filter((group) => group.numbers.length > 0)
}

const updatingWarrantyId = ref(null)

const { mutate: updateStatus } = useUpdateUserWarrantyMutation(
  ENABLE_USER_DETAIL_MOCKS ? { mutationFn: mockUpdateUserWarrantyStatus } : {}
)

const updateWarrantyStatus = (warranty, value) => {
  const warrantyStatus = value ? 'فعال' : 'غیرفعال'
  confirmDialog(
    'وضعیت ضمانتنامه',
    `از ${warrantyStatus} کردن ضمانتنامه اطمینان دارید؟`,
    () => {
      updatingWarrantyId.value = warranty.id
      const updateStatusData = {
        warrantyId: warranty.id,
        serveIndustryItemId: warranty.serveItem?.id,
        userId: userId.value,
        performedAt: warranty?.performedAt,
      }
      updateStatus(updateStatusData, {
        onSuccess: (response) => {
          Notif.success(response?.message || 'وضعیت ضمانتنامه با موفقیت تغییر کرد')
          queryClient.invalidateQueries({
            queryKey: ['user-warranty', userId.value],
            refetchType: 'active',
          })
        },
        onSettled: () => {
          updatingWarrantyId.value = null
        },
      })
    },
    {
      ok: { label: 'تغییر وضعیت', flat: true, color: 'primary' },
    }
  )
}

const refreshList = () => {
  queryClient.resetQueries({ queryKey: ['user-warranty', userId.value] })
}
</script>

<style lang="scss" scoped>
.scroll-area {
  height: 75dvh;
}

.user-warranties {
  -webkit-user-select: none;
  -webkit-user-drag: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  &__container {
    height: 100%;
  }

  &__title {
    font-weight: map-get($h6, weight);
    font-size: map-get($h6, size);
    margin: 0;
  }

  &__content {
    min-height: 300px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: $spacing-sm;
  }
}

.utpw__card {
  width: 100%;
  margin: $spacing-md 0;
  background-color: #fff;
  border: 1px solid $grey-3;
  border-radius: $radius-md;
  padding: $spacing-md;
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xl;
  align-items: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &-avatar {
    border-radius: $radius-sm;
    color: $grey-7;
    background-color: $grey-2;
  }

  &-title {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    gap: $spacing-md;
    flex: 0 1 25%;
  }

  &-month {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    flex-wrap: wrap;
    flex: 1 0 auto;
  }
}

.utpw__toggle {
  margin-left: auto;
}

.no-data {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: $spacing-md;
  margin: 0 auto;
  min-height: 300px;
}

.info-section {
  width: 100%;
  background-color: $grey-3;
  padding: 0.5rem;
  border-radius: 12px;
  margin: 10px auto;
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .utpw__card {
    margin-bottom: $spacing-md;
  }
}
</style>
