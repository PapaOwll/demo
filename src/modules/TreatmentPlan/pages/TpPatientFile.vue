<template>
  <div class="bg-white">
    <TpPatientFile :record="record" :patient-name="patientName" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useNavigationStore } from '@/store/navigation'
import TpPatientFile from '@/modules/TreatmentPlan/components/TpDescription/TpPatientFile/index'
import { mockRecord } from '@/modules/TreatmentPlan/mocks/patient-file'
import { convertToJalali, convertToJalaliWithTime } from '@/utils/date-utils'

const navigationStore = useNavigationStore()
const navData = computed(() => navigationStore.getTpDescriptionData() || null)

const patientName = computed(
  () =>
    `${navData.value?.user?.firstName || ''} ${navData.value?.user?.name || ''}`.trim() ||
    'مهدی عبدالملکی'
)

const record = computed(() => {
  const data = navData.value
  if (!data) return mockRecord

  const { bookingAt } = data

  return {
    patientName,
    date: bookingAt ? convertToJalali(bookingAt, 'jYYYY/jMM/jDD') : null,
    appointmentTime: bookingAt ? convertToJalaliWithTime(bookingAt, 'HH:mm') : null,
    entryTime: data.entryTime || convertToJalaliWithTime(Date.now(), 'HH:mm'),
    exitTime: data.exitTime || convertToJalaliWithTime(Date.now(), 'HH:mm'),
    mainTreatment:
      data.treatmentPlan?.description ||
      data.mainTreatment ||
      data.description ||
      mockRecord.mainTreatment,
    offAgreementTreatment:
      data.treatmentPlan?.offAgreementTreatment || data.offAgreementTreatment || '',
    nextAppointmentTime: data.treatmentPlan?.nextAppointmentTime
      ? convertToJalaliWithTime(data.treatmentPlan.nextAppointmentTime)
      : convertToJalaliWithTime(Date.now(), 'HH:mm - jYYYY/jMM/jDD'),
    labelNote: data.labelNote || '',
    lodgingDescription:
      data.treatmentPlan?.lodgingDescription ||
      data.lodgingDescription ||
      data.crmDescription ||
      mockRecord.lodgingDescription,
  }
})
</script>
