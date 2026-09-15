<template>
  <div class="installment-setting">
    <div class="es__header">
      <Typography variant="heading" size="h6" class="self-start">پرداخت اقساطی</Typography>
      <Button
        v-if="getPerms('setting', 'add', true, 'pricing')"
        text="افزودن"
        :right-icon="IconPlus"
        @click="openInstallmentModal"
      />
    </div>

    <div v-if="installmentData.length === 0" class="es">
      <div class="es__icon">
        <IconDiscount size="36" stroke="1.5" />
      </div>
      <Typography variant="body" size="2" weight="bold" color="dark">
        در این شعبه اقساطی پیدا نکردیم!
      </Typography>
      <Typography variant="body" size="3" color="body">
        برای ایجاد اقساط، از گزینه افزودن استفاده کنید
      </Typography>
    </div>
    <div v-else class="container-fluid">
      <div class="flex justify-between q-my-md">
        <div class="col-md-2 q-pa-none q-gutter-sm">
          <Button
            is-icon-only
            is-rounded
            size="sm"
            variant="outline"
            color="primary"
            aria-label="بارگذاری مجدد"
            :left-icon="IconRefresh"
            @click="refetchData"
          />
        </div>
      </div>

      <div class="es__card">
        <QExpansionItem
          v-for="(installment, index) of installmentData"
          :key="installment.id"
          v-model="expandedStates[installment.id]"
          hide-expand-icon
          expand-icon-toggle
        >
          <template #header>
            <ActivityCard class="full-width">
              <template #title>
                <div class="es__title">
                  <QAvatar
                    color="white"
                    size="54px"
                    stroke="1"
                    text-color="grey-8"
                    class="avatar-frame"
                  >
                    <IconDiscount size="28" />
                  </QAvatar>
                  <div class="column">
                    <Typography variant="body" size="3" weight="bold">
                      اقساط {{ installment.month }} ماهه
                    </Typography>
                    <Typography variant="body" size="4" color="blue-grey">
                      {{ userData.branch.name || '-' }}
                    </Typography>
                  </div>
                  <div class="column">
                    <Typography variant="body" size="3" color="textSecondary" weight="bold">
                      {{ installment.percentage }}درصد
                    </Typography>
                    <Typography variant="body" size="4" color="blue-grey">پیش پرداخت</Typography>
                  </div>
                  <div class="column">
                    <Typography variant="body" size="3" color="textSecondary" weight="bold">
                      {{ installment.profit }}درصد
                    </Typography>
                    <Typography variant="body" size="4" color="blue-grey">سود اقساط</Typography>
                  </div>
                </div>
              </template>
              <template #actions>
                <div class="es__actions">
                  <Toggle
                    :model-value="installment.isActive"
                    :label="isActiveLabel(installment.isActive)"
                    flip
                    :disabled="isPendingUpdate"
                    @click="changeInstallmentStatus(installment)"
                  />
                  <Button
                    is-icon-only
                    is-rounded
                    size="sm"
                    variant="flat"
                    color="grey"
                    :aria-label="expandedStates[installment.id] ? 'جمع کردن' : 'باز کردن'"
                    :left-icon="expandedStates[installment.id] ? IconChevronUp : IconChevronDown"
                    @click="expandedStates[installment.id] = !expandedStates[installment.id]"
                  />
                </div>
              </template>
            </ActivityCard>
          </template>
          <template #default>
            <ActivityCard class="q-pa-md">
              <template #full-width>
                <div class="es__inner row q-col-gutter-md">
                  <div class="col-md-4 col-grow">
                    <NumberField
                      :model-value="installment.month"
                      label="تعداد ماه"
                      :error-message="errors.month"
                      @update:model-value="(e) => handleChange('month', index, e)"
                    />
                  </div>
                  <div class="col-md-4 col-grow">
                    <NumberField
                      :model-value="installment.percentage"
                      label="درصد پیش پرداخت"
                      :error-message="errors.percentage"
                      @update:model-value="(e) => handleChange('percentage', index, e)"
                    />
                  </div>
                  <div class="col-md-4 col-grow">
                    <NumberField
                      :model-value="installment.order"
                      label="اولویت"
                      :error-message="errors.order"
                      @update:model-value="(e) => handleChange('order', index, e)"
                    />
                  </div>
                  <div class="col-md-4 col-grow">
                    <CurrencyField
                      :model-value="installment.minPrice"
                      label="حداقل مبلغ خدمات"
                      :error-message="errors.minPrice"
                      @update:model-value="(e) => handleChange('minPrice', index, e)"
                    />
                  </div>
                  <div class="col-md-4 col-grow">
                    <CurrencyField
                      :model-value="installment.maxPrepay"
                      label="حداکثر مبلغ خدمات"
                      :error-message="errors.maxPrepay"
                      @update:model-value="(e) => handleChange('maxPrepay', index, e)"
                    />
                  </div>
                  <div class="col-md-4 col-grow">
                    <NumberField
                      :model-value="installment.profit"
                      label="سود اقساط"
                      :error-message="errors.profit"
                      @update:model-value="(e) => handleChange('profit', index, e)"
                    />
                  </div>
                  <div class="col-12 es__inner-actions">
                    <Button
                      variant="outline"
                      color="dark"
                      is-icon-only
                      :left-icon="IconTrash"
                      :is-loading="isPendingDelete || isPendingUpdate"
                      @click="deleteInstallmentItem(installment)"
                    />
                    <Button
                      variant="outline"
                      color="light-blue"
                      text="ذخیره تغییرات"
                      :is-loading="isPendingDelete || isPendingUpdate"
                      @click="updateInstallmentItem(installment)"
                    />
                  </div>
                </div>
              </template>
            </ActivityCard>
          </template>
        </QExpansionItem>
      </div>
    </div>

    <QInnerLoading :showing="isLoading || isPendingUpdate || isPendingDelete">
      <QSpinnerGears size="70px" color="primary" />
    </QInnerLoading>
  </div>

  <InstallmentDialog
    :visible="installmentModal"
    @close="closeInstallmentModal"
    @submit="handleSubmit"
  />
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import {
  IconRefresh,
  IconPlus,
  IconDiscount,
  IconChevronDown,
  IconChevronUp,
  IconTrash,
} from '@tabler/icons-vue'

import {
  useApiUpdateInstallment,
  useApiGetInstallmentList,
  useApiDeleteInstallment,
} from '@/modules/Settings'
import { useQueryClient } from '@tanstack/vue-query'
import { getPerms } from '@/utils/get-perms'
import useDisclosure from '@/composables/use-disclosure'
import useYup from '@/composables/use-yup'
import { useUserStore } from '@/store/user'
import { installmentValidationSchema } from '../schema/installment-schema'
import InstallmentDialog from '@/modules/Settings/PriceSettings/components/InstallmentDialog'
import ActivityCard from '@/modules/User/components/UserDetails/UserDetailsComponents/UserActivity/components/ActivityCard'
import NumberField from '@/components/Form/NumberField'
import CurrencyField from '@/components/Form/CurrencyField'
import Typography from '@/base/Typography'
import Button from '@/base/Button'
import Toggle from '@/base/Toggle'
import { Notif, confirmDialog } from '@/data/services/notification-service'

const userStore = useUserStore()
const queryClient = useQueryClient()
const updatedInstallmentData = ref(null)
const expandedStates = reactive({})

const { userData } = userStore

const { data: initialInstallmentData, isLoading } = useApiGetInstallmentList()
const installmentData = computed(
  () => updatedInstallmentData.value || initialInstallmentData.value || []
)

const [installmentModal, { open: openInstallmentModal, close: closeInstallmentModal }] =
  useDisclosure()

const isActiveLabel = (status) => (status === true ? 'فعال' : 'غیرفعال')

const { validate, validateAt, errors } = useYup(installmentValidationSchema)

const handleChange = (field, index, value) => {
  let finalValue = value
  if (field === 'maxPrepay' || field === 'minPrice') {
    finalValue =
      value === null || value === undefined || value === '' || Number.isNaN(Number(value))
        ? null
        : Number(value)
  }
  const source = updatedInstallmentData.value ?? initialInstallmentData.value ?? []
  updatedInstallmentData.value = source.map((item, i) =>
    i === index ? { ...item, [field]: finalValue } : item
  )
  validateAt(field, finalValue)
}

const invalidateInstallmentList = () => {
  queryClient.invalidateQueries({
    queryKey: ['setting', 'installment', 'list'],
  })
}

const { mutate: updateInstallment, isPending: isPendingUpdate } = useApiUpdateInstallment()

const changeInstallmentStatus = (installment) => {
  const status = !installment.isActive

  confirmDialog(
    `${isActiveLabel(status)} کردن اقساط`,
    `از ${isActiveLabel(status)} اقساط اطمینان دارید؟`,
    () => {
      const body = { ...installment, isActive: status }
      updateInstallment(
        { ...body, installmentId: installment?.id },
        {
          onSuccess: (res) => {
            Notif.success(res.message)
            invalidateInstallmentList()
          },
        }
      )
    },
    {
      ok: {
        label: 'تایید',
        color: 'primary',
        flat: true,
      },
      cancel: {
        label: 'انصراف',
        color: 'negative',
        flat: true,
      },
    }
  )
}

const { mutate: deleteInstallment, isPending: isPendingDelete } = useApiDeleteInstallment()

const deleteInstallmentItem = (installment) => {
  const installmentMonthLabel = `${installment?.month} ماهه `
  confirmDialog(
    'حذف رکورد!',
    `آیا از حذف رکورد اقساط
     <strong>
     ${installmentMonthLabel}
     </strong>
      مطمئنید؟`,
    () => {
      if (!installment.id) {
        Notif.warning('شناسه اقساط مورد نظر وجود ندارد.', {
          caption: 'لطفا مجدد تلاش کنید یا صفحه را رفرش کنید.',
        })
        return
      }
      deleteInstallment(installment.id, {
        onSuccess: (response) => {
          updatedInstallmentData.value = null
          invalidateInstallmentList()
          Notif.success(response.message)
        },
      })
    },
    {
      cancel: {
        label: 'انصراف',
        color: 'negative',
        flat: true,
      },
      html: true,
      persistent: true,
    }
  )
}

const updateInstallmentItem = async (installment) => {
  const installmentMonthLabel = `${installment?.month} ماهه `
  const target = installmentData.value.find((item) => item.id === installment.id)
  if (!target) return

  const { isValid, payload } = await validate(target)
  if (!isValid) return
  confirmDialog(
    'ذخیره تغییرات اقساط',
    `از ذخیره تغییرات برای اقساط ${installmentMonthLabel} اطمینان دارید؟`,
    () => {
      const body = { ...payload }
      updateInstallment(
        { ...body, installmentId: installment?.id },
        {
          onSuccess: (res) => {
            Notif.success(res.message)
            updatedInstallmentData.value = null
            invalidateInstallmentList()
          },
        }
      )
    },
    {
      cancel: {
        label: 'انصراف',
        color: 'negative',
        flat: true,
      },
      ok: {
        label: 'تایید',
        color: 'primary',
        flat: true,
      },
    }
  )
}

const handleSubmit = () => {
  closeInstallmentModal()
}

const refetchData = () => {
  invalidateInstallmentList()
}
</script>

<style scoped lang="scss">
.installment-setting {
  position: relative;
  min-height: 50dvh;
}
.es {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
  margin: auto;
  gap: $spacing-md;
  &__header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  &__icon {
    border: 1px solid $default-border;
    border-radius: $radius-md;
    width: 60px;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  &__card {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    padding: $spacing-lg;
    :deep(.q-item) {
      padding: 0 !important;
    }
  }
  &__actions {
    display: flex;
    gap: $spacing-md;
    padding: $spacing-md;
  }
  &__title {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-lg;
  }
  &__inner {
    background-color: $white;
    padding: $spacing-lg;
    border-radius: $radius-md;
    &-actions {
      display: flex;
      gap: $spacing-md;
      justify-content: end;
      align-items: center;
    }
  }
}
.avatar-frame {
  border-radius: $radius-sm;
}
</style>
