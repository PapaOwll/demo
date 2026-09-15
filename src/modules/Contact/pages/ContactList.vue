<template>
  <div v-show="showAudioBar" class="audio-bar">
    <QCard class="audio-bar__card">
      <div class="audio-bar__header">
        <div class="audio-bar__info">
          <p class="audio-bar__title">{{ audioInfo?.name }}</p>
          <p class="audio-bar__subtitle">{{ '0' + audioInfo?.mobile }}</p>
        </div>
        <QBtn round flat icon="close" size="sm" color="warning" @click="closeAudioBar" />
      </div>
      <audio ref="audioRef" controls class="audio-bar__player" />
      <QInnerLoading :showing="audioLoading" />
    </QCard>
  </div>

  <QCard flat class="q-pa-md">
    <QCardSection class="row q-col-gutter-sm items-center justify-between q-pa-none">
      <div class="col-10 flex q-gutter-xs items-center">
        <QChip square color="white" text-color="black" class="text-h6">لیست تماس ها</QChip>
        <QBtn fab-mini flat unelevated :loading="isFetching" @click="updateTable">
          <IconRefresh class="text-grey" />
        </QBtn>
        <div class="flex">
          <QChip
            v-for="_f in contactSuggestFilters"
            :key="_f.key"
            clickable
            :color="_f.type"
            outline
            @click="onSelectSuggestFilter(_f)"
          >
            {{ _f.faTitle }}
          </QChip>
        </div>
      </div>
      <div class="col-md-2 col-12 flex justify-end">
        <QBtn
          v-if="getPerms('contact', 'add')"
          outline
          text-color="green-6"
          color="green-1"
          unelevated
          @click="openContactForm"
        >
          <IconPlus class="q-mr-xs" />
          افزودن تماس
        </QBtn>
      </div>

      <div class="col-12">
        <FilterBuilder
          :items="tableFilters"
          :form-values="formValues"
          :has-active-filters="hasActiveFilters"
          :handle-input="handleInput"
          :apply-filters="applyFilters"
          :reset-filters="resetFilters"
          :total-count="totalContact"
          total-label="تماس"
          :is-total-count-loading="loadingList"
          :load-total-count="onLoadTotalCount"
          @apply="onFilterApply"
          @reset="onFilterReset"
        />
      </div>
    </QCardSection>

    <QTable
      v-model:pagination="pagination"
      :sort-method="sortMethod"
      :rows="contactListItems"
      :columns="tableColumns"
      :loading="loadingList"
      row-key="id"
      class="quasar-table"
      :rows-per-page-options="[0]"
      :no-data-label="null"
      flat
    >
      <template #loading>
        <QInnerLoading size="40px" color="primary" />
        <div class="no-data">
          <QSpinnerTail color="primary" size="lg" />
        </div>
      </template>

      <template v-if="contactListItems?.length === 0" #no-data>
        <div v-if="isError" class="flex column justify-center items-center q-mx-auto q-pa-lg">
          <QIcon name="error_outline" size="80px" color="negative" class="q-mb-md" />
          <Typography variant="heading" size="h6" color="blue-grey" class="q-mb-sm">
            خطا در دریافت اطلاعات
          </Typography>
          <Typography variant="body" size="1" color="blue-grey" class="q-mb-md text-center">
            {{ getErrorMessage(queryError) }}
          </Typography>
          <div class="q-gutter-sm">
            <Button text="تلاش مجدد" variant="filled" :right-icon="IconRefresh" @click="refetch" />
            <Button variant="flat" color="red" text="بازگشت" @click="$router.back()" />
          </div>
        </div>
        <div v-else-if="!isLoading" class="flex column justify-center items-center q-mx-auto">
          <img src="@/assets/images/noData.svg" alt="no-data" />
          <Typography variant="heading" size="h6" color="blue-grey">اطلاعاتی یافت نشد</Typography>
        </div>
      </template>

      <template #body-cell-userFullName="scope">
        <QTd :props="scope">
          <UserMenu :user="scope.row.user" @update-table="updateTable" />
        </QTd>
      </template>

      <template #body-cell-contactedAt="scope">
        <QTd :props="scope">
          <QChip
            :label="convertToJalaliWithTime(scope?.row?.contactedAt)"
            outline
            square
            color="blue-grey-8"
          />
        </QTd>
      </template>

      <template #body-cell-result="scope">
        <QTd :props="scope">
          <div class="result-cell">
            <QChip
              square
              :label="scope.row?.result || 'ثبت نشده'"
              :color="getResultColor(scope.row?.resultId)"
              outline
            />
            <QIcon
              :name="getCallTypeIcon(scope.row?.fileType)"
              :color="getCallTypeColor(scope.row?.fileType)"
              size="sm"
              class="q-ml-xs"
            />
          </div>
        </QTd>
      </template>

      <template #body-cell-callDuration="scope">
        <QTd :props="scope">
          <CallDurationBar :contact-item="scope.row" />
        </QTd>
      </template>

      <template #body-cell-description="scope">
        <QTd :props="scope">
          <ContactDescriptionField :contact="scope.row" @update-table="updateTable" />
        </QTd>
      </template>

      <template #body-cell-actions="scope">
        <QTd :props="scope">
          <div class="flex q-gutter-sm">
            <QBtn
              v-if="scope.row?.recordingfile && getPerms('contact', 'mass-update')"
              round
              size="sm"
              color="primary"
              outline
              :loading="isPending"
              @click="playAudio(scope.row)"
            >
              <QIcon name="volume_up" size="18px" />
              <QTooltip>فایل صوتی تماس</QTooltip>
            </QBtn>
            <QBtn
              v-if="getPerms('contact', 'update')"
              round
              size="sm"
              outline
              color="grey-7"
              @click="openContactForm(scope.row)"
            >
              <QIcon name="edit" size="18px" />
              <QTooltip>ویرایش</QTooltip>
            </QBtn>
            <QBtn
              v-if="getPerms('contact', 'delete')"
              round
              size="sm"
              outline
              color="negative"
              @click="deleteContactDialog(scope.row)"
            >
              <QIcon name="delete" size="18px" />
              <QTooltip>حذف</QTooltip>
            </QBtn>
          </div>
        </QTd>
      </template>

      <template #bottom>
        <div class="full-width flex justify-center items-center">
          <QBtn
            color="primary"
            outline
            unelevated
            :label="hasNextPage ? 'مشاهده موارد بیشتر...' : 'مورد بیشتری وجود ندارد'"
            :disable="!hasNextPage"
            :loading="isFetchingNextPage"
            @click="loadNextPage"
          />
        </div>
      </template>
    </QTable>
  </QCard>

  <ContactForm
    :visible="contactFormVisible"
    :edit-value="contactFormData"
    @submitted="afterSubmit"
    @close="closeContactForm"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import {
  useApiDeleteContact,
  useContactInfinityQuery,
  useGetAudioMutation,
  useGetContactsTotalCountMutation,
} from '../query'
import { useQueryClient } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'
import UserMenu from '@/components/UserMenu'
import { getPerms } from '@/utils/get-perms'
import ContactForm from '../components/ContactForm'
import { handleError } from '@/utils/error-handler'
import ContactDescriptionField from '../components/contactDescriptionField'
import CallDurationBar from '../components/CallDurationBar'
import { tableColumns, tableFilters } from '../constants/index'
import FilterBuilder from '@/components/FilterBuilder/FilterBuilder'
import { useHandleFilters } from '@/composables/use-handle-filters'
import { useTableSort } from '@/composables/use-table-sort'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import { IconPlus, IconRefresh } from '@tabler/icons-vue'
import { getErrorMessage } from '@/utils/get-error-message'
import Typography from '@/base/Typography'
import Button from '@/base/Button'

const queryClient = useQueryClient()
const route = useRoute()

const showAudioBar = ref(false)
const audioLoading = ref(false)
const contactFormVisible = ref(false)
const contactFormData = ref(null)
const totalContact = ref(null)
const audioRef = ref(null)
const audioInfo = ref(null)

const {
  formValues,
  apiFilters,
  applyFilters,
  resetFilters,
  handleInput,
  hasActiveFilters,
  handleSuggestFilter,
  setSort,
} = useHandleFilters(route.query, {}, tableFilters)

const { pagination, sortMethod } = useTableSort(['contact', 'all-contacts'], setSort)

const {
  data: contactListData,
  isLoading,
  isFetching,
  fetchNextPage,
  isFetchingNextPage,
  refetch,
  error: queryError,
  isError,
  hasNextPage,
} = useContactInfinityQuery(apiFilters)
const contactListItems = computed(() => {
  const pages = contactListData.value?.pages || []
  return pages.flatMap((pageData) => {
    return (pageData?.data?.items || []).map((item) => ({
      ...item,
      branchName: item?.branch?.name,
      result: item?.resultTitle,
      advisorName: item?.advisorName,
      createdBy: item?.createdBy,
      fileType:
        item?.recordingfile && typeof item.recordingfile === 'string'
          ? item.recordingfile.startsWith('external')
            ? 'ورودی'
            : item.recordingfile.startsWith('out')
              ? 'خروجی'
              : item.recordingfile.startsWith('internal')
                ? 'داخلی'
                : 'نامشخص'
          : 'نامشخص',
    }))
  })
})
const contactSuggestFilters = computed(
  () =>
    contactListData.value?.pages?.[0]?.data?.suggestFilters?.filter(
      (item) => item.type !== 'danger'
    ) || []
)

const { mutate: totalCount, isPending: isTotalCountLoading } = useGetContactsTotalCountMutation()
const { mutate: deleteContact } = useApiDeleteContact()

const loadingList = computed(() => {
  const hasData = contactListItems.value?.length > 0
  return isFetchingNextPage.value || (isLoading.value && !hasData) || isTotalCountLoading.value
})
const onLoadTotalCount = () => {
  totalContact.value = null
  isTotalCountLoading.value = true
  totalCount(apiFilters, {
    onSuccess: (data) => {
      totalContact.value = data?.data?.count
      isTotalCountLoading.value = false
    },
    onError: (e) => {
      handleError(e)
      isTotalCountLoading.value = false
    },
  })
}

const loadNextPage = () => {
  if (!hasNextPage.value) return
  fetchNextPage()
}

const updateTable = () => {
  totalContact.value = null
  queryClient.invalidateQueries({ queryKey: ['contact', 'all-contacts'] })
  Notif.success('لیست بروزرسانی شد')
}

const onFilterApply = (filteredValues) => {
  totalContact.value = null
  applyFilters(filteredValues)
  queryClient.invalidateQueries({ queryKey: ['contact', 'all-contacts'] })
}

const onFilterReset = () => {
  pagination.value = { sortBy: null, descending: false }
  totalContact.value = null
  resetFilters()
  queryClient.invalidateQueries({ queryKey: ['contact', 'all-contacts'] })
}

const onSelectSuggestFilter = (suggestFilter) => {
  handleSuggestFilter(suggestFilter)
}

const closeAudioBar = () => {
  const audio = audioRef.value
  if (audio) {
    audio.pause()
  }
  showAudioBar.value = false
}

const openContactForm = (data = {}) => {
  contactFormVisible.value = true
  contactFormData.value = data
}

const closeContactForm = () => {
  contactFormVisible.value = false
  contactFormData.value = null
}

const afterSubmit = () => {
  totalContact.value = null
}

const { mutate: getAudio, isPending } = useGetAudioMutation()

const playAudio = async (row) => {
  if (row?.recordingfile) {
    audioInfo.value = row?.user
    audioLoading.value = true
    showAudioBar.value = true

    getAudio(row.recordingfile, {
      onSuccess: async (response) => {
        try {
          const audio = audioRef.value
          if (audio) {
            const blob = response.data
            audio.src = URL.createObjectURL(blob)
            await audio.play()
          }
        } catch (error) {
          handleError(error)
          showAudioBar.value = false
        } finally {
          audioLoading.value = false
        }
      },
      onError: (error) => {
        handleError(error)
        showAudioBar.value = false
        audioLoading.value = false
      },
    })
  } else {
    Notif.warning('فایل صوتی برای کاربر موجود نیست')
  }
}

const deleteContactDialog = (row) => {
  confirmDialog(
    'حذف تماس',
    'از حذف تماس اطمینان دارید؟',
    () => {
      deleteContact(row?.id, {
        onSuccess: async (response) => {
          await updateTable()
          Notif.success(response.message)
        },
        onError: (error) => {
          handleError(error)
        },
      })
    },
    {
      ok: {
        label: 'حذف شود',
        color: 'negative',
        flat: true,
      },
      persistent: true,
    }
  )
}

const getResultColor = (resultId) => {
  if ([7, 11].includes(resultId)) return 'warning'
  if ([20].includes(resultId)) return 'positive'
  if ([16].includes(resultId)) return 'negative'
  return 'info'
}

const getCallTypeIcon = (fileType) => {
  switch (fileType) {
    case 'خروجی': {
      return 'call_made'
    }
    case 'ورودی': {
      return 'call_received'
    }
    case 'داخلی': {
      return 'phone_in_talk'
    }
    default: {
      return 'phone'
    }
  }
}

const getCallTypeColor = (fileType) => {
  switch (fileType) {
    case 'خروجی': {
      return 'negative'
    }
    case 'ورودی': {
      return 'positive'
    }
    case 'داخلی': {
      return 'primary'
    }
    default: {
      return 'grey'
    }
  }
}
</script>

<style lang="scss" scoped>
.no-data {
  width: 100%;
  height: 70dvh;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.audio-bar {
  position: fixed;
  bottom: 20px;
  left: 10px;
  width: 33%;
  z-index: 1000;

  &__card {
    background: rgba(25, 20, 20, 0.9);
    backdrop-filter: blur(8px);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 10px 40px -25px rgba(0, 0, 0, 0.3);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  &__info {
    flex: 1;
  }

  &__title {
    color: white;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  &__subtitle {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    margin: 0;
  }

  &__player {
    width: 100%;
    border-radius: 4px;
  }
}

.result-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
