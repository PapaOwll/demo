import { ref } from 'vue'
import Toggle from './index'

export default {
  title: 'Base/Toggle',
  component: Toggle,
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md'],
    },
  },
}

const Template = (args) => ({
  components: { Toggle },
  setup() {
    return { args }
  },
  template: '<Toggle v-bind="args" v-model="args.modelValue" />',
})

export const Default = Template.bind({})
Default.args = {
  modelValue: false,
  label: 'عنوان',
  description: 'توضیحات مورد نیاز',
  size: 'md',
  disabled: false,
  dense: false,
  flip: false,
}

export const Checked = Template.bind({})
Checked.args = {
  ...Default.args,
  modelValue: true,
}

export const Small = Template.bind({})
Small.args = {
  ...Default.args,
  size: 'sm',
}

export const Disabled = Template.bind({})
Disabled.args = {
  ...Default.args,
  disabled: true,
  modelValue: true,
}

export const FlipAndDense = Template.bind({})
FlipAndDense.args = {
  ...Default.args,
  flip: true,
  dense: true,
}

export const Sizes = () => ({
  components: { Toggle },
  setup() {
    const smValue = ref(true)
    const mdValue = ref(true)
    return { smValue, mdValue }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <span style="font-size: 12px; color: #888;">سایز sm — label 14px / description regular</span>
        <Toggle v-model="smValue" size="sm" label="اعلان‌ها" description="دریافت نوتیفیکیشن‌های اپلیکیشن" />
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <span style="font-size: 12px; color: #888;">سایز md — label 16px</span>
        <Toggle v-model="mdValue" size="md" label="اعلان‌ها" description="دریافت نوتیفیکیشن‌های اپلیکیشن" />
      </div>
    </div>
  `,
})
