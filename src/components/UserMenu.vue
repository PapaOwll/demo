<template>
  <QBtn
    flat
    class="user-menu-button"
    @click="toggleMenu"
    @mouseenter="openMenu"
    @mouseleave="scheduleCloseMenu"
  >
    <div class="user-menu-button__content">
      <div v-if="inCompletedDocuments" class="user-menu-button__incomplete-docs">
        <QBtn color="warning" outline round size="sm" icon="warning" @click.stop="openUserDetails">
          <QTooltip>کاربر دارای ناقصی مدارک می باشد</QTooltip>
        </QBtn>
      </div>

      <div class="user-menu-button__fullName-and-phone" @click.stop="openUserDetails">
        <div v-if="propData?.name || propData?.firstName" class="user-menu-button__ellipsis">
          {{ genderType }} {{ propData?.firstName }} {{ propData?.name }}
        </div>

        <div class="user-menu-button__mobile letter-space-number">
          {{ propData?.mobile }}
        </div>
      </div>
      <div class="user-menu-button__icons">
        <IconVip v-if="propData?.vipType" :style="{ color: vipIconColor }" />
        <IconRoad v-if="propData?.isPassenger && propData?.city" class="text-grey-6" />
        <QTooltip
          v-if="propData?.isPassenger && propData?.city"
          class="text-white bg-black text-caption"
        >
          مسافر از شهر {{ propData?.city?.name }}
        </QTooltip>
        <IconRoad v-else-if="propData?.isPassenger" class="text-grey-6" />
        <slot name="extra-icons" />
      </div>
    </div>

    <QMenu
      v-model="menuVisible"
      anchor="bottom left"
      self="bottom right"
      :offset="[10, 0]"
      class="user-menu__dropdown"
      fit
      no-focus
      @mouseenter="cancelCloseMenu"
      @mouseleave="scheduleCloseMenu"
    >
      <QList>
        <template v-for="(item, index) in userMenuItems" :key="index">
          <QSeparator v-if="item.isSeparate && index > 0" />
          <QItem
            v-if="item.condition"
            v-close-popup
            clickable
            class="user-menu__item"
            @click="item.function"
          >
            <QItemSection>
              <QItemLabel>{{ item.title }}</QItemLabel>
            </QItemSection>
          </QItem>
        </template>
      </QList>
    </QMenu>
  </QBtn>

  <UserRoleForm
    :visible="userRoleFormVisible"
    :edit-value="userData"
    @close="closeUserRoleFormDialog"
    @after-submit="afterSubmitRoleForm"
  />

  <UserDetails
    v-if="userDetailsVisible"
    :visible="userDetailsVisible"
    :user-id="userData?.userId"
    @close="closeUserDetails"
    @update-table="() => emits('updateTable')"
  />

  <TaskForm
    v-if="taskFormVisible"
    :visible="taskFormVisible"
    :edit-value="userData"
    @close="closeTaskForm"
    @submitted="afterSubmitTaskForm"
  />

  <ContactForm
    v-if="contactFormVisible"
    :visible="contactFormVisible"
    :edit-value="userData"
    @close="closeContactForm"
    @submitted="afterSubmitContactForm"
  />

  <BookingForm
    v-if="bookingFormVisible"
    :visible="bookingFormVisible"
    :user-id="userData?.user_id"
    :edit-value="userData"
    @close="closeBookingForm"
    @after-submit="closeBookingForm"
  />

  <SendInformation
    v-if="sendInfoFormVisible"
    :visible="sendInfoFormVisible"
    :edit-value="sendInfoData"
    @close-form="closeSendInfoForm"
  />

  <UserOpgRequestDialog
    v-if="opgDialogVisible"
    :visible="opgDialogVisible"
    :user-data="userData"
    @close="closeOpgDialog"
  />
</template>

<script setup>
import UserDetails from '@/modules/User/components/UserDetails/UserDetails'
import TaskForm from '@/modules/Task/components/TaskForm'
import ContactForm from '@/modules/Contact/components/ContactForm'
import BookingForm from '@/modules/Booking/components/BookingForm'
import { getPerms } from '@/utils/get-perms'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import SendInformation from '@/components/SendInformation'
import { IconVip, IconRoad } from '@tabler/icons-vue'
import { camelize } from '@/utils/convert-to-camel-snake'
import {
  useBatchUpdateMutation,
  useChangeUserLevelMutation,
  useLoginImpersonate,
  useImpersonateMyTooth,
} from '@/modules/User/query'
import { useUserStore } from '@/store/user'
import { getPervAccessToken } from '@/utils/auth'
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { handleError } from '@/utils/error-handler'
import UserRoleForm from '@/modules/User/components/UserRoleForm'
import useDisclosure from '@/composables/use-disclosure'
import UserOpgRequestDialog from '@/modules/User/components/UserDetails/UserOpgRequestDialog'

const emits = defineEmits(['updateTable', 'close'])
const props = defineProps(['user'])

const userStore = useUserStore()
const { userId } = storeToRefs(userStore)
const { impersonateUser } = userStore

const menuVisible = ref(false)
const sendInfoData = ref(null)
const userData = ref(null)
const propData = ref(null)
const inPersonVisit = ref(1)
const onlineVisit = ref(2)
const closeMenuTimeout = ref(null)
const openMenuTimeout = ref(null)

const [sendInfoFormVisible, { toggle: toggleInfoDialog }] = useDisclosure()
const [userRoleFormVisible, { toggle: toggleRoleDialog }] = useDisclosure()
const [userDetailsVisible, { toggle: toggleDetailsDialog }] = useDisclosure()
const [contactFormVisible, { toggle: toggleContactDialog }] = useDisclosure()
const [bookingFormVisible, { toggle: toggleBookingDialog }] = useDisclosure()
const [taskFormVisible, { toggle: toggleTaskDialog }] = useDisclosure()
const [opgDialogVisible, { toggle: toggleOpgDialog }] = useDisclosure()

const { mutate: impersonateLoginMutation } = useLoginImpersonate()
const { mutate: impersonateMyToothMutation } = useImpersonateMyTooth()
const { mutate: cancelUserAdvisor } = useBatchUpdateMutation()
const { mutate: changeLevel } = useChangeUserLevelMutation()
const isVipUser = computed(() => {
  return propData.value?.isVip ? 'تبدیل به کاربر عادی' : 'تبدیل به کاربر VIP'
})
const genderType = computed(() =>
  propData.value?.gender === 'male' ? 'آقای' : propData.value?.gender === 'female' ? 'خانم' : ''
)
const inCompletedDocuments = computed(() => propData.value?.isIncomplete)
const isPermittedToLoginAs = computed(() => {
  return (
    getPerms('user', 'view', true, 'impersonate') &&
    propData.value?.role &&
    propData.value?.role?.id !== 6 &&
    userId.value !== propData.value?.id &&
    !getPervAccessToken()
  )
})

// const openUserRoleForm = () => {
//   userData.value = propData.value
//   toggleRoleDialog()
// }
const closeUserRoleFormDialog = () => {
  toggleRoleDialog()
}
const afterSubmitRoleForm = () => {
  toggleRoleDialog()
  emits('updateTable')
}

const openUserDetails = () => {
  userData.value = {
    userId: propData.value?.id,
  }
  toggleDetailsDialog()
}
const closeUserDetails = () => {
  toggleDetailsDialog()
}

const openBookingForm = () => {
  userData.value = {
    user: propData.value,
    user_id: propData.value?.id,
    type: 2,
  }
  toggleBookingDialog()
}
const closeBookingForm = () => {
  toggleBookingDialog()
}
const openVisitForm = (visitType) => {
  userData.value = {
    user: propData.value,
    advisor: props.user?.advisor,
    user_id: propData.value?.id,
    type: 1,
    visitType,
  }
  toggleBookingDialog()
}

const openTaskForm = () => {
  userData.value = { user: propData.value }
  toggleTaskDialog()
}
const closeTaskForm = () => {
  userData.value = null
  toggleTaskDialog()
}
const afterSubmitTaskForm = () => {
  toggleTaskDialog()
  emits('updateTable')
}

const openContactForm = () => {
  userData.value = { user: propData.value }
  toggleContactDialog()
}
const closeContactForm = () => {
  userData.value = null
  toggleContactDialog()
}
const afterSubmitContactForm = () => {
  userData.value = null
  toggleContactDialog()
  emits('updateTable')
}

const cancelAdvisor = (data) => {
  confirmDialog(
    'تایید عملیات',
    'آیا از لغو مشاوره این کاربر مطمئنید؟',
    () => {
      cancelUserAdvisor(
        { cancel_advise: true, users: [data] },
        {
          onSuccess: (response) => {
            Notif.success(response.message)
            emits('updateTable')
          },
          onError: (error) => {
            handleError(error)
          },
        }
      )
    },
    {
      ok: {
        label: 'لغو مشاوره',
        color: 'negative',
      },
    }
  )
}

const openSendInfoForm = () => {
  sendInfoData.value = propData.value
  toggleInfoDialog()
}
const closeSendInfoForm = () => {
  toggleInfoDialog()
}

const openOpgDialog = () => {
  userData.value = propData.value
  toggleOpgDialog()
}
const closeOpgDialog = () => {
  userData.value = null
  toggleOpgDialog()
}
const changeUserLevel = (user, isVip) => {
  confirmDialog(
    'سطح کاربر',
    isVip ? `تبدیل کاربر ${user?.name} به کاربر عادی؟` : `تبدیل کاربر ${user?.name} به کاربر VIP ؟`,
    () => {
      changeLevel(
        { id: user?.id, isVip: isVip ? 0 : 1 },
        {
          onSuccess: (response) => {
            Notif.success(response.message)
            emits('updateTable')
          },
          onError: (error) => {
            handleError(error)
          },
        }
      )
    },
    {
      ok: {
        label: 'تایید',
        color: 'primary',
      },
    }
  )
}

const loginAs = () => {
  impersonateLoginMutation(
    { userId: propData.value.id },
    {
      onSuccess: (result) => {
        impersonateUser(result?.data?.token)
      },
    }
  )
}

const loginAsMyTooth = () => {
  impersonateMyToothMutation(
    { mobile: propData.value.mobile },
    {
      onSuccess: (result) => {
        const token = result?.data?.token
        const myTeethUrl = import.meta.env.VITE_MY_TEETH_URL || '/my-teeth'
        window.open(`${myTeethUrl}/auth/impersonate?token=${token}`, '_blank')
      },
      onError: (error) => {
        handleError(error)
      },
    }
  )
}

const toggleMenu = () => {
  if (openMenuTimeout.value) {
    clearTimeout(openMenuTimeout.value)
    openMenuTimeout.value = null
  }
  if (closeMenuTimeout.value) {
    clearTimeout(closeMenuTimeout.value)
    closeMenuTimeout.value = null
  }
  menuVisible.value = !menuVisible.value
}

const openMenu = () => {
  if (closeMenuTimeout.value) {
    clearTimeout(closeMenuTimeout.value)
    closeMenuTimeout.value = null
  }
  if (openMenuTimeout.value) {
    clearTimeout(openMenuTimeout.value)
    openMenuTimeout.value = null
  }
  openMenuTimeout.value = setTimeout(() => {
    menuVisible.value = true
    openMenuTimeout.value = null
  }, 500)
}

const scheduleCloseMenu = () => {
  if (openMenuTimeout.value) {
    clearTimeout(openMenuTimeout.value)
    openMenuTimeout.value = null
  }

  closeMenuTimeout.value = setTimeout(() => {
    menuVisible.value = false
    closeMenuTimeout.value = null
  }, 300)
}

const cancelCloseMenu = () => {
  if (closeMenuTimeout.value) {
    clearTimeout(closeMenuTimeout.value)
    closeMenuTimeout.value = null
  }
  if (openMenuTimeout.value) {
    clearTimeout(openMenuTimeout.value)
    openMenuTimeout.value = null
  }
}

const userMenuItems = computed(() => [
  {
    title: 'لغو مشاوره',
    condition: propData.value?.advisor?.id && getPerms('user', 'update'),
    function: cancelAdvisor,
  },
  // {
  //   title: 'ویرایش نقش',
  //   condition: getPerms('user', 'update'),
  //   function: openUserRoleForm,
  // },
  {
    title: isVipUser.value,
    condition: getPerms('user', 'update'),
    function: () => changeUserLevel(propData.value, propData.value?.isVip),
  },
  {
    title: 'افزودن نوبت انجام کار',
    condition: getPerms('booking', 'add'),
    function: openBookingForm,
    isSeparate: true,
  },
  {
    title: 'افزودن ویزیت آنلاین',
    condition: getPerms('visit', 'add'),
    function: () => openVisitForm(onlineVisit.value),
  },
  {
    title: 'افزودن ویزیت حضوری',
    condition: getPerms('visit', 'add'),
    function: () => openVisitForm(inPersonVisit.value),
  },
  {
    title: 'افزودن وظیفه',
    condition: getPerms('task', 'add'),
    function: openTaskForm,
  },
  {
    title: 'افزودن تماس',
    condition: getPerms('contact', 'add'),
    function: openContactForm,
  },
  {
    title: `ورود به عنوان ${propData.value?.firstName || ''} ${propData.value?.name}`,
    condition: isPermittedToLoginAs.value,
    function: loginAs,
    isSeparate: true,
  },
  {
    title: 'ورود به دندان من کاربر',
    condition: getPerms('user', 'update'),
    function: loginAsMyTooth,
  },
  {
    title: 'ثبت درخواست OPG',
    condition: true,
    function: openOpgDialog,
    isSeparate: true,
  },
  {
    title: 'ارسال مشخصات کلینیک',
    condition: true,
    function: openSendInfoForm,
  },
])

watch(
  () => props.user,
  (value) => {
    propData.value = value?.user ? camelize(value.user) : camelize(value ?? {})
  }
)

onMounted(() => {
  propData.value = props.user?.user ? camelize(props.user.user) : camelize(props.user ?? {})
})

onUnmounted(() => {
  // Clear any pending timeouts when component is unmounted
  if (openMenuTimeout.value) {
    clearTimeout(openMenuTimeout.value)
    openMenuTimeout.value = null
  }
  if (closeMenuTimeout.value) {
    clearTimeout(closeMenuTimeout.value)
    closeMenuTimeout.value = null
  }
})

const vipIconColor = computed(() => (propData.value?.vipType === 1 ? '#9d9d9d' : '#FFCC00'))
</script>

<style scoped lang="scss">
.user-menu-button {
  padding: 10px 0 10px 10px;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  text-align: right;
  background: none;
  font-weight: 500;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  border: none;
  height: 100%;
  width: 100%;
  gap: 15px;

  &__incomplete-docs {
    background-color: rgba($warning, 0.1);
    border-radius: 4px;
    padding: 4px;
  }

  &__fullName-and-phone {
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    overflow: hidden;
    font-size: 18px;
    display: flex;
    width: 100%;
    min-width: 150px;
    gap: 5px;
    cursor: pointer;
    padding: 0 8px;
    min-height: 50px;

    &:hover {
      color: $primary;
    }
  }

  &__mobile {
    color: $grey-6;
    font-size: 16px;
    font-weight: 500;
  }

  &__content {
    justify-content: flex-start;
    align-items: center;
    display: flex;
    width: 100%;
    gap: 10px;
  }

  &__icons {
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    display: flex;
    gap: 5px;
  }

  &__ellipsis {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
}

.user-menu {
  &__dropdown {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    max-height: 80vh;
    overflow-y: auto;
  }

  &__item {
    padding: 12px 16px;
    font-size: 14px;
    color: $grey-8;

    &:hover {
      background-color: $grey-2;
      color: $primary;
    }
  }
}

.letter-space-number {
  letter-spacing: 1px;
}
</style>
