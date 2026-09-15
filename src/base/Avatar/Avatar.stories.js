import Avatar from '@/base/Avatar'

export default {
  title: 'Base/Avatar',
  component: Avatar,
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'اندازه آواتار',
    },
    color: {
      control: 'select',
      options: ['light-blue', 'amber', 'red', 'green', 'blue-grey', 'dark'],
      description: 'رنگ پس‌زمینه آواتار',
    },
    rounded: { control: 'boolean' },
    type: {
      control: 'select',
      options: ['label', 'icon', 'image'],
    },
    label: { control: 'text' },
    src: { control: 'text' },
    isShowIcon: { control: 'boolean' },
  },
}

const Template = (args) => ({
  components: { Avatar },
  setup() {
    return { args }
  },
  template: `
    <Avatar v-bind="args"/>
  `,
})

export const Label = Template.bind({})
Label.args = {
  type: 'label',
  label: 'Ali',
  size: 'md',
  color: 'light-blue',
}

export const Icon = Template.bind({})
Icon.args = {
  type: 'icon',
  size: 'md',
  color: 'amber',
}

export const Image = Template.bind({})
Image.args = {
  type: 'image',
  src: 'https://i.pravatar.cc/100',
  size: 'md',
  color: 'light-blue',
}

export const Sizes = () => ({
  components: { Avatar },
  template: `
    <div style="display:flex; gap:12px; align-items:center;">
      <Avatar size="sm" label="A" color="light-blue"/>
      <Avatar size="md" label="A" color="amber"/>
      <Avatar size="lg" label="A" color="green"/>
      <Avatar size="xl" label="A" color="red"/>
    </div>
  `,
})

export const Colors = () => ({
  components: { Avatar },
  template: `
    <div style="display:flex; gap:12px; align-items:center;">
      <Avatar color="light-blue" label="A"/>
      <Avatar color="amber" label="A"/>
      <Avatar color="red" label="A"/>
      <Avatar color="green" label="A"/>
      <Avatar color="blue-grey" label="A"/>
      <Avatar color="dark" label="A"/>
    </div>
  `,
})

export const Rounded = () => ({
  components: { Avatar },
  template: `
    <div style="display:flex; gap:12px; align-items:center;">
      <Avatar :rounded="true" label="A"/>
      <Avatar :rounded="false" label="A"/>
    </div>
  `,
})
