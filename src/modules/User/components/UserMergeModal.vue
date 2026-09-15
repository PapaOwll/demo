<template>
  <BaseModal
    :model-value="visible"
    title="ادغام کاربران"
    subtitle="برای ادغام کاربران ابتدا شماره موبایل کاربر اصلی را وارد کنید"
    width="780px"
    @close="closeForm"
  >
    <div class="um-content">
      <div
        class="um-content__card"
        :class="{
          'um-content__card--error': errors.originalUser,
          'um-content__card--success': validationSuccess,
        }"
      >
        <QInnerLoading :showing="isLoading">
          <QSpinnerTail color="primary" size="lg" />
        </QInnerLoading>
        <Typography variant="body" size="4" weight="semibold">کاربر اصلی</Typography>
        <UserSelectField
          :model-value="formData.originalUser"
          dense
          label=""
          placeholder="شماره موبایل کاربر اصلی را وارد کنید"
          :drop-down-icon="true"
          :emit-value="false"
          @update:model-value="(e) => (formData.originalUser = e)"
        />
        <Typography v-if="errors.originalUser" variant="caption" color="red">
          {{ errors.originalUser }}
        </Typography>

        <div v-if="validationSuccess || formData.originalUser" class="um-users-info">
          <QAvatar
            :class="
              formData.originalUser?.rawData?.isVip
                ? 'um-users-info__avatar-vip'
                : 'um-users-info__avatar'
            "
          />
          <Typography variant="body" size="4" weight="medium" class="full-width">
            {{ formData.originalUser?.rawData?.firstName || '' }}
            {{ formData.originalUser?.rawData?.name || '' }}
            <div class="um-users-info__docnumber">
              <Typography variant="caption" size="3" color="grey">شماره پرونده</Typography>
              <Typography variant="caption" size="3" color="grey">
                {{ formData.originalUser?.rawData?.docNumber || 'ندارد' }}
              </Typography>
            </div>
          </Typography>
        </div>
        <div v-if="!formData.originalUser" class="um-users-info text-center">
          <Typography variant="body" size="4" weight="regular" color="grey">
            کاربری انتخاب نشده
          </Typography>
        </div>
      </div>

      <div class="um-content__convert">
        <Button
          variant="outline"
          size="md"
          is-icon-only
          :right-icon="IconArrowsLeftRight"
          is-rounded
          :is-disabled="!formData.sideUser && !formData.originalUser"
          @click="swapUsers"
        />
      </div>

      <div
        class="um-content__card"
        :class="{
          'um-content__card--error': errors.sideUser,
          'um-content__card--success': validationSuccess,
        }"
      >
        <QInnerLoading :showing="isLoading">
          <QSpinnerTail color="primary" size="lg" />
        </QInnerLoading>
        <Typography variant="body" size="4" weight="semibold">کاربر فرعی</Typography>
        <UserSelectField
          :model-value="formData.sideUser"
          dense
          label=""
          placeholder="شماره موبایل کاربر فرعی را وارد کنید"
          :drop-down-icon="true"
          :emit-value="false"
          @update:model-value="(e) => (formData.sideUser = e)"
        />
        <Typography v-if="errors.sideUser" variant="caption" color="red">
          {{ errors.sideUser }}
        </Typography>

        <div v-if="validationSuccess || formData.sideUser" class="um-users-info">
          <QAvatar
            :class="
              formData.sideUser?.rawData?.isVip
                ? 'um-users-info__avatar-vip'
                : 'um-users-info__avatar'
            "
          />
          <Typography variant="body" size="4" weight="medium" class="full-width">
            {{ formData.sideUser?.rawData?.firstName || '' }}
            {{ formData.sideUser?.rawData?.name || '' }}
            <div class="um-users-info__docnumber">
              <Typography variant="caption" size="3" color="grey">شماره پرونده</Typography>
              <Typography variant="caption" size="3" color="grey">
                {{ formData.sideUser.rawData.docNumber || 'ندارد' }}
              </Typography>
            </div>
          </Typography>
        </div>
        <div v-if="!formData.sideUser" class="um-users-info text-center">
          <Typography variant="body" size="4" weight="regular" color="grey">
            کاربری انتخاب نشده
          </Typography>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        variant="flat"
        color="grey"
        text="بازگشت"
        :is-loading="isPending"
        @click="closeForm"
      />
      <Button
        variant="filled"
        color="blue"
        text="تایید"
        :is-disabled="isActionDisabled"
        :is-loading="isPending"
        @click="submitMergeUsers"
      />
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, toRefs, watch, computed } from 'vue'
import BaseModal from '@/base/Modal'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import { IconArrowsLeftRight } from '@tabler/icons-vue'
import UserSelectField from '@/components/Form/UserSelectField'
import { useUserMergeMutation } from '@/modules/User/query/index'
import { Notif } from '@/data/services/notification-service'

const emits = defineEmits(['close', 'onSubmit'])
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})
const { visible } = toRefs(props)

const isLoading = ref(false)
let validationTimer = null

const { mutate, isPending } = useUserMergeMutation()

const formData = ref({
  originalUser: null,
  sideUser: null,
})

const errors = ref({
  originalUser: '',
  sideUser: '',
})

const isActionDisabled = computed(() => {
  return (
    !!errors.value.originalUser ||
    !!errors.value.sideUser ||
    !formData.value.originalUser ||
    !formData.value.sideUser ||
    isLoading.value
  )
})
const validationSuccess = computed(() => {
  return (
    formData.value.originalUser &&
    formData.value.sideUser &&
    !errors.value.originalUser &&
    !errors.value.sideUser
  )
})

const validateUsers = () => {
  errors.value = {
    originalUser: '',
    sideUser: '',
  }

  if (!formData.value.originalUser || !formData.value.sideUser) {
    return
  }

  const originalDocNumber = formData.value.originalUser?.rawData?.docNumber
  const sideDocNumber = formData.value.sideUser?.rawData?.docNumber

  if (sideDocNumber && sideDocNumber !== originalDocNumber) {
    errors.value.sideUser = 'کاربر فرعی نمی‌تواند شماره پرونده متفاوت از کاربر اصلی داشته باشد'
  }
}

const runValidationWithLoading = () => {
  if (validationTimer) {
    clearTimeout(validationTimer)
  }

  isLoading.value = true

  validationTimer = setTimeout(() => {
    try {
      validateUsers()
    } finally {
      isLoading.value = false
    }
  }, 1000)
}

const swapUsers = () => {
  const temp = formData.value.originalUser
  formData.value.originalUser = formData.value.sideUser
  formData.value.sideUser = temp

  runValidationWithLoading()
}

const closeForm = () => {
  formData.value.originalUser = null
  formData.value.sideUser = null
  emits('close', false)
}

const submitMergeUsers = () => {
  const data = {
    sourceUserMobile: formData.value.sideUser?.rawData?.mobile,
    targetUserMobile: formData.value.originalUser?.rawData?.mobile,
  }
  mutate(
    { ...data },
    {
      onSuccess: (response) => {
        Notif.success(response?.message || 'عملیات موفق آمیز بود')
        emits('onSubmit')
        closeForm()
      },
    }
  )
}
watch(
  () => [formData.value.originalUser, formData.value.sideUser],
  () => {
    runValidationWithLoading()
  },
  { deep: true }
)
</script>

<style lang="scss">
.um-content {
  display: flex;
  align-items: center;
  flex-flow: row;
  gap: $spacing-sm;

  &__card {
    gap: 5px;
    padding: $spacing-md;
    background-color: $grey-2;
    border-radius: 0.75rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 2px solid transparent;
    transition: border-color 0.3s ease;

    &--error {
      border-color: $negative;
    }

    &--success {
      border-color: $positive;
    }
  }

  &__convert {
    text-align: center;
    margin: 0 $spacing-xxs;
  }
}

.um-users-info {
  width: 100%;
  margin-top: $spacing-md;
  padding: $spacing-md;
  border: 1px solid $blue-grey-2;
  border-radius: $radius-xs;
  display: flex;
  justify-content: center;
  flex-flow: row;
  gap: $spacing-xxs;
  background-color: white;

  &__docnumber {
    display: flex;
    justify-content: space-between;
  }

  &__avatar {
    background-color: $blue-grey-1;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    text-align: center;
    margin: 0 auto;

    &-vip {
      background-color: $blue-grey-1;
      border: 3px solid $amber;
    }
  }
}
</style>
