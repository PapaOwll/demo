<template>
  <div class="row">
    <div class="col-12">
      <div class="row column items-center q-gutter-md q-my-lg">
        <span class="text-positive"><IconRosetteDiscountCheck size="96" /></span>
        <span>عملیات با موفقیت انجام شد</span>
        <QBtn outline color="primary" @click="router.go()">بازگشت به افزودن گروهی کاربران</QBtn>
      </div>
    </div>
  </div>
  <div class="row">
    <div class="col-12">
      <QTabs v-model="activeName" active-color="primary" indicator-color="primary" align="justify">
        <QTab name="success" label="موفق" />
        <QTab name="duplicates" label="تکراری" />
        <QTab name="fails" label="ناموفق" />
      </QTabs>
      <QTabPanels v-model="activeName" animated>
        <QTabPanel name="success">
          <QTable
            title="شماره های موفق"
            class="quasar-table"
            :rows="items"
            :columns="columns"
            row-key="name"
          />
        </QTabPanel>
        <QTabPanel name="duplicates">
          <QTable
            title="شماره های تکراری"
            class="quasar-table"
            flat
            :rows="items"
            :columns="columns"
            row-key="name"
          />
        </QTabPanel>
        <QTabPanel name="fails">
          <QTable
            title="شماره های ناموفق"
            class="quasar-table"
            :rows="items"
            :columns="columns"
            row-key="name"
          />
        </QTabPanel>
      </QTabPanels>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconRosetteDiscountCheck } from '@tabler/icons-vue'

const props = defineProps(['result', 'defectives'])
const router = useRouter()
const activeName = ref('success')
const items = computed(() => props.result[activeName.value]?.items || [])
const columns = [
  { name: 'mobile', label: 'موبایل', field: 'mobile' },
  { name: 'firstName', label: 'نام', field: 'firstName' },
  { name: 'lastName', label: 'نام خانوادگی', field: 'lastName' },
  { name: 'province', label: 'استان', field: 'province' },
  { name: 'city', label: 'شهر', field: 'city' },
]
</script>
