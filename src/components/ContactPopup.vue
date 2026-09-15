<template>
  <div class="contact-popup">
    <div class="row">
      <div class="contact-popup__main-section" :class="userData?.id ? 'col-6' : 'col-12'">
        <div class="contact-popup__identification contact-popup__box">
          <div class="contact-popup__identification-user">
            <div class="contact-popup__identification-username">
              {{ userData?.id ? `${genderLabel} ${userData?.fullName}` : userData?.number }}
            </div>
            <div v-if="userData?.isVip" class="contact-popup__identification-vip-badge">VIP</div>
          </div>
          <div>
            <div class="contact-popup__identification-location">
              <div>
                {{
                  userData?.id
                    ? `${userData?.province}${userData?.city ? `,${userData?.city}` : ''}`
                    : 'نامشخص'
                }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="userData?.id" class="contact-popup__advisor-section col-6">
        <div class="contact-popup__box">
          <div class="contact-popup__advisor" :class="{ 'contact-popup__advisor--mine': isMine }">
            <div>
              <span class="contact-popup__advisor-title">مشاور:</span>
              <span class="contact-popup__advisor-name">{{ userData?.advisor || 'نامشخص' }}</span>
              <span v-if="userData?.advisorNumber" class="contact-popup__advisor-internal">
                {{ userData?.advisorNumber }}
              </span>
            </div>
          </div>
          <div class="contact-popup__advisor">
            <div>
              <span class="contact-popup__advisor-title">مشاور اتاق مشاوره:</span>
              <span class="contact-popup__advisor-name">
                {{ userData?.roomAdvisor || 'نامشخص' }}
              </span>
              <span v-if="userData?.roomAdvisorNumber" class="contact-popup__advisor-internal">
                {{ userData?.roomAdvisorNumber }}
              </span>
            </div>
          </div>
          <div class="contact-popup__advisor">
            <div>
              <span class="contact-popup__advisor-title">مشاور نوبت‌دهی:</span>
              <span class="contact-popup__advisor-name">
                {{ userData?.bookingAdvisor || 'نامشخص' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="contact-popup__actions">
      <div class="row q-gutter-md">
        <div class="col-auto">
          <QBtn
            class="contact-popup__actions-button contact-popup__actions-button--close"
            color="negative"
            outline
            @click="closeModal"
          >
            <TablerIconX class="contact-popup__actions-icon" />
            <span class="contact-popup__actions-text">بستن</span>
          </QBtn>
        </div>
        <div class="col">
          <QBtn
            v-if="userData?.id"
            class="contact-popup__actions-button contact-popup__actions-button--profile"
            color="primary"
            :outline="!isMine"
            @click="showUserDetailsModal"
          >
            مشاهده پروفایل کاربر
          </QBtn>
          <QBtn
            v-else
            class="contact-popup__actions-button contact-popup__actions-button--add"
            color="primary"
            @click="showUserFormModal"
          >
            <TablerIconPlus class="contact-popup__actions-icon" />
            <span class="contact-popup__actions-text">افزودن کاربر</span>
          </QBtn>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { IconX as TablerIconX, IconPlus as TablerIconPlus } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/user'

const props = defineProps({
  callData: { type: Object, required: true },
})

const emits = defineEmits(['close', 'open-user-form', 'open-user-details'])

const userStore = useUserStore()
const { userData: currentUser } = storeToRefs(userStore)

const userData = computed(() => props.callData?.data)
const isMine = computed(() => userData.value?.advisorId === currentUser.value?.user?.id)
const genderLabel = computed(() =>
  userData.value?.gender ? (userData.value?.gender === 'male' ? 'آقای' : 'خانم') : ''
)
const closeModal = () => {
  emits('close')
}

const showUserFormModal = () => {
  emits('open-user-form')
}

const showUserDetailsModal = () => {
  emits('open-user-details')
}
</script>
<style scoped lang="scss">
.contact-popup {
  &__main-section {
    padding-right: 8px;
  }

  &__advisor-section {
    padding-left: 8px;
  }

  &__box {
    padding: 4px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
  }

  &__identification {
    background-color: $white;
    width: 100%;
    border-radius: 4px;
    font-weight: bold;

    &-user {
      display: flex;
      flex-direction: column;
    }

    &-username {
      font-weight: 600;
      font-size: 14px;
      color: $grey-9;
    }

    &-location {
      font-weight: normal;
      color: $grey-6;
    }

    &-vip-badge {
      background-color: $warning;
      border-radius: 6px;
      color: $white;
      font-weight: bold;
      font-size: 12px;
      width: min-content;
      padding: 2px 10px 0;
      margin-top: 4px;
    }
  }

  &__advisor {
    background-color: $white;
    width: 100%;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &-title {
      color: $grey-6;
    }

    &-name,
    &-internal {
      font-weight: 600;
      font-size: 14px;
      color: $grey-8;
      margin-right: 4px;
    }

    &--mine {
      .contact-popup__advisor-title {
        color: $positive;
      }

      .contact-popup__advisor-name,
      .contact-popup__advisor-internal {
        color: $positive;
      }
    }
  }

  &__actions {
    margin-top: 12px;

    &-button {
      height: 40px;
      width: 100%;
      font-weight: 700;
      border-radius: 20px;

      &--close {
        // Specific styles for close button if needed
      }

      &--profile {
        // Specific styles for profile button if needed
      }

      &--add {
        // Specific styles for add button if needed
      }
    }

    &-icon {
      width: 20px;
      height: 20px;
    }

    &-text {
      margin-right: 8px;
    }
  }
}
</style>
