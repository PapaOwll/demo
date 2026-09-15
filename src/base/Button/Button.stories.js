import Button from './index'
import { IconArrowRight, IconDeviceFloppy, IconTrash, IconUser } from '@tabler/icons-vue'

const colorOptions = ['primary', 'amber', 'red', 'green', 'blue-grey', 'dark']
const variantOptions = ['filled', 'outline', 'flat']
const sizeOptions = ['sm', 'md', 'lg', 'xl']
const targetOptions = ['_self', '_blank', '_parent', '_top']
const iconOptions = {
  none: undefined,
  IconUser,
  IconArrowRight,
  IconTrash,
  IconDeviceFloppy,
}

export default {
  title: 'Base/Button',
  component: Button,
  argTypes: {
    color: { control: 'select', options: colorOptions },
    variant: { control: 'select', options: variantOptions },
    size: { control: 'select', options: sizeOptions },
    text: { control: 'text', description: 'متن دکمه (از Typography استفاده می‌کند)' },
    leftIcon: {
      control: 'select',
      options: Object.keys(iconOptions),
      mapping: iconOptions,
      labels: {
        none: 'بدون آیکن',
        IconUser: 'IconUser',
        IconArrowRight: 'IconArrowRight',
        IconTrash: 'IconTrash',
        IconDeviceFloppy: 'IconDeviceFloppy',
      },
    },
    rightIcon: {
      control: 'select',
      options: Object.keys(iconOptions),
      mapping: iconOptions,
      labels: {
        none: 'بدون آیکن',
        IconUser: 'IconUser',
        IconArrowRight: 'IconArrowRight',
        IconTrash: 'IconTrash',
        IconDeviceFloppy: 'IconDeviceFloppy',
      },
    },
    to: { control: 'text' },
    href: { control: 'text' },
    target: { control: 'select', options: targetOptions },
    ariaLabel: { control: 'text' },
    isLink: { control: 'boolean' },
  },
  args: {
    variant: 'filled',
    size: 'md',
    color: 'primary',
    text: 'متن دکمه',
    isRounded: false,
    isLoading: false,
    isDisabled: false,
    isIconOnly: false,
    isFullWidth: false,
    isLink: false,
    to: '',
    href: '',
    target: '_self',
    ariaLabel: '',
  },
}

const Template = (args) => ({
  components: { Button },
  setup() {
    return { args }
  },
  template: '<Button v-bind="args" />',
})

export const Filled = Template.bind({})
Filled.args = {}

export const Outline = Template.bind({})
Outline.args = {
  variant: 'outline',
}

export const Flat = Template.bind({})
Flat.args = {
  variant: 'flat',
}

export const WithIcons = Template.bind({})
WithIcons.args = {
  leftIcon: IconUser,
  rightIcon: IconArrowRight,
  color: 'primary',
}

export const IconOnly = Template.bind({})
IconOnly.args = {
  isIconOnly: true,
  leftIcon: IconTrash,
  color: 'red',
  text: undefined,
}
IconOnly.parameters = {
  docs: {
    description: {
      story: 'دکمه‌های فقط آیکن عرض و ارتفاع ثابت دارند و padding آن‌ها صفر است.',
    },
  },
}

export const Loading = Template.bind({})
Loading.args = {
  isLoading: true,
}

export const Disabled = Template.bind({})
Disabled.args = {
  isDisabled: true,
}

export const Rounded = Template.bind({})
Rounded.args = {
  isRounded: true,
  leftIcon: IconDeviceFloppy,
  color: 'amber',
}

export const FullWidth = Template.bind({})
FullWidth.args = {
  isFullWidth: true,
  size: 'lg',
}

export const AsLink = Template.bind({})
AsLink.args = {
  isLink: true,
  href: 'https://example.com',
  target: '_blank',
  rightIcon: IconArrowRight,
  color: 'dark',
}

export const Sizes = (args) => ({
  components: { Button },
  setup() {
    return { args }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px; width: 320px;">
      <Button v-bind="args" size="sm" text="کوچک (sm)" />
      <Button v-bind="args" size="md" text="متوسط (md)" />
      <Button v-bind="args" size="lg" text="بزرگ (lg)" />
      <Button v-bind="args" size="xl" text="خیلی بزرگ (xl)" />
    </div>
  `,
})
Sizes.args = {
  color: 'green',
  isRounded: false,
  text: undefined,
}

export const IconOnlySizes = (args) => ({
  components: { Button },
  setup() {
    return { args, IconUser }
  },
  template: `
    <div style="display: flex; gap: 12px; align-items: center;">
      <Button v-bind="args" size="sm" :left-icon="IconUser" is-icon-only />
      <Button v-bind="args" size="md" :left-icon="IconUser" is-icon-only />
      <Button v-bind="args" size="lg" :left-icon="IconUser" is-icon-only />
      <Button v-bind="args" size="xl" :left-icon="IconUser" is-icon-only />
    </div>
  `,
})
IconOnlySizes.args = {
  color: 'primary',
  text: undefined,
}
IconOnlySizes.parameters = {
  docs: {
    description: {
      story:
        'سایز آیکون‌ها: sm=20, md=24, lg=28, xl=32. ابعاد دکمه: sm=32x32, md=40x40, lg=48x48, xl=56x56',
    },
  },
}

export const LoadingSizes = (args) => ({
  components: { Button },
  setup() {
    return { args }
  },
  template: `
    <div style="display: flex; gap: 12px; align-items: center;">
      <Button v-bind="args" size="sm" text="sm" is-loading />
      <Button v-bind="args" size="md" text="md" is-loading />
      <Button v-bind="args" size="lg" text="lg" is-loading />
      <Button v-bind="args" size="xl" text="xl" is-loading />
    </div>
  `,
})
LoadingSizes.args = {
  color: 'primary',
}
LoadingSizes.parameters = {
  docs: {
    description: {
      story: 'سایز اسپینر لودینگ: sm=20, md=24, lg=28, xl=32',
    },
  },
}

export const WithSlot = (args) => ({
  components: { Button },
  setup() {
    return { args }
  },
  template: '<Button v-bind="args">محتوای slot</Button>',
})
WithSlot.args = {
  color: 'primary',
  text: undefined,
}
WithSlot.parameters = {
  docs: {
    description: {
      story: 'اگر از slot استفاده شود (بدون prop text)، محتوا بدون Typography نمایش داده می‌شود.',
    },
  },
}
