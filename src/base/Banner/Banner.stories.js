import Banner from './index'
import { IconAlertCircle, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-vue'

const typeOptions = ['error', 'warning', 'neutral']
const sizeOptions = ['sm', 'md', 'lg', 'xl']
const iconOptions = {
  none: undefined,
  IconAlertCircle,
  IconAlertTriangle,
  IconInfoCircle,
}

export default {
  title: 'Base/Banner',
  component: Banner,
  argTypes: {
    type: { control: 'select', options: typeOptions },
    size: { control: 'select', options: sizeOptions },
    title: { control: 'text', description: 'عنوان بنر' },
    description: { control: 'text', description: 'توضیحات بنر' },
    actionLabel: { control: 'text', description: 'متن دکمه اکشن' },
    icon: {
      control: 'select',
      options: Object.keys(iconOptions),
      mapping: iconOptions,
      labels: {
        none: 'بدون آیکن',
        IconAlertCircle: 'IconAlertCircle',
        IconAlertTriangle: 'IconAlertTriangle',
        IconInfoCircle: 'IconInfoCircle',
      },
    },
    showClose: { control: 'boolean' },
  },
  args: {
    type: 'neutral',
    size: 'md',
    title: 'عنوان بنر',
    description: 'توضیحات مربوط به بنر در اینجا قرار می‌گیرد.',
    showClose: false,
    actionLabel: undefined,
  },
}

const Template = (args) => ({
  components: { Banner },
  setup() {
    return { args }
  },
  template: `
    <div>
      <Banner v-bind="args" />
    </div>
  `,
})

export const Error = Template.bind({})
Error.args = {
  type: 'error',
  title: 'خطا در ثبت اطلاعات',
  description: 'لطفاً اطلاعات را بررسی کرده و دوباره تلاش کنید.',
  icon: IconAlertCircle,
}

export const Warning = Template.bind({})
Warning.args = {
  type: 'warning',
  title: 'توجه',
  description: 'عملیات شما نیاز به تایید مدیریت دارد.',
  icon: IconAlertTriangle,
}

export const Neutral = Template.bind({})
Neutral.args = {
  type: 'neutral',
  title: 'اطلاع',
  description: 'سیستم در حال بروزرسانی است.',
  icon: IconInfoCircle,
}

export const WithAction = Template.bind({})
WithAction.args = {
  type: 'error',
  title: 'اعتبار شما منقضی شده است',
  description: 'برای ادامه استفاده از خدمات، اشتراک خود را تمدید کنید.',
  actionLabel: 'تمدید اشتراک',
  icon: IconAlertCircle,
}

export const WithClose = Template.bind({})
WithClose.args = {
  type: 'warning',
  title: 'هشدار امنیتی',
  description: 'رمز عبور شما بیش از ۹۰ روز تغییر نکرده است.',
  showClose: true,
  icon: IconAlertTriangle,
}

export const Sizes = (args) => ({
  components: { Banner },
  setup() {
    return { args }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
      <Banner v-bind="args" size="sm" title="کوچک (sm)" description="سایز کوچک بنر" />
      <Banner v-bind="args" size="md" title="متوسط (md)" description="سایز متوسط بنر" />
      <Banner v-bind="args" size="lg" title="بزرگ (lg)" description="سایز بزرگ بنر" />
      <Banner v-bind="args" size="xl" title="خیلی بزرگ (xl)" description="سایز خیلی بزرگ بنر" />
    </div>
  `,
})
Sizes.args = {
  type: 'neutral',
  icon: IconInfoCircle,
}

export const ErrorSizes = (args) => ({
  components: { Banner },
  setup() {
    return { args }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%">
      <Banner v-bind="args" size="sm" title="خطا (sm)" description="سایز کوچک" />
      <Banner v-bind="args" size="md" title="خطا (md)" description="سایز متوسط" />
      <Banner v-bind="args" size="lg" title="خطا (lg)" description="سایز بزرگ" />
      <Banner v-bind="args" size="xl" title="خطا (xl)" description="سایز خیلی بزرگ" />
    </div>
  `,
})
ErrorSizes.args = {
  type: 'error',
  icon: IconAlertCircle,
}

export const WarningSizes = (args) => ({
  components: { Banner },
  setup() {
    return { args }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%">
      <Banner v-bind="args" size="sm" title="هشدار (sm)" description="سایز کوچک" />
      <Banner v-bind="args" size="md" title="هشدار (md)" description="سایز متوسط" />
      <Banner v-bind="args" size="lg" title="هشدار (lg)" description="سایز بزرگ" />
      <Banner v-bind="args" size="xl" title="هشدار (xl)" description="سایز خیلی بزرگ" />
    </div>
  `,
})
WarningSizes.args = {
  type: 'warning',
  icon: IconAlertTriangle,
}

export const AllTypes = (args) => ({
  components: { Banner },
  setup() {
    return { args, IconAlertCircle, IconAlertTriangle, IconInfoCircle }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%">
      <Banner type="error" title="خطا" description="پیام خطا" :icon="IconAlertCircle" />
      <Banner type="warning" title="هشدار" description="پیام هشدار" :icon="IconAlertTriangle" />
      <Banner type="neutral" title="اطلاع" description="پیام اطلاع‌رسانی" :icon="IconInfoCircle" />
    </div>
  `,
})
AllTypes.args = {}

export const WithoutDescription = Template.bind({})
WithoutDescription.args = {
  type: 'warning',
  title: 'فقط عنوان بدون توضیحات',
  icon: IconAlertTriangle,
  description: undefined,
}
WithoutDescription.parameters = {
  docs: {
    description: {
      story: 'بنر بدون توضیحات - فقط عنوان نمایش داده می‌شود.',
    },
  },
}

export const WithoutIcon = Template.bind({})
WithoutIcon.args = {
  type: 'neutral',
  title: 'بنر بدون آیکن',
  description: 'این بنر آیکنی ندارد.',
  icon: undefined,
}
WithoutIcon.parameters = {
  docs: {
    description: {
      story: 'بنر بدون آیکن - فیلد icon خالی است.',
    },
  },
}
