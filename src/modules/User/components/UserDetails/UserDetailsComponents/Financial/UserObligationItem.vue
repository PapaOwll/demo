<template>
  <QExpansionItem
    :model-value="expanded"
    class="uol__accordion"
    header-class="uol__accordion-header"
    expand-icon-class="hidden"
    @update:model-value="(val) => (expanded = val)"
  >
    <template #header>
      <div class="uol__obligation-container" style="width: 100%">
        <div class="uol__obligation-brand">
          <div class="uol__brand-icon">
            <IconBeta :size="20" stroke="2" />
          </div>
          <div class="uol__brand-info">
            <div class="uol__brand-amount">
              <span class="value">{{ generatePriceFormat(item?.totalAmount) }}</span>
            </div>
            <div v-if="item.betaUser" class="uol__brand-subtitle">
              بتا({{ item.betaContractType ? item.betaContractType.title : '' }}) - دارنده حساب:
              {{ item.betaUser.first_name ? item.betaUser.firstName : '' }}
              {{ item.betaUser.name ? item.betaUser.name : '' }}
            </div>
          </div>
        </div>

        <div v-if="!expanded" class="uol__obligation-meta-box">
          <div style="display: flex; align-items: center; gap: 32px; text-align: start">
            <div class="uol__meta-col">
              <span class="value">{{ generatePriceFormat(item?.installmentAmount) }}</span>
              <span class="label">مبلغ اقساط</span>
            </div>
            <div class="uol__meta-col">
              <span class="value">
                {{ item.installments?.length ?? 0 }} از
                {{ convertToJalali(item.fromDate, 'jYYYY/jMM/jDD') }}
              </span>
              <span class="label">تعداد اقساط</span>
            </div>
          </div>
          <div class="uol__obligation-side">
            <QChip
              :class="['uol__status-chip', getStatusClass(item.status?.id)]"
              :label="item.status?.title"
              unelevated
            />
          </div>
        </div>

        <div class="uol__header-actions">
          <QBtn
            v-if="expanded && isObligationDeletable"
            flat
            round
            dense
            color="negative"
            class="q-mr-sm"
            @click.stop="emit('delete', item)"
          >
            <IconTrash :size="18" />
          </QBtn>

          <IconChevronDown v-if="!expanded" :size="20" class="uol__expand-arrow" />
        </div>
      </div>
    </template>

    <div class="uol__installment-list">
      <div class="uol__list-title">
        اقساط
        <IconChevronUp :size="14" style="cursor: pointer" @click="expanded = false" />
      </div>

      <div v-for="(inst, index) in item.installments" :key="inst.id" class="uol__inst-row">
        <div class="uol__inst-detail">
          <div class="uol__inst-index">{{ index + 1 }}</div>

          <div class="uol__inst-info">
            <div class="uol__meta-col">
              <span class="value">مبلغ</span>
              <span class="label">{{ generatePriceFormat(inst?.amount) }}</span>
            </div>
            <div class="uol__meta-col">
              <span class="value">تاریخ سررسید</span>
              <span class="label">
                {{ convertToJalali(inst.dueDate, 'jYYYY/jMM/jDD') }}
              </span>
            </div>
          </div>
        </div>

        <div class="uol__inst-status">
          <QChip
            :class="[
              'uol__status-chip',
              isInstallmentStatusLocked(inst.statusId) ? '' : 'clickable',
              getInstallmentStatusClass(inst.statusId),
            ]"
            :label="getInstallmentStatusLabel(inst.statusId)"
            dense
          >
            <QMenu
              v-if="!isInstallmentStatusLocked(inst.statusId)"
              auto-close
              cover
              anchor="bottom left"
              self="top left"
            >
              <QList min-width="120px">
                <QItem clickable @click="emit('updateInstallmentStatus', inst.id, 143)">
                  <QItemSection>پرداخت شده</QItemSection>
                </QItem>
                <QItem clickable @click="emit('updateInstallmentStatus', inst.id, 144)">
                  <QItemSection>در انتظار وصول</QItemSection>
                </QItem>
              </QList>
            </QMenu>
          </QChip>
          <!-- <QBtn
            v-if="!isInstallmentStatusLocked(inst.statusId)"
            flat
            round
            dense
            color="negative"
            class="q-mr-sm"
            @click.stop="emit('deleteInstallment', inst.id)"
          >
            <IconTrash :size="18" />
          </QBtn> -->
        </div>
      </div>
    </div>
  </QExpansionItem>
</template>

<script setup>
import { ref } from 'vue'
import { IconBeta, IconChevronDown, IconTrash, IconChevronUp } from '@tabler/icons-vue'
import { convertToJalali } from '@/utils/date-utils'
import { generatePriceFormat } from '@/utils/formatter'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['delete', 'updateInstallmentStatus', 'deleteInstallment'])

const expanded = ref(false)

const getStatusClass = (statusId) => {
  const map = {
    null: 'status--pending',
    143: 'status--paid',
    145: 'status--deleted',
  }
  return map[statusId] || 'status--pending'
}

const getInstallmentStatusClass = (statusId) => {
  const map = {
    null: 'status--pending',
    143: 'status--paid',
    145: 'status--deleted',
  }
  return map[statusId] || ''
}

const getInstallmentStatusLabel = (id) => {
  const map = { null: 'در انتظار وصول', 143: 'پرداخت شده', 145: 'حذف شد' }
  return map[id] || 'در انتظار وصول'
}

const isInstallmentStatusLocked = (statusId) => statusId === 143 || statusId === 146

const isObligationDeletable = props.item.status?.id !== 143 && props.item.status?.id !== 145
</script>

<style lang="scss" scoped>
.uol {
  &__accordion {
    background: #f8f9fa;
    border: 1px solid #f0f0f0;
    border-radius: 12px;
    margin-bottom: 12px;
    overflow: hidden;
  }

  &__obligation-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    gap: 6px;
  }

  &__obligation-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 200px;
  }

  &__brand-icon {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    border: 1px solid $default-disabled-border;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #616161;
    background-color: $white;
  }

  &__brand-info {
    text-align: right;
  }

  &__brand-amount {
    font-size: 16px;
    font-weight: 700;
    color: $dark;

    .unit {
      margin-right: 4px;
    }
  }

  &__brand-subtitle {
    font-size: 14px;
    color: $grey-8;
    margin-top: 1px;
    font-weight: 500;
  }

  &__obligation-meta-box {
    display: flex;
    background: $white;
    border-radius: 10px;
    padding: 5px 16px;
    gap: 24px;
    justify-content: space-between;
    align-items: center;
    width: 400px;
  }

  &__meta-col {
    display: flex;
    flex-direction: column;
    align-items: start;

    .label {
      font-size: 12px;
      color: $grey-8;
      font-weight: 600;
    }
    .value {
      font-size: 12px;
      font-weight: 500;
      color: $dark;
    }
  }

  &__obligation-side {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-direction: row-reverse;
  }

  &__status-chip {
    font-size: 12px;
    font-weight: 600;
    height: 28px;
    padding: 0 12px;

    &.status--pending {
      background: $blue-grey-light !important;
      color: $blue-grey-8 !important;
    }

    &.status--paid {
      background: $green-light !important;
      color: $green-6 !important;
    }

    &.status--deleted {
      background: $red-light !important;
      color: $red-6 !important;
    }
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__expand-arrow {
    color: #bdbdbd;
    cursor: pointer;
  }

  &__installment-list {
    padding: 0 16px 16px 16px;
    background: #fff;
    border-top: 1px solid #f5f5f5;
  }

  &__list-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #9e9e9e;
    padding: 12px 0;
  }

  &__inst-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border: 1px solid #f0f0f0;
    border-radius: 10px;
    margin-bottom: 8px;
    gap: 16px;
  }

  &__inst-detail {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__inst-index {
    width: 32px;
    height: 32px;
    background: #f5f5f5;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #757575;
    font-size: 13px;
  }

  &__inst-info {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    gap: 40px;
  }

  &__inst-status {
    .clickable {
      cursor: pointer;
      &:hover {
        opacity: 0.8;
      }
    }
  }
}

:deep(.q-expansion-item__toggle-icon) {
  display: none !important;
}
</style>
