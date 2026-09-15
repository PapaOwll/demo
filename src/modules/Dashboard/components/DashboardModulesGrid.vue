<template>
  <div class="modules-grid">
    <!-- Loading Skeletons -->
    <template v-if="loading">
      <div v-for="index in 8" :key="`skeleton-${index}`" class="modules-grid__card-skeleton">
        <QCard class="modules-grid__card">
          <QCardSection class="modules-grid__card-content">
            <QSkeleton type="rect" width="56px" height="56px" class="modules-grid__skeleton-icon" />
            <div class="modules-grid__card-text">
              <QSkeleton type="text" width="80px" height="20px" />
              <QSkeleton type="text" width="140px" height="16px" class="q-mt-sm" />
            </div>
          </QCardSection>
        </QCard>
      </div>
    </template>

    <!-- Loaded Modules -->
    <template v-else>
      <!-- Simple Modules (without submenus) -->
      <RouterLink
        v-for="item in simpleModules"
        :key="item.id"
        :to="item.routePath || { name: item.key }"
        class="modules-grid__card-link"
      >
        <QCard class="modules-grid__card">
          <QCardSection class="modules-grid__card-content">
            <span
              :class="['modules-grid__icon', `modules-grid__icon--${getColorByIndex(item.id)}`]"
            >
              <component
                :is="menuIconComponents[item.icon]"
                v-if="menuIconComponents[item.icon]"
                :size="32"
              />
              <QIcon v-else name="apps" size="32px" />
            </span>
            <div class="modules-grid__card-text">
              <h3 class="modules-grid__card-title">{{ item.title }}</h3>
              <p v-if="item.description" class="modules-grid__card-description">
                {{ item.description }}
              </p>
            </div>
          </QCardSection>
        </QCard>
      </RouterLink>

      <!-- Modules with Submenus -->
      <div
        v-for="item in modulesWithSubmenu"
        :key="item.id"
        class="modules-grid__card-link modules-grid__card-link--expandable"
      >
        <QCard class="modules-grid__card modules-grid__card--has-submenu">
          <QCardSection class="modules-grid__card-content">
            <span
              :class="['modules-grid__icon', `modules-grid__icon--${getColorByIndex(item.id)}`]"
            >
              <component
                :is="menuIconComponents[item.icon]"
                v-if="menuIconComponents[item.icon]"
                :size="32"
              />
              <QIcon v-else name="apps" size="32px" />
            </span>
            <div class="modules-grid__card-text">
              <h3 class="modules-grid__card-title">{{ item.title }}</h3>
              <p v-if="item.description" class="modules-grid__card-description">
                {{ item.description }}
              </p>
            </div>
          </QCardSection>
          <QSeparator />
          <QCardSection class="modules-grid__submenu">
            <RouterLink
              v-for="sub in item.subModules"
              :key="sub.key"
              :to="`/${item.key}/${sub.key}`"
              class="modules-grid__submenu-item"
            >
              {{ sub.title }}
            </RouterLink>
          </QCardSection>
        </QCard>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { createAsyncIconComponent } from '@/utils/icon-loader'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  modules: {
    type: Array,
    default: () => [],
  },
})

const simpleModules = computed(() => props.modules.filter((module) => !module.subModules?.length))

const modulesWithSubmenu = computed(() =>
  props.modules.filter((module) => module.subModules?.length > 0)
)

const menuIconComponents = computed(() => {
  const icons = {}
  if (!Array.isArray(props.modules)) return icons
  props.modules.forEach((item) => {
    if (item?.icon && !icons[item.icon]) {
      icons[item.icon] = createAsyncIconComponent(item.icon)
    }
  })
  return icons
})

const colors = ['primary', 'success', 'info', 'warning', 'purple', 'cyan', 'pink', 'teal']

const getColorByIndex = (id) => {
  return colors[id % colors.length]
}
</script>

<style lang="scss" scoped>
@use 'sass:color';

.modules-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  perspective: 1000px;
  margin-top: 2rem;

  @media (max-width: $breakpoint-lg) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: $breakpoint-md) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: $breakpoint-sm) {
    grid-template-columns: 1fr;
  }

  &__card-link {
    text-decoration: none;
    display: block;
    height: 100%;
  }

  &__card-skeleton {
    min-height: 140px;
  }

  &__card {
    --accent-color: #{$primary};
    --accent-light: #{rgba($primary, 0.1)};

    height: 100%;
    border-radius: 24px;
    background: $white;
    overflow: hidden;
    position: relative;
    transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.04);

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, var(--accent-light) 0%, transparent 60%);
      opacity: 0;
      transition: opacity 0.5s ease;
      pointer-events: none;
    }

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--accent-color), color.adjust($info, $lightness: 10%));
      transform: scaleX(0);
      transform-origin: right;
      transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1);
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow:
        0 24px 48px rgba(0, 0, 0, 0.12),
        0 12px 24px rgba(0, 0, 0, 0.08);
      border-color: transparent;

      &::before {
        opacity: 1;
      }

      &::after {
        transform: scaleX(1);
        transform-origin: left;
      }
    }

    &--has-submenu {
      &::after {
        transform: scaleX(1);
      }

      &:hover {
        transform: translateY(-4px);
        box-shadow:
          0 8px 24px rgba(0, 0, 0, 0.08),
          0 4px 12px rgba(0, 0, 0, 0.04);
      }
    }
  }

  &__card-content {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1.5rem;
    position: relative;
    z-index: 1;
  }

  &__skeleton-icon {
    border-radius: 18px;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 18px;
    color: $white;
    flex-shrink: 0;
    position: relative;
    transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
    z-index: 2;

    &::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 22px;
      background: inherit;
      opacity: 0.3;
      filter: blur(8px);
      z-index: -1;
      transition: all 0.5s ease;
    }

    .modules-grid__card:hover & {
      transform: scale(1.15) rotate(-8deg);

      &::before {
        inset: -8px;
        opacity: 0.5;
        filter: blur(12px);
      }
    }

    &--primary {
      background: $primary;
    }

    &--success {
      background: $green;
    }

    &--info {
      background: $info;
    }

    &--warning {
      background: $warning;
    }

    &--purple {
      background: $purple-6;
    }

    &--cyan {
      background: $cyan-6;
    }

    &--pink {
      background: $pink-6;
    }

    &--teal {
      background: $teal-6;
    }
  }

  &__card-text {
    flex: 1;
    min-width: 0;
    position: relative;
    z-index: 1;
  }

  &__card-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: $grey-9;
    margin: 0;
    transition: all 0.4s ease;
    position: relative;
    display: inline-block;

    .modules-grid__card:hover & {
      color: var(--accent-color);
      transform: translateX(-4px);
    }
  }

  &__card-description {
    font-size: 0.8125rem;
    color: $grey-6;
    margin: 0.5rem 0 0 0;
    line-height: 1.6;
    transition: color 0.3s ease;

    .modules-grid__card:hover & {
      color: $grey-7;
    }
  }

  &__submenu {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem 1.5rem;
    background: $grey-1;
    border-top: 1px solid $grey-2;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      right: 1.5rem;
      left: 1.5rem;
      height: 1px;
      background: linear-gradient(90deg, transparent, $grey-3, transparent);
    }
  }

  &__submenu-item {
    padding: 0.625rem 1.125rem;
    background: $white;
    border: 1px solid $grey-3;
    border-radius: 12px;
    font-size: 0.8125rem;
    font-weight: 500;
    color: $grey-7;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);

    &:hover {
      border-color: $primary;
      background: $primary;
      color: $white;
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba($primary, 0.25);
    }
  }
}
</style>
