<template>
  <QCard flat class="ps-card">
    <div class="row items-baseline">
      <div class="col-8 q-px-md">
        <h5>تنظیمات شخصی</h5>
      </div>
      <div class="col-1">
        <QBtn v-if="showSettingActions" color="primary" outline fab-mini @click="updateSetting">
          <IconRefresh size="18px" />
        </QBtn>
      </div>
      <div v-if="getPerms('setting', 'update', true, 'personalSetting')" class="col-3 p-0">
        <QBtn
          v-if="showSettingActions"
          :loading="isPending"
          color="primary"
          label="ذخیره تنظیمات"
          unelevated
          @click="saveSetting"
        />
      </div>
    </div>

    <div class="relative-position">
      <QTabs v-model="tab" active-color="primary" align="start">
        <QTab label="اعلان ها" name="notifications" />
        <QTab label="تغییر رمز عبور" name="change_password" />
      </QTabs>

      <QSeparator color="primary" />

      <QTabPanels v-model="tab" animated keep-alive>
        <QTabPanel name="notifications">
          <QForm @submit.prevent="saveSetting">
            <div class="row">
              <div class="col-md-6">
                <QToggle
                  class="text-subtitle2"
                  label="نمایش اعلان ها"
                  left-label
                  :false-value="false"
                  :true-value="true"
                  :model-value="personalSettingData?.showNotification"
                  @update:model-value="(e) => handleChange('showNotification', e)"
                />
              </div>
              <div class="col-md-6">
                <QToggle
                  class="text-subtitle2"
                  label="پخش صدای اعلان ها"
                  left-label
                  :false-value="false"
                  :true-value="true"
                  :model-value="personalSettingData?.notificationSound"
                  @update:model-value="(e) => handleChange('notificationSound', e)"
                />
              </div>
            </div>
          </QForm>
        </QTabPanel>
        <QTabPanel name="change_password">
          <ResetPasswordCard />
        </QTabPanel>
      </QTabPanels>

      <QInnerLoading :showing="isLoading">
        <QSpinnerTail color="primary" size="2em" />
      </QInnerLoading>
    </div>
  </QCard>
</template>

<script setup>
import { object, boolean } from 'yup'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPerms } from '@/utils/get-perms'
import { useApiGetPersonalSetting, useSetPersonalSettingMutation } from '@/modules/Settings/query'
import { useQueryClient } from '@tanstack/vue-query'
import ResetPasswordCard from '../components/ResetPassword/ResetPasswordCard/ResetPasswordCard'
import { IconRefresh } from '@tabler/icons-vue'
import useYup from '@/composables/use-yup'
import { Notif } from '@/data/services/notification-service'

const route = useRoute()
const router = useRouter()
const PERSONAL_SETTING_NOTIFICATION_KEY = 'notification'
const queryClient = useQueryClient()
const tab = ref(route.query.tab || 'notifications')
const updatePersonalData = ref(null)

watch(tab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } })
})

const { data, isLoading } = useApiGetPersonalSetting(PERSONAL_SETTING_NOTIFICATION_KEY)
const initialData = computed(() => data.value?.setting)
const personalSettingData = computed(() => updatePersonalData.value || initialData.value || [])

const validationSchema = object().shape({
  showNotification: boolean(),
  notificationSound: boolean(),
})
const { validate, validateAt } = useYup(validationSchema)
const handleChange = (field, value) => {
  updatePersonalData.value = { ...personalSettingData.value, [field]: value }
  validateAt(field, value)
}

const updateSetting = async () => {
  await queryClient.invalidateQueries({ queryKey: ['personal-setting'] })
}

const showSettingActions = computed(() => {
  return tab.value !== 'change_password'
})

const { mutate: savePersonalSetting, isPending } = useSetPersonalSettingMutation()
const saveSetting = async () => {
  const { isValid, payload } = await validate(personalSettingData.value)
  if (!isValid) return
  savePersonalSetting(
    { key: PERSONAL_SETTING_NOTIFICATION_KEY, ...payload },
    {
      onSuccess: (response) => {
        updateSetting()
        Notif.success(response.message)
      },
    }
  )
}
</script>

<style scoped lang="scss">
.ps-card {
  width: 50dvw;
  padding: 1rem;
  margin: 1rem auto;
}
</style>
