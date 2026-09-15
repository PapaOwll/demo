<template>
  <div class="tppf">
    <div class="tppf__header">
      <div class="tppf__header-logo">
        <img v-if="logoSrc" :src="logoSrc" alt="logo" class="tppf__header-logo-img" />
      </div>

      <div class="tppf__header-title">
        <Typography variant="heading" size="h3">فرم پرونده پزشکی</Typography>
      </div>

      <div class="tppf__header-meta">
        <div class="tppf__header-meta-item">
          <Typography variant="caption" color="grey">تاریخ:</Typography>
          <Typography variant="body" size="3" weight="medium">
            {{ recordData?.date || '—' }}
          </Typography>
        </div>
        <div class="tppf__header-meta-item">
          <Typography variant="caption" color="grey">ساعت نوبت:</Typography>
          <Typography variant="body" size="3" weight="medium">
            {{ recordData?.appointmentTime || '—' }}
          </Typography>
        </div>
      </div>
    </div>
    <div class="tppf__separator">
      <div class="tppf__separator-title">
        <Typography variant="heading" size="h4" weight="bold">واحد درمان</Typography>
      </div>
      <div class="tppf__separator-liner" />
    </div>
    <div class="tppf__content">
      <div class="tppf__content-right">
        <div class="tppf__content-body">
          <div class="tppf__content-attendance">
            <div class="tppf__content-attendance-item">
              <Typography variant="caption" size="4">ساعت ورود به درمان:</Typography>
              <Typography variant="body" size="4" weight="bold">
                {{ recordData?.entryTime }}
              </Typography>
            </div>
            <div class="tppf__content-attendance-item">
              <Typography variant="caption" size="4">ساعت خروج از درمان:</Typography>
              <Typography variant="body" size="4" weight="bold">
                {{ recordData?.exitTime }}
              </Typography>
            </div>
          </div>
          <div class="tppf__content-treatments">
            <Typography variant="caption" color="dark">درمان اصلی</Typography>
            <Typography variant="caption" color="dark">{{ recordData?.mainTreatment }}</Typography>
          </div>
          <div class="tppf__content-off-agreements">
            <Typography variant="caption" color="dark">درمان خارج از توافق</Typography>
            <Typography variant="caption" color="dark">
              {{ recordData?.offAgreementTreatment }}
            </Typography>
          </div>
        </div>
      </div>
      <div class="tppf__content-left">
        <div class="tppf__sign-box">
          <span class="tppf__sign-box-item">امضا واحد درمان</span>
        </div>
        <div class="tppf__sign-box">
          <span class="tppf__sign-box-item">تایید پزشک</span>
        </div>
        <div class="tppf__sign-box">
          <span class="tppf__sign-box-item">تایید بیمار</span>
        </div>
      </div>
    </div>
    <div class="tppf__next-appointment">
      <Typography variant="caption">تاریخ نوبت بعدی</Typography>
      <Typography variant="body" weight="bold">{{ recordData?.nextAppointmentTime }}</Typography>
    </div>
    <div class="tppf__labels">
      <Typography variant="caption">محل چسباندن لیبل</Typography>
    </div>
    <div class="tppf__separator">
      <div class="tppf__separator-title">
        <Typography variant="heading" size="h4" weight="bold">واحد اسکن</Typography>
      </div>
      <div class="tppf__separator-liner" />
    </div>
    <div class="tppf__content">
      <div class="tppf__content-right">
        <div class="tppf__scan">
          <Typography variant="caption">توضیحات اسکن و سی آر ام:</Typography>
          <Typography variant="caption">{{ recordData?.lodgingDescription }}</Typography>
        </div>
      </div>
      <div class="tppf__content-left">
        <div class="tppf__sign-box">
          <span class="tppf__sign-box-item">امضا واحد اسکن</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Typography from '@/base/Typography'
import logoSrc from '@/assets/images/Logo 1.png'

const defaultRecord = {
  date: null,
  appointmentTime: null,
  entryTime: null,
  exitTime: null,
  mainTreatment: '',
  offAgreementTreatment: '',
  nextAppointmentTime: null,
  labelNote: '',
  lodgingDescription: '',
}

const props = defineProps({
  record: {
    type: Object,
    default: () => ({}),
  },
  patientName: {
    type: String,
    default: '',
  },
})
console.log(props.record)
const recordData = computed(() => ({
  ...defaultRecord,
  ...props.record,
}))
</script>

<style lang="scss" scoped>
.tppf {
  background: #fff;
  width: 770px;
  min-height: 842px;
  height: 95dvh;
  direction: rtl;
  display: flex;
  margin: 0 auto;
  align-items: center;
  flex-direction: column;
  color: #1f1f1f;
  padding: $spacing-2xl;
  &__header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    column-gap: 3rem;
    &-logo {
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }
    &-logo-img {
      height: 42px;
      object-fit: contain;
    }
    &-logo-text {
      font-weight: 700;
      font-size: 1.125rem;
      letter-spacing: -0.01em;
    }
    &-title {
      align-self: center;
    }
    &-meta {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      gap: $spacing-sm;
    }
    &-meta-item {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      font-size: 12px;
    }
  }
  &__separator {
    width: 100%;
    display: flex;
    gap: $spacing-xs;
    align-items: center;
    margin: $spacing-sm 0;
    &-title {
      width: 20%;
    }
    &-liner {
      width: 80%;
      height: 2px;
      background-color: $grey-4;
    }
  }
  &__content {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    &-right {
      height: auto;
      width: 80%;
    }
    &-left {
      height: auto;
      width: 15%;
      display: flex;
      align-items: flex-end;
      flex-direction: column;
      gap: $spacing-lg;
    }
    &-body {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;
    }
    &-attendance {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 2px $grey-5 dashed;
      padding: $spacing-md $spacing-lg;
      border-radius: $radius-md;
      &-item {
        display: flex;
        align-items: center;
        gap: $spacing-lg;
      }
    }
    &-treatments {
      width: 100%;
      border: 1px solid $grey-5;
      border-radius: $radius-md;
      min-height: 163px;
      padding: $spacing-md;
      display: flex;
      flex-direction: column;
    }
    &-off-agreements {
      border: 1px solid $grey-5;
      border-radius: $radius-md;
      min-height: 72px;
      padding: $spacing-md;
      display: flex;
      flex-direction: column;
    }
  }
  &__sign-box {
    width: 90px;
    height: 90px;
    background-color: $grey-2;
    border-radius: $radius-md;
    display: flex;
    gap: $spacing-md;
    border: 1px solid $grey-5;
    &-item {
      width: 100%;
      align-self: flex-end;
      border-bottom-right-radius: $radius-md;
      border-bottom-left-radius: $radius-md;
      background-color: $grey-4;
      padding: $spacing-sm;
      font-size: 8px;
      text-align: center;
      border-top: 1px solid $grey-5;
    }
  }
  &__next-appointment {
    width: 100%;
    border: 2px $grey-5 dashed;
    border-radius: $radius-sm;
    padding: $spacing-md;
    margin: $spacing-md 0;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }
  &__labels {
    width: 100%;
    border: 1px solid $grey-5;
    border-radius: $radius-md;
    min-height: 110px;
    padding: $spacing-md;
    display: flex;
    flex-direction: column;
  }
  &__scan {
    width: 100%;
    border: 1px solid $grey-5;
    border-radius: $radius-md;
    min-height: 90px;
    padding: $spacing-md;
    display: flex;
    flex-direction: column;
  }
}
</style>
