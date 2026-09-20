<template>
  <div class="tpd-card">
    <div class="tpd-card__header">
      <div class="tpd-card__header-right">
        <div class="tpd-card__icon-box">
          <IconDental :size="16" stroke-width="1.6" class="tpd-card__header-icon" />
        </div>

        <div class="tpd-card__header-meta">
          <Typography variant="body" size="3" weight="medium" color="dark">
            {{ convertToJalali(group.bookingAt, ' jdddd - jYYYY/jMM/jDD') || '-' }}
          </Typography>
          <Typography variant="caption" color="grey">پزشک - {{ group.doctorName }}</Typography>
        </div>
      </div>

      <div class="tpd-card__header-left">
        <div class="tpd-card__creator-info">
          <Typography variant="body" size="4" weight="medium" class="tpd-card__creator-name">
            {{ creatorName }}
          </Typography>
          <Typography variant="body" size="4" weight="medium" color="grey">
            - {{ convertToJalali(createdAt, ' jdddd - jYYYY/jMM/jDD') }}
          </Typography>
        </div>

        <component
          :is="hasUploadedFile ? IconEye : IconFilePlus"
          size="20"
          class="tpd-card__action-icon"
          @click="handleActionClick"
        />
      </div>
    </div>

    <div class="tpd-card__tabs">
      <TabItem v-model="activeTab" :group="tabGroup" />
    </div>
    <div v-if="activeTab === TAB_SERVICES" class="tpd-card__services">
      <TreatmentServiceItem
        v-for="row in group.items"
        :key="row.id"
        :row="row"
        :can-view-cost="canViewCost"
        :convert-to-jalali="convertToJalali"
        :get-exact-tooth-numbers="getExactToothNumbers"
        :is-expanded="isRowExpanded(row?.id)"
        @toggle-expand="toggleExpand"
        @delete="handleDelete"
        @edit="handleEdit"
      />
    </div>

    <div v-else-if="activeTab === TAB_VOICES" class="tpd-card__voices">
      <template v-if="bookingVoices.length > 0">
        <AudioPlayerItem
          v-for="(voice, index) in bookingVoices"
          :key="voice.id"
          :audio-file="voice"
          :index="index"
          :recordable="false"
          @download="handleVoiceDownload"
        />
      </template>
      <template v-else>
        <Typography variant="body" size="4" color="grey" class="tpd-card__voices-empty">
          فایل صوتی برای این جلسه ثبت نشده است
        </Typography>
      </template>
    </div>

    <UserRadiologyUploader
      ref="uploaderRef"
      :user-id="tpId"
      :booking-id="group.bookingId"
      default-type="user.docs"
      :allowed-types="['user.docs']"
      :upload-overrides="{
        enumType: 'booking.perform',
        extraParams: { entity_id: group.bookingId, entity_type: 1 },
      }"
      @upload-complete="onUploadComplete"
    />

    <ImagePreviewModal
      v-model="showPreview"
      :images="previewImages"
      :initial-index="previewIndex"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IconDental, IconEye, IconFilePlus } from '@tabler/icons-vue'
import Typography from '@/base/Typography'
import TabItem from '@/base/TabItem'
import ImagePreviewModal from '@/components/common/ImagePreviewModal'
import UserRadiologyUploader from '@/modules/User/components/UserDetails/UserDetailsComponents/UserMedicalDocs/components/UserRadiologyUploader'
import { useQueryClient } from '@tanstack/vue-query'
import { getCreatorName } from '@/modules/TreatmentPlan/utils/creator'
import TreatmentServiceItem from './TreatmentServiceItem'
import AudioPlayerItem from '@/components/audio/AudioPlayerItem'
import { useBookingVoicesQuery } from '@/modules/TreatmentPlan/query'

const props = defineProps({
  group: { type: Object, required: true },
  tpId: { type: [String, Number], default: null },
  createdBy: { type: Object, default: () => null },
  createdAt: { type: String, default: '' },
  bookingId: { type: [String, Number], default: null },
  canViewCost: { type: Boolean, default: false },
  convertToJalali: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  getExactToothNumbers: { type: Function, required: true },
  isRowExpanded: { type: Function, required: true },
  toggleExpand: { type: Function, required: true },
  handleDelete: { type: Function, required: true },
  handleEdit: { type: Function, required: true },
})

const TAB_SERVICES = 'services'
const TAB_VOICES = 'voices'

const activeTab = ref(TAB_SERVICES)

const tabGroup = [
  { value: TAB_SERVICES, label: 'خدمت ها' },
  { value: TAB_VOICES, label: 'فایل های صوتی' },
]

const queryClient = useQueryClient()
const uploaderRef = ref(null)

const { data: bookingVoicesData } = useBookingVoicesQuery(computed(() => props.group?.bookingId))

const bookingVoices = computed(() =>
  (bookingVoicesData.value || []).map((voice) => ({
    id: voice.id,
    url: voice.path,
    name: voice.name || voice.fileName || `voice-${voice.id}`,
    durationMs: voice.duration || 0,
    uploadType: 'voice',
    originalVoice: voice,
    date: voice.createdAt ? new Date(voice.createdAt) : new Date(),
  }))
)

const handleVoiceDownload = (file) => {
  if (!file?.url) return
  const link = document.createElement('a')
  link.href = file.url
  link.download = file.name || 'voice.wav'
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  setTimeout(() => link.remove(), 100)
}

const hasUploadedFile = ref(false)

const uploadedImages = computed(() => props.group.performFiles || [])

const creatorName = computed(() => getCreatorName(props.createdBy, '-'))

watch(
  uploadedImages,
  (val) => {
    if (val.length > 0) hasUploadedFile.value = true
  },
  { immediate: true }
)

const showPreview = ref(false)
const previewIndex = ref(0)

const previewImages = computed(() =>
  uploadedImages.value.map((img) => ({
    url: img.path || img.url,
    name: img.type || 'تصویر',
  }))
)

const openPreview = (index) => {
  previewIndex.value = index
  showPreview.value = true
}

const handleActionClick = () => {
  if (hasUploadedFile.value && uploadedImages.value.length > 0) {
    openPreview(0)
  } else {
    uploaderRef.value?.openUploadDialog()
  }
}

const onUploadComplete = async () => {
  hasUploadedFile.value = true
  await queryClient.invalidateQueries({
    queryKey: ['tp-description', props.tpId],
  })
}
</script>

<style scoped lang="scss">
.tpd-card {
  border: 1px solid $grey-3;
  border-radius: $radius-md;
  overflow: hidden;
  background: $white;
  transition: box-shadow 0.2s ease;
  padding: $spacing-lg;
  background: $grey-1;

  & + & {
    margin-top: $spacing-sm;
  }

  &:hover {
    box-shadow: 0 2px 12px rgba($dark, $opacity-light);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    @include media-breakpoint-down(sm) {
      flex-wrap: wrap;
      gap: $spacing-sm;
    }
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__header-icon {
    color: $grey-5;
    flex-shrink: 0;
  }

  &__header-meta {
    display: flex;
    flex-direction: column;
    gap: $spacing-xxs;
    align-items: flex-start;
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__icon-box {
    width: 48px;
    height: 48px;
    border-radius: $radius-sm;
    border: 1px solid $grey-3;
    background-color: $white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__creator-info {
    display: flex;

    gap: $spacing-xxs;
    align-items: flex-end;
  }

  &__creator-name {
    font-weight: 500;
    font-size: 14px;
    color: $grey-text;
  }

  &__tabs {
    width: 100%;
    display: flex;
    justify-content: start;
    margin: $spacing-sm 0;
  }

  &__voices {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__voices-empty {
    text-align: center;
    padding: $spacing-lg 0;
  }

  &__action-icon {
    color: $grey-5;
    cursor: pointer;

    &:hover {
      color: $grey-7;
    }
  }
}
</style>
