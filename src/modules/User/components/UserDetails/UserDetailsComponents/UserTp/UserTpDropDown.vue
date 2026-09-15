<template>
  <div>
    <QBtnDropdown flat round color="primary" dropdown-icon="more_vert">
      <QList>
        <QItem
          v-if="getPerms('treatment-plan', 'view')"
          v-close-popup
          clickable
          @click="handleViewTreatmentPlan(plan)"
        >
          <QItemSection avatar>
            <QIcon name="visibility" color="primary" />
          </QItemSection>
          <QItemSection>مشاهده</QItemSection>
        </QItem>

        <QItem
          v-if="canEditTreatmentPlan(plan)"
          v-close-popup
          clickable
          @click="editTreatmentPlan(plan)"
        >
          <QItemSection avatar>
            <QIcon name="edit" color="primary" />
          </QItemSection>
          <QItemSection>ویرایش</QItemSection>
          <QItemSection v-if="plan.editDeadline" side>
            <QBadge color="orange" rounded class="q-pa-xs">تا {{ plan.editDeadline }}</QBadge>
          </QItemSection>
        </QItem>

        <QItem
          v-if="
            plan.installment?.id &&
            plan.isActive &&
            getPerms('treatment-plan', 'update', true, 'treatmentPlanFinancial')
          "
          v-close-popup
          clickable
          @click="openAttachFile(plan)"
        >
          <QItemSection avatar>
            <QIcon name="attach_file" color="primary" />
          </QItemSection>
          <QItemSection>اسناد مالی</QItemSection>
        </QItem>

        <QItem
          v-if="
            plan.installment?.id &&
            plan.isActive &&
            getPerms('treatment-plan', 'update', true, 'treatmentPlanFinancial')
          "
          v-close-popup
          clickable
          @click="openValidationForm(plan)"
        >
          <QItemSection avatar>
            <QIcon name="verified" color="primary" />
          </QItemSection>
          <QItemSection>اعتبارسنجی</QItemSection>
        </QItem>

        <QItem v-if="canAddFiles(plan)" v-close-popup clickable @click="openConsentUpload">
          <QItemSection avatar>
            <QIcon name="upload_file" color="primary" />
          </QItemSection>
          <QItemSection>بارگذاری رضایتنامه</QItemSection>
        </QItem>

        <QItem
          v-if="plan?.isProposed"
          v-close-popup
          clickable
          @click="sendTreatmentPlanLinkAction(plan.id)"
        >
          <QItemSection avatar>
            <QIcon name="share" color="primary" />
          </QItemSection>
          <QItemSection>ارسال لینک طرح درمان</QItemSection>
        </QItem>
      </QList>
    </QBtnDropdown>

    <AttachFileModal
      :visible="attachFileVisible"
      :edit-values="attachFileData"
      @update:visible="closeAttachFile"
      @after-submit="afterSubmitAttachFile"
    />

    <TpCreditLevel
      v-if="userCreditLevelVisible"
      :visible="userCreditLevelVisible"
      :edit-value="userCreditLevelData"
      @close="closeValidationForm"
      @submitted="afterSubmitValidationForm"
    />

    <UserRadiologyUploader
      ref="consentUploaderRef"
      :user-id="plan.id"
      default-type="treatment-plan.consent"
      :allowed-types="['treatment-plan.consent']"
      @upload-complete="handleConsentUploadComplete"
    />
  </div>
</template>
<script setup>
import { sendTreatmentPlanLink } from '@/modules/TreatmentPlan/api'
import { handleError } from '@/utils/error-handler'
import { ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { getPerms } from '@/utils/get-perms'
import TpCreditLevel from '@/modules/TreatmentPlan/components/TpList/TpCreditLevel'
import AttachFileModal from '@/modules/TreatmentPlan/components/TpList/AttachFileModal'
import { useTpLink } from '@/modules/TreatmentPlan/composables/use-tp-link'
import { useTpPermissions } from '@/modules/TreatmentPlan/composables/use-tp-permissions'
import UserRadiologyUploader from '@/modules/User/components/UserDetails/UserDetailsComponents/UserMedicalDocs/components/UserRadiologyUploader'
import { FILE_TYPE_ENUM } from '@/modules/User/enums/fileTypeEnums'
import { Notif } from '@/data/services/notification-service'
import { useAutoVerifyConsentMutation } from '@/modules/User/query/index'

const { plan, updateTable, editTreatmentPlan } = defineProps({
  plan: {
    type: Object,
    default: () => ({}),
  },
  updateTable: {
    type: Function,
    default: () => {},
  },
  editTreatmentPlan: {
    type: Function,
    default: () => {},
  },
})

const { viewTreatmentPlan } = useTpLink()
const { canEditTreatmentPlan } = useTpPermissions()
const queryClient = useQueryClient()

const userCreditLevelVisible = ref(false)
const userCreditLevelData = ref(null)
const attachFileVisible = ref(false)
const attachFileData = ref(null)
const consentUploaderRef = ref(null)

const canAddFiles = (tp) =>
  getPerms('treatment-plan', 'update', true, 'treatmentPlanFinancial') && tp?.isProposed

const closeAttachFile = () => {
  attachFileVisible.value = false
}

const afterSubmitAttachFile = () => {
  attachFileVisible.value = false
  updateTable()
}

const closeValidationForm = () => {
  userCreditLevelVisible.value = false
}

const afterSubmitValidationForm = () => {
  userCreditLevelVisible.value = false
  updateTable()
}

const sendTreatmentPlanLinkAction = (planId) => {
  sendTreatmentPlanLink(planId)
    .then(() => {
      Notif.success('لینک طرح درمان با موفقیت ارسال شد')
    })
    .catch((error) => {
      handleError(error)
    })
    .finally(() => {
      updateTable()
    })
}

const handleViewTreatmentPlan = (tp) => {
  const result = viewTreatmentPlan(tp)

  if (!result.success) {
    const messages = {
      'no-data': 'اطلاعات طرح درمان یافت نشد',
      'missing-link': 'لینک مشاهده طرح درمان موجود نیست',
      'missing-hash-key': 'کلید عمومی طرح درمان یافت نشد',
      'popup-blocked': 'لطفاً اجازه باز شدن پنجره پاپ‌آپ را بدهید',
    }

    Notif.error(messages[result.reason] || 'خطا در باز کردن طرح درمان')
  }
}

const openAttachFile = (data) => {
  attachFileVisible.value = true
  attachFileData.value = data
}

const openValidationForm = (data) => {
  userCreditLevelVisible.value = true
  userCreditLevelData.value = data
}

const openConsentUpload = () => {
  if (!consentUploaderRef.value) {
    Notif.error('خطا در بارگذاری مودال آپلود')
    return
  }
  consentUploaderRef.value.openUploadDialog()
}

const { mutate } = useAutoVerifyConsentMutation()

const autoApprove = async (id) => {
  mutate(
    { id, consent: true },
    {
      onSuccess: (response) => {
        Notif.success(response.message)
      },
    }
  )
}
const handleConsentUploadComplete = async () => {
  await autoApprove(plan.id)
  if (plan.userId) {
    await queryClient.invalidateQueries({
      queryKey: ['user', 'files', FILE_TYPE_ENUM.MEDICAL, plan.userId],
    })
  }
  updateTable()
}
</script>
<style lang="scss" scoped>
@media (max-width: 768px) {
}
</style>
