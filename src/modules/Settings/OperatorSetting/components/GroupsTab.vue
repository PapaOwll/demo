<template>
  <div class="groups">
    <div class="groups__header">
      <p class="groups__header-title">گروه بندی استان کارمندان</p>

      <QBtn flat color="primary" @click="handleChangeDialogEditOrNewStatus(true, 'new')">
        ایجاد گروه جدید
      </QBtn>
    </div>
    <QBanner class="groups__warning" rounded>
      <template #avatar>
        <QIcon name="warning" color="warning" />
      </template>
      در صورت تمایل به ساخت چند گروه برای یک استان،به تنظیمات زمان‌بندی هر گروه توجه داشته باشید تا
      همه تاریخ‌ها پوشش داده شده باشند.
      <br />
      به طور مثال:
      <br />
      اگر الان یک گروه برای تهران داریم و میخواهیم که یک گروه دیگر برای کاربران ۳ ماه پیش به قبل
      اضافه کنیم، ابتدا زمان گروه فعلی را از ۳۰ تا صفر روز قبل تنظیم میکنیم.
      <br />
      سپس گروه دوم تهران را برای ۱۰۰۰۰۰ روز تا ۳۱ روز قبل میسازیم.
      <br />
      حتما در انتهای تنظیمات، با بررسی مجدد همه گروه‌های یک استان، از صحت تنظیمات اطمینان حاصل کنید.
    </QBanner>
    <div class="groups__boxes">
      <div v-for="item in group" :key="item" class="groups__boxes-item">
        <div class="groups__boxes-item-header">
          <div class="groups__boxes-item-header-title">
            <p>{{ item.provinceName }}</p>
            <template v-if="item.fromDaysAgo && item.toDaysAgo">
              <svg
                width="1"
                height="18"
                viewBox="0 0 1 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line x1="0.5" y1="2.18557e-08" x2="0.499999" y2="18" stroke="#CDD0D6" />
              </svg>
              <p>
                از
                {{ item.fromDaysAgo }}
                تا
                {{ item.toDaysAgo }}
                روز قبل
              </p>
            </template>
          </div>
          <div class="groups__boxes-item-header-tools">
            <IconEdit
              class="groups__boxes-item-header-tools-svg groups__boxes-item-header-tools-svg--edit"
              :size="24"
              @click="handleChangeGroup(item)"
            />
            <IconTrash
              v-if="item.provinceId !== null && item.provinceId !== -1 && item.provinceId !== -2"
              class="groups__boxes-item-header-tools-svg groups__boxes-item-header-tools-svg--trash"
              :size="24"
              @click="handleRemoveGroup(item)"
            />
          </div>
        </div>
        <div class="groups__boxes-item-content">
          <QChip
            v-for="advisorItem in item.advisors"
            :key="advisorItem.id"
            class="chips chips-info"
          >
            {{ advisorItem.advisorName }}
          </QChip>
        </div>
      </div>
    </div>

    <QDialog v-model="state.dialogEditOrNew.status" class="groups__dialog">
      <QCard class="groups__dialog-card">
        <QCardSection class="groups__dialog-header">
          <div class="groups__dialog-header-content">
            <p class="groups__dialog-header-title">
              {{ state.dialogEditOrNew.type === 'new' ? 'ایجاد گروه' : 'ویرایش گروه' }}
            </p>
            <IconX
              class="groups__dialog-header-svg"
              :size="24"
              @click="handleChangeDialogEditOrNewStatus(false)"
            />
          </div>
        </QCardSection>
        <QCardSection class="groups__dialog-content">
          <div class="groups__dialog-input">
            <label class="groups__dialog-input-label" for="province">استان</label>
            <QSelect
              id="province"
              v-model="state.provinceSelected"
              use-input
              class="full-width"
              input-debounce="0"
              :disable="state.dialogEditOrNew.type === 'edit'"
              label="استان خود را انتخاب کنید"
              clearable
              :loading="!provincesData?.length"
              :options="provincesData"
              option-value="id"
              option-label="name"
              emit-value
              map-options
              outlined
            />

            <p v-if="!state.provinceSelected" class="groups__dialog-input-error">
              {{ errors['provinceSelected'] ?? '' }}
            </p>
          </div>
          <div class="groups__dialog-input">
            <label class="groups__dialog-input-label" for="advisor">نام کارمند</label>
            <QSelect
              id="advisor"
              v-model="state.advisorSelected"
              use-input
              use-chips
              multiple
              input-debounce="0"
              class="full-width"
              clearable
              label="نام کارمند خود را انتخاب کنید"
              :loading="!advisorData?.length"
              :options="advisorData"
              option-value="id"
              option-label="name"
              emit-value
              map-options
              outlined
            >
              <template #option="{ itemProps, opt }">
                <QItem v-bind="itemProps">
                  <QItemSection>
                    <div class="flex justify-between">
                      <QItemLabel>{{ opt.name }}</QItemLabel>
                      <QItemLabel v-if="opt.groupCount">
                        {{ `در ${opt.groupCount} گروه` }}
                      </QItemLabel>
                    </div>
                  </QItemSection>
                </QItem>
              </template>
            </QSelect>
            <p v-if="!state.advisorSelected?.length" class="groups__dialog-input-error">
              {{ errors['advisorSelected'] ?? '' }}
            </p>
          </div>
          <div class="groups__dialog-input">
            <label class="groups__dialog-input-label" for="advisor">تاریخ</label>
            <div class="groups__dialog-input-time">
              <p>از</p>
              <QInput
                placeholder="مثلا 60 روز قبل"
                outlined
                :model-value="state.fromDaysAgo"
                @update:model-value="handleChangeStartInput"
              />
              <p>تا</p>
              <QInput
                placeholder="مثلا 30 روز قبل"
                outlined
                :model-value="state.toDaysAgo"
                @update:model-value="handleChangeEndInput"
              />
            </div>
            <p v-if="errors['toDaysAgo']" class="groups__dialog-input-error">
              {{ errors['toDaysAgo'] ?? '' }}
            </p>
          </div>
        </QCardSection>
        <QCardActions class="groups__dialog-footer">
          <QBtn
            class="groups__dialog-btn groups__dialog-btn--reject"
            flat
            @click="handleChangeDialogEditOrNewStatus(false)"
          >
            انصراف
          </QBtn>
          <QBtn
            class="groups__dialog-btn groups__dialog-btn--accept"
            :loading="groupTabLoading.value"
            color="primary"
            @click="onSubmit"
          >
            {{ state.dialogEditOrNew.type === 'new' ? 'ایجاد' : 'ثبت تغییرات' }}
          </QBtn>
        </QCardActions>
      </QCard>
    </QDialog>
  </div>
</template>

<script setup>
import { groupAdvisorsByProvince, groupByProvince } from '../utils/index'
import { convertToEnNumber } from '@/utils/convert-check-digits'
import { object, number, array, mixed } from 'yup'
import useYup from '@/composables/use-yup'
import { reactive, computed } from 'vue'
import { IconEdit, IconTrash, IconX } from '@tabler/icons-vue'
import {
  usePostGroupAdviserMutation,
  useGetGroupAdvisor,
  useGetProvinces,
  useGetAdvisor,
} from '../query'
import { Notif, confirmDialog } from '@/data/services/notification-service'

const state = reactive({
  dialogEditOrNew: { status: false, type: 'new' },
  provinceSelected: null,
  advisorSelected: [],
  fromDaysAgo: '',
  toDaysAgo: '',
})

const handleChangeStartInput = (e) => {
  state.fromDaysAgo = convertToEnNumber(e?.replace(/\D/g, ''))
}

const handleChangeEndInput = (e) => {
  state.toDaysAgo = convertToEnNumber(e?.replace(/\D/g, ''))
}

const { data: groupFetch, isLoading } = useGetGroupAdvisor()
const { mutateAsync, isPending } = usePostGroupAdviserMutation()
const provinceFetch = useGetProvinces()
const advisorFetch = useGetAdvisor()

const groupData = computed(() => groupFetch?.value?.setting ?? [])

const advisorData = computed(() => {
  const advisors = advisorFetch?.data?.value?.items ?? []
  const groups = groupData.value ?? []

  return advisors.map((advisor) => {
    const groupKeys = groups
      .filter(({ advisorId }) => advisorId.includes(advisor.id))
      .map(({ provinceId, fromDaysAgo, toDaysAgo }) => `${provinceId}-${fromDaysAgo}-${toDaysAgo}`)

    return {
      ...advisor,
      groupCount: new Set(groupKeys).size,
    }
  })
})

const group = computed(() => {
  const advisors = advisorFetch?.data?.value?.items ?? []
  const provinces = provinceFetch?.data?.value?.items ?? []
  if (!advisors?.length || !groupData?.value.length || !provinces?.length) return []

  const data = groupAdvisorsByProvince(groupData.value, advisors, provinces)
  const groupedByProvince = groupByProvince(data)
  return Object.values(groupedByProvince).sort((a, b) => {
    const hasProvinceA = a.provinceId !== null && a.provinceId !== undefined
    const hasProvinceB = b.provinceId !== null && b.provinceId !== undefined

    return hasProvinceA === hasProvinceB ? 0 : hasProvinceA ? -1 : 1
  })
})

const provincesData = computed(() => {
  const provinces = provinceFetch?.data?.value?.items ?? []
  // Add special options for cold leads and without province
  return [
    ...provinces,
    { id: -2, name: 'لید سرد' },
    { id: null, name: 'بدون استان' },
    { id: -1, name: 'سایر استان' },
  ]
})

const groupTabLoading = computed(() => {
  return isPending || isLoading
})

const validationSchema = object({
  provinceSelected: mixed().required('لطفا استان را انتخاب کنید'),
  advisorSelected: array()
    .min(1, 'لطفا حداقل یک مشاور انتخاب کنید')
    .required('لطفا حداقل یک مشاور انتخاب کنید'),
  fromDaysAgo: number()
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value)),

  toDaysAgo: number()
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .test(
      'both-or-none',
      'اگر یکی از فیلدهای زمان وارد شده باشد، دیگری نیز الزامی است',
      function (toDaysAgo) {
        const { fromDaysAgo } = this.parent
        const oneFilled =
          (fromDaysAgo !== null && fromDaysAgo !== undefined) ||
          (toDaysAgo !== null && toDaysAgo !== undefined)
        const bothFilled = fromDaysAgo !== null && toDaysAgo !== null
        return !oneFilled || bothFilled
      }
    )
    .test(
      'is-less-than-fromDaysAgo',
      'فیلد دوم باید کوچک‌تر از فیلد اول باشد',
      function (toDaysAgo) {
        const { fromDaysAgo } = this.parent
        if (fromDaysAgo == null || toDaysAgo == null) return true
        return toDaysAgo < fromDaysAgo
      }
    ),
})

const { validate, errors } = useYup(validationSchema)

const handleChangeDialogEditOrNewStatus = (status, type) => {
  if (status) {
    state.dialogEditOrNew.type = type
  } else {
    setTimeout(() => {
      state.advisorSelected = null
      state.provinceSelected = null
      state.fromDaysAgo = ''
      state.toDaysAgo = ''
    }, 500)
  }

  state.dialogEditOrNew.status = status
}

const handleChangeGroup = (data) => {
  state.provinceSelected =
    data.provinceId === null
      ? 'بدون استان'
      : data.provinceId === -1
        ? 'سایر استان'
        : data.provinceId === -2
          ? 'لید سرد'
          : data.provinceId

  state.advisorSelected = data.advisors.map((item) => item.advisorId)
  state.fromDaysAgo = data.fromDaysAgo
  state.toDaysAgo = data.toDaysAgo

  handleChangeDialogEditOrNewStatus(true, 'edit')
}

const dataConvertForSendApi = computed(() => {
  return group.value.map((item) => ({
    advisor_id: item.advisors.map((advisor) => advisor.advisorId),
    province_id: item.provinceId,
    from_days_ago: item.fromDaysAgo,
    to_days_ago: item.toDaysAgo,
  }))
})

const isSameGroup = (item, selected) =>
  item.province_id === selected.provinceId &&
  item.from_days_ago === selected.fromDaysAgo &&
  item.to_days_ago === selected.toDaysAgo

const acceptRemoveGroup = (groupToRemove) => {
  const data = dataConvertForSendApi.value.filter((item) => !isSameGroup(item, groupToRemove))

  mutateAsync(data, {
    onSuccess: () => {
      Notif.success('گروه با موفقیت حذف شد', { position: 'top' })
    },
    onError: () => {
      Notif.error('خطا در حذف گروه', { position: 'top' })
    },
  })
}

const handleRemoveGroup = (data) => {
  confirmDialog(
    'تأیید حذف',
    `آیا از حذف گروه ${data.provinceName} اطمینان دارید؟`,
    () => {
      acceptRemoveGroup(data)
    },
    {
      cancel: {
        label: 'خیر',
        flat: true,
        color: 'grey-7',
      },
      ok: {
        label: 'بله',
        color: 'primary',
      },
      persistent: true,
    }
  )
}

const onSubmit = async () => {
  const { provinceSelected, advisorSelected, fromDaysAgo, toDaysAgo } = state

  const { isValid } = await validate({ provinceSelected, advisorSelected, fromDaysAgo, toDaysAgo })
  if (!isValid) return

  const provinceValue =
    provinceSelected === 'بدون استان'
      ? null
      : provinceSelected === 'سایر استان'
        ? -1
        : provinceSelected === 'لید سرد'
          ? -2
          : provinceSelected

  const newGroup = {
    advisor_id: advisorSelected,
    province_id: provinceValue,
    from_days_ago: fromDaysAgo || null,
    to_days_ago: toDaysAgo || null,
  }

  const newKey = `${provinceValue}-${newGroup.from_days_ago}-${newGroup.to_days_ago}`

  const updatedData = [
    newGroup,
    ...dataConvertForSendApi.value.filter((item) => {
      const key = `${item.province_id || null}-${item.from_days_ago || null}-${item.to_days_ago || null}`
      return key !== newKey
    }),
  ]

  mutateAsync(updatedData, {
    onSuccess: () => {
      handleChangeDialogEditOrNewStatus(false)
      Notif.success(
        state.dialogEditOrNew.type === 'new'
          ? 'گروه با موفقیت ایجاد شد'
          : 'گروه با موفقیت ویرایش شد',
        { position: 'top' }
      )
    },
    onError: () => {
      Notif.error('خطا در عملیات', { position: 'top' })
    },
  })
}
</script>

<style lang="scss">
.groups {
  flex-direction: column;
  display: flex;
  width: 100%;

  &__header {
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 0 5px;
    display: flex;
    width: 100%;

    &-title {
      margin: 0;
      color: $grey-7;
      font-size: 1.25rem;
      font-weight: 500;
    }
  }

  &__warning {
    margin-bottom: 1.5rem;
    background-color: $orange-1;
    color: $orange-9;
  }

  &__boxes {
    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
    grid-auto-rows: 153px;
    justify-items: center;
    margin-top: 1.875rem;
    padding: 0.625rem 0;
    align-items: start;
    display: grid;
    gap: 16px;

    &-item {
      flex-direction: column;
      max-width: 450px;
      display: flex;
      width: 100%;
      gap: 10px;

      &-header {
        justify-content: space-between;
        align-items: center;
        display: flex;
        width: 100%;

        &-title {
          align-items: center;
          font-weight: 600;
          display: flex;
          gap: 8px;

          p:first-child {
            color: $grey-8;
            font-weight: 600;
            font-size: 1rem;
            margin: 0;
          }

          p:last-child {
            color: $grey-6;
            font-size: 0.875rem;
            font-weight: 500;
            margin: 0;
          }
        }

        &-tools {
          align-items: center;
          display: flex;
          gap: 8px;

          &-svg {
            cursor: pointer;

            &--edit {
              color: $grey-6;
            }

            &--trash {
              color: $negative;
            }
          }
        }
      }

      &-content {
        border: 1px solid $grey-4;
        justify-content: start;
        border-radius: 10px;
        align-items: start;
        padding: 0.625rem;
        flex-wrap: wrap;
        height: 121px;
        display: flex;
        gap: 10px;
      }
    }
  }

  &__dialog {
    &-card {
      padding: 2rem 1.5rem;
      width: 372px;
      border-radius: 12px !important;
    }

    &-header {
      padding: 0;

      &-content {
        justify-content: space-between;
        align-items: center;
        display: flex;
        width: 100%;
      }

      &-title {
        color: $grey-9;
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
      }

      &-svg {
        cursor: pointer;
        color: $grey-6;
      }
    }

    &-content {
      padding: 10px 0;
      flex-direction: column;
      display: flex;
      gap: 20px;

      &-text {
        color: $grey-7;
        text-align: center;
        font-weight: 500;
        font-size: 1rem;
        width: 100%;
        margin: 0;
      }
    }

    &-input {
      justify-content: center;
      flex-direction: column;
      align-items: start;
      display: flex;
      width: 100%;
      gap: 3px;

      &-label {
        font-size: 0.875rem;
        color: $grey-7;
        font-weight: 500;
      }

      &-error {
        color: $negative;
        font-size: 0.75rem;
        margin: 0;
      }

      &-time {
        justify-content: center;
        align-items: center;
        display: flex;
        gap: 6px;

        p {
          font-weight: 500;
          margin: 0;
          color: $grey-7;
        }
      }
    }

    &-footer {
      padding: 0;
      justify-content: space-between;
      align-items: end;
      display: flex;
      width: 100%;
      margin-top: 1rem;
    }

    &-btn {
      margin: 0 !important;
      width: 154px;
      height: 40px;

      &--reject {
        color: $grey-7;
      }
    }
  }
}
</style>
