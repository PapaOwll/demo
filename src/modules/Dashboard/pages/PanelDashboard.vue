<template>
  <div class="panel-dashboard">
    <div class="panel-dashboard__welcome">
      <div class="panel-dashboard__welcome-content">
        <h1 class="panel-dashboard__welcome-title">
          سلام
          {{ userData?.user?.firstName || userData?.user?.name }} خوش اومدی
        </h1>
        <p class="panel-dashboard__welcome-subtitle">
          {{ userData?.clinic?.name }} - {{ userData?.branch?.name }}
        </p>
      </div>
      <div class="panel-dashboard__welcome-role">
        <QChip color="primary" text-color="white" icon="badge">
          {{ userData?.role?.faTitle }}
        </QChip>
      </div>
    </div>

    <!-- Modules Grid -->
    <DashboardModulesGrid v-if="false" :loading="isLoading" :modules="filteredModules" />

    <!-- Menu Hint -->
    <!--    <div class="panel-dashboard__hint">-->
    <!--      <p class="panel-dashboard__hint-text">برای دسترسی به صفحات از منوی کناری استفاده کنید</p>-->
    <!--    </div>-->
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import DashboardModulesGrid from '../components/DashboardModulesGrid'

const router = useRouter()
const userStore = useUserStore()
const { userData, isLoading } = storeToRefs(userStore)

const hasRoute = (name) => {
  try {
    const resolved = router.resolve({ name })
    return resolved.matched.length > 0
  } catch {
    return false
  }
}

const filteredModules = computed(
  () =>
    userData?.value?.role?.modules
      ?.filter((module) => !module.hidden)
      .filter((module) => module.subModules?.length > 0 || hasRoute(module.key))
      .map((module) => {
        // Special case: dashboard should link to report-dashboard
        if (module.key === 'dashboard') {
          return {
            ...module,
            title: 'گزارش کلی',
            routePath: '/report-dashboard',
            subModules: module.subModules?.filter((sub) => sub.status !== 2 && !sub.hidden),
          }
        }
        return {
          ...module,
          routePath: null,
          subModules: module.subModules?.filter((sub) => sub.status !== 2 && !sub.hidden),
        }
      }) || []
)
</script>

<style lang="scss" scoped>
@use 'sass:color';

.panel-dashboard {
  &__welcome {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: linear-gradient(135deg, $primary 0%, color.adjust($primary, $lightness: 15%) 100%);
    border-radius: 12px;
    color: $white;
  }

  &__welcome-content {
    flex: 1;
  }

  &__welcome-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  &__welcome-subtitle {
    font-size: 0.875rem;
    margin: 0;
    opacity: 0.9;
  }

  &__welcome-role {
    :deep(.q-chip) {
      background-color: rgba(255, 255, 255, 0.2) !important;
    }
  }

  &__hint {
    margin-top: 2rem;
    text-align: center;
  }

  &__hint-text {
    font-size: 1rem;
    color: $grey-6;
    margin: 0;
  }
}
</style>
