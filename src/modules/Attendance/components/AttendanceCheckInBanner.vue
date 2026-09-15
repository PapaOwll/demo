<template>
  <div class="attendance-banner">
    <img
      src="@/assets/images/attendance-background.svg"
      alt=""
      class="attendance-banner__background"
    />
    <div class="attendance-banner__content">
      <div class="attendance-banner__icon">
        <img src="@/assets/icons/attendance.svg" alt="" class="attendance-banner__icon-img" />
      </div>
      <div class="attendance-banner__title">تردد امروز رو ثبت کن</div>
      <div class="attendance-banner__input-wrapper">
        <div class="attendance-banner__input-container">
          <QBtn
            rounded
            unelevated
            color="primary"
            class="attendance-banner__submit-btn"
            :loading="isCheckInPending"
            :disable="!formData.user"
            @click="submitForm"
          >
            <IconLogin :size="24" class="q-mr-xs" />
            ثبت ورود
          </QBtn>
          <div class="attendance-banner__select-wrapper">
            <QSelect
              ref="selectRef"
              :model-value="formData.user"
              :options="userList"
              outlined
              dense
              emit-value
              map-options
              use-input
              hide-selected
              fill-input
              hide-dropdown-icon
              placeholder="جستجو نام کاربر، شماره همراه، کد ملی "
              color="grey-4"
              clearable
              borderless
              :loading="getUserSearch"
              :option-label="
                (item) => (item?.firstName ? item.firstName + ' ' + item.name : item?.name)
              "
              :input-value="selectedUserDisplay"
              popup-content-class="attendance-banner__dropdown"
              class="attendance-banner__select"
              @filter="searchUser"
              @update:model-value="(e) => handleChange('user', e)"
              @input-value="onInputChange"
              @keydown.enter="handleEnterKey"
            >
              <template #option="scope">
                <QItem
                  v-bind="scope.itemProps"
                  class="attendance-banner__option"
                  :class="{ 'attendance-banner__option--selected': scope.selected }"
                >
                  <QItemSection class="attendance-banner__option-content">
                    <div class="attendance-banner__option-name">
                      {{
                        scope.opt?.firstName
                          ? scope.opt?.firstName + ' ' + scope.opt?.name
                          : scope.opt?.name
                      }}
                    </div>
                    <div class="attendance-banner__option-mobile">
                      {{ scope.opt.mobile }}
                    </div>
                  </QItemSection>
                </QItem>
              </template>
              <template v-if="getUserSearch || inputValue" #no-option>
                <div v-if="getUserSearch" class="attendance-banner__loading">
                  <QSpinner color="primary" size="24px" />
                  <span>در حال جستجو...</span>
                </div>
                <div v-else class="attendance-banner__no-option">
                  <div class="attendance-banner__no-option-text">کاربر یافت نشد</div>
                  <QBtn
                    flat
                    no-caps
                    class="attendance-banner__add-user-btn"
                    @click="openRegisterModal"
                  >
                    <IconPlus :size="24" />
                    <span>افزودن کاربر</span>
                  </QBtn>
                  <div class="attendance-banner__no-option-warning">
                    <span>مطمئن بشین که مراجع شماره فعال دیگری نداره.</span>
                    <IconAlertTriangle :size="24" class="attendance-banner__warning-icon" />
                  </div>
                </div>
              </template>
            </QSelect>
          </div>
        </div>
      </div>
    </div>
  </div>

  <RegisterUserModal
    :visible="registerModalVisible"
    @close="registerModalVisible = false"
    @after-submit="handleUserCreated"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import { apiGetUsers } from '@/modules/User/api'
import { useApiCheckIn } from '../query'
import { Notif } from '@/data/services/notification-service'
import { IconLogin, IconPlus, IconAlertTriangle } from '@tabler/icons-vue'
import RegisterUserModal from '@/modules/User/components/RegisterUserModal'
import { convertToEnNumber } from '@/utils/convert-check-digits'

const emits = defineEmits(['submitted'])

const selectRef = ref(null)
const formData = ref({})
const inputValue = ref('')
const registerModalVisible = ref(false)
const userList = ref([])
const getUserSearch = ref(false)

const selectedUserDisplay = computed(() => {
  if (inputValue.value) return inputValue.value
  const { user } = formData.value
  if (!user) return ''
  return user.firstName ? `${user.firstName} ${user.name}` : user.name
})

const onInputChange = (val) => {
  inputValue.value = convertToEnNumber(val)
}

const handleChange = (field, value) => {
  formData.value = { ...formData.value, [field]: value }
  if (field === 'user') {
    inputValue.value = ''
  }
}

const searchUser = async (val, update, abort) => {
  const q = convertToEnNumber(val?.trim() || '')

  if (q.length < 2) {
    update(() => {
      userList.value = []
    })
    return
  }

  const filter = {}
  let key = 'filter[name]'
  let searchVal = q
  if (/\d/.test(q)) {
    key = 'filter[mobile]'
    searchVal = q.replace(/^(0|98|\+98)/, '')
  }
  filter[key] = searchVal

  getUserSearch.value = true

  try {
    const response = await apiGetUsers(filter)
    const items = response?.data?.items || []

    update(() => {
      userList.value = items
      getUserSearch.value = false
    })
  } catch {
    abort()
    getUserSearch.value = false
  }
}

const { mutate: checkIn, isPending: isCheckInPending } = useApiCheckIn()

const openRegisterModal = () => {
  selectRef.value?.hidePopup()
  registerModalVisible.value = true
}

const handleUserCreated = (user) => {
  registerModalVisible.value = false
  formData.value.user = user
  inputValue.value = ''
}

const submitForm = async () => {
  if (!formData.value.user?.id) {
    Notif.warning('لطفا کاربر را انتخاب کنید')
    return
  }

  const data = {
    userId: formData.value.user?.id,
  }

  checkIn(data, {
    onSuccess: (response) => {
      Notif.success(response.message || 'ورود با موفقیت ثبت شد')
      formData.value = {}
      inputValue.value = ''
      emits('submitted')
    },
  })
}

const handleEnterKey = () => {
  if (formData.value.user?.id) {
    submitForm()
  }
}
</script>

<style lang="scss" scoped>
.attendance-banner {
  position: relative;
  width: 100%;
  border-radius: 16px;
  padding: 12px 0;
  background: linear-gradient(179deg, rgba(227, 242, 253, 1) 0%, rgba(255, 255, 255, 1) 81%);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  &__background {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 50%;
    pointer-events: none;
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  &__icon {
    width: 72px;
    height: 72px;
    border-radius: 12px;
    background: linear-gradient(178deg, rgba(255, 255, 255, 1) 16%, rgba(255, 255, 255, 0.1) 75%);
    display: flex;
    justify-content: center;
    align-items: center;
    color: $primary;
    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15);
  }

  &__icon-img {
    width: 50px;
    height: 50px;
  }

  &__title {
    font-weight: 500;
    font-size: 20px;
    line-height: 1.6em;
    text-align: center;
    color: $grey-8;
  }

  &__input-wrapper {
    width: 400px;
    height: 48px;
  }

  &__input-container {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    gap: 12px;
    height: 100%;
    padding: 4px 8px 4px 4px;
    border: 1px solid $primary;
    border-radius: 100px;
    background: white;
  }

  &__submit-btn {
    min-width: 120px;
    height: 40px;
    font-weight: 500;
    font-size: 14px;
    border-radius: 50px !important;
  }

  &__select-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  &__select {
    width: 100%;

    :deep(.q-field__control) {
      height: 36px;
      min-height: 36px;

      &::before,
      &::after {
        border: none !important;
      }
    }

    :deep(.q-field__native) {
      padding: 0;
      text-align: end;
    }

    :deep(.q-field__marginal) {
      height: 36px;
    }
  }

  &__option {
    padding: 0;
    min-height: auto;
    border-radius: 4px;

    &:hover,
    &--selected {
      background-color: #e3f2fd;
      opacity: 100%;
    }
  }

  // More specific override for this component's dropdown
  :global(.attendance-banner__dropdown .q-item:hover) {
    background-color: #e3f2fd !important;
    color: #1976d2 !important;
  }

  :global(.attendance-banner__dropdown .q-item.q-item--active) {
    background-color: #bbdefb !important;
    color: #1976d2 !important;
  }

  :global(.attendance-banner__dropdown .q-item::before) {
    display: none !important;
  }

  :global(.attendance-banner__dropdown .q-item .q-focus-helper) {
    display: none !important;
    opacity: 0 !important;
  }

  &__option-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 10px;
  }

  &__option-name {
    font-weight: 500;
    font-size: 16px;
    line-height: 1.75em;
    color: $grey-8;
    text-align: center;
  }

  &__option-mobile {
    font-weight: 500;
    font-size: 14px;
    line-height: 1.57em;
    color: $grey-6;
    text-align: center;
  }

  &__loading {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    font-weight: 500;
    font-size: 14px;
    color: $grey-6;
  }

  &__no-option {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    padding: 8px;
  }

  &__no-option-text {
    width: 100%;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    font-size: 16px;
    line-height: 1.75em;
    color: $grey-6;
  }

  &__add-user-btn {
    width: 100%;
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 12px;
    background-color: #e3f2fd;
    border: 1px solid #bbdefb;
    border-radius: 8px;
    color: $primary;
    font-weight: 500;
    font-size: 16px;
    line-height: 1.75em;
  }

  &__no-option-warning {
    width: 100%;
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    padding: 10px;
    background-color: #fffde7;
    border-radius: 8px;
    font-weight: 500;
    font-size: 16px;
    line-height: 1.75em;
    color: #f57f17;
  }

  &__warning-icon {
    color: #f57f17;
  }
}

:global(.attendance-banner__dropdown) {
  border-radius: 8px !important;
  box-shadow: 0 0 6px 1px rgba(0, 0, 0, 0.1) !important;
  padding: 8px !important;
  margin-top: 12px !important;
  min-width: 380px !important;
  max-height: 250px !important;

  .q-virtual-scroll__content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
