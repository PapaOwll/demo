<template>
  <QCardSection class="df">
    <div class="df__header">
      <Button variant="flat" size="lg" color="dark" :left-icon="IconArrowRight" to="/ads/coupon" />
      <Typography variant="heading" size="h5">
        {{ isViewMode ? `جزئیات کد تخفیف ${formData.name || ''}` : 'افزودن کد تخفیف' }}
      </Typography>
    </div>
    <QSeparator />
    <div v-if="isFetchingCoupon" class="df__content">
      <QInnerLoading :showing="isFetchingCoupon">
        <QSpinnerTail size="40" color="primary" />
        <Typography variant="caption">در حال دریافت اطلاعات منتظر بمانید</Typography>
      </QInnerLoading>
    </div>
    <div v-if="showDataError" class="df__content">
      <QCard flat bordered class="q-pa-lg text-center column">
        <Typography variant="body" size="3" color="red" class="q-mb-md">
          {{ dataErrorMessage }}
        </Typography>
        <div class="flex items-center q-gutter-sm full-width justify-center">
          <Button text="تلاش مجدد" :right-icon="IconRefresh" @click="handleRetryFetchCoupon" />
          <Button
            variant="outline"
            text="بازگشت به لیست"
            color="grey"
            to="/ads/coupon"
            class="q-ml-sm"
          />
        </div>
      </QCard>
    </div>
    <div v-if="!isFetchingCoupon && !showDataError" class="df__content">
      <Typography variant="heading" size="h6">اطلاعات تخفیف</Typography>
      <div class="df__content--box">
        <div class="col-grow col-auto">
          <TextField
            :model-value="formData.name"
            variant="outline"
            label="نام تخفیف"
            required
            clearable
            :disable="isFieldDisabled"
            :error="!!errors.name"
            :error-message="errors.name"
            @update:model-value="(v) => updateField('name', v)"
          />
        </div>
        <div class="col-grow col-auto">
          <BranchSelect
            :model-value="formData.branchId"
            label="شعبه"
            required
            map-option
            option-label="label"
            option-value="value"
            filterable
            clearable
            :disable="isFieldDisabled"
            :error="!!errors.branchId"
            :error-message="errors.branchId"
            @update:model-value="(v) => updateField('branchId', v)"
          />
        </div>
        <div class="col-grow col-auto">
          <TextField
            :model-value="codeInput"
            variant="outline"
            label="کد تخفیف"
            required
            :disable="isFieldDisabled"
            :error="!!errors.code"
            :error-message="errors.code"
            :is-loading="isValidatingCode || isGeneratingCoupon"
            @update:model-value="
              (v) => {
                codeInput = v
              }
            "
          >
            <template #startSection>
              <IconRosetteDiscount stroke="2" />
            </template>
            <template #endSection>
              <Button
                v-if="!isViewMode"
                is-icon-only
                :left-icon="IconWand"
                variant="flat"
                color="grey"
                size="sm"
                :is-loading="isGeneratingCoupon"
                :is-disabled="isGeneratingCoupon"
                @click="generateCouponCode"
              >
                <QTooltip>تولید خودکار کد</QTooltip>
              </Button>
            </template>
          </TextField>
        </div>
        <div class="col-grow col-md-1 self-end">
          <Button
            variant="flat"
            color="grey"
            size="md"
            is-rounded
            is-icon-only
            :left-icon="IconCopy"
            :is-disabled="isFieldDisabled"
            @click="copyDiscountCode"
          />
        </div>
      </div>

      <div
        v-for="(serveGroup, serveIndex) in formData.conditions"
        :key="serveIndex"
        class="df__serve-group"
      >
        <QSeparator />
        <Typography variant="heading" size="h5">
          {{ serveIndex === 0 ? 'شرایط اعمال تخفیف' : `خدمت ${serveIndex + 1}` }}
        </Typography>

        <div class="df__content--box">
          <div class="row full-width">
            <div class="col-md-4">
              <SelectField
                :model-value="serveGroup.serveIndustryId?.id || serveGroup.serveIndustryId"
                :options="serves"
                variant="outline"
                option-value="id"
                option-label="title"
                label="خدمت"
                placeholder="خدمت را انتخاب کنید"
                required
                clearable
                :disable="isFieldDisabled"
                map-options
                class="full-width"
                :error="!!errors.serveIndustryId"
                :error-message="errors.serveIndustryId"
                @update:model-value="(v) => updateServeField(serveIndex, 'serveIndustryId', v)"
              />
            </div>
          </div>

          <div v-for="(item, itemIndex) in serveGroup.items" :key="itemIndex" class="df__item-row">
            <div class="row items-end full-width q-gutter-sm">
              <div class="col-grow col-md-3">
                <SelectField
                  :model-value="item.serveIndustryQuestionId?.id || item.serveIndustryQuestionId"
                  :options="availableQuestionsMap[serveIndex]"
                  option-value="id"
                  option-label="title"
                  variant="outline"
                  label="آیتم"
                  placeholder="آیتم را انتخاب کنید"
                  :required="!isAllSelectedMap[serveIndex]"
                  :disable="shouldDisableQuestionsMap[serveIndex] || isFieldDisabled"
                  :option-disable="(opt) => opt.disabled || false"
                  clearable
                  map-options
                  @update:model-value="
                    (v) => updateItemField(serveIndex, itemIndex, 'serveIndustryQuestionId', v)
                  "
                />
              </div>
              <div class="col-grow col-md-3">
                <SelectField
                  :model-value="item.serveIndustryItemId?.id || item.serveIndustryItemId"
                  :options="availableItemsMap[serveIndex][itemIndex]"
                  map-options
                  option-label="title"
                  option-value="id"
                  variant="outline"
                  label="جزئیات"
                  placeholder="جزئیات آیتم را انتخاب کنید"
                  :disable="shouldDisableItemsMap[serveIndex][itemIndex] || isFieldDisabled"
                  clearable
                  @update:model-value="
                    (v) => updateItemField(serveIndex, itemIndex, 'serveIndustryItemId', v)
                  "
                />
              </div>
              <div class="col-grow col-md-3">
                <CurrencyField
                  v-if="item.discountType === 'fixed'"
                  :model-value="item.discountValue"
                  variant="outline"
                  label="مبلغ تخفیف"
                  placeholder="مبلغ تخفیف را وارد کنید"
                  :disable="isFieldDisabled"
                  :error="!!errors[`conditions[${serveIndex}].items[${itemIndex}].discountValue`]"
                  :error-message="
                    errors[`conditions[${serveIndex}].items[${itemIndex}].discountValue`]
                  "
                  @update:model-value="
                    (v) => updateItemField(serveIndex, itemIndex, 'discountValue', v)
                  "
                />
                <NumberField
                  v-else
                  :model-value="item.discountValue"
                  variant="outline"
                  label="درصد تخفیف"
                  placeholder="درصد تخفیف را وارد کنید"
                  :disable="isFieldDisabled"
                  :error="!!errors[`conditions[${serveIndex}].items[${itemIndex}].discountValue`]"
                  :error-message="
                    errors[`conditions[${serveIndex}].items[${itemIndex}].discountValue`]
                  "
                  @update:model-value="
                    (v) => updateItemField(serveIndex, itemIndex, 'discountValue', v)
                  "
                />
              </div>
              <div class="col-auto flex q-gutter-sm">
                <Button
                  v-if="item.discountType === 'percent'"
                  variant="outline"
                  color="grey"
                  :left-icon="IconCash"
                  is-icon-only
                  is-rounded
                  size="md"
                  :disable="isFieldDisabled"
                  @click="updateItemField(serveIndex, itemIndex, 'discountType', 'fixed')"
                >
                  <QTooltip>تخفیف نقدی</QTooltip>
                </Button>
                <Button
                  v-if="item.discountType === 'fixed'"
                  variant="outline"
                  color="grey"
                  :left-icon="IconDiscount"
                  is-icon-only
                  is-rounded
                  size="md"
                  :disable="isFieldDisabled"
                  @click="updateItemField(serveIndex, itemIndex, 'discountType', 'percent')"
                >
                  <QTooltip>تخفیف درصدی</QTooltip>
                </Button>
              </div>

              <QSpace />
              <Button
                v-if="shouldShowDeleteButtonMap[serveIndex] && !isViewMode"
                variant="flat"
                color="dark"
                is-icon-only
                is-rounded
                size="lg"
                :left-icon="IconX"
                @click="removeItem(serveIndex, itemIndex)"
              />
            </div>
          </div>
          <div class="col-12 col-auto q-mt-md">
            <div v-if="!isFieldDisabled" class="relative-position">
              <Button
                variant="flat"
                color="primary"
                text="افزودن آیتم"
                :right-icon="IconPlus"
                :is-disabled="shouldDisableAddItemMap[serveIndex]"
                @click="addItem(serveIndex)"
              />
              <QTooltip v-if="getAddItemTooltipMap[serveIndex]" anchor="top middle">
                {{ getAddItemTooltipMap[serveIndex] }}
              </QTooltip>
            </div>
          </div>
        </div>

        <div v-if="formData.conditions.length > 1 && !isViewMode" class="q-mt-md">
          <Button
            variant="flat"
            color="red"
            text="حذف این خدمت"
            :left-icon="IconX"
            @click="removeServe(serveIndex)"
          />
        </div>
      </div>

      <div v-if="!isViewMode" class="col-grow col-auto q-my-md">
        <Button
          variant="flat"
          color="primary"
          text="افزودن خدمت"
          :right-icon="IconPlus"
          :is-disabled="shouldDisableAddServe"
          @click="addServe"
        />
      </div>

      <QSeparator />
      <Typography variant="heading" size="h5">تاریخ اعتبار</Typography>
      <div class="df__content--box">
        <div class="col-md-1 col-auto">
          <Typography variant="body" size="4">از</Typography>
        </div>
        <div class="col-md-3 col-auto">
          <PersianDate
            :model-value="formData.startsAt"
            :disable="isFieldDisabled"
            :error="!!errors.startsAt"
            :error-message="errors.startsAt"
            @update:model-value="(v) => updateField('startsAt', v)"
          />
        </div>
        <div class="col-md-1 col-auto">
          <Typography variant="body" size="4">تا</Typography>
        </div>
        <div class="col-md-3 col-auto">
          <PersianDate
            :model-value="formData.expiresAt"
            :disable="!formData.hasExpire || isFieldDisabled"
            :error="!!errors.expiresAt"
            :error-message="errors.expiresAt"
            @update:model-value="(v) => updateField('expiresAt', v)"
          />
        </div>
        <QSpace />
        <div class="flex q-gutter-sm">
          <div class="column">
            <Typography variant="body" size="3" weight="semibold">انقضا دارد</Typography>
          </div>
          <Toggle
            :model-value="formData.hasExpire"
            :disabled="isFieldDisabled"
            @update:model-value="(v) => updateField('hasExpire', v)"
          />
        </div>
      </div>
      <QSeparator />
      <Typography variant="heading" size="h5">تعداد استفاده</Typography>
      <div class="df__content--box">
        <div class="col-md-5 col-auto">
          <TextField
            :model-value="formData.limit"
            :disable="formData.hasUnLimit || isFieldDisabled"
            variant="outline"
            hint="با تکمیل این ضرفیت، کد به طور خودکار غیرفعال می شود"
            :error="!!errors.limit"
            :error-message="errors.limit"
            @update:model-value="(v) => updateField('limit', v)"
          />
        </div>
        <QSpace />
        <Toggle
          :model-value="formData.hasUnLimit"
          label="بدون محدودیت"
          :disabled="isFieldDisabled"
          flip
          @update:model-value="(v) => updateField('hasUnLimit', v)"
        />
      </div>
      <QSeparator />
      <TextField
        :model-value="formData.description"
        required
        type="textarea"
        rows="5"
        label="توضیحات"
        variant="outline"
        :disable="isFieldDisabled"
        @update:model-value="(v) => updateField('description', v)"
      />
      <QSeparator />
      <div v-if="!isViewMode" class="flex q-gutter-sm">
        <Button
          text="ثبت کد تخفیف"
          :is-loading="isLoading"
          :is-disabled="isLoading"
          @click="handleSubmit"
        />
        <Button text="لغو" variant="outline" color="grey" to="/ads/coupon" />
      </div>
    </div>
  </QCardSection>
</template>

<script setup>
import {
  IconArrowRight,
  IconCopy,
  IconPlus,
  IconRefresh,
  IconRosetteDiscount,
  IconWand,
  IconX,
  IconCash,
  IconDiscount,
} from '@tabler/icons-vue'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import TextField from '@/base/TextField'
import SelectField from '@/base/SelectField'
import CurrencyField from '@/components/Form/CurrencyField'
import NumberField from '@/components/Form/NumberField'
import BranchSelect from '@/components/Form/BranchSelect'
import { copyToClipboard } from '@/utils/copy-to-clipboard'
import PersianDate from '@/components/Form/PersianDate'
import Toggle from '@/base/Toggle'
import { useGetServesQuery } from '@/modules/User/query/index'
import {
  useCreateCouponMutation,
  useGenerateCouponMutation,
  useGetCouponByIdQuery,
  useValidateCouponQuery,
} from '@/modules/Ads/query'
import { computed, nextTick, ref, watch } from 'vue'
import { getTodayJalali } from '@/utils/date-utils'
import { handleError } from '@/utils/error-handler'
import { useRoute, useRouter } from 'vue-router'
import { Notif } from '@/data/services/notification-service'
import { useQueryClient } from '@tanstack/vue-query'
import { debounce } from '@/utils/lodash-utils'
import { ALL_OPTION } from './couponHelpers'
import { useCouponForm } from './useCouponForm'

const queryClient = useQueryClient()
const router = useRouter()
const route = useRoute()

const couponId = route.params?.id
const isViewMode = computed(() => !!couponId && route.path.includes('/view/'))

const DEFAULT_DISCOUNT_TYPE = 'percent'

const formData = ref({
  name: '',
  code: '',
  branchId: null,
  conditions: [
    {
      serveIndustryId: null,
      items: [
        {
          serveIndustryQuestionId: null,
          serveIndustryItemId: null,
          discountValue: '',
          discountType: DEFAULT_DISCOUNT_TYPE,
        },
      ],
    },
  ],
  hasExpire: false,
  startsAt: new Date(),
  expiresAt: null,
  hasUnLimit: false,
  limit: '',
  description: '',
  discountType: DEFAULT_DISCOUNT_TYPE,
})
const codeInput = ref(formData.value.code)
const debouncedCode = ref('')

const { mutate: createCoupon, isPending: createPending } = useCreateCouponMutation()
const { mutate: generateCoupon, isPending: isGeneratingCoupon } = useGenerateCouponMutation()

const {
  data: couponData,
  isLoading: isFetchingCoupon,
  isError: isFetchError,
  error: fetchError,
  refetch: refetchCoupon,
} = useGetCouponByIdQuery(couponId, {
  enabled: isViewMode.value,
})

const showDataError = ref(false)
const dataErrorMessage = ref('')

const { data: allServes, isLoading: servesLoading } = useGetServesQuery()

const {
  validate,
  errors,
  availableQuestionsMap,
  availableItemsMap,
  isAllSelectedMap,
  shouldDisableQuestionsMap,
  shouldDisableItemsMap,
  shouldDisableAddItemMap,
  shouldDisableAddServe,
  shouldShowDeleteButtonMap,
  getAddItemTooltipMap,
  updateField,
  updateServeField,
  updateItemField,
  addItem,
  removeItem,
  addServe,
  removeServe,
  transformConditionsToFormServes,
  transformFormDataToApi,
} = useCouponForm(formData, allServes)

const populateFormData = (data) => {
  const transformedConditions = transformConditionsToFormServes(data.conditions || [])

  formData.value = {
    name: data.name || '',
    code: data.code || '',
    branchId: data.branchId || data?.branch?.id || null,
    hasExpire: !!data.expiresAt,
    startsAt: data.startsAt || new Date(),
    expiresAt: data.expiresAt || null,
    hasUnLimit: data.limit === null,
    limit: data.limit || '',
    description: data.description || '',
    discountType: data.conditions?.[0]?.discountType || DEFAULT_DISCOUNT_TYPE,
    conditions: transformedConditions.map((condition) => ({
      ...condition,
      items: condition.items.map((item) => ({
        ...item,
        discountType:
          item.discountType || data.conditions?.[0]?.discountType || DEFAULT_DISCOUNT_TYPE,
      })),
    })),
  }

  codeInput.value = formData.value.code

  if (isViewMode.value && formData.value.code) {
    debouncedCode.value = formData.value.code
  }
}

const isLoading = computed(
  () =>
    createPending.value || isGeneratingCoupon.value || (isViewMode.value && isFetchingCoupon.value)
)

const isFieldDisabled = computed(() => isViewMode.value)

const { data: codeValidation, isLoading: isValidatingCode } = useValidateCouponQuery(debouncedCode)

const serves = computed(() => {
  if (!allServes.value?.items || servesLoading.value) {
    return [{ id: ALL_OPTION, title: 'همه' }]
  }

  const allServesList = allServes.value.items.filter((s) => s?.id != null)

  return [{ id: ALL_OPTION, title: 'همه' }, ...allServesList]
})

const copyDiscountCode = () => {
  copyToClipboard(formData.value.code || 'text')
}

const generateCouponCode = () => {
  generateCoupon(null, {
    onSuccess: async (response) => {
      const generatedCode = response?.data?.code

      if (generatedCode && generatedCode.length >= 3) {
        debouncedCode.value = ''

        await nextTick()

        codeInput.value = generatedCode
        formData.value.code = generatedCode
        errors.value.code = null

        await nextTick()
        debouncedCode.value = generatedCode

        Notif.success('کد تخفیف با موفقیت تولید شد')
      } else {
        Notif.warning('خطا در دریافت کد تخفیف. لطفاً دوباره تلاش کنید.')
      }
    },
  })
}

const handleSubmit = async () => {
  try {
    const isValid = await validate(formData.value)
    if (!isValid) {
      Notif.error('لطفاً خطاهای فرم را برطرف کنید')
      return
    }

    const apiData = transformFormDataToApi(formData.value)

    createCoupon(apiData, {
      onSuccess: (response) => {
        Notif.success(response?.data?.message || 'کد تخفیف با موفقیت ایجاد شد')
        router.push('/ads/coupon')
        queryClient.resetQueries({ queryKey: ['coupon', 'all-coupon'] })
      },
      onError: (error) => {
        handleError(error)
      },
    })
  } catch (error) {
    handleError(error)
    Notif.error('خطا در اعتبارسنجی فرم')
  }
}

watch(
  codeInput,
  debounce((code) => {
    formData.value.code = code

    if (code && code.length >= 3) {
      debouncedCode.value = code
      errors.value.code = null
    } else {
      debouncedCode.value = ''
      errors.value.code = null
    }
  }, 400)
)

watch(
  () => formData.value.hasExpire,
  (newValue) => {
    if (!newValue) {
      formData.value.expiresAt = null
    }
    if (newValue && !formData.value.startsAt && !formData.value.expiresAt) {
      const today = getTodayJalali()
      formData.value.startsAt = today
      formData.value.expiresAt = today
    }
  }
)

watch(
  couponData,
  (newData) => {
    if (newData && isViewMode.value) {
      populateFormData(newData)
      showDataError.value = false
      dataErrorMessage.value = ''
    }
  },
  { immediate: true }
)

watch(isFetchError, (isError) => {
  if (isError && isViewMode.value) {
    showDataError.value = true
    dataErrorMessage.value =
      fetchError.value?.response?.data?.message ||
      fetchError.value?.message ||
      'خطا در دریافت اطلاعات کد تخفیف'
  }
})

const handleRetryFetchCoupon = async () => {
  showDataError.value = false
  dataErrorMessage.value = ''
  await refetchCoupon()
}

watch(
  () => codeValidation,
  (newValidation) => {
    if (!debouncedCode.value) return

    if (isViewMode.value) {
      errors.value.code = null
      return
    }

    const isDuplicate = newValidation?.id && newValidation.id !== couponId
    errors.value.code = isDuplicate ? 'این کد تخفیف قبلاً استفاده شده است' : null
  }
)
</script>

<style scoped lang="scss">
.df {
  width: 100%;

  &__header {
    margin-bottom: $spacing-sm;
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__content {
    width: 60%;
    display: flex;
    flex-direction: column;
    gap: $spacing-xl;
    padding: $spacing-xl 0;

    &--box {
      width: 100%;
      display: flex;
      align-items: center;
      flex: 1 1 auto;
      flex-flow: wrap;
      gap: $spacing-md;
      background-color: rgba($grey-6, 10%);
      border: 1px solid $default-border;
      padding: $spacing-lg;
      border-radius: $radius-md;
    }
  }

  &__serve-group {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
    margin: $spacing-lg 0;
  }

  &__item-row {
    width: 100%;
    margin-top: $spacing-md;
  }
}
</style>
