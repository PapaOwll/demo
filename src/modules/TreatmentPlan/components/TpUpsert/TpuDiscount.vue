<template>
  <div class="tpd">
    <QCardActions class="tpd__top" @click.self="expanded = !expanded">
      <span @click="expanded = !expanded">شرایط خاص</span>
      <QSpace />
      <QBtn
        color="grey"
        round
        flat
        dense
        :icon="expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
        @click="expanded = !expanded"
      />
    </QCardActions>
    <QSlideTransition>
      <div v-if="expanded" class="tpd__form">
        <QInput
          :model-value="discountData.value"
          :mask="discountData.type === 'amount' ? '###,###,###,###' : '###'"
          outlined
          dense
          :disable="!props.isEditMode"
          :placeholder="discountData.type === 'amount' ? 'مبلغ تخفیف' : 'درصد تخفیف'"
          :suffix="discountData.type === 'amount' ? 'تومان' : 'درصد'"
          reverse-fill-mask
          @change="(e) => updateDiscountField(e, 'value')"
        >
          <template #after>
            <QBtn
              v-show="discountData.type === 'amount'"
              round
              flat
              dense
              :disable="!props.isEditMode"
              @click="updateDiscountField('percentage', 'type')"
            >
              <IconDiscount stroke="1.5" />
            </QBtn>
            <QBtn
              v-show="discountData.type === 'percentage'"
              round
              flat
              dense
              :disable="!props.isEditMode"
              @click="updateDiscountField('amount', 'type')"
            >
              <IconCash stroke="1.5" />
            </QBtn>
          </template>
        </QInput>
        <QInput
          :model-value="couponData.code"
          outlined
          dense
          label="کوپن"
          placeholder="ثبت و بررسی کوپن"
          :loading="isPending || isAutoRecalculating"
          :disable="isPending || isAutoRecalculating || !props.isEditMode"
          @change="(e) => updateCouponField(e)"
        >
          <template #after>
            <div class="row q-gutter-xs">
              <QBtn
                outline
                :color="!treatmentData.couponData?.value ? 'blue' : 'red'"
                :loading="isPending || isAutoRecalculating"
                @click="
                  () =>
                    !treatmentData.couponData?.value ? performCouponCalculation() : removeCoupon()
                "
              >
                <component :is="!treatmentData.couponData?.value ? IconCheck : IconTrash" />
              </QBtn>
            </div>
          </template>
        </QInput>
      </div>
    </QSlideTransition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useTpProvider } from '../../composables/use-tp-provider'
import { IconCash, IconCheck, IconDiscount, IconTrash } from '@tabler/icons-vue'
import { useCalculateCouponCodeMutation } from '@/modules/TreatmentPlan/query/index'
import { Notif } from '@/data/services/notification-service'
import {
  buildServeIndustries,
  buildServeIndustryItems,
} from '@/modules/TreatmentPlan/utils/question-items-builder'
import { useUserStore } from '@/store/user'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const { branchId } = storeToRefs(userStore)

const props = defineProps({
  isEditMode: {
    type: Boolean,
    default: true,
  },
  itemList: { type: Array, default: () => [] },
})

const defaultDiscount = { description: '', type: 'percentage', value: '' }
const defaultCoupon = { code: '', value: 0 }

const { treatmentData, updateTreatment } = useTpProvider(['treatmentData', 'updateTreatment'])
const expanded = ref(false)
const isAutoRecalculating = ref(false)
let debounceTimer = null
let isRecalculationPending = false

const discountData = computed(() => treatmentData?.value?.discountData || defaultDiscount)
const couponData = computed(() => treatmentData.value?.couponData || defaultCoupon)

const updateDiscountField = (value, field) => {
  updateTreatment({
    discountData:
      field === 'type'
        ? { ...discountData.value, [field]: value, value: '' }
        : {
            ...discountData.value,
            [field]:
              field === 'value'
                ? discountData.value?.type === 'percentage'
                  ? value.replace(/\D*/g, '') > 100
                    ? '100'
                    : value.replace(/\D*/g, '')
                  : value.replace(/\D*/g, '')
                : value,
          },
  })
}
const updateCouponField = (value) => {
  updateTreatment({
    couponData: {
      code: value,
      value: 0,
    },
  })
}
const { mutate: calculateCoupon, isPending } = useCalculateCouponCodeMutation()
const performCouponCalculation = () => {
  const code = couponData.value?.code?.trim()

  if (!code || code.length === 0) {
    Notif.error('فیلد کوپن الزامیست!', {
      caption: 'ابتدا کوپن را به درستی وارد کنید، سپس مجدد تلاش کنید',
    })
    return
  }

  if (code.length < 3) {
    Notif.error('کد کوپن نامعتبر', {
      caption: 'کد کوپن باید حداقل ۳ کاراکتر باشد',
    })
    return
  }

  const data = {
    code,
    branchId: branchId.value || null,
    serveIndustries: buildServeIndustries(treatmentData?.value?.teeth),
    serveIndustryItems: props.itemList.flatMap((item) =>
      item.questions.flatMap((question) => buildServeIndustryItems(question)).filter(Boolean)
    ),
  }

  calculateCoupon(
    { ...data },
    {
      onSuccess: (response) => {
        Notif.success(response?.message || 'کد تخفیف اعمال شد', {
          caption: 'کد تخفیف با موفقیت اعمال شد',
        })
        updateTreatment({
          couponData: {
            code,
            value: response?.data?.discount ?? 0,
          },
        })
      },
      onError: (error) => {
        const errorMessage = error?.response?.data?.message

        Notif.error(errorMessage)
        updateTreatment({
          couponData: {
            code,
            value: 0,
          },
        })
      },
      onSettled: () => {
        isAutoRecalculating.value = false
        isRecalculationPending = false
      },
    }
  )
}

const removeCoupon = () => {
  updateTreatment({
    couponData: {
      code: null,
      value: 0,
    },
  })
}

const triggerCouponRecalculation = () => {
  if (isRecalculationPending) return

  isRecalculationPending = true

  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(() => {
    if (couponData.value?.code) {
      isAutoRecalculating.value = true
      performCouponCalculation()
    }
  }, 1000)
}

watch(
  () => [treatmentData?.value?.teeth, props.itemList],
  ([newTeeth, newItemList], [oldTeeth, oldItemList]) => {
    if (!couponData.value?.code) return

    const teethChanged =
      !oldTeeth ||
      newTeeth?.length !== oldTeeth?.length ||
      newTeeth?.some((t, i) => {
        const oldItem = oldTeeth[i]
        return (
          !oldItem || t.serve?.id !== oldItem.serve?.id || t.teeth?.length !== oldItem.teeth?.length
        )
      })

    const itemsChanged =
      !oldItemList ||
      newItemList?.length !== oldItemList?.length ||
      newItemList?.some((item, i) => {
        const oldItem = oldItemList[i]
        return (
          !oldItem ||
          item.serveId !== oldItem.serveId ||
          item.questions?.length !== oldItem.questions?.length
        )
      })

    if (teethChanged || itemsChanged) {
      triggerCouponRecalculation()
    }
  },
  { deep: true }
)

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<style lang="scss" scoped>
.tpd {
  border: 1px solid $grey-3;
  border-radius: 0.5rem;
  background-color: $grey-1 !important;
  &__top {
    cursor: pointer;
  }

  &__form {
    padding: map-get($space-sm, x);
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    :deep(.el-input__inner) {
      text-align: center;
    }
  }

  &__form-select {
    width: 80px;
    border: 1px solid $gray-200;
    border-radius: 4px;
    box-shadow: none;
  }

  :deep(.el-input-group__append) {
    padding: 0;
    border: none;
    box-shadow: none;
    margin-right: 4px;
  }

  :deep(.el-input-group__prepend) {
    border-radius: 4px;
    margin-left: 4px;
    border: none;
    box-shadow: none;
  }

  &__input {
    direction: rtl;
  }
}
</style>
