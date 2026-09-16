<template>
  <div class="tp-description">
    <QCard flat>
      <QCardSection class="tp-description__section tp-description__section--header">
        <div class="tp-description-header">
          <div class="tp-description__header-actions">
            <Button
              variant="flat"
              color="grey"
              :left-icon="IconArrowRight"
              size="sm"
              is-rounded
              @click="goBack"
            />
            <QAvatar class="chips-primary" size="lg">
              <IconUser size="18" />
            </QAvatar>
            <div
              class="tp-description__title"
              :class="{ 'tp-description__title--clickable': !!userId }"
              :aria-label="userId ? `مشاهده پروفایل بیمار ${patientName}` : undefined"
              @click="handleOpenUserDetails"
            >
              <Typography variant="heading" size="h6">
                {{ patientName }}
              </Typography>
              <Typography variant="caption" color="grey">نام بیمار</Typography>
            </div>
          </div>
        </div>
      </QCardSection>
      <div class="row">
        <UserTpCard ref="userTpCardRef" :user-data="data" @change:tab="handleChangeTpId" />
      </div>

      <QCardSection class="tp-description__section">
        <div class="tp-description__toolbar">
          <div class="tp-description__toolbar-title">
            <Typography variant="heading" size="h4">درمان‌ها</Typography>
            <Button
              variant="flat"
              color="grey"
              :is-loading="isTpDescriptionsLoading"
              :left-icon="IconRefresh"
              is-icon-only
              is-rounded
              @click="handleRefresh"
            />
          </div>
          <div class="tp-description__toolbar-actions">
            <div class="tp-description__select-wrapper">
              <SelectField
                v-model="selectedBookingId"
                placeholder="نوبت بیمار"
                clearable
                use-input
                input-debounce="300"
                class="tp-description__select"
                :options="bookingOptions"
                option-label="label"
                option-value="id"
                emit-value
                map-options
                :loading="isBookingsLoading"
                @popup-show="isBookingDropdownOpen = true"
                @popup-hide="isBookingDropdownOpen = false"
              />

              <Button variant="filled" @click="handleOpenAddModal">افزودن</Button>
            </div>
          </div>
        </div>

        <div class="tp-description__content">
          <QSkeleton v-if="isTpDescriptionsLoading" type="table" height="300px" animation="fade" />

          <div
            v-if="!isTpDescriptionsLoading && !treatmentList?.length"
            class="tp-description__no-data"
            role="status"
            aria-live="polite"
          >
            <div class="tp-description__no-data-icon">
              <IconDental size="48" class="text-grey-4" />
            </div>
            <Typography variant="body" size="3" weight="bold">درمانی ثبت نشده</Typography>
            <Typography variant="body" size="2" color="grey">
              برای شروع، می‌توانید اولین درمان بیمار را ثبت کنید
            </Typography>
          </div>

          <div
            v-if="!isTpDescriptionsLoading && treatmentList?.length > 0"
            class="tp-description__cards"
            @scroll="handleScroll"
          >
            <div class="tp-description__card-list">
              <TreatmentSessionCard
                v-for="group in tpDescriptions"
                :key="group.bookingAt"
                :rows="group.items"
                :group="group"
                :tp-id="tpId"
                :created-by="data?.treatmentPlan?.createdBy"
                :created-at="data?.treatmentPlan?.createdAt"
                :booking-id="group.bookingId"
                :date="group.date"
                :doctor-name="group.doctorName"
                :can-view-cost="canViewCost"
                :convert-to-jalali="convertToJalali"
                :format-date="formatDate"
                :get-exact-tooth-numbers="getExactToothNumbers"
                :is-row-expanded="isRowExpanded"
                :toggle-expand="toggleExpand"
                :handle-delete="handleDelete"
                :handle-edit="handleEdit"
              />
            </div>
          </div>
        </div>
      </QCardSection>
    </QCard>
  </div>
  <TpAddDescriptionDialog
    :visible="isShowModal"
    :tp-id="tpId"
    :booking-id="bookingId"
    :booking-options="bookingOptions"
    :is-bookings-loading="isBookingsLoading"
    :edit-data="editingRow"
    @update:visible="closeModal"
    @saved="handleDescriptionSaved"
  />
  <UserDetails
    v-if="isShowUserDetails"
    :visible="isShowUserDetails"
    :user-id="userId"
    @close="closeUserDetails"
  />
</template>

<script setup>
import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import { IconArrowRight, IconDental, IconRefresh, IconUser } from '@tabler/icons-vue'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import useDisclosure from '@/composables/use-disclosure'
import {
  useDeleteTpDescriptionMutation,
  useGetTreatmentPlanByIdQuery,
  useTpDescriptionQuery,
  useTreatmentPlanBookingsQuery,
} from '@/modules/TreatmentPlan/query'
import { useQueryClient } from '@tanstack/vue-query'
import {
  extractSelectedTeethFromItem,
  transformApiResponseToTableFormat,
} from '@/modules/TreatmentPlan/utils/tp-description-transformers'
import { teethMapping } from '@/modules/TreatmentPlan/constants/teeth'
import { convertToJalali, formatDate } from '@/utils/date-utils'
import { getPerms } from '@/utils/get-perms'
import UserTpCard from '@/modules/TreatmentPlan/components/TpDescription/UserTpDetails/UserTpCard'
import SelectField from '@/base/SelectField'
import TreatmentSessionCard from '@/modules/TreatmentPlan/components/TpDescription/TreatmentSessionCard'

const TpAddDescriptionDialog = defineAsyncComponent(
  () => import('../components/TpDescription/TpAddDescriptionDialog')
)

const UserDetails = defineAsyncComponent(
  () => import('@/modules/User/components/UserDetails/UserDetails')
)

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()

const PAGE_SIZE = 10

const routeTpId = computed(() => route.params.tpId)

const data = ref({})
const editingRow = ref(null)
const selectedTpId = ref(null)
const isInitialized = ref(false)
const bookingId = computed(() => route.query?.bookingId || null)
const visibleCount = ref(PAGE_SIZE)
const isLoadingMore = ref(false)
const selectedBookingId = ref(route.query?.bookingId ? Number(route.query?.bookingId) : null)

watch(selectedBookingId, (val) => {
  router.replace({ query: { ...route.query, bookingId: val || undefined } })
})
const isBookingDropdownOpen = ref(false)
const expandedRows = ref([])

const userId = computed(() => data.value?.user?.id)
const patientName = computed(() =>
  `${data.value?.user?.firstName || ''} ${data.value?.user?.name || ''}`.trim()
)

const tpId = computed(() => selectedTpId.value || routeTpId.value)

const bookingFilters = computed(() => {
  if (!userId.value || !tpId.value) return null
  return {
    'filter[type]': 2,
    'filter[user_id]': userId.value,
    'filter[treatment_plan]': tpId.value,
  }
})

const { data: treatmentPlanData } = useGetTreatmentPlanByIdQuery(routeTpId, {
  enabled: () => !!routeTpId.value,
})

const { data: bookingList, isLoading: isBookingsLoading } = useTreatmentPlanBookingsQuery(
  bookingFilters,
  {
    enabled: computed(() => !!bookingFilters.value),
  }
)

const bookingOptions = computed(() => {
  if (!bookingList.value || !Array.isArray(bookingList.value.items)) return []

  return bookingList.value?.items?.map((item) => ({
    id: item.id,
    label: convertToJalali(item.bookingAt || item.booking_at, ' jdddd - jYYYY/jMM/jDD') || item.id,
  }))
})

watch(
  treatmentPlanData,
  (tpData) => {
    if (tpData) {
      data.value = {
        user: tpData.user,
        treatmentPlan: { id: tpData.id, ...treatmentPlanData.value },
      }
      isInitialized.value = true
    }
  },
  { immediate: true }
)

const [isShowModal, { open: openModal, close: closeModal }] = useDisclosure()
const [isShowUserDetails, { open: openUserDetails, close: closeUserDetails }] = useDisclosure()

const userTpCardRef = ref(null)

const handleOpenAddModal = () => {
  openModal()
  if (tpId.value) {
    userTpCardRef.value?.openTpPanel(tpId.value)
  }
}

const handleOpenUserDetails = () => {
  if (!userId.value) return
  openUserDetails()
}

const canViewCost = computed(() => getPerms('treatment-plan', 'manage', false))

const { data: tpDescriptions, isLoading: isTpDescriptionsLoading } = useTpDescriptionQuery(
  tpId,
  selectedBookingId,
  {
    enabled: () => !!tpId.value,
  }
)

const treatmentList = computed(() => transformApiResponseToTableFormat(tpDescriptions.value))

const hasMore = computed(() => visibleCount.value < treatmentList.value.length)

const { mutate: deleteTpd } = useDeleteTpDescriptionMutation()

const handleScroll = async ({ target }) => {
  if (isLoadingMore.value || !hasMore.value) return
  const { scrollTop, clientHeight, scrollHeight } = target
  if (scrollHeight - scrollTop - clientHeight < 250) {
    isLoadingMore.value = true
    await nextTick()
    visibleCount.value = Math.min(visibleCount.value + PAGE_SIZE, treatmentList.value.length)
    isLoadingMore.value = false
  }
}

watch([treatmentList, selectedBookingId], () => {
  visibleCount.value = PAGE_SIZE
})

const handleDescriptionSaved = async () => {
  await queryClient.resetQueries({
    queryKey: ['tp-description', tpId.value],
  })
  await queryClient.resetQueries({
    queryKey: ['treatment-plan', 'total-credit'],
  })
}

const getToothPosition = (toothNumber) => {
  if (toothNumber >= 1 && toothNumber <= 7) return 'TR'
  if (toothNumber >= 8 && toothNumber <= 14) return 'TL'
  if (toothNumber >= 15 && toothNumber <= 21) return 'BR'
  if (toothNumber >= 22 && toothNumber <= 28) return 'BL'
  return null
}

const getExactToothNumbers = (row) => {
  const exactToothIds = []
  const teeth = row?.teeth || row?.selectedTeeth
  if (teeth && Array.isArray(teeth)) {
    row.teeth.forEach((tooth) => {
      if (!tooth || typeof tooth !== 'object') return

      const numbers = tooth.number || tooth.toothNumber
      const { position } = tooth

      if (Array.isArray(numbers) && position) {
        numbers.forEach((displayNum) => {
          for (let id = 1; id <= 28; id += 1) {
            if (teethMapping[id] === displayNum) {
              const toothPosition = getToothPosition(id)
              if (toothPosition === position) {
                exactToothIds.push(id)
                break
              }
            }
          }
        })
      } else if (numbers && position) {
        for (let id = 1; id <= 28; id += 1) {
          if (teethMapping[id] === numbers) {
            const toothPosition = getToothPosition(id)
            if (toothPosition === position) {
              exactToothIds.push({
                numbers,
                toothPosition,
              })
              break
            }
          }
        }
      }
    })
  }
  return exactToothIds
}

const toggleExpand = (rowId) => {
  const index = expandedRows.value.indexOf(rowId)
  if (index > -1) {
    expandedRows.value.splice(index, 1)
  } else {
    expandedRows.value.push(rowId)
  }
}

const isRowExpanded = (rowId) => expandedRows.value.includes(rowId)

const goBack = () => {
  router.back()
}

const handleRefresh = async () => {
  handleDescriptionSaved()
  Notif.success('لیست درمان‌ها به‌روزرسانی شد', { timeout: 1000 })
}

const handleDelete = (row) => {
  confirmDialog(
    'حذف شرح درمان',
    'از حذف شرح درمان جاری مطمئن هستید؟',
    () => {
      deleteTpd(
        {
          tpdId: tpId.value,
          itemId: row.id,
        },
        {
          onSuccess: (response) => {
            Notif.success(response.message)
            handleRefresh()
          },
        }
      )
    },
    {
      ok: { label: 'حذف', color: 'negative' },
    }
  )
}

const handleChangeTpId = (e) => {
  selectedTpId.value = e
}

// Raw GET row → the editData contract TpAddDescriptionDialog consumes:
// tpdId targets the stored row (PUT/DELETE url), id is the catalog item id
// (form preselect + serve_industry_item_id) and price must be the UNIT price.
const handleEdit = (row) => {
  editingRow.value = {
    tpdId: row.id,
    id: row.itemId,
    questionId: row.questionId,
    serveId: row.serveIndustryId,
    price: row.unit > 0 ? Math.round(Number(row.price) / row.unit) : Number(row.price) || 0,
    unit: row.unit,
    selectedTeeth: extractSelectedTeethFromItem(row.teeth),
    selectedRegions: [],
    description: row.description || '',
    specialServices: {
      questionTitle: row.questionTitle,
      itemTitle: row.itemTitle,
    },
  }
  openModal()
}

watch(isShowModal, (isOpen) => {
  if (!isOpen) {
    editingRow.value = null
    userTpCardRef.value?.closeTpPanel()
  }
})

onMounted(() => {
  if (!routeTpId.value) {
    Notif.warning('شناسه طرح درمان نامعتبر است')
    router.push({ name: 'booking-list' })
  }
})
</script>

<style lang="scss" scoped>
.tp-description {
  height: 100dvh !important;

  &__section {
    padding: 0;

    &--header {
      margin-bottom: $spacing-md;
    }
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-md;

    @include media-breakpoint-down(md) {
      flex-wrap: wrap;
      gap: $spacing-sm;
    }
  }

  &__toolbar-title {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__toolbar-actions {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    @include media-breakpoint-down(md) {
      width: 100%;
    }
  }

  &__select-wrapper {
    display: flex;
    align-items: flex-end;
    justify-content: end;
    gap: $spacing-sm;
    width: 22rem;
    max-width: 22rem;

    & > div {
      width: 16.9rem;
      max-width: 16.9rem;
    }

    @include media-breakpoint-down(md) {
      width: 100%;
      max-width: 100%;

      & > div {
        flex: 1 1 auto;
        width: auto;
        max-width: revert-rule;
      }
    }
  }

  &__select {
    width: 13.5rem;
  }

  &__card-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__loader {
    display: flex;
    justify-content: center;
    padding: $spacing-md;
  }

  &-header {
    width: 100%;
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid $grey-3;
    border-radius: $radius-sm;
  }

  &__title {
    display: flex;
    flex-direction: column;

    &--clickable {
      cursor: pointer;
      border-radius: $radius-sm;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 0.7;
      }

      &:focus-visible {
        outline: 2px solid $primary;
        outline-offset: 2px;
      }
    }
  }

  &__content {
    background: white;
    border-radius: $radius-sm;
    overflow: hidden;
  }

  &__cards {
    height: 700px;
    overflow-y: auto;
    padding: $spacing-sm;

    @include media-breakpoint-down(md) {
      height: auto;
      max-height: calc(100dvh - 320px);
      min-height: 300px;
    }
  }

  &__no-data {
    width: 100%;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $spacing-3xl $spacing-lg;
    gap: $spacing-sm;
    background: white;
    border-radius: $radius-sm;
    border: 1px solid $grey-3;

    @include media-breakpoint-down(md) {
      min-height: 300px;
      padding: $spacing-xl $spacing-md;
    }

    &-icon {
      margin-bottom: $spacing-sm;
      opacity: 0.5;
    }
  }

  &__footer {
    display: flex;
    gap: $spacing-sm;
    align-items: center;
    justify-content: flex-end;
    padding: $spacing-md $spacing-lg;
    border-top: 1px solid $grey-2;
  }
}
</style>
