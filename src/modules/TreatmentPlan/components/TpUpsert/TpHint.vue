<template>
  <div v-if="isSerita && !treatmentData?.isPerformed" class="tph">
    <div class="tph__hint">
      <div>
        <ul>
          <li class="tph__hint-item--bolded">
            پیش از شروع درمان کلیه چک ها با تاریخ از پیش تعیین شده بنام شرکت {{ payeeName }} با
            شناسه ملی {{ nationalId }} ثبت گردد
          </li>
          <li>چک باید صیادی و در وضعیت سفید باشد</li>
          <li>در صورتیکه صاحب چک صادر شده نیستید، باید کارت ملی صاحب چک همراه شما باشد</li>
          <li v-if="!isOrthopedic()" class="text-negative text-subtitle2">
            هزینه مربوط به روکش ایمپلنت زمان قالبگیری تعیین می گردد
          </li>
          <li>اعتبار این سند (پیش فاکتور) تا ۲۰ روز از تاریخ صدور می باشد</li>
        </ul>
      </div>
      <div class="tph__hint-title">ملاحظات</div>
      <div>
        <ul>
          <li>در صورت افزایش یا کاهش هر یک از خدمات ارائه شده هزینه مربوط اعمال خواهد شد</li>
          <!-- <li>
            در صورت انتخاب “پرداخت اقساطی” وارد لینک
            <a href="https://www.icescoring.com" target="_blank">www.icescoring.com</a>
            شده و نتیجه گزارش اعتبار سنجی را برای مشاور خود ارسال فرمایید.
          </li> -->
          <!--          <li>-->
          <!--            در صورت نیاز به مراقبت قبل/پس از درمان وارد لینک-->
          <!--            <a href="https://guide.drserita.com" target="_blank">guide.drserita.com</a>-->
          <!--            شوید.-->
          <!--          </li>-->
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { isOrthopedic } from '@/utils/tenant-utils'
import { useRoute } from 'vue-router'
import { useGetUserByIdQuery } from '../../query'
import { useBranchInfo } from '../../composables/use-branch-info'
import { useTpProvider } from '../../composables/use-tp-provider'

const route = useRoute()
const treatmentData = useTpProvider('treatmentData')
const { payeeName, nationalId } = useBranchInfo(treatmentData)

const userId = route?.query?.['user-id']

const { data: userData } = useGetUserByIdQuery(userId, !!userId)

const user = computed(() => {
  return userData.value ?? treatmentData?.value?.user
})

const isSerita = computed(() => {
  if (!user.value) return false
  return (
    user.value?.entityId === 12 ||
    JSON.parse(localStorage.getItem('current-industry-header'))?.clinic?.id === 12
  )
})
</script>

<style lang="scss" scoped>
.tph {
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  background-color: $white;
  color: $gray-900;
  padding: 20px;
  font-size: 0.875rem;
  &__hint {
    font-size: 0.75rem;
  }

  &__hint-item--bolded {
    color: #9c27b0;
    font-weight: bold;
  }

  &__hint-title {
    font-weight: bold;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
}
</style>
