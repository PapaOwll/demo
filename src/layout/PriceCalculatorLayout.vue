<template>
  <QHeader class="q-pa-sm bg-white flex">
    <div class="col-6 flex items-center">
      <div class="q-ml-sm">
        <img id="header-logo" :src="logoImage" width="40" height="40" />
      </div>
      <div class="text-weight-bold q-ml-sm">پنل تعیین قیمت</div>
    </div>
    <div
      v-if="!route.query.key && route.query.mode !== 'preview'"
      class="col-6 flex items-center justify-end q-px-sm"
    >
      <QBtn
        color="warning"
        outline
        @click="router.push({ path: '/treatment-plan/price-calculator' })"
      >
        شروع مجدد
      </QBtn>
      <QBtn
        color="primary"
        outline
        @click="router.push({ path: '/treatment-plan/treatment-plan-list' })"
      >
        بازگشت
      </QBtn>
    </div>
  </QHeader>

  <QPageContainer id="content" class="main-container">
    <OfflineWrapper>
      <RouterView />
    </OfflineWrapper>
  </QPageContainer>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getThemeSetting } from '@/utils/theme-setting'
import OfflineWrapper from '@/components/OfflineWrapper'

const logoImage = ref('')
const router = useRouter()
const route = useRoute()

onMounted(() => {
  logoImage.value =
    getThemeSetting()?.logo || 'https://api.cdn.sitracrm.ir/franchise/_logo/default/app-icon.png'
})
</script>

<style scoped lang="scss">
.main-container {
  max-height: 100vh;
  background-color: #eeeeee;
  display: flex;
  align-items: center;
}

* {
  overflow: hidden;
}

@media only screen and (max-width: 600px) {
  .app-container {
    padding: 1rem !important;
    max-width: 100%;
    min-width: 100%;
  }
}

.el-page-header__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  line-height: 24px;
  direction: ltr;
}

#content {
  overflow-y: scroll;
}

#content::-webkit-scrollbar {
  display: none;
}

#content {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}
</style>
