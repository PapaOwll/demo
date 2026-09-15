import Chip from './index'
import { IconStar, IconCheck, IconUser, IconX } from '@tabler/icons-vue'

const colorOptions = ['light-blue', 'amber', 'red', 'green', 'blue-grey', 'dark']
const variantOptions = ['filled', 'outline']
const sizeOptions = ['sm', 'md', 'lg']

const iconOptions = {
  none: undefined,
  IconStar,
  IconCheck,
  IconUser,
  IconX,
}

const iconSelect = {
  control: 'select',
  options: Object.keys(iconOptions),
  mapping: iconOptions,
}

export default {
  title: 'Base/Chip',
  component: Chip,
  argTypes: {
    color: { control: 'select', options: colorOptions },
    variant: { control: 'select', options: variantOptions },
    size: { control: 'select', options: sizeOptions },
    text: { control: 'text', description: 'عنوان (از Typography استفاده می‌کند)' },
    leftIcon: iconSelect,
    rightIcon: iconSelect,
    isDisabled: { control: 'boolean' },
    isRounded: { control: 'boolean' },
    removable: { control: 'boolean' },
    avatar: { control: 'boolean', description: 'نمایش آواتار (IconUser)' },
  },
  args: {
    variant: 'filled',
    size: 'md',
    color: 'light-blue',
    text: 'عنوان',
    isDisabled: false,
    isRounded: false,
    removable: true,
    leftIcon: undefined,
    rightIcon: undefined,
    avatar: false,
  },
}

const Template = (args) => ({
  components: { Chip },
  setup() {
    return { args }
  },
  template: '<Chip v-bind="args" :avatar="args.avatar ? {} : undefined" />',
})

export const Filled = Template.bind({})
Filled.args = {}

export const Outline = Template.bind({})
Outline.args = {
  variant: 'outline',
}

export const Disabled = Template.bind({})
Disabled.args = {
  isDisabled: true,
}
Disabled.parameters = {
  docs: {
    description: {
      story: 'در حالت غیرفعال opacity چپ ۶۰٪ و cursor روی rightIcon برابر not-allowed است.',
    },
  },
}

export const Rounded = Template.bind({})
Rounded.args = {
  isRounded: true,
  color: 'amber',
}

export const NotRemovable = Template.bind({})
NotRemovable.args = {
  removable: false,
  leftIcon: IconStar,
  color: 'green',
}
NotRemovable.parameters = {
  docs: {
    description: {
      story:
        'وقتی removable=false باشد و rightIcon مشخص شود، آیکن X حذف شده و آیکن سفارشی نمایش داده می‌شود.',
    },
  },
}

export const Sizes = (args) => ({
  components: { Chip },
  setup() {
    return { args }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <Chip v-bind="args" size="sm" text="کوچک (sm)" />
      <Chip v-bind="args" size="md" text="متوسط (md)" />
      <Chip v-bind="args" size="lg" text="بزرگ (lg)" />
    </div>
  `,
})
Sizes.args = {
  color: 'green',
  isRounded: false,
  text: undefined,
}

export const Colors = (args) => ({
  components: { Chip },
  setup() {
    return { args }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <Chip v-bind="args" color="light-blue" text="عنوان" />
      <Chip v-bind="args" color="amber" text="عنوان" />
      <Chip v-bind="args" color="red" text="عنوان" />
      <Chip v-bind="args" color="green" text="عنوان" />
      <Chip v-bind="args" color="blue-grey" text=" عنوان" />
      <Chip v-bind="args" color="dark" text="عنوان" />
    </div>
  `,
})
Colors.args = {
  variant: 'filled',
  text: undefined,
}

export const OutlineColors = (args) => ({
  components: { Chip },
  setup() {
    return { args }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <Chip v-bind="args" color="light-blue" text="عنوان" />
      <Chip v-bind="args" color="amber" text="عنوان" />
      <Chip v-bind="args" color="red" text="عنوان" />
      <Chip v-bind="args" color="green" text="عنوان" />
      <Chip v-bind="args" color="blue-grey" text="عنوان" />
      <Chip v-bind="args" color="dark" text="عنوان" />
    </div>
  `,
})
OutlineColors.args = {
  variant: 'outline',
  text: undefined,
}

export const Avatar = Template.bind({})
Avatar.args = {
  avatar: true,
  color: 'green',
  variant: 'outline',
}
Avatar.parameters = {
  docs: {
    description: {
      story: 'با avatar بدون src، آیکن IconUser نمایش داده می‌شود.',
    },
  },
}

export const AvatarSizes = (args) => ({
  components: { Chip },
  setup() {
    const props = { ...args, avatar: {} }
    return { props }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <Chip v-bind="props" size="sm" text="کوچک (sm)" />
      <Chip v-bind="props" size="md" text="متوسط (md)" />
      <Chip v-bind="props" size="lg" text="بزرگ (lg)" />
    </div>
  `,
})
AvatarSizes.args = {
  avatar: true,
  color: 'light-blue',
  variant: 'outline',
  text: undefined,
}
AvatarSizes.parameters = {
  docs: {
    description: {
      story:
        'سایزهای آواتار: sm=28, md=32, lg=40. در حالت آواتار متن و آیکن سمت راست همیشه dark-6 و حاشیه gray-200 هستند.',
    },
  },
}

export const AvatarColors = (args) => ({
  components: { Chip },
  setup() {
    const props = { ...args, avatar: {} }
    return { props }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <Chip v-bind="props" color="light-blue" text="عنوان" />
      <Chip v-bind="props" color="amber" text="عنوان" />
      <Chip v-bind="props" color="red" text="عنوان" />
      <Chip v-bind="props" color="green" text="عنوان" />
      <Chip v-bind="props" color="blue-grey" text="عنوان" />
      <Chip v-bind="props" color="dark" text="عنوان" />
    </div>
  `,
})
AvatarColors.args = {
  avatar: {},
  variant: 'outline',
  text: undefined,
}
AvatarColors.parameters = {
  docs: {
    description: {
      story:
        'در حالت آواتار، پس‌زمینه و رنگ آیکون آواتار بر اساس color تغییر می‌کند اما متن و border ثابت (dark-6 و gray-200) هستند.',
    },
  },
}

export const Playround = Template.bind({})
Playround.args = {}
