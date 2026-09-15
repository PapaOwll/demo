<template>
  <div>
    <div v-if="userId || mode === 'edit'">
      <div class="tpu">
        <QInnerLoading :showing="isLoadingUser" />
        <div class="tpu__top">
          <div class="tpu__user">
            <div>
              <div>
                {{ `${user?.firstName || ''} ${user?.name || ''}` }}
              </div>
              <div>{{ user?.mobile ? `0${user?.mobile}` : '' }}</div>
            </div>
            <div class="tpu__user-icon">
              <IconUser stroke="2" size="30" />
            </div>
          </div>
          <div>
            <QBtn
              v-if="mode === 'create'"
              outline
              color="primary"
              label="تغییر"
              @click="resetUser"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="tpu__select">
        <UserSelectField
          placeholder="انتخاب کاربر"
          label="کاربر"
          :model-value="userId"
          :emit-value="false"
          @update:model-value="onChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserSelectField from '@/components/Form/UserSelectField'
import { useTpProvider } from '../../composables/use-tp-provider'
import { useGetUserById } from '../../query'
import { IconUser } from '@tabler/icons-vue'
import { useTpStatus } from '../../composables/use-tp-status'

const { mode } = useTpStatus()
const treatmentData = useTpProvider('treatmentData')

const route = useRoute()
const router = useRouter()
const userId = ref(route?.query?.['user-id'] || null)

const enabledUser = computed(() => !!userId.value)

const { data: userData, isLoading: isLoadingUser } = useGetUserById(userId, {
  enabled: enabledUser,
})

const user = computed(() => {
  if (userData.value) return userData.value
  if (treatmentData?.value?.user) return treatmentData?.value?.user
  return null
})

const onChange = (value) => {
  const id = value?.rawData?.id || value?.value || value
  userId.value = id
  router.replace({ query: { 'user-id': id } })
}

const resetUser = () => {
  userId.value = null
  router.replace({ query: {} })
}

watch(
  () => route.query['user-id'],
  (newUserId) => {
    if (newUserId !== userId.value) {
      userId.value = newUserId || null
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.tpu {
  position: relative;

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-left: 10px;
    font-size: 0.875rem;

    &-icon {
      width: 48px;
      height: 48px;
      background-color: $grey-1;
      border: 2px solid $grey-3;
      color: $grey-6;
      border-radius: 50%;
      padding: 5px;
      text-align: center;
      margin-left: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__btn {
    text-decoration: none;
    white-space: nowrap;
  }

  &__select {
    display: flex;
    gap: 16px;
    align-items: flex-end;
  }
}
</style>
