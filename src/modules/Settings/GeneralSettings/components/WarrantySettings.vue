<template>
  <div class="ws">
    <QInnerLoading :showing="isLoading">
      <QSpinnerGears size="50" color="primary" />
    </QInnerLoading>

    <div class="ws__title-row">
      <Typography v-once variant="heading" size="h6">تنظیمات ضمانت‌نامه</Typography>
      <Button
        variant="filled"
        color="light-blue"
        :right-icon="IconPlus"
        text="ضمانت‌نامه جدید"
        @click="openCreateModal"
      />
    </div>

    <div v-if="warrantyList.length > 0 && !isError" class="ws__content">
      <div v-for="ws in warrantyList" :key="ws.serveIndustryId" class="ws__industry-group">
        <div class="ws__group-label">
          <span class="ws__group-label-text">{{ ws.serveIndustryTitle }}</span>
          <div class="ws__group-label-line" />
        </div>

        <div class="ws__cards-grid">
          <div v-for="item in ws.items" :key="item.id" class="ws__card">
            <div class="ws__card-right">
              <div class="ws__card-icon-wrap">
                <IconCertificate stroke="1.4" :size="22" class="ws__card-icon" />

                <span v-if="item.badge" class="ws__card-badge">{{ item.badge }}</span>
              </div>
              <div class="ws__card-titles">
                <Typography variant="body" size="2" weight="semibold">
                  {{ ws.serveIndustryTitle }}
                </Typography>
                <Typography variant="caption" color="grey" weight="medium">
                  {{ item.title }}
                </Typography>
              </div>
            </div>

            <!-- Center: expiry -->
            <div class="ws__card-expiry">
              <Typography variant="body" size="3" weight="medium">
                {{ formatExpiry(item.months) }}
              </Typography>
              <Typography variant="caption" size="3" color="grey">
                {{ item.months && item.months < 1200 ? `${item.months} ماه` : 'مادام العمر' }}
              </Typography>
            </div>

            <div class="ws__card-actions">
              <IconTrash
                :size="16"
                stroke="1.8"
                class="ws__action-btn ws__action-btn--red"
                @click="deleteWarrantyItem(item)"
              />

              <IconPencil
                :size="16"
                stroke="1.8"
                class="ws__action-btn ws__action-btn--blue"
                @click="openEditModal(item, ws)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="isError && !isLoading" class="ws__no-data">
      <QAvatar size="100px" color="red-1" text-color="red" class="rounded-borders">
        <IconAlertTriangle size="50" stroke="1.2" />
      </QAvatar>
      <Typography variant="heading" size="h6">خطا در دریافت اطلاعات</Typography>
      <Typography variant="body" size="3" color="grey">
        {{ error?.response?.data?.message || 'دریافت لیست ضمانت‌نامه‌ها ناموفق بود.' }}
      </Typography>
      <Button variant="outline" color="red" text="تلاش مجدد" @click="handleRetry" />
    </div>

    <div v-else-if="!isLoading" class="ws__no-data">
      <QAvatar size="100px" color="grey-2" text-color="grey-6" class="rounded-borders">
        <IconClipboardCheck size="50" stroke="1.2" />
      </QAvatar>
      <Typography variant="heading" size="h6">ضمانت‌نامه‌ای ثبت نشده</Typography>
      <Typography variant="body" size="3" color="grey">
        هنوز ضمانت‌نامه‌ای برای خدمات ثبت نشده است.
      </Typography>
      <Button
        variant="filled"
        color="light-blue"
        text="افزودن ضمانت‌نامه"
        :right-icon="IconPlus"
        @click="openCreateModal"
      />
    </div>
  </div>

  <WarrantyFormModal :visible="isShowModal" :data="selectedWarrantyData" @close="closeModal" />
</template>

<script setup>
import { computed, ref, toRefs, watch } from 'vue'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import {
  IconPlus,
  IconCertificate,
  IconTrash,
  IconPencil,
  IconAlertTriangle,
  IconClipboardCheck,
} from '@tabler/icons-vue'
import useDisclosure from '@/composables/use-disclosure'
import WarrantyFormModal from './WarrantyFormModal'
import { useApiGetEligibleWarrantyServes } from '@/modules/Settings/GeneralSettings/query/index'
import { useQueryClient } from '@tanstack/vue-query'
import { convertToJalali } from '@/utils/date-utils'
import { Notif } from '@/data/services/notification-service'

const props = defineProps({
  submit: { type: Boolean, default: false },
  refresh: { type: Boolean, default: false },
  branchId: { type: [String, Number], default: undefined },
})
const { refresh } = toRefs(props)
const emits = defineEmits(['afterSubmit', 'afterRefresh'])
const queryClient = useQueryClient()

const selectedWarrantyData = ref(null)
const [isShowModal, { open: openModal, close: closeDisclosure }] = useDisclosure()

const closeModal = () => {
  closeDisclosure()
  selectedWarrantyData.value = null
}

const { data: warrantyData, isLoading, isError, error, refetch } = useApiGetEligibleWarrantyServes()
const warrantyList = computed(() =>
  (warrantyData.value?.items ?? warrantyData.value ?? [])
    .map((group) => ({
      serveIndustryId: group.serve_industry_id ?? group.serveIndustryId,
      serveIndustryTitle: group.serve_industry_title ?? group.serveIndustryTitle,
      items: group.items ?? [],
    }))
    .filter((group) => group.items.length > 0)
)

const formatExpiry = (months) => {
  if (!months || months >= 1200) return 'بدون انقضا'
  const now = new Date()
  now.setMonth(now.getMonth() + Number(months))
  return ` انقضا  تا ${convertToJalali(now.toISOString(), 'jYYYY/jMM/jDD')}`
}

const handleRetry = () => refetch()

const openCreateModal = () => {
  selectedWarrantyData.value = null
  openModal()
}

const openEditModal = (item, industry) => {
  selectedWarrantyData.value = {
    id: item.id,
    serveId: industry.serveIndustryId,
    serveItemId: item.id,
    months: item.months,
  }
  openModal()
}

const deleteWarrantyItem = () => {
  Notif.warning('قابلیت حذف ضمانت‌نامه در حال حاضر فعال نیست', { position: 'top' })
}

const onReload = async () => {
  await queryClient.invalidateQueries({ queryKey: ['settings', 'warranty-list'] })
  emits('afterRefresh')
}

watch(
  () => refresh.value,
  (value) => {
    if (value) onReload()
  }
)
</script>

<style scoped lang="scss">
@import '@/assets/styles/mixins/breakpoints.scss';

.ws {
  width: 100%;
  direction: rtl;

  &__title-row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 $spacing-md $spacing-lg;
  }

  &__content {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: $spacing-2xl;
    padding: 0 $spacing-sm;
  }

  &__industry-group {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__group-label {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: 0 $spacing-xs;
  }

  &__group-label-text {
    font-size: 14px;
    font-weight: 600;
    color: $grey-8;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__group-label-line {
    flex: 1;
    height: 1px;
    background: $grey-3;
  }

  &__cards-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: $spacing-sm;

    @include media-breakpoint-up(md) {
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-md;
    }
  }

  &__card {
    background: $grey-1;
    border-radius: $radius-md;
    padding: $spacing-lg $spacing-xl;
    display: flex;
    align-items: center;
    gap: $spacing-md;
    min-height: 72px;
  }

  &__card-right {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    flex: 0 0 auto;
    min-width: 130px;
  }

  &__card-icon-wrap {
    position: relative;
    width: 40px;
    height: 40px;
    background: $white;
    border-radius: $radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid $grey-3;
  }

  &__card-icon {
    color: $grey-7;
  }

  &__card-badge {
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    background: #7c3aed;
    color: $white;
    font-size: 9px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 4px;
    white-space: nowrap;
    line-height: 1.6;
  }

  &__card-titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__card-expiry {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    text-align: center;
  }

  &__card-actions {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-shrink: 0;
    margin-right: auto;
  }

  &__action-btn {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
      background 0.15s,
      transform 0.1s;

    &:active {
      transform: scale(0.93);
    }

    &--red {
      color: $red-6;
    }

    &--blue {
      color: $dark-6;
    }
  }

  &__no-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-md;
    padding: $spacing-3xl;
    min-height: 300px;
  }
}
</style>
