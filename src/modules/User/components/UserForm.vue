<template>
  <BaseModal
    :model-value="visible"
    title="افزودن کاربر"
    persistent
    backdrop-filter="blur(1px)"
    transition-show="jump-down"
    transition-hide="jump-up"
    :loading="loadingList"
    width="600px"
    @close="closeForm"
  >
    <QForm :disable="loading" @submit.prevent="submitForm">
      <div class="row q-col-gutter-md justify-start items-center text-bold">
        <div class="col-md-6 col-12">
          <QInput
            outlined
            clearable
            clear-icon="clear"
            size="large"
            :model-value="userData.firstName"
            label="نام*"
            :error="errors.firstName ? errors.firstName : null"
            :error-message="errors.firstName"
            @update:model-value="(e) => handleChange('firstName', e)"
          />
        </div>
        <div class="col-md-6 col-12">
          <QInput
            outlined
            clearable
            clear-icon="clear"
            size="large"
            :model-value="userData.name"
            label="نام خانوادگی*"
            :error="errors.name ? !!errors.name : null"
            :error-message="errors.name"
            @update:model-value="(e) => handleChange('name', e)"
          />
        </div>
        <div class="col-md-6 col-12">
          <QInput
            id="nationalCode"
            outlined
            clearable
            clear-icon="clear"
            :model-value="userData.nationalCode"
            :label="nationalCodeLabel"
            :error="errors?.nationalCode ? !!errors?.nationalCode : null"
            :error-message="errors?.nationalCode"
            @update:model-value="(e) => handleChange('nationalCode', e)"
          />
          <QCheckbox
            :model-value="userData.isForeignNational || false"
            label="اتباع خارجی"
            dense
            class="q-mt-xs"
            @update:model-value="(e) => handleChange('isForeignNational', e)"
          />
        </div>
        <div class="col-md-6 col-12">
          <QSelect
            outlined
            map-options
            :options="[
              { id: 0, label: 'آقا', value: 'male' },
              { id: 1, label: 'خانم', value: 'female' },
              { id: 2, label: 'نامشخص', value: 'unknown' },
            ]"
            option-label="label"
            option-value="value"
            filterable
            use-input
            clearable
            clear-icon="clear"
            label="جنسیت"
            :model-value="userData.gender"
            @update:model-value="(e) => handleChange('gender', e?.value)"
          />
        </div>
        <div class="col-md-6 col-12">
          <PersianDate
            label="تاریخ تولد"
            :model-value="userData.birthday"
            :error-message="errors?.birthday"
            @update:model-value="(e) => handleChange('birthday', e)"
          />
        </div>
        <div class="col-md-6 col-12">
          <QInput
            label="شماره تماس بیمار*"
            outlined
            clearable
            clear-icon="clear"
            placeholder="9xxxxxxxxx"
            :formatter="(e) => e.replace(/[^0-9]/g, '')"
            :model-value="userData.mobile"
            :error="errors?.mobile ? !!errors?.mobile : null"
            :error-message="errors?.mobile"
            @update:model-value="
              (val) => {
                const cleaned = convertToEnNumber(val).replace(/[^0-9]/g, '')
                handleChange('mobile', cleaned)
              }
            "
          />
        </div>
        <div class="col-md-6 col-12">
          <QInput
            label="شماره دوم بیمار"
            clearable
            clear-icon="clear"
            outlined
            :model-value="userData.tel"
            placeholder="9xxxxxxxxx"
            :formatter="(e) => e.replace(/[^0-9]/g, '')"
            :error="errors.tel ? !!errors.tel : null"
            :error-message="errors.tel"
            @update:model-value="
              (val) => {
                const cleaned = convertToEnNumber(val).replace(/[^0-9]/g, '')
                handleChange('tel', cleaned)
              }
            "
          />
        </div>
        <div class="col-md-6 col-12">
          <QInput
            outlined
            clearable
            :model-value="userData.landlinePhone"
            label="تلفن ثابت"
            :formatter="(e) => e.replace(/[^0-9]/g, '')"
            :parser="(e) => convertToEnNumber(e)"
            :error="errors?.landlinePhone ? !!errors?.landlinePhone : null"
            :error-message="errors?.landlinePhone"
            @update:model-value="
              (val) => {
                const cleaned = convertToEnNumber(val)?.replace(/[^0-9]/g, '')
                handleChange('landlinePhone', cleaned)
              }
            "
          />
        </div>
        <div class="col-md-6 col-12">
          <QSelect
            filterable
            outlined
            clearable
            clear-icon="clear"
            label="شیوه آشنایی *"
            map-options
            option-label="faTitle"
            option-value="id"
            :options="methodOfIntroductionData?.items"
            :model-value="userData.methodOfIntroduction"
            :disable="isDisabledModifiedByUserFields && isFilled('methodOfIntroduction')"
            :error="errors?.methodOfIntroduction ? !!errors?.methodOfIntroduction : null"
            :error-message="errors?.methodOfIntroduction"
            @update:model-value="(e) => handleChange('methodOfIntroduction', e)"
          />
        </div>
        <div class="col-md-6 col-12">
          <QSelect
            outlined
            filterable
            clearable
            clear-icon="clear"
            label="مشاور*"
            :options="advisorsList?.items"
            map-options
            option-label="name"
            option-value="id"
            :disable="isAdvisorDisabled"
            :model-value="userData.advisor"
            :error="errors?.advisor ? !!errors?.advisor : null"
            :error-message="errors?.advisor"
            @update:model-value="(e) => handleChange('advisor', e)"
          />
        </div>
        <div class="col-md-6 col-12">
          <QSelect
            outlined
            filterable
            clearable
            clear-icon="clear"
            map-options
            :options="provincesList?.items"
            option-label="name"
            option-value="id"
            label="استان*"
            :model-value="userData.province"
            :error="errors?.province ? !!errors?.province : null"
            :error-message="errors?.province"
            @update:model-value="changeProvince"
          />
        </div>
        <div class="col-md-6 col-12">
          <QSelect
            outlined
            filterable
            clearable
            clear-icon="clear"
            map-options
            label="شهر*"
            :options="citiesOfProvinceList?.items"
            option-label="name"
            option-value="id"
            :model-value="userData.city"
            :error="errors?.city ? errors?.city : null"
            :error-message="errors?.city"
            @update:model-value="changeCity"
          />
        </div>
        <div v-if="isShowArea" class="col-md-12 col-12">
          <QSelect
            outlined
            use-input
            input-debounce="0"
            clearable
            clear-icon="clear"
            map-options
            :options="areaOptions"
            option-label="name"
            option-value="id"
            label="محله"
            :disable="isDisabledModifiedByUserFields && isFilled('area')"
            :model-value="userData.area"
            :error="errors?.area ? errors?.area : null"
            :error-message="errors?.area"
            @filter="filterAreas"
            @update:model-value="(e) => handleChange('area', e)"
          >
            <template #no-option />
          </QSelect>
        </div>
        <div class="col-12">
          <ServeSelect
            :model-value="userData.serves"
            :error="errors?.serves ? errors?.serves : null"
            :error-message="errors?.serves"
            multiple
            @update:model-value="(e) => handleChange('serves', e)"
          />
        </div>
      </div>
      <div class="row q-mt-md q-col-gutter-md">
        <div class="col-md-6 col-12 flex justify-end">
          <QBtn
            color="warning"
            class="q-px-xl"
            size="lg"
            outline
            :loading="loadingList"
            @click="closeForm"
          >
            انصراف
          </QBtn>
        </div>
        <div class="col-md-6 col-12 flex justify-start">
          <QBtn
            color="primary"
            type="submit"
            class="q-px-xl"
            size="lg"
            outline
            :loading="loadingList"
          >
            ثبت
          </QBtn>
        </div>
      </div>
    </QForm>
  </BaseModal>
</template>

<script setup>
import { useQueryClient } from '@tanstack/vue-query'
import { ref, toRefs, watch, computed } from 'vue'
import { mixed, number, object, string, array } from 'yup'
import { debounce } from '@/utils/lodash-utils'
import BaseModal from '@/base/Modal'
import {
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetProvincesQuery,
  useGetCitiesOfProvinceQuery,
  useGetAreasOfCityQuery,
  useUserExistMutation,
  useGetMethodOfIntroductionsQuery,
} from '@/modules/User/query'
import { convertToEnNumber } from '@/utils/convert-check-digits'
import { handleError } from '@/utils/error-handler'
import { useRoleManager } from '@/composables/use-role-manager'
import useYup from '@/composables/use-yup'
import { usePersianOptions } from '@/composables/use-persian-options'
import PersianDate from '@/components/Form/PersianDate'
import { Notif } from '@/data/services/notification-service'
import useRoles from '@/composables/use-roles'
import ServeSelect from '@/components/Form/ServeSelect'

const { hasRole } = useRoleManager()
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: Number,
    default: null,
  },
})

const emits = defineEmits(['close', 'afterSubmit'])

const { visible } = toRefs(props)
const loading = ref(false)
const uploading = ref(false)
const queryClient = useQueryClient()
const updatedUserData = ref(null)
const { data: initialUserData } = useGetUserByIdQuery(props.userId, visible.value)
const userData = computed(() => updatedUserData.value || initialUserData.value || {})
const enabled = computed(() => !!visible.value)
const selectedProvinceId = computed(() => userData.value.province?.id)
const selectedCityId = computed(() => userData.value.city?.id)
const cityEnabled = computed(() => !!visible.value && !!selectedProvinceId.value)
const { data: provincesList } = useGetProvincesQuery({ enabled })
const { data: citiesOfProvinceList } = useGetCitiesOfProvinceQuery(selectedProvinceId, {
  enabled: cityEnabled,
})
const { data: methodOfIntroductionData } = useGetMethodOfIntroductionsQuery({ enabled })
const { data: advisorsList } = useRoles(['advisor', 'support', 'advisor_and_online_visit'], {
  enabled,
})
const isAdmin = computed(() => hasRole('superAdmin') || hasRole('admin'))
const isAdvisorDisabled = computed(() => !isAdmin.value && props.userId)
const nationalCodeLabel = computed(() =>
  userData.value.isForeignNational ? 'کد فراگیر/ فیدا/ پاسپورت' : 'کد ملی'
)

const isShowArea = computed(
  () =>
    !!citiesOfProvinceList.value?.items?.find(
      ({ id, hasArea }) => id === selectedCityId.value && hasArea
    )
)
const areaEnabled = computed(() => !!visible.value && isShowArea.value)
const { data: areasOfCityList } = useGetAreasOfCityQuery(selectedCityId, {
  enabled: areaEnabled,
})
const { options: areaOptions, filter: filterAreas } = usePersianOptions(
  computed(() => areasOfCityList.value?.items ?? []),
  'name'
)

const { mutate: createUser, isPending: createUserPending } = useCreateUserMutation()
const { mutate: updateUser, isPending: updateUserPending } = useUpdateUserMutation()
const { mutate: checkMobileExist, isPending: checkMobileExistLoading } = useUserExistMutation()
const loadingList = computed(
  () =>
    loading.value ||
    createUserPending.value ||
    updateUserPending.value ||
    uploading.value ||
    checkMobileExistLoading.value
)
const validationSchema = object().shape({
  firstName: string().nullable(),
  name: string().nullable(),
  advisor: object()
    .shape({
      id: number(),
    })
    .test('is-valid-id', 'لطفا مشاور کاربر را انتخاب کنید', (value) => {
      return value && value.id
    })
    .typeError('لطفا مشاور کاربر را انتخاب کنید'),
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
  methodOfIntroduction: object()
    .shape({
      id: number(),
    })
    .required()
    .typeError('شیوه آشنایی الزامیست')
    .test('is-valid-id', 'شیوه آشنایی الزامیست', (value) => {
      return value && value.id
    }),
  gender: string().nullable(),
  province: object()
    .shape({
      id: number(),
    })
    .nullable(),
  city: object()
    .shape({
      id: number(),
    })
    .nullable(),
  area: object()
    .shape({
      id: number(),
    })
    .nullable(),
  tel: string()
    .nullable()
    .test('', 'شماره را به صورت 9xxxxxxxxx وارد کنید', (val) => {
      if (!val || val === '') return true
      if (val && val.length < 10) return false
      return val
    }),
  mobile: mixed()
    .test('is-empty', 'شماره را به صورت 9xxxxxxxxx وارد کنید', (val) => {
      if (!val || val === '' || val.length < 10) return false
      return val
    })
    .required('شماره موبایل الزامیست'),
  landlinePhone: string().nullable(),
  serves: array().nullable(),
})
const { validate, validateAt, errors, setError } = useYup(validationSchema)

const isFilled = (key) => !!userData.value[key]
const isDisabledModifiedByUserFields = computed(
  () => !isAdmin.value && userData.value?.modifiedByClient && props.userId
)
const closeForm = () => {
  updatedUserData.value = null
  emits('close', false)
}

const handleChange = (field, value) => {
  const newData = { ...userData.value, [field]: value }
  updatedUserData.value = newData
  validateAt(field, value, newData)
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

const submitForm = async () => {
  const { isValid, payload } = await validate(userData.value)
  if (!isValid) return
  const form = {
    ...payload,
    province: payload.province?.id,
    city: payload.city?.id,
    area: payload.area?.id,
    opg: payload.opg?.id,
    avatar: payload.avatar?.id,
    advisor_id: payload.advisor?.id,
    methodOfIntroduction: payload.methodOfIntroduction?.id,
    lastStatus: payload.lastStatus?.id,
    cbct: payload.cbct?.map((c) => c.id),
    isForeignNational: payload.isForeignNational || false,
  }
  if (props.userId) {
    updateUser(
      { ...form, id: props.userId },
      {
        onSuccess: async (data) => {
          await queryClient.invalidateQueries({
            queryKey: ['user'],
          })
          Notif.success(data?.message)
          emits('afterSubmit')
        },
      }
    )
  } else {
    createUser(form, {
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({
          queryKey: ['user'],
        })
        Notif.success(data.message)
        emits('afterSubmit')
      },
    })
  }
}

watch(
  () => userData.value?.mobile,
  debounce((mobile) => {
    if (props.userId && initialUserData.value && mobile === initialUserData.value.mobile)
      return true
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
    if (props.userId && initialUserData.value && tel === initialUserData.value.tel) return true
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
<style lang="scss" scoped>
.float-right {
  float: right;
}

.text-right {
  text-align: right;
}
</style>
