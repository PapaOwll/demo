<template>
  <div class="flex justify-end">
    <QBtn flat color="primary" label="تازه سازی لیست" @click="refetch" />
  </div>
  <div v-if="userContactsData?.length > 0" ref="scrollTargetRef" class="activity-card-container">
    <QInfiniteScroll :offset="0" :scroll-target="scrollTargetRef" @load="loadNextPage">
      <template #loading>
        <div class="row justify-center q-my-md">
          <template v-if="isFetchingNextPage">
            <QSpinnerDots color="primary" size="lg" />
          </template>
        </div>
      </template>
      <QTimeline color="blue-grey-3">
        <QTimelineEntry
          v-for="(call, index) in userContactsData"
          :key="index"
          :subtitle="convertToJalali(call.contactedAt)"
        >
          <ActivityCard :status="contactStatus[index].status.color">
            <template #title>
              <div class="row items-center q-gutter-xs q-pa-sm">
                <QAvatar
                  square
                  class="rounded-borders"
                  :color="contactStatus[index].status.iconColor"
                  :text-color="contactStatus[index].status.iconTextColor"
                >
                  <IconPhoneIncoming v-if="call.fileType === 'ورودی'" />
                  <IconPhoneOutgoing v-if="call.fileType === 'خروجی'" />
                  <IconPhoneCalling v-if="call.fileType === 'نامشخص'" />
                </QAvatar>
                <div class="flex column">
                  <span class="text-bold">{{ call.resultTitle }}</span>
                  <span class="text-secondary text-body2">
                    {{ formatDate(call.contactedAt, 'HH:mm') }}
                  </span>
                </div>
              </div>
              <QChip :label="call.fileType" s square outline class="call-type" />
              <QChip square outline color="primary" class="call-type">
                توسط : {{ call?.createdBy }}
              </QChip>
            </template>
            <template #actions>
              <QBtn flat size="sm" color="secondary" round @click="openContactForm(call)">
                <IconPencil />
              </QBtn>
            </template>
            <template #full-width>
              <QCard
                v-if="call.transcriptSummary || call.description || call.recordingfile"
                class="details-box"
                flat
              >
                <template v-if="call.transcriptSummary">
                  <span class="text-body2 text-secondary">خلاصه</span>
                  <span class="q-my-sm">{{ call.transcriptSummary }}</span>
                </template>
                <template v-if="call.description">
                  <span class="text-body2 text-secondary">توضیحات</span>
                  <span class="q-my-sm">{{ call.description }}</span>
                </template>
                <AudioBar v-if="isAdmin" :src="call.recordingfile" :total-duration="call.billsec" />
              </QCard>
            </template>
          </ActivityCard>
        </QTimelineEntry>
      </QTimeline>
      <div v-if="!hasNextPage" class="row justify-center text-caption text-grey">
        اطلاعات دیگری جهت نمایش وجود ندارد
      </div>
    </QInfiniteScroll>
  </div>
  <div v-else class="row column items-center q-mt-xl full-width full-height text-h5">
    <QInnerLoading :showing="isLoading" class="q-mx-auto q-my-auto">
      <QSpinnerTail color="primary" size="50px" />
    </QInnerLoading>
    <img src="@/assets/images/noData.svg" alt="noData" class="q-mt-xl" />
    <span>اطلاعاتی وجود ندارد</span>
  </div>
  <ContactForm
    :visible="contactModalVisible"
    :edit-value="contactData"
    @close="closeForm"
    @update-table="updateTable"
  />
</template>

<script setup>
import { ref, computed, defineAsyncComponent, watchEffect } from 'vue'
import { useContactInfinityQuery } from '@/modules/Contact'
import { convertToJalali, formatDate } from '@/utils/date-utils'
import {
  IconPhoneCalling,
  IconPhoneIncoming,
  IconPhoneOutgoing,
  IconPencil,
} from '@tabler/icons-vue'
import useDisclosure from '@/composables/use-disclosure'
import ContactForm from '@/modules/Contact/components/ContactForm'
import AudioBar from '@/components/AudioBar'
import { useQueryClient } from '@tanstack/vue-query'
import { getPerms } from '@/utils/get-perms'
import { Notif } from '@/data/services/notification-service'

const ActivityCard = defineAsyncComponent(
  () =>
    import('@/modules/User/components/UserDetails/UserDetailsComponents/UserActivity/components/ActivityCard')
)

const props = defineProps({
  propData: { type: Number, default: null },
  tabId: { type: Number || String, default: null },
})

const queryClient = useQueryClient()

const scrollTargetRef = ref(null)
const contactData = ref(null)

const filters = ref({
  'filter[user_id]': props.propData,
})

const isAdmin = computed(() => getPerms('contact', 'view'))
const enabled = computed(() => !!props.propData)
const {
  data: contactsData,
  isLoading,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
  refetch,
} = useContactInfinityQuery(filters, { enabled })

const userContactsData = computed(() => {
  const pages = contactsData.value?.pages || []
  return pages?.flatMap((pageData) => {
    return pageData.data.items.map((item) => ({
      ...item,
      branchName: item?.branch?.name,
      fileType: item?.recordingfile
        ? item?.recordingfile.startsWith('external')
          ? 'ورودی'
          : item?.recordingfile.startsWith('out')
            ? 'خروجی'
            : item?.recordingfile.startsWith('internal')
              ? 'داخلی'
              : 'نامشخص'
        : 'نامشخص',
    }))
  })
})
const contactStatus = computed(() =>
  userContactsData.value?.map((contact) => ({
    status: [7, 11].includes(contact.resultId)
      ? {
          color: 'activity-card_unknown',
          iconColor: 'white',
          iconTextColor: 'secondary',
        }
      : [20].includes(contact.resultId)
        ? {
            color: 'activity-card_active',
            iconColor: 'green-1',
            iconTextColor: 'positive',
          }
        : {
            color: 'activity-card_deactivate',
            iconColor: 'red-1',
            iconTextColor: 'negative',
          },
  }))
)
const [contactModalVisible, { toggle: toggleContactModal }] = useDisclosure()

const loadNextPage = async (_, done) => {
  if (!hasNextPage.value) {
    done(false)
    return
  }
  await fetchNextPage()
  done()
}

const openContactForm = (call) => {
  contactData.value = call
  toggleContactModal()
}
const closeForm = () => {
  toggleContactModal()
  contactData.value = null
}

const updateTable = async () => {
  const contactQueryKey = ['contact', 'all-contacts']
  const userQueryKey = ['user']
  await queryClient.invalidateQueries({ queryKey: contactQueryKey })
  await queryClient.invalidateQueries({ queryKey: userQueryKey })
  Notif.success('لیست بروزرسانی شد')
}

watchEffect(() => props.propData, refetch())
</script>

<style scoped lang="scss">
.audio-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #f4f4f4;
  padding: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1000;
}

audio {
  width: 90%;
}

.close-btn {
  background-color: transparent;
  margin: 5px 80px 0 0;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.call-type {
  align-self: start;
  margin-top: 7px;
  border: none;
  background-color: white !important;
  color: $grey-9;
}

.details-box {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 400px;
  min-height: auto !important;
  text-wrap: wrap;
  overflow-y: auto;
  padding: 16px;
  border-radius: 6px;
  gap: 8px;
}
</style>
