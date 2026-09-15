import TabItem from './index'
import { ref } from 'vue'
import { IconBell, IconUser, IconSettings, IconMessageCircle, IconHome } from '@tabler/icons-vue'

export default {
  title: 'Base/TabItem',
  component: TabItem,
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    styleType: { control: 'select', options: ['default', 'underline'] },
    labelKey: { control: 'text' },
    value: { control: 'text' },
  },
  args: {
    size: 'md',
    orientation: 'horizontal',
    styleType: 'default',
    labelKey: 'label',
  },
}

export const GroupDefault = () => ({
  components: { TabItem },
  setup() {
    const active = ref('all')
    const tabs = [
      { label: 'همه', value: 'all' },
      { label: 'فعال', value: 'active', badge: '10' },
      { label: 'غیرفعال', value: 'inactive' },
    ]
    return { active, tabs }
  },
  template: `
    <TabItem
      v-model="active"
      style-type="default"
      :group="tabs"
    />
  `,
})

export const GroupUnderline = () => ({
  components: { TabItem },
  setup() {
    const active = ref('all')
    const tabs = [
      { label: 'همه', value: 'all' },
      { label: 'فعال', value: 'active', badge: '10' },
      { label: 'غیرفعال', value: 'inactive' },
    ]
    return { active, tabs }
  },
  template: `
    <TabItem
      v-model="active"
      style-type="underline"
      :group="tabs"
    />
  `,
})

export const GroupSmall = () => ({
  components: { TabItem },
  setup() {
    const active = ref('tab1')
    const tabs = [
      { label: 'روزانه', value: 'tab1' },
      { label: 'هفتگی', value: 'tab2' },
      { label: 'ماهانه', value: 'tab3', badge: '5' },
    ]
    return { active, tabs }
  },
  template: `
    <TabItem
      v-model="active"
      style-type="default"
      size="sm"
      :group="tabs"
    />
  `,
})

export const GroupWithIcons = () => ({
  components: { TabItem },
  setup() {
    const active = ref('home')
    const tabs = [
      { label: 'خانه', value: 'home', icon: IconHome },
      { label: 'کاربران', value: 'users', icon: IconUser },
      { label: 'اعلان‌ها', value: 'notifications', icon: IconBell, badge: '3' },
    ]
    return { active, tabs }
  },
  template: `
    <TabItem
      v-model="active"
      style-type="default"
      :group="tabs"
    />
  `,
})

export const GroupIconOnly = () => ({
  components: { TabItem },
  setup() {
    const active = ref('home')
    const tabs = [
      { value: 'home', icon: IconHome },
      { value: 'users', icon: IconUser },
      { value: 'notifications', icon: IconBell, badge: '3' },
      { value: 'settings', icon: IconSettings },
    ]
    return { active, tabs }
  },
  template: `
    <TabItem
      v-model="active"
      style-type="default"
      :group="tabs"
    />
  `,
})

export const GroupVertical = () => ({
  components: { TabItem },
  setup() {
    const active = ref('profile')
    const tabs = [
      { label: 'پروفایل', value: 'profile', icon: IconUser },
      { label: 'تنظیمات', value: 'settings', icon: IconSettings },
      { label: 'پیام‌ها', value: 'messages', icon: IconMessageCircle, badge: '5' },
    ]
    return { active, tabs }
  },
  template: `
    <TabItem
      v-model="active"
      style-type="default"
      orientation="vertical"
      :group="tabs"
    />
  `,
})

export const GroupVerticalUnderline = () => ({
  components: { TabItem },
  setup() {
    const active = ref('profile')
    const tabs = [
      { label: 'پروفایل', value: 'profile', icon: IconUser },
      { label: 'تنظیمات', value: 'settings', icon: IconSettings },
    ]
    return { active, tabs }
  },
  template: `
    <TabItem
      v-model="active"
      style-type="underline"
      orientation="vertical"
      :group="tabs"
    />
  `,
})

export const GroupCustomLabelKey = () => ({
  components: { TabItem },
  setup() {
    const active = ref('home')
    const tabs = [
      { name: 'خانه', value: 'home', icon: IconHome },
      { name: 'کاربران', value: 'users', icon: IconUser },
      { name: 'تنظیمات', value: 'settings', icon: IconSettings, badge: '2' },
    ]
    return { active, tabs }
  },
  template: `
    <TabItem
      v-model="active"
      style-type="default"
      label-key="name"
      :group="tabs"
    />
  `,
})

export const GroupWithTitleFallback = () => ({
  components: { TabItem },
  setup() {
    const active = ref(0)
    const tabs = [
      { index: 0, title: 'اطلاعات کلی' },
      { index: 1, title: 'فعالیت‌ها', badge: '5' },
      { index: 2, title: 'پرونده پزشکی' },
      { index: 3, title: 'طرح درمان' },
    ]
    return { active, tabs }
  },
  template: `
    <TabItem
      v-model="active"
      style-type="default"
      :group="tabs"
    />
  `,
})

export const GroupOverflow = () => ({
  components: { TabItem },
  setup() {
    const active = ref('tab1')
    const tabs = [
      { label: 'تب اول', value: 'tab1' },
      { label: 'تب دوم', value: 'tab2' },
      { label: 'تب سوم', value: 'tab3' },
      { label: 'تب چهارم', value: 'tab4' },
      { label: 'تب پنجم', value: 'tab5' },
      { label: 'تب ششم', value: 'tab6' },
      { label: 'تب هفتم', value: 'tab7' },
      { label: 'تب هشتم', value: 'tab8' },
    ]
    return { active, tabs }
  },
  template: `
    <div style="width: 400px; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
      <TabItem
        v-model="active"
        style-type="default"
        :group="tabs"
      />
    </div>
  `,
})

export const GroupWithCustomClass = () => ({
  components: { TabItem },
  setup() {
    const active = ref('all')
    const tabs = [
      { label: 'همه', value: 'all', class: 'q-px-lg' },
      { label: 'فعال', value: 'active', badge: '10' },
      { label: 'غیرفعال', value: 'inactive', class: 'text-red' },
    ]
    return { active, tabs }
  },
  template: `
    <TabItem
      v-model="active"
      style-type="default"
      :group="tabs"
    />
  `,
})

export const GroupLabelColor = () => ({
  components: { TabItem },
  setup() {
    const activeDefault = ref('all')
    const activeUnderline = ref('all')
    const tabs = [
      { label: 'همه', value: 'all' },
      { label: 'فعال', value: 'active' },
      { label: 'غیرفعال', value: 'inactive' },
    ]
    return { activeDefault, activeUnderline, tabs }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <TabItem v-model="activeDefault" style-type="default" :group="tabs" />
      <TabItem v-model="activeUnderline" style-type="underline" :group="tabs" />
    </div>
  `,
})
