<template>
  <QBtn
    v-if="!booking?.canceledAt"
    :outline="!!booking.visit"
    class="btn-visit"
    unelevated
    :color="booking.type === 2 ? 'primary' : 'positive'"
    @click="handleClick"
  >
    {{ booking.visit ? 'ویرایش مراجعه' : 'ثبت مراجعه' }}
  </QBtn>
  <QChip v-else square class="btn-visit chips-error" outline>
    <span class="q-mx-auto">کنسلی</span>
    <QTooltip class="text-white bg-black text-caption">
      <p>کنسل شده در تاریخ {{ convertToJalaliWithTime(booking?.canceledAt) }}</p>
      <p>
        {{
          booking.type === 2
            ? 'برای ثبت مراجعه ابتدا نوبت انجام کار را فعال کنید'
            : 'برای ثبت مراجعه ابتدا نوبت مشاوره را فعال کنید'
        }}
      </p>
    </QTooltip>
  </QChip>
  <VisitForm
    v-if="visitFormVisible"
    :visible="visitFormVisible"
    :edit-value="visitFormData"
    @close="closeUserFormDialog"
    @on-submit="afterSubmit"
  />
</template>

<script setup>
import VisitForm from '@/modules/Booking/components/VisitForm'
import { ref, watch } from 'vue'
import { convertToJalaliWithTime } from '@/utils/date-utils'

const emits = defineEmits(['updateTable', 'onSubmit'])
const props = defineProps(['booking'])
const visitFormVisible = ref(false)
const visitFormData = ref(null)

const handleClick = () => {
  visitFormVisible.value = true
  visitFormData.value = props.booking
}

const closeUserFormDialog = () => {
  visitFormVisible.value = false
}
const afterSubmit = () => {
  visitFormVisible.value = false
  emits('updateTable')
}
watch(
  () => props?.booking,
  (value) => {
    visitFormData.value = value
  }
)
</script>

<style scoped>
.btn-visit {
  min-width: 106px;
  width: 106px;
  min-height: 32px;
  height: 32px;
}
</style>
