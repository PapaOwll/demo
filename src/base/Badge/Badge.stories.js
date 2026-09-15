import Badge from './index'
import { QUASAR_COLORS } from '@/constants/colors'
import { IconCheck, IconX, IconStar, IconAlertCircle } from '@tabler/icons-vue'

const colorOptions = QUASAR_COLORS
const variantOptions = ['filled', 'light', 'outline']
const iconOptions = {
  none: undefined,
  IconCheck,
  IconX,
  IconStar,
  IconAlertCircle,
}

export default {
  title: 'Base/Badge',
  component: Badge,
  argTypes: {
    color: { control: 'select', options: colorOptions },
    variant: { control: 'select', options: variantOptions },
    label: { control: 'text', description: 'متن بج' },
    leftIcon: {
      control: 'select',
      options: Object.keys(iconOptions),
      mapping: iconOptions,
      labels: {
        none: 'بدون آیکن',
        IconCheck: 'IconCheck',
        IconX: 'IconX',
        IconStar: 'IconStar',
        IconAlertCircle: 'IconAlertCircle',
      },
    },
    rightIcon: {
      control: 'select',
      options: Object.keys(iconOptions),
      mapping: iconOptions,
      labels: {
        none: 'بدون آیکن',
        IconCheck: 'IconCheck',
        IconX: 'IconX',
        IconStar: 'IconStar',
        IconAlertCircle: 'IconAlertCircle',
      },
    },
    isRounded: { control: 'boolean' },
    isDot: { control: 'boolean' },
    floating: { control: 'boolean' },
  },
  args: {
    variant: 'filled',
    color: 'green',
    label: 'متن بج',
    isRounded: false,
    isDot: false,
    floating: false,
  },
}

const Template = (args) => ({
  components: { Badge },
  setup() {
    return { args }
  },
  template: '<Badge v-bind="args" />',
})

export const Filled = Template.bind({})
Filled.args = {}

export const Light = Template.bind({})
Light.args = {
  variant: 'light',
}

export const Outline = Template.bind({})
Outline.args = {
  variant: 'outline',
}

export const WithIcons = Template.bind({})
WithIcons.args = {
  leftIcon: IconCheck,
  rightIcon: IconStar,
  color: 'green',
}

export const Rounded = Template.bind({})
Rounded.args = {
  isRounded: true,
  color: 'purple',
}

export const Dot = Template.bind({})
Dot.args = {
  isDot: true,
  label: undefined,
  color: 'green',
}
Dot.parameters = {
  docs: {
    description: {
      story: 'نقطه وضعیت (Status Dot) - نمایش نقطه‌ای کوچک بدون متن با ابعاد ۸×۸ پیکسل.',
    },
  },
}

export const DotColors = (args) => ({
  components: { Badge },
  setup() {
    return { args }
  },
  template: `
    <div style="display: flex; gap: 12px; align-items: center;">
      <Badge v-bind="args" is-dot color="green" :label="undefined" />
      <Badge v-bind="args" is-dot color="amber" :label="undefined" />
      <Badge v-bind="args" is-dot color="red" :label="undefined" />
      <Badge v-bind="args" is-dot color="grey" :label="undefined" />
      <Badge v-bind="args" is-dot color="light-blue" :label="undefined" />
    </div>
  `,
})
DotColors.args = {}
DotColors.parameters = {
  docs: {
    description: {
      story: 'نقاط وضعیت در رنگ‌های مختلف - مناسب برای نمایش آنلاین/آفلاین/فعال/غیرفعال.',
    },
  },
}

export const StatusExamples = (args) => ({
  components: { Badge },
  setup() {
    return { args, IconCheck, IconX, IconAlertCircle }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; gap: 8px; align-items: center;">
        <Badge v-bind="args" color="green" :left-icon="IconCheck" label="فعال" />
        <Badge v-bind="args" color="green" variant="light" label="موفق" />
        <Badge v-bind="args" color="green" variant="outline" label="تایید شده" />
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <Badge v-bind="args" color="red" :left-icon="IconX" label="غیرفعال" />
        <Badge v-bind="args" color="red" variant="light" label="خطا" />
        <Badge v-bind="args" color="red" variant="outline" label="رد شده" />
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <Badge v-bind="args" color="amber" :left-icon="IconAlertCircle" label="هشدار" />
        <Badge v-bind="args" color="amber" variant="light" label="در انتظار" />
        <Badge v-bind="args" color="amber" variant="outline" label="نیاز به بررسی" />
      </div>
    </div>
  `,
})
StatusExamples.args = {}

export const RoundedVariants = (args) => ({
  components: { Badge },
  setup() {
    return { args }
  },
  template: `
    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
      <Badge v-bind="args" is-rounded variant="filled" label="Filled" />
      <Badge v-bind="args" is-rounded variant="light" label="Light" />
      <Badge v-bind="args" is-rounded variant="outline" label="Outline" />
    </div>
  `,
})
RoundedVariants.args = {
  color: 'blue',
}

export const ColorPalette = (args) => ({
  components: { Badge },
  setup() {
    const colors = ['red', 'green', 'amber', 'blue', 'purple', 'orange', 'teal', 'grey']
    return { args, colors }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <Badge v-for="color in colors" :key="'f-' + color" v-bind="args" variant="filled" :color="color" :label="color" />
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <Badge v-for="color in colors" :key="'l-' + color" v-bind="args" variant="light" :color="color" :label="color" />
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <Badge v-for="color in colors" :key="'o-' + color" v-bind="args" variant="outline" :color="color" :label="color" />
      </div>
    </div>
  `,
})
ColorPalette.args = {}

export const WithSlot = (args) => ({
  components: { Badge },
  setup() {
    return { args }
  },
  template: '<Badge v-bind="args" :label="undefined">محتوای slot</Badge>',
})
WithSlot.args = {
  color: 'purple',
}
WithSlot.parameters = {
  docs: {
    description: {
      story: 'اگر از slot استفاده شود (بدون prop label)، محتوا بدون Typography نمایش داده می‌شود.',
    },
  },
}

export const Floating = (args) => ({
  components: { Badge },
  setup() {
    return { args }
  },
  template: `
    <div style="display: flex; gap: 24px; align-items: center;">
      <div style="position: relative; display: inline-flex;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: #e0e0e0;" />
        <Badge v-bind="args" floating color="red" label="3" />
      </div>
      <div style="position: relative; display: inline-flex;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: #e0e0e0;" />
        <Badge v-bind="args" floating color="green" label="12" />
      </div>
      <div style="position: relative; display: inline-flex;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: #e0e0e0;" />
        <Badge v-bind="args" floating color="amber" label="99+" />
      </div>
      <div style="position: relative; display: inline-flex;">
        <div style="padding: 12px 24px; background: #e0e0e0; border-radius: 8px;">دکمه</div>
        <Badge v-bind="args" floating color="light-blue" label="5" />
      </div>
    </div>
  `,
})
Floating.args = {}
Floating.parameters = {
  docs: {
    description: {
      story: 'حالت شناور (Floating) - بج به صورت absolute روی عنصر والد قرار می‌گیرد.',
    },
  },
}

export const FloatingVariants = (args) => ({
  components: { Badge },
  setup() {
    return { args }
  },
  template: `
    <div style="display: flex; gap: 24px; align-items: center;">
      <div style="position: relative; display: inline-flex;">
        <div style="padding: 12px 24px; background: #e0e0e0; border-radius: 8px;">Filled</div>
        <Badge v-bind="args" floating variant="filled" color="red" label="Badge" />
      </div>
      <div style="position: relative; display: inline-flex;">
        <div style="padding: 12px 24px; background: #e0e0e0; border-radius: 8px;">Light</div>
        <Badge v-bind="args" floating variant="light" color="red" label="Badge" />
      </div>
      <div style="position: relative; display: inline-flex;">
        <div style="padding: 12px 24px; background: #e0e0e0; border-radius: 8px;">Outline</div>
        <Badge v-bind="args" floating variant="outline" color="red" label="Badge" />
      </div>
    </div>
  `,
})
FloatingVariants.args = {}
