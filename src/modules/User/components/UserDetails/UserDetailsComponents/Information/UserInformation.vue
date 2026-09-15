<template>
  <div class="user-information">
    <div class="user-information__header">
      <Typography variant="heading" size="h6" weight="bold">اطلاعات فردی</Typography>
      <div class="user-information__actions">
        <div v-if="!isEditMode && userId" class="user-information__ai-wrapper">
          <Button
            variant="filled"
            :is-icon-only="true"
            class="user-information__ai-btn"
            @click="toggleAiMenu"
          >
            <IconX v-if="showAiMenu || showSummaryPopup" />
            <IconSparkles v-else />
          </Button>
          <Transition name="ai-menu">
            <div v-if="showAiMenu" class="user-information__ai-menu">
              <div class="user-information__ai-menu-overlay" @click="closeAiMenu" />
              <QBtn
                flat
                no-caps
                class="user-information__ai-menu-btn"
                @click="handleOpenCallSummary"
              >
                <div class="user-information__ai-menu-btn-content">
                  <IconPhone :size="18" />
                  <span>خلاصه تماس‌ها</span>
                </div>
              </QBtn>
              <QBtn
                flat
                no-caps
                rounded
                class="user-information__ai-menu-btn"
                @click="handleOpenChatSummary"
              >
                <div class="user-information__ai-menu-btn-content">
                  <IconMessage :size="18" />
                  <span>خلاصه پیام‌ها</span>
                </div>
              </QBtn>
            </div>
          </Transition>
          <AiSummaryPopup
            v-model="showSummaryPopup"
            :type="summaryType"
            :loading="activeSummaryLoading"
            :updating="summarizeLoading"
            :status="activeSummaryData?.status"
            :summary="activeSummaryData?.chatSummary || activeSummaryData?.callSummary"
            :new-chats-count="
              activeSummaryData?.newChatsCount || activeSummaryData?.newCallsCount || 0
            "
            :error="activeSummaryError"
            @update="handleSummarize"
            @refresh="handleRefreshSummary"
          />
        </div>
        <Button
          v-if="isEditMode"
          text="بازگشت"
          color="White"
          variant="outline"
          :is-loading="loadingList"
          @click="handleCancelEdit"
        />
        <Button
          :color="isEditMode ? 'green' : 'light-blue'"
          :variant="isEditMode ? 'filled' : 'outline'"
          :right-icon="isEditMode ? IconCheck : IconPencil"
          :is-loading="loadingList"
          :text="isEditMode ? 'تایید' : 'ویرایش'"
          @click="toggleEditMode"
        />
      </div>
    </div>
    <QForm :disable="loading" @submit.prevent="submitForm">
      <div class="row q-col-gutter-sm">
        <div class="col-md-3 col-12">
          <TextField
            variant="outline"
            clearable
            :model-value="userData.firstName"
            label="نام"
            required
            :error="!!errors.firstName"
            :error-message="errors.firstName"
            :disable="isUserInfoFieldDisabled"
            @update:model-value="(e) => handleChange('firstName', e)"
          />
        </div>
        <div class="col-md-3 col-12">
          <TextField
            variant="outline"
            clearable
            :model-value="userData.name"
            label="نام خانوادگی"
            required
            :error="!!errors.name"
            :error-message="errors.name"
            :disable="isUserInfoFieldDisabled"
            @update:model-value="(e) => handleChange('name', e)"
          />
        </div>
        <div
          class="col-md-3 col-12 user-information__national-code-col user-information__foreign-toggle"
          :class="{ 'user-information__foreign-toggle--aligned-end': userData.isForeignNational }"
        >
          <div class="user-information__foreign-toggle-box">
            <span class="user-information__foreign-toggle-label">اتباع است؟</span>
            <Toggle
              :model-value="userData.isForeignNational || false"
              :disabled="isUserInfoFieldDisabled"
              @update:model-value="(e) => handleChange('isForeignNational', e)"
            />
          </div>
        </div>
        <div class="col-md-3 col-12 user-information__national-code-col">
          <!--          <QCheckbox-->
          <!--            class="user-information__foreign-checkbox"-->
          <!--            :model-value="userData.isForeignNational || false"-->
          <!--            label="اتباع"-->
          <!--            dense-->
          <!--            :disable="isUserInfoFieldDisabled"-->
          <!--            @update:model-value="(e) => handleChange('isForeignNational', e)"-->
          <!--          />-->
          <TextField
            id="nationalCode"
            variant="outline"
            clearable
            :model-value="userData.nationalCode"
            :label="nationalCodeLabel"
            :disable="isUserInfoFieldDisabled"
            :error="!!errors?.nationalCode"
            :error-message="errors?.nationalCode"
            @update:model-value="(e) => handleChange('nationalCode', e)"
          />
        </div>
        <div class="col-md-3 col-12">
          <SelectField
            variant="outline"
            :options="[
              { id: 0, label: 'آقا', value: 'male' },
              { id: 1, label: 'خانم', value: 'female' },
              { id: 2, label: 'نامشخص', value: 'unknown' },
            ]"
            map-options
            option-label="label"
            option-value="value"
            filterable
            :disable="isUserInfoFieldDisabled"
            label="جنسیت"
            required
            :model-value="userData.gender"
            @update:model-value="(e) => handleChange('gender', e.value)"
          />
        </div>
        <div class="col-md-3 col-12">
          <PersianDate
            label="تاریخ تولد"
            :model-value="userData.birthday"
            :error="!!errors?.birthday"
            :error-message="errors?.birthday"
            :disable="isUserInfoFieldDisabled"
            @update:model-value="(e) => handleChange('birthday', e)"
          />
        </div>
        <div class="col-md-3 col-12">
          <TextField
            label="موبایل بیمار"
            required
            variant="outline"
            clearable
            placeholder="9xxxxxxxxx"
            :formatter="(e) => e.replace(/[^0-9]/g, '')"
            :model-value="userData.mobile"
            :disable="isUserInfoFieldDisabled"
            :error="!!errors?.mobile"
            :error-message="errors?.mobile"
            @update:model-value="
              (val) => {
                const cleaned = convertToEnNumber(val).replace(/[^0-9]/g, '')
                handleChange('mobile', cleaned)
              }
            "
          />
        </div>
        <div class="col-md-3 col-12">
          <TextField
            label="موبایل دوم بیمار"
            clearable
            variant="outline"
            :model-value="userData.tel"
            placeholder="9xxxxxxxxx"
            :formatter="(e) => e.replace(/[^0-9]/g, '')"
            :error="!!errors.tel"
            :error-message="errors.tel"
            :disable="isUserInfoFieldDisabled"
            @update:model-value="
              (val) => {
                const cleaned = convertToEnNumber(val).replace(/[^0-9]/g, '')
                handleChange('tel', cleaned)
              }
            "
          />
        </div>
        <div class="col-md-3 col-12">
          <TextField
            variant="outline"
            clearable
            :model-value="userData.landlinePhone"
            label="تلفن ثابت"
            :formatter="(e) => e.replace(/[^0-9]/g, '')"
            :parser="(e) => convertToEnNumber(e)"
            :error="!!errors?.landlinePhone"
            :error-message="errors?.landlinePhone"
            :disable="isUserInfoFieldDisabled"
            @update:model-value="
              (val) => {
                const cleaned = convertToEnNumber(val).replace(/[^0-9]/g, '')
                handleChange('landlinePhone', cleaned)
              }
            "
          />
        </div>
        <div class="col-md-3 col-12">
          <ProvinceSelect
            lazy
            :display-label="userData?.province?.name"
            :chips="false"
            :model-value="userData?.province ?? userData?.province?.id"
            :disable="isUserInfoFieldDisabled"
            :error="errors?.province ? !!errors?.province : null"
            :error-message="errors?.province"
            @update:model-value="(e) => changeProvince(e)"
          />
        </div>
        <div class="col-md-3 col-12">
          <SelectField
            variant="outline"
            clearable
            map-options
            label="شهر"
            use-input
            :options="citiesOfProvinceList?.items"
            option-label="name"
            :loading="getCities"
            option-value="id"
            :model-value="userData.city"
            :disable="isUserInfoFieldDisabled"
            :error="!!errors?.city"
            :error-message="errors?.city"
            @update:model-value="changeCity"
          />
        </div>
        <div v-if="isShowArea" class="col-md-3 col-12">
          <SelectField
            variant="outline"
            clearable
            map-options
            use-input
            input-debounce="0"
            :options="areaOptions"
            option-label="name"
            option-value="id"
            label="محله"
            :disable="isUserInfoFieldDisabled"
            :model-value="userData.area"
            :error="!!errors?.area"
            :error-message="errors?.area"
            :search-fn="filterAreas"
            @update:model-value="(e) => handleChange('area', e)"
          >
            <template #no-option><span /></template>
          </SelectField>
        </div>
      </div>
      <hr class="user-information__divider" />
      <div class="row q-col-gutter-sm">
        <div class="col-md-12 col-12">
          <Typography variant="heading" size="h6" weight="medium" color="dark">
            اطلاعات کاربری
          </Typography>
        </div>
        <div v-if="userId" class="col-md-3 col-12">
          <TextField
            variant="outline"
            clearable
            :model-value="userData.documentNumber"
            :disable="true"
            label="شماره پرونده"
            :error="!!errors?.documentNumber"
            :error-message="errors?.documentNumber"
            :hint-color="errors.documentNumber ? 'red' : isIncompletedDocument ? 'orange' : 'grey'"
            :hint="isIncompletedDocument ? 'نیاز به تکمیل اطلاعات دندان من' : ''"
            @update:model-value="(e) => handleChange('documentNumber', e)"
          />
        </div>
        <div class="col-md-3 col-12">
          <PersianDate label="تاریخ ثبت نام" :model-value="userData.creationDate" :disable="true" />
        </div>

        <div class="col-md-3 col-12">
          <CampaignSelect
            lazy
            :display-label="userData?.campaign?.title"
            :model-value="userData?.campaign?.id ?? userData?.campaign"
            :dense="false"
            :disable="isUserInfoFieldDisabled"
            :error="errors.campaign ? !!errors.campaign : null"
            :error-message="errors.campaign"
            @update:model-value="(e) => handleChange('campaign', e)"
          />
        </div>
        <div v-if="notShowAble" class="col-md-3 col-12">
          <IntroductionMethodSelect
            lazy
            :display-label="userData?.methodOfIntroduction?.faTitle"
            :dense="false"
            clear-icon="clear"
            :model-value="userData.methodOfIntroduction"
            :disable="isUserInfoFieldDisabled"
            :error="errors?.methodOfIntroduction ? !!errors?.methodOfIntroduction : null"
            :error-message="errors?.methodOfIntroduction"
            @update:model-value="(e) => handleChange('methodOfIntroduction', e)"
          />
        </div>
        <div class="col-md-3 col-12">
          <TextField
            variant="outline"
            label="شماره موبایل معرف"
            :model-value="userData.refererMobile"
            placeholder="9xxxxxxxxx"
            :disable="isUserInfoFieldDisabled"
            :formatter="(e) => e.replace(/[^0-9]/g, '')"
            :error="!!errors.refererMobile"
            :error-message="errors.refererMobile"
            @update:model-value="
              (val) => {
                const cleaned = convertToEnNumber(val).replace(/[^0-9]/g, '')
                handleChange('refererMobile', cleaned)
              }
            "
          />
        </div>
        <div class="col-md-3 col-12">
          <RoleSelect
            lazy
            :display-label="userData?.role?.faTitle"
            label="نقش"
            :disable="isUserInfoFieldDisabled"
            :model-value="userData.roleId ?? userData.role?.id"
            :error-message="errors.roleId"
            :error="!!errors.roleId"
            @update:model-value="(e) => handleChange('roleId', e)"
            @blur="validateAt('roleId', userData.roleId ?? userData.role?.id)"
          />
        </div>
        <div class="col-md-3 col-12">
          <BranchSelect
            lazy
            :display-label="userData?.branch?.name"
            label="شعبه"
            :disable="isUserInfoFieldDisabled || isNormalUserRole"
            :model-value="userData.branchId ?? userData.branch?.id"
            :error-message="errors.branchId"
            :error="!!errors.branchId"
            @update:model-value="(e) => handleChange('branchId', e)"
            @blur="validateAt('branchId', userData.branchId ?? userData.branch?.id)"
          />
        </div>
        <!--        <div class="col-md-3 col-12">-->
        <!--          <AdvisorSelect-->
        <!--            label="مشاور*"-->
        <!--            :dense="false"-->
        <!--            :disable="true"-->
        <!--            :model-value="userData.advisor?.id ?? userData.advisor"-->
        <!--            :error="errors?.advisor ? !!errors?.advisor : null"-->
        <!--            :error-message="errors?.advisor"-->
        <!--            @update:model-value="(e) => handleChange('advisor', e)"-->
        <!--          />-->
        <!--        </div>-->
        <!--        <div class="col-md-3 col-12">-->
        <!--          <AdvisorSelect-->
        <!--            :user-role="['advisor', 'support']"-->
        <!--            multiple-->
        <!--            option-label="name"-->
        <!--            label="مشاور اتاق مشاوره"-->
        <!--            :disable="true"-->
        <!--            :dense="false"-->
        <!--            :model-value="userData?.roomAdvisors"-->
        <!--          />-->
        <!--        </div>-->
        <!--        <div class="col-md-3 col-12">-->
        <!--          <AdvisorSelect-->
        <!--            :user-role="['advisor', 'support']"-->
        <!--            option-label="name"-->
        <!--            multiple-->
        <!--            label="مشاور نوبت دهی"-->
        <!--            :disable="true"-->
        <!--            :dense="false"-->
        <!--            :model-value="userData?.owners"-->
        <!--          />-->
        <!--        </div>-->
        <div class="col-md-3 col-12">
          <StatusSelect
            lazy
            :display-label="userData?.lastStatus?.title"
            label="وضعیت کاربر"
            :disable="isUserInfoFieldDisabled"
            :model-value="userData.lastStatus?.id ?? userData.lastStatus"
            :error="errors.lastStatus ? !!errors.lastStatus : null"
            :error-message="errors.lastStatus"
            @update:model-value="(e) => handleChange('lastStatus', e)"
          />
        </div>
        <div class="col-md-6 col-12">
          <ServeSelect
            multiple
            label="خدمات"
            chip-color="blue"
            :disable="isUserInfoFieldDisabled"
            :error="errors.serves ? !!errors.serves : null"
            :error-message="errors.serves"
            :model-value="userData.serves"
            @update:model-value="(e) => handleChange('serves', e)"
          />
        </div>
      </div>

      <div class="row q-col-gutter-sm q-mt-sm">
        <div class="col-md-6 col-12">
          <TextField
            v-if="!isUserInfoFieldDisabled"
            variant="outline"
            clearable
            :model-value="userData.statusDescription"
            label="شرح وضعیت"
            type="textarea"
            :rows="3"
            :error="!!errors.statusDescription"
            :error-message="errors.statusDescription"
            @update:model-value="(e) => handleChange('statusDescription', e)"
          />
          <div v-else class="user-information__disabled-field">
            <div class="user-information__disabled-field-label">شرح وضعیت</div>
            <div class="user-information__disabled-field-content">
              {{ userData.statusDescription || '-' }}
            </div>
          </div>
        </div>
        <div class="col-md-6 col-12">
          <TextField
            v-if="!isUserInfoFieldDisabled"
            variant="outline"
            clearable
            :model-value="userData.description"
            label="توضیحات"
            type="textarea"
            :rows="3"
            :error="!!errors?.description"
            :error-message="errors?.description"
            @update:model-value="(e) => handleChange('description', e)"
          />
          <div v-else class="user-information__disabled-field">
            <div class="user-information__disabled-field-label">توضیحات</div>
            <div class="user-information__disabled-field-content">
              {{ userData.description || '-' }}
            </div>
          </div>
        </div>
      </div>
    </QForm>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { convertToEnNumber } from '@/utils/convert-check-digits'
import {
  IconPencil,
  IconPhone,
  IconMessage,
  IconCheck,
  IconSparkles,
  IconX,
} from '@tabler/icons-vue'
import PersianDate from '@/components/Form/PersianDate'
import TextField from '@/base/TextField'
import SelectField from '@/base/SelectField'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import { useQueryClient } from '@tanstack/vue-query'
import {
  useGetAreasOfCityQuery,
  useGetCitiesOfProvinceQuery,
  useUpdateUserMutation,
  useUserExistMutation,
  useGetUserChatsSummaryQuery,
  useGetUserCallsSummaryQuery,
} from '@/modules/User/query'
import { useSummarizeUserChatsMutation } from '@/data/services/dr-serita/query'
import AiSummaryPopup from './AiSummaryPopup'
import { array, mixed, number, object, string } from 'yup'
import useYup from '@/composables/use-yup'
import { handleError } from '@/utils/error-handler'
import { debounce } from '@/utils/lodash-utils'
import { Notif } from '@/data/services/notification-service'
import ServeSelect from '@/components/Form/ServeSelect'
import ProvinceSelect from '@/components/Form/ProvinceSelect'
import CampaignSelect from '@/components/Form/CampaignSelect'
import IntroductionMethodSelect from '@/components/Form/IntroductionMethodSelect'
// import AdvisorSelect from '@/components/Form/AdvisorSelect'
import StatusSelect from '@/components/Form/StatusSelect'
import RoleSelect from '@/components/Form/RoleSelect'
import BranchSelect from '@/components/Form/BranchSelect'
import { useRoleManager } from '@/composables/use-role-manager'
import { usePersianOptions } from '@/composables/use-persian-options'
import Toggle from '@/base/Toggle'

const props = defineProps({
  propData: {
    type: Object,
    default: () => {},
  },
})

const loading = ref(false)
const queryClient = useQueryClient()

const updatedUserData = ref(null)
const isEditMode = ref(false)
const { hasRole } = useRoleManager()

const initialUserData = computed(() => props.propData)
const userData = computed(() => updatedUserData.value || initialUserData.value || {})
const userId = computed(() => props.propData?.id || null)
const isIncompletedDocument = computed(
  () => !!props.propData?.documentNumber && !props.propData?.isDocumentCreationCompleted
)

// AI Summarize
const showSummaryPopup = ref(false)
const showAiMenu = ref(false)
const summaryType = ref('chat')
const { mutate: summarizeChats, isPending: summarizeLoading } = useSummarizeUserChatsMutation()
const {
  data: chatSummaryData,
  isLoading: chatSummaryLoading,
  isError: chatSummaryError,
  refetch: refetchChatSummary,
} = useGetUserChatsSummaryQuery(userId, {
  enabled: false,
})
const {
  data: callSummaryData,
  isLoading: callSummaryLoading,
  isError: callSummaryError,
  refetch: refetchCallSummary,
} = useGetUserCallsSummaryQuery(userId, {
  enabled: false,
})

const activeSummaryLoading = computed(() =>
  summaryType.value === 'call' ? callSummaryLoading.value : chatSummaryLoading.value
)
const activeSummaryData = computed(() =>
  summaryType.value === 'call' ? callSummaryData.value : chatSummaryData.value
)
const activeSummaryError = computed(() =>
  summaryType.value === 'call' ? callSummaryError.value : chatSummaryError.value
)
const selectedProvinceId = computed(() => userData.value.province?.id ?? userData.value?.province)
const selectedCityId = computed(() => userData.value.city?.id)
const cityEnabled = computed(() => !!userId.value && !!selectedProvinceId.value)

const notShowAble = computed(() => !hasRole('advisor'))
const nationalCodeLabel = computed(() =>
  userData.value.isForeignNational ? 'کد فراگیر/ فیدا/ پاسپورت' : 'کد ملی'
)
const { data: citiesOfProvinceList, isLoading: getCities } = useGetCitiesOfProvinceQuery(
  selectedProvinceId,
  {
    enabled: cityEnabled,
  }
)

const isShowArea = computed(
  () =>
    !!citiesOfProvinceList.value?.items?.find(
      ({ id, hasArea }) => id === selectedCityId.value && hasArea
    )
)
const areaEnabled = computed(() => !!userId.value && isShowArea.value)
const { data: areasOfCityList } = useGetAreasOfCityQuery(selectedCityId, {
  enabled: areaEnabled,
})
const { options: areaOptions, filter: filterAreas } = usePersianOptions(
  computed(() => areasOfCityList.value?.items ?? []),
  'name'
)

const { mutate: updateUser, isPending: updateUserPending } = useUpdateUserMutation()
const { mutate: checkMobileExist, isPending: checkMobileExistLoading } = useUserExistMutation()
const loadingList = computed(
  () => loading.value || updateUserPending.value || checkMobileExistLoading.value
)
const validationSchema = object().shape({
  firstName: string().nullable(),
  name: string().nullable(),
  advisor: mixed()
    .required('لطفا مشاور را انتخاب کنید')
    .test('is-valid-advisor', 'لطفا مشاور را انتخاب کنید', (val) => {
      if (!val) return false
      return typeof val === 'number' || typeof val?.id === 'number'
    }),
  isForeignNational: mixed().nullable(),
  nationalCode: string()
    .nullable()
    .matches(/^\d*$/, 'مقدار باید عدد باشد')
    .test('nationalCode-max-length', function (value) {
      const { isForeignNational } = this.parent
      if (!value) return true
      const maxLength = isForeignNational ? 16 : 10
      const message = isForeignNational
        ? 'کد فراگیر/ فیدا/ پاسپورت حداکثر 16 رقم است'
        : 'کدملی حداکثر 10 رقم است'
      return value.length <= maxLength || this.createError({ message })
    }),
  birthday: string().nullable(),
  methodOfIntroduction: mixed().test('methodOfIntroduction-validation', function (value) {
    const isRequiredRole = hasRole('superadmin') || hasRole('admin')

    if (isRequiredRole) {
      if (!value) {
        return this.createError({ message: 'شیوه آشنایی الزامیست' })
      }
      if (typeof value !== 'number' && typeof value?.id !== 'number') {
        return this.createError({ message: 'شیوه آشنایی الزامیست' })
      }
    } else if (value && typeof value !== 'number' && typeof value?.id !== 'number') {
      return this.createError({ message: 'شیوه آشنایی معتبر نیست' })
    }

    return true
  }),
  campaign: mixed()
    .nullable()
    .test('is-valid-campaign', 'کمپین معتبر نیست', (val) => {
      if (!val) return true
      return typeof val === 'number' || typeof val?.id === 'number'
    }),
  gender: string().nullable(),
  description: string().nullable(),
  documentNumber: number()
    .typeError('باید مقدار عددی باشد')
    .nullable()
    .transform((_, value) => (value ? Number(value) : null)),
  province: mixed().nullable(),
  city: mixed().nullable(),
  area: mixed().nullable(),
  lastStatus: mixed().nullable(),
  statusDescription: string().nullable(),
  roleId: mixed()
    .nullable()
    .test('is-valid-role', 'نقش معتبر نیست', (val) => {
      if (!val) return true
      return typeof val === 'number' || typeof val?.id === 'number'
    }),
  branchId: mixed()
    .nullable()
    .test('is-valid-branch', 'شعبه معتبر نیست', (val) => {
      if (!val) return true
      return typeof val === 'number' || typeof val?.id === 'number'
    }),
  serves: array().nullable(),
  tel: string()
    .nullable()
    .test('tel-length', 'شماره را به صورت 9xxxxxxxxx وارد کنید', (val) => {
      if (!val || val === '') return true
      return val.length >= 10
    }),
  mobile: string()
    .required('شماره موبایل الزامیست')
    .test('mobile-length', 'شماره را به صورت 9xxxxxxxxx وارد کنید', (val) => {
      if (!val || val === '') return false
      return val.length >= 10
    }),
  refererMobile: string()
    .nullable()
    .test('mobile-validation', 'فیلد موبایل معرف نامعتبر است', (value) => {
      if (!value) return true
      const cleanedNumber = value.replace(/^(0|98|\+98)/, '')
      return /^9\d{9}$/.test(cleanedNumber)
    }),
  landlinePhone: string().nullable(),
})
const { validate, validateAt, errors, setError } = useYup(validationSchema)
// const isAdvisorDisabled = computed(() => !isAllowedUser.value && !!userId.value)

const isUserInfoFieldDisabled = computed(() => !isEditMode.value)

const NORMAL_USER_ROLE_ID = 6

const currentRoleId = computed(() => userData.value.roleId ?? userData.value.role?.id)
const isNormalUserRole = computed(() => currentRoleId.value === NORMAL_USER_ROLE_ID)

const handleChange = (field, value) => {
  const newData = { ...userData.value, [field]: value }
  updatedUserData.value = newData
  validateAt(field, value, newData)

  // Handle role change - clear branch when switching to normal user
  if (field === 'roleId') {
    const extractedRoleId = typeof value === 'object' ? value?.id : value
    if (extractedRoleId === NORMAL_USER_ROLE_ID) {
      updatedUserData.value = { ...newData, branchId: null }
      setError('branchId', null)
    }
  }

  if (field === 'isForeignNational') {
    if (value) {
      setError('nationalCode', '')
    } else if (newData.nationalCode) {
      validateAt('nationalCode', newData.nationalCode, newData)
    }
  }
}
const changeProvince = (province) => {
  updatedUserData.value = {
    ...userData.value,
    province,
    city: undefined,
    area: undefined,
  }
  validateAt('province', province)
}
const changeCity = (city) => {
  updatedUserData.value = {
    ...userData.value,
    city,
    area: undefined,
  }
  validateAt('city', city)
}
// const handleAvatarUploader = (file) => {
//   handleChange('avatar', file.data[0])
// }
const extractId = (value) => {
  if (!value) return null
  return typeof value === 'object' ? value?.id : value
}

const submitForm = () => {
  const dataForValidation = {
    ...userData.value,
    branchId: userData.value.branchId ?? userData.value.branch?.id,
  }

  const currentRole = dataForValidation.roleId ?? dataForValidation.role?.id
  if (currentRole && currentRole !== NORMAL_USER_ROLE_ID && !dataForValidation.branchId) {
    setError('branchId', 'انتخاب شعبه برای این نقش الزامیست')
    throw new Error('Validation failed')
  }

  return validate(dataForValidation).then(({ isValid, payload }) => {
    if (!isValid) throw new Error('Validation failed')

    const { campaign: _campaign, ...restPayload } = payload
    const form = {
      ...restPayload,
      province: extractId(payload.province),
      campaign_id: extractId(payload.campaign),
      city: extractId(payload.city),
      area: extractId(payload.area),
      advisorId: extractId(payload.advisor),
      methodOfIntroduction: extractId(payload.methodOfIntroduction),
      lastStatus: extractId(payload.lastStatus),
      roleId: extractId(payload.roleId),
      branchId: extractId(payload.branchId),
      serves: payload.serves?.map((s) => extractId(s)),
      isForeignNational: payload.isForeignNational || false,
    }

    return new Promise((resolve, reject) => {
      updateUser(
        { ...form, id: userId.value },
        {
          onSuccess: (data) => {
            queryClient.invalidateQueries({
              queryKey: ['user', data.data.id],
            })
            queryClient.invalidateQueries({
              queryKey: ['user', 'all-users'],
            })
            Notif.success(data?.message)
            resolve(data)
          },
          onError: (error) => {
            loading.value = false
            handleError(error)
            reject(error)
          },
        }
      )
    })
  })
}

const toggleEditMode = async () => {
  if (isEditMode.value) {
    const { isValid } = await validate(userData.value)
    if (!isValid) {
      Notif.error('لطفا خطاهای فرم را برطرف کنید')
      return
    }

    try {
      await submitForm()
      isEditMode.value = false
    } catch {
      // Error already handled in submitForm onError callback
      // Stay in edit mode if there's an error
    }
  } else {
    isEditMode.value = true
  }
}

const handleCancelEdit = () => {
  if (isEditMode.value) {
    updatedUserData.value = null
    isEditMode.value = false

    Object.keys(errors.value).forEach((key) => {
      errors.value[key] = null
    })
  }
}

const toggleAiMenu = () => {
  showAiMenu.value = !showAiMenu.value
}

const closeAiMenu = () => {
  showAiMenu.value = false
}

const handleOpenChatSummary = () => {
  if (!userId.value) return
  summaryType.value = 'chat'
  showAiMenu.value = false
  showSummaryPopup.value = true
  refetchChatSummary()
}

const handleOpenCallSummary = () => {
  if (!userId.value) return
  summaryType.value = 'call'
  showAiMenu.value = false
  showSummaryPopup.value = true
  refetchCallSummary()
}

const handleSummarize = () => {
  if (!userId.value) return

  const refetchFn = summaryType.value === 'call' ? refetchCallSummary : refetchChatSummary
  const noNewMessage =
    summaryType.value === 'call'
      ? 'تماس جدیدی برای خلاصه‌سازی وجود ندارد'
      : 'چت جدیدی برای خلاصه‌سازی وجود ندارد'

  summarizeChats(userId.value, {
    onSuccess: (response) => {
      const data = response?.data || response
      refetchFn()
      if (data?.action === 'no_new_chats') {
        Notif.info(noNewMessage)
      } else {
        Notif.success('خلاصه با موفقیت به‌روزرسانی شد')
      }
    },
  })
}

const handleRefreshSummary = () => {
  if (!userId.value) return
  const refetchFn = summaryType.value === 'call' ? refetchCallSummary : refetchChatSummary
  refetchFn()
}
watch(
  () => userData.value?.mobile,
  debounce((mobile) => {
    if (userId.value && mobile === initialUserData.value.mobile) return true
    if (mobile) {
      checkMobileExist(
        { mobile },
        {
          onSuccess: (response) => {
            if (response.data) setError('mobile', response.message)
          },
          onError: (error) => {
            handleError(error)
          },
        }
      )
    }
    return true
  }, 400)
)

watch(
  () => userData.value?.tel,
  debounce((tel) => {
    if (userId.value && tel === initialUserData.value.tel) return true
    if (tel) {
      checkMobileExist(
        { mobile: tel },
        {
          onSuccess: (response) => {
            if (response.data) setError('tel', response.message)
          },
          onError: (error) => {
            handleError(error)
          },
        }
      )
    }
    return true
  }, 400)
)
</script>

<style scoped lang="scss">
.user-information {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__ai-wrapper {
    position: relative;
  }

  &__ai-btn {
    padding: 4px;
  }

  &__ai-menu {
    position: absolute;
    top: 100%;
    left: 5%;
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 100;
    border: 1px solid $default-disabled-border;
    padding: 4px;
    background-color: $white;
    border-radius: 8px;
  }

  &__ai-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: transparent;
    z-index: -1;
  }

  &__ai-menu-btn {
    padding: 4px 16px;
    border-radius: 8px !important;
    color: $light-blue-text;
    white-space: nowrap;
    font-size: 13px;
    transition: all 0.2s ease;
    &:hover {
      background-color: $light-blue-light;
    }
  }

  &__ai-menu-btn-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  &__divider {
    border: none;
    border-top: 1px solid $grey-3;
    margin: 24px 0 16px;
    width: 100%;
  }

  &__national-code-col {
    position: relative;
  }

  &__foreign-toggle {
    display: flex;
    gap: 4px;
    flex-direction: column;

    &--aligned-end {
      align-items: flex-end;
    }
  }

  &__foreign-toggle-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-top: 25px;
    padding: 8px 12px;
    border: 1px solid $grey-3;
    border-radius: $radius-sm;
  }

  &__foreign-toggle-label {
    color: $grey-9;
    font-size: 14px;
    font-weight: 500;
  }

  &__foreign-checkbox {
    position: absolute;
    top: 45px;
    left: 50px;
    z-index: 1;
  }

  &__disabled-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__disabled-field-label {
    font-size: 14px;
    font-weight: 500;
    color: $grey-7;
  }

  &__disabled-field-content {
    background-color: $white;
    border: 1px solid $grey-3;
    border-radius: $radius-sm;
    padding: 12px;
    color: $grey-6;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 14px;
    line-height: 1.5;
    min-height: 80px;
  }
}

.ai-menu-enter-active {
  animation: ai-menu-in 0.2s ease-out;
}

.ai-menu-leave-active {
  animation: ai-menu-out 0.15s ease-in;
}

@keyframes ai-menu-in {
  0% {
    opacity: 0;
    transform: translateY(-8px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ai-menu-out {
  0% {
    opacity: 1;
    transform: translateY(0);
  }

  100% {
    opacity: 0;
    transform: translateY(-4px);
  }
}

// Legacy class - keeping for backward compatibility
.user-info-box {
  border-bottom: 1px solid $grey-4;
  background-color: $white;
  border-radius: 4px;
  padding: 8px;
  margin: 8px 0;

  p {
    color: $grey-6;
    margin: 0;
  }

  span {
    font-weight: 600;
  }
}
</style>
