<template>
  <div class="bg-white flex justify-center items-center">
    <TpdDoctorDescriptionForm :loading="isLoading" :data="doctorData" :records="records" />
  </div>
</template>
<script setup>
import TpdDoctorDescriptionForm from '../components/TpDescription/TpdDoctorDescriptionForm'
import { computed } from 'vue'
import { useGetDoctorDailyReportQuery } from '@/modules/TreatmentPlan/query/index'
import { useNavigationStore } from '@/store/navigation'

const navigationStore = useNavigationStore()

const navData = computed(() => navigationStore.getTpDescriptionData() || null)

const { data, isLoading } = useGetDoctorDailyReportQuery(
  navData.value?.date,
  navData.value?.doctor?.id,
  { enabled: !!navData.value.date && !!navData.value?.doctor?.id }
)
const doctorReport = computed(() => data.value?.items || [])

const doctorData = {
  name: navData.value?.doctor?.name,
  date: navData.value?.date,
}

const records = computed(() => doctorReport.value)
</script>
